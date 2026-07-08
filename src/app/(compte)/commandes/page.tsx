import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { listerCommandesAcheteur } from "@/modules/commande/commande";
import { formaterXAF } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function MesCommandesPage() {
  const utilisateur = await exigerConnexion();
  const commandes = await listerCommandesAcheteur(utilisateur.id);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Mes commandes</h1>

      {commandes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucune commande pour l'instant.{" "}
          <Link href="/catalogue" className="text-nile hover:underline">
            Parcourir le catalogue
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
          {commandes.map((c) => (
            <li key={c.id}>
              <Link href={`/commandes/${c.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.numero}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.dateCreation).toLocaleDateString("fr-FR")} ·{" "}
                    {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""}
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
