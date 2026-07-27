import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { NavPrincipale } from "@/components/layout/NavPrincipale";

export type { LienCategorie } from "@/components/layout/NavPrincipale";
import type { LienCategorie } from "@/components/layout/NavPrincipale";

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
      <div className="bg-nile-900 border-b border-nile-800/50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 font-extrabold text-nile-950 shadow-sm">
              N
            </span>
            <span className="hidden font-extrabold tracking-wide sm:inline text-white">NILE</span>
          </Link>

          <BarreRecherche className="hidden flex-1 sm:flex" />

          <nav className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {utilisateur ? (
              <>
                <Link href="/compte" className="hidden rounded-lg px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:bg-white/10 sm:block">
                  <span className="block text-[10px] text-white/60">Bonjour, {utilisateur.nom.split(" ")[0]}</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <form action={deconnexionAction} className="hidden sm:block">
                  <button type="submit" className="rounded-lg px-2.5 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="hidden rounded-lg px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:bg-white/10 sm:block">
                  <span className="block text-[10px] text-white/60">Bonjour, identifiez-vous</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <Link
                  href="/inscription"
                  className="hidden rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2 text-xs font-bold text-nile-950 shadow-sm transition-all hover:brightness-105 active:scale-95 sm:inline-block"
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

      {/* Barre de navigation principale (rayons + destinations clés) */}
      <NavPrincipale categories={categories} />
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
