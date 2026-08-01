import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getCodeReception } from "@/modules/livraison/reception";

/**
 * Code de réception courant de l'acheteur, renouvelé toutes les 30 secondes.
 *
 * Le QR est rendu ICI, côté serveur : le navigateur ne télécharge aucune
 * bibliothèque d'encodage, seulement ~1,5 Ko de SVG par renouvellement. La
 * data mobile est chère au Cameroun, la page de suivi doit rester légère.
 *
 * L'autorisation est déléguée à `getCodeReception`, qui ne retrouve la
 * commande que par (id, acheteurId) : personne ne peut obtenir le code d'un
 * tiers et faire valider sa livraison à sa place.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const utilisateur = await getUtilisateurCourant();
  if (!utilisateur) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const res = await getCodeReception(utilisateur.id, id);
  if (!res.ok) {
    return NextResponse.json({ ok: false, code: res.code }, { status: 404 });
  }

  let svg: string;
  try {
    svg = await QRCode.toString(res.data.contenuQr, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch (erreur) {
    console.error("[reception] génération du QR échouée:", erreur);
    // Le code à 6 chiffres reste exploitable même sans QR : on ne prive pas
    // l'acheteur de la remise pour un échec d'encodage.
    svg = "";
  }

  return NextResponse.json(
    {
      ok: true,
      code: res.data.code,
      svg,
      secondesRestantes: res.data.secondesRestantes,
    },
    // Un code tournant ne doit jamais être mis en cache, ni par le
    // navigateur, ni par un intermédiaire.
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
