import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Etoiles, Prix } from "@/components/ui/kit";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { BoutonFavori } from "@/components/produit/BoutonFavori";

export interface ProduitCarte {
  id: string;
  slug: string;
  titre: string;
  prix: number;
  prixPromo?: number | null;
  pourcentageReduction?: number | null;
  stock: number;
  varianteId?: string | null;
  noteMoyenne: number;
  nbAvis: number;
  images: { url: string }[];
  vendeur: { id?: string; nomBoutique: string };
  categorie?: { nom: string } | null;
}

export interface EtatFavoriCarte {
  enFavori: boolean;
  retour: string;
}

export function CarteProduit({
  produit,
  quantitePanier = 0,
  priority = false,
  index = 0,
  favori,
}: {
  produit: ProduitCarte;
  quantitePanier?: number;
  priority?: boolean;
  index?: number;
  favori?: EtatFavoriCarte;
}) {
  const enRupture = produit.stock === 0;
  const enPromo = produit.prixPromo != null && produit.prixPromo < produit.prix;
  const lien = `/produit/${produit.slug}`;
  const delai = `${Math.min(index, 11) * 45}ms`;

  return (
    <article
      style={{ animationDelay: delai }}
      className="group flex animate-fondu-haut flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-carte-hover"
    >
      <div className="relative overflow-hidden bg-stone-100">
        <Link href={lien} className="block overflow-hidden">
          <Vignette
            url={produit.images[0]?.url}
            alt={produit.titre}
            priority={priority}
            className="aspect-square w-full"
            classImage="transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        </Link>

        {enPromo && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-[7px] bg-amber-400 px-2 py-1 text-[10px] font-extrabold text-blue-950">
            -{produit.pourcentageReduction}%
          </span>
        )}

        {enRupture ? (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-lg bg-slate-900/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
            Épuisé
          </span>
        ) : (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            En stock
          </span>
        )}

        {favori && (
          <div className="absolute right-2.5 top-2.5">
            <BoutonFavori
              produitId={produit.id}
              enFavori={favori.enFavori}
              retour={favori.retour}
              taille="sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {produit.categorie && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {produit.categorie.nom}
          </p>
        )}

        <Link href={lien}>
          <h3 className="ligne-2 min-h-[2.4rem] text-[13px] font-medium leading-snug text-slate-900 transition-colors group-hover:text-nile-700">
            {produit.titre}
          </h3>
        </Link>

        {/* Ligne note & avis */}
        <div className="flex min-h-[1.1rem] items-center gap-1.5 text-[11px] text-slate-500">
          {produit.nbAvis > 0 ? (
            <>
              <Etoiles note={produit.noteMoyenne} />
              <span className="font-medium text-slate-400">({produit.nbAvis})</span>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Pas encore noté</span>
          )}
        </div>

        {/* Prix lisible */}
        <div className="mt-auto pt-1.5">
          {enPromo ? (
            <div className="flex flex-wrap items-baseline gap-1.5">
              <Prix
                montant={produit.prixPromo as number}
                className="text-base font-extrabold tracking-tight text-accent-dark sm:text-lg"
              />
              <Prix
                montant={produit.prix}
                className="text-xs text-slate-400 line-through"
              />
            </div>
          ) : (
            <Prix
              montant={produit.prix}
              className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg"
            />
          )}

          {produit.vendeur.id ? (
            <Link
              href={`/boutique/${produit.vendeur.id}`}
              className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 hover:text-nile-700 hover:underline"
            >
              {produit.vendeur.nomBoutique}
            </Link>
          ) : (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {produit.vendeur.nomBoutique}
            </p>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700" title="Les produits publics proviennent de boutiques validées par NILE">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8"><path d="M8 1.5 10 2.7l2.3.2.8 2.2 1.4 1.9-1.1 2-0.1 2.3-2.2.8L8 13.5l-2-1.4-2.3-.2-.8-2.2-1.4-1.9 1.1-2 .1-2.3 2.2-.8L8 1.5Z" strokeLinejoin="round"/><path d="m5.2 7.8 1.8 1.8 3.8-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Boutique validée
          </span>
        </div>

        {/* Boutons d'action */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {produit.varianteId ? (
            <BoutonPanier
              varianteId={produit.varianteId}
              stock={produit.stock}
              quantiteInitiale={quantitePanier}
            />
          ) : (
            <Link
              href={lien}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent text-xs font-bold text-slate-950 transition-all hover:bg-accent-dark hover:text-white active:scale-98"
            >
              {enRupture ? "Voir l'article" : "Choisir les options"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
