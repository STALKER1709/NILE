import Link from "next/link";
import {
  listerCategories,
  navigationCategories,
  collecterIdsCategorieEtDescendants,
} from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { rechercherBoutiques } from "@/modules/catalogue/boutiques";
import { normaliserParamsRecherche } from "@/modules/catalogue/recherche";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { IconeCategorie } from "@/components/categorie/IconeCategorie";
import { listerMarquesCatalogue } from "@/modules/catalogue/produits";
import { SelectTri } from "@/components/catalogue/SelectTri";
import { Pagination } from "@/components/ui/Pagination";
import { bornesAffichage } from "@/modules/catalogue/pagination";
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
    marques?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const { q, prixMin, prixMax, tri, marques } = normaliserParamsRecherche(sp);

  const categories = await listerCategories();
  // Rayons seulement, et les sous-catégories du rayon ouvert : voir
  // `navigationCategories`.
  const navigation = navigationCategories(categories, sp.categorie);

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
    marques,
    tri,
    page,
    parPage: PAR_PAGE,
  });

  // Marques du périmètre COURANT (rayon choisi compris) : proposer une marque
  // qui ne ramènerait aucun résultat ferait douter du catalogue.
  const marquesDisponibles = await listerMarquesCatalogue(categorieIds);

  // Boutiques correspondant au terme (uniquement 1re page d'une recherche).
  const boutiques = q && page === 1 ? await rechercherBoutiques(q, 6) : [];

  const lienPage = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.categorie) params.set("categorie", sp.categorie);
    if (sp.prixMin) params.set("prixMin", sp.prixMin);
    if (sp.prixMax) params.set("prixMax", sp.prixMax);
    if (sp.tri) params.set("tri", sp.tri);
    for (const m of marques) params.append("marques", m);
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
    // Les marques cochées survivent à un changement de rayon ou de tri : les
    // perdre à chaque clic obligerait l'acheteur à tout recocher.
    if (cle !== "marques") for (const m of marques) params.append("marques", m);
    if (valeur) params.set(cle, valeur);
    const qs = params.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  };
  const filtreActif = !!(
    sp.q ||
    sp.categorie ||
    sp.prixMin ||
    sp.prixMax ||
    marques.length > 0
  );

  // Colonne de filtres : catégories cliquables + fourchette de prix.
  const filtres = (
    <>
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-titre-sm text-nile-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
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
          {navigation.map((c) => (
            <Link
              key={c.id}
              href={lienFiltre("categorie", c.slug)}
              className={`flex items-center gap-2.5 truncate rounded px-3 py-2 text-corps-sm transition-colors ${
                c.niveau > 0 ? "ml-4 border-l border-contour-carte" : ""
              } ${
                c.actif
                  ? "bg-nile-50 font-semibold text-nile-700"
                  : "text-slate-600 hover:bg-surface-subtile"
              }`}
            >
              {/* Icône réservée aux rayons : une sous-catégorie dépliée se
                  distingue par son décalage, pas par un second symbole. */}
              {c.niveau === 0 && (
                <span className={`shrink-0 ${c.actif ? "text-nile-700" : "text-slate-400"}`}>
                  <IconeCategorie nom={c.nom} />
                </span>
              )}
              <span className="truncate">{c.nom}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Fourchette de prix : vrai formulaire GET, fonctionne sans JavaScript. */}
      <form method="get" className="border-t border-contour-carte pt-4">
        {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
        {sp.q && <input type="hidden" name="q" value={sp.q} />}
        {sp.tri && <input type="hidden" name="tri" value={sp.tri} />}
        {/* Marques dans le MÊME formulaire que le prix : un seul bouton
            « Appliquer » pour tous les filtres, donc un seul rechargement —
            la data mobile se paie cher ici. Sans JavaScript, la case cochée
            n'agit qu'à la soumission. */}
        {marquesDisponibles.length > 0 && (
          <fieldset className="mb-4">
            <legend className="mb-2 text-etiquette-md text-nile-800">Marque</legend>
            <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
              {marquesDisponibles.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-corps-sm text-slate-600 hover:bg-surface-subtile"
                >
                  <input
                    type="checkbox"
                    name="marques"
                    value={m}
                    defaultChecked={marques.includes(m)}
                    className="accent-nile-700"
                  />
                  <span className="truncate">{m}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <h2 className="mb-3 text-etiquette-md text-nile-800">Plage de prix (FCFA)</h2>
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
          {/* Tri : soumis dès le changement de valeur, sans bouton.
              Le formulaire reste un vrai GET, donc « ?tri=… » est une URL
              partageable et l'état du tri survit à un rechargement. */}
          <form method="get" className="flex shrink-0 items-center gap-2">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
            {sp.prixMin && <input type="hidden" name="prixMin" value={sp.prixMin} />}
            {sp.prixMax && <input type="hidden" name="prixMax" value={sp.prixMax} />}
            <label htmlFor="tri" className="whitespace-nowrap text-corps-sm text-slate-500">
              Trier par
            </label>
            <SelectTri valeur={sp.tri ?? "recent"} className={`${champClass} w-44`} />
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
        // 2 colonnes dès le plus petit écran : la maquette en prévoyait une
        // seule, mais 12 grandes cartes empilées font ~6 900 px de défilement.
        // La data mobile est chère au Cameroun, on privilégie la densité.
        <div className="grid grid-cols-2 gap-3 sm:gap-gouttiere lg:grid-cols-3 xl:grid-cols-4">
          {produits.map((p, i) => (
            <CarteProduitVitrine
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 4}
              index={i}
              actions="simple"
              afficherCategorie
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 280px"
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="space-y-3 pt-2">
          <Pagination page={page} pages={pages} lien={lienPage} etiquette="Pages du catalogue" />
          <p className="text-center text-corps-sm text-slate-500">
            {(() => {
              const { debut, fin } = bornesAffichage(page, PAR_PAGE, total);
              return `Produits ${debut} à ${fin} sur ${total}`;
            })()}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
