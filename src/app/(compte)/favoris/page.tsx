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
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="min-w-0 break-words text-titre-sm text-nile-800 sm:text-titre-md">
          Mes favoris
          {total > 0 && (
            <span className="ml-2 text-corps-sm font-normal text-slate-500">
              {total} article{total > 1 ? "s" : ""}
            </span>
          )}
        </h1>
        <Link href="/catalogue" className="self-start text-corps-sm font-semibold text-nile-700 hover:underline sm:self-auto">
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
        <div className="space-y-3 sm:space-y-2">
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
              <Carte key={f.id} className="grid w-full min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-3 overflow-hidden p-3 sm:grid-cols-[80px_minmax(0,1fr)_112px] sm:items-center sm:gap-3 sm:p-4">
                <Link href={`/produit/${f.produit.slug}`} className="block w-16 min-w-0 shrink-0 self-start sm:w-20">
                  <Vignette
                    url={f.produit.images[0]?.url}
                    alt={f.produit.titre}
                    sizes="72px"
                    className="h-16 w-16 max-w-full rounded-xl border border-contour-carte bg-slate-50 sm:h-20 sm:w-20"
                  />
                </Link>

                <div className="min-w-0 sm:flex-1">
                  <Link
                    href={`/produit/${f.produit.slug}`}
                    className="block ligne-2 break-words text-sm font-semibold leading-snug text-slate-900 hover:text-nile-700 sm:text-corps-sm"
                  >
                    {f.produit.titre}
                  </Link>
                  <p className="break-words text-etiquette-xs text-slate-500">
                    {f.produit.marque ? `${f.produit.marque} · ` : ""}
                    {f.produit.vendeur.nomBoutique}
                  </p>
                  <p className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
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

                <div className="col-span-2 flex w-full min-w-0 items-center gap-2 border-t border-stone-100 pt-3 sm:col-span-1 sm:ml-0 sm:flex-col sm:items-stretch sm:justify-start sm:gap-2 sm:border-0 sm:pt-0">
                  <div className="shrink-0">
                    <BoutonFavori
                      produitId={f.produit.id}
                      enFavori
                      retour="/favoris"
                      taille="sm"
                    />
                  </div>
                  {action === "AJOUTER" && (
                    <div className="min-w-0 flex-1 sm:w-full sm:flex-none">
                      <BoutonPanier
                        varianteId={f.varianteId as string}
                        stock={f.stock}
                        quantiteInitiale={quantites[f.produit.id] ?? 0}
                        taille="sm"
                      />
                    </div>
                  )}
                  {/* Article décliné : la taille se choisit sur la fiche, pas
                      depuis la liste de souhaits. */}
                  {action === "CHOISIR" && (
                    <div className="min-w-0 flex-1 sm:w-[112px] sm:flex-none">
                    <Link
                      href={`/produit/${f.produit.slug}`}
                      className={btn("primaire", "sm", "w-full min-w-0 whitespace-normal sm:w-full")}
                    >
                      Choisir
                    </Link>
                    </div>
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
