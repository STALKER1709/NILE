"use client";

import { useEffect, useState } from "react";

/**
 * Bouton flottant « revenir en haut », affiché seulement après un défilement
 * notable pour ne pas encombrer le premier écran. Il se place au-dessus de la
 * bulle WhatsApp (elle-même en bas à droite).
 */
export function RetourHaut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const surDefilement = () => setVisible(window.scrollY > 600);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Revenir en haut de la page"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-[8.25rem] right-3 z-40 grid h-11 w-11 animate-apparition place-items-center rounded-full bg-nile-conteneur text-white shadow-flottant transition hover:bg-nile-dark sm:bottom-[4.75rem] sm:right-5"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
