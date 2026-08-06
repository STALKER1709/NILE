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
  /** Prix réduit si une promotion est active, sinon absent/null. */
  prixPromo?: number | null;
  pourcentageReduction?: number | null;
  /** Stock toutes déclinaisons confondues. */
  stock: number;
  /**
   * Déclinaison ajoutable en un clic, ou `null` si l'article est décliné : la
   * grille renvoie alors vers la fiche produit, seul endroit où choisir.
   */
  varianteId?: string | null;
  noteMoyenne: number;
  nbAvis: number;
  images: { url: string }[];
  vendeur: { id?: string; nomBoutique: string };
  /** Rayon du produit, affiché en surtitre quand il est connu. */
  categorie?: { nom: string } | null;
}

/** Ce qu'une grille doit savoir pour afficher le cœur d'un article. */
export interface EtatFavoriCarte {
  enFavori: boolean;
  /** Chemin à revalider après la bascule : celui d'où part le clic. */
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
  /** Quantité déjà dans le panier de l'utilisateur (compteur supermarché). */
  quantitePanier?: number;
  priority?: boolean;
  /** Position dans la grille : sert à décaler l'apparition (effet en cascade). */
  index?: number;
  /**
   * Cœur de mise en favori. Absent pour un visiteur non connecté : il n'y a
   * nulle part où enregistrer sa liste, et un cœur qui renverrait vers la
   * connexion depuis une grille détournerait du parcours d'achat.
   */
  favori?: EtatFavoriCarte;
}) {
  const enRupture = produit.stock === 0;
  const enPromo = produit.prixPromo != null && produit.prixPromo < produit.prix;
  const lien = `/produit/${produit.slug}`;
  // Apparition en cascade, plafonnée pour que la grille ne traîne pas.
  const delai = `${Math.min(index, 11) * 45}ms`;
  return (
    <article
      style={{ animationDelay: delai }}
      className="group flex animate-fondu-haut flex-col overflow-hidden rounded-xl border border-contour-carte bg-white shadow-carte transition-all duration-200 hover:-translate-y-1 hover:border-nile-500/40 hover:shadow-carte-hover"
    >
      {/* Le cœur est un formulaire : il ne peut pas vivre DANS le lien vers la
          fiche produit (un bouton imbriqué dans un lien est invalide et ne
          répondrait pas). Il en est donc le voisin, posé par-dessus. */}
      <div className="relative overflow-hidden bg-slate-50">
        <Link href={lien} className="block overflow-hidden">
          <Vignette
            url={produit.images[0]?.url}
            alt={produit.titre}
            priority={priority}
            className="aspect-square w-full"
            classImage="transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        </Link>
        {enPromo && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-promo px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{produit.pourcentageReduction}%
          </span>
        )}
        {/* Descendue en bas à gauche : le haut à droite revient au cœur, qui
            doit rester au même endroit sur toutes les cartes. */}
        {enRupture ? (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-rose-600/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-xs">
            Rupture
          </span>
        ) : (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-nile-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-nile-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            En stock
          </span>
        )}
        {favori && (
          <div className="absolute right-2 top-2">
            <BoutonFavori
              produitId={produit.id}
              enFavori={favori.enFavori}
              retour={favori.retour}
              taille="sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {produit.categorie && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {produit.categorie.nom}
          </p>
        )}
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
          {enPromo ? (
            <span className="flex flex-wrap items-baseline gap-1.5">
              <Prix
                montant={produit.prixPromo as number}
                className="text-[17px] font-bold tracking-tight text-promo"
              />
              <Prix
                montant={produit.prix}
                className="text-[12px] text-slate-400 line-through"
              />
            </span>
          ) : (
            <Prix
              montant={produit.prix}
              className="text-[17px] font-bold tracking-tight text-promo"
            />
          )}
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
          {produit.varianteId ? (
            <BoutonPanier
              varianteId={produit.varianteId}
              stock={produit.stock}
              quantiteInitiale={quantitePanier}
            />
          ) : (
            /* Article décliné : personne ne peut choisir la taille à la place
               de l'acheteur. Le renvoyer vers la fiche vaut mieux qu'un bouton
               « Ajouter » qui se solderait par un refus. */
            <Link
              href={lien}
              className="inline-flex h-9 w-full items-center justify-center rounded bg-accent text-sm font-semibold text-nile-950 transition-colors hover:bg-accent-dark"
            >
              {enRupture ? "Voir l'article" : "Choisir les options"}
            </Link>
          )}
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
