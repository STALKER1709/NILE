import Link from "next/link";
import {
  listerCategories,
  collecterIdsCategorieEtDescendants,
  aplatirPourSelect,
} from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { rechercherBoutiques } from "@/modules/catalogue/boutiques";
import { normaliserParamsRecherche } from "@/modules/catalogue/recherche";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { champClass, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catalogue" };
const PAR_PAGE = 12;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    prixMin?: string;
    prixMax?: string;
    tri?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const { q, prixMin, prixMax, tri } = normaliserParamsRecherche(sp);

  const categories = await listerCategories();
  const optionsCat = aplatirPourSelect(categories);

  let categorieIds: string[] | undefined;
  const categorieChoisie = sp.categorie
    ? categories.find((c) => c.slug === sp.categorie)
    : undefined;
  if (categorieChoisie) {
    categorieIds = collecterIdsCategorieEtDescendants(categorieChoisie.id, categories);
  }

  const utilisateur = await getUtilisateurCourant();
  const quantites = await getQuantitesAffichees(utilisateur?.id ?? null);

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { produits, total, pages } = await rechercherProduitsCatalogue({
    q,
    categorieIds,
    prixMin,
    prixMax,
    tri,
    page,
    parPage: PAR_PAGE,
  });

  // Boutiques correspondant au terme (uniquement 1re page d'une recherche).
  const boutiques = q && page === 1 ? await rechercherBoutiques(q, 6) : [];

  const lienPage = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.categorie) params.set("categorie", sp.categorie);
    if (sp.prixMin) params.set("prixMin", sp.prixMin);
    if (sp.prixMax) params.set("prixMax", sp.prixMax);
    if (sp.tri) params.set("tri", sp.tri);
    params.set("page", String(p));
    return `/catalogue?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Catalogue</h1>
        <span className="text-sm text-slate-500">
          {total} produit{total > 1 ? "s" : ""}
        </span>
      </div>

      {/* Filtres : repliés par défaut sur mobile (le 1er produit reste visible
          sans défiler), toujours visibles sur grand écran. Sans JavaScript. */}
      {(() => {
        const filtreActif = !!(sp.q || sp.categorie || sp.prixMin || sp.prixMax || sp.tri);
        const formulaire = (
          <form method="get" className="flex flex-col gap-3 p-4 pt-0 sm:flex-row sm:flex-wrap sm:items-end sm:pt-4">
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Rechercher…" className={`${champClass} sm:min-w-[12rem] sm:flex-1`} />
            <select name="categorie" defaultValue={sp.categorie ?? ""} className={`${champClass} sm:w-48`}>
              <option value="">Toutes catégories</option>
              {optionsCat.map((c) => {
                const cat = categories.find((x) => x.id === c.id);
                return <option key={c.id} value={cat?.slug ?? ""}>{c.label}</option>;
              })}
            </select>
            <select name="tri" defaultValue={sp.tri ?? "recent"} className={`${champClass} sm:w-40`}>
              <option value="recent">Plus récents</option>
              <option value="populaire">Les mieux notés</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
            </select>
            <input name="prixMin" type="number" min={0} defaultValue={sp.prixMin ?? ""} placeholder="Min FCFA" className={`${champClass} sm:w-32`} />
            <input name="prixMax" type="number" min={0} defaultValue={sp.prixMax ?? ""} placeholder="Max FCFA" className={`${champClass} sm:w-32`} />
            <button type="submit" className={btn("primaire", "md")}>Filtrer</button>
          </form>
        );
        return (
          <>
            {/* Mobile : repliable, ouvert seulement si un filtre est déjà actif. */}
            <details
              className="group rounded-xl border border-contour-carte bg-white shadow-carte sm:hidden"
              open={filtreActif}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
                Filtres & recherche
                <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              {formulaire}
            </details>
            {/* Desktop : toujours visible. */}
            <div className="hidden rounded-xl border border-contour-carte bg-white shadow-carte sm:block">
              {formulaire}
            </div>
          </>
        );
      })()}

      {boutiques.length > 0 && (
        <section className="rounded-xl border border-contour-carte bg-white p-4 shadow-carte">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Boutiques pour « {q} »
          </h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {boutiques.map((b) => (
              <Link
                key={b.id}
                href={`/boutique/${b.id}`}
                className="flex min-w-[13rem] shrink-0 items-center gap-3 rounded border border-contour-carte p-3 transition hover:-translate-y-0.5 hover:border-nile-100 hover:shadow-flottant"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-nile text-lg font-bold text-white">
                  {b.nomBoutique.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {b.nomBoutique}
                  </span>
                  <span className="text-xs text-slate-500">
                    Boutique vérifiée · {b.nbProduits} produit
                    {b.nbProduits > 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {produits.length === 0 ? (
        boutiques.length > 0 ? (
          <EtatVide titre="Aucun produit ne correspond, mais des boutiques oui.">
            Ouvrez une boutique ci-dessus ou élargissez vos filtres.
          </EtatVide>
        ) : (
          <EtatVide titre="Aucun produit ne correspond à votre recherche.">
            Essayez d'élargir vos filtres.
          </EtatVide>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {produits.map((p, i) => (
            <CarteProduit
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 5}
              index={i}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-2 text-sm">
          {page > 1 && (
            <Link href={lienPage(page - 1)} className={btn("secondaire", "sm")}>← Précédent</Link>
          )}
          <span className="text-slate-500">Page {page} / {pages}</span>
          {page < pages && (
            <Link href={lienPage(page + 1)} className={btn("secondaire", "sm")}>Suivant →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
