import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { calculerTotal } from "@/modules/commande/commande-core";
import { env } from "@/lib/env";
import { getPlafondCOD } from "@/modules/commande/config";
import { getDerniereAdresse } from "@/modules/commande/commande";
import { passerCommandeAction } from "@/app/(compte)/commander/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Vignette } from "@/components/ui/Vignette";
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
      <nav aria-label="Étapes" className="flex items-center gap-2 text-corps-sm">
        <Link href="/panier" className="text-slate-500 transition-colors hover:text-nile-700">Panier</Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-nile-700">Commande</span>
        <span className="text-slate-300">›</span>
        <span className="text-slate-400">Confirmation</span>
      </nav>

      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Passer la commande</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <form action={passerCommandeAction} className="space-y-5 lg:col-span-2">
          <Carte className="space-y-4 p-5">
            <h2 className="flex items-center gap-2.5 text-titre-sm text-slate-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
                <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
                <circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" />
              </svg>
              Adresse de livraison
            </h2>
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
            <h2 className="flex items-center gap-2.5 text-titre-sm text-slate-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
                <rect x="2.5" y="6" width="19" height="12" rx="2" />
                <path d="M2.5 10h19M6 14h4" strokeLinecap="round" />
              </svg>
              Mode de paiement
            </h2>
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
          <Carte className="sticky top-24 overflow-hidden">
            <h2 className="border-b border-contour-carte px-5 py-4 text-titre-sm text-slate-900">
              Votre commande
            </h2>
            <ul className="divide-y divide-slate-100">
              {panier.lignes.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <Vignette
                    url={l.produit.images[0]?.url}
                    alt={l.produit.titre}
                    sizes="48px"
                    className="h-12 w-12 shrink-0 rounded border border-contour-carte"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-corps-sm font-semibold text-slate-900">
                      {l.produit.titre}
                    </span>
                    <span className="block text-etiquette-xs text-slate-500">
                      Quantité : {l.quantite}
                    </span>
                    <Prix
                      montant={l.produit.prix * l.quantite}
                      className="block text-corps-sm font-bold text-slate-900"
                    />
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 bg-surface-basse px-5 py-4">
              <div className="flex justify-between text-corps-sm text-slate-600">
                <span>Sous-total</span>
                <Prix montant={total} className="font-semibold text-slate-900" />
              </div>
              <div className="flex justify-between text-corps-sm text-slate-600">
                <span>Livraison</span>
                <span className="font-bold text-nile-700">Gratuite</span>
              </div>
              {env.DELAI_LIVRAISON_TEXTE && (
                <p className="text-etiquette-xs text-slate-500">
                  Délai estimé : {env.DELAI_LIVRAISON_TEXTE}
                </p>
              )}
              <div className="flex justify-between border-t border-contour-carte pt-3 text-titre-sm text-slate-900">
                <span>Total</span>
                <Prix montant={total} className="text-nile-700" />
              </div>
              <p className="pt-1 text-center text-etiquette-xs uppercase tracking-wider text-slate-400">
                Prix TTC · aucun frais ajouté
              </p>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
