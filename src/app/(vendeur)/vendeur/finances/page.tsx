import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { getFinancesVendeur } from "@/modules/reversement/finances";
import { hauteursRelatives } from "@/modules/reversement/finances-core";
import { lireInfosPaiement, aDesInfosPaiement } from "@/modules/compte/profil";
import { Carte, Prix, EtatVide, btn } from "@/components/ui/kit";
import { HistoriqueTransactions } from "@/components/vendeur/HistoriqueTransactions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finances" };

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default async function FinancesVendeurPage() {
  const { vendeur } = await exigerVendeur();
  const finances = await getFinancesVendeur(vendeur.id);
  const infosPaiement = lireInfosPaiement(vendeur.infosPaiement);

  if (!finances) {
    return (
      <EtatVide titre="Finances indisponibles.">
        Votre boutique n&apos;a pas encore de compte de règlement.
      </EtatVide>
    );
  }

  const { solde, ventesMois, variationPourcent, commandesFinaliseesMois, serieJours } = finances;
  const maintenant = new Date();
  const nomMois = MOIS[maintenant.getMonth()] ?? "";
  const hauteurs = hauteursRelatives(serieJours.map((p) => p.valeur));
  const maxJour = Math.max(0, ...serieJours.map((p) => p.valeur));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Finances</h1>
        <p className="mt-1 text-corps-sm text-slate-500">
          Vos gains, ce qui vous reste dû et l&apos;historique de vos règlements.
        </p>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 gap-gouttiere lg:grid-cols-3">
        {/* Solde restant dû */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-nile-700/20 bg-nile-conteneur p-6 text-white">
          <div className="relative z-10">
            <p className="text-etiquette-md text-nile-surConteneur">Reste à vous verser</p>
            <p className="mt-2 whitespace-nowrap font-titre text-display-mobile font-bold">
              <Prix montant={solde.solde} />
            </p>
          </div>
          <p className="relative z-10 mt-6 max-w-[22rem] text-etiquette-xs leading-relaxed text-nile-surConteneur">
            NILE effectue les reversements par Mobile Money. Vous n&apos;avez
            rien à demander.
          </p>
          <svg
            width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.2" aria-hidden="true"
            className="absolute -right-5 top-4 text-white/[0.07]"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        {/* Ventes du mois */}
        <Carte className="flex flex-col justify-between p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-etiquette-md text-slate-500">
                Ventes réglées ({nomMois})
              </p>
              {variationPourcent !== null && (
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold ${
                    variationPourcent >= 0
                      ? "bg-nile-200 text-nile-900"
                      : "bg-promo-conteneur text-promo-dark"
                  }`}
                  title={`Mois précédent : ${finances.ventesMoisPrecedent.toLocaleString("fr-FR")} FCFA`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    {variationPourcent >= 0 ? (
                      <path d="M4 17 10 11l4 4 6-6M15 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M4 7l6 6 4-4 6 6M15 19h5v-5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                  {variationPourcent >= 0 ? "+" : ""}{variationPourcent} %
                </span>
              )}
            </div>
            <p className="text-titre-md text-nile-800">
              <Prix montant={ventesMois} />
            </p>
          </div>
          <p className="mt-4 flex items-center gap-2 text-corps-sm text-slate-500">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 2h9l4 4v16H6z" strokeLinejoin="round" />
              <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
            </svg>
            {commandesFinaliseesMois} commande{commandesFinaliseesMois > 1 ? "s" : ""} finalisée
            {commandesFinaliseesMois > 1 ? "s" : ""}
          </p>
        </Carte>

        <Carte className="flex flex-col p-6">
          <p className="mb-4 text-etiquette-md text-slate-500">Détail du solde</p>
          <dl className="space-y-2.5 text-corps-sm">
            <LigneDetail libelle="Ventes livrées et payées" valeur={solde.brut} />
            {/* Espace insécable : « 10 % » ne doit pas se couper en fin de ligne. */}
            <LigneDetail
              libelle={`Commission NILE (${solde.tauxPourcent} %)`}
              valeur={-solde.commission}
            />
            <LigneDetail libelle="Déjà reversé" valeur={-solde.dejaReverse} />
            <div className="flex items-baseline justify-between gap-2 border-t border-contour-carte pt-2.5 text-etiquette-md text-nile-800">
              <dt>Reste dû</dt>
              <dd className="whitespace-nowrap font-bold">
                <Prix montant={solde.solde} />
              </dd>
            </div>
          </dl>
        </Carte>
      </div>

      {/* Coordonnées de reversement : renseignées par le vendeur dans son profil. */}
      <Carte className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-titre-sm text-nile-800">Où vous êtes payé</h2>
            <p className="text-corps-sm text-slate-500">
              Les numéros Mobile Money utilisés pour vos reversements.
            </p>
          </div>
          <Link href="/compte/profil" className={btn("secondaire", "sm")}>
            {aDesInfosPaiement(infosPaiement) ? "Modifier" : "Renseigner"}
          </Link>
        </div>

        {aDesInfosPaiement(infosPaiement) ? (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {infosPaiement.momoMtn && (
              <NumeroReversement
                libelle="MTN MoMo"
                numero={infosPaiement.momoMtn}
                pastille="MTN"
                fond="bg-[#ffcb05]"
                couleurTexte="text-black"
              />
            )}
            {infosPaiement.momoOrange && (
              <NumeroReversement
                libelle="Orange Money"
                numero={infosPaiement.momoOrange}
                pastille="OM"
                fond="bg-[#ff7900]"
                couleurTexte="text-white"
              />
            )}
          </ul>
        ) : (
          <p className="mt-4 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
            Aucun numéro enregistré : NILE ne peut pas encore vous reverser vos
            gains. Renseignez au moins un numéro Mobile Money.
          </p>
        )}
        {infosPaiement.titulaire && (
          <p className="mt-3 text-etiquette-xs text-slate-500">
            Titulaire déclaré : {infosPaiement.titulaire}
          </p>
        )}
      </Carte>

      {/* Revenus des 7 derniers jours */}
      <Carte className="p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-titre-sm text-nile-800">Revenus des 7 derniers jours</h2>
            <p className="text-corps-sm text-slate-500">
              Commandes encaissables, annulations exclues.
            </p>
          </div>
          {maxJour > 0 && (
            <p className="text-corps-sm text-slate-500">
              Meilleur jour : <Prix montant={maxJour} className="font-semibold text-nile-800" />
            </p>
          )}
        </div>

        {maxJour === 0 ? (
          <p className="rounded border border-dashed border-contour-clair px-4 py-8 text-center text-corps-sm text-slate-500">
            Aucune vente sur les 7 derniers jours.
          </p>
        ) : (
          <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
            {serieJours.map((p, i) => (
              <div key={p.cle} className="group flex flex-1 flex-col items-center">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-nile-100 transition-all group-hover:bg-nile-300"
                    style={{ height: `${Math.max(hauteurs[i] ?? 0, p.valeur > 0 ? 4 : 0)}%` }}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface-inverse px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Prix montant={p.valeur} />
                    </span>
                  </div>
                </div>
                <span className="mt-3 text-[12px] font-medium capitalize text-slate-500">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </Carte>

      {/* Historique */}
      <HistoriqueTransactions transactions={finances.transactions} />

      <p className="text-corps-sm text-slate-500">
        Une question sur un règlement ?{" "}
        <Link href="/aide" className="font-semibold text-nile-700 hover:underline">
          Contactez le support
        </Link>
        .
      </p>
    </div>
  );
}

/** Numéro Mobile Money sur lequel le vendeur reçoit ses reversements. */
function NumeroReversement({
  libelle,
  numero,
  pastille,
  fond,
  couleurTexte,
}: {
  libelle: string;
  numero: string;
  pastille: string;
  fond: string;
  couleurTexte: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded border border-contour-carte bg-surface-basse px-4 py-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded ${fond}`}>
        <span className={`text-[10px] font-bold ${couleurTexte}`}>{pastille}</span>
      </span>
      <span className="min-w-0">
        <span className="block text-etiquette-md text-nile-800">{libelle}</span>
        <span className="block truncate text-corps-sm text-slate-600">{numero}</span>
      </span>
    </li>
  );
}

/**
 * Ligne du détail du solde. Un montant négatif est affiché en déduction.
 * Le montant ne se coupe jamais en fin de ligne : c'est le libellé qui passe
 * à la ligne, pour ne pas fractionner une somme d'argent.
 */
function LigneDetail({ libelle, valeur }: { libelle: string; valeur: number }) {
  const deduction = valeur < 0;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-slate-600">{libelle}</dt>
      <dd
        className={`whitespace-nowrap ${deduction ? "text-promo" : "font-semibold text-slate-900"}`}
      >
        {deduction && "− "}
        <Prix montant={Math.abs(valeur)} />
      </dd>
    </div>
  );
}
