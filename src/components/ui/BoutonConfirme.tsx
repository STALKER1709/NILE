"use client";

import { useFormStatus } from "react-dom";

/**
 * Bouton de soumission pour une action destructive : demande confirmation
 * avant d'envoyer le formulaire, et se désactive pendant l'envoi.
 *
 * Sans JavaScript, la confirmation ne s'affiche pas mais le formulaire reste
 * fonctionnel : l'action serveur revérifie systématiquement les droits.
 */
export function BoutonConfirme({
  question,
  children,
  className = "",
  enCours = "…",
  titre,
}: {
  /** Texte affiché dans la demande de confirmation. */
  question: string;
  children: React.ReactNode;
  className?: string;
  enCours?: React.ReactNode;
  titre?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={titre}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? enCours : children}
    </button>
  );
}
