import Link from "next/link";
import { Vignette } from "@/components/ui/Vignette";
import { Etoiles, Prix } from "@/components/ui/kit";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import type { ProduitCarte } from "@/components/produit/CarteProduit";

/**
 * Carte produit « vitrine » : format large utilisé sur l'accueil (3 colonnes
 * sur grand écran). Visuel en 3:2, prix en titre, boutique en étiquette dorée,
 * puis deux actions côte à côte (ajout au panier / fiche produit).
 *
 * La carte compacte de catalogue reste `CarteProduit` : les deux grilles n'ont
 * pas la même densité, on ne mutualise donc que les primitives.
 */
export function CarteProduitVitrine({
  produit,
  quantitePanier = 0,
  priority = false,
  index = 0,
  actions = "double",
  afficherCategorie = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 400px",
}: {
  produit: ProduitCarte;
  quantitePanier?: number;
  priority?: boolean;
  /** Position dans la grille : décale l'apparition (effet en cascade). */
  index?: number;
  /**
   * "double" : ajout au panier + lien vers la fiche (accueil).
   * "simple" : un seul bouton pleine largeur (catalogue) — l'image et le
   * titre restent des liens vers la fiche produit.
   */
  actions?: "double" | "simple";
  /** Surtitre de rayon au-dessus du titre (grilles de catalogue). */
  afficherCategorie?: boolean;
  sizes?: string;
}) {
  const lien = `/produit/${produit.slug}`;
  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group flex animate-fondu-haut flex-col rounded-xl border border-contour-carte bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-nile-700/30 hover:shadow-carte-hover"
    >
      <Link href={lien} className="mb-4 block overflow-hidden rounded">
        <Vignette
          url={produit.images[0]?.url}
          alt={produit.titre}
          priority={priority}
          fond="bg-surface-basse"
          className="aspect-[1.5] w-full"
          classImage="transition-transform duration-300 group-hover:scale-105"
          sizes={sizes}
        />
      </Link>

      {afficherCategorie && produit.categorie && (
        <p className="mb-1 truncate text-etiquette-xs uppercase tracking-wider text-slate-400">
          {produit.categorie.nom}
        </p>
      )}

      <Link href={lien}>
        <h3 className="ligne-2 text-etiquette-md font-bold text-nile-800 transition-colors hover:text-nile-600">
          {produit.titre}
        </h3>
      </Link>

      <div className="mb-2 mt-1 flex min-h-[1.25rem] items-center gap-1">
        {produit.nbAvis > 0 ? (
          <>
            <Etoiles note={produit.noteMoyenne} />
            <span className="text-etiquette-xs text-slate-500">({produit.nbAvis})</span>
          </>
        ) : (
          <span className="text-etiquette-xs text-slate-400">Nouveau</span>
        )}
      </div>

      <div className="mt-auto">
        <Prix montant={produit.prix} className="block text-titre-sm text-nile-800" />
        {produit.vendeur.id ? (
          <Link
            href={`/boutique/${produit.vendeur.id}`}
            className="mb-4 mt-1 block truncate text-etiquette-xs uppercase tracking-wider text-accent-deep hover:underline"
          >
            {produit.vendeur.nomBoutique}
          </Link>
        ) : (
          <p className="mb-4 mt-1 truncate text-etiquette-xs uppercase tracking-wider text-accent-deep">
            {produit.vendeur.nomBoutique}
          </p>
        )}

        {actions === "simple" ? (
          <BoutonPanier
            produitId={produit.id}
            stock={produit.stock}
            quantiteInitiale={quantitePanier}
            libelle="Ajouter au panier"
          />
        ) : (
          <div className="grid grid-cols-2 items-start gap-2">
            <BoutonPanier
              produitId={produit.id}
              stock={produit.stock}
              quantiteInitiale={quantitePanier}
            />
            <Link
              href={lien}
              className="inline-flex h-9 w-full items-center justify-center rounded border border-contour text-etiquette-md font-bold text-nile-800 transition-colors hover:bg-surface-moyenne"
            >
              Détails
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
