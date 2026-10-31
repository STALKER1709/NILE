import { env } from "@/lib/env";
import type {
  PaymentProvider,
  ContexteInitiation,
  ContexteNotification,
  DemarragePaiement,
  VerificationNotification,
} from "@/modules/paiement/PaymentProvider";
import type { StatutPaiementNotifie } from "@/modules/paiement/notification-core";
import {
  normaliserOperateur,
  normaliserNumeroHrSkills,
  mapperStatutHrSkills,
  verifierSignatureHrSkills,
  lireWebhookHrSkills,
  structureJson,
  racineHrSkills,
  cleIdempotence,
} from "@/modules/paiement/hrskills/hrskills-core";

/**
 * Fournisseur HR-Skills Pay (Cash-In Mobile Money — MTN, Orange).
 *
 * Implémenté d'après la documentation « HR-Skills Pay API v1 » fournie :
 *   - Authentification à double clé : la Clé A autorise l'échange du jeton ;
 *     la Clé B est le Bearer des appels métier, avec le transaction token.
 *   - Encaissement : POST /api/v1/payin/mobile-money -> référence et statut PENDING.
 *   - Statut : GET /v1/transactions/:reference.
 *   - Webhooks signés en HMAC-SHA256 sur le corps brut.
 *
 * Les chemins, champs et en-têtes suivent la documentation API v1 fournie.
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
  /** Racine API adaptée à la clé : production ou /sandbox pour les clés TEST. */
  private base(): string {
    return racineHrSkills(env.HRSKILLS_BASE_URL, this.cleA());
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

  /**
   * En-têtes communs à tous les appels.
   *
   * `cleIdem` n'est renseignée que sur les POST, où la doc rend
   * `Idempotency-Key` obligatoire. Elle doit être la MÊME à chaque tentative
   * portant sur un même paiement : c'est ce qui empêche l'API de créer un
   * second encaissement quand une réponse s'est perdue en route (la doc le
   * confirme sur le 502 `provider_request_failed` : « retry safe avec
   * Idempotency-Key »).
   */
  private async enTetes(cleIdem: string | null): Promise<HeadersInit> {
    const entetes: Record<string, string> = {
      // Contrat du SDK HR-Skills Pay : la Clé B authentifie les appels métier.
      // La Clé A n'est utilisée que pour obtenir le transaction token.
      Authorization: `Bearer ${this.cleB()}`,
      "X-Transaction-Token": await this.transactionToken(),
      "Content-Type": "application/json",
    };
    if (cleIdem) entetes["Idempotency-Key"] = cleIdem;
    return entetes;
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

    const champs = {
      phone_number: numero,
      operator: operateur.toUpperCase(),
      country: "CM",
      amount: ctx.montant,
      currency: "XAF",
      description: `Commande ${ctx.numeroCommande} · NILE`,
      metadata: { reference_interne: ctx.reference, commande: ctx.numeroCommande },
    };
    // Endpoint Cash-In documenté (les anciennes routes /v1/cashin sont dépréciées).
    const chemin = `${this.racine()}/api/v1/payin/mobile-money`;

    // Clé d'idempotence dérivée du paiement, donc identique d'un passage à
    // l'autre dans cette méthode (relance du paiement par l'acheteur).
    const entetes = await this.enTetes(cleIdempotence(ctx.reference));

    const reponse = await fetch(chemin, {
      method: "POST",
      headers: entetes,
      body: JSON.stringify(champs),
    });
    const texte = await reponse.text();
    if (!reponse.ok) {
      throw new Error(
        `HR-Skills payin: HTTP ${reponse.status} · ${chemin} · ${texte.slice(0, 300)}`,
      );
    }
    let data: { reference?: string; status?: string; data?: { reference?: string; status?: string } };
    try {
      data = JSON.parse(texte) as typeof data;
    } catch {
      throw new Error(`HR-Skills payin: réponse non-JSON · ${texte.slice(0, 200)}`);
    }
    const referenceFournisseur = data.reference ?? data.data?.reference;
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

  /**
   * Statut définitif du paiement chez le fournisseur, ou `null`.
   *
   * `null` couvre trois cas qu'il ne faut surtout pas distinguer côté
   * appelant : statut illisible, `PENDING`, et `HOLD` (revue anti-blanchiment).
   * Dans aucun des trois on ne peut conclure — libérer une commande sur un
   * `HOLD` reviendrait à livrer un paiement qui peut encore être refusé.
   */
  async consulterStatut(
    referenceFournisseur: string,
  ): Promise<StatutPaiementNotifie | null> {
    const lu = await this.lireStatut(referenceFournisseur);
    if (!lu.ok) return null;
    return mapperStatutHrSkills(lu.statut);
  }

  /** Statut brut, lu directement chez le fournisseur. */
  async lireStatut(
    referenceFournisseur: string,
  ): Promise<{ ok: true; statut: string } | { ok: false }> {
    try {
      const reponse = await fetch(
        `${this.racine()}/v1/transactions/${encodeURIComponent(referenceFournisseur)}`,
        { method: "GET", headers: await this.enTetes(null), cache: "no-store" },
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

  /** Statut Cash-Out : l'API documente GET /v1/payments/:reference avec la Clé A. */
  async lireStatutDecaissement(referenceFournisseur: string): Promise<{ ok: true; statut: string } | { ok: false }> {
    try {
      const reponse = await fetch(
        `${this.racine()}/v1/payments/${encodeURIComponent(referenceFournisseur)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.cleA()}`,
            "X-Transaction-Token": await this.transactionToken(),
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );
      const texte = await reponse.text();
      if (!reponse.ok) {
        console.error("[hrskills] lecture du statut Cash-Out:", reponse.status, texte.slice(0, 200));
        return { ok: false };
      }
      const enveloppe = JSON.parse(texte) as { data?: { status?: string }; status?: string };
      const statut = enveloppe.data?.status ?? enveloppe.status;
      return statut ? { ok: true, statut } : { ok: false };
    } catch (erreur) {
      console.error("[hrskills] lecture du statut Cash-Out échouée:", erreur);
      return { ok: false };
    }
  }

  /**
   * Décaissement Mobile Money vers le portefeuille du vendeur.
   * La référence interne (UUID du reversement) sert de clé d'idempotence :
   * une relance après timeout ne peut pas créer un second transfert.
   */
  async decaisser(ctx: {
    reference: string;
    telephone: string;
    operateur: string;
    montant: number;
    description: string;
  }): Promise<{ reference: string; statut: string; frais: number | null }> {
    const operateur = normaliserOperateur(ctx.operateur);
    if (operateur !== "mtn" && operateur !== "orange") {
      throw new Error("Opérateur de reversement invalide pour le Cameroun.");
    }
    const numero = normaliserNumeroHrSkills(ctx.telephone);
    if (!numero) throw new Error("Numéro Mobile Money du vendeur inexploitable.");
    if (!Number.isSafeInteger(ctx.montant) || ctx.montant < 10000) {
      throw new Error("Montant de reversement invalide.");
    }

    const chemin = `${this.racine()}/api/v1/payout/mobile-money`;
    const reponse = await fetch(chemin, {
      method: "POST",
      headers: {
        ...(await this.enTetes(cleIdempotence(ctx.reference))),
        // Le contrat Cash-Out (§4) montre explicitement la Clé A comme Bearer.
        // On conserve le comportement Cash-In existant, hors de ce chantier.
        Authorization: `Bearer ${this.cleA()}`,
      },
      body: JSON.stringify({
        operator: operateur.toUpperCase(),
        country: "CM",
        phone_number: numero,
        amount: ctx.montant,
        currency: "XAF",
        description: ctx.description,
      }),
      cache: "no-store",
    });
    const texte = await reponse.text();
    if (!reponse.ok) {
      throw new Error(`HR-Skills payout: HTTP ${reponse.status} · ${texte.slice(0, 300)}`);
    }
    let enveloppe: { data?: { reference?: string; status?: string; fee?: number }; reference?: string; status?: string; fee?: number };
    try {
      enveloppe = JSON.parse(texte) as typeof enveloppe;
    } catch {
      throw new Error(`HR-Skills payout: réponse non-JSON · ${texte.slice(0, 200)}`);
    }
    const data = enveloppe.data ?? enveloppe;
    if (!data.reference || !data.status) {
      throw new Error(`HR-Skills payout: référence ou statut absent · ${texte.slice(0, 200)}`);
    }
    return {
      reference: data.reference,
      statut: data.status,
      frais: typeof data.fee === "number" ? data.fee : null,
    };
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
    if (!lu) {
      // Les webhooks de test/minimaux peuvent ne contenir que {data:{message}}
      // et l'enveloppe {id,event,...}. On ne déduit JAMAIS un paiement depuis
      // l'id de l'événement ni depuis son message. Pour un événement de paiement
      // signé, le callback déclenche une réconciliation bornée des paiements en
      // attente : chaque transaction est ensuite confirmée par GET chez HR-Skills.
      const evenement =
        typeof charge === "object" && charge !== null && !Array.isArray(charge)
          ? (charge as Record<string, unknown>).event
          : null;
      if (
        evenement === "payment.succeeded" ||
        evenement === "payment.failed" ||
        evenement === "payment.refunded"
      ) {
        console.warn(
          "[hrskills] événement de paiement signé sans référence ; réconciliation nécessaire · structure:",
          structureJson(charge),
        );
        return { ok: false, raison: "RECONCILIATION_REQUISE", evenement };
      }

      // Un ping ou événement non transactionnel signé ne doit pas être traité
      // comme un paiement ni faire échouer les livraisons du fournisseur.
      console.info(
        "[hrskills] webhook signé sans référence transactionnelle, ignoré · structure:",
        structureJson(charge),
      );
      return { ok: false, raison: "NON_DEFINITIF" };
    }

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
