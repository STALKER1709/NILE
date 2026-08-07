import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/modules/paiement";
import { conclurePaiement } from "@/modules/paiement/notification";
import { decisionSuivi } from "@/modules/paiement/suivi-core";

/**
 * Relecture du statut d'un paiement Mobile Money à notre initiative.
 *
 * Le webhook reste la voie rapide et la source de vérité habituelle. Mais un
 * webhook peut ne jamais partir, se perdre, ou arriver pendant une
 * indisponibilité : la commande resterait alors « en attente » indéfiniment,
 * l'acheteur ayant payé sans que rien n'avance. La documentation du
 * fournisseur prévoit d'ailleurs explicitement les deux voies — notification
 * OU interrogation du statut.
 *
 * Ce module n'invente aucune vérité : il redemande au fournisseur, et délègue
 * l'écriture à `conclurePaiement`, exactement comme le fait le webhook.
 */

export type ResultatSuivi =
  | { ok: true; statutPaiement: string; statutCommande: string }
  | { ok: false; code: "INTROUVABLE" };

/**
 * Rafraîchit le paiement d'une commande, puis renvoie son état à jour.
 *
 * L'appartenance de la commande à l'acheteur est vérifiée ICI, côté serveur :
 * l'appelant est une action déclenchée depuis le navigateur, son argument ne
 * vaut rien tant qu'il n'est pas confronté à l'utilisateur authentifié.
 */
export async function rafraichirPaiementCommande(
  utilisateurId: string,
  commandeId: string,
): Promise<ResultatSuivi> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { paiements: { orderBy: { dateCreation: "desc" } } },
  });
  // Une commande qui ne t'appartient pas est traitée comme inexistante : ne
  // pas révéler qu'elle existe.
  if (!commande || commande.acheteurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }

  const paiement =
    commande.paiements.find((p) => p.statut === "EN_ATTENTE") ??
    commande.paiements[0];

  const decision = decisionSuivi({
    modePaiement: commande.modePaiement,
    statutPaiement: commande.statutPaiement,
    statutCommande: commande.statutCommande,
    referenceFournisseur: paiement?.reference ?? null,
  });

  if (decision === "SANS_REFERENCE") {
    // Anomalie : le paiement attend, mais on ne sait pas quoi demander au
    // fournisseur. Sans cette trace, le cas resterait invisible.
    console.error(
      "[suivi] paiement en attente sans référence fournisseur · commande=",
      commande.numero,
    );
  }

  if (decision === "INTERROGER" && paiement?.reference) {
    await interroger(paiement.reference, commande.numero, "acheteur");
    // Relit l'état après une éventuelle bascule plutôt que de le déduire :
    // `conclurePaiement` est idempotent et peut n'avoir rien écrit.
    const apres = await prisma.commande.findUnique({
      where: { id: commandeId },
      select: { statutPaiement: true, statutCommande: true },
    });
    if (apres) {
      return {
        ok: true,
        statutPaiement: apres.statutPaiement,
        statutCommande: apres.statutCommande,
      };
    }
  }

  return {
    ok: true,
    statutPaiement: commande.statutPaiement,
    statutCommande: commande.statutCommande,
  };
}

/**
 * Interroge le fournisseur et conclut si le statut est définitif.
 *
 * Renvoie `true` si le paiement a été tranché, `false` sinon.
 *
 * N'échoue jamais bruyamment : cette relecture est un filet, pas le chemin
 * principal. Un fournisseur injoignable ne doit pas casser l'affichage de la
 * commande — la prochaine tentative retombera dessus.
 */
/**
 * Origine de la relecture. Conservée dans `Paiement.payload` parce qu'elle
 * répond à une question qu'on ne peut pas se poser autrement : le balayage
 * périodique tourne-t-il vraiment ?
 *
 * Sans cette distinction, la relecture de l'acheteur masque une panne du
 * balayage — tant que les acheteurs gardent leur page ouverte, tout paraît
 * marcher, et l'on ne découvre la panne que le jour où l'un d'eux ferme son
 * navigateur avant de payer. C'est précisément le cas que ce filet existe
 * pour couvrir.
 */
export type OrigineRelecture = "acheteur" | "balayage";

