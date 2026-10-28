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

  const limite = await consommerTentative(`reel-like:${utilisateur.id}`, 60, 10);
  if (!limite.autorise) return NextResponse.json({ ok: false, error: "Trop de requêtes. Réessaie plus tard." }, { status: 429 });

  try {
    const publication = await prisma.publication.findFirst({ where: { id, statut: "ACTIF" }, select: { id: true } });
    if (!publication) return NextResponse.json({ ok: false, error: "Publication introuvable" }, { status: 404 });
    const existing = await prisma.publicationLike.findUnique({
      where: {
        publicationId_utilisateurId: {
          publicationId: id,
          utilisateurId: utilisateur.id,
        },
      },
    });

    if (existing) {
      await prisma.publicationLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, liked: false });
    }

    await prisma.publicationLike.create({
      data: {
        publicationId: id,
        utilisateurId: utilisateur.id,
      },
    });
    return NextResponse.json({ ok: true, liked: true });
  } catch {
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
    const publication = await prisma.publication.findFirst({ where: { id, statut: "ACTIF" }, select: { id: true } });
    if (!publication) return NextResponse.json({ ok: false, error: "Publication introuvable" }, { status: 404 });
    const count = await prisma.publicationLike.count({ where: { publicationId: id } });
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
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
