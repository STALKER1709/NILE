"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Vue d’ensemble" },
  { href: "/admin/commandes", label: "Commandes & livraisons" },
  { href: "/admin/vendeurs", label: "Vendeurs" },
  { href: "/admin/moderation", label: "Modération" },
  { href: "/admin/categories", label: "Catalogue & rayons" },
  { href: "/admin/codes-promo", label: "Codes promotionnels" },
  { href: "/admin/reversements", label: "Reversements" },
  { href: "/admin/reconciliation", label: "Réconciliation COD" },
  { href: "/admin/annonces", label: "Annonces" },
  { href: "/admin/maintenance", label: "Maintenance" },
];

export function NavAdmin() {
  const chemin = usePathname();
  return <aside className="self-start rounded-[17px] border border-stone-200 bg-white p-2 lg:sticky lg:top-[88px]">
    <div className="px-3 py-4">
      <p className="nile-eyebrow text-slate-500">Espace de travail</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">Opérations NILE</p>
    </div>
    <nav aria-label="Navigation administration" className="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col">
      {NAV.map((item) => {
        const actif = chemin === item.href || (item.href !== "/admin" && chemin.startsWith(item.href + "/"));
        return <Link key={item.href} href={item.href} aria-current={actif ? "page" : undefined}
          className={"flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-bold transition-colors " +
            (actif ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-900")}>
          <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (actif ? "bg-amber-400" : "bg-stone-300")} aria-hidden="true" />
          {item.label}
        </Link>;
      })}
    </nav>
    <div className="mt-3 hidden rounded-[12px] bg-blue-50 p-3 lg:block">
      <p className="text-xs font-extrabold text-blue-950">Espace de contrôle</p>
      <p className="mt-1 text-xs leading-5 text-blue-900/75">Les actions sensibles restent protégées par les permissions côté serveur.</p>
    </div>
  </aside>;
}
