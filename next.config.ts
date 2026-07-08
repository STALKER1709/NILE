import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les images des produits seront servies depuis un stockage managé (Supabase Storage
  // ou Cloudinary). On déclarera ici les domaines autorisés quand le stockage sera branché.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
