import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const publications = await prisma.publication.findMany({
      where: { statut: "ACTIF" },
      orderBy: { dateCreation: "desc" },
      take: limit,
      include: {
        medias: { orderBy: { ordre: "asc" } },
        produits: {
          include: {
            produit: {
              select: { id: true, slug: true, titre: true, prix: true },
            },
          },
        },
        vendeur: { select: { id: true, nomBoutique: true } },
        _count: { select: { likes: true, commentaires: true, partages: true } },
      },
    });
    
    return NextResponse.json({ ok: true, publications });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
