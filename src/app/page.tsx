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
const RAYONS_EN_AVANT = 6;

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();
  const [categories, { produits: recents }, { produits: populaires }, boutiques, quantites] =
    await Promise.all([
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
  const visuels = await imagesParRayon(racines.map((c) => c.id), categories);

  return (
    <div className="space-y-12 pb-4 sm:space-y-20">
      <h1 className="sr-only">NILE Marketplace, achats en ligne au Cameroun</h1>

      <section className="relative isolate -mx-4 min-h-[540px] overflow-hidden bg-[#101b34] text-white sm:mx-0 sm:min-h-[590px] sm:rounded-2xl lg:min-h-[610px]">
        <div className="absolute inset-0">
          <Image
            src="/bannieres/marche.jpg"
            alt="Commerçante dans sa boutique au Cameroun"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 1280px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,48,.97)_0%,rgba(8,20,48,.88)_42%,rgba(8,20,48,.25)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081430]/65 via-transparent to-[#081430]/20" />
        </div>
        <div className="relative z-10 flex min-h-[540px] max-w-3xl flex-col justify-center px-6 py-14 sm:min-h-[590px] sm:px-10 lg:min-h-[610px] lg:px-16">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[.12em] text-white/90 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
            LA MARKETPLACE PENSÉE POUR LE CAMEROUN
          </span>
          <h2 className="max-w-2xl font-titre text-[2.65rem] font-bold leading-[1.02] tracking-[-.045em] sm:text-[3.8rem] lg:text-[4.35rem]">
            Le commerce d’ici.
            <span className="mt-1 block text-[#FFB52E]">À portée de main.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            Les produits que vous aimez, les boutiques que vous allez découvrir.
            Achetez en ligne, choisissez votre mode de paiement et recevez vos trouvailles.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/catalogue" className={btn("accent", "lg", "min-h-12 rounded-lg px-6 shadow-lg shadow-black/10")}>
              Découvrir le catalogue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link href="/boutiques" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/35 bg-white/[.06] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/70 hover:bg-white/10">
              Explorer les boutiques
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-white/75 sm:text-sm">
            <span className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[#FFB52E]">✓</span> Prix en FCFA</span>
            <span className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[#FFB52E]">✓</span> Paiement à la livraison disponible</span>
            <span className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[#FFB52E]">✓</span> Mobile Money</span>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 hidden max-w-[245px] rounded-xl border border-white/15 bg-[#0B1732]/75 p-4 backdrop-blur-md lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#FFB52E]">NILE, au quotidien</p>
          <p className="mt-2 text-sm leading-6 text-white/90">Une nouvelle façon de découvrir les commerces et les vendeurs d’ici.</p>
        </div>
      </section>

      <section aria-label="Les engagements NILE" className="grid gap-3 sm:grid-cols-3">
        <Avantage titre="Un choix qui grandit" texte="Des produits et boutiques à découvrir" icone={<path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />} />
        <Avantage titre="Payez à votre façon" texte="Mobile Money ou espèces à la livraison selon disponibilité" icone={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" strokeLinecap="round" /></>} />
        <Avantage titre="Pensé pour le mobile" texte="Une expérience simple, même avec une connexion modeste" icone={<><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18h2" strokeLinecap="round" /></>} />
      </section>

      {racines.length > 0 && (
        <section>
          <EnteteSection surtitre="TROUVEZ VOTRE UNIVERS" titre="Explorer les rayons" lien="/catalogue" libelleLien="Tous les rayons" />
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {racines.map((c, i) => {
              const visuel = visuels[c.id];
              return (
                <Link key={c.id} href={`/catalogue?categorie=${c.slug}`} style={{ animationDelay: `${i * 55}ms` }} className="group relative h-40 w-48 shrink-0 snap-start animate-fondu-haut overflow-hidden rounded-xl bg-nile-800 sm:h-auto sm:w-auto sm:aspect-[4/5] lg:aspect-[3/4]">
                  {visuel ? (
                    <Image src={visuel} alt="" fill sizes="(max-width: 640px) 192px, (max-width: 1024px) 30vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-white/80"><span className="scale-150"><IconeCategorie nom={c.nom} /></span></span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-[#081430]/95 via-[#081430]/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 text-white">
                    <span className="text-sm font-bold leading-tight">{c.nom}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 transition group-hover:bg-[#F59E0B] group-hover:text-[#17213b]">↗</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {populaires.length > 0 && <SectionProduits titre="Les trouvailles du moment" surtitre="À NE PAS MANQUER" produits={populaires} quantites={quantites} favoris={utilisateur ? favoris : null} />}

      <section className="relative overflow-hidden rounded-2xl bg-[#142b61] px-6 py-7 text-white sm:px-10 sm:py-9">
        <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full border-[28px] border-white/[.05]" aria-hidden="true" />
        <div className="absolute -right-2 -top-8 h-40 w-40 rounded-full border border-[#F59E0B]/25" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#FFC15C]">Des achats plus simples</p>
            <h2 className="mt-2 font-titre text-2xl font-bold tracking-tight sm:text-3xl">Choisissez. Commandez. Recevez.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Parcourez le catalogue, choisissez les produits qui vous plaisent et sélectionnez le mode de paiement proposé lors de la commande.</p>
          </div>
          <Link href="/catalogue" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-[#17213b] transition hover:bg-[#FFBE45]">Commencer mes achats <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <SectionProduits titre="Les nouveautés" surtitre="FRAÎCHEMENT AJOUTÉS" produits={recents} quantites={quantites} favoris={utilisateur ? favoris : null} vide="Le catalogue se remplit bientôt." />

      {boutiques.length > 0 && (
        <section>
          <EnteteSection surtitre="LES COMMERÇANTS À DÉCOUVRIR" titre="Les boutiques du moment" lien="/boutiques" libelleLien="Toutes les boutiques" />
          <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-3">
            {boutiques.map((b, i) => <CarteBoutique key={b.id} boutique={b} compact index={i} />)}
          </div>
        </section>
      )}

      {!utilisateur && (
        <section className="flex flex-col gap-5 rounded-2xl border border-[#D9E2F4] bg-gradient-to-br from-white to-[#F1F5FD] px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1E3A8A]">Rejoignez NILE</p>
            <h2 className="mt-2 font-titre text-2xl font-bold tracking-tight text-slate-900">Vos prochaines trouvailles vous attendent.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Créez votre compte pour retrouver vos favoris et suivre vos commandes.</p>
          </div>
          <Link href="/inscription" className={btn("primaire", "lg", "min-h-12 rounded-lg px-6")}>Créer mon compte</Link>
        </section>
      )}
    </div>
  );
}

function EnteteSection({ surtitre, titre, lien, libelleLien }: { surtitre: string; titre: string; lien: string; libelleLien: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#1E3A8A]/70">{surtitre}</p>
        <h2 className="font-titre text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{titre}</h2>
      </div>
      <Link href={lien} className="mb-1 shrink-0 text-sm font-bold text-[#1E3A8A] transition hover:text-[#F59E0B]">{libelleLien} <span aria-hidden="true">→</span></Link>
    </div>
  );
}

function SectionProduits({ titre, surtitre, produits, quantites, favoris, vide }: {
  titre: string;
  surtitre: string;
  produits: React.ComponentProps<typeof CarteProduitVitrine>["produit"][];
  quantites: Record<string, number>;
  favoris: Set<string> | null;
  vide?: string;
}) {
  return (
    <section>
      <EnteteSection surtitre={surtitre} titre={titre} lien="/catalogue" libelleLien="Tout voir" />
      {produits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-contour-clair bg-white p-8 text-center text-corps-sm text-slate-500">{vide ?? "Rien à afficher pour l'instant."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p, i) => <CarteProduitVitrine key={p.slug} produit={p} quantitePanier={quantites[p.id] ?? 0} priority={i < 3} index={i} favori={favoris ? { enFavori: favoris.has(p.id), retour: "/" } : undefined} />)}
        </div>
      )}
    </section>
  );
}

function Avantage({ titre, texte, icone }: { titre: string; texte: string; icone: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white px-4 py-5 sm:px-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EEF2FC] text-[#1E3A8A]">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icone}</svg>
      </span>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{titre}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{texte}</p>
      </div>
    </div>
  );
}
