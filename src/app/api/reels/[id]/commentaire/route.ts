import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluerAcces, getUtilisateurCourant } from "@/modules/auth/access";
import { consommerTentative } from "@/modules/securite/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utilisateur = await getUtilisateurCourant();

  if (!utilisateur) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }
  if (evaluerAcces(utilisateur, ["ACHETEUR", "VENDEUR", "ADMIN"]) !== "OK") {
    return NextResponse.json({ ok: false, error: "Compte suspendu ou accès interdit" }, { status: 403 });
  }

  const limite = await consommerTentative(`reel-commentaire:${utilisateur.id}`, 10, 10);
  if (!limite.autorise) {
    return NextResponse.json({ ok: false, error: "Trop de commentaires. Réessaie plus tard." }, { status: 429 });
  }

  try {
    const publication = await prisma.publication.findFirst({ where: { id, statut: "ACTIF" }, select: { id: true } });
    if (!publication) return NextResponse.json({ ok: false, error: "Publication introuvable" }, { status: 404 });
    const body = await req.json();
    const contenu = typeof body?.contenu === "string" ? body.contenu.trim() : "";

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
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
