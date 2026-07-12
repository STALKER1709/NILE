"use client";

import { useEffect, useState } from "react";

export const EVENEMENT_PANIER = "nile:panier-total";

/** Émet le nouveau total d'articles du panier vers tous les badges affichés. */
export function annoncerTotalPanier(total: number): void {
  window.dispatchEvent(new CustomEvent(EVENEMENT_PANIER, { detail: { total } }));
}

/**
 * Pastille du nombre d'articles du panier. Rendue avec la valeur serveur, puis
 * mise à jour instantanément (sans round-trip) quand un BoutonPanier annonce
 * un nouveau total.
 */
export function BadgePanier({
  initial,
  className,
}: {
  initial: number;
  className: string;
}) {
  const [nb, setNb] = useState(initial);

  // Re-synchronise quand une navigation apporte une nouvelle valeur serveur.
  useEffect(() => setNb(initial), [initial]);

  useEffect(() => {
    const h = (e: Event) =>
      setNb((e as CustomEvent<{ total: number }>).detail.total);
    window.addEventListener(EVENEMENT_PANIER, h);
    return () => window.removeEventListener(EVENEMENT_PANIER, h);
  }, []);

  if (nb <= 0) return null;
  // `key={nb}` : le span est remonté à chaque changement, ce qui rejoue le pop.
  return (
    <span key={nb} className={`${className} animate-pop`}>
      {nb}
    </span>
  );
}
