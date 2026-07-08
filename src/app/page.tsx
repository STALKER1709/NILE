import Link from "next/link";
import { listerCategories } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const [categories, { produits }] = await Promise.all([
    listerCategories(),
    rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 8 }),
  ]);
  const racines = categories.filter((c) => !c.parentId).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-xl2 bg-gradient-to-br from-nile to-nile-dark px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-medium text-nile-100">Marketplace du Cameroun 🇨🇲</p>
        <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Achetez malin, payez comme vous voulez
        </h1>
        <p className="mt-3 max-w-lg text-nile-100">
          Des milliers de produits, payés par Mobile Money ou à la livraison.
          Livraison partout au Cameroun.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogue" className={btn("accent", "lg")}>
            Parcourir le catalogue
          </Link>
          <Link href="/inscription" className="inline-flex items-center rounded-lg border border-white/40 px-5 py-3 text-base font-medium text-white hover:bg-white/10">
            Vendre sur NILE
          </Link>
        </div>
      </section>

      {/* Catégories */}
      {racines.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Catégories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {racines.map((c) => (
              <Link
                key={c.id}
                href={`/catalogue?categorie=${c.slug}`}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-carte hover:border-nile hover:text-nile"
              >
                {c.nom}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produits en vedette */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nouveautés</h2>
          <Link href="/catalogue" className="text-sm font-medium text-nile hover:underline">
            Tout voir →
          </Link>
        </div>
        {produits.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Le catalogue se remplit bientôt.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((p, i) => (
              <CarteProduit key={p.id} produit={p} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
