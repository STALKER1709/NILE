import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import type {
  PaymentProvider,
  ContexteInitiation,
  ContexteNotification,
  DemarragePaiement,
  VerificationNotification,
} from "@/modules/paiement/PaymentProvider";
import {
  normaliserOperateur,
  normaliserNumeroHrSkills,
  mapperStatutHrSkills,
  verifierSignatureHrSkills,
  lireWebhookHrSkills,
  racineHrSkills,
  estCleDeTest,
} from "@/modules/paiement/hrskills/hrskills-core";

/**
 * Fournisseur HR-Skills Pay (Cash-In Mobile Money — MTN, Orange).
 *
 * Implémenté d'après la documentation « HR-Skills Pay API v1 » fournie :
 *   - Authentification à double clé : la Clé A voyage dans `Authorization:
 *     Bearer`, la Clé B est échangée une fois contre un token de transaction
 *     (JWT, TTL 2700 s) réclamé par l'en-tête `X-Transaction-Token`.
 *   - Encaissement : POST /api/v1/payin/mobile-money -> 202 PENDING + une
 *     référence « ref_… ». Le client valide ensuite sur son téléphone.
 *   - Statut : GET /v1/payments/:reference (SUCCESS · FAILED · PENDING ·
 *     HOLD · REFUNDED).
 *   - Webhooks signés en HMAC-SHA256 sur le corps brut.
 *
 * Les chemins mélangent volontairement `/v1/…` et `/api/v1/…` : c'est ainsi
 * que la documentation les publie, on les reproduit tels quels.
 *
 * ⚠️ JAMAIS exécuté contre le vrai service depuis cet environnement (ni accès
 * réseau à api.hrskills-pay.com, ni identifiants). À éprouver en sandbox —
 * clés `hrsk_*_test_*`, où un montant PAIR aboutit à SUCCESS et un montant
 * IMPAIR à FAILED — avant tout passage en production.
 */

interface TokenEnCache {
  valeur: string;
  /** Instant (ms) à partir duquel on renouvelle, marge de sécurité incluse. */
  expireA: number;
}

/** Marge avant expiration réelle : évite d'utiliser un token qui meurt en vol. */
const MARGE_RENOUVELLEMENT_MS = 5 * 60 * 1000;

export class HrSkillsPayProvider implements PaymentProvider {
  private token: TokenEnCache | null = null;
  /** Sérialise les demandes concurrentes pour ne pas tirer 10 tokens d'un coup. */
  private tokenEnCours: Promise<string> | null = null;

  private cleA(): string {
    if (!env.HRSKILLS_CLE_A) throw new Error("HRSKILLS_CLE_A manquant.");
    return env.HRSKILLS_CLE_A;
  }
  private cleB(): string {
    if (!env.HRSKILLS_CLE_B) throw new Error("HRSKILLS_CLE_B manquant.");
    return env.HRSKILLS_CLE_B;
  }
  /** Racine des appels d'authentification (jamais préfixée, voir core). */
  private base(): string {
    return env.HRSKILLS_BASE_URL.replace(/\/+$/, "");
  }

  /** Racine des appels qui consomment le token : `/sandbox` en test. */
  private racine(): string {
    return racineHrSkills(env.HRSKILLS_BASE_URL, this.cleA());
  }

