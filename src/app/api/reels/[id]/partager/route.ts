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
    const body = await req.json();
    const canal = body.canal || "whatsapp";

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
