"use client";

import Link from "next/link";
import type { Role } from "@prisma/client";
import { deconnexionAction } from "@/app/(auth)/actions";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { NavPrincipale } from "@/components/layout/NavPrincipale";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BadgeFavoris } from "@/components/produit/BadgeFavoris";
import type { LienCategorie } from "@/components/layout/NavPrincipale";

export function Entete({ utilisateur, nbArticles, nbFavoris, categories }: {
  utilisateur: { nom: string; role: Role } | null;
  nbArticles: number;
  nbFavoris: number;
  categories: LienCategorie[];
}) {
  return <header className="sticky top-0 z-40">
    <div className="hidden bg-blue-950 text-blue-50 sm:block">
      <div className="mx-auto flex min-h-9 max-w-[1284px] items-center justify-between gap-3 px-[14px] text-[10px] font-semibold tracking-wide sm:px-[22px] sm:text-xs">
        <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Le commerce local, connecté</span>
        <span className="hidden sm:block text-blue-100/75">Une marketplace pensée pour le Cameroun</span>
        <Link href="/aide" className="shrink-0 text-amber-300 transition-colors hover:text-white">Besoin d’aide ?</Link>
      </div>
    </div>
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto grid w-full max-w-[1284px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-[14px] py-2.5 sm:gap-5 sm:px-[22px] sm:py-3 lg:min-h-[88px] lg:py-4">
        <Link href="/" className="col-start-1 row-start-1 flex shrink-0 items-center gap-2.5" aria-label="NILE, accueil">
          <span className="nile-brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-blue-900 font-titre text-[25px] font-extrabold text-white sm:h-[43px] sm:w-[43px]">N</span>
          <span><span className="block font-titre text-[21px] font-extrabold leading-none tracking-[-.05em] text-blue-900 sm:text-[25px]">NILE</span><span className="mt-1 hidden text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-400 sm:block">Le marché sans frontières</span></span>
        </Link>
        <div className="col-span-3 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1"><BarreRecherche /></div>
        <nav aria-label="Actions du compte" className="col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {utilisateur ? <>
            <Link href="/compte" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-50 md:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-900">{utilisateur.nom.trim().charAt(0).toUpperCase()}</span>
              <span><span className="block text-[10px] text-slate-500">Bonjour</span><span className="block max-w-24 truncate text-xs font-extrabold text-slate-900">{utilisateur.nom.split(" ")[0]}</span></span>
            </Link>
            <Link href="/favoris" aria-label={"Favoris, " + nbFavoris + " articles"} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900"><Heart /><BadgeFavoris initial={nbFavoris} className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-extrabold text-blue-950" /></Link>
            <Link href="/panier" aria-label={"Panier, " + nbArticles + " articles"} className="relative grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-900 transition-colors hover:bg-blue-100"><Cart /><BadgePanier initial={nbArticles} className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-extrabold text-blue-950" /></Link>
            <form action={deconnexionAction} className="hidden lg:block"><button type="submit" className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-900">Déconnexion</button></form>
          </> : <>
            <Link href="/connexion" className="hidden rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-stone-100 sm:block">Connexion</Link>
            <Link href="/inscription" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-900 px-3.5 py-2 text-xs font-extrabold text-white transition-colors hover:bg-blue-950 sm:px-4 sm:text-sm"><span className="sm:hidden">S’inscrire</span><span className="hidden sm:inline">Créer un compte</span></Link>
            <Link href="/panier" aria-label={"Panier, " + nbArticles + " articles"} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-blue-50"><Cart /><BadgePanier initial={nbArticles} className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-extrabold text-blue-950" /></Link>
          </>}
        </nav>
      </div>
    </div>
    <div className="border-b border-stone-200 bg-white"><NavPrincipale categories={categories} /></div>
  </header>;
}

function Heart() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>; }
function Cart() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></svg>; }
