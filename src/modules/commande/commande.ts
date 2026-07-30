import { randomBytes } from "node:crypto";
import { Prisma, type ModePaiement } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculerTotal, evaluerCommandeCOD } from "@/modules/commande/commande-core";
import {
  getPlafondCOD,
  getMaxCommandesNonAbouties,
} from "@/modules/commande/config";
import { getPaymentProvider } from "@/modules/paiement";
import { notifierCommandeConfirmee } from "@/modules/email/notifications";
import { notifierPushNouvelleCommande } from "@/modules/push/push";
import type { AdresseLivraisonInput } from "@/validators/commande";

type CodeErreurCommande =
  | "PANIER_VIDE"
  | "INDISPONIBLE"
  | "STOCK_INSUFFISANT"
  | "PLAFOND_DEPASSE";

/** Erreur interne à la transaction : provoque le rollback complet. */
class ErreurCommande extends Error {
  constructor(
    public code: CodeErreurCommande,
    public detail?: string,
  ) {
    super(code);
  }
}

export type ResultatCommande =
  | { ok: true; commandeId: string; numero: string; urlPaiement: string | null }
  | {
      ok: false;
      code:
        | "PANIER_VIDE"
        | "PLAFOND_DEPASSE"
        | "TROP_COMMANDES_NON_ABOUTIES"
        | "STOCK_INSUFFISANT"
        | "INDISPONIBLE"
        | "PAIEMENT_INDISPONIBLE"
        | "ERREUR";
      detail?: string;
    };

export interface OptionsPaiement {
  mode: ModePaiement;
  // URLs absolues construites par la couche action (à partir des en-têtes).
  urlRetour: string;
  urlNotification: string;
  emailAcheteur: string;
  telephoneAcheteur: string;
  nomAcheteur: string;
}

