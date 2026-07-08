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
      className="group flex flex-col overflow-hidden rounded-xl2 border border-gray-100 bg-white shadow-carte transition hover:shadow-flottant"
    >
      <div className="relative">
        <Vignette
          url={produit.images[0]?.url}
          alt={produit.titre}
          priority={priority}
          className="aspect-square w-full transition-transform duration-200 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        />
        {enRupture && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[11px] font-medium text-white">
            Rupture
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="ligne-2 min-h-[2.5rem] text-sm text-gray-800">{produit.titre}</p>
        {produit.nbAvis > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Etoiles note={produit.noteMoyenne} /> ({produit.nbAvis})
          </span>
        )}
        <Prix montant={produit.prix} className="mt-auto text-base font-bold text-nile" />
        <p className="truncate text-xs text-gray-400">{produit.vendeur.nomBoutique}</p>
      </div>
    </Link>
  );
}
