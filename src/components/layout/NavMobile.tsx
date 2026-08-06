"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BadgePanier } from "@/components/panier/BadgePanier";
import { BadgeFavoris } from "@/components/produit/BadgeFavoris";

export function NavMobile({
  connecte,
  nbArticles,
  nbFavoris,
}: {
  connecte: boolean;
  nbArticles: number;
  nbFavoris: number;
}) {
  return (
    // Cinq entrées pour un acheteur connecté, quatre pour un visiteur : sans
    // compte il n'y a pas de liste de souhaits, et une entrée qui renverrait
    // vers la connexion occuperait un cinquième de la barre pour rien.
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-contour-carte bg-white/90 backdrop-blur-md shadow-flottant sm:hidden ${
        connecte ? "grid-cols-5" : "grid-cols-4"
      }`}
    >
      <Item href="/" libelle="Accueil">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 21V12h6v9" /></svg>
      </Item>
      <Item href="/catalogue" libelle="Catalogue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
      </Item>
      {connecte && (
        <Item href="/favoris" libelle="Favoris" badgeFavoris={nbFavoris}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z" /></svg>
        </Item>
      )}
      <Item href="/panier" libelle="Panier" badge={nbArticles}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
      </Item>
      <Item href={connecte ? "/compte" : "/connexion"} libelle="Compte">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      </Item>
    </nav>
  );
}

function Item({
  href,
  libelle,
  children,
  badge,
  badgeFavoris,
}: {
  href: string;
  libelle: string;
  children: ReactNode;
  /** Ne passer que sur l'item Panier : la pastille s'abonne au total du panier. */
  badge?: number;
  /** Idem pour l'item Favoris, qui suit son propre compteur. */
  badgeFavoris?: number;
}) {
  const chemin = usePathname();
  const actif = chemin === href || (href !== "/" && chemin.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
        actif
          ? "font-bold text-nile-700"
          : "font-medium text-slate-500 hover:text-nile-600"
      }`}
    >
      {children}
      <span>{libelle}</span>
      {actif && (
        <span className="absolute bottom-0.5 h-1 w-5 rounded-full bg-nile-600" />
      )}
      {badge !== undefined && (
        <BadgePanier
          initial={badge}
          className="absolute right-1/2 top-1 translate-x-3 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-nile-950 shadow-xs"
        />
      )}
      {badgeFavoris !== undefined && (
        <BadgeFavoris
          initial={badgeFavoris}
          className="absolute right-1/2 top-1 translate-x-3 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-nile-950 shadow-xs"
        />
      )}
    </Link>
  );
}
