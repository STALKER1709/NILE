import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { listerFavoris, compterFavoris, LIMITE_FAVORIS } from "@/modules/catalogue/favoris";
import {
  etatFavori,
  messageEtatFavori,
  actionFavori,
} from "@/modules/catalogue/favoris-core";
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
  const [favoris, quantites, total] = await Promise.all([
    listerFavoris(utilisateur.id),
    // Le compteur « supermarché » du bouton doit refléter ce qui est déjà au
    // panier, sinon un article ajouté depuis cette page repartirait de zéro.
    getQuantitesPanier(utilisateur.id),
    // Le total réel, qui peut dépasser ce que la page affiche : mieux vaut le
    // dire que laisser croire à une liste tronquée en silence.
    compterFavoris(utilisateur.id),
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
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
          Mes favoris
          {total > 0 && (
            <span className="ml-2 text-corps-sm font-normal text-slate-500">
              {total} article{total > 1 ? "s" : ""}
            </span>
          )}
        </h1>
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
          {/* Dit plutôt que tronqué en silence : un acheteur qui compte ses
              favoris et n'en retrouve pas le nombre croit à une perte. */}
          {total > favoris.length && (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-etiquette-xs text-amber-800">
              Les {favoris.length} articles les plus récents sont affichés. Retirez-en
              pour voir les plus anciens.
            </p>
          )}
          {favoris.map((f) => {
            const affichage = affichages.get(f.produit.id);
            const prix = affichage?.prixPromo ?? f.produit.prix;
            const enPromo = prix < f.produit.prix;
            const etat = etatFavori(f);
            const alerte = messageEtatFavori(etat);
            const action = actionFavori(f);

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
                  {alerte && (
                    <p className="mt-0.5 text-etiquette-xs font-semibold text-amber-700">
                      {alerte}
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
                  {action === "AJOUTER" && (
                    <BoutonPanier
                      varianteId={f.varianteId as string}
                      stock={f.stock}
                      quantiteInitiale={quantites[f.produit.id] ?? 0}
                      taille="sm"
                    />
                  )}
                  {/* Article décliné : la taille se choisit sur la fiche, pas
                      depuis la liste de souhaits. */}
                  {action === "CHOISIR" && (
                    <Link
                      href={`/produit/${f.produit.slug}`}
                      className={btn("primaire", "sm")}
                    >
                      Choisir
                    </Link>
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
