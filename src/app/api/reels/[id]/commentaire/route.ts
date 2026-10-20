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
    const body = await req.json();
    const contenu = body.contenu?.trim();
    
    if (!contenu || contenu.length === 0) {
      return NextResponse.json({ ok: false, error: "Commentaire vide" }, { status: 400 });
    }
    if (contenu.length > 500) {
      return NextResponse.json({ ok: false, error: "Commentaire trop long" }, { status: 400 });
    }

    const commentaire = await prisma.publicationCommentaire.create({
      data: {
        publicationId: id,
        utilisateurId: utilisateur.id,
        contenu,
      },
      include: {
        utilisateur: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json({ ok: true, commentaire });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
