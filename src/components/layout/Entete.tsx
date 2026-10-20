import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BadgeFavoris } from "@/components/produit/BadgeFavoris";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { NavPrincipale } from "@/components/layout/NavPrincipale";

export type { LienCategorie } from "@/components/layout/NavPrincipale";
import type { LienCategorie } from "@/components/layout/NavPrincipale";

export function Entete({ utilisateur, nbArticles, nbFavoris, categories }: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
  nbFavoris: number;
  categories: LienCategorie[];
}) {
  return (
    <header className="relative z-40 text-white sm:sticky sm:top-0">
      <div className="bg-[#0C1734]">
        <div className="mx-auto flex max-w-conteneur items-center justify-between gap-3 px-4 py-2 text-[11px] font-medium text-white/65 sm:px-10">
          <p className="hidden sm:block">Le commerce d’ici, à portée de main.</p>
          <div className="ml-auto flex items-center gap-2.5 sm:ml-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" aria-hidden="true" />
            <span>Prix affichés en FCFA (XAF)</span>
          </div>
          <Link href="/aide" className="hidden transition hover:text-white sm:inline">Besoin d’aide ?</Link>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white text-slate-900 shadow-[0_4px_18px_rgba(12,23,52,.04)]">
        <div className="mx-auto flex max-w-conteneur items-center gap-3 px-4 py-3 sm:gap-6 sm:px-10 sm:py-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="NILE, accueil">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F59E0B] text-xl font-black tracking-tight text-[#14265A] transition group-hover:rotate-[-3deg]">N</span>
            <span className="text-lg font-extrabold tracking-[.15em] text-[#14265A]">NILE</span>
          </Link>
          <BarreRecherche className="hidden flex-1 sm:flex" />
          <nav aria-label="Actions du compte" className="ml-auto flex items-center gap-1 sm:gap-2">
            {utilisateur ? (
              <>
                <Link href="/compte" className="hidden rounded-lg px-3 py-2 text-left transition hover:bg-[#F1F5FD] sm:block">
                  <span className="block text-[10px] text-slate-500">Bonjour, {utilisateur.nom.split(" ")[0]}</span>
                  <span className="block text-xs font-bold text-[#14265A]">Compte &amp; commandes</span>
                </Link>
                <LienFavoris nb={nbFavoris} />
                <LienPanier nb={nbArticles} />
                <form action={deconnexionAction} className="hidden sm:block">
                  <button type="submit" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Déconnexion</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="hidden rounded-lg px-3 py-2 text-left transition hover:bg-[#F1F5FD] sm:block">
                  <span className="block text-[10px] text-slate-500">Bienvenue sur NILE</span>
                  <span className="block text-xs font-bold text-[#14265A]">Se connecter</span>
                </Link>
                <LienPanier nb={nbArticles} />
                <Link href="/inscription" className="hidden min-h-10 items-center justify-center rounded-lg bg-[#1E3A8A] px-4 text-xs font-bold text-white transition hover:bg-[#14265A] sm:inline-flex">Créer un compte</Link>
              </>
            )}
          </nav>
        </div>
        <div className="px-4 pb-3 sm:hidden">
          <BarreRecherche />
        </div>
      </div>
      <NavPrincipale categories={categories} />
    </header>
  );
}

function LienFavoris({ nb }: { nb: number }) {
  return (
    <Link href="/favoris" aria-label="Mes favoris" className="relative flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[#14265A] transition hover:bg-[#F1F5FD] sm:px-3">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z" /></svg>
      <span className="hidden text-xs font-semibold lg:inline">Favoris</span>
      <BadgeFavoris initial={nb} className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-[#14265A]" />
    </Link>
  );
}

function LienPanier({ nb }: { nb: number }) {
  return (
    <Link href="/panier" aria-label="Panier" className="relative flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[#14265A] transition hover:bg-[#F1F5FD] sm:px-3">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
      <span className="hidden text-xs font-semibold lg:inline">Panier</span>
      <BadgePanier initial={nb} className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-[#14265A]" />
    </Link>
  );
}
