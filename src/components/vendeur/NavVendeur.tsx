"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const LIENS: { href: string; libelle: string; icone: ReactNode; exact?: boolean }[] = [
  {
    href: "/vendeur",
    libelle: "Tableau de bord",
    exact: true,
    icone: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
  },
  {
    href: "/vendeur/produits",
    libelle: "Mes produits",
    icone: (
      <>
        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" strokeLinejoin="round" />
        <path d="M3 7.5 12 12l9-4.5M12 12v9" />
      </>
    ),
  },
  {
    href: "/vendeur/commandes",
    libelle: "Commandes",
    icone: (
      <>
        <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
        <path d="M8 9a4 4 0 0 1 8 0" />
      </>
    ),
  },
  {
    href: "/vendeur/finances",
    libelle: "Finances",
    icone: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.75" />
        <path d="M6 10v4M18 10v4" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/vendeur/promotions",
    libelle: "Promotions",
    icone: (
      <>
        <path d="M4 4h7l9 9-7 7-9-9z" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </>
    ),
  },
  {
    href: "/vendeur/reels",
    libelle: "Reels",
    icone: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m10 9.5 5 2.5-5 2.5z" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/vendeur/annonces",
    libelle: "Annonces NILE",
    icone: (
      <>
        <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" strokeLinejoin="round" />
        <path d="M18 9a4 4 0 0 1 0 6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/compte/profil",
    libelle: "Ma boutique",
    icone: (
      <>
        <path d="M4 9h16l-1 11H5L4 9z" strokeLinejoin="round" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
  },
];

/**
 * Navigation latérale de l'espace vendeur : colonne fixe sur grand écran,
 * bande défilante en haut sur mobile (la data est chère, on évite un menu
 * qui masquerait le contenu).
 */
export function NavVendeur({
  nomBoutique,
  aPreparer,
}: {
  nomBoutique: string;
  aPreparer: number;
}) {
  const chemin = usePathname();
  const estActif = (href: string, exact?: boolean) =>
    exact ? chemin === href : chemin === href || chemin.startsWith(`${href}/`);

  return (
    <aside className="w-full min-w-0 self-start rounded-2xl border border-stone-200 bg-white p-2 lg:sticky lg:top-24 lg:w-[250px] lg:shrink-0">
      {/* En-tête boutique (grand écran) */}
      <div className="mb-5 hidden items-center gap-3 lg:flex">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-lg font-bold text-blue-900">
          {nomBoutique.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-900">
            {nomBoutique}
          </span>
          <span className="block text-xs text-slate-500">Espace vendeur</span>
        </span>
      </div>

      <nav
        aria-label="Navigation vendeur"
        className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      >
        {LIENS.map((l) => {
          const actif = estActif(l.href, l.exact);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                actif
                  ? "bg-blue-900 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
                {l.icone}
              </svg>
              {l.libelle}
              {l.href === "/vendeur/commandes" && aPreparer > 0 && (
                <span
                  className={`ml-auto grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-lg px-1 text-[11px] font-bold ${
                    actif ? "bg-white text-nile-800" : "bg-accent text-white"
                  }`}
                >
                  {aPreparer}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t border-contour-carte pt-4">
        <Link
          href="/vendeur/produits/nouveau"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-950"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Ajouter un produit
        </Link>
        <Link
          href="/aide"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-stone-50 hover:text-blue-900"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.4V14" strokeLinecap="round" />
            <path d="M12 17.5v.01" strokeLinecap="round" />
          </svg>
          Aide
        </Link>
      </div>
    </aside>
  );
}
