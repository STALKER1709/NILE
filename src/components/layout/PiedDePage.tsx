import Link from "next/link";

export function PiedDePage() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 text-sm sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="flex items-center gap-1.5 text-lg font-extrabold text-nile">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-nile text-white">N</span>
            NILE
          </p>
          <p className="mt-2 text-gray-500">
            La marketplace du Cameroun. Paiement mobile & à la livraison.
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Acheter</p>
          <ul className="mt-2 space-y-1 text-gray-500">
            <li><Link href="/catalogue" className="hover:text-nile">Catalogue</Link></li>
            <li><Link href="/panier" className="hover:text-nile">Mon panier</Link></li>
            <li><Link href="/commandes" className="hover:text-nile">Mes commandes</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Vendre</p>
          <ul className="mt-2 space-y-1 text-gray-500">
            <li><Link href="/inscription" className="hover:text-nile">Devenir vendeur</Link></li>
            <li><Link href="/vendeur" className="hover:text-nile">Espace vendeur</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Paiement</p>
          <ul className="mt-2 space-y-1 text-gray-500">
            <li>MTN Mobile Money</li>
            <li>Orange Money</li>
            <li>À la livraison (COD)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} NILE Marketplace — FCFA (XAF)
      </div>
    </footer>
  );
}
