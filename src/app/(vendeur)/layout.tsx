import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { exigerRole } from "@/modules/auth/access";
import { compterCommandesVendeur } from "@/modules/commande/vendeur";
import { NavVendeur } from "@/components/vendeur/NavVendeur";

export const dynamic = "force-dynamic";

/**
 * Cadre commun de l'espace vendeur : navigation latérale persistante.
 * Le rôle est vérifié ici côté serveur, en plus de chaque page.
 */
export default async function LayoutVendeur({
  children,
}: {
  children: ReactNode;
}) {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
    select: { id: true, nomBoutique: true },
  });
  const compteurs = vendeur
    ? await compterCommandesVendeur(vendeur.id)
    : { aPreparer: 0 };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <NavVendeur
        nomBoutique={vendeur?.nomBoutique ?? "Ma boutique"}
        aPreparer={compteurs.aPreparer}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
