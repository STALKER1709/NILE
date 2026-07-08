import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les images des produits seront servies depuis un stockage managé (Supabase Storage
  // ou Cloudinary). On déclarera ici les domaines autorisés quand le stockage sera branché.
  images: {
    remotePatterns: [],
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
