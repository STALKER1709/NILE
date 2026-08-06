"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Recharge la page quand un statut a changé côté serveur — et seulement à ce
 * moment-là.
 *
 * Le composant n'interroge pas la page elle-même : il demande une signature
 * courte des données suivies, et n'appelle `router.refresh()` que si elle
 * diffère de la précédente. Sur des pages `force-dynamic`, un rechargement est
 * un rendu serveur complet ; le déclencher à intervalle fixe reviendrait à
 * faire payer de la data mobile à des acheteurs qui la paient cher, pour
 * réafficher le plus souvent la même chose.
 *
 * Deux économies supplémentaires, qui comptent bien plus que l'intervalle :
 *  - l'interrogation s'ARRÊTE quand l'onglet passe en arrière-plan, cas le
 *    plus fréquent sur mobile, et reprend au retour ;
 *  - l'appelant peut désactiver le suivi (`actif={false}`) quand plus rien ne
 *    peut bouger — toutes les commandes terminées, par exemple.
 */
export function RafraichirSiChange({
  signature,
  lire,
  intervalleMs = 45_000,
  actif = true,
}: {
  /** Signature calculée au rendu serveur : point de comparaison initial. */
  signature: string;
  /** Action serveur renvoyant la signature courante. */
  lire: () => Promise<string>;
  intervalleMs?: number;
  actif?: boolean;
}) {
  const router = useRouter();
  // Dans une ref et non un état : la modifier ne doit pas relancer l'effet,
  // ce qui remettrait le minuteur à zéro à chaque tour.
  const derniere = useRef(signature);

  // La signature rendue par le serveur fait foi après chaque rechargement :
  // sans cette remise à niveau, la page se rechargerait en boucle.
  useEffect(() => {
    derniere.current = signature;
  }, [signature]);

  useEffect(() => {
    if (!actif) return;
    let arrete = false;
    let minuteur: ReturnType<typeof setInterval> | null = null;

    async function verifier() {
      if (arrete || document.visibilityState !== "visible") return;
      try {
        const courante = await lire();
        if (arrete || courante === derniere.current) return;
        derniere.current = courante;
        router.refresh();
      } catch {
        // Réseau coupé, serveur momentanément indisponible : rien à signaler à
        // l'utilisateur, on retentera au tour suivant.
      }
    }

    function demarrer() {
      if (minuteur === null) minuteur = setInterval(verifier, intervalleMs);
    }
    function arreter() {
      if (minuteur !== null) {
        clearInterval(minuteur);
        minuteur = null;
      }
    }
    function surVisibilite() {
      if (document.visibilityState === "visible") {
        // Au retour sur l'onglet, on vérifie tout de suite : c'est le moment
        // où l'utilisateur regarde, et où l'information périmée se voit.
        void verifier();
        demarrer();
      } else {
        arreter();
      }
    }

    surVisibilite();
    document.addEventListener("visibilitychange", surVisibilite);
    return () => {
      arrete = true;
      arreter();
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [actif, intervalleMs, lire, router]);

  return null;
}
