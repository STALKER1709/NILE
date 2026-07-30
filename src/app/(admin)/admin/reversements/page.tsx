import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import {
  listerSoldesVendeurs,
  listerDemandesReversement,
} from "@/modules/reversement/reversement";
import {
  enregistrerReversementAction,
  traiterDemandeAction,
} from "@/app/(admin)/admin/reversements/actions";
import { lireInfosPaiement } from "@/modules/compte/profil";
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
  const [soldes, demandes] = await Promise.all([
    listerSoldesVendeurs(),
    listerDemandesReversement(),
  ]);
  const totalDu = soldes.reduce((s, v) => s + v.solde, 0);
  const taux = soldes[0]?.tauxPourcent;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Reversements vendeurs</h1>
        <Link href="/admin" className="text-sm text-nile hover:underline">← Back-office</Link>
      </div>

      <p className="text-sm text-slate-500">
        Une vente devient due au vendeur quand la commande est <strong>livrée et payée</strong>.
        {taux !== undefined && <> Commission NILE : <strong>{taux} %</strong> (clé <code>commission_pourcent</code> en configuration).</>}{" "}
        La boutique maison n&apos;apparaît pas ici (son chiffre revient à la plateforme).
      </p>

      {ok === "enregistre" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Reversement enregistré.
        </p>
      )}
      {ok === "paye" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Demande marquée payée.
        </p>
      )}
      {ok === "rejete" && (
        <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
          Demande refusée. Le montant redevient disponible pour le vendeur.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-4">
        <p className="text-sm text-slate-500">Total disponible à demander</p>
        <Prix montant={totalDu} className="mt-1 block text-2xl font-bold text-nile" />
      </Carte>

      {/* Demandes émises par les vendeurs, les plus anciennes d'abord. */}
      <section>
        <h2 className="mb-3 text-titre-sm text-nile-800">
          Demandes en attente{demandes.length > 0 && ` (${demandes.length})`}
        </h2>
        {demandes.length === 0 ? (
          <Carte className="p-5">
            <p className="text-corps-sm text-slate-500">
              Aucune demande à traiter.
            </p>
          </Carte>
        ) : (
          <div className="space-y-3">
            {demandes.map((d) => {
              const infos = lireInfosPaiement(d.vendeur.infosPaiement);
              return (
                <Carte key={d.id} className="border-l-4 border-l-accent p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{d.vendeur.nomBoutique}</p>
                      <p className="truncate text-xs text-slate-500">
                        {d.vendeur.utilisateur.email} · demandé le{" "}
                        {d.dateCreation.toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <Prix montant={d.montant} className="text-lg font-bold text-nile-800" />
                  </div>

                  {/* Où payer : coordonnées déclarées par le vendeur. */}
                  <div className="mt-3 flex flex-wrap gap-3 rounded bg-surface-basse p-3 text-corps-sm">
                    {infos.momoMtn && (
                      <span className="flex items-center gap-2">
                        <span className="grid h-6 w-9 place-items-center rounded bg-[#ffcb05] text-[9px] font-bold text-black">MTN</span>
                        {infos.momoMtn}
                      </span>
                    )}
                    {infos.momoOrange && (
                      <span className="flex items-center gap-2">
                        <span className="grid h-6 w-9 place-items-center rounded bg-[#ff7900] text-[9px] font-bold text-white">OM</span>
                        {infos.momoOrange}
                      </span>
                    )}
                    {infos.titulaire && (
                      <span className="text-slate-600">Titulaire : {infos.titulaire}</span>
                    )}
                    {!infos.momoMtn && !infos.momoOrange && (
                      <span className="text-promo">
                        Aucun numéro déclaré : impossible de payer en l&apos;état.
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={traiterDemandeAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="reversementId" value={d.id} />
                      <input type="hidden" name="decision" value="PAYE" />
                      <div>
                        <label htmlFor={`ref-${d.id}`} className="block text-etiquette-xs text-slate-500">
                          Référence du transfert (facultatif)
                        </label>
                        <input id={`ref-${d.id}`} name="commentaire" maxLength={200} placeholder="Ex : MoMo #123456" className={`${champClass} mt-1 w-56`} />
                      </div>
                      <BoutonSoumettre enCours="…" className={btn("primaire", "md")}>
                        Marquer payée
                      </BoutonSoumettre>
                    </form>
                    <form action={traiterDemandeAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="reversementId" value={d.id} />
                      <input type="hidden" name="decision" value="REJETE" />
                      <div>
                        <label htmlFor={`motif-${d.id}`} className="block text-etiquette-xs text-slate-500">
                          Motif du refus
                        </label>
                        <input id={`motif-${d.id}`} name="commentaire" maxLength={200} placeholder="Ex : numéro incorrect" className={`${champClass} mt-1 w-56`} />
                      </div>
                      <BoutonSoumettre enCours="…" className={btn("danger", "md")}>
                        Refuser
                      </BoutonSoumettre>
                    </form>
                  </div>
                </Carte>
              );
            })}
          </div>
        )}
      </section>

      {soldes.length === 0 ? (
        <EtatVide titre="Aucun vendeur tiers pour l'instant." />
      ) : (
        <div className="space-y-3">
          {soldes.map((v) => (
            <Carte key={v.vendeurId} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{v.nomBoutique}</p>
                  <p className="truncate text-xs text-slate-500">{v.emailVendeur}</p>
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
                  className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="vendeurId" value={v.vendeurId} />
                  <div className="sm:w-44">
                    <label htmlFor={`montant-${v.vendeurId}`} className="block text-xs text-slate-500">
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
                    <label htmlFor={`commentaire-${v.vendeurId}`} className="block text-xs text-slate-500">
                      Référence (facultatif · ex. n° transfert MoMo)
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
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`font-medium ${negatif ? "text-red-600" : "text-slate-800"}`}>
        {negatif && montant > 0 ? "− " : ""}
        <Prix montant={montant} />
      </dd>
    </div>
  );
}
