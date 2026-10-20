import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
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

export default async function AccueilPage() {
  const utilisateur = await getUtilisateurCourant();
  const [categories, { produits: recents }, { produits: populaires }, boutiques, quantites] =
    await Promise.all([
      listerCategories(),
      rechercherProduitsCatalogue({ tri: "recent", page: 1, parPage: 8 }),
      rechercherProduitsCatalogue({ tri: "populaire", page: 1, parPage: 8 }),
      listerBoutiques({ tri: "populaire", limite: 8 }),
      getQuantitesAffichees(utilisateur?.id ?? null),
    ]);
  const favoris = await favorisParmi(utilisateur?.id ?? null, [...recents, ...populaires].map((p) => p.id));
  const rayons = categories.filter((c) => !c.parentId).slice(0, 6);
  const visuels = await imagesParRayon(rayons.map((c) => c.id), categories);

  return (
    <div className="space-y-14 pb-8 sm:space-y-20">
      <h1 className="sr-only">NILE — la marketplace pensée pour le Cameroun</h1>

      <section className="relative isolate grid min-h-[520px] overflow-hidden rounded-[28px] bg-[#14265d] text-white lg:min-h-[590px] lg:grid-cols-[1.02fr_.98fr]">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/10 lg:right-[42%]" aria-hidden="true" />
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10 lg:right-[46%]" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <span className="nile-eyebrow mb-7 inline-flex items-center gap-2 text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Le commerce local, connecté
          </span>
          <h2 className="max-w-[620px] font-titre text-[2.75rem] font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem]">
            Vos envies.
            <span className="mt-1 block text-amber-400">Vos boutiques.</span>
            <span className="mt-1 block">Un seul endroit.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-blue-100/85 sm:text-lg sm:leading-8">
            Découvrez les produits de vendeurs locaux, comparez les offres et commandez simplement, avec des options pensées pour vos habitudes au Cameroun.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/catalogue" className={btn("accent", "lg")}>
              Explorer le catalogue <Arrow />
            </Link>
            <Link href="/boutiques" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10">
              Trouver une boutique
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-xs font-medium text-blue-100/80 sm:text-sm">
            <span className="inline-flex items-center gap-2"><Check /> Paiement selon les options proposées</span>
            <span className="inline-flex items-center gap-2"><Check /> Livraison avec suivi</span>
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-hidden lg:min-h-full">
          <Image src="/bannieres/marche.jpg" alt="Une commerçante dans son espace de vente" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101d45]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#14265d]/20 lg:via-transparent lg:to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-[300px]">
            <div className="rounded-2xl border border-white/60 bg-white p-4 text-slate-900 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-blue-900"><Store /></span>
                <div>
                  <p className="font-titre text-sm font-bold">Du vendeur à votre porte</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">Une expérience d'achat conçue pour le terrain.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-5 top-5 hidden rounded-full border border-white/40 bg-white/95 px-4 py-2 text-xs font-bold text-blue-950 shadow-lg sm:block">
            Acheter local. Simplement.
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-3 sm:gap-5 sm:p-6">
        <TrustItem title="Un choix qui grandit" text="Parcourez les rayons et comparez les produits disponibles." icon={<GridIcon />} />
        <TrustItem title="Des paiements adaptés" text="Choisissez parmi les modes affichés lors de la commande." icon={<Wallet />} />
        <TrustItem title="Une commande suivie" text="Retrouvez les étapes de votre commande depuis votre compte." icon={<Package />} />
      </section>

      {rayons.length > 0 && (
        <section>
          <SectionHeading eyebrow="À explorer" title="Trouvez votre prochain coup de cœur" link="/catalogue" linkText="Tous les rayons" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {rayons.map((c, i) => {
              const visual = visuels[c.id];
              return (
                <Link key={c.id} href={`/catalogue?categorie=${c.slug}`} className="group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg sm:min-h-60 sm:p-5">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800 transition-colors group-hover:bg-amber-100">
                    <IconeCategorie nom={c.nom} />
                  </div>
                  <div className="relative z-10 mt-10">
                    <h3 className="font-titre text-base font-bold leading-snug text-slate-950">{c.nom}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-800">Explorer <Arrow small /></span>
                  </div>
                  {visual ? <Image src={visual} alt="" fill sizes="(max-width: 640px) 45vw, 220px" className="absolute inset-0 object-cover opacity-[0.13] transition-opacity group-hover:opacity-[0.22]" /> : <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-amber-100/70" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
                  <span className="absolute right-4 top-4 font-titre text-xs font-bold text-blue-900/25">0{i + 1}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {populaires.length > 0 && (
        <ProductSection title="Les favoris du moment" eyebrow="Sélection NILE" products={populaires} quantities={quantites} favorites={utilisateur ? favoris : null} />
      )}

      {boutiques.length > 0 && (
        <section>
          <SectionHeading eyebrow="Les vendeurs" title="Rencontrez les boutiques" link="/boutiques" linkText="Toutes les boutiques" />
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
            {boutiques.map((b, i) => <CarteBoutique key={b.id} boutique={b} compact index={i} />)}
          </div>
        </section>
      )}

      <section className="grid overflow-hidden rounded-[26px] border border-stone-200 bg-[#fffdf8] lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <span className="nile-eyebrow text-blue-800">Pensé pour vos habitudes</span>
          <h2 className="mt-4 max-w-lg font-titre text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">Acheter en ligne devrait être plus simple.</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            Retrouvez les détails des produits, les informations de boutique et les étapes de commande au même endroit. Les modes de règlement disponibles sont indiqués au moment de payer.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalogue" className={btn("primaire", "lg")}>Commencer mes achats <Arrow /></Link>
            <Link href="/aide" className={btn("secondaire", "lg")}>Comment ça marche ?</Link>
          </div>
        </div>
        <div className="relative min-h-[280px] bg-blue-50 sm:min-h-[360px]">
          <Image src="/bannieres/livraison.jpg" alt="Préparation et livraison d'une commande" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf8]/50 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-bold text-blue-900">Une étape à la fois</p>
            <p className="mt-1 text-xs text-slate-600">Commande · Préparation · Livraison</p>
          </div>
        </div>
      </section>

      <ProductSection title="Les dernières nouveautés" eyebrow="Tout juste ajoutés" products={recents} quantities={quantites} favorites={utilisateur ? favoris : null} empty="Les nouvelles boutiques arrivent bientôt." />

      <section className="relative overflow-hidden rounded-[26px] bg-amber-400 px-6 py-10 text-blue-950 sm:px-10 sm:py-14 lg:px-14">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-blue-950/10" aria-hidden="true" />
        <div className="absolute -right-4 -top-12 h-44 w-44 rounded-full border border-blue-950/10" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="nile-eyebrow text-blue-900">Vous vendez au Cameroun ?</span>
            <h2 className="mt-3 font-titre text-3xl font-bold leading-tight sm:text-4xl">Faites grandir votre boutique avec NILE.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-950/75 sm:text-base">Présentez vos produits, gérez vos commandes et développez votre présence en ligne.</p>
          </div>
          <Link href="/inscription" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-900">Ouvrir ma boutique <Arrow /></Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, link, linkText }: { eyebrow: string; title: string; link: string; linkText: string }) {
  return <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="nile-eyebrow text-blue-700">{eyebrow}</p><h2 className="mt-2 nile-section-title">{title}</h2></div><Link href={link} className="inline-flex items-center gap-2 self-start text-sm font-bold text-blue-800 transition-colors hover:text-blue-950 sm:self-auto">{linkText}<Arrow small /></Link></div>;
}

function ProductSection({ title, eyebrow, products, quantities, favorites, empty }: { title: string; eyebrow: string; products: React.ComponentProps<typeof CarteProduitVitrine>["produit"][]; quantities: Record<string, number>; favorites: Set<string> | null; empty?: string }) {
  return <section><SectionHeading eyebrow={eyebrow} title={title} link="/catalogue" linkText="Voir le catalogue" />{products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">{products.map((p, i) => <CarteProduitVitrine key={p.slug} produit={p} quantitePanier={quantities[p.id] ?? 0} priority={i < 2} index={i} favori={favorites ? { enFavori: favorites.has(p.id), retour: "/" } : undefined} afficherCategorie />)}</div> : <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">{empty ?? "Rien à afficher pour le moment."}</p>}</section>;
}

function TrustItem({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return <div className="flex items-start gap-3 px-2 py-2"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800">{icon}</span><div><h3 className="font-titre text-sm font-bold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{text}</p></div></div>;
}

function Arrow({ small = false }: { small?: boolean }) {
  return <svg width={small ? 14 : 17} height={small ? 14 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
function Check() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>; }
function Store() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10h18l-1.5-6h-15zM5 10v10h14V10M9 20v-6h6v6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></svg>; }
function GridIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function Wallet() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/></svg>; }
function Package() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5zM3 8v9l9 5 9-5V8M12 13v9"/></svg>; }
