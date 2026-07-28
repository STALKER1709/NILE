import Link from "next/link";
import type { ReactNode } from "react";
import { formaterXAF } from "@/lib/money";

/* ------------------------------- Formulaires ------------------------------- */

// Champ : fond blanc, bordure slate-200, typographie corps. Au focus, la
// bordure passe au vert primaire avec un halo diffus de 2px à 10 %.
export const champClass =
  "block w-full rounded border border-contour-carte bg-white px-3.5 py-2.5 text-[16px] leading-6 text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-nile-700 focus:outline-none focus:ring-2 focus:ring-nile-700/10";

export const labelClass =
  "block text-etiquette-md text-slate-700 mb-1";

/* --------------------------------- Boutons --------------------------------- */

type Variante = "primaire" | "accent" | "secondaire" | "danger" | "ghost";
type Taille = "sm" | "md" | "lg";

// Primaire : aplat vert primaire, texte blanc. Secondaire : fond transparent,
// bordure vert primaire. Tertiaire (ghost) : texte seul, survol slate subtil.
const VARIANTES: Record<Variante, string> = {
  primaire: "bg-nile-700 text-white hover:bg-nile-800",
  accent: "bg-accent text-accent-sur hover:bg-accent-dark hover:text-white",
  secondaire: "border border-nile-700 bg-transparent text-nile-700 hover:bg-nile-50",
  danger: "border border-promo/30 bg-promo-conteneur text-promo-dark hover:bg-promo hover:text-white",
  ghost: "text-nile-700 hover:bg-surface-subtile",
};

// Rayon uniforme de 8px : boutons, champs et cartes parlent la même langue.
const TAILLES: Record<Taille, string> = {
  sm: "px-3 py-1.5 text-etiquette-xs rounded",
  md: "px-4 py-2.5 text-etiquette-md rounded",
  lg: "px-5 py-3 text-corps-md font-semibold rounded",
};

export function btn(
  variante: Variante = "primaire",
  taille: Taille = "md",
  extra = "",
): string {
  return `inline-flex items-center justify-center gap-2 transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`;
}

/* --------------------------------- Cartes ---------------------------------- */

export function Carte({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  // Niveau 1 : blanc + bordure 1px. Pas d'ombre — la profondeur vient des
  // couches tonales, pas de l'élévation.
  return (
    <section id={id} className={`rounded border border-contour-carte bg-white ${className}`}>
      {children}
    </section>
  );
}

/* --------------------------------- Badges ---------------------------------- */

type TonBadge = "neutre" | "vert" | "ambre" | "rouge" | "bleu";

// Puces : forme pilule (contraste avec les 8px des conteneurs), teintes peu
// saturées et texte foncé pour une lisibilité maximale.
const TONS: Record<TonBadge, string> = {
  neutre: "bg-surface-subtile text-slate-700",
  vert: "bg-nile-100 text-nile-800",
  ambre: "bg-accent-fixe text-accent-sur",
  rouge: "bg-promo-conteneur text-promo-dark",
  bleu: "bg-tertiaire-fixe text-tertiaire",
};

export function Badge({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: TonBadge;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-etiquette-xs ${TONS[ton]}`}>
      {children}
    </span>
  );
}

/* ---------------------------------- Prix ----------------------------------- */

export function Prix({
  montant,
  className = "",
}: {
  montant: number;
  className?: string;
}) {
  return <span className={className}>{formaterXAF(montant)}</span>;
}

/* -------------------------------- Étoiles ---------------------------------- */

export function Etoiles({
  note,
  taille = "sm",
}: {
  note: number;
  taille?: "sm" | "md";
}) {
  const pleines = Math.round(note);
  const cls = taille === "md" ? "text-base" : "text-sm";
  return (
    <span className={`${cls} text-accent-dark`} aria-label={`Note ${note} sur 5`}>
      {"★".repeat(pleines)}
      <span className="text-slate-300">{"★".repeat(5 - pleines)}</span>
    </span>
  );
}

/* ------------------------------- État vide --------------------------------- */

export function EtatVide({
  titre,
  children,
}: {
  titre: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-contour-clair bg-white px-6 py-12 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-3 text-contour-clair"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <p className="font-medium text-slate-700">{titre}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}
