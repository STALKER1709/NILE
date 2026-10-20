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
        blue: { 50: "#f4f6ff", 100: "#eaf0ff", 200: "#dbe4ff", 300: "#b9cbff", 400: "#8fa9ee", 500: "#5d7cd4", 600: "#3e60bd", 700: "#2849a5", 800: "#203e94", 900: "#1e3a8a", 950: "#13275e" },
        amber: { 50: "#fff9eb", 100: "#fff2d4", 200: "#ffe2a3", 300: "#ffc85b", 400: "#f59e0b", 500: "#d87900", 600: "#c87505", 700: "#a85d08", 800: "#87470f", 900: "#6e390d", 950: "#3f270f" },
        stone: { 50: "#f7f8fc", 100: "#f1f3f8", 200: "#e7eaf0", 300: "#d8dee9", 400: "#aab2c2", 500: "#6d7689", 600: "#596378", 700: "#404b61", 800: "#293449", 900: "#151d32", 950: "#0b1223" },
        slate: { 50: "#f8f9fc", 100: "#eff2f8", 200: "#e5e9f0", 300: "#d7dde8", 400: "#9aa4b5", 500: "#6d7689", 600: "#596378", 700: "#404b61", 800: "#27334a", 900: "#151d32", 950: "#10172a" },
        gray: { 50: "#f8f9fc", 100: "#eff2f8", 200: "#e5e9f0", 300: "#d7dde8", 400: "#9aa4b5", 500: "#6d7689", 600: "#596378", 700: "#404b61", 800: "#27334a", 900: "#151d32", 950: "#10172a" },
        nile: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 500: "#3b5bb5", 600: "#29479f",
          DEFAULT: "#1e3a8a", 700: "#1e3a8a", dark: "#14265d", 800: "#14265d", 900: "#101d45", 950: "#0b1430",
          conteneur: "#1e3a8a", surConteneur: "#dbe5ff",
        },
        accent: { DEFAULT: "#f59e0b", dark: "#d97706", deep: "#92400e", sur: "#78350f", fixe: "#fff0cc" },
        promo: { DEFAULT: "#b42318", dark: "#7a271a", deep: "#7a271a", conteneur: "#fee4e2" },
        surface: { DEFAULT: "#f7f8fc", basse: "#f1f3f8", moyenne: "#e7eaf0", haute: "#d8dee9", extreme: "#c9d1df", subtile: "#f8f9fc", inverse: "#101f4d" },
        contour: { DEFAULT: "#6d7689", clair: "#d8dee9", carte: "#e7eaf0" },
        tertiaire: { DEFAULT: "#151d32", conteneur: "#404b61", fixe: "#dbe4ff" },
      },
      // Typography tokens retained for pages that have not migrated yet.
      fontFamily: {
        titre: ["var(--police-titre)", "system-ui", "sans-serif"],
        sans: ["var(--police-corps)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["54px", { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-mobile": ["35px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "titre-md": ["30px", { lineHeight: "38px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "titre-sm": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "corps-lg": ["18px", { lineHeight: "28px" }],
        "corps-md": ["16px", { lineHeight: "24px" }],
        "corps-sm": ["14px", { lineHeight: "20px" }],
        "etiquette-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "etiquette-xs": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      boxShadow: {
        carte: "0 6px 22px rgba(20, 35, 73, 0.07)",
        "carte-hover": "0 14px 40px rgba(20, 35, 73, 0.08)",
        flottant: "0 8px 24px -4px rgba(30, 58, 138, 0.10)",
        modale: "0 24px 60px -12px rgba(20, 38, 93, 0.22)",
      },
      // Forme « arrondi maîtrisé » : 8px de base, conteneurs jusqu'à 1,5rem.
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.0625rem",
        "3xl": "1.75rem",
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
        conteneur: "1240px",
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
