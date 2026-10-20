import type { ReactNode } from "react";
import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", mark: "01" },
  { href: "/admin/commandes", label: "Commandes & livraisons", mark: "02" },
  { href: "/admin/vendeurs", label: "Vendeurs", mark: "03" },
  { href: "/admin/moderation", label: "Modération", mark: "04" },
  { href: "/admin/categories", label: "Catalogue & rayons", mark: "05" },
  { href: "/admin/codes-promo", label: "Codes promotionnels", mark: "06" },
  { href: "/admin/reversements", label: "Reversements", mark: "07" },
  { href: "/admin/reconciliation", label: "Réconciliation COD", mark: "08" },
  { href: "/admin/annonces", label: "Annonces", mark: "09" },
  { href: "/admin/maintenance", label: "Maintenance", mark: "10" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await exigerRole("ADMIN");
  return <div className="min-h-screen bg-[#f4f5f8] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-[68px] items-center justify-between px-4 sm:px-7">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-900 font-titre text-xl font-bold text-amber-400">N</span>
          <span><span className="block font-titre text-base font-bold text-slate-950">NILE <span className="font-medium text-slate-400">/ Control</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Administration plateforme</span></span>
        </Link>
        <div className="flex items-center gap-3"><Link href="/" className="hidden text-sm font-medium text-slate-500 hover:text-blue-900 sm:block">Voir la boutique ↗</Link><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">{admin.nom.trim().charAt(0).toUpperCase()}</span><span className="hidden text-sm font-semibold text-slate-700 sm:block">{admin.nom}</span></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 px-3 py-4 sm:px-6 sm:py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8">
      <aside className="self-start rounded-2xl border border-slate-200 bg-white p-2 lg:sticky lg:top-[88px]">
        <div className="px-3 py-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Espace de travail</p><p className="mt-1 text-sm font-bold text-slate-900">Opérations NILE</p></div>
        <nav aria-label="Navigation administration" className="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col">
          {NAV.map((item) => <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-900"><span className="font-mono text-[10px] text-slate-400">{item.mark}</span>{item.label}</Link>)}
        </nav>
        <div className="mt-3 hidden rounded-xl bg-blue-50 p-3 lg:block"><p className="text-xs font-bold text-blue-950">Espace de contrôle</p><p className="mt-1 text-xs leading-5 text-blue-900/70">Les actions sensibles restent traçables et accessibles selon les rôles.</p></div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
