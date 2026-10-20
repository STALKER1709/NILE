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

  const favoris = await favorisParmi(
    utilisateur?.id ?? null,
    [...recents, ...populaires].map((p) => p.id),
  );
  const racines = categories.filter((c) => !c.parentId).slice(0, RAYONS_EN_AVANT);
  const visuels = await imagesParRayon(
    racines.map((c) => c.id),
    categories,
  );

  return (
    <div className="space-y-12 sm:space-y-20">
      {/* Bannière principale */}
      <h1 className="sr-only">NILE Marketplace, achats en ligne au Cameroun</h1>
      <Carrousel etiquette="Offres et services NILE">
        <DiapoMarque />
        <DiapoLivraison />
        <DiapoMomo />
      </Carrousel>

      {/* Barre de réassurance locale (Cameroun) */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        <Garantie
          titre="Paiement à la livraison"
          texte="Commandez l'esprit tranquille, vérifiez le colis et payez en espèces au livreur."
          index={0}
          icone={
            <path d="M3 6h18v12H3z M3 10h18 M7 15h4" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <Garantie
          titre="Mobile Money sécurisé"
          texte="MTN MoMo et Orange Money : validation chiffrée instantanée avec confirmation."
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
          texte="À domicile ou en point relais, sécurisée avec remise de code secret."
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

      {/* Rayons principaux */}
      {racines.length > 0 && (
        <section>
          <EnteteSection titre="Explorer les rayons" lien="/catalogue" libelleLien="Tous les rayons" />
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {racines.map((c, i) => {
              const visuel = visuels[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/catalogue?categorie=${c.slug}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="group relative flex h-48 animate-fondu-haut items-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-nile-700/30 hover:shadow-md"
                >
                  <div className="z-10 max-w-[65%]">
                    <h3 className="font-titre text-lg font-bold text-slate-900 group-hover:text-nile-800 transition-colors">
                      {c.nom}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-nile-700 transition-transform group-hover:translate-x-1">
                      Découvrir
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>

                  <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden">
                    {visuel ? (
                      <Image
                        src={visuel}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 320px"
                        className="object-cover opacity-75 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-nile-50/50 text-nile-400 transition-colors group-hover:text-nile-600">
                        <span className="scale-[2]">
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

      {/* Boutiques certifiées */}
      {boutiques.length > 0 && (
        <section>
          <EnteteSection titre="Boutiques certifiées" lien="/boutiques" libelleLien="Toutes les boutiques" />
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {boutiques.map((b, i) => (
              <CarteBoutique key={b.id} boutique={b} compact index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Les mieux notés */}
      {populaires.length > 0 && (
        <SectionProduits
          titre="Sélection populaire"
          produits={populaires}
          quantites={quantites}
          favoris={utilisateur ? favoris : null}
        />
      )}

      {/* Ruban réassurance livraison */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-nile-900 via-nile-800 to-nile-900 px-6 py-6 text-white shadow-md sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="17" cy="17" r="1.5" />
              </svg>
            </span>
            <div>
              <p className="font-titre text-base font-bold sm:text-lg">
                Livraison à domicile &amp; en point relais
              </p>
              <p className="text-xs text-slate-300 sm:text-sm">
                Douala, Yaoundé, Bafoussam, Bamenda et partout dans les dix régions du Cameroun.
              </p>
            </div>
          </div>
          <Link href="/aide" className={btn("accent", "sm")}>
            En savoir plus
          </Link>
        </div>
      </section>

      {/* Nouveautés */}
      <SectionProduits
        titre="Nouveaux arrivages"
        produits={recents}
        quantites={quantites}
        favoris={utilisateur ? favoris : null}
        vide="Le catalogue se remplit très bientôt."
      />

      {/* Paiements flexibles */}
      <SectionPaiement />

      {/* Appel à l'action final pleine largeur */}
      <section className="pleine-largeur bg-nile-950 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-conteneur px-4 text-center sm:px-10">
          <h2 className="font-titre text-2xl font-bold tracking-tight sm:text-4xl">
            Prêt à faire vos meilleures affaires ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 leading-relaxed sm:text-lg">
            Rejoignez la communauté NILE. Payez selon vos habitudes en toute sécurité,
            par Mobile Money ou à la livraison en espèces.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/catalogue" className={btn("accent", "lg")}>
              Parcourir le catalogue →
            </Link>
            {!utilisateur && (
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Créer un compte
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

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
    <div className="mb-6 flex items-baseline justify-between gap-3 border-b border-slate-200/60 pb-3">
      <h2 className="font-titre text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {titre}
      </h2>
      <Link
        href={lien}
        className="group inline-flex items-center gap-1 text-xs font-semibold text-nile-700 hover:text-nile-900 transition-colors"
      >
        <span>{libelleLien}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function SectionPaiement() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-12">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="font-titre text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-tight">
            Payez comme vous voulez, où que vous soyez
          </h2>
          <p className="mt-4 text-sm text-slate-600 sm:text-base leading-relaxed">
            Sur NILE, nous adaptons les moyens de paiement aux réalités du Cameroun.
            Que vous préfériez payer en espèces après inspection de votre colis,
            ou régler instantanément via votre portefeuille électronique, tout est sécurisé.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catalogue" className={btn("primaire", "md")}>
              Commencer mes achats
            </Link>
            <Link href="/aide" className={btn("secondaire", "md")}>
              Consulter le guide d'achat
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          <MoyenPaiement
            fond="bg-amber-100 text-amber-800"
            libelle="MTN Mobile Money"
            pastille="MoMo"
          />
          <MoyenPaiement
            fond="bg-orange-100 text-orange-800"
            libelle="Orange Money"
            pastille="OM"
          />
          <MoyenPaiement
            fond="bg-emerald-100 text-emerald-800"
            libelle="Paiement à la livraison"
            pastille="Cash"
          />
          <MoyenPaiement
            fond="bg-blue-100 text-blue-800"
            libelle="Vérification par code"
            pastille="Scan"
          />
        </ul>
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
  fond: string;
  libelle: string;
}) {
  return (
    <li className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3.5 transition-colors hover:border-nile-700/30 hover:bg-white shadow-xs">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg font-bold text-xs ${fond}`}>
        {pastille}
      </span>
      <span className="text-sm font-semibold text-slate-800">{libelle}</span>
    </li>
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
  favoris: Set<string> | null;
  vide?: string;
}) {
  return (
    <section>
      <EnteteSection titre={titre} lien="/catalogue" libelleLien="Tout voir" />
      {produits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {vide ?? "Rien à afficher pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      style={{ animationDelay: `${index * 60}ms` }}
      className="flex animate-fondu-haut items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nile-50 text-nile-700">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icone}
        </svg>
      </span>
      <div>
        <h3 className="font-titre text-base font-bold text-slate-900">{titre}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed sm:text-sm">{texte}</p>
      </div>
    </div>
  );
}
