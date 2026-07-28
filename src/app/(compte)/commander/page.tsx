import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { calculerTotal } from "@/modules/commande/commande-core";
import { env } from "@/lib/env";
import { getPlafondCOD } from "@/modules/commande/config";
import { getDerniereAdresse } from "@/modules/commande/commande";
import { passerCommandeAction } from "@/app/(compte)/commander/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, Prix, btn, champClass, labelClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Passer la commande" };

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
  const [plafond, derniere] = await Promise.all([
    getPlafondCOD(),
    getDerniereAdresse(utilisateur.id),
  ]);
  const depassePlafond = total > plafond;

  return (
    <div className="space-y-5">
      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Passer la commande</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <form action={passerCommandeAction} className="space-y-5 lg:col-span-2">
          <Carte className="space-y-4 p-5">
            <h2 className="font-bold text-slate-900">Adresse de livraison</h2>
            {derniere && (
              <p className="rounded bg-nile-50 px-3 py-2 text-xs text-nile-800">
                Adresse pré-remplie depuis ta dernière commande · modifie si besoin.
              </p>
            )}
            <div>
              <label htmlFor="destNom" className={labelClass}>Nom du destinataire</label>
              <input id="destNom" name="destNom" required defaultValue={derniere?.destNom ?? utilisateur.nom} className={`${champClass} mt-1`} />
            </div>
            <div>
              <label htmlFor="destTelephone" className={labelClass}>Téléphone de contact</label>
              <input id="destTelephone" name="destTelephone" required defaultValue={derniere?.destTelephone ?? utilisateur.telephone} placeholder="6XX XXX XXX" className={`${champClass} mt-1`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ville" className={labelClass}>Ville</label>
                <input id="ville" name="ville" required defaultValue={derniere?.ville ?? ""} placeholder="Douala" className={`${champClass} mt-1`} />
              </div>
              <div>
                <label htmlFor="quartier" className={labelClass}>Quartier</label>
                <input id="quartier" name="quartier" required defaultValue={derniere?.quartier ?? ""} placeholder="Akwa" className={`${champClass} mt-1`} />
              </div>
            </div>
            <div>
              <label htmlFor="reperes" className={labelClass}>Points de repère (facultatif)</label>
              <textarea id="reperes" name="reperes" rows={2} defaultValue={derniere?.reperes ?? ""} placeholder="Ex : en face de la pharmacie, immeuble bleu…" className={`${champClass} mt-1`} />
            </div>
          </Carte>

          <Carte className="space-y-3 p-5">
            <h2 className="font-bold text-slate-900">Mode de paiement</h2>
            <label className="flex items-start gap-3 rounded border border-contour-carte p-3 has-[:checked]:border-nile has-[:checked]:bg-nile-50">
              <input type="radio" name="mode" value="COD" defaultChecked={!depassePlafond} className="mt-1" />
              <span>
                <span className="font-medium">Paiement à la livraison</span>
                <span className="block text-sm text-slate-500">Vous payez en espèces à la réception.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded border border-contour-carte p-3 has-[:checked]:border-nile has-[:checked]:bg-nile-50">
              <input type="radio" name="mode" value="MONETBIL" defaultChecked={depassePlafond} className="mt-1" />
              <span>
                <span className="font-medium">Mobile Money (Monetbil)</span>
                <span className="block text-sm text-slate-500">MTN MoMo / Orange Money, avant expédition.</span>
              </span>
            </label>
            {depassePlafond && (
              <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-xs text-amber-800">
                Le total dépasse le plafond du paiement à la livraison (<Prix montant={plafond} />).
                Choisissez Mobile Money ou réduisez le panier.
              </p>
            )}
          </Carte>

          <BoutonSoumettre
            enCours="Commande en cours…"
            className={btn("accent", "lg", "w-full flex-wrap")}
          >
            <span>Confirmer la commande</span>
            <Prix montant={total} className="whitespace-nowrap" />
          </BoutonSoumettre>
        </form>

        <div className="lg:col-span-1">
          <Carte className="sticky top-24 space-y-2 p-4">
            <h2 className="font-bold text-slate-900">Votre commande</h2>
            <ul className="space-y-1 text-sm text-slate-600">
              {panier.lignes.map((l) => (
                <li key={l.id} className="flex justify-between gap-2">
                  <span className="truncate">{l.produit.titre} × {l.quantite}</span>
                  <Prix montant={l.produit.prix * l.quantite} className="shrink-0" />
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Livraison</span>
              <span className="font-medium text-emerald-700">Gratuite</span>
            </div>
            {env.DELAI_LIVRAISON_TEXTE && (
              <p className="text-xs text-slate-500">Délai estimé : {env.DELAI_LIVRAISON_TEXTE}</p>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
              <span>Total</span>
              <Prix montant={total} className="text-nile" />
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
