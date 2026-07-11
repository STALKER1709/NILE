"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Bouton de soumission avec état d'attente : se désactive et affiche un
 * libellé de patience pendant l'envoi du formulaire (Server Action).
 * Évite les doubles soumissions (double commande, double inscription…) et
 * rassure sur réseau lent. À utiliser DANS un <form action={...}>.
 */
export function BoutonSoumettre({
  children,
  enCours = "Un instant…",
  className,
}: {
  children: ReactNode;
  /** Libellé affiché pendant l'envoi. */
  enCours?: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? (
        <>
          <IconeAttente />
          {enCours}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function IconeAttente() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}
