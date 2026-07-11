import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerToutesCommandes } from "@/modules/admin/commandes";
import { Carte, Prix, EtatVide } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage() {
  await exigerRole("ADMIN");
  const commandes = await listerToutesCommandes();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Commandes & livraisons</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Back-office</Link>
      </div>

      <p className="text-sm text-gray-500">
        Supervision : chaque boutique pilote la livraison de ses commandes
        mono-boutique depuis son espace vendeur. Ici tu peux tout voir, agir en
        secours, gérer les commandes multi-boutiques, les refus à la livraison
        et l&apos;encaissement du cash COD.
      </p>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande." />
      ) : (
        <div className="space-y-2">
          {commandes.map((c) => (
            <Link key={c.id} href={`/admin/commandes/${c.id}`} className="block">
              <Carte className="flex items-center justify-between gap-3 p-4 transition hover:shadow-flottant">
                <div className="min-w-0">
                  <p className="font-semibold">{c.numero}</p>
                  <p className="text-xs text-gray-500">{c.acheteur.nom} · {c._count.lignes} article(s) · {c.modePaiement === "COD" ? "COD" : "Monetbil"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <BadgeStatutCommande statut={c.statutCommande} />
                    <BadgeStatutPaiement statut={c.statutPaiement} />
                  </div>
                </div>
                <Prix montant={c.total} className="shrink-0 font-bold text-nile" />
              </Carte>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
