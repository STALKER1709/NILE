import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Plan du site pour les moteurs de recherche : pages publiques + catalogue. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;

  const statiques: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/conditions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const produits = await prisma.produit.findMany({
    where: { statut: "ACTIF", vendeur: { statutValidation: "VALIDE" } },
    select: { slug: true, dateMaj: true },
    orderBy: { dateMaj: "desc" },
    take: 5000,
  });

  return [
    ...statiques,
    ...produits.map((p) => ({
      url: `${base}/produit/${p.slug}`,
      lastModified: p.dateMaj,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
