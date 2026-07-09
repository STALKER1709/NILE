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
  vendeur: { nomBoutique: string };
}

export function CarteProduit({
  produit,
  quantitePanier = 0,
  priority = false,
}: {
  produit: ProduitCarte;
  /** Quantité déjà dans le panier de l'utilisateur (compteur supermarché). */
  quantitePanier?: number;
  priority?: boolean;
}) {
  const enRupture = produit.stock === 0;
  const lien = `/produit/${produit.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-carte transition hover:border-nile/40 hover:shadow-flottant">
      <Link href={lien} className="relative block bg-white">
        <Vignette
          url={produit.images[0]?.url}
          alt={produit.titre}
          priority={priority}
          className="aspect-square w-full"
          classImage="transition-transform duration-200 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        />
        {enRupture && (
          <span className="absolute left-2 top-2 rounded bg-red-600/90 px-2 py-0.5 text-[11px] font-semibold text-white">
            Rupture
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <Link href={lien}>
          <p className="ligne-2 min-h-[2.4rem] text-[13px] leading-snug text-gray-800 hover:text-nile">
            {produit.titre}
          </p>
        </Link>

        {/* Ligne note (hauteur réservée pour un alignement régulier de la grille) */}
        <div className="flex min-h-[1rem] items-center gap-1 text-[11px] text-gray-500">
          {produit.nbAvis > 0 && (
            <>
              <Etoiles note={produit.noteMoyenne} />
              <span>({produit.nbAvis})</span>
            </>
          )}
        </div>

        <div className="mt-auto pt-0.5">
          <Prix
            montant={produit.prix}
            className="text-[17px] font-extrabold text-promo"
          />
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {produit.vendeur.nomBoutique}
          </p>
        </div>

        {/* Actions : ajout « supermarché » + détail du produit */}
        <div className="mt-1.5 flex flex-col gap-1.5">
          <BoutonPanier
            produitId={produit.id}
            stock={produit.stock}
            quantiteInitiale={quantitePanier}
          />
          <Link
            href={lien}
            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:border-nile hover:text-nile"
          >
            Détails
          </Link>
        </div>
      </div>
    </article>
  );
}
