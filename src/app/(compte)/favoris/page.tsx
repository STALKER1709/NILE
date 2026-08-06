import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { listerFavoris } from "@/modules/catalogue/favoris";
import { chargerAffichagePrixPourProduits } from "@/modules/promotion/promotion";
import { getQuantitesPanier } from "@/modules/commande/panier";
import { BoutonFavori } from "@/components/produit/BoutonFavori";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, EtatVide, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes favoris" };

export default async function FavorisPage() {
  const utilisateur = await exigerConnexion();
  const [favoris, quantites] = await Promise.all([
    listerFavoris(utilisateur.id),
    // Le compteur « supermarché » du bouton doit refléter ce qui est déjà au
    // panier, sinon un article ajouté depuis cette page repartirait de zéro.
    getQuantitesPanier(utilisateur.id),
  ]);

  // Les prix sont relus au moment de l'affichage, promotions comprises : un
  // favori mis de côté il y a un mois ne doit pas afficher le prix d'alors.
  const affichages = await chargerAffichagePrixPourProduits(
    favoris.map((f) => ({
      id: f.produit.id,
      prix: f.produit.prix,
      vendeurId: f.produit.vendeurId,
    })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Mes favoris</h1>
        <Link href="/catalogue" className="text-corps-sm text-nile-700 hover:underline">
          Continuer mes achats →
        </Link>
      </div>

      {favoris.length === 0 ? (
        <EtatVide titre="Aucun article mis de côté.">
          <p className="text-corps-sm text-slate-500">
            Touchez le cœur sur un article pour le retrouver ici.
          </p>
          <Link href="/catalogue" className={btn("primaire", "md", "mt-3")}>
            Parcourir le catalogue
          </Link>
        </EtatVide>
      ) : (
        <div className="space-y-2">
          {favoris.map((f) => {
            const affichage = affichages.get(f.produit.id);
            const prix = affichage?.prixPromo ?? f.produit.prix;
            const enPromo = prix < f.produit.prix;
            const indisponible = !f.achetable || f.stock === 0;

            return (
              <Carte key={f.id} className="flex items-center gap-3 p-3 sm:p-4">
                <Link href={`/produit/${f.produit.slug}`} className="shrink-0">
                  <Vignette
                    url={f.produit.images[0]?.url}
                    alt={f.produit.titre}
                    sizes="72px"
                    className="h-16 w-16 rounded border border-contour-carte sm:h-20 sm:w-20"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/produit/${f.produit.slug}`}
                    className="block truncate text-corps-sm font-semibold text-slate-900 hover:text-nile-700"
                  >
                    {f.produit.titre}
                  </Link>
                  <p className="truncate text-etiquette-xs text-slate-500">
                    {f.produit.marque ? `${f.produit.marque} · ` : ""}
                    {f.produit.vendeur.nomBoutique}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2">
                    <Prix montant={prix} className="text-corps-sm font-bold text-slate-900" />
                    {enPromo && (
                      <Prix
                        montant={f.produit.prix}
                        className="text-etiquette-xs text-slate-400 line-through"
                      />
                    )}
                  </p>
                  {/* Signalé plutôt que masqué : voir un article disparaître
                      sans explication donne l'impression d'avoir perdu sa
                      liste. L'acheteur décide lui-même de le retirer. */}
                  {indisponible && (
                    <p className="mt-0.5 text-etiquette-xs font-semibold text-amber-700">
                      {f.achetable ? "Épuisé pour le moment" : "Plus disponible à la vente"}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <BoutonFavori
                    produitId={f.produit.id}
                    enFavori
                    retour="/favoris"
                    taille="sm"
                  />
                  {!indisponible && (
                    <BoutonPanier
                      produitId={f.produit.id}
                      stock={f.stock}
                      quantiteInitiale={quantites[f.produit.id] ?? 0}
                      taille="sm"
                    />
                  )}
                </div>
              </Carte>
            );
          })}
        </div>
      )}
    </div>
  );
}
