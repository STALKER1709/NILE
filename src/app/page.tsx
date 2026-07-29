import Link from "next/link";
import Image from "next/image";
import { listerCategories, imagesParRayon } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { listerBoutiques } from "@/modules/catalogue/boutiques";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { CarteBoutique } from "@/components/boutique/CarteBoutique";
import { Carrousel } from "@/components/ui/Carrousel";
import { DiapoMarque, DiapoLivraison, DiapoMomo } from "@/components/accueil/Diapos";
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
  const racines = categories.filter((c) => !c.parentId).slice(0, RAYONS_EN_AVANT);
  // Illustration de chaque rayon : une vraie photo produit du catalogue.
  const visuels = await imagesParRayon(
    racines.map((c) => c.id),
    categories,
  );

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Bannière éditoriale (carrousel plein cadre) */}
      <h1 className="sr-only">NILE Marketplace, achats en ligne au Cameroun</h1>
      <Carrousel etiquette="Offres et services NILE">
        <DiapoMarque />
        <DiapoLivraison />
        <DiapoMomo />
      </Carrousel>

      {/* Barre de confiance */}
      <section className="grid grid-cols-1 gap-gouttiere md:grid-cols-3">
        <Garantie
          titre="Paiement à la livraison"
          texte="Commandez, vérifiez votre colis, puis payez en espèces à la réception."
          index={0}
          icone={
            <path d="M3 6h18v12H3z M3 10h18 M7 15h4" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <Garantie
          titre="Mobile Money sécurisé"
          texte="MTN MoMo et Orange Money : le paiement est confirmé côté serveur."
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
          texte="Livraison gratuite à l'adresse que vous indiquez, dans tout le pays."
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

      {/* Rayons : grandes cartes illustrées */}
      {racines.length > 0 && (
        <section>
          <EnteteSection titre="Explorer les rayons" lien="/catalogue" libelleLien="Voir tout" />
          <div className="grid grid-cols-1 gap-gouttiere sm:grid-cols-2">
            {racines.map((c, i) => {
              const visuel = visuels[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/catalogue?categorie=${c.slug}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="group relative flex h-48 animate-fondu-haut items-center overflow-hidden rounded-xl border border-contour-carte bg-surface-moyenne"
                >
                  <div className="z-10 max-w-[60%] p-6 sm:p-10">
                    <h3 className="text-titre-sm text-nile-800">{c.nom}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-etiquette-md text-accent-deep transition-transform group-hover:translate-x-2">
                      Voir le rayon
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-1/2">
                    {visuel ? (
                      <Image
                        src={visuel}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 320px"
                        className="object-cover opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                      />
                    ) : (
                      // Aucun produit illustré dans ce rayon : icône plutôt qu'une
                      // photo qui ne représenterait rien du catalogue réel.
                      <span className="grid h-full w-full place-items-center bg-nile-50 text-nile-500 transition-colors group-hover:text-nile-700">
                        <span className="scale-[2.2]">
                          <IconeCategorie nom={c.nom} />
                        </span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Boutiques à découvrir */}
      {boutiques.length > 0 && (
        <section>
          <EnteteSection titre="Boutiques à découvrir" lien="/boutiques" libelleLien="Toutes les boutiques" />
          <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
            {boutiques.map((b, i) => (
              <CarteBoutique key={b.id} boutique={b} compact index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Les mieux notés */}
      {populaires.length > 0 && (
        <SectionProduits titre="Les mieux notés" produits={populaires} quantites={quantites} />
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
        vide="Le catalogue se remplit bientôt."
      />

      {/* Paiements flexibles */}
      <SectionPaiement />

      {/* Appel à l'action final : bandeau pleine largeur, contenu centré */}
      <section className="pleine-largeur bg-nile-dark py-16 text-white sm:py-section">
        <div className="mx-auto max-w-conteneur px-4 text-center sm:px-10">
          <h2 className="font-titre text-titre-sm sm:text-titre-md">Prêt à faire de bonnes affaires ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-corps-md text-nile-surConteneur">
            Créez votre compte en quelques instants et payez comme vous voulez :
            Mobile Money ou en espèces à la livraison.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/catalogue" className={btn("accent", "lg")}>
              Parcourir le catalogue
            </Link>
            {!utilisateur && (
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded border border-nile-surConteneur px-8 py-3 text-etiquette-md font-bold text-white transition-colors hover:bg-nile-conteneur"
              >
                S'inscrire gratuitement
              </Link>
            )}
          </div>
        </div>
      </section>
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

/**
 * Bloc « paiements flexibles » : rappelle les trois moyens de paiement
 * réellement disponibles sur la plateforme (Monetbil + espèces à la livraison).
 */
function SectionPaiement() {
  return (
    <section className="rounded-xl2 border border-contour-carte bg-white p-6 sm:p-12">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="block text-etiquette-xs font-bold uppercase tracking-[0.2em] text-accent-deep">
            Paiements flexibles
          </span>
          <h2 className="mt-4 font-titre text-display-mobile leading-tight text-nile-800 lg:text-display-lg">
            Payez comme vous voulez, où que vous soyez
          </h2>
          <p className="mt-6 max-w-lg text-corps-md text-slate-600 sm:text-corps-lg">
            Mobile Money via notre agrégateur, ou espèces à la remise du colis.
            Choisissez le mode qui vous convient au moment de commander.
          </p>
          <ul className="mt-8 flex flex-wrap gap-4">
            <MoyenPaiement pastille={<span className="text-xs font-bold text-accent-sur">MTN</span>} fond="bg-accent" libelle="MTN MoMo" />
            <MoyenPaiement pastille={<span className="text-xs font-bold text-white">OM</span>} fond="bg-[#FF6600]" libelle="Orange Money" />
            <MoyenPaiement
              fond="bg-nile-100"
              libelle="À la livraison"
              pastille={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-nile-700" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              }
            />
          </ul>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[1.5rem] shadow-flottant lg:rotate-2">
            <Image
              src="/bannieres/momo.jpg"
              alt="Paiement par téléphone mobile"
              width={800}
              height={600}
              sizes="(max-width: 1024px) 100vw, 560px"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {/* Pastille « vérifié » : animation désactivée si l'utilisateur
              a demandé de réduire les animations. */}
          <span className="absolute -bottom-5 -left-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-xl2 bg-accent text-accent-sur shadow-flottant motion-safe:animate-bounce">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3l7.5 3v6c0 4.2-3 7.6-7.5 9-4.5-1.4-7.5-4.8-7.5-9V6z" strokeLinejoin="round" />
              <path d="m8.8 12 2.2 2.2 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}

function MoyenPaiement({
  pastille,
  fond,
  libelle,
}: {
  pastille: React.ReactNode;
  /** Classe de fond de la pastille (couleur de l'opérateur). */
  fond: string;
  libelle: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-contour-carte bg-surface-moyenne px-5 py-3 transition-colors hover:border-accent">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded ${fond}`}>{pastille}</span>
      <span className="text-etiquette-md font-bold text-slate-900">{libelle}</span>
    </li>
  );
}

function SectionProduits({
  titre,
  produits,
  quantites,
  vide,
}: {
  titre: string;
  produits: React.ComponentProps<typeof CarteProduitVitrine>["produit"][];
  quantites: Record<string, number>;
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
      className="flex animate-fondu-haut items-start gap-4 rounded border border-contour-carte bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-carte-hover"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nile-200 text-nile-700">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          {icone}
        </svg>
      </span>
      <div>
        <h3 className="text-etiquette-md font-bold text-slate-900">{titre}</h3>
        <p className="mt-1 text-corps-sm text-slate-600">{texte}</p>
      </div>
    </div>
  );
}
