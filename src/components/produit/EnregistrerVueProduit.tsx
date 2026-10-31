"use client";

import { useEffect } from "react";

/**
 * Compte une consultation de fiche par onglet et par produit.
 * Aucun identifiant utilisateur ni donnée personnelle n'est envoyé.
 */
export function EnregistrerVueProduit({ produitId }: { produitId: string }) {
  useEffect(() => {
    const cle = `nile:consultation:${produitId}`;
    if (sessionStorage.getItem(cle)) return;

    let annule = false;
    fetch(`/api/produits/${encodeURIComponent(produitId)}/vue`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    })
      .then((reponse) => {
        if (reponse.ok && !annule) sessionStorage.setItem(cle, "1");
      })
      .catch(() => {
        // Une erreur réseau ne bloque jamais l'affichage de la fiche.
      });

    return () => {
      annule = true;
    };
  }, [produitId]);

  return null;
}
