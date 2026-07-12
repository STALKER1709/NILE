import Link from "next/link";
import { listerCategories } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { Carrousel } from "@/components/ui/Carrousel";
import { DiapoMarque, DiapoLivraison, DiapoMomo } from "@/components/accueil/Diapos";
import { IconeCategorie } from "@/components/categorie/IconeCategorie";

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
      {/* Titre accessible + carrousel de bannières */}
      <h1 className="sr-only">NILE Marketplace, achats en ligne au Cameroun</h1>
      <Carrousel etiquette="Offres et services NILE">
        <DiapoMarque />
        <DiapoLivraison />
        <DiapoMomo />
      </Carrousel>

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
                className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-carte transition hover:border-nile hover:shadow-flottant"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-nile-50 text-nile transition-colors group-hover:bg-nile group-hover:text-white">
                  <IconeCategorie nom={c.nom} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-800">{c.nom}</span>
                  <span className="text-xs text-nile">Voir le rayon</span>
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

      {/* Ruban livraison */}
      <section className="flex items-center justify-center gap-3 rounded-xl2 bg-gradient-to-r from-nile-800 to-nile-700 px-4 py-3 text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
        <p className="text-sm">
          <strong>Livraison gratuite</strong> partout au Cameroun, sur toutes les commandes.
        </p>
      </section>

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
