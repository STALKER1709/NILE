import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { btn } from "@/components/ui/kit";

function BarreRecherche({ className = "" }: { className?: string }) {
  return (
    <form method="get" action="/catalogue" className={`relative ${className}`}>
      <input
        type="search"
        name="q"
        placeholder="Rechercher un produit…"
        aria-label="Rechercher"
        className="w-full rounded-full border border-gray-300 bg-gray-50 py-2.5 pl-4 pr-11 text-sm focus:border-nile focus:bg-white focus:outline-none focus:ring-2 focus:ring-nile/30"
      />
      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-nile p-2 text-white hover:bg-nile-dark"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

export function Entete({
  utilisateur,
  nbArticles,
}: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center gap-3 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-nile">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-nile text-white">N</span>
            <span className="hidden sm:inline">NILE</span>
          </Link>

          <BarreRecherche className="hidden flex-1 sm:block" />

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            {utilisateur ? (
              <>
                <Link href="/compte" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:flex">
                  <IconeUtilisateur />
                  <span className="max-w-[9rem] truncate">{utilisateur.nom}</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <form action={deconnexionAction} className="hidden sm:block">
                  <button type="submit" className="rounded-lg px-2 py-2 text-sm text-gray-500 hover:text-gray-900">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <LienPanier nb={nbArticles} />
                <Link href="/connexion" className="hidden px-3 py-2 text-sm text-gray-700 hover:text-nile sm:block">
                  Connexion
                </Link>
                <Link href="/inscription" className={btn("primaire", "sm", "hidden sm:inline-flex")}>
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Recherche pleine largeur sur mobile */}
        <BarreRecherche className="pb-3 sm:hidden" />
      </div>
    </header>
  );
}

function LienPanier({ nb }: { nb: number }) {
  return (
    <Link href="/panier" aria-label="Panier" className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
      {nb > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
          {nb}
        </span>
      )}
    </Link>
  );
}

function IconeUtilisateur() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
