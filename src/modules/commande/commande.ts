import { randomBytes } from "node:crypto";
import { Prisma, type ModePaiement } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  calculerTotal,
  evaluerCommandeCOD,
  codBloqueParDette,
} from "@/modules/commande/commande-core";
import {
  getPlafondCOD,
  getPlafondDetteCOD,
  getMaxCommandesNonAbouties,
} from "@/modules/commande/config";
import { getPaymentProvider } from "@/modules/paiement";
import { notifierCommandeConfirmee } from "@/modules/email/notifications";
import { notifierCommandeWhatsApp } from "@/modules/whatsapp/notifications";
import {
  notifierPushNouvelleCommande,
  notifierPushStatutAcheteur,
} from "@/modules/push/push";
import { resoudrePrixEffectifTx } from "@/modules/promotion/promotion";
import { consommerCodeTx, ErreurCodePromo } from "@/modules/promotion/code-promo";
import { dettesVendeurs } from "@/modules/reversement/reversement";
import {
  libelleVariante,
  type AxeDeclinaison,
} from "@/modules/catalogue/variante-core";
import { axesParCategorie } from "@/modules/catalogue/axes";
import { restituerStockTx } from "@/modules/commande/stock";
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
        | "COD_INDISPONIBLE_VENDEUR"
        | "CODE_PROMO_REFUSE"
        | "TROP_COMMANDES_NON_ABOUTIES"
        | "STOCK_INSUFFISANT"
        | "INDISPONIBLE"
        | "PAIEMENT_INDISPONIBLE"
        | "ERREUR";
      detail?: string;
    };

export interface OptionsPaiement {
  mode: ModePaiement;
  /** Code promo saisi par l'acheteur, tel quel. Normalisé plus bas. */
  codePromo?: string | null;
  // URLs absolues construites par la couche action (à partir des en-têtes).
  urlRetour: string;
  urlNotification: string;
  emailAcheteur: string;
  telephoneAcheteur: string;
  nomAcheteur: string;
  /**
   * Opérateur Mobile Money choisi au moment de commander. Requis par les
   * fournisseurs qui débitent directement le portefeuille du client.
   */
  operateur?: string;
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

