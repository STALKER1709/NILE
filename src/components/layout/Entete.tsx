"use client";

import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BadgeFavoris } from "@/components/produit/BadgeFavoris";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { NavPrincipale } from "@/components/layout/NavPrincipale";
import type { LienCategorie } from "@/components/layout/NavPrincipale";

export function Entete({ utilisateur, nbArticles, nbFavoris, categories }: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
  nbFavoris: number;
  categories: LienCategorie[];
}) {
  return <header className="sticky top-0 z-40">
    <div className="bg-blue-950 text-blue-50">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2 text-[10px] font-semibold tracking-wide sm:px-6 sm:text-xs lg:px-10">
        <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Le commerce local, connecté</span>
        <span className="hidden sm:block text-blue-100/75">Une marketplace pensée pour le Cameroun</span>
        <Link href="/aide" className="shrink-0 text-amber-300 transition-colors hover:text-white">Besoin d’aide ?</Link>
      </div>
    </div>
    <div className="border-b border-stone-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 lg:px-10 lg:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="NILE, accueil">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-900 font-titre text-xl font-bold text-amber-400 shadow-sm sm:h-11 sm:w-11">N</span>
          <span><span className="block font-titre text-[21px] font-bold leading-none tracking-[-.05em] text-blue-950 sm:text-2xl">NILE</span><span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 sm:block">Marketplace</span></span>
        </Link>
        <div className="hidden min-w-0 max-w-2xl flex-1 sm:block"><BarreRecherche /></div>
        <nav aria-label="Actions du compte" className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {utilisateur ? <>
            <Link href="/compte" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-50 md:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">{utilisateur.nom.trim().charAt(0).toUpperCase()}</span>
              <span><span className="block text-[10px] text-slate-500">Bonjour</span><span className="block max-w-24 truncate text-xs font-bold text-slate-900">{utilisateur.nom.split(" ")[0]}</span></span>
            </Link>
            <Link href="/favoris" aria-label={`Favoris, ${nbFavoris} articles`} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900"><Heart />{nbFavoris > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-blue-950">{nbFavoris > 99 ? "99+" : nbFavoris}</span>}</Link>
            <Link href="/panier" aria-label={`Panier, ${nbArticles} articles`} className="relative grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-900 transition-colors hover:bg-blue-100"><Cart />{nbArticles > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-blue-950">{nbArticles > 99 ? "99+" : nbArticles}</span>}</Link>
            <form action={deconnexionAction} className="hidden lg:block"><button type="submit" className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-900">Déconnexion</button></form>
          </> : <>
            <Link href="/connexion" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-100 sm:block">Connexion</Link>
            <Link href="/inscription" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-950 sm:px-4 sm:text-sm">Créer un compte</Link>
            <Link href="/panier" aria-label={`Panier, ${nbArticles} articles`} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-blue-50"><Cart />{nbArticles > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-blue-950">{nbArticles > 99 ? "99+" : nbArticles}</span>}</Link>
          </>}
        </nav>
      </div>
      <div className="border-t border-stone-100 px-4 py-2.5 sm:hidden"><BarreRecherche /></div>
    </div>
    <div className="border-b border-blue-950 bg-blue-900 text-white"><NavPrincipale categories={categories} /></div>
  </header>;
}

function Heart() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>; }
function Cart() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></svg>; }
