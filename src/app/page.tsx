import Link from "next/link";
import { listerCategories } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduit } from "@/components/produit/CarteProduit";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();
  const [categories, { produits: recents }, { produits: populaires }, quantites] =
    await Promise.all([
      listerCategories(),
      rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 12 }),
      rechercherProduitsCatalogue({ tri: "populaire", page: 1, parPage: 6 }),
      getQuantitesAffichees(utilisateur?.id ?? null),
    ]);
  const racines = categories.filter((c) => !c.parentId).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Bannière */}
      <section className="overflow-hidden rounded-xl2 bg-gradient-to-r from-nile-900 via-nile-800 to-nile-dark px-6 py-9 text-white sm:px-10 sm:py-12">
        <p className="text-sm font-medium text-accent">Marketplace du Cameroun 🇨🇲</p>
        <h1 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight sm:text-4xl">
          Achetez malin, payez comme vous voulez
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/80 sm:text-base">
          Des milliers de produits, payés par Mobile Money ou à la livraison.
          Livraison partout au Cameroun.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/catalogue"
            className="inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-nile-950 hover:bg-accent-dark"
          >
            Parcourir le catalogue
          </Link>
          <Link
            href="/inscription"
            className="inline-flex items-center rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Vendre sur NILE
          </Link>
        </div>
      </section>

      {/* Garanties (confiance) */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Garantie
          titre="Paiement à la livraison"
          texte="Payez en espèces quand vous recevez votre colis."
          icone={
            <path d="M3 6h18v12H3z M3 10h18 M7 15h4" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <Garantie
          titre="Mobile Money sécurisé"
          texte="MTN MoMo & Orange Money, paiement confirmé côté serveur."
          icone={
            <>
              <rect x="6" y="3" width="12" height="18" rx="2" />
              <path d="M11 18h2" strokeLinecap="round" />
            </>
          }
        />
        <Garantie
          titre="Livraison partout au Cameroun"
          texte="Vos commandes livrées dans tout le pays."
          icone={
            <>
              <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
            </>
          }
        />
      </section>

      {/* Rayons */}
      {racines.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Explorer les rayons</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {racines.map((c) => (
              <Link
                key={c.id}
                href={`/catalogue?categorie=${c.slug}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-carte transition hover:border-nile hover:shadow-flottant"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-nile-50 text-lg font-bold text-nile">
                  {c.nom.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-800">{c.nom}</span>
                  <span className="text-xs text-nile">Voir →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Meilleures ventes */}
      {populaires.length > 0 && (
        <SectionProduits titre="Les mieux notés" produits={populaires} quantites={quantites} />
      )}

      {/* Nouveautés */}
      <SectionProduits
        titre="Nouveautés"
        produits={recents}
        quantites={quantites}
        vide="Le catalogue se remplit bientôt."
      />
    </div>
  );
}

function SectionProduits({
  titre,
  produits,
  quantites,
  vide,
}: {
  titre: string;
  produits: React.ComponentProps<typeof CarteProduit>["produit"][];
  quantites: Record<string, number>;
  vide?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{titre}</h2>
        <Link href="/catalogue" className="text-sm font-medium text-nile hover:underline">
          Tout voir →
        </Link>
      </div>
      {produits.length === 0 ? (
        <p className="rounded-xl2 border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          {vide ?? "Rien à afficher pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {produits.map((p, i) => (
            <CarteProduit
              key={p.slug}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 6}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Garantie({
  titre,
  texte,
  icone,
}: {
  titre: string;
  texte: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-carte">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-nile-50 text-nile">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          {icone}
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-800">{titre}</p>
        <p className="mt-0.5 text-xs text-gray-500">{texte}</p>
      </div>
    </div>
  );
}
