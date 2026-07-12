import { NextResponse } from "next/server";
import { suggererProduits } from "@/modules/catalogue/produits";
import { rechercherBoutiques } from "@/modules/catalogue/boutiques";

/**
 * Suggestions d'autocomplétion de recherche : produits (par titre) et boutiques
 * (par nom). Public, lecture seule, réponses courtes. Renvoie des listes vides
 * pour un terme trop court.
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const [produits, boutiques] = await Promise.all([
      suggererProduits(q, 6),
      rechercherBoutiques(q, 4),
    ]);
    return NextResponse.json({
      produits: produits.map((p) => ({
        slug: p.slug,
        titre: p.titre,
        prix: p.prix,
        image: p.images[0]?.url ?? null,
      })),
      boutiques,
    });
  } catch (erreur) {
    console.error("[suggestions] erreur:", erreur);
    return NextResponse.json({ produits: [], boutiques: [] });
  }
}
