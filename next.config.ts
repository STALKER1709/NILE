import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // La compression gzip intégrée de `next start` bufferise les réponses en
  // flux des Server Actions (la réponse n'arrive jamais au navigateur). En
  // production sur Vercel, la compression est faite par leur proxy de bord,
  // donc la désactiver ici ne coûte rien.
  compress: false,
  // Les images des produits seront servies depuis un stockage managé (Supabase Storage
  // ou Cloudinary). On déclarera ici les domaines autorisés quand le stockage sera branché.
  images: {
    // Autorise l'optimisation des images produit servies par Supabase Storage
    // (et par tout projet *.supabase.co). Le local /uploads est déjà même-origine.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Autorise l'upload de quelques images (2 Mo max chacune) via Server Actions.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  // En-têtes de sécurité de base appliqués à toutes les réponses.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
