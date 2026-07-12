import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerCommandesCOD } from "@/modules/paiement/reconciliation";
import {
  marquerCollecteAction,
  marquerReverseAction,
} from "@/app/(admin)/admin/reconciliation/actions";
import { Carte, Prix, Badge, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

const TON_CASH: Record<string, "neutre" | "ambre" | "vert" | "bleu"> = {
  NON_APPLICABLE: "neutre",
  NON_COLLECTE: "ambre",
  COLLECTE: "bleu",
  REVERSE: "vert",
};

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
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Back-office</Link>
      </div>

      {ok && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok === "collecte" ? "Cash marqué comme collecté." : "Cash marqué comme reversé."}</p>}
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande à la livraison." />
      ) : (
        <div className="space-y-2">
          {commandes.map((c) => (
            <Carte key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.numero}</p>
                <p className="text-xs text-gray-500"><Prix montant={c.total} /> · {c.statutCommande} · paiement {c.statutPaiement}</p>
              </div>
              <Badge ton={TON_CASH[c.livraison?.statutCash ?? "NON_APPLICABLE"]}>cash : {c.livraison?.statutCash ?? "-"}</Badge>
              {c.livraison?.statutCash === "NON_COLLECTE" && (
                <form action={marquerCollecteAction}>
                  <input type="hidden" name="commandeId" value={c.id} />
                  <button type="submit" className={btn("primaire", "sm")}>Cash collecté</button>
                </form>
              )}
              {c.livraison?.statutCash === "COLLECTE" && (
                <form action={marquerReverseAction}>
                  <input type="hidden" name="commandeId" value={c.id} />
                  <button type="submit" className={btn("secondaire", "sm")}>Marquer reversé</button>
                </form>
              )}
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}
