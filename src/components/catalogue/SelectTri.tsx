"use client";

/**
 * Sélecteur de tri du catalogue : soumet le formulaire dès que la valeur
 * change, sans bouton de validation.
 *
 * Le formulaire parent reste un vrai GET : le tri se lit dans l'URL, donc il
 * survit à un rechargement et se partage par lien.
 */
export function SelectTri({
  valeur,
  className = "",
}: {
  /** Valeur actuellement sélectionnée (vient de l'URL). */
  valeur: string;
  className?: string;
}) {
  return (
    <select
      id="tri"
      name="tri"
      defaultValue={valeur}
      className={className}
      onChange={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        // requestSubmit déclenche la soumission comme un clic sur le bouton ;
        // repli sur submit() pour les navigateurs qui ne le connaissent pas.
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.submit();
      }}
    >
      <option value="recent">Plus récent</option>
      <option value="populaire">Mieux notés</option>
      <option value="prix_asc">Prix croissant</option>
      <option value="prix_desc">Prix décroissant</option>
    </select>
  );
}
