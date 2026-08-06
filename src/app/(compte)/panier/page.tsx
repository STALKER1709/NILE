import Link from "next/link";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { getLignesInvite } from "@/modules/commande/panier-invite";
import { calculerTotal } from "@/modules/commande/commande-core";
import { chargerAffichagePrixPourProduits } from "@/modules/promotion/promotion";
import { axesParCategorie } from "@/modules/catalogue/axes";
import { libelleVariante } from "@/modules/catalogue/variante-core";
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
  rachat: "Les articles de votre commande ont été ajoutés au panier.",
};

export default async function PanierPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; avertissement?: string }>;
}) {
  const { ok, erreur, avertissement } = await searchParams;
  const utilisateur = await getUtilisateurCourant();

  // Les deux parcours produisent la même liste d'articles : la mise en page
  // qui suit est donc unique.
  type LigneBrute = {
    produit: {
      id: string;
      slug: string;
      titre: string;
      prix: number;
      statut: string;
      categorieId: string;
      vendeurId: string;
      vendeur: { statutValidation: string };
      images: { url: string }[];
    };
    variante: { id: string; valeur1: string; valeur2: string; stock: number; actif: boolean };
    quantite: number;
  };
  let lignesBrutes: LigneBrute[];
  if (utilisateur) {
    const panier = await getPanierAvecLignes(utilisateur.id);
    lignesBrutes = panier.lignes;
  } else {
    lignesBrutes = await getLignesInvite();
  }

  const [affichages, axesParCat] = await Promise.all([
    chargerAffichagePrixPourProduits(
      lignesBrutes.map((l) => ({ id: l.produit.id, prix: l.produit.prix, vendeurId: l.produit.vendeurId })),
    ),
    // Les axes nomment la déclinaison de chaque ligne : « 42 » seul ne se
    // comprend pas, « Pointure 42 » oui.
    axesParCategorie(lignesBrutes.map((l) => l.produit.categorieId)),
  ]);
  const articles: ArticlePanier[] = lignesBrutes.map((l) => {
    const affichage = affichages.get(l.produit.id);
    return {
      produitId: l.produit.id,
      varianteId: l.variante.id,
      declinaison: libelleVariante(l.variante, axesParCat.get(l.produit.categorieId) ?? []),
      slug: l.produit.slug,
      titre: l.produit.titre,
      prix: l.produit.prix,
      prixEffectif: affichage?.prixPromo ?? l.produit.prix,
      pourcentageReduction: affichage?.pourcentageReduction ?? null,
      // Le stock est celui de la DÉCLINAISON : il peut rester dix M et plus un
      // seul XL, et c'est le XL qui est dans ce panier.
      stock: l.variante.stock,
      quantite: l.quantite,
      imageUrl: l.produit.images[0]?.url,
      indisponible:
        l.produit.statut !== "ACTIF" ||
        l.produit.vendeur.statutValidation !== "VALIDE" ||
        // Déclinaison retirée de la vente : la commande la refuserait, autant
        // le dire ici plutôt qu'à la validation.
        !l.variante.actif,
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
      {avertissement && (
        <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
          {avertissement}
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
            {/* Clé sur la DÉCLINAISON : un même article peut occuper deux
                lignes du panier, en M et en XL. */}
            {articles.map((a) => (
              <CarteArticlePanier key={a.varianteId} article={a} />
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
