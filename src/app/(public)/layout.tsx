import type { ReactNode } from "react";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { compterArticlesAffiches } from "@/modules/commande/panier-invite";
import { compterFavoris } from "@/modules/catalogue/favoris";
import { listerCategories } from "@/modules/catalogue/categories";
import { Entete } from "@/components/layout/Entete";
import { PiedDePage } from "@/components/layout/PiedDePage";
import { NavMobile } from "@/components/layout/NavMobile";
import { BulleWhatsApp } from "@/components/layout/BulleWhatsApp";
import { RetourHaut } from "@/components/layout/RetourHaut";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const utilisateur = await getUtilisateurCourant();
  const [categories, nbArticles, nbFavoris] = await Promise.all([
    listerCategories(),
    compterArticlesAffiches(utilisateur?.id ?? null),
    compterFavoris(utilisateur?.id ?? null),
  ]);
  const rayons = categories.filter((c) => !c.parentId).slice(0, 10).map((c) => ({ nom: c.nom, slug: c.slug }));
  return <>
    <Entete utilisateur={utilisateur ? { nom: utilisateur.nom, role: utilisateur.role } : null} nbArticles={nbArticles} nbFavoris={nbFavoris} categories={rayons} />
    <main className="mx-auto w-full max-w-[1284px] px-[14px] py-5 pb-24 sm:px-[22px] sm:py-7 sm:pb-10">{children}</main>
    <PiedDePage />
    <NavMobile connecte={!!utilisateur} nbArticles={nbArticles} nbFavoris={nbFavoris} />
    {env.CONTACT_WHATSAPP && <BulleWhatsApp numero={env.CONTACT_WHATSAPP} />}
    <RetourHaut />
  </>;
}
