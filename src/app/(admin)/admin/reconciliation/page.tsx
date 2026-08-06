import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerCommandesCOD } from "@/modules/paiement/reconciliation";
import { Carte, Prix, Badge, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** Ce que dit vraiment l'état du cash, une fois le COD encaissé par la boutique. */
const LIB_CASH: Record<string, string> = {
  NON_APPLICABLE: "sans objet",
  NON_COLLECTE: "à encaisser à la remise",
  COLLECTE: "encaissé par la boutique",
  REVERSE: "reversé (historique)",
};

const TON_CASH: Record<string, "neutre" | "ambre" | "vert" | "bleu"> = {
  NON_APPLICABLE: "neutre",
  NON_COLLECTE: "ambre",
  COLLECTE: "vert",
  REVERSE: "vert",
};

export default async function ReconciliationPage() {
  await exigerRole("ADMIN");
  const commandes = await listerCommandesCOD();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Suivi du cash (COD)</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      <p className="rounded border border-contour-carte bg-surface-basse px-3 py-2 text-sm text-slate-600">
        Vue de contrôle, en lecture seule. Les espèces sont remises directement
        au livreur de la boutique : elles ne transitent pas par NILE, il n&apos;y
        a donc rien à encaisser ni à reverser ici. Une commande passe à
        « encaissé » au moment où le code de réception de l&apos;acheteur est
        validé.
      </p>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande à la livraison." />
      ) : (
        <div className="space-y-2">
          {commandes.map((c) => {
            const etat = c.livraison?.statutCash ?? "NON_APPLICABLE";
            return (
              <Carte key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/commandes/${c.id}`}
                    className="truncate font-medium text-nile-800 hover:underline"
                  >
                    {c.numero}
                  </Link>
                  <p className="text-xs text-slate-500">
                    <Prix montant={c.total} /> · {c.statutCommande} · paiement {c.statutPaiement}
                  </p>
                </div>
                <Badge ton={TON_CASH[etat] ?? "neutre"}>
                  cash : {LIB_CASH[etat] ?? etat}
                </Badge>
              </Carte>
            );
          })}
        </div>
      )}
    </div>
  );
}