    // Vendeurs dont la dette de commission dépasse le seuil : leurs articles
    // ne peuvent plus partir en paiement à la livraison. Vérifié ICI, côté
    // serveur : l'écran de commande masque déjà l'option, mais un formulaire
    // forgé la repasserait sans cela.
    const [seuilDette, dettes] = await Promise.all([
      getPlafondDetteCOD(),
      dettesVendeurs([
        ...new Set(panier.lignes.map((l) => l.produit.vendeurId)),
      ]),
    ]);
    const bloquants = panier.lignes.filter((l) =>
      codBloqueParDette(dettes.get(l.produit.vendeurId) ?? 0, seuilDette),
    );
    if (bloquants.length > 0) {
      return {
        ok: false,
        code: "COD_INDISPONIBLE_VENDEUR",
        // Les titres servent à nommer les articles à retirer : sans eux,
        // l'acheteur ne saurait pas lesquels posent problème.
        detail: bloquants.map((l) => l.produit.titre).join(", "),
      };
    }
  }

  // Résolus AVANT la transaction : ils servent à nommer les déclinaisons dans
  // la commande, et l'arborescence des catégories n'a aucune raison d'être
  // relue sous verrou.
  const axesParCat = await axesParCategorie(
    panier.lignes.map((l) => l.produit.categorieId),
  );

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
        options.codePromo ?? null,
        axesParCat,
      );
      break;
    } catch (erreur) {
      if (erreur instanceof ErreurCommande) {
        return { ok: false, code: erreur.code, detail: erreur.detail };
      }
      if (erreur instanceof ErreurCodePromo) {
        return { ok: false, code: "CODE_PROMO_REFUSE", detail: erreur.raison };
      }
      // Collision sur le NUMÉRO de commande uniquement. La cible est vérifiée :
      // depuis les codes promo, une autre contrainte d'unicité peut échouer
      // dans cette transaction (un acheteur qui rejoue le même code), et la
      // rejouer à l'identique échouerait autant de fois.
      const cible = 
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === "P2002"
          ? JSON.stringify(erreur.meta?.target ?? "")
          : "";
      if (cible.includes("numero") && tentative < 2) continue;
      // Même code déjà consommé par cet acheteur : la base a tranché.
      if (cible.includes("codePromoId") || cible.includes("commandeId")) {
        return { ok: false, code: "CODE_PROMO_REFUSE", detail: "DEJA_UTILISE" };
      }
      console.error("Erreur passerCommande:", erreur);
      return { ok: false, code: "ERREUR" };
    }
  }
  if (!cree) return { ok: false, code: "ERREUR" };

  // Paiement à la livraison : rien à initier, la commande est confirmée.
  if (options.mode === "COD") {
    // Email acheteur + vendeurs, WhatsApp et push acheteur, push
    // vendeurs/admin (n'échouent jamais la commande).
    await notifierCommandeConfirmee(cree.commandeId);
    await notifierCommandeWhatsApp(cree.commandeId, "CONFIRMEE");
    await notifierPushStatutAcheteur(cree.commandeId, "CONFIRMEE");
    await notifierPushNouvelleCommande(cree.commandeId);
    return {
      ok: true,
      commandeId: cree.commandeId,
      numero: cree.numero,
      urlPaiement: null,
    };
  }

  // Mobile Money : initier le paiement. Selon le fournisseur, on obtient une
  // page de paiement (widget) ou rien du tout — le client valide alors
  // directement sur son téléphone (prompt USSD/push).
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
      operateur: options.operateur,
    });
    await memoriserReferenceFournisseur(cree.paiementId, demarrage.referenceFournisseur);
    return {
      ok: true,
      commandeId: cree.commandeId,
      numero: cree.numero,
      urlPaiement: demarrage.urlPaiement,
    };
  } catch (erreur) {
    // Journalisé avec le fournisseur et le numéro de commande : c'est la
    // seule trace exploitable quand un acheteur signale « le paiement ne se
    // lance pas », le message qui lui est montré restant volontairement vague.
    console.error(
      `[paiement] initiation échouée · fournisseur=${env.PAYMENT_PROVIDER} · commande=${cree.numero} ·`,
      erreur instanceof Error ? erreur.message : erreur,
    );
    // Libère la commande : remise en stock ET articles rendus au panier.
    await libererCommande(cree.commandeId);
    return { ok: false, code: "PAIEMENT_INDISPONIBLE" };
  }
}

/**
 * Nom d'un article tel qu'il doit apparaître dans un message d'erreur :
 * « T-shirt (XL · Bleu) » plutôt que « T-shirt », sans quoi l'acheteur ne sait
 * pas laquelle de ses deux tailles pose problème.
 */
function nomArticle(
  ligne: {
    produit: { titre: string };
    variante: { valeur1: string; valeur2: string };
  },
  axes: AxeDeclinaison[],
): string {
  const declinaison = libelleVariante(ligne.variante, axes);
  return declinaison ? `${ligne.produit.titre} (${declinaison})` : ligne.produit.titre;
}

