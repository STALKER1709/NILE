import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Prix } from "@/components/ui/kit";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { retirerArticleAction } from "@/app/(compte)/panier/actions";

/**
 * Blocs de la page panier, partagés par les deux parcours (visiteur avec
 * panier en cookie, utilisateur connecté avec lignes en base) pour que le
 * rendu soit strictement identique dans les deux cas.
 */

export interface ArticlePanier {
  produitId: string;
  slug: string;
  titre: string;
  prix: number;
  /** Prix réellement facturé : égal à `prix` sauf promotion active. */
  prixEffectif: number;
  pourcentageReduction?: number | null;
  stock: number;
  quantite: number;
  imageUrl?: string | null;
  /** Produit retiré de la vente ou boutique non validée. */
  indisponible: boolean;
}

/** Carte d'un article : visuel, désignation, quantité, total de ligne. */
export function CarteArticlePanier({ article }: { article: ArticlePanier }) {
  const stockInsuffisant = !article.indisponible && article.stock < article.quantite;
  const enPromo = article.prixEffectif < article.prix;
  return (
    <div className="flex flex-col gap-6 rounded border border-contour-carte bg-white p-4 transition-shadow duration-300 hover:shadow-carte-hover sm:flex-row sm:p-6">
      <Link
        href={`/produit/${article.slug}`}
        className="h-32 w-full shrink-0 overflow-hidden rounded sm:w-32"
      >
        <Vignette
          url={article.imageUrl}
          alt={article.titre}
          sizes="(max-width: 640px) 92vw, 128px"
          fond="bg-surface-basse"
          className="h-full w-full"
        />
      </Link>

      <div className="flex min-w-0 flex-grow flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/produit/${article.slug}`}
              className="block text-titre-sm text-nile-800 hover:underline"
            >
              {article.titre}
            </Link>
            {enPromo ? (
              <span className="mt-1 flex items-center gap-2">
                <Prix montant={article.prixEffectif} className="text-corps-sm font-bold text-promo" />
                <Prix montant={article.prix} className="text-etiquette-xs text-slate-400 line-through" />
                {article.pourcentageReduction ? (
                  <span className="rounded-full bg-promo-conteneur px-1.5 py-0.5 text-[10px] font-bold text-promo-dark">
                    -{article.pourcentageReduction}%
                  </span>
                ) : null}
              </span>
            ) : (
              <Prix
                montant={article.prix}
                className="mt-1 block text-corps-sm text-slate-500"
              />
            )}
            {article.indisponible ? (
              <span className="mt-2 inline-block rounded-full bg-promo-conteneur px-3 py-1 text-etiquette-xs text-promo-dark">
                Indisponible · à retirer
              </span>
            ) : stockInsuffisant ? (
              <span className="mt-2 inline-block rounded-full bg-promo-conteneur px-3 py-1 text-etiquette-xs text-promo-dark">
                Stock restant : {article.stock}
              </span>
            ) : (
              <span className="mt-2 inline-block rounded-full bg-nile-200 text-etiquette-xs text-nile-900 px-3 py-1">
                En stock
              </span>
            )}
          </div>
          {/* Total de ligne : un cran plus petit sur mobile pour laisser de
              la largeur au titre du produit. */}
          <Prix
            montant={article.prixEffectif * article.quantite}
            className="shrink-0 text-corps-lg font-bold text-nile-800 sm:text-titre-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-36">
            <BoutonPanier
              produitId={article.produitId}
              stock={article.stock}
              quantiteInitiale={article.quantite}
              rafraichirApres
            />
          </div>
          <form action={retirerArticleAction}>
            <input type="hidden" name="produitId" value={article.produitId} />
            <button
              type="submit"
              className="flex items-center gap-1 rounded px-2 py-2 text-etiquette-md text-promo transition-colors hover:bg-promo-conteneur"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Retirer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Rappel des conditions de livraison. Contenu volontairement factuel : la
 * livraison est gratuite et l'adresse est saisie à l'étape suivante — aucune
 * date de livraison n'est annoncée, la plateforme n'en calcule pas.
 */
export function BlocLivraison() {
  return (
    <div className="flex items-center gap-4 rounded border border-contour-carte bg-surface-basse p-4 sm:p-6">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-nile-conteneur text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-etiquette-md text-nile-800">Livraison gratuite</p>
        <p className="text-corps-sm text-slate-600">
          Partout au Cameroun. Vous indiquerez votre adresse à l&apos;étape
          suivante.
        </p>
      </div>
    </div>
  );
}

/**
 * Récapitulatif de commande (colonne collante).
 *
 * Pas de ligne de TVA : les prix affichés sont toutes taxes comprises, en
 * FCFA entiers. Pas de frais de port : la livraison est gratuite.
 */
export function RecapitulatifPanier({
  total,
  children,
}: {
  total: number;
  /** Bouton d'action + mentions propres au parcours (visiteur ou connecté). */
  children: React.ReactNode;
}) {
  return (
    <div className="sticky top-24 rounded border border-nile-700/10 bg-white p-6 shadow-carte-hover">
      <h2 className="text-titre-sm text-nile-800">Récapitulatif</h2>

      <div className="mt-6 space-y-4 border-b border-contour-carte pb-6">
        <div className="flex justify-between text-corps-md">
          <span className="text-slate-600">Sous-total</span>
          <Prix montant={total} className="font-semibold text-slate-900" />
        </div>
        <div className="flex justify-between text-corps-md">
          <span className="text-slate-600">Livraison</span>
          <span className="font-bold text-accent-deep">GRATUITE</span>
        </div>
      </div>

      <div className="flex items-center justify-between py-6">
        <span className="text-titre-sm text-nile-800">Total</span>
        <Prix montant={total} className="text-titre-sm font-bold text-nile-800" />
      </div>

      <p className="text-etiquette-xs uppercase tracking-wider text-slate-500">
        Modes de paiement acceptés
      </p>
      <ul className="mt-3 space-y-2">
        <MoyenPaiement
          libelle="MTN MoMo"
          pastille={<span className="text-[10px] font-bold text-black">MTN</span>}
          fond="bg-[#ffcb05]"
        />
        <MoyenPaiement
          libelle="Orange Money"
          pastille={<span className="text-[10px] font-bold text-white">OM</span>}
          fond="bg-[#ff7900]"
        />
        <MoyenPaiement
          libelle="Espèces à la livraison"
          fond="bg-surface-haute"
          pastille={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-nile-800" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          }
        />
      </ul>

      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Ligne « moyen de paiement accepté » du récapitulatif. */
function MoyenPaiement({
  libelle,
  pastille,
  fond,
}: {
  libelle: string;
  pastille: React.ReactNode;
  /** Couleur de fond de la pastille de l'opérateur. */
  fond: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded border border-contour-carte px-4 py-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${fond}`}>
        {pastille}
      </span>
      <span className="text-etiquette-md text-nile-800">{libelle}</span>
    </li>
  );
}
