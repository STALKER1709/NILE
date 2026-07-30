import Link from "next/link";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { getLignesInvite } from "@/modules/commande/panier-invite";
import { calculerTotal } from "@/modules/commande/commande-core";
import { chargerAffichagePrixPourProduits } from "@/modules/promotion/promotion";
import { viderPanierAction } from "@/app/(compte)/panier/actions";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import {
  CarteArticlePanier,
  BlocLivraison,
  RecapitulatifPanier,
  type ArticlePanier,
} from "@/components/panier/BlocsPanier";
import { btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier" };

const MESSAGES_OK: Record<string, string> = {
  vide: "Votre panier a été vidé.",
  retire: "Article retiré du panier.",
  ajoute: "Produit ajouté au panier.",
};

export default async function PanierPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const utilisateur = await getUtilisateurCourant();

  // Les deux parcours produisent la même liste d'articles : la mise en page
  // qui suit est donc unique.
  type LigneBrute = { produit: { id: string; slug: string; titre: string; prix: number; stock: number; statut: string; vendeurId: string; vendeur: { statutValidation: string }; images: { url: string }[] }; quantite: number };
  let lignesBrutes: LigneBrute[];
  if (utilisateur) {
    const panier = await getPanierAvecLignes(utilisateur.id);
    lignesBrutes = panier.lignes;
  } else {
    lignesBrutes = await getLignesInvite();
  }

  const affichages = await chargerAffichagePrixPourProduits(
    lignesBrutes.map((l) => ({ id: l.produit.id, prix: l.produit.prix, vendeurId: l.produit.vendeurId })),
  );
  const articles: ArticlePanier[] = lignesBrutes.map((l) => {
    const affichage = affichages.get(l.produit.id);
    return {
      produitId: l.produit.id,
      slug: l.produit.slug,
      titre: l.produit.titre,
      prix: l.produit.prix,
      prixEffectif: affichage?.prixPromo ?? l.produit.prix,
      pourcentageReduction: affichage?.pourcentageReduction ?? null,
      stock: l.produit.stock,
      quantite: l.quantite,
      imageUrl: l.produit.images[0]?.url,
      indisponible:
        l.produit.statut !== "ACTIF" ||
        l.produit.vendeur.statutValidation !== "VALIDE",
    };
  });

  // Le total ne compte que les articles réellement commandables.
  const total = calculerTotal(
    articles
      .filter((a) => !a.indisponible)
      .map((a) => ({ prix: a.prixEffectif, quantite: a.quantite })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Mon panier</h1>
          <p className="mt-2 text-corps-md text-slate-600">
            Vérifiez vos articles avant de passer commande.
          </p>
        </div>
        {articles.length > 0 && (
          <form action={viderPanierAction}>
            <BoutonConfirme
              question="Vider entièrement votre panier ? Cette action est irréversible."
              enCours="Suppression…"
              className={btn("danger", "sm")}
            >
              Vider le panier
            </BoutonConfirme>
          </form>
        )}
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-nile-100 bg-nile-50 px-3 py-2 text-sm text-nile-800">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {articles.length === 0 ? (
        <EtatVide titre="Votre panier est vide.">
          <Link href="/catalogue" className="text-nile hover:underline">
            Parcourir le catalogue
          </Link>
        </EtatVide>
      ) : (
        <div className="grid grid-cols-1 items-start gap-gouttiere lg:grid-cols-12">
          <div className="space-y-gouttiere lg:col-span-8">
            {articles.map((a) => (
              <CarteArticlePanier key={a.produitId} article={a} />
            ))}
            <BlocLivraison />
          </div>

          <aside className="lg:col-span-4">
            <RecapitulatifPanier total={total}>
              {utilisateur ? (
                <>
                  <Link href="/commander" className={btn("primaire", "lg", "w-full")}>
                    Passer la commande
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <p className="mt-4 text-center text-etiquette-xs text-slate-500">
                    Paiement Mobile Money via Monetbil, ou en espèces à la
                    livraison. Vous choisirez à l&apos;étape suivante.
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href={`/connexion?suite=${encodeURIComponent("/commander")}`}
                    className={btn("primaire", "lg", "w-full")}
                  >
                    Passer la commande
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <p className="mt-4 text-center text-etiquette-xs text-slate-500">
                    Identifiez-vous pour valider · votre panier sera conservé.{" "}
                    <Link
                      href={`/inscription?suite=${encodeURIComponent("/commander")}`}
                      className="text-nile-700 hover:underline"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </>
              )}
            </RecapitulatifPanier>
          </aside>
        </div>
      )}
    </div>
  );
}
