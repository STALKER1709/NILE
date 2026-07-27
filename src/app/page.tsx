import Link from "next/link";
import { listerCategories } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { listerBoutiques } from "@/modules/catalogue/boutiques";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { CarteBoutique } from "@/components/boutique/CarteBoutique";
import { Carrousel } from "@/components/ui/Carrousel";
import { DiapoMarque, DiapoLivraison, DiapoMomo } from "@/components/accueil/Diapos";
import { IconeCategorie } from "@/components/categorie/IconeCategorie";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();
  const [
    categories,
    { produits: recents },
    { produits: populaires },
    boutiques,
    quantites,
  ] = await Promise.all([
    listerCategories(),
    rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 12 }),
    rechercherProduitsCatalogue({ tri: "populaire", page: 1, parPage: 6 }),
    listerBoutiques({ tri: "populaire", limite: 8 }),
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
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Garantie
          titre="Paiement à la livraison"
          texte="Payez en espèces quand vous recevez votre colis."
          index={0}
          icone={
            <path d="M3 6h18v12H3z M3 10h18 M7 15h4" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <Garantie
          titre="Mobile Money sécurisé"
          texte="MTN MoMo & Orange Money, paiement confirmé côté serveur."
          index={1}
          icone={
            <>
              <rect x="6" y="3" width="12" height="18" rx="2" />
              <path d="M11 18h2" strokeLinecap="round" />
            </>
          }
        />
        <Garantie
          titre="Livraison partout au Cameroun"
          texte="Vos commandes livrées rapidement dans tout le pays."
          index={2}
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
          <h2 className="mb-3.5 text-lg font-black tracking-tight text-slate-900">Explorer les rayons</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {racines.map((c, i) => (
              <Link
                key={c.id}
                href={`/catalogue?categorie=${c.slug}`}
                style={{ animationDelay: `${i * 50}ms` }}
                className="group flex animate-fondu-haut items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-carte transition-all duration-200 hover:-translate-y-0.5 hover:border-nile-500 hover:shadow-carte-hover"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-nile-50 text-nile-700 transition-colors group-hover:bg-nile-600 group-hover:text-white shadow-xs">
                  <IconeCategorie nom={c.nom} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-nile-700">{c.nom}</span>
                  <span className="text-xs font-medium text-nile-600">Voir le rayon →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Boutiques à découvrir */}
      {boutiques.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">Boutiques à découvrir</h2>
            <Link href="/boutiques" className="text-xs font-bold uppercase tracking-wider text-nile-700 hover:text-nile-800 hover:underline">
              Toutes les boutiques →
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
            {boutiques.map((b, i) => (
              <CarteBoutique key={b.id} boutique={b} compact index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Meilleures ventes */}
      {populaires.length > 0 && (
        <SectionProduits titre="Les mieux notés" produits={populaires} quantites={quantites} />
      )}

      {/* Ruban livraison */}
      <section className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-nile-900 via-nile-800 to-nile-950 px-5 py-4 text-white shadow-md">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="text-amber-400 shrink-0" aria-hidden="true">
          <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
        <p className="text-xs sm:text-sm">
          <strong className="font-extrabold text-amber-400">Livraison gratuite</strong> partout au Cameroun, sur toutes les commandes.
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
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-slate-900">{titre}</h2>
        <Link href="/catalogue" className="text-xs font-bold uppercase tracking-wider text-nile-700 hover:text-nile-800 hover:underline">
          Tout voir →
        </Link>
      </div>
      {produits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
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
              index={i}
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
  index = 0,
}: {
  titre: string;
  texte: string;
  icone: React.ReactNode;
  index?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 80}ms` }}
      className="flex animate-fondu-haut items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-carte transition-all hover:border-nile-500/30"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-nile-50 text-nile-700 shadow-xs">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          {icone}
        </svg>
      </span>
      <div>
        <p className="text-sm font-bold text-slate-900">{titre}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{texte}</p>
      </div>
    </div>
  );
}
