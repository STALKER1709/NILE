import Link from "next/link";

export function PiedDePage() {
  return <footer className="mt-10 bg-[#0B192C] pb-24 text-white sm:pb-0">
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-8 sm:py-14 lg:px-14">
      <div className="grid gap-9 border-b border-white/10 pb-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="nile-brand-mark grid h-11 w-11 place-items-center rounded-[14px] bg-[#172b45] font-titre text-xl font-extrabold text-white">N</span>
            <span><span className="block font-titre text-2xl font-extrabold tracking-tight">NILE</span><span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Le marché sans frontières</span></span>
          </Link>
          <p className="mt-5 max-w-[280px] text-[11px] leading-6 text-slate-300">Les boutiques locales et les produits du quotidien, réunis dans une expérience pensée pour le Cameroun.</p>
          <Link href="/catalogue" className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[#F59E0B] hover:text-white">Explorer le catalogue <span aria-hidden="true">↗</span></Link>
        </div>
        <FooterCol title="Acheter" links={[["Catalogue","/catalogue"],["Promotions","/promotions"],["Boutiques","/boutiques"],["Mes commandes","/commandes"],["Favoris","/favoris"]]} />
        <FooterCol title="Vendre" links={[["Ouvrir une boutique","/inscription?role=VENDEUR"],["Espace vendeur","/vendeur"],["Vérification vendeur","/vendeur/kyc"],["Annonces","/vendeur/annonces"]]} />
        <FooterCol title="Accompagnement" links={[["Centre d’aide","/aide"],["Nous contacter","/contact"],["Conditions d’utilisation","/conditions"],["Confidentialité","/confidentialite"]]} />
      </div>
      <div className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
        <div><p className="text-xs font-extrabold text-white">Modes de paiement</p><p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-400">Les options proposées sont celles disponibles au moment de la commande. Les marques ci-dessous identifient les fournisseurs de paiement, sans impliquer de partenariat commercial.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 min-w-32 items-center justify-center rounded-[12px] bg-white px-4"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/MTN_Logo.svg" alt="Logo MTN" className="max-h-7 max-w-24 object-contain" loading="lazy" /></div>
          <div className="flex h-12 min-w-32 items-center justify-center rounded-[12px] bg-white px-4"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Orange_logo.svg" alt="Logo Orange" className="max-h-7 max-w-24 object-contain" loading="lazy" /></div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} NILE Marketplace. Tous droits réservés.</span><Link href="#top" className="font-extrabold text-slate-300 hover:text-white">Retour en haut ↑</Link></div>
    </div>
  </footer>;
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return <div><h2 className="text-[11px] font-extrabold uppercase tracking-[.13em] text-amber-300">{title}</h2><ul className="mt-4 grid gap-3">{links.map(([label, href]) => <li key={href}><Link href={href} className="text-[11px] text-blue-100/70 transition-colors hover:text-white">{label}</Link></li>)}</ul></div>;
}
