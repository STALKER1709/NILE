import type { ReactNode } from "react";
import { exigerConnexion } from "@/modules/auth/access";
import { CoqueCompte } from "@/components/compte/CoqueCompte";

export const dynamic = "force-dynamic";

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const utilisateur = await exigerConnexion();
  return <CoqueCompte nom={utilisateur.nom}>{children}</CoqueCompte>;
}
