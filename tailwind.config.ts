import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marque : vert « NILE » (confiance, calme, émeraude) + accent ambre pour CTA.
        nile: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          500: "#14b8a6",
          600: "#0d9488",
          DEFAULT: "#0f766e",
          700: "#0f766e",
          dark: "#0b5850",
          800: "#115e59",
          900: "#0a3d38",
          950: "#042f2e",
        },
        accent: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          light: "#fbbf24",
        },
        // Prix de vente / promotions : rouge chaud marketplace.
        promo: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          deep: "#b91c1c",
        },
      },
      boxShadow: {
        carte: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "carte-hover": "0 10px 25px -5px rgba(15, 118, 110, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        flottant: "0 12px 32px -4px rgba(15, 118, 110, 0.18)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        "fondu-haut": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fondu: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        apparition: {
          "0%": { opacity: "0", transform: "scale(.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        brillance: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fondu-haut": "fondu-haut .5s ease-out both",
        fondu: "fondu .4s ease-out both",
        apparition: "apparition .3s ease-out both",
        pop: "pop .35s ease-out",
        brillance: "brillance 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
