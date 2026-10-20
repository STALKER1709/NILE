/**
 * Choix de l'opérateur Mobile Money.
 * Les vrais logos des opérateurs sont utilisés dans le choix de paiement.
 */
export function ChoixOperateur({
  telephone,
  note,
  valeurInitiale,
}: {
  telephone: string;
  note?: string;
  valeurInitiale?: string;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <legend className="px-2 text-base font-bold tracking-tight text-slate-900">
        Votre opérateur Mobile Money
      </legend>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        La demande de paiement arrivera sur le <strong className="font-semibold text-slate-900">{telephone}</strong>.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Operateur
          valeur="mtn"
          libelle="MTN Mobile Money"
          description="Paiement via MTN MoMo"
          logo="https://commons.wikimedia.org/wiki/Special:Redirect/file/MTN_2022_logo.svg"
          choisi={valeurInitiale === "mtn"}
        />
        <Operateur
          valeur="orange"
          libelle="Orange Money"
          description="Paiement via Orange Money"
          logo="https://cdn.simpleicons.org/orange"
          choisi={valeurInitiale === "orange"}
        />
      </div>
      {note && <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p>}
    </fieldset>
  );
}

function Operateur({
  valeur,
  libelle,
  description,
  logo,
  choisi,
}: {
  valeur: string;
  libelle: string;
  description: string;
  logo: string;
  choisi?: boolean;
}) {
  return (
    <label className="group relative flex min-h-[88px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-slate-50 has-[:checked]:border-[#1e3a8a] has-[:checked]:bg-blue-50/70 has-[:checked]:ring-2 has-[:checked]:ring-[#1e3a8a]/15">
      <input type="radio" name="operateur" value={valeur} defaultChecked={choisi} className="h-4 w-4 shrink-0 accent-[#1e3a8a]" />
      <span className="grid h-12 w-14 shrink-0 place-items-center rounded-lg border border-slate-100 bg-white p-1.5">
        {/* Logos de marque officiels, affichés sans recoloration. */}
        <img src={logo} alt={valeur === "mtn" ? "Logo MTN" : "Logo Orange"} className="max-h-9 w-full object-contain" loading="eager" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">{libelle}</span>
        <span className="mt-1 block text-xs leading-4 text-slate-500">{description}</span>
      </span>
      <span className="absolute right-3 top-3 hidden h-2 w-2 rounded-full bg-[#1e3a8a] group-has-[:checked]:block" aria-hidden="true" />
    </label>
  );
}
