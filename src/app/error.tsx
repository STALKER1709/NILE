"use client";

import { useEffect } from "react";

/**
 * Frontière d'erreur : capture les erreurs de rendu d'une page et affiche un
 * message clair, sans exposer de détail technique à l'utilisateur.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalisation explicite (pas d'erreur avalée en silence).
    console.error("Erreur de page:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Une erreur est survenue</h1>
      <p className="text-slate-600">
        Désolé, quelque chose s'est mal passé. Vous pouvez réessayer.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
        >
          Réessayer
        </button>
        <a href="/" className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Accueil
        </a>
      </div>
    </div>
  );
}