async function creerCommandeTransaction(
  numero: string,
  utilisateurId: string,
  panierId: string,
  adresse: AdresseLivraisonInput,
  mode: ModePaiement,
  statutInitial: "CONFIRMEE" | "EN_ATTENTE",
  plafond: number,
  codeSaisi: string | null,
  axesParCat: Map<string, AxeDeclinaison[]>,
): Promise<{ commandeId: string; numero: string; paiementId: string; total: number }> {
  return prisma.$transaction(async (tx) => {
    const panier = await tx.panier.findUniqueOrThrow({
      where: { id: panierId },
      include: {
        lignes: {
          include: { variante: true, produit: { include: { vendeur: true } } },
        },
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
      // Une déclinaison retirée de la vente ne part plus, même si elle est
      // encore dans un panier ouvert depuis hier.
      const axes = axesParCat.get(p.categorieId) ?? [];
      if (!ligne.variante.actif) {
        throw new ErreurCommande("INDISPONIBLE", nomArticle(ligne, axes));
      }
      // Décrément conditionnel ATOMIQUE sur la DÉCLINAISON : ne réussit que si
      // son stock suffit. Empêche la survente en cas de commandes
      // concurrentes — deux acheteuses ne peuvent pas emporter le même dernier
      // XL bleu, même si le M reste abondant.
      const maj = await tx.varianteProduit.updateMany({
        where: { id: ligne.varianteId, stock: { gte: ligne.quantite } },
        data: { stock: { decrement: ligne.quantite } },
      });
      if (maj.count === 0) {
        throw new ErreurCommande("STOCK_INSUFFISANT", nomArticle(ligne, axes));
      }

      // Prix effectif = prix courant, réduit d'une éventuelle promotion active
      // AU MOMENT DU PAIEMENT (relu sous la même transaction, pas depuis le
      // panier affiché plus tôt) : c'est ce prix qui est figé dans la commande.
      const prixUnitaire = await resoudrePrixEffectifTx(tx, {
        id: p.id,
        prix: p.prix,
        vendeurId: p.vendeurId,
      });
      const sousTotal = prixUnitaire * ligne.quantite;
      total += sousTotal;
      lignesData.push({
        produitId: p.id,
        varianteId: ligne.varianteId,
        vendeurId: p.vendeurId, // snapshot vendeur (commande multi-vendeurs)
        titreProduit: p.titre, // snapshot titre
        // Instantanés de la déclinaison, au même titre que le titre et le prix :
        // le vendeur peut renommer « Bleu » en « Bleu ciel », la commande doit
        // continuer de dire ce qui a été acheté.
        declinaison: libelleVariante(ligne.variante, axes),
        prixUnitaire, // snapshot prix (promotion éventuelle incluse)
        quantite: ligne.quantite,
        sousTotal,
      });
    }

    if (total > plafond) throw new ErreurCommande("PLAFOND_DEPASSE");

    // Code promo évalué et consommé SOUS LA MÊME TRANSACTION, sur le total
    // recalculé ici — jamais sur celui affiché au panier, qui a pu changer
    // depuis (promotion vendeur expirée, prix modifié).
    const promo = await consommerCodeTx(tx, {
      saisie: codeSaisi,
      utilisateurId,
      totalPanier: total,
      modePaiement: mode,
    });
    const remise = promo?.remise ?? 0;
    // Le total payé est net de remise ; les `sousTotal` des lignes restent au
    // prix plein. C'est ce qui fait porter la remise à NILE et non au vendeur :
    // reversement et commission se calculent sur les lignes.
    const totalPaye = total - remise;

    const statutCash = mode === "COD" ? "NON_COLLECTE" : "NON_APPLICABLE";
    const commande = await tx.commande.create({
      data: {
        numero,
        acheteurId: utilisateurId,
        statutCommande: statutInitial,
        statutPaiement: "EN_ATTENTE",
        modePaiement: mode,
        total: totalPaye,
        remise,
        codePromo: promo?.code ?? null,
        destNom: adresse.destNom,
        destTelephone: adresse.destTelephone,
        ville: adresse.ville,
        quartier: adresse.quartier,
        reperes: adresse.reperes ?? null,
        lignes: { createMany: { data: lignesData } },
        livraison: { create: { statut: "EN_ATTENTE", statutCash } },
      },
    });
    if (promo) {
      // Consigne l'utilisation DANS la même transaction. L'unicité
      // (code, acheteur) est portée par la base : si l'acheteur a déjà
      // consommé ce code, l'insertion échoue et toute la commande est annulée
      // — c'est la garantie qui tient même quand deux commandes partent
      // simultanément.
      await tx.utilisationCodePromo.create({
        data: {
          codePromoId: promo.codePromoId,
          utilisateurId,
          commandeId: commande.id,
          remise,
        },
      });
    }

    const paiement = await tx.paiement.create({
      // Le montant du paiement est ce que l'acheteur règle RÉELLEMENT : c'est
      // lui qui part chez l'agrégateur. Y laisser le total brut ferait payer
      // la remise à l'acheteur.
      data: { commandeId: commande.id, mode, montant: totalPaye, statut: "EN_ATTENTE" },
    });

    await tx.lignePanier.deleteMany({ where: { panierId: panier.id } });
    return {
      commandeId: commande.id,
      numero: commande.numero,
      paiementId: paiement.id,
      total: totalPaye,
    };
  });
}

/**
 * Libère une commande dont le paiement n'a jamais pu démarrer : remise en
 * stock ET remise au panier, atomiques.
 *
 * Le panier est vidé pendant la création de la commande. Si l'initiation du
 * paiement échoue ensuite, l'acheteur se retrouverait sans commande ET sans
 * panier : de son point de vue, tout aurait disparu sans explication — il ne
 * verrait même pas le message d'erreur, l'écran de commande renvoyant vers le
 * panier quand celui-ci est vide. On lui rend donc ses articles, pour qu'il
 * puisse simplement réessayer.
 */
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
    // Filtré sur les statuts « encore libérables » : un second appel ne
    // recrédite ni le stock ni le panier.
    if (maj.count !== 1) return;

    await restituerStockTx(tx, commande.lignes);

    const panier = await tx.panier.upsert({
      where: { utilisateurId: commande.acheteurId },
      create: { utilisateurId: commande.acheteurId },
      update: {},
      select: { id: true },
    });
    // `skipDuplicates` : si l'acheteur a déjà remis un de ces articles au
    // panier entre-temps, son panier actuel prime — on ne double pas la
    // quantité dans son dos.
    // Les lignes antérieures aux déclinaisons n'en désignent aucune : elles
    // sont écartées de la remise au panier plutôt que rattachées à une
    // variante devinée.
    const aRemettre = commande.lignes.filter((l) => l.varianteId !== null);
    await tx.lignePanier.createMany({
      data: aRemettre.map((l) => ({
        panierId: panier.id,
        produitId: l.produitId,
        varianteId: l.varianteId as string,
        quantite: l.quantite,
      })),
      skipDuplicates: true,
    });

    await rendreCodePromoTx(tx, commandeId);
  });
}

