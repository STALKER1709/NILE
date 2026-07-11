import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerSoldesVendeurs } from "@/modules/reversement/reversement";
import { enregistrerReversementAction } from "@/app/(admin)/admin/reversements/actions";
import { Carte, Prix, btn, champClass, EtatVide } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reversements vendeurs" };

export default async function ReversementsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await exigerRole("ADMIN");
  const { ok, erreur } = await searchParams;
  const soldes = await listerSoldesVendeurs();
  const totalDu = soldes.reduce((s, v) => s + v.solde, 0);
  const taux = soldes[0]?.tauxPourcent;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Reversements vendeurs</h1>
        <Link href="/admin" className="text-sm text-nile hover:underline">← Back-office</Link>
      </div>

      <p className="text-sm text-gray-500">
        Une vente devient due au vendeur quand la commande est <strong>livrée et payée</strong>.
        {taux !== undefined && <> Commission NILE : <strong>{taux} %</strong> (clé <code>commission_pourcent</code> en configuration).</>}{" "}
        La boutique maison n&apos;apparaît pas ici (son chiffre revient à la plateforme).
      </p>

      {ok === "enregistre" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Reversement enregistré.
        </p>
      )}
      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-4">
        <p className="text-sm text-gray-500">Total dû aux vendeurs tiers</p>
        <Prix montant={totalDu} className="mt-1 block text-2xl font-bold text-nile" />
      </Carte>

      {soldes.length === 0 ? (
        <EtatVide titre="Aucun vendeur tiers pour l'instant." />
      ) : (
        <div className="space-y-3">
          {soldes.map((v) => (
            <Carte key={v.vendeurId} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{v.nomBoutique}</p>
                  <p className="truncate text-xs text-gray-500">{v.emailVendeur}</p>
                </div>
                <p className="text-lg font-bold text-nile">
                  Solde : <Prix montant={v.solde} />
                </p>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Info label="Ventes livrées & payées" montant={v.brut} />
                <Info label={`Commission (${v.tauxPourcent} %)`} montant={v.commission} negatif />
                <Info label="Net vendeur" montant={v.net} />
                <Info label="Déjà reversé" montant={v.dejaReverse} />
              </dl>

              {v.solde > 0 && (
                <form
                  action={enregistrerReversementAction}
                  className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="vendeurId" value={v.vendeurId} />
                  <div className="sm:w-44">
                    <label htmlFor={`montant-${v.vendeurId}`} className="block text-xs text-gray-500">
                      Montant reversé (FCFA)
                    </label>
                    <input
                      id={`montant-${v.vendeurId}`}
                      name="montant"
                      type="number"
                      min={1}
                      max={v.solde}
                      defaultValue={v.solde}
                      required
                      className={`${champClass} mt-1`}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`commentaire-${v.vendeurId}`} className="block text-xs text-gray-500">
                      Référence (facultatif — ex. n° transfert MoMo)
                    </label>
                    <input
                      id={`commentaire-${v.vendeurId}`}
                      name="commentaire"
                      maxLength={200}
                      className={`${champClass} mt-1`}
                    />
                  </div>
                  <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "md", "sm:shrink-0")}>
                    Marquer reversé
                  </BoutonSoumettre>
                </form>
              )}
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  montant,
  negatif = false,
}: {
  label: string;
  montant: number;
  negatif?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`font-medium ${negatif ? "text-red-600" : "text-gray-800"}`}>
        {negatif && montant > 0 ? "− " : ""}
        <Prix montant={montant} />
      </dd>
    </div>
  );
}
