import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const utilisateur = await getUtilisateurCourant();
    const publication = await prisma.publication.findFirst({
      where: { id, statut: "ACTIF" },
      include: {
        medias: { orderBy: { ordre: "asc" } },
        produits: {
          where: { produit: { statut: "ACTIF" } },
          include: {
            produit: { select: { id: true, slug: true, titre: true, prix: true } },
          },
        },
        likes: {
          where: { utilisateurId: utilisateur?.id ?? "" },
          select: { id: true },
        },
        commentaires: {
          where: { statut: "ACTIF" },
          include: { utilisateur: { select: { id: true, nom: true } } },
          orderBy: { dateCreation: "desc" },
          take: 100,
        },
        _count: { select: { likes: true, commentaires: true, partages: true } },
      },
    });

    if (!publication) {
      return NextResponse.json({ ok: false, error: "Publication introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, publication });
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
