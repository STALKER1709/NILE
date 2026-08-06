import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerCommandesCOD, totauxCash } from "@/modules/paiement/reconciliation";
import { ancienneteJours, decisionRemiseCash } from "@/modules/paiement/cash-core";
import { marquerCashRemisAction } from "@/app/(admin)/admin/reconciliation/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, Prix, Badge, EtatVide, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** Où en est physiquement l'argent d'une commande payée à la livraison. */
const LIB_CASH: Record<string, string> = {
  NON_APPLICABLE: "sans objet",
  NON_COLLECTE: "à encaisser à la remise",
  COLLECTE: "détenu par le livreur",
  REVERSE: "remis à NILE",
};

const TON_CASH: Record<string, "neutre" | "ambre" | "vert" | "bleu"> = {
  NON_APPLICABLE: "neutre",
  NON_COLLECTE: "neutre",
  // Ambre et non vert : encaissé ne veut pas dire arrivé. Tant que le livreur
  // détient les espèces, c'est une exposition, pas une recette acquise.
  COLLECTE: "ambre",
  REVERSE: "vert",
};

/** Au-delà, un cash non remis n'est plus un retard mais un problème. */
const SEUIL_ALERTE_JOURS = 3;

export default async function ReconciliationPage() {
  await exigerRole("ADMIN");
  const [commandes, totaux] = await Promise.all([
    listerCommandesCOD(),
    totauxCash(),
  ]);
  const maintenant = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Suivi du cash (COD)</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      <p className="rounded border border-contour-carte bg-surface-basse px-3 py-2 text-sm text-slate-600">
        Les livreurs sont fournis par NILE : les espèces remises par
        l&apos;acheteur remontent à la plateforme. Une commande passe à
        « détenu par le livreur » quand le code de réception est validé, puis à
        « remis à NILE » quand le livreur rend l&apos;argent — c&apos;est ce
        second geste qui rend la vente payable au vendeur.
      </p>

      <div className="grid grid-cols-1 gap-gouttiere sm:grid-cols-2">
        <Carte className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Détenu par les livreurs
          </p>
          <p className="mt-1 text-titre-sm text-amber-700">
            <Prix montant={totaux.enMainLivreur} />
          </p>
          <p className="text-xs text-slate-500">
            {totaux.nbEnAttente} commande{totaux.nbEnAttente > 1 ? "s" : ""} en
            attente de remise
          </p>
        </Carte>
        <Carte className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Remis à NILE
          </p>
          <p className="mt-1 text-titre-sm text-emerald-700">
            <Prix montant={totaux.remis} />
          </p>
          <p className="text-xs text-slate-500">cumul depuis l&apos;ouverture</p>
        </Carte>
      </div>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande à la livraison." />
      ) : (
        <div className="space-y-2">
          {commandes.map((c) => {
            const etat = c.livraison?.statutCash ?? "NON_APPLICABLE";
            const remisable =
              decisionRemiseCash({
                modePaiement: c.modePaiement,
                statutCash: etat,
              }) === "OK";
            const jours = remisable
              ? ancienneteJours(c.livraison?.dateLivraison, maintenant)
              : 0;

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
                  {jours >= SEUIL_ALERTE_JOURS && (
                    <p className="text-xs font-semibold text-red-600">
                      Non remis depuis {jours} jours
                    </p>
                  )}
                </div>
                <Badge ton={TON_CASH[etat] ?? "neutre"}>
                  cash : {LIB_CASH[etat] ?? etat}
                </Badge>
                {remisable && (
                  <form action={marquerCashRemisAction}>
                    <input type="hidden" name="commandeId" value={c.id} />
                    <BoutonSoumettre className={btn("secondaire", "sm")}>
                      Cash remis
                    </BoutonSoumettre>
                  </form>
                )}
              </Carte>
            );
          })}
        </div>
      )}
    </div>
  );
}
