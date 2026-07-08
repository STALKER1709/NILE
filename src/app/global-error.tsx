"use client";

import { useEffect } from "react";

/**
 * Frontière d'erreur racine (remplace le layout si l'erreur survient très haut).
 * Doit rendre ses propres <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1>Une erreur est survenue</h1>
        <p>Veuillez réessayer.</p>
        <button onClick={reset} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
