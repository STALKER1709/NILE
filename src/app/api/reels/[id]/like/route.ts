import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utilisateur = await getUtilisateurCourant();
  
  if (!utilisateur) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }

  try {
    const existing = await prisma.publicationLike.findUnique({
      where: {
        publicationId_utilisateurId: {
          publicationId: id,
          utilisateurId: utilisateur.id,
        },
      },
    });

    if (existing) {
      await prisma.publicationLike.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ ok: true, liked: false });
    } else {
      await prisma.publicationLike.create({
        data: {
          publicationId: id,
          utilisateurId: utilisateur.id,
        },
      });
      return NextResponse.json({ ok: true, liked: true });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utilisateur = await getUtilisateurCourant();
  
  try {
    const count = await prisma.publicationLike.count({
      where: { publicationId: id },
    });
    let liked = false;
    if (utilisateur) {
      const existing = await prisma.publicationLike.findUnique({
        where: {
          publicationId_utilisateurId: {
            publicationId: id,
            utilisateurId: utilisateur.id,
          },
        },
      });
      liked = !!existing;
    }
    return NextResponse.json({ ok: true, count, liked });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
