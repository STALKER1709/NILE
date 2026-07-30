import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Jeu de couleurs « Lumina Nile » (voir DESIGN.md).
      colors: {
        // Vert de marque : primaire profond + conteneur, déclinés en échelle
        // pour les fonds, bordures et états survolés.
        nile: {
          50: "#eef6f4",
          100: "#d3e9e5",
          200: "#b2eee3", // primary-fixed
          300: "#97d2c7", // primary-fixed-dim / inverse-primary
          500: "#2d685f", // surface-tint
          600: "#0f5048", // on-primary-fixed-variant
          DEFAULT: "#0a4d45", // primary-container
          700: "#0a4d45",
          dark: "#00352f",
          800: "#00352f", // primary
          900: "#00201c", // on-primary-fixed
          950: "#062c29", // nile-deep
          conteneur: "#0a4d45",
          surConteneur: "#82bdb2",
        },
        // Or d'action : réservé aux points de conversion (usage parcimonieux).
        accent: {
          DEFAULT: "#fea619", // secondary-container
          dark: "#d97706", // accent-gold
          deep: "#855300", // secondary
          sur: "#684000", // on-secondary-container
          fixe: "#ffddb8",
        },
        // Erreur / urgence (prix barrés, ruptures).
        promo: {
          DEFAULT: "#ba1a1a", // error
          dark: "#93000a", // on-error-container
          deep: "#93000a",
          conteneur: "#ffdad6",
        },
        // Surfaces et texte : spectre « slate » froid.
        surface: {
          DEFAULT: "#f7f9fb",
          basse: "#f2f4f6",
          moyenne: "#eceef0",
          haute: "#e6e8ea",
          extreme: "#e0e3e5",
          subtile: "#f1f5f9",
          inverse: "#2d3133",
        },
        contour: {
          DEFAULT: "#707976",
          clair: "#bfc9c5",
          carte: "#e2e8f0",
        },
        tertiaire: {
          DEFAULT: "#242f41",
          conteneur: "#3a4558",
          fixe: "#d8e3fb",
        },
      },
      fontFamily: {
        // Titres : géométrie contemporaine. Corps : lisibilité systématique.
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
      // Profondeur par couches tonales : surface = bordure seule (niveau 1),
      // ombre ambiante teintée réservée aux états survolés (niveau 2).
      boxShadow: {
        carte: "none",
        "carte-hover": "0 4px 12px 0 rgba(10, 77, 69, 0.04)",
        flottant: "0 8px 24px -4px rgba(10, 77, 69, 0.10)",
        modale: "0 24px 60px -12px rgba(10, 77, 69, 0.22)",
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
