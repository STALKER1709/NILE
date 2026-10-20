import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BadgeFavoris } from "@/components/produit/BadgeFavoris";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { NavPrincipale } from "@/components/layout/NavPrincipale";

export type { LienCategorie } from "@/components/layout/NavPrincipale";
import type { LienCategorie } from "@/components/layout/NavPrincipale";

export function Entete({
  utilisateur,
  nbArticles,
  nbFavoris,
  categories,
}: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
  nbFavoris: number;
  categories: LienCategorie[];
}) {
  return (
    <header className="relative z-40 text-white sm:sticky sm:top-0">
      {/* Barre principale supérieure */}
      <div className="border-b border-nile-800/40 bg-nile-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-conteneur items-center gap-3 px-3 py-2.5 sm:gap-6 sm:px-4">
          {/* Logo Marque NILE */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 transition-transform active:scale-95"
            aria-label="Accueil NILE Marketplace"
          >
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-accent to-accent-dark font-titre text-lg font-bold text-nile-950 shadow-[0_2px_10px_rgba(254,166,25,0.25)]">
              N
              <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <div className="flex flex-col">
              <span className="font-titre text-lg font-bold tracking-tight text-white sm:text-xl">
                NILE
              </span>
              <span className="hidden text-[9px] font-medium uppercase tracking-widest text-accent-fixe/80 sm:block -mt-1">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Recherche centrale desktop */}
          <div className="hidden flex-1 sm:block max-w-2xl">
            <BarreRecherche />
          </div>

          {/* Actions utilisateur & panier */}
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            {utilisateur ? (
              <>
                <Link
                  href="/compte"
                  className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/10 sm:flex"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-nile-800 text-white">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <div className="leading-tight">
                    <span className="block text-[10px] text-slate-300">Mon compte</span>
                    <span className="block font-semibold text-white truncate max-w-[100px]">
                      {utilisateur.nom.split(" ")[0]}
                    </span>
                  </div>
                </Link>

                <LienFavoris nb={nbFavoris} />
                <LienPanier nb={nbArticles} />

                <form action={deconnexionAction} className="hidden sm:block">
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="hidden rounded-lg px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 sm:block"
                >
                  <span className="block text-[10px] text-slate-300">Bienvenue</span>
                  <span className="block font-semibold text-white">Se connecter</span>
                </Link>

                <LienPanier nb={nbArticles} />

                <Link
                  href="/inscription"
                  className="hidden rounded-lg bg-gradient-to-r from-accent to-accent-dark px-4 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all hover:brightness-105 active:scale-95 sm:inline-block"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Barre de recherche sur mobile */}
        <div className="px-3 pb-2.5 sm:hidden">
          <BarreRecherche />
        </div>
      </div>

      {/* Barre de navigation rayons & raccourcis */}
      <NavPrincipale categories={categories} />
    </header>
  );
}

function LienFavoris({ nb }: { nb: number }) {
  return (
    <Link
      href="/favoris"
      aria-label="Mes favoris"
      className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/10"
    >
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        >
          <path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z" />
        </svg>
        <BadgeFavoris
          initial={nb}
          className="absolute -right-2 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-slate-950 shadow-xs"
        />
      </div>
      <span className="hidden text-xs font-medium lg:inline">Favoris</span>
    </Link>
  );
}

function LienPanier({ nb }: { nb: number }) {
  return (
    <Link
      href="/panier"
      aria-label="Voir mon panier"
      className="relative flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
    >
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
        <BadgePanier
          initial={nb}
          className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-slate-950 shadow-xs"
        />
      </div>
      <span className="hidden text-xs font-semibold sm:inline">Panier</span>
    </Link>
  );
}
