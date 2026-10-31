import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigerRole } from "@/modules/auth/access";
import { compterCommandesVendeur } from "@/modules/commande/vendeur";
import { NavVendeur } from "@/components/vendeur/NavVendeur";
import { deconnexionAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function LayoutVendeur({ children }: { children: ReactNode }) {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id }, select: { id: true, nomBoutique: true } });
  const compteurs = vendeur ? await compterCommandesVendeur(vendeur.id) : { aPreparer: 0 };
  return <div className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:h-[72px] sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8">
        <Link href="/vendeur" className="flex min-w-0 items-center gap-2.5"><span className="nile-brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-blue-900 font-titre text-xl font-extrabold text-white">N</span><span><span className="block font-titre text-base font-extrabold text-slate-950">NILE <span className="font-semibold text-slate-400">/ Seller Studio</span></span><span className="block max-w-[55vw] truncate text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-500">{vendeur?.nomBoutique ?? "Ma boutique"}</span></span></Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3"><Link href="/" className="hidden text-xs font-extrabold text-slate-500 hover:text-blue-900 sm:block">Voir la marketplace ↗</Link><span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-sm font-extrabold text-blue-950">{utilisateur.nom.trim().charAt(0).toUpperCase()}</span><form action={deconnexionAction}><button type="submit" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-stone-50 hover:text-blue-900">Déconnexion</button></form></div>
      </div>
    </header>
    <div className="mx-auto grid w-full min-w-0 max-w-[1600px] gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8 print:block print:p-0">
      <NavVendeur nomBoutique={vendeur?.nomBoutique ?? "Ma boutique"} aPreparer={compteurs.aPreparer} />
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
