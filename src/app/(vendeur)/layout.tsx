import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigerRole } from "@/modules/auth/access";
import { compterCommandesVendeur } from "@/modules/commande/vendeur";
import { NavVendeur } from "@/components/vendeur/NavVendeur";

export const dynamic = "force-dynamic";

export default async function LayoutVendeur({ children }: { children: ReactNode }) {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id }, select: { id: true, nomBoutique: true } });
  const compteurs = vendeur ? await compterCommandesVendeur(vendeur.id) : { aPreparer: 0 };
  return <div className="min-h-screen bg-[#f4f5f8]">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/vendeur" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-900 font-titre text-xl font-bold text-amber-400">N</span><span><span className="block font-titre text-base font-bold text-slate-950">NILE <span className="font-medium text-slate-400">/ Seller Studio</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{vendeur?.nomBoutique ?? "Ma boutique"}</span></span></Link>
        <div className="flex items-center gap-3"><Link href="/" className="hidden text-sm font-medium text-slate-500 hover:text-blue-900 sm:block">Voir la marketplace ↗</Link><span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-sm font-bold text-blue-950">{utilisateur.nom.trim().charAt(0).toUpperCase()}</span></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 px-3 py-4 sm:px-6 sm:py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8">
      <NavVendeur nomBoutique={vendeur?.nomBoutique ?? "Ma boutique"} aPreparer={compteurs.aPreparer} />
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
