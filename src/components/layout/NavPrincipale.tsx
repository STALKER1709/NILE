"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface LienCategorie { nom: string; slug: string; }

export function NavPrincipale({ categories }: { categories: LienCategorie[] }) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const clic = (e: MouseEvent) => { if (conteneur.current && !conteneur.current.contains(e.target as Node)) setOuvert(false); };
    const touche = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => { document.removeEventListener("mousedown", clic); document.removeEventListener("keydown", touche); };
  }, []);
  useEffect(() => { setOuvert(false); }, [chemin]);
  const classeLien = (actif: boolean) =>
    "relative flex h-12 shrink-0 items-center gap-1.5 border-b-[3px] px-2.5 text-xs font-extrabold transition-colors sm:px-3 sm:text-sm " +
    (actif ? "border-amber-400 text-blue-900" : "border-transparent text-slate-600 hover:border-stone-300 hover:text-blue-900");
  const surCatalogue = chemin.startsWith("/catalogue");
  const surBoutiques = chemin.startsWith("/boutique") || chemin === "/boutiques";
  return <div className="bg-white">
    <div ref={conteneur} className="relative mx-auto max-w-[1284px] px-[14px] sm:px-[22px]">
      <nav aria-label="Navigation principale" className="no-scrollbar flex h-12 items-center gap-3 overflow-x-auto sm:gap-5">
        <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-haspopup="true"
          className="my-1 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[9px] bg-blue-900 px-3 text-xs font-extrabold text-white transition-colors hover:bg-blue-950 sm:text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          Tous les rayons
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={"transition-transform " + (ouvert ? "rotate-180" : "")} aria-hidden="true"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <Link href="/" aria-current={chemin === "/" ? "page" : undefined} className={classeLien(chemin === "/")}>Accueil</Link>
        <Link href="/catalogue" aria-current={surCatalogue ? "page" : undefined} className={classeLien(surCatalogue)}>Catalogue</Link>
        <Link href="/boutiques" aria-current={surBoutiques ? "page" : undefined} className={classeLien(surBoutiques)}>Boutiques</Link>
        <Link href="/promotions" aria-current={chemin === "/promotions" ? "page" : undefined} className={classeLien(chemin === "/promotions")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="text-amber-500" aria-hidden="true"><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /></svg>
          Promotions
        </Link>
        <Link href="/catalogue?tri=recent" className={classeLien(false)}>Nouveautés</Link>
        <Link href="/aide" aria-current={chemin === "/aide" ? "page" : undefined} className={classeLien(chemin === "/aide")}>Aide</Link>
        <Link href="/inscription?role=VENDEUR" className="ml-auto inline-flex h-12 shrink-0 items-center gap-1.5 border-b-[3px] border-transparent px-2.5 text-xs font-extrabold text-blue-900 transition-colors hover:border-amber-400 sm:px-3 sm:text-sm"><span className="text-amber-600">＋</span> Vendre sur NILE</Link>
      </nav>
      {ouvert && <div className="absolute inset-x-[14px] top-full z-50 mt-0.5 overflow-hidden rounded-b-[14px] border border-stone-200 bg-white shadow-flottant sm:inset-x-[22px]">
        <div className="grid grid-cols-2 gap-0.5 p-2 sm:grid-cols-4">
          <Link href="/catalogue" className="col-span-2 rounded-lg px-3 py-2.5 text-sm font-extrabold text-blue-900 transition-colors hover:bg-blue-50 sm:col-span-4">Toutes les catégories →</Link>
          {categories.map((c) => <Link key={c.slug} href={"/catalogue?categorie=" + c.slug} className="truncate rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900">{c.nom}</Link>)}
        </div>
      </div>}
    </div>
  </div>;
}
