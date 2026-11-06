import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { enrichirProduitsPourCartes } from "@/modules/promotion/promotion";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { btn } from "@/components/ui/kit";
import { aConfirmeMajorite, idsCategoriesReservees18 } from "@/modules/catalogue/acces-18";

export const dynamic = "force-dynamic";

const villes: Record<string, { nom: string; variantes: string[] }> = {
  yaounde: { nom: "Yaoundé", variantes: ["Yaoundé", "Yaounde"] },
  douala: { nom: "Douala", variantes: ["Douala"] },
};

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const config = villes[ville];
  if (!config) return { title: "Ville introuvable" };
  const title = `Acheter en ligne à ${config.nom} — NILE`;
  const description = `Découvrez les produits et boutiques disponibles à ${config.nom} sur NILE, la marketplace en ligne au Cameroun.`;
  return { title, description, alternates: { canonical: `/${ville}` }, openGraph: { title, description, url: `/${ville}`, type: "website", locale: "fr_CM" } };
}

export default async function VillePage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const config = villes[ville];
  if (!config) notFound();

  const ids18 = (await aConfirmeMajorite()) ? [] : await idsCategoriesReservees18();
  const localisationConditions = config.variantes.map((v) => ({ localisationPublique: { contains: v, mode: "insensitive" as const } }));
  const vendeurs = await prisma.vendeur.findMany({
    where: { statutValidation: "VALIDE", OR: localisationConditions },
    select: { id: true, nomBoutique: true, localisationPublique: true },
    orderBy: { nomBoutique: "asc" },
    take: 50,
  });
  const vendeurIds = vendeurs.map((v) => v.id);
  const produitsBruts = vendeurIds.length === 0 ? [] : await prisma.produit.findMany({
    where: {
      vendeurId: { in: vendeurIds },
      statut: "ACTIF",
      ...(ids18.length > 0 ? { categorieId: { notIn: ids18 } } : {}),
    },
    orderBy: { dateMaj: "desc" },
    take: 24,
    include: {
      images: { orderBy: { ordre: "asc" }, take: 1 },
      vendeur: { select: { id: true, nomBoutique: true } },
      categorie: { select: { nom: true } },
    },
  });
  const produits = await enrichirProduitsPourCartes(produitsBruts);
  const utilisateur = await getUtilisateurCourant();
  const [quantites, favoris] = await Promise.all([
    getQuantitesAffichees(utilisateur?.id ?? null),
    favorisParmi(utilisateur?.id ?? null, produits.map((p) => p.id)),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Acheter en ligne à ${config.nom} — NILE`,
    description: `Produits et boutiques disponibles à ${config.nom}, Cameroun.`,
    url: `/${ville}`,
    about: { "@type": "City", name: config.nom, addressCountry: "CM" },
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d’Ariane" className="mb-5 pt-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-nile-700">NILE</Link><span className="mx-2">/</span><span className="font-medium text-slate-800">{config.nom}</span>
      </nav>
      <header className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Marketplace au Cameroun</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B192C] sm:text-4xl">Acheter en ligne à {config.nom}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Découvrez les produits et boutiques dont la localisation publique indique {config.nom}. NILE facilite la découverte et l’achat auprès de vendeurs locaux.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/catalogue" className={btn("primaire", "sm")}>Explorer le catalogue</Link>
          <Link href="/boutiques" className={btn("secondaire", "sm")}>Voir les boutiques</Link>
        </div>
      </header>
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-extrabold text-[#0B192C]">Boutiques à {config.nom}</h2>
        {vendeurs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Aucune boutique avec localisation publique {config.nom} n’est encore indexable.</p> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendeurs.slice(0, 6).map((v) => <Link key={v.id} href={`/boutique/${v.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><strong className="block text-slate-900">{v.nomBoutique}</strong><span className="mt-1 block text-sm text-slate-500">Boutique vérifiée · {v.localisationPublique}</span></Link>)}
          </div>
        )}
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-[#0B192C]">Produits disponibles à {config.nom}</h2><span className="text-sm text-slate-500">{produits.length} affichés</span></div>
        {produits.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Aucun produit local n’est encore suffisamment renseigné pour cette page.</div> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {produits.map((p, i) => <CarteProduit key={p.id} produit={p} quantitePanier={quantites[p.id] ?? 0} priority={i < 4} index={i} favori={utilisateur ? { enFavori: favoris.has(p.id), retour: `/${ville}` } : undefined} />)}
          </div>
        )}
      </section>
    </div>
  );
}