/**
 * Rend son code promo à l'acheteur quand la commande n'aboutit pas.
 *
 * Un code à usage unique est consommé au moment où la commande est créée. Si
 * celle-ci est ensuite libérée — paiement qui ne démarre pas, paiement échoué,
 * annulation — l'acheteur aurait brûlé son code sur une commande qui n'a
 * jamais existé. Le stock et le panier lui sont rendus ; le code doit l'être
 * aussi.
 *
 * Supprimer la ligne d'utilisation libère du même coup une place dans le quota
 * de la campagne, ce qui est le comportement voulu : rien n'a été vendu.
 */
async function rendreCodePromoTx(
  tx: Prisma.TransactionClient,
  commandeId: string,
): Promise<void> {
  // `deleteMany` et non `delete` : la plupart des commandes n'ont aucun code,
  // et l'absence de ligne ne doit pas lever d'erreur.
  await tx.utilisationCodePromo.deleteMany({ where: { commandeId } });
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
  /** Opérateur Mobile Money, pour les fournisseurs qui débitent directement. */
  operateur?: string;
}

export type ResultatReprise =
  /** `urlPaiement` à null : le client valide sur son téléphone, sans quitter NILE. */
  | { ok: true; urlPaiement: string | null }
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
      operateur: options.operateur,
    });
    await memoriserReferenceFournisseur(paiement.id, demarrage.referenceFournisseur);
    return { ok: true, urlPaiement: demarrage.urlPaiement };
  } catch (erreur) {
    console.error("reprendrePaiement:", erreur);
    return { ok: false, code: "ERREUR" };
  }
}

/**
 * Conserve la référence attribuée par le fournisseur de paiement.
 *
 * C'est elle qui permet de retrouver NOTRE paiement quand un webhook arrive
 * sans nous renvoyer notre propre identifiant. Sans ce lien, une notification
 * authentique resterait inexploitable.
 */
async function memoriserReferenceFournisseur(
  paiementId: string,
  reference: string | undefined,
): Promise<void> {
  if (!reference) return;
  try {
    await prisma.paiement.update({
      where: { id: paiementId },
      data: { reference },
    });
  } catch (erreur) {
    // Ne doit jamais faire échouer un paiement déjà initié chez le
    // fournisseur : le webhook pourra encore retomber sur nos pieds via la
    // métadonnée `reference_interne`.
    console.error("[paiement] référence fournisseur non enregistrée:", erreur);
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

      await restituerStockTx(tx, commande.lignes);

      // Le stock lui est rendu : son code promo aussi.
      await rendreCodePromoTx(tx, commandeId);
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