async function interroger(
  referenceFournisseur: string,
  numeroCommande: string,
  origine: OrigineRelecture,
): Promise<boolean> {
  const fournisseur = getPaymentProvider();
  if (!fournisseur.consulterStatut) return false; // pas de lecture de statut

  try {
    const statut = await fournisseur.consulterStatut(referenceFournisseur);
    // `null` = en cours, en revue, ou illisible : rien de définitif, donc rien
    // à écrire. C'est le cas le plus fréquent tant que l'acheteur n'a pas
    // validé sur son téléphone.
    if (!statut) return false;

    const resultat = await conclurePaiement(referenceFournisseur, statut, {
      // Trace de provenance conservée dans `Paiement.payload` : ce paiement a
      // été conclu par relecture — et par LAQUELLE — pas par notification
      // reçue. Un `payload` sans `source` désigne donc un webhook.
      source: `relecture:${origine}`,
      statut,
      reference: referenceFournisseur,
      lu_le: new Date().toISOString(),
    });
    if (!resultat.ok) {
      console.error(
        `[suivi] relecture non appliquée · commande=${numeroCommande} ·`,
        resultat.raison,
      );
      return false;
    }
    console.info(
      `[suivi:${origine}] relecture appliquée · commande=${numeroCommande} ·`,
      resultat.statut,
    );
    return true;
  } catch (erreur) {
    console.error(
      `[suivi:${origine}] relecture échouée · commande=${numeroCommande} ·`,
      erreur instanceof Error ? erreur.message : erreur,
    );
    return false;
  }
}

/**
 * Âge minimum avant balayage : en deçà, l'écran d'attente de l'acheteur
 * interroge déjà le fournisseur. Inutile de doubler ses appels.
 */
const AGE_MINIMUM_MS = 60_000;

/**
 * Au-delà, la transaction est morte depuis longtemps chez le fournisseur
 * (expiration à 10 min) : le balayage la conclura en ECHOUE et libérera le
 * stock. La fenêtre est large à dessein — une commande oubliée en attente
 * immobilise des articles que personne d'autre ne peut acheter.
 */
const FENETRE_JOURS = 7;

/** Plafond par passage : borne la durée et le nombre d'appels au fournisseur. */
const LOT_MAX = 50;

export interface ResultatBalayage {
  examinees: number;
  conclues: number;
}

/**
 * Balaie les paiements Mobile Money restés en attente et les conclut.
 *
 * Complète la relecture déclenchée par l'écran d'attente, qui ne tourne que
 * tant que l'acheteur garde sa page ouverte : celui qui valide sur son
 * téléphone puis ferme le navigateur laisserait sinon sa commande figée,
 * argent encaissé et stock immobilisé, sans que personne ne s'en aperçoive.
 *
 * Sans effet de bord visible quand tout va bien : les paiements déjà conclus
 * par webhook ou par relecture ne sont même pas examinés.
 */
export async function balayerPaiementsEnAttente(): Promise<ResultatBalayage> {
  const maintenant = Date.now();
  const commandes = await prisma.commande.findMany({
    where: {
      modePaiement: { not: "COD" },
      statutPaiement: "EN_ATTENTE",
      statutCommande: "EN_ATTENTE",
      dateCreation: {
        gte: new Date(maintenant - FENETRE_JOURS * 24 * 60 * 60 * 1000),
        lte: new Date(maintenant - AGE_MINIMUM_MS),
      },
    },
    include: { paiements: { orderBy: { dateCreation: "desc" } } },
    orderBy: { dateCreation: "asc" },
    take: LOT_MAX,
  });

  let examinees = 0;
  let conclues = 0;

  for (const commande of commandes) {
    const paiement =
      commande.paiements.find((p) => p.statut === "EN_ATTENTE") ??
      commande.paiements[0];

    const decision = decisionSuivi({
      modePaiement: commande.modePaiement,
      statutPaiement: commande.statutPaiement,
      statutCommande: commande.statutCommande,
      referenceFournisseur: paiement?.reference ?? null,
    });

    if (decision === "SANS_REFERENCE") {
      console.error(
        "[balayage] paiement en attente sans référence fournisseur · commande=",
        commande.numero,
      );
      continue;
    }
    if (decision !== "INTERROGER" || !paiement?.reference) continue;

    examinees += 1;
    // Séquentiel, pas en parallèle : le fournisseur limite à 100 requêtes par
    // minute, et rien ici n'est urgent.
    if (await interroger(paiement.reference, commande.numero, "balayage")) conclues += 1;
  }

  if (examinees > 0) {
    console.info(`[balayage] ${conclues} conclu(s) sur ${examinees} examiné(s)`);
  }
  return { examinees, conclues };
}
