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
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)] sm:hidden ${
        connecte ? "grid-cols-5" : "grid-cols-4"
      }`}
    >
      <Item href="/" libelle="Accueil">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </Item>

      <Item href="/catalogue" libelle="Catalogue">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </Item>

      {connecte && (
        <Item href="/favoris" libelle="Favoris" badgeFavoris={nbFavoris}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z" />
          </svg>
        </Item>
      )}

      <Item href="/reels" libelle="Reels">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </Item>

      <Item href={connecte ? "/compte" : "/connexion"} libelle="Compte">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
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
  badge?: number;
  badgeFavoris?: number;
}) {
  const chemin = usePathname();
  const actif = chemin === href || (href !== "/" && chemin.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[11px] transition-colors ${
        actif ? "font-bold text-nile-800" : "font-medium text-slate-500 hover:text-nile-700"
      }`}
    >
      <div className="relative">
        {children}
        {badge !== undefined && (
          <BadgePanier
            initial={badge}
            className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-slate-950 shadow-xs"
          />
        )}
        {badgeFavoris !== undefined && (
          <BadgeFavoris
            initial={badgeFavoris}
            className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-slate-950 shadow-xs"
          />
        )}
      </div>

      <span className="leading-none">{libelle}</span>

      {actif && (
        <span className="absolute bottom-1 h-1 w-6 rounded-full bg-nile-700 transition-all" />
      )}
    </Link>
  );
}
