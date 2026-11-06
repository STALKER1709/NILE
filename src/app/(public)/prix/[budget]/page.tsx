import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";

export const dynamic = "force-dynamic";

const budgets: Record<string, { label: string; max: number }> = {
  "moins-de-10000": { label: "Moins de 10 000 FCFA", max: 10000 },
  "moins-de-25000": { label: "Moins de 25 000 FCFA", max: 25000 },
  "moins-de-50000": { label: "Moins de 50 000 FCFA", max: 50000 },
  "moins-de-100000": { label: "Moins de 100 000 FCFA", max: 100000 },
};

export async function generateMetadata({ params }: { params: Promise<{ budget: string }> }): Promise<Metadata> {
  const { budget } = await params;
  const config = budgets[budget];
  if (!config) return { title: "Sélection introuvable" };
  const title = `Acheter à ${config.label} au Cameroun — NILE`;
  const description = `Découvrez les produits disponibles à ${config.label} sur NILE. Comparez les offres de boutiques locales et trouvez des idées d’achat au Cameroun.`;
  return { title, description, alternates: { canonical: `/prix/${budget}` }, openGraph: { title, description, url: `/prix/${budget}`, type: "website", locale: "fr_CM" } };
}

export default async function BudgetPage({ params }: { params: Promise<{ budget: string }> }) {
  const { budget } = await params;
  const config = budgets[budget];
  if (!config) notFound();
  const utilisateur = await getUtilisateurCourant();
  const [{ produits, total }, quantites] = await Promise.all([
    rechercherProduitsCatalogue({ prixMax: config.max, tri: "prix_asc", page: 1, parPage: 24 }),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);
  const favoris = await favorisParmi(utilisateur?.id ?? null, produits.map((p) => p.id));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Produits ${config.label} — NILE`,
    description: `Sélection de produits à ${config.label} au Cameroun.`,
    url: `/prix/${budget}`,
    mainEntity: { "@type": "ItemList", numberOfItems: produits.length, itemListElement: produits.slice(0, 12).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.titre, url: `/produit/${p.slug}` })) },
  };
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d’Ariane" className="mb-5 pt-4 text-sm text-slate-500"><Link href="/catalogue" className="hover:text-nile-700">Catalogue</Link><span className="mx-2">/</span><span className="font-medium text-slate-800">Par budget</span></nav>
      <header className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Bons plans au Cameroun</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B192C] sm:text-4xl">Acheter à {config.label}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Explorez les produits affichés dans cette fourchette de prix sur NILE. Les offres et disponibilités évoluent selon les boutiques.</p>
        <div className="mt-4 flex flex-wrap gap-2">{Object.entries(budgets).filter(([slug]) => slug !== budget).map(([slug, b]) => <Link key={slug} href={`/prix/${slug}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-nile-700 hover:bg-nile-50">{b.label}</Link>)}</div>
      </header>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-[#0B192C]">Produits dans cette sélection</h2><span className="text-sm text-slate-500">{total} résultat{total > 1 ? "s" : ""}</span></div>
      {produits.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Aucun produit ne correspond actuellement à cette sélection.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{produits.map((p, i) => <CarteProduitVitrine key={p.id} produit={p} quantitePanier={quantites[p.id] ?? 0} priority={i < 4} index={i} favori={utilisateur ? { enFavori: favoris.has(p.id), retour: `/prix/${budget}` } : undefined} afficherCategorie sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 210px" />)}</div>}
    </div>
  );
}
