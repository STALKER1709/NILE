import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const publication = await prisma.publication.findUnique({
      where: { id },
      include: {
        medias: { orderBy: { ordre: "asc" } },
        produits: {
          include: {
            produit: {
              select: { id: true, slug: true, titre: true, prix: true },
            },
          },
        },
        likes: true,
        commentaires: {
          where: { statut: "ACTIF" },
          include: {
            utilisateur: { select: { id: true, nom: true } },
          },
          orderBy: { dateCreation: "desc" },
        },
        _count: { select: { likes: true, commentaires: true, partages: true } },
      },
    });
    return NextResponse.json({ ok: true, publication });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
