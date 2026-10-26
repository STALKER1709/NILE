"use client";

import { useEffect, useState } from "react";

export const EVENEMENT_FAVORIS = "nile:favoris-total";

/** Émet le nouveau nombre de favoris vers tous les badges affichés. */
export function annoncerTotalFavoris(total: number): void {
  window.dispatchEvent(new CustomEvent(EVENEMENT_FAVORIS, { detail: { total } }));
}

/**
 * Pastille du nombre d'articles mis de côté.
 *
 * Rendue avec la valeur du serveur, puis resynchronisée à chaque navigation.
 * Le cœur étant un vrai formulaire, la valeur revient du serveur : le badge
 * n'invente jamais un compte, il ne fait que refléter le dernier connu.
 */
export function BadgeFavoris({
  initial,
  className,
}: {
  initial: number;
  className: string;
}) {
  const [nb, setNb] = useState(initial);

  useEffect(() => setNb(initial), [initial]);

  useEffect(() => {
    const h = (e: Event) => {
      const total = (e as CustomEvent<{ total: number }>).detail?.total;
      if (typeof total === "number" && Number.isFinite(total)) {
        setNb(Math.max(0, Math.floor(total)));
      }
    };
    window.addEventListener(EVENEMENT_FAVORIS, h);
    return () => window.removeEventListener(EVENEMENT_FAVORIS, h);
  }, []);

  if (nb <= 0) return null;
  const libelle = nb > 99 ? "99+" : String(nb);
  // `key={nb}` : le span est remonté à chaque changement, ce qui rejoue le pop.
  return (
    <span key={nb} className={`${className} animate-pop`}>
      {libelle}
    </span>
  );
}
