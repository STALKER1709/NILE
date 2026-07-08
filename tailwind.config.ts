import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette de départ, volontairement sobre (pages légères, contraste lisible).
        nile: {
          DEFAULT: "#0f766e",
          dark: "#0b5850",
        },
      },
    },
  },
  plugins: [],
};

export default config;
