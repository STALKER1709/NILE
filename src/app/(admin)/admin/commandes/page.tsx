import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerToutesCommandes } from "@/modules/admin/commandes";
import { formaterXAF } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage() {
  await exigerRole("ADMIN");
  const commandes = await listerToutesCommandes();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Commandes & livraisons</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← Back-office
        </Link>
      </div>

      {commandes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucune commande.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
          {commandes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/commandes/${c.id}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.numero}</p>
                  <p className="text-xs text-gray-500">
                    {c.acheteur.nom} · {c._count.lignes} article(s) ·{" "}
                    {c.modePaiement === "COD" ? "COD" : "Monetbil"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-nile">{formaterXAF(c.total)}</p>
                  <p className="text-xs text-gray-500">
                    {c.statutCommande} · paiement {c.statutPaiement}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
