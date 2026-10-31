import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import {
  listerSoldesVendeurs,
  listerDemandesReversement,
} from "@/modules/reversement/reversement";
import {
  executerDemandeAction,
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
  const totalDu = soldes.filter((v) => v.eligibleReversement).reduce((s, v) => s + v.solde, 0);
  const taux = soldes[0]?.tauxPourcent;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Reversements vendeurs</h1>
        <Link href="/admin" className="text-sm text-nile hover:underline">← Back-office</Link>
      </div>

      <p className="text-sm text-slate-500">
        Traitement via HR-Skills Pay : l’administrateur déclenche le transfert MTN ou Orange depuis le wallet NILE. Les demandes restent réservées jusqu’à confirmation du fournisseur. Seuil minimum : 10 000 FCFA ; frais Cash-Out HR-Skills débités en plus du montant envoyé.
      </p>

      <p className="text-sm text-slate-500">
        Une vente devient due au vendeur quand la commande est <strong>livrée et payée</strong>.
        Commission NILE : <strong>{taux ?? 12} %</strong> (taux fixé par décision métier).{" "}
        La boutique maison n&apos;apparaît pas ici (son chiffre revient à la plateforme).
      </p>

      {ok === "enregistre" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Reversement enregistré.
        </p>
      )}
      {ok === "en-cours" && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Transfert envoyé au fournisseur ou en cours de vérification. Le montant reste réservé jusqu’au statut définitif.
        </p>
      )}\n      {ok === "paye" && (
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
        <p className="text-sm text-slate-500">Total des soldes éligibles (boutique et KYC validés)</p>
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
                        {d.vendeur.utilisateur.email} · boutique {d.vendeur.statutValidation} · KYC {d.vendeur.kyc?.statut ?? "NON_SOUMIS"} · demandé le{" "}
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
                    <form action={executerDemandeAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="reversementId" value={d.id} />
                      <div>
                        <label htmlFor={`operateur-${d.id}`} className="block text-etiquette-xs text-slate-500">
                          Portefeuille destinataire
                        </label>
                        <select id={`operateur-${d.id}`} name="operateur" required defaultValue={infos.momoMtn ? "MTN" : "ORANGE"} className={`${champClass} mt-1`}>
                          {infos.momoMtn && <option value="MTN">MTN · {infos.momoMtn}</option>}
                          {infos.momoOrange && <option value="ORANGE">Orange · {infos.momoOrange}</option>}
                        </select>
                      </div>
                      <BoutonSoumettre enCours="Traitement…" className={btn("primaire", "md")}>
                        {d.statut === "EN_COURS" ? "Vérifier le transfert" : "Envoyer le reversement"}
                      </BoutonSoumettre>
                    </form>
                    {d.statut === "DEMANDE" && (
                      <form action={traiterDemandeAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="reversementId" value={d.id} />
                        <input type="hidden" name="decision" value="REJETE" />
                        <div>
                          <label htmlFor={`motif-${d.id}`} className="block text-etiquette-xs text-slate-500">
                            Motif du refus
                          </label>
                          <input id={`motif-${d.id}`} name="commentaire" maxLength={200} placeholder="Ex : coordonnées incorrectes" className={`${champClass} mt-1 w-56`} />
                        </div>
                        <BoutonSoumettre enCours="…" className={btn("danger", "md")}>
                          Refuser
                        </BoutonSoumettre>
                      </form>
                    )}
                    {d.referenceFournisseur && (
                      <p className="w-full text-xs text-slate-500">
                        Référence HR-Skills : {d.referenceFournisseur}
                        {d.frais !== null && d.frais !== undefined ? ` · Frais : ${d.frais.toLocaleString("fr-FR")} FCFA` : ""}
                      </p>
                    )}
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

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-1">Boutique : {v.statutValidation}</span>
                <span className="rounded bg-slate-100 px-2 py-1">KYC : {v.statutKyc ?? "NON_SOUMIS"}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Info label="Ventes Mobile Money" montant={v.brut} />
                <Info label="Ventes à la livraison" montant={v.brutCOD} />
                <Info label={`Commission (${v.tauxPourcent} %)`} montant={v.commission} negatif />
                <Info label="Net vendeur" montant={v.net} />
                <Info label="Déjà reversé" montant={v.dejaReverse} />
              </dl>

              {!v.eligibleReversement && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Reversement bloqué : la boutique et le dossier KYC doivent être validés.
                </p>
              )}
              {v.eligibleReversement && v.solde > 0 && v.solde < 10000 && (
                <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Solde inférieur au seuil minimum de 10 000 FCFA.
                </p>
              )}
              {v.dette > 0 && (
                /* La commission de ses ventes en espèces dépasse ce que NILE
                   détient pour lui : c'est une créance, qui s'épongera sur ses
                   prochaines ventes Mobile Money — ou pas, s'il n'en fait plus. */
                <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Doit à NILE : <Prix montant={v.dette} /> — commission de ventes
                  payées à la livraison, non couverte par ses encaissements
                  Mobile Money.
                </p>
              )}

              {v.eligibleReversement && v.solde >= 10000 && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Les reversements sont désormais initiés depuis les demandes vendeur ci-dessus ; aucun paiement manuel ne peut être marqué comme exécuté dans NILE.</p>
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
