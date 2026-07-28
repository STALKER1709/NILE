import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { listerCommandesAcheteur } from "@/modules/commande/commande";
import { Carte, Prix, EtatVide } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

export default async function MesCommandesPage() {
  const utilisateur = await exigerConnexion();
  const commandes = await listerCommandesAcheteur(utilisateur.id);

  return (
    <div className="space-y-5">
      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Mes commandes</h1>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande pour l'instant.">
          <Link href="/catalogue" className="text-nile hover:underline">Parcourir le catalogue</Link>
        </EtatVide>
      ) : (
        <div className="space-y-3">
          {commandes.map((c) => (
            <Link key={c.id} href={`/commandes/${c.id}`} className="block">
              <Carte className="flex items-center justify-between gap-3 p-4 transition hover:shadow-flottant">
                <div className="min-w-0">
                  <p className="font-semibold">{c.numero}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.dateCreation).toLocaleDateString("fr-FR")} · {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <BadgeStatutCommande statut={c.statutCommande} />
                    <BadgeStatutPaiement statut={c.statutPaiement} />
                  </div>
                </div>
                <Prix montant={c.total} className="shrink-0 text-lg font-bold text-nile" />
              </Carte>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
