import Link from "next/link";
import {
  listerCategories,
  collecterIdsCategorieEtDescendants,
  aplatirPourSelect,
} from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { normaliserParamsRecherche } from "@/modules/catalogue/recherche";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesPanier } from "@/modules/commande/panier";
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
  const quantites = await getQuantitesPanier(utilisateur?.id ?? null);

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
        <h1 className="text-xl font-bold">Catalogue</h1>
        <span className="text-sm text-gray-500">
          {total} produit{total > 1 ? "s" : ""}
        </span>
      </div>

      {/* Filtres (repliables sur mobile, sans JS) */}
      <details className="group rounded-xl2 border border-gray-100 bg-white shadow-carte" open>
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium sm:hidden">
          Filtres & recherche
          <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
        </summary>
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
          <input name="prixMin" type="number" min={0} defaultValue={sp.prixMin ?? ""} placeholder="Min FCFA" className={`${champClass} sm:w-28`} />
          <input name="prixMax" type="number" min={0} defaultValue={sp.prixMax ?? ""} placeholder="Max FCFA" className={`${champClass} sm:w-28`} />
          <button type="submit" className={btn("primaire", "md")}>Filtrer</button>
        </form>
      </details>

      {produits.length === 0 ? (
        <EtatVide titre="Aucun produit ne correspond à votre recherche.">
          Essayez d'élargir vos filtres.
        </EtatVide>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {produits.map((p, i) => (
            <CarteProduit
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 5}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-2 text-sm">
          {page > 1 && (
            <Link href={lienPage(page - 1)} className={btn("secondaire", "sm")}>← Précédent</Link>
          )}
          <span className="text-gray-500">Page {page} / {pages}</span>
          {page < pages && (
            <Link href={lienPage(page + 1)} className={btn("secondaire", "sm")}>Suivant →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
