import { getUtilisateurCourant } from "@/modules/auth/access";
import { ReelsClient } from "@/components/reels/ReelsClient";

export const metadata = {
  title: "NILE Marketplace · Reels",
  description: "Découvrez les publications vidéo des boutiques du Cameroun",
};

export default async function ReelsPage() {
  const utilisateur = await getUtilisateurCourant();
  return <ReelsClient utilisateur={utilisateur} />;
}
