import { formaterXAF } from "@/lib/money";

/**
 * Construction PURE du contenu des emails de commande (testable sans I/O).
 * Texte brut d'abord (data mobile chère, clients mail légers) + HTML minimal.
 */

export interface LigneEmail {
  titreProduit: string;
  quantite: number;
  sousTotal: number;
  vendeurId: string;
}

export interface CommandePourEmail {
  numero: string;
  total: number;
  modePaiement: "COD" | "MONETBIL";
  lignes: LigneEmail[];
  destNom: string;
  destTelephone: string;
  ville: string;
  quartier: string;
  reperes?: string | null;
}

function listeLignes(lignes: LigneEmail[]): string {
  return lignes
    .map((l) => `  - ${l.titreProduit} × ${l.quantite} = ${formaterXAF(l.sousTotal)}`)
    .join("\n");
}

function libelleMode(mode: "COD" | "MONETBIL"): string {
  return mode === "COD"
    ? "Paiement à la livraison (espèces)"
    : "Mobile Money (payé)";
}

function enHtml(texte: string): string {
  const echappe = texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<div style="font-family:system-ui,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-line">${echappe}</div>`;
}

/** Email de confirmation envoyé à l'ACHETEUR. */
export function construireEmailAcheteur(
  commande: CommandePourEmail,
  nomAcheteur: string,
): { sujet: string; texte: string; html: string } {
  const sujet = `Commande ${commande.numero} confirmée — ${formaterXAF(commande.total)}`;
  const texte = `Bonjour ${nomAcheteur},

Ta commande ${commande.numero} est confirmée. Merci pour ta confiance !

Articles :
${listeLignes(commande.lignes)}

Total : ${formaterXAF(commande.total)}
Mode de paiement : ${libelleMode(commande.modePaiement)}

Livraison :
  ${commande.destNom} — ${commande.destTelephone}
  ${commande.quartier}, ${commande.ville}${commande.reperes ? `\n  Repères : ${commande.reperes}` : ""}

Tu peux suivre ta commande dans « Mes commandes » sur NILE.

— NILE Marketplace`;
  return { sujet, texte, html: enHtml(texte) };
}

/**
 * Email envoyé à UN VENDEUR : uniquement SES lignes (commande multi-vendeurs),
 * avec les informations nécessaires pour préparer et livrer.
 */
export function construireEmailVendeur(
  commande: CommandePourEmail,
  vendeurId: string,
  nomBoutique: string,
): { sujet: string; texte: string; html: string } | null {
  const lignes = commande.lignes.filter((l) => l.vendeurId === vendeurId);
  if (lignes.length === 0) return null;
  const totalVendeur = lignes.reduce((s, l) => s + l.sousTotal, 0);

  const sujet = `Nouvelle commande ${commande.numero} à préparer — ${formaterXAF(totalVendeur)}`;
  const texte = `Bonjour ${nomBoutique},

Bonne nouvelle : tu as une nouvelle commande à préparer sur NILE.

Commande ${commande.numero} — tes articles :
${listeLignes(lignes)}

Total de tes articles : ${formaterXAF(totalVendeur)}
Mode de paiement : ${libelleMode(commande.modePaiement)}

Livraison :
  ${commande.destNom} — ${commande.destTelephone}
  ${commande.quartier}, ${commande.ville}${commande.reperes ? `\n  Repères : ${commande.reperes}` : ""}

Prépare les articles puis mets à jour le statut dans ton espace vendeur.

— NILE Marketplace`;
  return { sujet, texte, html: enHtml(texte) };
}

/** Identifiants (uniques) des vendeurs concernés par une commande. */
export function vendeursDeLaCommande(lignes: LigneEmail[]): string[] {
  return [...new Set(lignes.map((l) => l.vendeurId))];
}
