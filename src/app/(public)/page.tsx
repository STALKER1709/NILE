import Link from "next/link";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { listerCategories, imagesParRayon } from "@/modules/catalogue/categories";
import { rechercherProduitsCatalogue } from "@/modules/catalogue/produits";
import { listerProduitsEnPromotion } from "@/modules/promotion/promotion";
import { listerBoutiques } from "@/modules/catalogue/boutiques";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { CarteBoutique } from "@/components/boutique/CarteBoutique";
import { IconeCategorie } from "@/components/categorie/IconeCategorie";
import { Vignette } from "@/components/ui/Vignette";
import { btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();
  const [categories, recentResult, popularResult, offresResult, boutiques, quantites] = await Promise.all([
    listerCategories(),
    rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 8 }),
    rechercherProduitsCatalogue({ tri: "populaire", page: 1, parPage: 8 }),
    listerProduitsEnPromotion({ page: 1, parPage: 4 }),
    listerBoutiques({ tri: "populaire", limite: 6 }),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);
  const recents = recentResult.produits;
  const populaires = popularResult.produits;
  const offres = offresResult.produits;
  const produitsConnus = [...recents, ...populaires, ...offres];
  const favoris = await favorisParmi(utilisateur?.id ?? null, produitsConnus.map((p) => p.id));
  const rayons = categories.filter((c) => !c.parentId).slice(0, 6);
  const visuels = await imagesParRayon(rayons.map((c) => c.id), categories);
  const principal = populaires[0];
  const mini = populaires[1];

  return <div className="mx-auto w-full max-w-[1360px] space-y-8 pb-10 sm:space-y-12 lg:space-y-16">
    <h1 className="sr-only">NILE — la marketplace pensée pour le Cameroun</h1>

    <section className="relative isolate overflow-hidden rounded-[24px] border border-[#e8e9e7] bg-gradient-to-br from-[#FAFAF9] via-[#FFFBEB] to-[#F2F4F6] p-5 shadow-[0_8px_28px_rgba(11,25,44,0.05)] sm:rounded-[30px] sm:p-8 lg:p-12">
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-[28%] h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" aria-hidden="true" />
      <div className="relative grid items-center gap-8 lg:grid-cols-12 lg:gap-9">
        <div className="flex flex-col items-start gap-4 lg:col-span-7 lg:gap-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-extrabold tracking-[.12em] text-[#44474c] shadow-sm sm:text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> LA MARKETPLACE QUI VOUS COMPREND
          </div>
          <h2 className="max-w-[650px] font-titre text-[34px] font-extrabold leading-[1.12] tracking-[-.035em] text-[#0F172A] sm:text-[44px] sm:leading-[1.1] lg:text-[52px]">
            Vos envies. Vos marques.
            <span className="block bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#855300] bg-clip-text text-transparent">Tout près de vous.</span>
          </h2>
          <p className="max-w-[570px] text-[14px] leading-7 text-[#44474c] sm:text-[16px] sm:leading-7">
            Découvrez des produits qui vous ressemblent, comparez les articles et explorez les boutiques locales. Les détails de commande vous accompagnent jusqu’à la livraison.
          </p>
          <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link href="/catalogue" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0B192C] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#0e1c2f] hover:shadow-lg">Explorer le catalogue <Arrow /></Link>
            <Link href="/inscription?role=VENDEUR" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-sm font-bold text-[#0B192C] shadow-sm transition-colors hover:bg-[#f8fafc]"><StoreIcon /> Ouvrir ma boutique <span aria-hidden="true">＋</span></Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#dfe3e6] pt-4 text-[11px] font-medium text-[#44474c] sm:text-xs">
            <span className="inline-flex items-center gap-2"><span className="text-[#047857]"><Check /></span> Une expérience pensée pour le Cameroun</span>
            <span className="inline-flex items-center gap-2"><span className="text-[#047857]"><Check /></span> Des options affichées avant validation</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] lg:col-span-5">
          <div className="rounded-[20px] border border-white bg-white p-3 shadow-[0_20px_40px_rgba(11,25,44,0.12)] sm:rounded-[24px] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#eceef0] pb-3">
              <div><span className="block text-[10px] font-extrabold uppercase tracking-[.13em] text-[#75777d]">À DÉCOUVRIR</span><span className="mt-0.5 block font-titre text-base font-bold text-[#0B192C] sm:text-lg">La sélection <span className="text-[#D97706]">NILE.</span></span></div>
              <span className="rounded-full bg-[#FFFBEB] px-3 py-1 text-[10px] font-bold text-[#D97706]">Sélection du moment</span>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#f2f4f6]">
              {principal ? <Vignette url={principal.images[0]?.url} alt={principal.titre} ajustement="couvrir" className="h-full w-full" sizes="(max-width: 1024px) 90vw, 460px" /> : <Image src="/bannieres/marche.jpg" alt="Un espace de commerce local" fill priority sizes="(max-width: 1024px) 90vw, 460px" className="object-cover" />}
              {principal && <span className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-md bg-[#0B192C]/90 px-3 py-1.5 text-xs font-bold text-white">{principal.titre}</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#FAFAF9] p-2">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                  {mini ? <Vignette url={mini.images[0]?.url} alt={mini.titre} ajustement="couvrir" className="h-full w-full" sizes="48px" /> : <span className="grid h-full place-items-center text-[#0B192C]"><PackageIcon /></span>}
                </div>
                <div className="min-w-0"><span className="block truncate text-[9px] font-extrabold uppercase tracking-wider text-[#75777d]">{mini?.categorie?.nom ?? "À découvrir"}</span><span className="mt-1 block truncate text-[11px] font-bold text-[#0B192C]">{mini?.titre ?? "Explorez le catalogue"}</span></div>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0e1c2f] to-[#0B192C] p-2 text-white">
                <span className="text-[#6ffbbe]"><StoreIcon /></span><span><strong className="block text-[10px] tracking-wide">NILE CONFIANCE</strong><span className="block text-[10px] text-[#a7f3d0]">Achetez serein</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TrustItem title="Des boutiques validées" text="Les boutiques visibles passent par une validation avant de vendre." icon={<StoreIcon />} />
      <TrustItem title="Des prix à comparer" text="Consultez les détails et les options par produit." icon={<TagIcon />} />
      <TrustItem title="Des options claires" text="Les moyens de règlement sont indiqués à la commande." icon={<WalletIcon />} />
      <TrustItem title="Le suivi de vos achats" text="Consultez l’avancement de vos commandes depuis votre espace." icon={<PackageIcon />} />
    </section>

    {rayons.length > 0 && <section>
      <SectionHeading eyebrow="Explorer par envie" title="Qu’est-ce qui vous ferait plaisir ?" link="/catalogue" linkText="Tous les rayons" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {rayons.map((categorie) => {
          const visuel = visuels[categorie.id];
          return <Link key={categorie.id} href={"/catalogue?categorie=" + categorie.slug} className="group min-w-0 rounded-[18px] border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_3px_rgba(11,25,44,0.04),0_4px_12px_rgba(11,25,44,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#cbd5e1] hover:shadow-[0_10px_25px_-5px_rgba(11,25,44,0.08)] sm:p-4">
            <div className="relative mb-2.5 grid h-[76px] place-items-center overflow-hidden rounded-[13px] bg-blue-50 sm:mb-3 sm:h-[93px] text-blue-900">
              {visuel ? <Image src={visuel} alt="" fill sizes="(max-width: 640px) 45vw, 180px" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <IconeCategorie nom={categorie.nom} taille={28} />}
              {visuel && <div className="absolute inset-0 bg-blue-950/10" aria-hidden="true" />}
            </div>
            <h3 className="ligne-2 min-h-[2.5rem] font-titre text-[12px] font-extrabold leading-snug text-slate-900">{categorie.nom}</h3>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-900">Explorer <Arrow small /></span>
          </Link>;
        })}
      </div>
    </section>}

    {offres.length > 0 && <section className="overflow-hidden rounded-[22px] bg-[#0B192C] p-4 shadow-[0_12px_32px_rgba(11,25,44,0.12)] sm:rounded-[26px] sm:p-7">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-5 sm:flex-row sm:items-end">
        <div><p className="nile-eyebrow text-amber-300">Offres réellement en cours</p><h2 className="mt-1 font-titre text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">Les prix qui font plaisir.</h2></div>
        <Link href="/promotions" className={btn("accent", "md")}>Toutes les promotions <Arrow small /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {offres.map((p, i) => <CarteProduitVitrine key={p.id} produit={p} quantitePanier={quantites[p.id] ?? 0} priority={i < 2} index={i}
          favori={utilisateur ? { enFavori: favoris.has(p.id), retour: "/" } : undefined}
          afficherCategorie sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 260px" />)}
      </div>
    </section>}

    {populaires.length > 0 && <ProductSection title="Les coups de cœur du moment" eyebrow="À découvrir" products={populaires} quantities={quantites} favorites={utilisateur ? favoris : null} />}

    <section className="grid overflow-hidden rounded-[22px] border border-[#f4dfb4] shadow-sm sm:rounded-[26px] lg:grid-cols-[1.05fr_.95fr]" style={{ background: "linear-gradient(115deg,#fff1d2 0%,#fff8e9 100%)" }}>
      <div className="flex flex-col justify-center px-5 py-6 sm:px-9 sm:py-10 lg:px-10">
        <p className="nile-eyebrow text-blue-900">NILE pour les entrepreneurs</p>
        <h2 className="mt-3 max-w-lg font-titre text-[24px] font-extrabold leading-[1.18] tracking-[-0.03em] text-[#182955] sm:text-[32px]">Votre boutique mérite de grandir.</h2>
        <p className="mt-3 max-w-lg text-[13px] leading-6 text-[#6e6553] sm:text-sm sm:leading-7">Présentez vos produits, donnez de la visibilité à votre activité et retrouvez vos commandes dans un espace dédié.</p>
        <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
          <Link href="/inscription" className={btn("primaire", "lg")}>Devenir vendeur <Arrow /></Link>
          <Link href="/aide" className={btn("secondaire", "lg")}>Comment ça marche ?</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#f0dfb8] pt-4 text-xs text-[#897958]">
          <span><strong className="block font-titre text-base text-blue-900">Votre vitrine</strong>en ligne</span>
          <span><strong className="block font-titre text-base text-blue-900">Vos produits</strong>à votre rythme</span>
          <span><strong className="block font-titre text-base text-blue-900">Votre ambition</strong>à développer</span>
        </div>
      </div>
      <div className="grid min-h-[230px] grid-cols-2 items-center gap-3 overflow-hidden px-5 py-5 sm:px-8 lg:min-h-[275px]">
        <div className="relative h-[170px] rotate-[-5deg] overflow-hidden rounded-[17px] border-4 border-white bg-white shadow-carte"><Image src="/bannieres/marche.jpg" alt="Une activité de commerce locale" fill sizes="(max-width: 1024px) 45vw, 250px" className="object-cover" /></div>
        <div className="relative mt-5 h-[170px] rotate-[5deg] overflow-hidden rounded-[17px] border-4 border-white bg-white shadow-carte"><Image src="/bannieres/livraison.jpg" alt="Préparation d’une commande" fill sizes="(max-width: 1024px) 45vw, 250px" className="object-cover" /></div>
      </div>
    </section>

    {boutiques.length > 0 && <section>
      <SectionHeading eyebrow="Commerçants à découvrir" title="Des boutiques qui ont leur histoire" link="/boutiques" linkText="Toutes les boutiques" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boutiques.map((boutique, i) => <CarteBoutique key={boutique.id} boutique={boutique} index={i} />)}
      </div>
    </section>}

    <section>
      <SectionHeading eyebrow="Comment ça marche ?" title="Acheter en ligne, en toute sérénité." link="/aide" linkText="Centre d’aide" />
      <div className="grid gap-3 sm:grid-cols-3">
        <StepCard title="Trouvez votre bonheur" text="Explorez le catalogue, comparez les détails et découvrez les boutiques présentes sur NILE." number="01" />
        <StepCard title="Choisissez comment payer" text="Sélectionnez l’une des options effectivement proposées au moment de la commande." number="02" />
        <StepCard title="Suivez votre commande" text="Retrouvez les informations et les étapes de suivi disponibles pour votre achat." number="03" />
      </div>
    </section>

    <section className="flex flex-col gap-4 rounded-[18px] border border-stone-200 bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div><h2 className="font-titre text-xl font-extrabold text-slate-950">Besoin d’un renseignement ?</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Consultez le centre d’aide pour comprendre le parcours d’achat, les options de règlement et le suivi.</p></div>
      <Link href="/aide" className={btn("secondaire", "lg")}>Consulter l’aide <Arrow /></Link>
    </section>

    <ProductSection title="Les dernières nouveautés" eyebrow="Tout juste ajoutés" products={recents} quantities={quantites} favorites={utilisateur ? favoris : null} empty="Les nouvelles références apparaîtront ici lorsqu’elles seront publiées." />
  </div>;
}

function SectionHeading({ eyebrow, title, link, linkText }: { eyebrow: string; title: string; link: string; linkText: string }) {
  return <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-5 sm:flex-row sm:items-end">
    <div><p className="nile-eyebrow text-blue-700">{eyebrow}</p><h2 className="mt-1 nile-section-title">{title}</h2></div>
    <Link href={link} className="inline-flex items-center gap-2 self-start text-xs font-extrabold text-blue-900 transition-colors hover:text-blue-700 sm:self-auto">{linkText}<Arrow small /></Link>
  </div>;
}

function ProductSection({ title, eyebrow, products, quantities, favorites, empty }: {
  title: string;
  eyebrow: string;
  products: ComponentProps<typeof CarteProduitVitrine>["produit"][];
  quantities: Record<string, number>;
  favorites: Set<string> | null;
  empty?: string;
}) {
  return <section><SectionHeading eyebrow={eyebrow} title={title} link="/catalogue" linkText="Voir le catalogue" />
    {products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
      {products.map((p, i) => <CarteProduitVitrine key={p.id} produit={p} quantitePanier={quantities[p.id] ?? 0} priority={i < 2} index={i}
        favori={favorites ? { enFavori: favorites.has(p.id), retour: "/" } : undefined} afficherCategorie sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px" />)}
    </div> : <p className="rounded-[17px] border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">{empty ?? "Rien à afficher pour le moment."}</p>}
  </section>;
}

function TrustItem({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return <div className="flex min-w-0 flex-col items-start gap-2 p-3 sm:flex-row sm:gap-3 sm:px-5 sm:py-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-blue-50 text-blue-900 sm:h-[42px] sm:w-[42px] sm:rounded-[13px]">{icon}</span><div className="min-w-0"><h3 className="font-titre text-xs font-extrabold text-slate-950">{title}</h3><p className="mt-1 text-[11px] leading-[1.45] text-slate-500 sm:text-[11px] sm:leading-5">{text}</p></div></div>;
}
function StepCard({ title, text, number }: { title: string; text: string; number: string }) {
  return <article className="rounded-[17px] border border-stone-200 bg-white p-4 sm:p-5"><p className="mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-blue-50 font-titre text-sm font-extrabold text-blue-900">{number}</p><h3 className="font-titre text-sm font-extrabold text-slate-950">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{text}</p></article>;
}
function Arrow({ small = false }: { small?: boolean }) { return <svg width={small ? 14 : 17} height={small ? 14 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function Check() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>; }
function StoreIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10h18l-1.5-6h-15zM5 10v10h14V10M9 20v-6h6v6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></svg>; }
function TagIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>; }
function WalletIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /></svg>; }
function PackageIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5zM3 8v9l9 5 9-5V8M12 13v9" /></svg>; }
