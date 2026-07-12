import type { MetadataRoute } from "next";

/** Manifeste PWA : permet « Ajouter à l'écran d'accueil » sur mobile. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NILE Marketplace",
    short_name: "NILE",
    description:
      "Marketplace du Cameroun · achats en ligne, paiement mobile et à la livraison.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#0a3d38",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
