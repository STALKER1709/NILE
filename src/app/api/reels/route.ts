import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const demande = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Number.isFinite(demande) ? Math.min(30, Math.max(1, demande)) : 20;
    const utilisateur = await getUtilisateurCourant();

    const publications = await prisma.publication.findMany({
      where: { statut: "ACTIF" },
      orderBy: { dateCreation: "desc" },
      take: limit,
      include: {
        medias: { orderBy: { ordre: "asc" } },
        produits: {
          where: { produit: { statut: "ACTIF" } },
          include: {
            produit: { select: { id: true, slug: true, titre: true, prix: true } },
          },
        },
        vendeur: { select: { id: true, nomBoutique: true } },
        // N'expose que le like de l'utilisateur courant, jamais l'identité
        // de tous les acheteurs qui ont aimé cette publication.
        likes: {
          where: { utilisateurId: utilisateur?.id ?? "" },
          select: { id: true },
        },
        _count: { select: { likes: true, commentaires: true, partages: true } },
      },
    });

    return NextResponse.json({ ok: true, publications });
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
