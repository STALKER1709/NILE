"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rafraichirPaiementAction } from "@/app/(compte)/commandes/actions";

/**
 * Interroge le serveur pendant que l'acheteur valide sur son téléphone.
 *
 * Sans ça, la page promet « se met à jour dès la confirmation » alors que rien
 * ne la met à jour : le seul mécanisme est le webhook du fournisseur, qui peut
 * ne jamais arriver. Une commande payée resterait affichée « en attente »
 * indéfiniment.
 *
 * Chaque tour est un appel serveur qui redemande le statut au fournisseur ; la
 * page n'est rechargée que lorsqu'il a réellement basculé — la data mobile est
 * chère ici, on ne re-rend pas une page entière toutes les 10 s pour rien.
 */

/** Rythme conseillé par la documentation du fournisseur. */
const INTERVALLE_MS = 10_000;
/**
 * Au-delà, le fournisseur a lui-même expiré la transaction (timeout 10 min) :
 * continuer à l'interroger ne peut plus rien apprendre.
 */
const DUREE_MAX_MS = 10 * 60 * 1000;

export function SuiviPaiement({ commandeId }: { commandeId: string }) {
  const router = useRouter();
  const [expire, setExpire] = useState(false);

  useEffect(() => {
    let actif = true;
    const debut = Date.now();

    async function verifier() {
      // `actif` est retesté après l'await : le composant a pu être démonté
      // pendant l'appel réseau.
      if (!actif) return;
      try {
        const { termine } = await rafraichirPaiementAction(commandeId);
        if (!actif) return;
        if (termine) {
          clearInterval(minuteur);
          router.refresh();
          return;
        }
      } catch {
        // Réseau coupé, serveur momentanément indisponible : on ne montre rien
        // et on retentera au tour suivant. L'acheteur n'a rien à faire de cette
        // information, et son paiement suit son cours de toute façon.
        return;
      }
      if (Date.now() - debut > DUREE_MAX_MS) {
        clearInterval(minuteur);
        setExpire(true);
      }
    }

    const minuteur = setInterval(verifier, INTERVALLE_MS);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, [commandeId, router]);

  if (!expire) return null;

  return (
    <p className="text-corps-sm text-slate-500">
      Sans nouvelle depuis 10 minutes.{" "}
      <button
        type="button"
        onClick={() => router.refresh()}
        className="font-semibold text-nile-700 underline underline-offset-2"
      >
        Actualiser
      </button>{" "}
      — si vous avez validé le paiement sans que rien ne change, contactez-nous.
    </p>
  );
}
