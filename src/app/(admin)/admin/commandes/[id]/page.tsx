import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { getCommandeAdmin } from "@/modules/admin/commandes";
import {
  peutAffecterTransporteur,
  peutExpedier,
  peutLivrer,
  peutRefuser,
} from "@/modules/livraison/livraison-core";
import {
  affecterTransporteurAction,
  marquerExpedieeAction,
  marquerLivreeAction,
  refuserLivraisonAction,
  ajouterPreuveAction,
} from "@/app/(admin)/admin/commandes/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, champClass, btn } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";

export const dynamic = "force-dynamic";

const MESSAGES_OK: Record<string, string> = {
  affecte: "Transporteur affecté, commande en préparation.",
  expediee: "Commande marquée expédiée.",
  livree: "Commande marquée livrée.",
  refusee: "Refus enregistré : stock restitué, compteur mis à jour.",
  preuve: "Preuve de livraison enregistrée.",
};

export default async function AdminDetailCommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const commande = await getCommandeAdmin(id);
  if (!commande) notFound();
  const st = commande.statutCommande;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">{commande.numero}</h1>
        <Link href="/admin/commandes" className="text-sm text-slate-500 hover:underline">← Commandes</Link>
      </div>

      {ok && MESSAGES_OK[ok] && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>}
      {erreur && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      <Carte className="space-y-3 p-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <BadgeStatutCommande statut={commande.statutCommande} />
          <BadgeStatutPaiement statut={commande.statutPaiement} />
        </div>
        <p className="text-slate-600">
          {commande.destNom} · {commande.destTelephone} · {commande.quartier}, {commande.ville}
          {commande.reperes ? ` (${commande.reperes})` : ""}
        </p>
        <p className="text-slate-600">Livraison : <span className="font-medium">{commande.livraison?.statut ?? "-"}</span>{commande.livraison?.transporteur ? ` · ${commande.livraison.transporteur}` : ""}</p>
      </Carte>

      <Carte className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Articles</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          {commande.lignes.map((l) => (
            <li key={l.id} className="flex justify-between"><span className="truncate">{l.titreProduit} × {l.quantite}</span><Prix montant={l.sousTotal} /></li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold"><span>Total</span><Prix montant={commande.total} className="text-nile" /></div>
      </Carte>

      <Carte className="space-y-3 p-4">
        <h2 className="text-sm font-bold text-slate-900">Gestion de la livraison</h2>

        {peutAffecterTransporteur(st) && (
          <form action={affecterTransporteurAction} className="flex items-end gap-2">
            <input type="hidden" name="commandeId" value={commande.id} />
            <div className="flex-1">
              <label htmlFor="transporteur" className="block text-xs text-slate-500">Transporteur</label>
              <input id="transporteur" name="transporteur" required placeholder="Nom du transporteur / livreur" className={`${champClass} mt-1`} />
            </div>
            <button type="submit" className={btn("primaire", "md")}>Affecter</button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {peutExpedier(st) && <Action action={marquerExpedieeAction} id={commande.id} libelle="Marquer expédiée" />}
          {peutLivrer(st) && <Action action={marquerLivreeAction} id={commande.id} libelle="Marquer livrée" />}
          {peutRefuser(st) && <Action action={refuserLivraisonAction} id={commande.id} libelle="Refus à la livraison" danger />}
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-500">Preuve de livraison</p>
          {commande.livraison?.preuveUrl && (
            <Vignette url={commande.livraison.preuveUrl} alt="Preuve" sizes="112px" className="mt-2 h-28 w-28 rounded border border-contour-carte" />
          )}
          <form action={ajouterPreuveAction} encType="multipart/form-data" className="mt-2 flex items-end gap-2">
            <input type="hidden" name="commandeId" value={commande.id} />
            <input name="preuve" type="file" accept="image/jpeg,image/png,image/webp" required className={champClass} />
            <button type="submit" className={btn("secondaire", "md")}>Enregistrer</button>
          </form>
        </div>
      </Carte>
    </div>
  );
}

function Action({ action, id, libelle, danger }: {
  action: (fd: FormData) => Promise<void>; id: string; libelle: string; danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="commandeId" value={id} />
      <button type="submit" className={btn(danger ? "danger" : "primaire", "sm")}>{libelle}</button>
    </form>
  );
}
