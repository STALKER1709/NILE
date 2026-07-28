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

  // Lien conservant les filtres actifs, en changeant une seule clé.
  const lienFiltre = (cle: string, valeur: string | null) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({
      q: sp.q, categorie: sp.categorie, prixMin: sp.prixMin,
      prixMax: sp.prixMax, tri: sp.tri,
    })) {
      if (v && k !== cle) params.set(k, v);
    }
    if (valeur) params.set(cle, valeur);
    const qs = params.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  };
  const filtreActif = !!(sp.q || sp.categorie || sp.prixMin || sp.prixMax);

  // Colonne de filtres : catégories cliquables + fourchette de prix.
  const filtres = (
    <>
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-etiquette-md uppercase tracking-wider text-slate-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Catégories
        </h2>
        <div className="flex flex-col gap-0.5">
          <Link
            href={lienFiltre("categorie", null)}
            className={`rounded px-3 py-2 text-corps-sm transition-colors ${
              !sp.categorie ? "bg-nile-50 font-semibold text-nile-700" : "text-slate-600 hover:bg-surface-subtile"
            }`}
          >
            Toutes les catégories
          </Link>
          {optionsCat.map((c) => {
            const cat = categories.find((x) => x.id === c.id);
            const actif = sp.categorie === cat?.slug;
            return (
              <Link
                key={c.id}
                href={lienFiltre("categorie", cat?.slug ?? null)}
                className={`truncate rounded px-3 py-2 text-corps-sm transition-colors ${
                  actif ? "bg-nile-50 font-semibold text-nile-700" : "text-slate-600 hover:bg-surface-subtile"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Fourchette de prix : vrai formulaire GET, fonctionne sans JavaScript. */}
      <form method="get" className="border-t border-contour-carte pt-4">
        {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
        {sp.q && <input type="hidden" name="q" value={sp.q} />}
        {sp.tri && <input type="hidden" name="tri" value={sp.tri} />}
        <h2 className="mb-3 text-etiquette-md uppercase tracking-wider text-slate-500">
          Plage de prix (FCFA)
        </h2>
        <div className="flex items-center gap-2">
          <input name="prixMin" type="number" min={0} defaultValue={sp.prixMin ?? ""} placeholder="Min" aria-label="Prix minimum" className={`${champClass} w-full`} />
          <span className="text-slate-400">–</span>
          <input name="prixMax" type="number" min={0} defaultValue={sp.prixMax ?? ""} placeholder="Max" aria-label="Prix maximum" className={`${champClass} w-full`} />
        </div>
        <button type="submit" className={btn("primaire", "sm", "mt-3 w-full")}>
          Appliquer
        </button>
      </form>

      {filtreActif && (
        <Link href="/catalogue" className="block border-t border-contour-carte pt-4 text-corps-sm font-semibold text-nile-700 hover:underline">
          Réinitialiser les filtres
        </Link>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-gouttiere lg:flex-row">
      {/* Colonne de filtres : latérale et collante sur grand écran, repliable
          sur mobile pour que le premier produit reste visible sans défiler. */}
      <aside className="lg:w-64 lg:shrink-0">
        <div className="hidden space-y-4 rounded-xl border border-contour-carte bg-white p-5 lg:sticky lg:top-24 lg:block">
          {filtres}
        </div>
        <details className="group rounded-xl border border-contour-carte bg-white lg:hidden" open={filtreActif}>
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold text-slate-900">
            Filtres
            <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="space-y-4 p-5 pt-0">{filtres}</div>
        </details>
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
              {categorieChoisie ? categorieChoisie.nom : "Tous les produits"}
            </h1>
            <p className="mt-1 text-corps-sm text-slate-500">
              {q
                ? `${total} résultat${total > 1 ? "s" : ""} pour « ${q} »`
                : "Découvrez nos meilleures offres sélectionnées pour vous."}
            </p>
          </div>
          {/* Tri : soumission automatique si JavaScript, bouton sinon. */}
          <form method="get" className="flex shrink-0 items-center gap-2">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
            {sp.prixMin && <input type="hidden" name="prixMin" value={sp.prixMin} />}
            {sp.prixMax && <input type="hidden" name="prixMax" value={sp.prixMax} />}
            <label htmlFor="tri" className="whitespace-nowrap text-corps-sm text-slate-500">
              Trier par
            </label>
            <select id="tri" name="tri" defaultValue={sp.tri ?? "recent"} className={`${champClass} w-44`}>
              <option value="recent">Plus récent</option>
              <option value="populaire">Mieux notés</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
            </select>
            <button type="submit" className={btn("secondaire", "sm")}>OK</button>
          </form>
        </div>

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
    </div>
  );
}
