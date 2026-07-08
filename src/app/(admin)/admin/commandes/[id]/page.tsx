import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { getCommandeAdmin } from "@/modules/admin/commandes";
import { formaterXAF } from "@/lib/money";
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
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{commande.numero}</h1>
        <Link href="/admin/commandes" className="text-sm text-gray-500 hover:underline">
          ← Commandes
        </Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {/* Statuts */}
      <section className="rounded-lg bg-white p-4 shadow-sm text-sm">
        <p>Commande : <span className="font-semibold">{commande.statutCommande}</span></p>
        <p>Paiement : <span className="font-semibold">{commande.statutPaiement}</span> ({commande.modePaiement === "COD" ? "à la livraison" : "Monetbil"})</p>
        <p>Livraison : <span className="font-semibold">{commande.livraison?.statut ?? "—"}</span></p>
        {commande.livraison?.transporteur && (
          <p>Transporteur : <span className="font-semibold">{commande.livraison.transporteur}</span></p>
        )}
      </section>

      {/* Acheteur + adresse */}
      <section className="rounded-lg bg-white p-4 shadow-sm text-sm">
        <h2 className="mb-1 font-semibold">Livraison</h2>
        <p>{commande.destNom} · {commande.destTelephone}</p>
        <p className="text-gray-600">{commande.quartier}, {commande.ville}</p>
        {commande.reperes && <p className="text-gray-500">Repères : {commande.reperes}</p>}
      </section>

      {/* Articles */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Articles</h2>
        <ul className="space-y-1 text-sm text-gray-600">
          {commande.lignes.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span className="truncate">{l.titreProduit} × {l.quantite}</span>
              <span>{formaterXAF(l.sousTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-semibold">
          <span>Total</span>
          <span className="text-nile">{formaterXAF(commande.total)}</span>
        </div>
      </section>

      {/* Actions livraison */}
      <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Gestion de la livraison</h2>

        {peutAffecterTransporteur(st) && (
          <form action={affecterTransporteurAction} className="flex items-end gap-2">
            <input type="hidden" name="commandeId" value={commande.id} />
            <div className="flex-1">
              <label htmlFor="transporteur" className="block text-xs text-gray-500">Transporteur</label>
              <input id="transporteur" name="transporteur" required className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Nom du transporteur / livreur" />
            </div>
            <button type="submit" className="rounded bg-nile px-3 py-1.5 text-sm font-medium text-white hover:bg-nile-dark">
              Affecter
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {peutExpedier(st) && (
            <BoutonAction action={marquerExpedieeAction} commandeId={commande.id} libelle="Marquer expédiée" />
          )}
          {peutLivrer(st) && (
            <BoutonAction action={marquerLivreeAction} commandeId={commande.id} libelle="Marquer livrée" />
          )}
          {peutRefuser(st) && (
            <BoutonAction action={refuserLivraisonAction} commandeId={commande.id} libelle="Refus à la livraison" danger />
          )}
        </div>

        {/* Preuve de livraison */}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500">Preuve de livraison</p>
          {commande.livraison?.preuveUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={commande.livraison.preuveUrl} alt="Preuve" className="mt-2 h-24 rounded object-cover" />
          )}
          <form action={ajouterPreuveAction} encType="multipart/form-data" className="mt-2 flex items-end gap-2">
            <input type="hidden" name="commandeId" value={commande.id} />
            <input name="preuve" type="file" accept="image/jpeg,image/png,image/webp" required className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <button type="submit" className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              Enregistrer
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function BoutonAction({
  action,
  commandeId,
  libelle,
  danger,
}: {
  action: (formData: FormData) => Promise<void>;
  commandeId: string;
  libelle: string;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="commandeId" value={commandeId} />
      <button
        type="submit"
        className={`rounded px-3 py-1.5 text-sm font-medium ${
          danger
            ? "border border-red-300 text-red-700 hover:bg-red-50"
            : "bg-nile text-white hover:bg-nile-dark"
        }`}
      >
        {libelle}
      </button>
    </form>
  );
}