  /** Token de transaction, renouvelé seulement quand il approche de sa fin. */
  private async transactionToken(): Promise<string> {
    const maintenant = Date.now();
    if (this.token && this.token.expireA > maintenant) return this.token.valeur;
    if (this.tokenEnCours) return this.tokenEnCours;

    this.tokenEnCours = (async () => {
      const reponse = await fetch(`${this.base()}/v1/auth/transaction-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cleA()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_secret: this.cleB() }),
      });
      const texte = await reponse.text();
      if (!reponse.ok) {
        throw new Error(
          `HR-Skills auth: HTTP ${reponse.status} · ${texte.slice(0, 200)}`,
        );
      }
      let data: { transaction_token?: string; expires_in?: number };
      try {
        data = JSON.parse(texte) as typeof data;
      } catch {
        throw new Error(`HR-Skills auth: réponse non-JSON · ${texte.slice(0, 200)}`);
      }
      if (!data.transaction_token) {
        throw new Error(`HR-Skills auth: token absent · ${texte.slice(0, 200)}`);
      }
      // `expires_in` est en secondes (2700 d'après la doc).
      const dureeMs = (data.expires_in ?? 2700) * 1000;
      this.token = {
        valeur: data.transaction_token,
        expireA: Date.now() + Math.max(dureeMs - MARGE_RENOUVELLEMENT_MS, 60_000),
      };
      return data.transaction_token;
    })();

    try {
      return await this.tokenEnCours;
    } finally {
      this.tokenEnCours = null;
    }
  }

  private async enTetes(avecIdempotence: boolean): Promise<HeadersInit> {
    const entetes: Record<string, string> = {
      Authorization: `Bearer ${this.cleA()}`,
      "X-Transaction-Token": await this.transactionToken(),
      "Content-Type": "application/json",
    };
    // Obligatoire sur les POST d'après la doc : protège d'un double débit si
    // la requête est rejouée (timeout réseau, nouvelle tentative).
    if (avecIdempotence) entetes["Idempotency-Key"] = randomUUID();
    return entetes;
  }

  /**
   * Poste la demande d'encaissement.
   *
   * En PRODUCTION : un seul chemin, celui de la documentation. Rien n'est
   * exploré à l'aveugle sur de l'argent réel.
   *
   * En SANDBOX : la documentation publie le Cash-In sous `/api/v1/payin/…`,
   * mais le refus renvoyé par l'API parle d'un espace `/sandbox/v1/…`. Les
   * deux formes sont donc essayées, et UNIQUEMENT sur un 404 — c'est-à-dire
   * quand la route n'existe pas et qu'aucune transaction n'a pu être créée.
   * Le chemin retenu est journalisé : dès qu'il est confirmé, cette liste
   * doit être réduite à la seule bonne valeur.
   */
  private async appelerPayin(
    entetes: HeadersInit,
    corps: string,
  ): Promise<{ reponse: Response; texte: string; chemin: string }> {
    const racine = this.racine();
    const chemins = estCleDeTest(this.cleA())
      ? [`${racine}/api/v1/payin/mobile-money`, `${racine}/v1/payin/mobile-money`]
      : [`${racine}/api/v1/payin/mobile-money`];

    let dernier: { reponse: Response; texte: string; chemin: string } | null = null;
    for (const chemin of chemins) {
      const reponse = await fetch(chemin, { method: "POST", headers: entetes, body: corps });
      const texte = await reponse.text();
      dernier = { reponse, texte, chemin };
      if (reponse.status !== 404) {
        if (chemins.length > 1) console.info("[hrskills] chemin payin retenu:", chemin);
        return dernier;
      }
      console.warn("[hrskills] chemin payin absent (404):", chemin);
    }
    // `dernier` est forcément renseigné : la liste n'est jamais vide.
    return dernier as { reponse: Response; texte: string; chemin: string };
  }

  async initier(ctx: ContexteInitiation): Promise<DemarragePaiement> {
    const operateur = normaliserOperateur(ctx.operateur ?? "");
    if (!operateur) {
      throw new Error("Opérateur Mobile Money requis pour HR-Skills Pay.");
    }
    const numero = normaliserNumeroHrSkills(ctx.telephone);
    if (!numero) {
      throw new Error(`Numéro de téléphone inexploitable : ${ctx.telephone}`);
    }

    const corps = JSON.stringify({
      operator: operateur,
      country: "CM",
      phone_number: numero,
      amount: ctx.montant,
      currency: "XAF",
      description: `Commande ${ctx.numeroCommande} · NILE`,
      // Renvoyé tel quel dans le webhook : permet de retrouver NOTRE
      // paiement même si la correspondance par référence échouait.
      metadata: { reference_interne: ctx.reference, commande: ctx.numeroCommande },
    });
    // Une seule clé d'idempotence pour toutes les tentatives ci-dessous : si
    // l'une d'elles aboutissait malgré une réponse perdue, la suivante serait
    // reconnue comme un rejeu et non comme un second débit.
    const entetes = await this.enTetes(true);

    const { reponse, texte, chemin } = await this.appelerPayin(entetes, corps);
    if (!reponse.ok) {
      throw new Error(
        `HR-Skills payin: HTTP ${reponse.status} · ${chemin} · ${texte.slice(0, 300)}`,
      );
    }
    let data: { data?: { reference?: string; status?: string } };
    try {
      data = JSON.parse(texte) as typeof data;
    } catch {
      throw new Error(`HR-Skills payin: réponse non-JSON · ${texte.slice(0, 200)}`);
    }
    const referenceFournisseur = data.data?.reference;
    if (!referenceFournisseur) {
      throw new Error(`HR-Skills payin: référence absente · ${texte.slice(0, 300)}`);
    }

    return {
      reference: ctx.reference,
      // Aucune redirection : le client valide sur son téléphone (USSD/push).
      urlPaiement: null,
      referenceFournisseur,
    };
  }

  /** Statut faisant foi, lu directement chez le fournisseur. */
  async lireStatut(
    referenceFournisseur: string,
  ): Promise<{ ok: true; statut: string } | { ok: false }> {
    try {
      const reponse = await fetch(
        `${this.racine()}/v1/payments/${encodeURIComponent(referenceFournisseur)}`,
        { method: "GET", headers: await this.enTetes(false), cache: "no-store" },
      );
      const texte = await reponse.text();
      if (!reponse.ok) {
        console.error("[hrskills] lecture de statut:", reponse.status, texte.slice(0, 200));
        return { ok: false };
      }
      const data = JSON.parse(texte) as { data?: { status?: string }; status?: string };
      const statut = data.data?.status ?? data.status;
      return statut ? { ok: true, statut } : { ok: false };
    } catch (erreur) {
      console.error("[hrskills] lecture de statut échouée:", erreur);
      return { ok: false };
    }
  }

  async verifierNotification(
    _corps: Record<string, string>,
    contexte?: ContexteNotification,
  ): Promise<VerificationNotification> {
    if (!contexte) return { ok: false, raison: "DONNEES_MANQUANTES" };
    if (!env.HRSKILLS_WEBHOOK_SECRET) {
      console.error("[hrskills] HRSKILLS_WEBHOOK_SECRET absent : webhook rejeté.");
      return { ok: false, raison: "SIGNATURE_INVALIDE" };
    }

    // 1) Authenticité : HMAC sur le corps BRUT. La doc nomme l'en-tête
    // « X-Hub-Signature » ; on accepte aussi la variante « -256 », très
    // répandue, faute d'échantillon de requête réelle dans la documentation.
    const signatures = [
      contexte.entetes.get("x-hub-signature"),
      contexte.entetes.get("x-hub-signature-256"),
    ];
    if (
      !verifierSignatureHrSkills(
        env.HRSKILLS_WEBHOOK_SECRET,
        contexte.brut,
        signatures,
      )
    ) {
      return { ok: false, raison: "SIGNATURE_INVALIDE" };
    }

    // 2) Contenu : structure non documentée, lecture tolérante.
    let charge: unknown;
    try {
      charge = JSON.parse(contexte.brut);
    } catch {
      return { ok: false, raison: "DONNEES_MANQUANTES" };
    }
    const lu = lireWebhookHrSkills(charge);
    if (!lu) return { ok: false, raison: "DONNEES_MANQUANTES" };

    // 3) Statut : jamais celui annoncé dans le webhook. On le redemande à
    // l'API, seule source de vérité — un corps signé prouve l'origine, pas
    // l'état courant de la transaction.
    const statut = await this.lireStatut(lu.reference);
    if (!statut.ok) return { ok: false, raison: "ERREUR" };

    const mappe = mapperStatutHrSkills(statut.statut);
    // PENDING ou HOLD : rien de définitif, on ne touche pas à la commande.
    if (!mappe) return { ok: false, raison: "NON_DEFINITIF" };

    // Notre référence : par `metadata` si elle nous revient, sinon la
    // référence fournisseur, que l'appelant résoudra via Paiement.reference.
    return {
      ok: true,
      data: {
        reference: lu.referenceInterne ?? lu.reference,
        statut: mappe,
      },
    };
  }
}
