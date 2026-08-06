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
  /** Articles mis de côté. Non affiché aux visiteurs : sans compte, il n'y a
      pas de liste de souhaits. */
  nbFavoris: number;
  categories: LienCategorie[];
}) {
  return (
    <header className="relative z-40 text-white shadow-carte-hover sm:sticky sm:top-0">
      {/* Barre principale (sombre, type marketplace) */}
      <div className="bg-nile-900 border-b border-nile-800/50">
        <div className="mx-auto flex max-w-conteneur items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded bg-gradient-to-br from-accent to-accent-dark font-bold text-nile-950 shadow-sm">
              N
            </span>
            <span className="hidden font-bold tracking-wide sm:inline text-white">NILE</span>
          </Link>

          <BarreRecherche className="hidden flex-1 sm:flex" />

          <nav className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {utilisateur ? (
              <>
                <Link href="/compte" className="hidden rounded px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:bg-white/10 sm:block">
                  <span className="block text-[10px] text-white/60">Bonjour, {utilisateur.nom.split(" ")[0]}</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienFavoris nb={nbFavoris} />
                <LienPanier nb={nbArticles} />
                <form action={deconnexionAction} className="hidden sm:block">
                  <button type="submit" className="rounded px-2.5 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="hidden rounded px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:bg-white/10 sm:block">
                  <span className="block text-[10px] text-white/60">Bonjour, identifiez-vous</span>
                  <span className="block font-semibold">Compte &amp; commandes</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <Link
                  href="/inscription"
                  className="hidden rounded bg-gradient-to-r from-accent to-accent-dark px-3.5 py-2 text-xs font-bold text-nile-950 shadow-sm transition-all hover:brightness-105 active:scale-95 sm:inline-block"
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

/**
 * Accès à la liste de souhaits, réservé aux personnes connectées : sans
 * compte, il n'y a nulle part où l'enregistrer.
 */
function LienFavoris({ nb }: { nb: number }) {
  return (
    <Link
      href="/favoris"
      aria-label="Mes favoris"
      className="relative flex items-center gap-1.5 rounded px-2 py-2 hover:bg-white/10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z" />
      </svg>
      <span className="hidden text-sm font-semibold lg:inline">Favoris</span>
      <BadgeFavoris
        initial={nb}
        className="absolute left-4 top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-nile-950"
      />
    </Link>
  );
}

function LienPanier({ nb }: { nb: number }) {
  return (
    <Link href="/panier" aria-label="Panier" className="relative flex items-center gap-1.5 rounded px-2 py-2 hover:bg-white/10">
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
