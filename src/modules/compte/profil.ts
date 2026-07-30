import { prisma } from "@/lib/db";
import type {
  BoutiqueInput,
  InfosPaiementInput,
  ProfilInput,
} from "@/validators/auth";

/**
 * Édition du profil utilisateur et, pour un vendeur, de sa boutique.
 *
 * Toutes les écritures sont bornées à l'identifiant de l'utilisateur courant,
 * jamais à un identifiant venu du client : un acheteur ne peut donc pas
 * modifier le profil ni la boutique d'un tiers.
 */

export async function mettreAJourProfil(
  utilisateurId: string,
  input: ProfilInput,
): Promise<void> {
  await prisma.utilisateur.update({
    where: { id: utilisateurId },
    data: { nom: input.nom, telephone: input.telephone },
  });
}

export type ResultatBoutique = { ok: true } | { ok: false; code: "INTROUVABLE" };

/** Met à jour la boutique du vendeur rattaché à cet utilisateur. */
export async function mettreAJourBoutique(
  utilisateurId: string,
  input: BoutiqueInput,
): Promise<ResultatBoutique> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId },
    select: { id: true },
  });
  if (!vendeur) return { ok: false, code: "INTROUVABLE" };

  await prisma.vendeur.update({
    where: { id: vendeur.id },
    data: {
      nomBoutique: input.nomBoutique,
      description: input.description ?? null,
    },
  });
  return { ok: true };
}

/**
 * Coordonnées de reversement, stockées dans le champ JSON `Vendeur.infosPaiement`.
 * Aucun secret n'y est conservé : uniquement des numéros Mobile Money que le
 * vendeur communique volontairement pour être payé.
 */
export interface InfosPaiementVendeur {
  momoMtn?: string;
  momoOrange?: string;
  titulaire?: string;
}

/** Lit les coordonnées de reversement, en tolérant un JSON absent ou malformé. */
export function lireInfosPaiement(brut: unknown): InfosPaiementVendeur {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return {};
  const o = brut as Record<string, unknown>;
  const texte = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  return {
    momoMtn: texte(o.momoMtn),
    momoOrange: texte(o.momoOrange),
    titulaire: texte(o.titulaire),
  };
}

/** Vrai si au moins un numéro de reversement est renseigné. */
export function aDesInfosPaiement(infos: InfosPaiementVendeur): boolean {
  return Boolean(infos.momoMtn || infos.momoOrange);
}

export async function mettreAJourInfosPaiement(
  utilisateurId: string,
  input: InfosPaiementInput,
): Promise<ResultatBoutique> {
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId },
    select: { id: true },
  });
  if (!vendeur) return { ok: false, code: "INTROUVABLE" };

  // Les clés absentes ne sont pas écrites, pour garder le JSON minimal.
  // Record<string, string> et non InfosPaiementVendeur : Prisma exige une
  // signature d'index pour une valeur JSON.
  const infos: Record<string, string> = {};
  if (input.momoMtn) infos.momoMtn = input.momoMtn;
  if (input.momoOrange) infos.momoOrange = input.momoOrange;
  if (input.titulaire) infos.titulaire = input.titulaire;

  await prisma.vendeur.update({
    where: { id: vendeur.id },
    data: { infosPaiement: infos },
  });
  return { ok: true };
}

/** Boutique du vendeur rattaché à cet utilisateur (édition côté vendeur). */
export async function getBoutiqueDuVendeur(utilisateurId: string) {
  return prisma.vendeur.findUnique({
    where: { utilisateurId },
    select: {
      id: true,
      nomBoutique: true,
      description: true,
      statutValidation: true,
      infosPaiement: true,
    },
  });
}
