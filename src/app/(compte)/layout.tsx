import type { ReactNode } from "react";
import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";

const LINKS = [
  { href: "/compte", label: "Vue d'ensemble" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/favoris", label: "Mes favoris" },
  { href: "/notifications", label: "Notifications" },
  { href: "/compte/profil", label: "Profil et coordonnées" },
  { href: "/panier", label: "Mon panier" },
];

export const dynamic = "force-dynamic";

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const utilisateur = await exigerConnexion();
  return <div className="min-h-[70vh] bg-[#f8f7f3]">
    <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-9 lg:px-10">
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
        <div><p className="nile-eyebrow text-blue-700">Votre espace NILE</p><h1 className="mt-2 font-titre text-3xl font-bold tracking-tight text-slate-950">Bonjour, {utilisateur.nom.split(" ")[0]}</h1><p className="mt-1 text-sm text-slate-500">Suivez vos achats, vos préférences et vos informations.</p></div>
        <Link href="/catalogue" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:border-blue-300">Continuer mes achats ↗</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-9">
        <aside className="self-start rounded-2xl border border-stone-200 bg-white p-2 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b border-stone-100 px-3 py-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 font-titre text-lg font-bold text-blue-900">{utilisateur.nom.trim().charAt(0).toUpperCase()}</span>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{utilisateur.nom}</p><p className="text-xs text-slate-500">Compte client</p></div>
          </div>
          <nav aria-label="Navigation du compte" className="no-scrollbar flex gap-1 overflow-x-auto py-2 lg:flex-col">
            {LINKS.map((link) => <Link key={link.href} href={link.href} className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-900">{link.label}</Link>)}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  </div>;
}
