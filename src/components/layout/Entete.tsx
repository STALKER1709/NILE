import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BarreRecherche } from "@/components/layout/BarreRecherche";

export interface LienCategorie {
  nom: string;
  slug: string;
}

export function Entete({
  utilisateur,
  nbArticles,
  categories,
}: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
  categories: LienCategorie[];
}) {
  return (
    <header className="relative z-40 text-white shadow-md sm:sticky sm:top-0">
      {/* Barre principale (sombre, type marketplace) */}
      <div className="bg-nile-900">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 text-xl font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-nile-950">N</span>
            <span className="hidden sm:inline">NILE</span>
          </Link>

          {/* Livrer au Cameroun (signal marketplace) */}
          <div className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-white/10 lg:flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="leading-tight">
              <span className="block text-white/60">Livrer au</span>
              <span className="block font-semibold">Cameroun 🇨🇲</span>
            </span>
          </div>

          <BarreRecherche className="hidden flex-1 sm:flex" />

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            {utilisateur ? (
              <>
                <Link href="/compte" className="hidden rounded-md px-2 py-1 text-left text-xs leading-tight hover:bg-white/10 sm:block">
                  <span className="block text-white/60">Bonjour, {utilisateur.nom.split(" ")[0]}</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <form action={deconnexionAction} className="hidden sm:block">
                  <button type="submit" className="rounded-md px-2 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="hidden rounded-md px-2 py-1 text-left text-xs leading-tight hover:bg-white/10 sm:block">
                  <span className="block text-white/60">Bonjour, identifiez-vous</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <Link
                  href="/inscription"
                  className="hidden rounded-md bg-accent px-3 py-2 text-xs font-semibold text-nile-950 hover:bg-accent-dark sm:inline-block"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Recherche pleine largeur sur mobile */}
        <div className="px-3 pb-2.5 sm:hidden">
          <BarreRecherche />
        </div>
      </div>

      {/* Bandeau des rayons (départements) */}
      <div className="bg-nile-800">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-2 py-1.5 text-sm no-scrollbar sm:px-4">
          <Link
            href="/catalogue"
            className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 font-medium hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Tous les rayons
          </Link>
          <Link
            href="/boutiques"
            className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 font-medium hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" />
              <path d="M8 9a4 4 0 0 1 8 0" />
            </svg>
            Boutiques
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogue?categorie=${c.slug}`}
              className="shrink-0 whitespace-nowrap rounded px-2.5 py-1 text-white/90 hover:bg-white/10"
            >
              {c.nom}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function LienPanier({ nb }: { nb: number }) {
  return (
    <Link href="/panier" aria-label="Panier" className="relative flex items-center gap-1.5 rounded-md px-2 py-2 hover:bg-white/10">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
      <span className="hidden text-sm font-semibold lg:inline">Panier</span>
      <BadgePanier
        initial={nb}
        className="absolute left-4 top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-nile-950"
      />
    </Link>
  );
}
