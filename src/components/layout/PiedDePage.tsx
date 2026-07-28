import Link from "next/link";

export function PiedDePage() {
  return (
    // pb-16 mobile : la barre de navigation fixe ne recouvre pas le contenu.
    <footer className="mt-10 bg-nile-900 pb-16 text-white sm:pb-0">
      {/* Bandeau « retour en haut » (signal marketplace) */}
      <Link
        href="#top"
        className="block bg-nile-800 py-3 text-center text-sm font-medium text-white/90 hover:bg-nile-dark"
      >
        Retour en haut ↑
      </Link>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-9 text-sm sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="flex items-center gap-1.5 text-lg font-extrabold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-nile-950">N</span>
            NILE
          </p>
          <p className="mt-2 text-white/60">
            La marketplace du Cameroun. Paiement mobile &amp; à la livraison.
          </p>
        </div>
        <div>
          <p className="font-semibold">Acheter</p>
          <ul className="mt-2 space-y-1.5 text-white/60">
            <li><Link href="/catalogue" className="hover:text-white">Catalogue</Link></li>
            <li><Link href="/boutiques" className="hover:text-white">Boutiques</Link></li>
            <li><Link href="/panier" className="hover:text-white">Mon panier</Link></li>
            <li><Link href="/commandes" className="hover:text-white">Mes commandes</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Vendre</p>
          <ul className="mt-2 space-y-1.5 text-white/60">
            <li><Link href="/inscription" className="hover:text-white">Devenir vendeur</Link></li>
            <li><Link href="/vendeur" className="hover:text-white">Espace vendeur</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Paiement</p>
          <ul className="mt-2 space-y-1.5 text-white/60">
            <li>MTN Mobile Money</li>
            <li>Orange Money</li>
            <li>À la livraison (COD)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-md bg-[#ffcb05] px-2.5 py-1 text-[11px] font-bold text-slate-900">MTN MoMo</span>
          <span className="rounded-md bg-[#ff7900] px-2.5 py-1 text-[11px] font-bold text-white">Orange Money</span>
          <span className="rounded-md border border-white/30 px-2.5 py-1 text-[11px] font-semibold text-white/85">Espèces à la livraison</span>
        </div>
      </div>
      <div className="space-y-2 border-t border-white/10 py-4 text-center text-xs text-white/50">
        <p className="space-x-3">
          <Link href="/aide" className="hover:text-white">Aide</Link>
          <span aria-hidden="true">·</span>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <span aria-hidden="true">·</span>
          <Link href="/conditions" className="hover:text-white">Conditions générales</Link>
          <span aria-hidden="true">·</span>
          <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
        </p>
        <p>© {new Date().getFullYear()} NILE Marketplace · FCFA (XAF)</p>
      </div>
    </footer>
  );
}
