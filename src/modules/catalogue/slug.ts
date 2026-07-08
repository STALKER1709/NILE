import { randomBytes } from "node:crypto";

/**
 * Transforme un texte en "slug" utilisable dans une URL.
 * Ex : "Téléphone Samsung A54 !" -> "telephone-samsung-a54"
 * Fonction PURE (testable).
 */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tout le reste -> tiret
    .replace(/^-+|-+$/g, "") // enlève les tirets en trop
    .slice(0, 80);
}

/**
 * Slug de produit avec suffixe aléatoire pour garantir l'unicité sans
 * dépendre d'un aller-retour en base.
 */
export function genererSlugProduit(titre: string): string {
  const base = slugifier(titre) || "produit";
  const suffixe = randomBytes(3).toString("hex"); // 6 caractères
  return `${base}-${suffixe}`;
}
