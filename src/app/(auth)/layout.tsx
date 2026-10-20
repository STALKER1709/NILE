import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f7f8fc] px-[14px] py-5 sm:px-[22px] sm:py-8">
    <div className="mx-auto mb-7 flex max-w-[1240px] flex-wrap items-center justify-between gap-3">
      <Link href="/" aria-label="Retour à l’accueil NILE" className="flex items-center gap-3">
        <span className="nile-brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-blue-900 font-titre text-xl font-extrabold text-white">N</span>
        <span><span className="block font-titre text-lg font-extrabold tracking-tight text-blue-900">NILE</span><span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-500">Le marché sans frontières</span></span>
      </Link>
      <Link href="/" className="shrink-0 rounded-[10px] px-3 py-2 text-xs font-extrabold text-slate-600 transition-colors hover:bg-white hover:text-blue-900 sm:text-sm">Retour à la boutique ↗</Link>
    </div>
    <div className="mx-auto max-w-[1240px]">{children}</div>
    <p className="mx-auto mt-8 max-w-[1240px] text-center text-[11px] text-slate-400">NILE · Une expérience pensée pour le commerce au Cameroun.</p>
  </div>;
}
