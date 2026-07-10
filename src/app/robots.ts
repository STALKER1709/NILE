import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** Indexation : pages publiques oui, espaces privés et parcours d'achat non. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/vendeur",
        "/compte",
        "/panier",
        "/commander",
        "/commandes",
        "/paiement",
        "/auth",
        "/api",
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
