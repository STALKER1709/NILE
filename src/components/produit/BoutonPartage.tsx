"use client";

import { useState } from "react";

/**
 * Partage d'un produit. Utilise le partage natif du téléphone si disponible
 * (Android/iOS), sinon ouvre WhatsApp (canal roi au Cameroun). L'URL est lue
 * côté client pour être toujours correcte, quel que soit le domaine.
 */
export function BoutonPartage({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const url = window.location.href;
    const texte = `${titre} — sur NILE`;
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: texte, url });
        return;
      } catch {
        // partage annulé par l'utilisateur : on ne fait rien de plus.
        return;
      }
    }
    // Repli : ouvre WhatsApp avec le message pré-rempli.
    const lien = `https://wa.me/?text=${encodeURIComponent(`${texte} ${url}`)}`;
    window.open(lien, "_blank", "noopener,noreferrer");
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={partager}
      className="inline-flex items-center gap-1.5 rounded border border-contour-carte px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-nile hover:text-nile"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.24-8.24s8.23 3.7 8.23 8.24-3.69 8.24-8.23 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.51.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
      </svg>
      {copie ? "WhatsApp ouvert" : "Partager"}
    </button>
  );
}
