import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Etoiles, Prix } from "@/components/ui/kit";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { BoutonFavori } from "@/components/produit/BoutonFavori";
import type { ProduitCarte, EtatFavoriCarte } from "@/components/produit/CarteProduit";

export function CarteProduitVitrine({
  produit,
  quantitePanier = 0,
  priority = false,
  index = 0,
  actions = "double",
  afficherCategorie = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 400px",
  favori,
}: {
  produit: ProduitCarte;
  quantitePanier?: number;
  priority?: boolean;
  favori?: EtatFavoriCarte;
  index?: number;
  actions?: "double" | "simple";
  afficherCategorie?: boolean;
  sizes?: string;
}) {
  const lien = `/produit/${produit.slug}`;
  const enPromo = produit.prixPromo != null && produit.prixPromo < produit.prix;
  const enRupture = produit.stock === 0;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className="group flex animate-fondu-haut flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-nile-700/30 hover:shadow-md"
    >
      <div className="relative mb-3.5 overflow-hidden rounded-xl bg-slate-50">
        <Link href={lien} className="block overflow-hidden">
          <Vignette
            url={produit.images[0]?.url}
            alt={produit.titre}
            priority={priority}
            fond="bg-slate-50"
            className="aspect-[1.4] w-full"
            classImage="transition-transform duration-500 group-hover:scale-105"
            sizes={sizes}
          />
        </Link>

        {enPromo && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{produit.pourcentageReduction}%
          </span>
        )}

        {enRupture && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/80 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
            Épuisé
          </span>
        )}

        {favori && (
          <div className="absolute right-3 top-3">
            <BoutonFavori
              produitId={produit.id}
              enFavori={favori.enFavori}
              retour={favori.retour}
              taille="sm"
            />
          </div>
        )}
      </div>

      {afficherCategorie && produit.categorie && (
        <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {produit.categorie.nom}
        </p>
      )}

      <Link href={lien}>
        <h3 className="ligne-2 min-h-[2.6rem] font-titre text-base font-bold text-slate-900 transition-colors group-hover:text-nile-700">
          {produit.titre}
        </h3>
      </Link>

      <div className="mb-3 mt-1 flex min-h-[1.2rem] items-center gap-1.5">
        {produit.nbAvis > 0 ? (
          <>
            <Etoiles note={produit.noteMoyenne} />
            <span className="text-xs font-medium text-slate-400">({produit.nbAvis})</span>
          </>
        ) : (
          <span className="text-xs font-medium text-slate-400">Nouveau</span>
        )}
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
        <div>
          {enPromo ? (
            <div className="flex flex-wrap items-baseline gap-1.5">
              <Prix
                montant={produit.prixPromo as number}
                className="text-lg font-extrabold tracking-tight text-rose-600 sm:text-xl"
              />
              <Prix
                montant={produit.prix}
                className="text-xs text-slate-400 line-through"
              />
            </div>
          ) : (
            <Prix
              montant={produit.prix}
              className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl"
            />
          )}

          {produit.vendeur.id ? (
            <Link
              href={`/boutique/${produit.vendeur.id}`}
              className="block truncate text-xs font-medium text-slate-500 hover:text-nile-700 hover:underline"
            >
              {produit.vendeur.nomBoutique}
            </Link>
          ) : (
            <p className="truncate text-xs text-slate-400">
              {produit.vendeur.nomBoutique}
            </p>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="mt-3.5 flex gap-2">
        {actions === "double" ? (
          <>
            <div className="flex-1">
              {produit.varianteId ? (
                <BoutonPanier
                  varianteId={produit.varianteId}
                  stock={produit.stock}
                  quantiteInitiale={quantitePanier}
                />
              ) : (
                <Link
                  href={lien}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent text-xs font-bold text-slate-950 transition-all hover:bg-accent-dark hover:text-white"
                >
                  {enRupture ? "Voir" : "Options"}
                </Link>
              )}
            </div>
            <Link
              href={lien}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:border-nile-600 hover:bg-white hover:text-nile-800"
            >
              Fiche
            </Link>
          </>
        ) : (
          <div className="w-full">
            {produit.varianteId ? (
              <BoutonPanier
                varianteId={produit.varianteId}
                stock={produit.stock}
                quantiteInitiale={quantitePanier}
              />
            ) : (
              <Link
                href={lien}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent text-xs font-bold text-slate-950 transition-all hover:bg-accent-dark hover:text-white"
              >
                {enRupture ? "Voir l'article" : "Choisir les options"}
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
