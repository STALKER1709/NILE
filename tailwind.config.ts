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
      // Animations légères (transform/opacity uniquement, fluides sur mobile).
      // Désactivées automatiquement si l'utilisateur préfère moins d'animation
      // (voir la règle prefers-reduced-motion dans globals.css).
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
