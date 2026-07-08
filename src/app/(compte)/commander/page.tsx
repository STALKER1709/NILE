import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { calculerTotal } from "@/modules/commande/commande-core";
import { getPlafondCOD } from "@/modules/commande/config";
import { formaterXAF } from "@/lib/money";
import { passerCommandeAction } from "@/app/(compte)/commander/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

export default async function CommanderPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const utilisateur = await exigerConnexion();
  const panier = await getPanierAvecLignes(utilisateur.id);

  if (panier.lignes.length === 0) redirect("/panier");

  const total = calculerTotal(
    panier.lignes.map((l) => ({ prix: l.produit.prix, quantite: l.quantite })),
  );
  const plafond = await getPlafondCOD();
  const depassePlafond = total > plafond;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-xl font-bold">Passer la commande</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {/* Récapitulatif */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Récapitulatif</h2>
        <ul className="space-y-1 text-sm text-gray-600">
          {panier.lignes.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span className="truncate">{l.produit.titre} × {l.quantite}</span>
              <span>{formaterXAF(l.produit.prix * l.quantite)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-semibold">
          <span>Total</span>
          <span className="text-nile">{formaterXAF(total)}</span>
        </div>
        {depassePlafond && (
          <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Le total dépasse le plafond du paiement à la livraison (
            {formaterXAF(plafond)}). Réduisez votre panier pour commander en COD.
          </p>
        )}
      </section>

      {/* Adresse + confirmation */}
      <form action={passerCommandeAction} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Adresse de livraison</h2>
        <div>
          <label htmlFor="destNom" className={label}>Nom du destinataire</label>
          <input id="destNom" name="destNom" required defaultValue={utilisateur.nom} className={champ} />
        </div>
        <div>
          <label htmlFor="destTelephone" className={label}>Téléphone de contact</label>
          <input id="destTelephone" name="destTelephone" required defaultValue={utilisateur.telephone} className={champ} placeholder="6XX XXX XXX" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ville" className={label}>Ville</label>
            <input id="ville" name="ville" required className={champ} placeholder="Douala" />
          </div>
          <div>
            <label htmlFor="quartier" className={label}>Quartier</label>
            <input id="quartier" name="quartier" required className={champ} placeholder="Akwa" />
          </div>
        </div>
        <div>
          <label htmlFor="reperes" className={label}>Points de repère (facultatif)</label>
          <textarea id="reperes" name="reperes" rows={2} className={champ} placeholder="Ex : en face de la pharmacie, immeuble bleu…" />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Mode de paiement</legend>
          <label className="flex items-start gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
            <input type="radio" name="mode" value="COD" defaultChecked={!depassePlafond} className="mt-1" />
            <span>
              <span className="font-medium">Paiement à la livraison</span>
              <span className="block text-gray-500">Vous payez en espèces à la réception.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
            <input type="radio" name="mode" value="MONETBIL" defaultChecked={depassePlafond} className="mt-1" />
            <span>
              <span className="font-medium">Mobile Money (Monetbil)</span>
              <span className="block text-gray-500">MTN MoMo / Orange Money. Paiement avant expédition.</span>
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded bg-nile px-4 py-3 text-sm font-medium text-white hover:bg-nile-dark"
        >
          Confirmer la commande — {formaterXAF(total)}
        </button>
      </form>
    </div>
  );
}
