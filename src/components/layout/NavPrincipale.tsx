"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface LienCategorie {
  nom: string;
  slug: string;
}

/**
 * Barre de navigation principale (sous l'en-tête). Liens de premier niveau +
 * menu déroulant « Tous les rayons » (clic, tactile et clavier). Défilable
 * horizontalement sur mobile pour rester légère.
 */
export function NavPrincipale({ categories }: { categories: LienCategorie[] }) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  // Ferme le déroulant au clic extérieur, à la touche Échap et au changement de page.
  useEffect(() => {
    const clic = (e: MouseEvent) => {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    const touche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, []);

  useEffect(() => {
    setOuvert(false);
  }, [chemin]);

  const surCatalogue = chemin.startsWith("/catalogue");
  const classeLien = (actif: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
      actif
        ? "bg-white/10 font-semibold text-white"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="bg-nile-800 shadow-inner">
      <div ref={conteneur} className="relative mx-auto max-w-6xl px-2 sm:px-4">
        <nav
          aria-label="Navigation principale"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1.5 text-xs font-medium sm:text-sm"
        >
          <Link href="/" className={classeLien(chemin === "/")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 21V12h6v9" />
            </svg>
            Accueil
          </Link>

          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            aria-haspopup="true"
            className={`${classeLien(surCatalogue)} whitespace-nowrap`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Tous les rayons
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${ouvert ? "rotate-180" : ""}`} aria-hidden="true">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <Link href="/boutiques" className={classeLien(chemin.startsWith("/boutique"))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" />
              <path d="M8 9a4 4 0 0 1 8 0" />
            </svg>
            Boutiques
          </Link>

          <Link href="/catalogue?tri=recent" className={`${classeLien(false)} whitespace-nowrap`}>
            Nouveautés
          </Link>
          <Link href="/catalogue?tri=populaire" className={`${classeLien(false)} whitespace-nowrap`}>
            Les mieux notés
          </Link>
          <Link href="/contact" className={classeLien(chemin === "/contact")}>
            Aide
          </Link>

          {/* Zone de livraison (repère de confiance, écrans larges) */}
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 pl-3 text-xs text-white/70 lg:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-400" aria-hidden="true">
              <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Livrer au <span className="font-bold text-white">Cameroun 🇨🇲</span>
          </span>
        </nav>

        {ouvert && (
          <div className="absolute inset-x-0 top-full z-50 mt-0.5 overflow-hidden rounded-b-xl border border-slate-200/80 bg-white shadow-flottant">
            <div className="grid grid-cols-2 gap-0.5 p-2 sm:grid-cols-4">
              <Link
                href="/catalogue"
                className="col-span-2 rounded-md px-3 py-2 text-sm font-bold text-nile-700 transition-colors hover:bg-nile-50 sm:col-span-4"
              >
                Toutes les catégories →
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/catalogue?categorie=${c.slug}`}
                  className="truncate rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-nile-700"
                >
                  {c.nom}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
