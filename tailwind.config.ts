import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marque : vert « NILE » (confiance, calme) + accent ambre pour prix/CTA.
        nile: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          DEFAULT: "#0f766e",
          700: "#0f766e",
          dark: "#0b5850",
          800: "#115e59",
          900: "#0a3d38",
          950: "#06231f",
        },
        accent: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        // Prix de vente / promotions : rouge chaud « marketplace » (type Amazon/Alibaba).
        promo: {
          DEFAULT: "#b12704",
          dark: "#8a1e03",
        },
      },
      boxShadow: {
        carte: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        flottant: "0 8px 24px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
