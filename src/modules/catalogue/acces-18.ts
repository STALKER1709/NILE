import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const NOM_COOKIE = "nile-majorite";
const DUREE_SECONDES = 60 * 60 * 24 * 30;
const VALEUR = "confirmee-v1";

function secret(): string {
  const valeur = env.SUPABASE_SERVICE_ROLE_KEY ?? env.CRON_SECRET ?? env.MOCK_AUTH_SECRET;
  if (!valeur) throw new Error("Secret serveur indisponible pour le contrôle d'âge.");
  return valeur;
}

function signature(valeur: string): string {
  return createHmac("sha256", secret()).update(valeur).digest("hex");
}

export async function aConfirmeMajorite(): Promise<boolean> {
  const cookieStore = await cookies();
  const jeton = cookieStore.get(NOM_COOKIE)?.value ?? "";
  const attendu = signature(VALEUR);
  const fourni = jeton.length === attendu.length ? jeton : "0".repeat(attendu.length);
  return timingSafeEqual(Buffer.from(fourni), Buffer.from(attendu)) && jeton.length === attendu.length;
}

/** Identifie toute catégorie située sous « Bien-être intime », quel que soit son niveau. */
export const idsCategoriesReservees18 = cache(async (): Promise<string[]> => {
  const categories = await prisma.categorie.findMany({
    select: { id: true, slug: true, parentId: true },
  });
  const parId = new Map(categories.map((c) => [c.id, c]));
  const restreints = new Set<string>();
  for (const categorie of categories) {
    let courant: typeof categorie | undefined = categorie;
    const visites = new Set<string>();
    while (courant && !visites.has(courant.id)) {
      if (courant.slug === "bien-etre-intime") {
        restreints.add(categorie.id);
        break;
      }
      visites.add(courant.id);
      courant = courant.parentId ? parId.get(courant.parentId) : undefined;
    }
  }
  return [...restreints];
});

export async function produitEstReserve18(slug: string): Promise<boolean> {
  const produit = await prisma.produit.findUnique({
    where: { slug },
    select: { categorieId: true },
  });
  if (!produit) return false;
  const ids = await idsCategoriesReservees18();
  return ids.includes(produit.categorieId);
}

export const categorieEstReservee18 = cache(async (categorieId: string): Promise<boolean> => {
  const ids = await idsCategoriesReservees18();
  return ids.includes(categorieId);
});

export async function confirmerCookieMajorite(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NOM_COOKIE, signature(VALEUR), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SECONDES,
  });
}
