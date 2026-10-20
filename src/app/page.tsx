import Link from "next/link";
import Image from "next/image";
import { listerCategories, imagesParRayon } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { listerBoutiques } from "@/modules/catalogue/boutiques";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { CarteBoutique } from "@/components/boutique/CarteBoutique";
import { IconeCategorie } from "@/components/categorie/IconeCategorie";
import { btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** Nombre de rayons mis en avant (grandes cartes sur deux colonnes). */
const RAYONS_EN_AVANT = 6;

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
    rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 6 }),
    rechercherProduitsCatalogue({ tri: "populaire", page: 1, parPage: 6 }),
    listerBoutiques({ tri: "populaire", limite: 8 }),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);
  // Restreint aux articles affichés : deux sections de six, pas toute la
  // liste de souhaits.
  const favoris = await favorisParmi(
    utilisateur?.id ?? null,
    [...recents, ...populaires].map((p) => p.id),
  );
  const racines = categories.filter((c) => !c.parentId).slice(0, RAYONS_EN_AVANT);
  // Illustration de chaque rayon : une vraie photo produit du catalogue.
  const visuels = await imagesParRayon(
    racines.map((c) => c.id),
    categories,
  );

  return (
    <div className="space-y-10 sm:space-y-16">
      <h1 className="sr-only">NILE Marketplace, achats en ligne au Cameroun</h1>

      <section className="grid overflow-hidden rounded-2xl bg-nile-950 text-white shadow-carte-hover lg:min-h-[32rem] lg:grid-cols-[1.02fr_.98fr]">
        <div className="relative z-10 flex flex-col items-start px-6 py-9 sm:px-10 sm:py-12 lg:justify-center lg:px-14 lg:py-14">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-3.5 py-2 text-etiquette-xs font-semibold tracking-wide text-white/90">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            LE COMMERCE CAMEROUNAIS, EN MIEUX
          </span>
          <h2 className="max-w-xl font-titre text-[2.7rem] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[3.5rem] lg:text-[3.85rem]">
            Le commerce d’ici.
            <span className="mt-1 block text-accent">À portée de main.</span>
          </h2>
          <p className="mt-5 max-w-lg text-corps-md leading-7 text-white/75 sm:text-corps-lg">
            Trouvez ce qu’il vous faut auprès des boutiques locales. Commandez en quelques gestes, choisissez votre paiement et faites-vous livrer au Cameroun.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/catalogue" className={btn("accent", "lg")}>
              Découvrir les produits
              <svg className="ml-2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/boutiques"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-5 py-3 text-etiquette-md font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/[0.07]"
            >
              Explorer les boutiques
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-etiquette-xs text-white/70">
            <span className="inline-flex items-center gap-2"><span className="text-accent">✓</span> Paiement à la livraison</span>
            <span className="inline-flex items-center gap-2"><span className="text-accent">✓</span> MTN MoMo &amp; Orange Money</span>
          </div>
        </div>
        <div className="relative min-h-[16rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
          <Image
            src="/bannieres/marche.jpg"
            alt="Commerçante camerounaise dans sa boutique"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 49vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nile-950/75 via-transparent to-transparent lg:bg-gradient-to-r lg:from-nile-950/20 lg:via-transparent lg:to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl border border-white/40 bg-white/95 p-3.5 text-nile-900 shadow-xl backdrop-blur sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-[18rem]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-nile-100 text-nile-800">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
              </svg>
            </span>
            <span>
              <span className="block text-etiquette-md font-bold">De la boutique à chez vous</span>
              <span className="mt-0.5 block text-etiquette-xs text-slate-600">Une expérience pensée pour le Cameroun</span>
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Les avantages NILE" className="grid gap-3 sm:grid-cols-3">
        <Avantage
          titre="Une livraison pratique"
          texte="Dans votre quartier, avec vos repères"
          icone={<path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />}
        />
        <Avantage
          titre="Payez comme vous voulez"
          texte="À la réception ou par Mobile Money"
          icone={<path d="M3 6h18v12H3z M3 10h18 M7 15h4" strokeLinecap="round" strokeLinejoin="round" />}
        />
        <Avantage
          titre="Des boutiques d’ici"
          texte="Découvrez les vendeurs du Cameroun"
          icone={<><path d="M3 10h18l-2-6H5z" strokeLinejoin="round" /><path d="M5 10v10h14V10M9 20v-6h6v6" strokeLinejoin="round" /></>}
        />
      </section>

      {/* Rayons : photos du catalogue, défilement horizontal sur mobile */}
      {racines.length > 0 && (
        <section>
          <EnteteSection titre="Explorer les rayons" lien="/catalogue" libelleLien="Tous les rayons" />
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {racines.map((c, i) => {
              const visuel = visuels[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/catalogue?categorie=${c.slug}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="group relative h-36 w-44 shrink-0 snap-start animate-fondu-haut overflow-hidden rounded bg-nile-800 sm:h-auto sm:w-auto sm:aspect-[4/3]"
                >
                  {visuel ? (
                    <Image
                      src={visuel}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 176px, (max-width: 1024px) 30vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-white/80">
                      <span className="scale-150"><IconeCategorie nom={c.nom} /></span>
                    </span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-nile-950/90 via-nile-950/15 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white">
                    <span className="text-etiquette-md font-bold leading-tight">{c.nom}</span>
                    <svg className="mb-0.5 shrink-0 transition-transform group-hover:translate-x-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Produits populaires : le catalogue arrive dès le premier défilement */}
      {populaires.length > 0 && (
        <SectionProduits
          titre="Les mieux notés"
          produits={populaires}
          quantites={quantites}
          favoris={utilisateur ? favoris : null}
        />
      )}

      {/* Ruban livraison */}
      <section className="flex items-center justify-center gap-4 rounded-xl bg-nile-conteneur px-6 py-4 text-center text-white sm:px-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="shrink-0 text-accent" aria-hidden="true">
          <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
        <p className="text-corps-sm font-bold sm:text-corps-md">
          <span className="text-accent">Livraison gratuite</span> partout au Cameroun, sur toutes les commandes.
        </p>
      </section>

      {/* Nouveautés */}
      <SectionProduits
        titre="Nouveautés"
        produits={recents}
        quantites={quantites}
        favoris={utilisateur ? favoris : null}
        vide="Le catalogue se remplit bientôt."
      />

      {boutiques.length > 0 && (
        <section>
          <EnteteSection titre="Les boutiques du moment" lien="/boutiques" libelleLien="Toutes les boutiques" />
          <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
            {boutiques.map((b, i) => (
              <CarteBoutique key={b.id} boutique={b} compact index={i} />
            ))}
          </div>
        </section>
      )}

      {!utilisateur && (
        <section className="flex flex-col gap-5 rounded-lg bg-accent-fixe px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="font-titre text-titre-sm text-nile-900">Vos prochaines trouvailles vous attendent.</h2>
            <p className="mt-1 text-corps-sm text-nile-800">Créez un compte pour retrouver vos favoris et vos commandes.</p>
          </div>
          <Link href="/inscription" className={btn("primaire", "md")}>
            Créer mon compte
          </Link>
        </section>
      )}
    </div>
  );
}

/** Titre de section + lien « tout voir », mise en page commune à l'accueil. */
function EnteteSection({
  titre,
  lien,
  libelleLien,
}: {
  titre: string;
  lien: string;
  libelleLien: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-titre-sm text-nile-800">{titre}</h2>
      <Link href={lien} className="shrink-0 text-etiquette-md text-accent-deep hover:underline">
        {libelleLien} →
      </Link>
    </div>
  );
}

function SectionProduits({
  titre,
  produits,
  quantites,
  favoris,
  vide,
}: {
  titre: string;
  produits: React.ComponentProps<typeof CarteProduitVitrine>["produit"][];
  quantites: Record<string, number>;
  /** Identifiants en favori, ou `null` pour un visiteur : pas de cœur. */
  favoris: Set<string> | null;
  vide?: string;
}) {
  return (
    <section>
      <EnteteSection titre={titre} lien="/catalogue" libelleLien="Tout voir" />
      {produits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-contour-clair bg-white p-8 text-center text-corps-sm text-slate-500">
          {vide ?? "Rien à afficher pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-gouttiere sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p, i) => (
            <CarteProduitVitrine
              key={p.slug}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 3}
              index={i}
              favori={favoris ? { enFavori: favoris.has(p.id), retour: "/" } : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Avantage({
  titre,
  texte,
  icone,
}: {
  titre: string;
  texte: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-4 sm:justify-center sm:px-4 sm:py-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nile-100 text-nile-800">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {icone}
        </svg>
      </span>
      <div>
        <h3 className="text-etiquette-md font-bold text-slate-900">{titre}</h3>
        <p className="text-corps-sm text-slate-600">{texte}</p>
      </div>
    </div>
  );
}
