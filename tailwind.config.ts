import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // NILE trading-floor palette: cobalt, warm paper and conversion orange.
      colors: {
        nile: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          500: "#3b5bb5",
          600: "#29479f",
          DEFAULT: "#1e3a8a",
          700: "#1e3a8a",
          dark: "#14265d",
          800: "#14265d",
          900: "#101d45",
          950: "#0b1430",
          conteneur: "#1e3a8a",
          surConteneur: "#dbe5ff",
        },
        accent: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          deep: "#92400e",
          sur: "#78350f",
          fixe: "#fff0cc",
        },
        promo: {
          DEFAULT: "#b42318",
          dark: "#7a271a",
          deep: "#7a271a",
          conteneur: "#fee4e2",
        },
        surface: {
          DEFAULT: "#f8f7f3",
          basse: "#f0efe9",
          moyenne: "#e7e5df",
          haute: "#dedbd2",
          extreme: "#d3d0c7",
          subtile: "#f4f3ee",
          inverse: "#111827",
        },
        contour: {
          DEFAULT: "#667085",
          clair: "#c9c6bd",
          carte: "#e7e5df",
        },
        tertiaire: {
          DEFAULT: "#242f41",
          conteneur: "#3a4558",
          fixe: "#d8e3fb",
        },
      },
      // Typography tokens retained for pages that have not migrated yet.
      fontFamily: {
        titre: ["var(--police-titre)", "system-ui", "sans-serif"],
        sans: ["var(--police-corps)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "titre-md": ["30px", { lineHeight: "38px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "titre-sm": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "corps-lg": ["18px", { lineHeight: "28px" }],
        "corps-md": ["16px", { lineHeight: "24px" }],
        "corps-sm": ["14px", { lineHeight: "20px" }],
        "etiquette-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "etiquette-xs": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      boxShadow: {
        carte: "none",
        "carte-hover": "0 4px 12px 0 rgba(30, 58, 138, 0.04)",
        flottant: "0 8px 24px -4px rgba(30, 58, 138, 0.10)",
        modale: "0 24px 60px -12px rgba(20, 38, 93, 0.22)",
      },
      // Forme « arrondi maîtrisé » : 8px de base, conteneurs jusqu'à 1,5rem.
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        xl2: "1.5rem",
      },
      spacing: {
        base: "8px",
        gouttiere: "24px",
        "pile-sm": "8px",
        "pile-md": "16px",
        "pile-lg": "32px",
        section: "80px",
      },
      maxWidth: {
        conteneur: "1280px",
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
        // Pulsation discrète : signale l'étape en cours d'un suivi de commande
        // sans attirer l'œil comme un clignotement.
        "pulse-douce": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fondu-haut": "fondu-haut .5s ease-out both",
        fondu: "fondu .4s ease-out both",
        apparition: "apparition .3s ease-out both",
        pop: "pop .35s ease-out",
        brillance: "brillance 1.5s infinite",
        "pulse-douce": "pulse-douce 3s cubic-bezier(.4,0,.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
