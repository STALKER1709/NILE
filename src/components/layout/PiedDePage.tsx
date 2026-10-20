import Link from "next/link";

export function PiedDePage() {
  return (
    <footer className="mt-16 bg-nile-950 pb-20 text-white sm:pb-0 border-t border-nile-900">
      {/* Bouton retour en haut fluide */}
      <Link
        href="#top"
        className="block bg-nile-900/60 py-3.5 text-center text-xs font-semibold text-slate-300 transition-colors hover:bg-nile-800 hover:text-white"
      >
        Retour en haut ↑
      </Link>

      <div className="mx-auto grid max-w-conteneur grid-cols-2 gap-8 px-4 py-12 text-sm sm:grid-cols-4">
        {/* Identité NILE */}
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-dark font-titre font-bold text-nile-950">
              N
            </span>
            <span className="font-titre text-lg font-bold tracking-tight text-white">
              NILE
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            La marketplace de référence au Cameroun. Achats en ligne fiables, paiements mobiles sécurisés et livraison avec vérification.
          </p>
        </div>

        {/* Acheter */}
        <div>
          <h3 className="font-titre text-xs font-bold uppercase tracking-wider text-slate-300">
            Acheter
          </h3>
          <ul className="mt-3.5 space-y-2 text-xs text-slate-400">
            <li><Link href="/catalogue" className="transition-colors hover:text-white">Catalogue complet</Link></li>
            <li><Link href="/promotions" className="transition-colors hover:text-white">Offres &amp; promotions</Link></li>
            <li><Link href="/boutiques" className="transition-colors hover:text-white">Boutiques certifiées</Link></li>
            <li><Link href="/panier" className="transition-colors hover:text-white">Mon panier</Link></li>
            <li><Link href="/commandes" className="transition-colors hover:text-white">Suivi de commande</Link></li>
          </ul>
        </div>

        {/* Vendre */}
        <div>
          <h3 className="font-titre text-xs font-bold uppercase tracking-wider text-slate-300">
            Vendre
          </h3>
          <ul className="mt-3.5 space-y-2 text-xs text-slate-400">
            <li><Link href="/inscription" className="transition-colors hover:text-white">Ouvrir ma boutique</Link></li>
            <li><Link href="/vendeur" className="transition-colors hover:text-white">Espace vendeur</Link></li>
            <li><Link href="/vendeur/kyc" className="transition-colors hover:text-white">Vérification KYC</Link></li>
            <li><Link href="/conditions" className="transition-colors hover:text-white">Charte vendeurs</Link></li>
          </ul>
        </div>

        {/* Support & Légal */}
        <div>
          <h3 className="font-titre text-xs font-bold uppercase tracking-wider text-slate-300">
            Assistance
          </h3>
          <ul className="mt-3.5 space-y-2 text-xs text-slate-400">
            <li><Link href="/aide" className="transition-colors hover:text-white">Centre d'aide</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-white">Service client WhatsApp</Link></li>
            <li><Link href="/conditions" className="transition-colors hover:text-white">Conditions d'utilisation</Link></li>
            <li><Link href="/confidentialite" className="transition-colors hover:text-white">Confidentialité</Link></li>
          </ul>
        </div>
      </div>

      {/* Badges de paiement sécurisé */}
      <div className="border-t border-white/5 py-5">
        <div className="mx-auto flex max-w-conteneur flex-wrap items-center justify-center gap-3 px-4">
          <span className="rounded-md bg-[#ffcb05] px-3 py-1 text-[11px] font-bold text-slate-900 shadow-xs">
            MTN Mobile Money
          </span>
          <span className="rounded-md bg-[#ff7900] px-3 py-1 text-[11px] font-bold text-white shadow-xs">
            Orange Money
          </span>
          <span className="rounded-md border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
            Espèces à la livraison
          </span>
          <span className="rounded-md border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-300">
            Vérification par code secret
          </span>
        </div>
      </div>

      {/* Mentions légales */}
      <div className="border-t border-white/5 py-4 text-center text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} NILE Marketplace · Cameroun · FCFA (XAF)</p>
      </div>
    </footer>
  );
}
