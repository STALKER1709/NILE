import Link from "next/link";

export function PiedDePage() {
  return <footer className="mt-12 bg-blue-950 pb-24 text-white sm:pb-0">
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 font-titre text-xl font-bold text-blue-950">N</span>
            <span><span className="block font-titre text-2xl font-bold tracking-tight">NILE</span><span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-blue-200/70">Marketplace</span></span>
          </Link>
          <p className="mt-5 text-sm leading-7 text-blue-100/70">Les boutiques locales, les produits du quotidien et une expérience d’achat pensée pour le Cameroun.</p>
          <Link href="/catalogue" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-white">Explorer le catalogue <span aria-hidden="true">↗</span></Link>
        </div>
        <FooterCol title="Acheter" links={[["Catalogue","/catalogue"],["Promotions","/promotions"],["Boutiques","/boutiques"],["Mes commandes","/commandes"],["Favoris","/favoris"]]} />
        <FooterCol title="Vendre" links={[["Ouvrir une boutique","/inscription"],["Espace vendeur","/vendeur"],["Vérification vendeur","/vendeur/kyc"],["Annonces","/vendeur/annonces"]]} />
        <FooterCol title="Accompagnement" links={[["Centre d’aide","/aide"],["Nous contacter","/contact"],["Conditions d’utilisation","/conditions"],["Confidentialité","/confidentialite"]]} />
      </div>
      <div className="flex flex-col gap-6 py-7 md:flex-row md:items-center md:justify-between">
        <div><p className="text-xs font-semibold text-white">Modes de paiement</p><p className="mt-1 max-w-lg text-xs leading-5 text-blue-100/60">Les options proposées sont celles disponibles au moment de la commande. Les marques ci-dessous identifient les fournisseurs de paiement, sans impliquer de partenariat commercial.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 min-w-32 items-center justify-center rounded-xl bg-white px-4"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/MTN_Logo.svg" alt="Logo MTN" className="max-h-7 max-w-24 object-contain" loading="lazy" /></div>
          <div className="flex h-12 min-w-32 items-center justify-center rounded-xl bg-white px-4"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Orange_logo.svg" alt="Logo Orange" className="max-h-7 max-w-24 object-contain" loading="lazy" /></div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-blue-100/55 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} NILE Marketplace. Tous droits réservés.</span><Link href="#top" className="font-semibold text-blue-100/75 hover:text-white">Retour en haut ↑</Link></div>
    </div>
  </footer>;
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return <div><h2 className="text-xs font-bold uppercase tracking-[.16em] text-amber-300">{title}</h2><ul className="mt-4 space-y-3">{links.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-blue-100/70 transition-colors hover:text-white">{label}</Link></li>)}</ul></div>;
}