function genererNumero(): string {
  const annee = new Date().getFullYear();
  return `NILE-${annee}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Passe une commande (COD ou Monetbil).
 * Création (décrément de stock, commande, paiement, vidage du panier) atomique.
 * COD  -> commande CONFIRMEE, paiement EN_ATTENTE (réglé à la livraison).
 * Monetbil -> commande EN_ATTENTE, initiation du paiement, renvoie l'URL du
 * widget. La commande ne devient « payée » que sur callback serveur vérifié.
 */
export async function passerCommande(
  utilisateurId: string,
  adresse: AdresseLivraisonInput,
  options: OptionsPaiement,
): Promise<ResultatCommande> {
  const panier = await prisma.panier.findUnique({
    where: { utilisateurId },
    include: { lignes: { include: { produit: true } } },
  });
  if (!panier || panier.lignes.length === 0) {
    return { ok: false, code: "PANIER_VIDE" };
  }

  const totalPrevu = calculerTotal(
    panier.lignes.map((l) => ({ prix: l.produit.prix, quantite: l.quantite })),
  );

  // Garde-fous propres au paiement à la livraison uniquement.
  let plafond = Number.MAX_SAFE_INTEGER;
  if (options.mode === "COD") {
    const [pl, maxNonAbouti, acheteur] = await Promise.all([
      getPlafondCOD(),
      getMaxCommandesNonAbouties(),
      prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } }),
    ]);
    plafond = pl;
    const decision = evaluerCommandeCOD({
      total: totalPrevu,
      plafond,
      compteurNonAbouti: acheteur.nbCommandesNonAbouties,
      maxNonAbouti,
    });
    if (decision === "PLAFOND_DEPASSE") return { ok: false, code: "PLAFOND_DEPASSE" };
    if (decision === "TROP_COMMANDES_NON_ABOUTIES") {
      return { ok: false, code: "TROP_COMMANDES_NON_ABOUTIES" };
    }
  }

  const statutInitial = options.mode === "COD" ? "CONFIRMEE" : "EN_ATTENTE";

  // Jusqu'à 3 tentatives en cas de collision (improbable) du numéro de commande.
  let cree: { commandeId: string; numero: string; paiementId: string; total: number } | null =
    null;
  for (let tentative = 0; tentative < 3; tentative++) {
    try {
      cree = await creerCommandeTransaction(
        genererNumero(),
        utilisateurId,
        panier.id,
        adresse,
        options.mode,
        statutInitial,
        plafond,
      );
      break;
    } catch (erreur) {
      if (erreur instanceof ErreurCommande) {
        return { ok: false, code: erreur.code, detail: erreur.detail };
      }
      const collisionNumero =
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === "P2002" &&
        tentative < 2;
      if (collisionNumero) continue;
      console.error("Erreur passerCommande:", erreur);
      return { ok: false, code: "ERREUR" };
    }
  }
  if (!cree) return { ok: false, code: "ERREUR" };

  // Paiement à la livraison : rien à initier, la commande est confirmée.
  if (options.mode === "COD") {
    // Email acheteur + vendeurs, et push vendeurs/admin (n'échouent jamais la commande).
    await notifierCommandeConfirmee(cree.commandeId);
    await notifierPushNouvelleCommande(cree.commandeId);
    return {
      ok: true,
      commandeId: cree.commandeId,
      numero: cree.numero,
      urlPaiement: null,
    };
  }

  // Monetbil : initier le paiement et renvoyer l'URL du widget.
  try {
    const demarrage = await getPaymentProvider().initier({
      reference: cree.paiementId, // = payment_ref renvoyé dans le callback
      montant: cree.total,
      telephone: options.telephoneAcheteur,
      email: options.emailAcheteur,
      nomComplet: options.nomAcheteur,
      numeroCommande: cree.numero,
      urlRetour: options.urlRetour,
      urlNotification: options.urlNotification,
    });
    return {
      ok: true,
      commandeId: cree.commandeId,
      numero: cree.numero,
      urlPaiement: demarrage.urlPaiement,
    };
  } catch (erreur) {
    console.error("Initiation paiement échouée:", erreur);
    // Libère la commande (remise en stock) : le paiement n'a pas pu démarrer.
    await libererCommande(cree.commandeId);
    return { ok: false, code: "PAIEMENT_INDISPONIBLE" };
  }
}

async function creerCommandeTransaction(
  numero: string,
  utilisateurId: string,
  panierId: string,
  adresse: AdresseLivraisonInput,
  mode: ModePaiement,
  statutInitial: "CONFIRMEE" | "EN_ATTENTE",
  plafond: number,
): Promise<{ commandeId: string; numero: string; paiementId: string; total: number }> {
  return prisma.$transaction(async (tx) => {
    const panier = await tx.panier.findUniqueOrThrow({
      where: { id: panierId },
      include: {
        lignes: { include: { produit: { include: { vendeur: true } } } },
      },
    });
    if (panier.lignes.length === 0) throw new ErreurCommande("PANIER_VIDE");

    let total = 0;
    const lignesData: Prisma.LigneCommandeCreateManyCommandeInput[] = [];

    for (const ligne of panier.lignes) {
      const p = ligne.produit;
      if (p.statut !== "ACTIF" || p.vendeur.statutValidation !== "VALIDE") {
        throw new ErreurCommande("INDISPONIBLE", p.titre);
      }
      // Décrément conditionnel ATOMIQUE : ne réussit que si le stock suffit.
      // Empêche la survente en cas de commandes concurrentes.
      const maj = await tx.produit.updateMany({
        where: { id: p.id, stock: { gte: ligne.quantite } },
        data: { stock: { decrement: ligne.quantite } },
      });
      if (maj.count === 0) throw new ErreurCommande("STOCK_INSUFFISANT", p.titre);

      const sousTotal = p.prix * ligne.quantite;
      total += sousTotal;
      lignesData.push({
        produitId: p.id,
        vendeurId: p.vendeurId, // snapshot vendeur (commande multi-vendeurs)
        titreProduit: p.titre, // snapshot titre
        prixUnitaire: p.prix, // snapshot prix
        quantite: ligne.quantite,
        sousTotal,
      });
    }

    if (total > plafond) throw new ErreurCommande("PLAFOND_DEPASSE");

    const statutCash = mode === "COD" ? "NON_COLLECTE" : "NON_APPLICABLE";
    const commande = await tx.commande.create({
      data: {
        numero,
        acheteurId: utilisateurId,
        statutCommande: statutInitial,
        statutPaiement: "EN_ATTENTE",
        modePaiement: mode,
        total,
        destNom: adresse.destNom,
        destTelephone: adresse.destTelephone,
        ville: adresse.ville,
        quartier: adresse.quartier,
        reperes: adresse.reperes ?? null,
        lignes: { createMany: { data: lignesData } },
        livraison: { create: { statut: "EN_ATTENTE", statutCash } },
      },
    });
    const paiement = await tx.paiement.create({
      data: { commandeId: commande.id, mode, montant: total, statut: "EN_ATTENTE" },
    });

    await tx.lignePanier.deleteMany({ where: { panierId: panier.id } });
    return {
      commandeId: commande.id,
      numero: commande.numero,
      paiementId: paiement.id,
      total,
    };
  });
}

/** Libère une commande non payée : remise en stock atomique (si applicable). */
async function libererCommande(commandeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const commande = await tx.commande.findUnique({
      where: { id: commandeId },
      include: { lignes: true },
    });
    if (!commande) return;
    const maj = await tx.commande.updateMany({
      where: {
        id: commandeId,
        statutCommande: { in: ["EN_ATTENTE", "CONFIRMEE"] },
      },
      data: { statutCommande: "ANNULEE", statutPaiement: "ECHOUE" },
    });
    if (maj.count === 1) {
      for (const ligne of commande.lignes) {
        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { stock: { increment: ligne.quantite } },
        });
      }
    }
  });
}

/**
 * Dernière adresse de livraison utilisée par l'acheteur (pré-remplissage du
 * formulaire de commande — gros gain de confort pour les clients récurrents).
 */
export async function getDerniereAdresse(utilisateurId: string) {
  return prisma.commande.findFirst({
    where: { acheteurId: utilisateurId },
    orderBy: { dateCreation: "desc" },
    select: {
      destNom: true,
      destTelephone: true,
      ville: true,
      quartier: true,
      reperes: true,
    },
  });
}

// ------------------------------ SUIVI ACHETEUR -------------------------------

export async function listerCommandesAcheteur(utilisateurId: string) {
  return prisma.commande.findMany({
    where: { acheteurId: utilisateurId },
    orderBy: { dateCreation: "desc" },
    include: {
      _count: { select: { lignes: true } },
      // Première ligne seulement : sert de vignette représentative de la
      // commande dans les listes (compte, historique).
      lignes: {
        take: 1,
        select: {
          titreProduit: true,
          produit: {
            select: { images: { orderBy: { ordre: "asc" }, take: 1, select: { url: true } } },
          },
        },
      },
    },
  });
}

export async function getCommandeAcheteur(
  utilisateurId: string,
  commandeId: string,
) {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: {
      // slug + 1re image : vignettes cliquables du récapitulatif d'articles.
      lignes: {
        include: {
          produit: {
            select: {
              slug: true,
              images: { orderBy: { ordre: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
      livraison: true,
      paiements: true,
    },
  });
  if (!commande || commande.acheteurId !== utilisateurId) return null;
  return commande;
}

export interface OptionsReprise {
  urlRetour: string;
  urlNotification: string;
  email: string;
  telephone: string;
  nom: string;
}

export type ResultatReprise =
  | { ok: true; urlPaiement: string }
  | { ok: false; code: "INTROUVABLE" | "NON_APPLICABLE" | "ERREUR" };

/** Relance le paiement Monetbil d'une commande encore en attente de paiement. */
export async function reprendrePaiement(
  utilisateurId: string,
  commandeId: string,
  options: OptionsReprise,
): Promise<ResultatReprise> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { paiements: true },
  });
  if (!commande || commande.acheteurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }
  if (
    commande.modePaiement !== "MONETBIL" ||
    commande.statutPaiement !== "EN_ATTENTE" ||
    commande.statutCommande !== "EN_ATTENTE"
  ) {
    return { ok: false, code: "NON_APPLICABLE" };
  }
  const paiement =
    commande.paiements.find((p) => p.statut === "EN_ATTENTE") ??
    commande.paiements[0];
  if (!paiement) return { ok: false, code: "NON_APPLICABLE" };

  try {
    const demarrage = await getPaymentProvider().initier({
      reference: paiement.id,
      montant: commande.total,
      telephone: options.telephone,
      email: options.email,
      nomComplet: options.nom,
      numeroCommande: commande.numero,
      urlRetour: options.urlRetour,
      urlNotification: options.urlNotification,
    });
    return { ok: true, urlPaiement: demarrage.urlPaiement };
  } catch (erreur) {
    console.error("reprendrePaiement:", erreur);
    return { ok: false, code: "ERREUR" };
  }
}

export type ResultatAnnulation =
  | { ok: true }
  | { ok: false; code: "INTROUVABLE" | "NON_ANNULABLE" };

const STATUTS_ANNULABLES = ["EN_ATTENTE", "CONFIRMEE"] as const;

/** Annulation par l'acheteur (tant que la commande n'est pas préparée) : remet en stock. */
export async function annulerCommandeAcheteur(
  utilisateurId: string,
  commandeId: string,
): Promise<ResultatAnnulation> {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { lignes: true },
  });
  if (!commande || commande.acheteurId !== utilisateurId) {
    return { ok: false, code: "INTROUVABLE" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Transition atomique : n'annule que si toujours dans un statut annulable.
      // Empêche une double annulation (et donc une double remise en stock).
      const maj = await tx.commande.updateMany({
        where: { id: commandeId, statutCommande: { in: [...STATUTS_ANNULABLES] } },
        data: { statutCommande: "ANNULEE" },
      });
      if (maj.count === 0) throw new Error("NON_ANNULABLE");

      for (const ligne of commande.lignes) {
        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { stock: { increment: ligne.quantite } },
        });
      }
    });
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof Error && erreur.message === "NON_ANNULABLE") {
      return { ok: false, code: "NON_ANNULABLE" };
    }
    console.error("Erreur annulerCommandeAcheteur:", erreur);
    return { ok: false, code: "INTROUVABLE" };
  }
}
