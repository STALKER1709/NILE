import Link from "next/link";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { getLignesInvite } from "@/modules/commande/panier-invite";
import { calculerTotal } from "@/modules/commande/commande-core";
import { retirerLigneAction } from "@/app/(compte)/panier/actions";
import { Vignette } from "@/components/ui/Vignette";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { Carte, Prix, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier" };

export default async function PanierPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const utilisateur = await getUtilisateurCourant();

  // ------------------------- VISITEUR (panier invité) -------------------------
  if (!utilisateur) {
    const lignes = await getLignesInvite();
    const disponibles = lignes.filter(
      (l) =>
        l.produit.statut === "ACTIF" &&
        l.produit.vendeur.statutValidation === "VALIDE",
    );
    const total = calculerTotal(
      disponibles.map((l) => ({ prix: l.produit.prix, quantite: l.quantite })),
    );

    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold">Mon panier</h1>

        {lignes.length === 0 ? (
          <EtatVide titre="Votre panier est vide.">
            <Link href="/catalogue" className="text-nile hover:underline">Parcourir le catalogue</Link>
          </EtatVide>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {lignes.map((l) => {
                const indispo =
                  l.produit.statut !== "ACTIF" ||
                  l.produit.vendeur.statutValidation !== "VALIDE";
                return (
                  <Carte key={l.produit.id} className="flex gap-3 p-3">
                    <Vignette
                      url={l.produit.images[0]?.url}
                      alt={l.produit.titre}
                      sizes="80px"
                      className="h-20 w-20 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/produit/${l.produit.slug}`} className="line-clamp-2 font-medium hover:underline">
                        {l.produit.titre}
                      </Link>
                      <Prix montant={l.produit.prix} className="mt-0.5 block text-sm text-gray-500" />
                      {indispo && (
                        <p className="text-xs font-medium text-red-600">Produit indisponible · retirez-le.</p>
                      )}
                      <div className="mt-2 max-w-[10rem]">
                        <BoutonPanier
                          produitId={l.produit.id}
                          stock={l.produit.stock}
                          quantiteInitiale={l.quantite}
                          rafraichirApres
                        />
                      </div>
                      <Prix
                        montant={l.produit.prix * l.quantite}
                        className="mt-1.5 block font-bold text-nile sm:hidden"
                      />
                    </div>
                    <Prix
                      montant={l.produit.prix * l.quantite}
                      className="hidden shrink-0 self-center font-bold text-nile sm:block"
                    />
                  </Carte>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Carte className="sticky top-24 space-y-3 p-4">
                <h2 className="font-semibold">Récapitulatif</h2>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sous-total</span>
                  <Prix montant={total} />
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold">
                  <span>Total</span>
                  <Prix montant={total} className="text-nile" />
                </div>
                <Link
                  href={`/connexion?suite=${encodeURIComponent("/commander")}`}
                  className={btn("accent", "lg", "w-full")}
                >
                  Passer la commande
                </Link>
                <p className="text-center text-xs text-gray-500">
                  Identifie-toi pour valider · ton panier sera conservé.{" "}
                  <Link href={`/inscription?suite=${encodeURIComponent("/commander")}`} className="text-nile hover:underline">
                    Créer un compte
                  </Link>
                </p>
              </Carte>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------ CONNECTÉ (base) -----------------------------
  const panier = await getPanierAvecLignes(utilisateur.id);
  const total = calculerTotal(
    panier.lignes.map((l) => ({ prix: l.produit.prix, quantite: l.quantite })),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Mon panier</h1>

      {ok === "ajoute" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Produit ajouté au panier.
        </p>
      )}
      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {panier.lignes.length === 0 ? (
        <EtatVide titre="Votre panier est vide.">
          <Link href="/catalogue" className="text-nile hover:underline">Parcourir le catalogue</Link>
        </EtatVide>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {panier.lignes.map((l) => {
              const indispo =
                l.produit.statut !== "ACTIF" ||
                l.produit.vendeur.statutValidation !== "VALIDE";
              const stockInsuffisant = l.produit.stock < l.quantite;
              return (
                <Carte key={l.id} className="flex gap-3 p-3">
                  <Vignette
                    url={l.produit.images[0]?.url}
                    alt={l.produit.titre}
                    sizes="80px"
                    className="h-20 w-20 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/produit/${l.produit.slug}`} className="line-clamp-2 font-medium hover:underline">
                      {l.produit.titre}
                    </Link>
                    <Prix montant={l.produit.prix} className="mt-0.5 block text-sm text-gray-500" />
                    {indispo && <p className="text-xs font-medium text-red-600">Produit indisponible · à retirer.</p>}
                    {!indispo && stockInsuffisant && (
                      <p className="text-xs font-medium text-red-600">Stock restant : {l.produit.stock}.</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <div className="max-w-[10rem] flex-1">
                        <BoutonPanier
                          produitId={l.produit.id}
                          stock={l.produit.stock}
                          quantiteInitiale={l.quantite}
                          rafraichirApres
                        />
                      </div>
                      <form action={retirerLigneAction}>
                        <input type="hidden" name="ligneId" value={l.id} />
                        <button type="submit" className="rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:underline">
                          Retirer
                        </button>
                      </form>
                    </div>
                    {/* Total de ligne : sous les infos sur mobile (évite le débordement) */}
                    <Prix
                      montant={l.produit.prix * l.quantite}
                      className="mt-1.5 block font-bold text-nile sm:hidden"
                    />
                  </div>
                  <Prix
                    montant={l.produit.prix * l.quantite}
                    className="hidden shrink-0 self-center font-bold text-nile sm:block"
                  />
                </Carte>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <Carte className="sticky top-24 space-y-3 p-4">
              <h2 className="font-semibold">Récapitulatif</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <Prix montant={total} />
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold">
                <span>Total</span>
                <Prix montant={total} className="text-nile" />
              </div>
              <Link href="/commander" className={btn("accent", "lg", "w-full")}>
                Passer la commande
              </Link>
            </Carte>
          </div>
        </div>
      )}
    </div>
  );
}
