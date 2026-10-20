import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f8f7f3] px-4 py-5 sm:px-6 sm:py-8">
    <div className="mx-auto mb-7 flex max-w-6xl items-center justify-between">
      <Link href="/" aria-label="Retour à l’accueil NILE" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-900 font-titre text-xl font-bold text-amber-400">N</span>
        <span><span className="block font-titre text-lg font-bold tracking-tight text-blue-950">NILE</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Commerce local</span></span>
      </Link>
      <Link href="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-900">Retour à la boutique ↗</Link>
    </div>
    <div className="mx-auto max-w-6xl">{children}</div>
    <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-slate-400">NILE · Une expérience pensée pour le commerce au Cameroun.</p>
  </div>;
}
