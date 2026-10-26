"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/compte", label: "Vue d'ensemble" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/favoris", label: "Mes favoris" },
  { href: "/compte/profil", label: "Profil et coordonnées" },
  { href: "/panier", label: "Mon panier" },
];

export function CoqueCompte({ children, nom }: { children: ReactNode; nom: string }) {
  const pathname = usePathname();
  const flow = pathname.startsWith("/panier") || pathname.startsWith("/commander") || pathname.startsWith("/paiement");
  if (flow) return <div className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex min-h-[68px] max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:h-[68px] sm:flex-nowrap sm:px-6 sm:py-0">
      <Link href="/" className="flex items-center gap-3"><span className="nile-brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-blue-900 font-titre text-xl font-extrabold text-white">N</span><span className="font-titre text-xl font-bold text-blue-950">NILE <span className="text-sm font-medium text-slate-400">/ Commande</span></span></Link>
      <Link href="/catalogue" className="shrink-0 text-xs font-semibold text-slate-600 hover:text-blue-900 sm:text-sm">Continuer mes achats ↗</Link>
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-6 pb-12 sm:px-6 sm:py-10">{children}</main>
  </div>;

  return <div className="min-h-[70vh] w-full min-w-0 overflow-x-clip bg-[#f7f8fc]">
    <div className="mx-auto w-full min-w-0 max-w-[1360px] px-4 py-6 sm:px-6 sm:py-9 lg:px-10">
      <div className="mb-7 flex min-w-0 flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0"><p className="nile-eyebrow text-blue-700">Votre espace NILE</p><h1 className="mt-2 break-words font-titre text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Bonjour, {nom.split(" ")[0]}</h1><p className="mt-1 max-w-prose text-sm leading-6 text-slate-500 sm:text-base">Suivez vos achats, vos préférences et vos informations.</p></div>
        <Link href="/catalogue" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:border-blue-300 sm:w-auto sm:shrink-0">Continuer mes achats ↗</Link>
      </div>
      <div className="grid w-full min-w-0 grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-9">
        <aside className="w-full min-w-0 self-start rounded-2xl border border-stone-200 bg-white p-2 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b border-stone-100 px-3 py-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 font-titre text-lg font-bold text-blue-900">{nom.trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{nom}</p><p className="text-xs text-slate-500">Espace client</p></div></div>
          <nav aria-label="Navigation du compte" className="grid min-w-0 grid-cols-2 gap-1 py-2 sm:grid-cols-3 lg:flex lg:flex-col">
            {LINKS.map((link) => { const active = pathname === link.href || (link.href !== "/compte" && pathname.startsWith(link.href + "/")); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-0 items-center break-words rounded-xl px-2 py-2.5 text-xs font-medium leading-snug transition-colors sm:px-3 sm:text-sm ${active ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-stone-50 hover:text-slate-950"}`}>{link.label}</Link>; })}
          </nav>
        </aside>
        <section className="w-full min-w-0">{children}</section>
      </div>
    </div>
  </div>;
}
