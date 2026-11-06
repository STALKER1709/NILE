import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Plan du site pour les moteurs de recherche : pages publiques + catalogue. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const statiques: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/boutiques`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/promotions`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/reels`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/aide`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/conditions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [produits, vendeurs, categories, villes] = await Promise.all([
    prisma.produit.findMany({
      where: { statut: "ACTIF", vendeur: { statutValidation: "VALIDE" } },
      select: { slug: true, dateMaj: true },
      orderBy: { dateMaj: "desc" },
      take: 5000,
    }),
    prisma.vendeur.findMany({
      where: { statutValidation: "VALIDE" },
      select: { id: true, dateMaj: true },
      orderBy: { dateMaj: "desc" },
      take: 2000,
    }),
    prisma.categorie.findMany({
      where: { produits: { some: { statut: "ACTIF", vendeur: { statutValidation: "VALIDE" } } } },
      select: { slug: true, dateCreation: true },
      orderBy: { dateCreation: "desc" },
    }),
    prisma.vendeur.findMany({
      where: {
        statutValidation: "VALIDE",
        OR: [
          { localisationPublique: { contains: "Yaoundé", mode: "insensitive" } },
          { localisationPublique: { contains: "Yaounde", mode: "insensitive" } },
          { localisationPublique: { contains: "Douala", mode: "insensitive" } },
        ],
      },
      select: { localisationPublique: true },
    }),
  ]);

  return [
    ...statiques,
    ...categories.map((c) => ({
      url: `${base}/categorie/${c.slug}`,
      lastModified: c.dateCreation,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(villes.some((v) => /yaoundé|yaounde/i.test(v.localisationPublique ?? "")) ? [{ url: `${base}/yaounde`, changeFrequency: "daily" as const, priority: 0.75 }] : []),
    ...(villes.some((v) => /douala/i.test(v.localisationPublique ?? "")) ? [{ url: `${base}/douala`, changeFrequency: "daily" as const, priority: 0.75 }] : []),
    ...vendeurs.map((v) => ({
      url: `${base}/boutique/${v.id}`,
      lastModified: v.dateMaj,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...produits.map((p) => ({
      url: `${base}/produit/${p.slug}`,
      lastModified: p.dateMaj,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
