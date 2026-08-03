/**
 * Choix de l'opérateur Mobile Money.
 *
 * Réclamé uniquement par les fournisseurs qui sollicitent directement le
 * portefeuille du client (pas de page de paiement hébergée) : il faut alors
 * savoir QUEL opérateur interroger.
 *
 * Volontairement SANS attribut `required` : ces boutons vivent dans le même
 * formulaire que le choix du mode de paiement, et un `required` HTML sur un
 * groupe de radios s'applique quel que soit le mode retenu — il bloquerait
 * donc aussi les commandes payées à la livraison, qui n'ont pas d'opérateur.
 * La vérification est faite côté serveur, où le mode est connu.
 */
export function ChoixOperateur({
  telephone,
  note,
}: {
  /** Numéro sur lequel la demande de paiement sera envoyée. */
  telephone: string;
  /** Précision affichée sous les boutons (contexte propre à l'écran). */
  note?: string;
}) {
  return (
    <fieldset className="rounded border border-contour-carte p-4">
      <legend className="px-1 text-etiquette-md text-slate-900">
        Votre opérateur Mobile Money
      </legend>
      <p className="mb-3 text-corps-sm text-slate-500">
        La demande de paiement arrivera sur le <strong>{telephone}</strong>.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Operateur
          valeur="mtn"
          libelle="MoMo"
          pastille="MTN"
          fond="bg-[#ffcb05]"
          couleurTexte="text-black"
        />
        <Operateur
          valeur="orange"
          libelle="Orange Money"
          pastille="OM"
          fond="bg-[#ff7900]"
          couleurTexte="text-white"
        />
      </div>
      {note && <p className="mt-3 text-etiquette-xs text-slate-500">{note}</p>}
    </fieldset>
  );
}

function Operateur({
  valeur,
  libelle,
  pastille,
  fond,
  couleurTexte,
}: {
  valeur: string;
  libelle: string;
  pastille: string;
  fond: string;
  couleurTexte: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded border border-contour-carte px-3 py-2.5 transition-colors hover:bg-surface-basse has-[:checked]:border-nile-700 has-[:checked]:bg-nile-50">
      <input type="radio" name="operateur" value={valeur} className="accent-nile-700" />
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded ${fond} text-[10px] font-bold ${couleurTexte}`}
      >
        {pastille}
      </span>
      <span className="text-corps-sm font-semibold text-slate-900">{libelle}</span>
    </label>
  );
}
