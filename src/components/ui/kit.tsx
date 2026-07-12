import Link from "next/link";
import type { ReactNode } from "react";
import { formaterXAF } from "@/lib/money";

/* ------------------------------- Formulaires ------------------------------- */

export const champClass =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-nile focus:outline-none focus:ring-2 focus:ring-nile/30";

export const labelClass = "block text-sm font-medium text-gray-700";

/* --------------------------------- Boutons --------------------------------- */

type Variante = "primaire" | "accent" | "secondaire" | "danger" | "ghost";
type Taille = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primaire: "bg-nile text-white hover:bg-nile-dark shadow-sm",
  accent: "bg-accent font-semibold text-nile-950 hover:bg-accent-dark shadow-sm",
  secondaire: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  ghost: "text-nile hover:bg-nile-50",
};

const TAILLES: Record<Taille, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function btn(
  variante: Variante = "primaire",
  taille: Taille = "md",
  extra = "",
): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`;
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
  return (
    <section id={id} className={`rounded-xl2 border border-gray-100 bg-white shadow-carte ${className}`}>
      {children}
    </section>
  );
}

/* --------------------------------- Badges ---------------------------------- */

type TonBadge = "neutre" | "vert" | "ambre" | "rouge" | "bleu";

const TONS: Record<TonBadge, string> = {
  neutre: "bg-gray-100 text-gray-700",
  vert: "bg-emerald-100 text-emerald-800",
  ambre: "bg-amber-100 text-amber-800",
  rouge: "bg-red-100 text-red-700",
  bleu: "bg-sky-100 text-sky-800",
};

export function Badge({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: TonBadge;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONS[ton]}`}>
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
    <span className={`${cls} text-amber-400`} aria-label={`Note ${note} sur 5`}>
      {"★".repeat(pleines)}
      <span className="text-gray-300">{"★".repeat(5 - pleines)}</span>
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
    <div className="rounded-xl2 border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-3 text-gray-300"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <p className="font-medium text-gray-700">{titre}</p>
      {children && <div className="mt-2 text-sm text-gray-500">{children}</div>}
    </div>
  );
}
