import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getCommandeAcheteur } from "@/modules/commande/commande";
import {
  annulerCommandeAction,
  reprendrePaiementAction,
} from "@/app/(compte)/commandes/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, btn } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";

export const dynamic = "force-dynamic";

const ETAPES = ["CONFIRMEE", "EN_PREPARATION", "EXPEDIEE", "LIVREE"] as const;
const ETAPE_LIB: Record<(typeof ETAPES)[number], string> = {
  CONFIRMEE: "Confirmée",
  EN_PREPARATION: "Préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
};

const ALERTES: Record<string, { classe: string; texte: string }> = {
  creee: { classe: "border-emerald-200 bg-emerald-50 text-emerald-700", texte: "Commande enregistrée ! Vous paierez à la livraison." },
  paye: { classe: "border-emerald-200 bg-emerald-50 text-emerald-700", texte: "Paiement confirmé. Merci !" },
  annulee: { classe: "border-amber-200 bg-accent-fixe text-amber-800", texte: "Commande annulée. Les articles ont été remis en stock." },
  echec: { classe: "border-red-200 bg-red-50 text-red-700", texte: "Le paiement a échoué. La commande a été annulée et le stock restitué." },
};

export default async function DetailCommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const utilisateur = await exigerConnexion();
  const commande = await getCommandeAcheteur(utilisateur.id, id);
  if (!commande) notFound();

  const annulable = commande.statutCommande === "EN_ATTENTE" || commande.statutCommande === "CONFIRMEE";
  const paiementARelancer =
    commande.modePaiement === "MONETBIL" &&
    commande.statutPaiement === "EN_ATTENTE" &&
    commande.statutCommande === "EN_ATTENTE";
  const termine = commande.statutCommande === "ANNULEE" || commande.statutCommande === "REFUSEE";
  const etapeCourante = ETAPES.indexOf(commande.statutCommande as (typeof ETAPES)[number]);
  const alerte = ok ? ALERTES[ok] : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">{commande.numero}</h1>
        <Link href="/commandes" className="text-sm text-slate-500 hover:underline">← Mes commandes</Link>
      </div>

      {alerte && (
        <p className={`rounded border px-3 py-2 text-sm ${alerte.classe}`}>
          {alerte.texte}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {paiementARelancer && (
        <form action={reprendrePaiementAction}>
          <input type="hidden" name="commandeId" value={commande.id} />
          <button type="submit" className={btn("accent", "lg", "w-full")}>Payer maintenant (Mobile Money)</button>
        </form>
      )}

      {/* Statuts + chronologie */}
      <Carte className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <BadgeStatutCommande statut={commande.statutCommande} />
          <BadgeStatutPaiement statut={commande.statutPaiement} />
        </div>
        {!termine ? (
          <ol className="flex items-center">
            {ETAPES.map((etape, i) => {
              const atteinte = i <= etapeCourante;
              return (
                <li key={etape} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${atteinte ? "bg-nile text-white" : "bg-slate-100 text-slate-400"}`}>
                      {i + 1}
                    </span>
                    <span className={`mt-1 text-[11px] ${atteinte ? "text-slate-700" : "text-slate-400"}`}>{ETAPE_LIB[etape]}</span>
                  </div>
                  {i < ETAPES.length - 1 && (
                    <span className={`mx-1 h-0.5 flex-1 ${i < etapeCourante ? "bg-nile" : "bg-slate-200"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">
            {commande.statutCommande === "ANNULEE" ? "Cette commande a été annulée." : "Commande refusée à la livraison."}
          </p>
        )}
      </Carte>

      {/* Articles */}
      <Carte className="p-4">
        <h2 className="mb-2 font-bold text-slate-900">Articles</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          {commande.lignes.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span className="truncate">{l.titreProduit} × {l.quantite}</span>
              <Prix montant={l.sousTotal} className="shrink-0" />
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold">
          <span>Total</span>
          <Prix montant={commande.total} className="text-nile" />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Paiement : {commande.modePaiement === "COD" ? "à la livraison" : "Mobile Money"}
        </p>
      </Carte>

      {/* Livraison */}
      <Carte className="p-4">
        <h2 className="mb-2 font-bold text-slate-900">Livraison</h2>
        <p className="text-sm text-slate-700">{commande.destNom} · {commande.destTelephone}</p>
        <p className="text-sm text-slate-500">{commande.quartier}, {commande.ville}</p>
        {commande.reperes && <p className="text-sm text-slate-500">Repères : {commande.reperes}</p>}
        {commande.livraison && (
          <div className="mt-2 border-t border-slate-100 pt-2 text-sm text-slate-600">
            <p>Suivi : <span className="font-medium">{commande.livraison.statut}</span>{commande.livraison.transporteur ? ` · ${commande.livraison.transporteur}` : ""}</p>
            {commande.livraison.preuveUrl && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">Preuve de livraison</p>
                <Vignette url={commande.livraison.preuveUrl} alt="Preuve de livraison" sizes="120px" className="mt-1 h-28 w-28 rounded" />
              </div>
            )}
          </div>
        )}
      </Carte>

      {annulable && (
        <form action={annulerCommandeAction}>
          <input type="hidden" name="commandeId" value={commande.id} />
          <button type="submit" className={btn("danger", "md")}>Annuler la commande</button>
        </form>
      )}
    </div>
  );
}
