import Link from "next/link";
import { formaterXAF } from "@/lib/money";
import {
  listerCategories,
  collecterIdsCategorieEtDescendants,
  aplatirPourSelect,
} from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { normaliserParamsRecherche } from "@/modules/catalogue/recherche";

export const dynamic = "force-dynamic";

const PAR_PAGE = 12;
const champ =
  "block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";

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

  // Filtre par catégorie (slug) -> inclut les sous-catégories.
  let categorieIds: string[] | undefined;
  const categorieChoisie = sp.categorie
    ? categories.find((c) => c.slug === sp.categorie)
    : undefined;
  if (categorieChoisie) {
    categorieIds = collecterIdsCategorieEtDescendants(
      categorieChoisie.id,
      categories,
    );
  }

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

  // Conserve les filtres dans les liens de pagination.
  const construireLienPage = (p: number) => {
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
      <h1 className="text-xl font-bold">Catalogue</h1>

      {/* Recherche + filtres (GET, sans JS) */}
      <form method="get" className="grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher un produit…"
          className={`${champ} sm:col-span-2`}
        />
        <select name="categorie" defaultValue={sp.categorie ?? ""} className={champ}>
          <option value="">Toutes les catégories</option>
          {optionsCat.map((c) => {
            const cat = categories.find((x) => x.id === c.id);
            return (
              <option key={c.id} value={cat?.slug ?? ""}>
                {c.label}
              </option>
            );
          })}
        </select>
        <select name="tri" defaultValue={sp.tri ?? "recent"} className={champ}>
          <option value="recent">Plus récents</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
        <input name="prixMin" type="number" min={0} defaultValue={sp.prixMin ?? ""} placeholder="Prix min (FCFA)" className={champ} />
        <input name="prixMax" type="number" min={0} defaultValue={sp.prixMax ?? ""} placeholder="Prix max (FCFA)" className={champ} />
        <button type="submit" className="rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark sm:col-span-2">
          Filtrer
        </button>
      </form>

      <p className="text-sm text-gray-500">
        {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
      </p>

      {produits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucun produit ne correspond à votre recherche.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {produits.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
              <Link href={`/produit/${p.slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0]?.url ?? "/placeholder-produit.svg"}
                  alt={p.titre}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2">
                  <p className="truncate text-sm font-medium">{p.titre}</p>
                  <p className="text-sm font-semibold text-nile">{formaterXAF(p.prix)}</p>
                  <p className="truncate text-xs text-gray-500">{p.vendeur.nomBoutique}</p>
                  {p.stock === 0 && (
                    <p className="text-xs font-medium text-red-600">Indisponible</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={construireLienPage(page - 1)} className="text-nile hover:underline">
              ← Précédent
            </Link>
          )}
          <span className="text-gray-500">Page {page} / {pages}</span>
          {page < pages && (
            <Link href={construireLienPage(page + 1)} className="text-nile hover:underline">
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
