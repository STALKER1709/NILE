import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Incrémente uniquement les fiches publiées.
 * Le compteur est agrégé : aucun identifiant ou renseignement personnel
 * n'est conservé pour mesurer l'audience des vendeurs.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resultat = await prisma.produit.updateMany({
    where: { id, statut: "ACTIF" },
    data: { nombreVues: { increment: 1 } },
  });

  return NextResponse.json(
    { ok: resultat.count === 1 },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
