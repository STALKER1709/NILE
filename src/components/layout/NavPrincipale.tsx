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
    (actif ? "border-[#F59E0B] text-[#0B192C]" : "border-transparent text-[#44474c] hover:border-[#c5c6cd] hover:text-[#0B192C]");
  const surCatalogue = chemin.startsWith("/catalogue");
  const surBoutiques = chemin.startsWith("/boutique") || chemin === "/boutiques";
  const surReels = chemin.startsWith("/reels");
  return <div className="border-t border-[#f2f4f6] bg-white">
    <div ref={conteneur} className="relative mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-14">
      <nav aria-label="Navigation principale" className="no-scrollbar flex h-[50px] items-center gap-3 overflow-x-auto sm:gap-5">
        <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-haspopup="true"
          className="my-1 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-[#0B192C] px-4 text-xs font-bold text-white transition-colors hover:bg-[#172b45] sm:text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          Tous les rayons
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={"transition-transform " + (ouvert ? "rotate-180" : "")} aria-hidden="true"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <Link href="/" aria-current={chemin === "/" ? "page" : undefined} className={classeLien(chemin === "/")}>Accueil</Link>
        <Link href="/catalogue" aria-current={surCatalogue ? "page" : undefined} className={classeLien(surCatalogue)}>Catalogue</Link>
        <Link href="/boutiques" aria-current={surBoutiques ? "page" : undefined} className={classeLien(surBoutiques)}>Boutiques</Link>
        <Link href="/reels" aria-current={surReels ? "page" : undefined} className={classeLien(surReels)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3zM7 4l3 4m4-4 3 4" /></svg>
          Réels
        </Link>
        <Link href="/promotions" aria-current={chemin === "/promotions" ? "page" : undefined} className={classeLien(chemin === "/promotions")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="text-[#D97706]" aria-hidden="true"><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /></svg>
          Promotions
        </Link>
        <Link href="/catalogue?tri=recent" className={classeLien(false)}>Nouveautés</Link>
        <Link href="/aide" aria-current={chemin === "/aide" ? "page" : undefined} className={classeLien(chemin === "/aide")}>Aide</Link>
        <Link href="/inscription?role=VENDEUR" className="ml-auto inline-flex h-12 shrink-0 items-center gap-1.5 border-b-[3px] border-transparent px-2.5 text-xs font-extrabold text-[#0B192C] transition-colors hover:border-[#F59E0B] sm:px-3 sm:text-sm"><span className="text-[#D97706]">＋</span> Vendre sur NILE</Link>
      </nav>
      {ouvert && <div className="absolute inset-x-[14px] top-full z-50 mt-0.5 overflow-hidden rounded-b-[14px] border border-[#E2E8F0] bg-white shadow-[0_20px_30px_-10px_rgba(11,25,44,0.12)] sm:inset-x-[22px]">
        <div className="grid grid-cols-2 gap-0.5 p-2 sm:grid-cols-4">
          <Link href="/catalogue" className="col-span-2 rounded-lg px-3 py-2.5 text-sm font-extrabold text-[#0B192C] transition-colors hover:bg-[#f8fafc] sm:col-span-4">Toutes les catégories →</Link>
          {categories.map((c) => <Link key={c.slug} href={"/catalogue?categorie=" + c.slug} className="truncate rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900">{c.nom}</Link>)}
        </div>
      </div>}
    </div>
  </div>;
}
