import { NextResponse } from "next/server";
import { suggererProduits } from "@/modules/catalogue/produits";

/**
 * Suggestions d'autocomplétion de recherche (produits par titre).
 * Public, lecture seule, réponses courtes. Renvoie [] pour un terme trop court.
 */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const produits = await suggererProduits(q, 6);
    return NextResponse.json({
      produits: produits.map((p) => ({
        slug: p.slug,
        titre: p.titre,
        prix: p.prix,
        image: p.images[0]?.url ?? null,
      })),
    });
  } catch (erreur) {
    console.error("[suggestions] erreur:", erreur);
    return NextResponse.json({ produits: [] });
  }
}
