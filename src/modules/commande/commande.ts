import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculerTotal, evaluerCommandeCOD } from "@/modules/commande/commande-core";
import {
  getPlafondCOD,
  getMaxCommandesNonAbouties,
} from "@/modules/commande/config";
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
  | { ok: true; commandeId: string; numero: string }
  | {
      ok: false;
      code:
        | "PANIER_VIDE"
        | "PLAFOND_DEPASSE"
        | "TROP_COMMANDES_NON_ABOUTIES"
        | "STOCK_INSUFFISANT"
        | "INDISPONIBLE"
        | "ERREUR";
      detail?: string;
    };

function genererNumero(): string {
  const annee = new Date().getFullYear();
  return `NILE-${annee}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Passe une commande en paiement à la livraison (COD).
 * Toute l'opération (validation stock, décrément, création commande, vidage du
 * panier) est atomique : en cas d'échec, aucune modification n'est conservée.
 */
export async function passerCommandeCOD(
  utilisateurId: string,
  adresse: AdresseLivraisonInput,
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

  const [plafond, maxNonAbouti, acheteur] = await Promise.all([
    getPlafondCOD(),
    getMaxCommandesNonAbouties(),
    prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } }),
  ]);

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

  // Jusqu'à 3 tentatives en cas de collision (improbable) du numéro de commande.
  for (let tentative = 0; tentative < 3; tentative++) {
    try {
      const commande = await creerCommandeTransaction(
        genererNumero(),
        utilisateurId,
        panier.id,
        adresse,
        plafond,
      );
      return { ok: true, commandeId: commande.id, numero: commande.numero };
    } catch (erreur) {
      if (erreur instanceof ErreurCommande) {
        return { ok: false, code: erreur.code, detail: erreur.detail };
      }
      const collisionNumero =
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === "P2002" &&
        tentative < 2;
      if (collisionNumero) continue;
      console.error("Erreur passerCommandeCOD:", erreur);
      return { ok: false, code: "ERREUR" };
    }
  }
  return { ok: false, code: "ERREUR" };
}

function creerCommandeTransaction(
  numero: string,
  utilisateurId: string,
  panierId: string,
  adresse: AdresseLivraisonInput,
  plafond: number,
) {
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

    const commande = await tx.commande.create({
      data: {
        numero,
        acheteurId: utilisateurId,
        statutCommande: "CONFIRMEE",
        statutPaiement: "EN_ATTENTE",
        modePaiement: "COD",
        total,
        destNom: adresse.destNom,
        destTelephone: adresse.destTelephone,
        ville: adresse.ville,
        quartier: adresse.quartier,
        reperes: adresse.reperes ?? null,
        lignes: { createMany: { data: lignesData } },
        paiements: {
          create: { mode: "COD", montant: total, statut: "EN_ATTENTE" },
        },
        livraison: { create: { statut: "EN_ATTENTE", statutCash: "NON_COLLECTE" } },
      },
    });

    await tx.lignePanier.deleteMany({ where: { panierId: panier.id } });
    return commande;
  });
}

// ------------------------------ SUIVI ACHETEUR -------------------------------

export async function listerCommandesAcheteur(utilisateurId: string) {
  return prisma.commande.findMany({
    where: { acheteurId: utilisateurId },
    orderBy: { dateCreation: "desc" },
    include: { _count: { select: { lignes: true } } },
  });
}

export async function getCommandeAcheteur(
  utilisateurId: string,
  commandeId: string,
) {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { lignes: true, livraison: true, paiements: true },
  });
  if (!commande || commande.acheteurId !== utilisateurId) return null;
  return commande;
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
