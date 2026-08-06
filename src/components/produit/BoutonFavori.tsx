"use client";

import { useFormStatus } from "react-dom";
import { basculerFavoriAction } from "@/app/(compte)/favoris/actions";

/**
 * Cœur d'ajout aux favoris.
 *
 * Un vrai formulaire, pas un appel en JavaScript : il fonctionne même quand
 * les scripts n'ont pas chargé, ce qui arrive sur une connexion lente. Le
 * `useFormStatus` ne fait qu'ajouter le retour visuel quand ils sont là.
 *
 * `retour` est le chemin à revalider après la bascule — celui de la page d'où
 * part le clic, pour que le cœur s'y mette à jour sans rechargement manuel.
 */
export function BoutonFavori({
  produitId,
  enFavori,
  retour,
  taille = "md",
}: {
  produitId: string;
  enFavori: boolean;
  retour: string;
  taille?: "sm" | "md";
}) {
  return (
    <form action={basculerFavoriAction} className="contents">
      <input type="hidden" name="produitId" value={produitId} />
      <input type="hidden" name="retour" value={retour} />
      <Coeur enFavori={enFavori} taille={taille} />
    </form>
  );
}

function Coeur({ enFavori, taille }: { enFavori: boolean; taille: "sm" | "md" }) {
  const { pending } = useFormStatus();
  const cote = taille === "sm" ? 34 : 40;
  const icone = taille === "sm" ? 17 : 20;

  return (
    <button
      type="submit"
      disabled={pending}
      // L'état est porté par `aria-pressed` : un lecteur d'écran annonce
      // « activé » plutôt que de laisser deviner la couleur du cœur.
      aria-pressed={enFavori}
      aria-label={enFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={enFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{ width: cote, height: cote }}
      className={`grid shrink-0 place-items-center rounded-full border transition-all ${
        enFavori
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-contour-carte bg-white/90 text-slate-400 hover:border-red-200 hover:text-red-500"
      } ${pending ? "scale-90 opacity-60" : ""}`}
    >
      <svg
        width={icone}
        height={icone}
        viewBox="0 0 24 24"
        // Rempli quand il est actif, en contour sinon : la différence se voit
        // d'un coup d'œil sur une vignette, là où une nuance de couleur seule
        // passerait inaperçue.
        fill={enFavori ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M12 20.5 4.2 13a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1A4.8 4.8 0 0 1 19.8 13z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
