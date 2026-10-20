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

  return <div className="mx-auto w-full max-w-[1240px] space-y-7 pb-8 sm:space-y-10 lg:space-y-12">
    <h1 className="sr-only">NILE — la marketplace pensée pour le Cameroun</h1>

    <section className="grid overflow-hidden rounded-[20px] border border-[#e3e9fa] sm:rounded-[28px] lg:min-h-[385px] lg:grid-cols-[1.02fr_.98fr]" style={{ background: "linear-gradient(112deg,#edf2ff 0%,#f5f7ff 49%,#fff3d7 100%)" }}>
      <div className="relative z-10 flex flex-col items-start justify-center px-5 py-6 sm:px-10 sm:py-11 lg:px-[53px] lg:py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e1ff] bg-white px-2.5 py-1.5 text-[10px] sm:px-3 sm:py-2 sm:text-[11px] font-extrabold text-blue-900">
          <span className="h-2 w-2 rounded-full bg-[#14845d]" /> LA MARKETPLACE QUI VOUS COMPREND
        </div>
        <h2 className="mt-5 max-w-[570px] font-titre text-[32px] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#15275a] sm:text-[46px] lg:text-[53px]">
          Vos envies. Vos marques.
          <span className="block text-amber-500">Tout près de vous.</span>
        </h2>
        <p className="mt-3 max-w-[445px] text-[13px] leading-6 text-[#596783] sm:mt-4 sm:text-[15px] sm:leading-7">
          Découvrez des produits qui vous ressemblent, comparez les articles et explorez les boutiques locales. Les détails de commande vous accompagnent jusqu’à la livraison.
        </p>
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:w-auto sm:flex-row sm:gap-3">
          <Link href="/catalogue" className={btn("primaire", "lg")}>Explorer le catalogue <Arrow /></Link>
          <Link href="/inscription" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#dce3f5] bg-white px-5 py-3 text-sm font-extrabold text-blue-900 transition-colors hover:border-blue-300 hover:bg-blue-50">
            Ouvrir ma boutique <span aria-hidden="true">＋</span>
          </Link>
        </div>
        <div className="mt-4 hidden flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#dbe2f5] pt-4 text-[11px] font-semibold text-[#67718a] sm:mt-6 sm:flex sm:text-xs">
          <span className="inline-flex items-center gap-2"><Check /> Une expérience pensée pour le Cameroun</span>
          <span className="inline-flex items-center gap-2"><Check /> Des options affichées avant validation</span>
        </div>
      </div>

      <div className="relative min-h-[190px] overflow-hidden sm:min-h-[285px] lg:min-h-[365px]">
        <div className="absolute right-[6%] top-0 h-[205px] w-[205px] rounded-full bg-[#f6b52d]/50 sm:right-[8%] sm:top-[2%] sm:h-[300px] sm:w-[300px] lg:right-[9%] lg:top-[3%] lg:h-[345px] lg:w-[345px]" aria-hidden="true" />
        {principal ? (
          <div className="absolute right-[6%] top-[9%] h-[78%] w-[65%] rotate-[3deg] overflow-hidden rounded-[18px] border-[5px] border-white/80 bg-white sm:rounded-[25px] sm:border-[7px]" style={{ boxShadow: "0 22px 55px rgba(28,46,95,.18)" }}>
            <Vignette url={principal.images[0]?.url} alt={principal.titre} ajustement="couvrir" className="h-full w-full rounded-[17px]" sizes="(max-width: 1024px) 65vw, 380px" />
          </div>
        ) : (
          <Image src="/bannieres/marche.jpg" alt="Un espace de commerce local" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover p-4" />
        )}
        <div className="absolute left-[4%] top-[7%] rounded-[12px] bg-white px-3 py-2 sm:left-[5%] sm:top-[8%] sm:rounded-[15px] sm:px-4 sm:py-3" style={{ boxShadow: "0 8px 24px rgba(20,35,73,.08)", transform: "rotate(-5deg)" }}>
          <span className="block text-[9px] font-extrabold tracking-[.08em] text-slate-500">À DÉCOUVRIR</span>
          <strong className="mt-1 block font-titre text-sm font-extrabold text-blue-900 sm:text-[19px]">La sélection <span className="text-amber-500">NILE.</span></strong>
        </div>
        {mini && <div className="absolute bottom-4 left-[4%] hidden w-[142px] rounded-[17px] sm:block border border-stone-100 bg-white p-[10px]" style={{ boxShadow: "0 14px 35px rgba(28,46,95,.14)", transform: "rotate(-5deg)" }}>
          <Vignette url={mini.images[0]?.url} alt={mini.titre} ajustement="couvrir" className="h-[95px] w-full rounded-[11px]" sizes="150px" />
          <span className="mt-2 block ligne-2 text-[11px] font-extrabold text-slate-900">{mini.titre}</span>
          <span className="mt-1 block text-[11px] font-extrabold text-blue-900">À découvrir sur NILE</span>
        </div>}
        <div className="absolute bottom-5 right-[4%] hidden h-[82px] w-[82px] sm:flex flex-col items-center justify-center rounded-full border-[5px] border-white bg-blue-900 text-center text-white" style={{ boxShadow: "0 8px 24px rgba(20,35,73,.12)", transform: "rotate(8deg)" }}>
          <strong className="font-titre text-xl font-extrabold">NILE</strong><span className="text-[8px] leading-[1.25]">ACHETER<br />EN CONFIANCE</span>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 overflow-hidden rounded-[16px] border border-stone-200 bg-white sm:rounded-[18px] lg:grid-cols-4">
      <TrustItem title="Des boutiques à découvrir" text="Explorez les univers des vendeurs présents." icon={<StoreIcon />} />
      <TrustItem title="Des prix à comparer" text="Consultez les détails et les options par produit." icon={<TagIcon />} />
      <TrustItem title="Des options claires" text="Les moyens de règlement sont indiqués à la commande." icon={<WalletIcon />} />
      <TrustItem title="Le suivi de vos achats" text="Retrouvez les étapes disponibles dans votre espace." icon={<PackageIcon />} />
    </section>

    {rayons.length > 0 && <section>
      <SectionHeading eyebrow="Explorer par envie" title="Qu’est-ce qui vous ferait plaisir ?" link="/catalogue" linkText="Tous les rayons" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {rayons.map((categorie) => {
          const visuel = visuels[categorie.id];
          return <Link key={categorie.id} href={"/catalogue?categorie=" + categorie.slug} className="group min-w-0 rounded-[17px] border border-stone-200 bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-carte-hover sm:p-3.5">
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

    {offres.length > 0 && <section className="overflow-hidden rounded-[20px] bg-[#172d6f] p-3.5 sm:rounded-[24px] sm:p-6">
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

    <section className="grid overflow-hidden rounded-[20px] border border-[#f7e6c2] sm:rounded-[24px] lg:grid-cols-[1.05fr_.95fr]" style={{ background: "linear-gradient(115deg,#fff1d2 0%,#fff8e9 100%)" }}>
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
