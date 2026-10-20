import Link from "next/link";

const LOGO_MTN = "https://commons.wikimedia.org/wiki/Special:FilePath/MTN_Logo.svg";
const LOGO_ORANGE = "https://commons.wikimedia.org/wiki/Special:FilePath/Orange_logo.svg";

export function PiedDePage() {
  return (
    <footer className="mt-16 bg-[#0C1734] pb-20 text-white sm:pb-0">
      <Link href="#top" className="block border-b border-white/10 bg-white/[.04] py-3.5 text-center text-xs font-semibold tracking-wide text-white/75 transition hover:bg-white/[.08] hover:text-white">
        Retour en haut ↑
      </Link>
      <div className="mx-auto grid max-w-conteneur gap-10 px-4 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.4fr_.8fr_.8fr_1fr] lg:gap-12 lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="NILE, accueil">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F59E0B] text-xl font-black tracking-tight text-[#14265A]">N</span>
            <span className="text-xl font-extrabold tracking-[.16em]">NILE</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">La marketplace pensée pour le Cameroun. Découvrez les boutiques d’ici et faites vos achats à votre rythme.</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-[#FFC15C]">Le commerce d’ici, à portée de main.</p>
        </div>
        <div>
          <p className="text-sm font-bold">Acheter</p>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link href="/catalogue" className="transition hover:text-white">Catalogue</Link></li>
            <li><Link href="/promotions" className="transition hover:text-white">Promotions</Link></li>
            <li><Link href="/boutiques" className="transition hover:text-white">Boutiques</Link></li>
            <li><Link href="/panier" className="transition hover:text-white">Mon panier</Link></li>
            <li><Link href="/commandes" className="transition hover:text-white">Mes commandes</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">Vendre sur NILE</p>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link href="/inscription" className="transition hover:text-white">Devenir vendeur</Link></li>
            <li><Link href="/vendeur" className="transition hover:text-white">Espace vendeur</Link></li>
            <li><Link href="/aide" className="transition hover:text-white">Centre d’aide</Link></li>
            <li><Link href="/contact" className="transition hover:text-white">Nous contacter</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">Paiements disponibles</p>
          <p className="mt-2 text-xs leading-5 text-white/55">Les modes proposés peuvent varier selon la commande et la disponibilité du service.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex h-14 w-[74px] items-center justify-center rounded-lg bg-white p-2">
              <img src={LOGO_MTN} alt="Logo MTN" loading="lazy" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex h-14 w-[74px] items-center justify-center rounded-lg bg-white p-2">
              <img src={LOGO_ORANGE} alt="Logo Orange" loading="lazy" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
          <p className="mt-3 text-xs text-white/55">Mobile Money · Espèces à la livraison</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-conteneur flex-col gap-3 px-4 py-5 text-xs text-white/45 sm:px-10 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} NILE Marketplace · FCFA (XAF)</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/conditions" className="hover:text-white">Conditions générales</Link>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <Link href="/aide" className="hover:text-white">Aide</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
