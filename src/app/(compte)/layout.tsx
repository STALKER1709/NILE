import type { ReactNode } from "react";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { CoqueCompte } from "@/components/compte/CoqueCompte";

export const dynamic = "force-dynamic";

export default async function CompteLayout({ children }: { children: ReactNode }) {
  // Le groupe contient aussi le panier invité : l'authentification est exigée
  // par les pages/actions qui en ont besoin, jamais par cette coque commune.
  const utilisateur = await getUtilisateurCourant();
  return <CoqueCompte nom={utilisateur?.nom ?? "votre compte"}>{children}</CoqueCompte>;
}
