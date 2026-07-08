import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerCommandesCOD } from "@/modules/paiement/reconciliation";
import { formaterXAF } from "@/lib/money";
import {
  marquerCollecteAction,
  marquerReverseAction,
} from "@/app/(admin)/admin/reconciliation/actions";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const commandes = await listerCommandesCOD();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Réconciliation cash (COD)</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← Back-office
        </Link>
      </div>

      {ok && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {ok === "collecte" ? "Cash marqué comme collecté." : "Cash marqué comme reversé."}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {commandes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucune commande à la livraison.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
          {commandes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.numero}</p>
                <p className="text-xs text-gray-500">
                  {formaterXAF(c.total)} · commande {c.statutCommande} · paiement{" "}
                  {c.statutPaiement}
                </p>
              </div>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                cash : {c.livraison?.statutCash ?? "—"}
              </span>
              {c.livraison?.statutCash === "NON_COLLECTE" && (
                <form action={marquerCollecteAction}>
                  <input type="hidden" name="commandeId" value={c.id} />
                  <button type="submit" className="rounded bg-nile px-3 py-1.5 text-xs font-medium text-white hover:bg-nile-dark">
                    Cash collecté
                  </button>
                </form>
              )}
              {c.livraison?.statutCash === "COLLECTE" && (
                <form action={marquerReverseAction}>
                  <input type="hidden" name="commandeId" value={c.id} />
                  <button type="submit" className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                    Marquer reversé
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
