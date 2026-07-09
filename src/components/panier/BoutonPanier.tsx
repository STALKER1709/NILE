"use client";

import { useState } from "react";
import {
  incrementerPanierAction,
  decrementerPanierAction,
} from "@/app/(compte)/panier/actions";
import { annoncerTotalPanier } from "@/components/panier/BadgePanier";
import type { EtatBoutonPanier } from "@/app/(compte)/panier/actions";

/**
 * Bouton d'ajout au panier « supermarché » : « Ajouter » au premier clic, puis
 * compteur [− qté +] sans quitter la page. La quantité affichée est toujours
 * celle confirmée par le serveur (pas d'optimisme aveugle sur le stock).
 */
export function BoutonPanier({
  produitId,
  stock,
  quantiteInitiale,
  taille = "sm",
}: {
  produitId: string;
  stock: number;
  quantiteInitiale: number;
  taille?: "sm" | "lg";
}) {
  const [quantite, setQuantite] = useState(quantiteInitiale);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enRupture = stock === 0;
  const grand = taille === "lg";

  async function appliquer(
    action: (id: string) => Promise<EtatBoutonPanier>,
  ) {
    if (enCours) return;
    setMessage(null);
    setEnCours(true);
    try {
      const res = await action(produitId);
      if (res.ok) {
        setQuantite(res.quantite);
        // Met à jour les badges panier (en-tête + nav mobile) sans round-trip.
        annoncerTotalPanier(res.totalArticles);
      } else {
        setMessage(res.message);
      }
    } catch {
      setMessage("Connexion instable. Réessaie.");
    } finally {
      setEnCours(false);
    }
  }

  const hBtn = grand ? "h-12 text-base" : "h-9 text-sm";
  const hRond = grand ? "h-12 w-12 text-xl" : "h-9 w-9 text-base";

  if (enRupture) {
    return (
      <span
        className={`inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-100 font-medium text-gray-400 ${hBtn}`}
      >
        Rupture de stock
      </span>
    );
  }

  if (quantite === 0) {
    return (
      <span className="block w-full">
        <button
          type="button"
          onClick={() => appliquer(incrementerPanierAction)}
          disabled={enCours}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60 ${hBtn}`}
        >
          <IconePanierPlus />
          Ajouter
        </button>
        {message && <MessageErreur texte={message} />}
      </span>
    );
  }

  return (
    <span className="block w-full">
      <span
        className={`flex w-full items-stretch justify-between rounded-lg border-2 border-accent bg-white ${grand ? "" : ""}`}
      >
        <button
          type="button"
          onClick={() => appliquer(decrementerPanierAction)}
          disabled={enCours}
          aria-label="Retirer une unité"
          className={`grid place-items-center rounded-l-md font-bold text-accent-dark hover:bg-amber-50 disabled:opacity-50 ${hRond}`}
        >
          {quantite === 1 ? <IconePoubelle grand={grand} /> : "−"}
        </button>
        <span
          className={`grid flex-1 place-items-center font-bold text-gray-900 ${grand ? "text-lg" : "text-sm"}`}
          aria-live="polite"
        >
          {enCours ? "…" : quantite}
        </span>
        <button
          type="button"
          onClick={() => appliquer(incrementerPanierAction)}
          disabled={enCours || quantite >= stock}
          aria-label="Ajouter une unité"
          className={`grid place-items-center rounded-r-md font-bold text-accent-dark hover:bg-amber-50 disabled:opacity-40 ${hRond}`}
        >
          +
        </button>
      </span>
      {quantite >= stock && !message && (
        <span className="mt-1 block text-center text-[11px] text-gray-400">
          Stock maximum atteint
        </span>
      )}
      {message && <MessageErreur texte={message} />}
    </span>
  );
}

function MessageErreur({ texte }: { texte: string }) {
  return (
    <span className="mt-1 block text-center text-[11px] font-medium text-red-600">
      {texte}
    </span>
  );
}

function IconePanierPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

function IconePoubelle({ grand }: { grand: boolean }) {
  const t = grand ? 18 : 14;
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
