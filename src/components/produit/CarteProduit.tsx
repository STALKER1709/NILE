import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Etoiles, Prix } from "@/components/ui/kit";
import { BoutonPanier } from "@/components/panier/BoutonPanier";

export interface ProduitCarte {
  id: string;
  slug: string;
  titre: string;
  prix: number;
  stock: number;
  noteMoyenne: number;
  nbAvis: number;
  images: { url: string }[];
  vendeur: { id?: string; nomBoutique: string };
}

export function CarteProduit({
  produit,
  quantitePanier = 0,
  priority = false,
  index = 0,
}: {
  produit: ProduitCarte;
  /** Quantité déjà dans le panier de l'utilisateur (compteur supermarché). */
  quantitePanier?: number;
  priority?: boolean;
  /** Position dans la grille : sert à décaler l'apparition (effet en cascade). */
  index?: number;
}) {
  const enRupture = produit.stock === 0;
  const lien = `/produit/${produit.slug}`;
  // Apparition en cascade, plafonnée pour que la grille ne traîne pas.
  const delai = `${Math.min(index, 11) * 45}ms`;
  return (
    <article
      style={{ animationDelay: delai }}
      className="group flex animate-fondu-haut flex-col overflow-hidden rounded-xl border border-contour-carte bg-white shadow-carte transition-all duration-200 hover:-translate-y-1 hover:border-nile-500/40 hover:shadow-carte-hover"
    >
      <Link href={lien} className="relative block overflow-hidden bg-slate-50">
        <Vignette
          url={produit.images[0]?.url}
          alt={produit.titre}
          priority={priority}
          className="aspect-square w-full"
          classImage="transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        />
        {enRupture ? (
          <span className="absolute left-2 top-2 rounded bg-rose-600/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
            Rupture
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded bg-nile-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-nile-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            En stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={lien}>
          <p className="ligne-2 min-h-[2.4rem] text-[13px] font-medium leading-snug text-slate-800 transition-colors group-hover:text-nile-700">
            {produit.titre}
          </p>
        </Link>

        {/* Ligne note */}
        <div className="flex min-h-[1rem] items-center gap-1 text-[11px] text-slate-500">
          {produit.nbAvis > 0 ? (
            <>
              <Etoiles note={produit.noteMoyenne} />
              <span className="font-medium text-slate-400">({produit.nbAvis})</span>
            </>
          ) : (
            <span className="text-[10px] text-slate-400">Nouveau</span>
          )}
        </div>

        <div className="mt-auto pt-1">
          <Prix
            montant={produit.prix}
            className="text-[17px] font-bold tracking-tight text-promo"
          />
          {produit.vendeur.id ? (
            <Link
              href={`/boutique/${produit.vendeur.id}`}
              className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 hover:text-nile hover:underline"
            >
              {produit.vendeur.nomBoutique}
            </Link>
          ) : (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {produit.vendeur.nomBoutique}
            </p>
          )}
        </div>

        {/* Actions : ajout supermarché + détail */}
        <div className="mt-2 flex flex-col gap-1.5">
          <BoutonPanier
            produitId={produit.id}
            stock={produit.stock}
            quantiteInitiale={quantitePanier}
          />
          <Link
            href={lien}
            className="inline-flex h-8 w-full items-center justify-center rounded border border-contour-carte bg-slate-50 text-xs font-semibold text-slate-700 transition-all hover:border-nile-500 hover:bg-nile-50 hover:text-nile-700"
          >
            Détails
          </Link>
        </div>
      </div>
    </article>
  );
}
