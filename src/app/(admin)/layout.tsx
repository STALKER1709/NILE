import type { ReactNode } from "react";
import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { deconnexionAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await exigerRole("ADMIN");
  return <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] flex-wrap items-center justify-between gap-2 px-[12px] py-2 sm:h-[72px] sm:flex-nowrap sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
        <Link href="/admin" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="nile-brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-blue-900 font-titre text-xl font-extrabold text-white">N</span>
          <span><span className="block font-titre text-sm font-extrabold text-slate-950 sm:text-base">NILE <span className="font-semibold text-slate-400">/ Control</span></span><span className="block text-[9px] font-extrabold uppercase tracking-[.1em] text-slate-500 sm:text-[10px] sm:tracking-[.13em]">Administration plateforme</span></span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3"><Link href="/" className="hidden text-xs font-extrabold text-slate-500 hover:text-blue-900 sm:block">Voir la boutique ↗</Link><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-900">{admin.nom.trim().charAt(0).toUpperCase()}</span><span className="hidden text-sm font-extrabold text-slate-700 sm:block">{admin.nom}</span><form action={deconnexionAction}><button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-stone-50 hover:text-blue-900 sm:px-3 sm:text-xs">Déconnexion</button></form></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-4 px-[14px] py-4 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8">
      <NavAdmin />
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
