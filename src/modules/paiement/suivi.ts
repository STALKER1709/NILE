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
    await interroger(paiement.reference, commande.numero);
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
 * N'échoue jamais bruyamment : cette relecture est un filet, pas le chemin
 * principal. Un fournisseur injoignable ne doit pas casser l'affichage de la
 * commande — la prochaine tentative retombera dessus.
 */
async function interroger(
  referenceFournisseur: string,
  numeroCommande: string,
): Promise<void> {
  const fournisseur = getPaymentProvider();
  if (!fournisseur.consulterStatut) return; // fournisseur sans lecture de statut

  try {
    const statut = await fournisseur.consulterStatut(referenceFournisseur);
    // `null` = en cours, en revue, ou illisible : rien de définitif, donc rien
    // à écrire. C'est le cas le plus fréquent tant que l'acheteur n'a pas
    // validé sur son téléphone.
    if (!statut) return;

    const resultat = await conclurePaiement(referenceFournisseur, statut, {
      // Trace de provenance conservée dans `Paiement.payload` : ce paiement a
      // été conclu par relecture, pas par notification reçue.
      source: "relecture",
      statut,
      reference: referenceFournisseur,
      lu_le: new Date().toISOString(),
    });
    if (!resultat.ok) {
      console.error(
        `[suivi] relecture non appliquée · commande=${numeroCommande} ·`,
        resultat.raison,
      );
    } else {
      console.info(
        `[suivi] relecture appliquée · commande=${numeroCommande} ·`,
        resultat.statut,
      );
    }
  } catch (erreur) {
    console.error(
      `[suivi] relecture échouée · commande=${numeroCommande} ·`,
      erreur instanceof Error ? erreur.message : erreur,
    );
  }
}
