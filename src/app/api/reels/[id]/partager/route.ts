import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utilisateur = await getUtilisateurCourant();
  
  try {
    const publication = await prisma.publication.findFirst({ where: { id, statut: "ACTIF" }, select: { id: true } });
    if (!publication) return NextResponse.json({ ok: false, error: "Publication introuvable" }, { status: 404 });
    const body = await req.json();
    const canauxAutorises = new Set(["whatsapp", "facebook", "copier", "autre"]);
    const canal = typeof body?.canal === "string" ? body.canal : "whatsapp";
    if (!canauxAutorises.has(canal)) return NextResponse.json({ ok: false, error: "Canal invalide" }, { status: 400 });

    await prisma.publicationPartage.create({
      data: {
        publicationId: id,
        utilisateurId: utilisateur?.id || null,
        canal,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
