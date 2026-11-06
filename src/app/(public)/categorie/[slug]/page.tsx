import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { collecterIdsCategorieEtDescendants, listerCategories } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { btn } from "@/components/ui/kit";
import { aConfirmeMajorite, categorieEstReservee18 } from "@/modules/catalogue/acces-18";

export const dynamic = "force-dynamic";

const SITE_DESCRIPTION = "Découvrez et achetez en ligne au Cameroun sur NILE.";

async function getCategorie(slug: string) {
  return prisma.categorie.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categorie = await getCategorie(slug);
  if (!categorie) return { title: "Catégorie introuvable" };
  const title = `${categorie.nom} — Acheter en ligne au Cameroun`;
  const description = `Découvrez ${categorie.nom.toLowerCase()} à acheter en ligne au Cameroun sur NILE. Comparez les offres de boutiques locales et trouvez les produits disponibles.`;
  return { title, description, alternates: { canonical: `/categorie/${categorie.slug}` }, openGraph: { title, description, url: `/categorie/${categorie.slug}`, type: "website", locale: "fr_CM" } };
}

export default async function CategoriePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categorie = await getCategorie(slug);
  if (!categorie) notFound();

  const categories = await listerCategories();
  if (await categorieEstReservee18(categorie.id) && !(await aConfirmeMajorite())) {
    notFound();
  }
  const categorieIds = collecterIdsCategorieEtDescendants(categorie.id, categories);
  const utilisateur = await getUtilisateurCourant();
  const [{ produits, total }, quantites] = await Promise.all([
    rechercherProduitsCatalogue({ categorieIds, tri: "populaire", page: 1, parPage: 24 }),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);
  const favoris = await favorisParmi(utilisateur?.id ?? null, produits.map((p) => p.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categorie.nom} — NILE`,
    description: SITE_DESCRIPTION,
    url: `/categorie/${categorie.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: produits.length,
      itemListElement: produits.slice(0, 12).map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `/produit/${p.slug}`,
        name: p.titre,
      })),
    },
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d’Ariane" className="mb-5 pt-4 text-sm text-slate-500">
        <Link href="/catalogue" className="hover:text-nile-700">Catalogue</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-800">{categorie.nom}</span>
      </nav>
      <header className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Acheter en ligne au Cameroun</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B192C] sm:text-4xl">{categorie.nom}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Retrouvez les produits de la catégorie {categorie.nom.toLowerCase()} proposés par les boutiques présentes sur NILE au Cameroun.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/catalogue" className={btn("primaire", "sm")}>Voir tout le catalogue</Link>
          <Link href="/boutiques" className={btn("secondaire", "sm")}>Découvrir les boutiques</Link>
        </div>
      </header>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[#0B192C]">Produits {categorie.nom.toLowerCase()}</h2>
        <span className="text-sm text-slate-500">{total} produit{total > 1 ? "s" : ""}</span>
      </div>
      {produits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Cette catégorie ne contient pas encore de produit disponible.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {produits.map((p, i) => (
            <CarteProduitVitrine
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 4}
              index={i}
              favori={utilisateur ? { enFavori: favoris.has(p.id), retour: `/categorie/${categorie.slug}` } : undefined}
              afficherCategorie
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 210px"
            />
          ))}
        </div>
      )}
    </div>
  );
}
