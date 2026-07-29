import { Carte, Prix } from "@/components/ui/kit";
import type { TransactionVendeur } from "@/modules/reversement/finances-core";

/** Libellé et couleur de chaque état de transaction. */
const ETATS: Record<TransactionVendeur["etat"], { texte: string; classe: string }> = {
  REGLEE: { texte: "Réglée", classe: "bg-nile-200 text-nile-900" },
  EN_ATTENTE: { texte: "En attente", classe: "bg-accent-fixe text-accent-sur" },
  ANNULEE: { texte: "Annulée", classe: "bg-surface-haute text-slate-600" },
  VERSE: { texte: "Versé", classe: "bg-nile-200 text-nile-900" },
};

/**
 * Historique fusionné des ventes et des reversements. Tableau défilant
 * horizontalement sur mobile plutôt que colonnes écrasées.
 */
export function HistoriqueTransactions({
  transactions,
}: {
  transactions: TransactionVendeur[];
}) {
  return (
    <Carte className="overflow-hidden">
      <div className="border-b border-contour-carte p-5 sm:p-6">
        <h2 className="text-titre-sm text-nile-800">Historique des transactions</h2>
        <p className="text-corps-sm text-slate-500">
          Vos ventes et les reversements reçus, du plus récent au plus ancien.
        </p>
      </div>

      {transactions.length === 0 ? (
        <p className="p-8 text-center text-corps-sm text-slate-500">
          Aucune transaction pour l&apos;instant.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left">
            <thead>
              <tr className="bg-surface-basse text-etiquette-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Description</th>
                <th className="px-5 py-4 font-semibold">Référence</th>
                <th className="px-5 py-4 font-semibold">Statut</th>
                <th className="px-5 py-4 text-right font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const etat = ETATS[t.etat];
                const credit = t.type === "VENTE";
                // Une vente annulée ne rapporte rien : on ne l'affiche pas
                // comme un crédit acquis.
                const neutre = t.etat === "ANNULEE";
                return (
                  <tr key={`${t.type}-${t.id}`} className="transition-colors hover:bg-surface-subtile">
                    <td className="px-5 py-4">
                      <span className="block text-corps-sm font-medium text-slate-900">
                        {t.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-etiquette-xs text-slate-500">
                        {t.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            credit ? "bg-nile-50 text-nile-700" : "bg-accent-fixe text-accent-sur"
                          }`}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            {credit ? (
                              <>
                                <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
                                <path d="M8 9a4 4 0 0 1 8 0" />
                              </>
                            ) : (
                              <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                          </svg>
                        </span>
                        <span className="text-corps-sm text-slate-900">{t.libelle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-etiquette-xs text-slate-500">{t.reference}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${etat.classe}`}>
                        {etat.texte}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-4 text-right text-corps-sm font-bold ${
                        neutre ? "text-slate-400 line-through" : credit ? "text-slate-900" : "text-promo"
                      }`}
                    >
                      {!neutre && (credit ? "+ " : "− ")}
                      <Prix montant={t.montant} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}
