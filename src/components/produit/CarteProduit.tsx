import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Etoiles, Prix } from "@/components/ui/kit";

export interface ProduitCarte {
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
  priority = false,
}: {
  produit: ProduitCarte;
  priority?: boolean;
}) {
  const enRupture = produit.stock === 0;
  return (
    <Link
      href={`/produit/${produit.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-carte transition hover:border-nile/40 hover:shadow-flottant"
    >
      <div className="relative bg-white">
        <Vignette
          url={produit.images[0]?.url}
          alt={produit.titre}
          priority={priority}
          className="aspect-square w-full transition-transform duration-200 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        />
        {enRupture && (
          <span className="absolute left-2 top-2 rounded bg-red-600/90 px-2 py-0.5 text-[11px] font-semibold text-white">
            Rupture
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="ligne-2 min-h-[2.4rem] text-[13px] leading-snug text-gray-800 group-hover:text-nile">
          {produit.titre}
        </p>

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
          {!enRupture && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Paiement à la livraison
            </p>
          )}
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {produit.vendeur.nomBoutique}
          </p>
        </div>
      </div>
    </Link>
  );
}
