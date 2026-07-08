import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthProvider } from "@/modules/auth";
import type { InscriptionInput, ConnexionInput } from "@/validators/auth";

export type ResultatInscription =
  | { ok: true }
  | { ok: false; code: "EMAIL_DEJA_UTILISE" | "ERREUR" };

export type ResultatConnexion =
  | { ok: true }
  | { ok: false; code: "IDENTIFIANTS_INVALIDES" | "SUSPENDU" | "ERREUR" };

/**
 * Inscription : crée l'identité d'auth PUIS le profil applicatif dans une
 * transaction (Utilisateur + Panier + Vendeur si besoin). Connecte ensuite.
 *
 * Cas limites gérés :
 *  - email déjà pris (côté fournisseur ou contrainte d'unicité en base),
 *  - échec de création du profil après signUp -> on supprime l'identité orpheline.
 */
export async function inscrireUtilisateur(
  input: InscriptionInput,
): Promise<ResultatInscription> {
  const provider = getAuthProvider();

  const signUp = await provider.signUp(input.email, input.motDePasse);
  if (!signUp.ok) {
    if (signUp.error === "EMAIL_DEJA_UTILISE") {
      return { ok: false, code: "EMAIL_DEJA_UTILISE" };
    }
    console.error("[inscription] échec signUp fournisseur:", signUp.error);
    return { ok: false, code: "ERREUR" };
  }
  const authId = signUp.data.authId;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.utilisateur.create({
        data: {
          id: authId,
          nom: input.nom,
          telephone: input.telephone,
          email: input.email,
          role: input.role,
          panier: { create: {} },
          ...(input.role === "VENDEUR"
            ? {
                vendeur: {
                  create: {
                    nomBoutique: input.nomBoutique ?? input.nom,
                    statutValidation: "EN_ATTENTE",
                  },
                },
              }
            : {}),
        },
      });
    });
  } catch (erreur) {
    // Profil non créé : on retire l'identité d'auth pour ne pas laisser d'orphelin.
    await provider.deleteIdentity(authId);
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, code: "EMAIL_DEJA_UTILISE" };
    }
    console.error("[inscription] échec création profil:", erreur);
    return { ok: false, code: "ERREUR" };
  }

  const signIn = await provider.signIn(input.email, input.motDePasse);
  if (!signIn.ok) {
    // Compte créé mais session non établie : l'utilisateur pourra se connecter.
    console.error("[inscription] échec signIn après création:", signIn.error);
    return { ok: false, code: "ERREUR" };
  }
  return { ok: true };
}

/**
 * Connexion : vérifie les identifiants, puis bloque un compte suspendu.
 */
export async function connecterUtilisateur(
  input: ConnexionInput,
): Promise<ResultatConnexion> {
  const provider = getAuthProvider();
  const signIn = await provider.signIn(input.email, input.motDePasse);
  if (!signIn.ok) {
    return { ok: false, code: "IDENTIFIANTS_INVALIDES" };
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: signIn.data.authId },
  });
  if (!utilisateur) {
    // Identité sans profil (incohérence) : on referme la session.
    await provider.signOut();
    return { ok: false, code: "ERREUR" };
  }
  if (utilisateur.statut === "SUSPENDU") {
    await provider.signOut();
    return { ok: false, code: "SUSPENDU" };
  }
  return { ok: true };
}

export async function deconnecterUtilisateur(): Promise<void> {
  await getAuthProvider().signOut();
}
