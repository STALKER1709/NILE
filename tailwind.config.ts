import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nile: {
          50: "#eef2ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          500: "#3b60b5",
          600: "#2449a2",
          DEFAULT: "#1e3a8a",
          700: "#1e3a8a",
          dark: "#14265a",
          800: "#14265a",
          900: "#0c1734",
          950: "#081430",
          conteneur: "#142b61",
          surConteneur: "#c7d7ff",
        },
        accent: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          deep: "#8a4b08",
          sur: "#17213b",
          fixe: "#ffedc2",
        },
        promo: {
          DEFAULT: "#ba1a1a",
          dark: "#93000a",
          deep: "#93000a",
          conteneur: "#ffdad6",
        },
        surface: {
          DEFAULT: "#f7f9fc",
          basse: "#f1f5f9",
          moyenne: "#e8edf5",
          haute: "#e2e8f0",
          extreme: "#dbe2ec",
          subtile: "#f1f5f9",
          inverse: "#17213b",
        },
        contour: { DEFAULT: "#667085", clair: "#cbd5e1", carte: "#e2e8f0" },
        tertiaire: { DEFAULT: "#242f41", conteneur: "#3a4558", fixe: "#d8e3fb" },
      },
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
        "carte-hover": "0 8px 24px rgba(20, 38, 90, 0.08)",
        flottant: "0 8px 24px -4px rgba(20, 38, 90, 0.12)",
        modale: "0 24px 60px -12px rgba(20, 38, 90, 0.22)",
      },
      borderRadius: { sm: "0.375rem", DEFAULT: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.25rem", xl2: "1.5rem" },
      spacing: {
        base: "8px", gouttiere: "24px", "pile-sm": "8px", "pile-md": "16px",
        "pile-lg": "32px", section: "80px",
      },
      maxWidth: { conteneur: "1280px" },
      keyframes: {
        "fondu-haut": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fondu: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        apparition: { "0%": { opacity: "0", transform: "scale(.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
        brillance: { "100%": { transform: "translateX(100%)" } },
        "pulse-douce": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
      animation: {
        "fondu-haut": "fondu-haut .5s ease-out both", fondu: "fondu .4s ease-out both",
        apparition: "apparition .3s ease-out both", pop: "pop .35s ease-out",
        brillance: "brillance 1.5s infinite", "pulse-douce": "pulse-douce 3s cubic-bezier(.4,0,.6,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
