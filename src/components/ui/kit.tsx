import Link from "next/link";
import type { ReactNode } from "react";
import { formaterXAF } from "@/lib/money";

/* ------------------------------- Formulaires ------------------------------- */

export const champClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-nile-600 focus:outline-none focus:ring-2 focus:ring-nile-500/25";

export const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

/* --------------------------------- Boutons --------------------------------- */

type Variante = "primaire" | "accent" | "secondaire" | "danger" | "ghost";
type Taille = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primaire: "bg-nile-700 text-white hover:bg-nile-800 shadow-sm border border-nile-800/30",
  accent: "bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-nile-950 hover:brightness-105 shadow-sm border border-amber-600/20",
  secondaire: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-xs",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300",
  ghost: "text-nile-700 hover:bg-nile-50 font-semibold",
};

const TAILLES: Record<Taille, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-5 py-3 text-base rounded-xl",
};

export function btn(
  variante: Variante = "primaire",
  taille: Taille = "md",
  extra = "",
): string {
  return `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`;
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
    <section id={id} className={`rounded-xl2 border border-slate-200/80 bg-white shadow-carte ${className}`}>
      {children}
    </section>
  );
}

/* --------------------------------- Badges ---------------------------------- */

type TonBadge = "neutre" | "vert" | "ambre" | "rouge" | "bleu";

const TONS: Record<TonBadge, string> = {
  neutre: "bg-slate-100 text-slate-700 border border-slate-200/60",
  vert: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
  ambre: "bg-amber-50 text-amber-900 border border-amber-200/60",
  rouge: "bg-rose-50 text-rose-800 border border-rose-200/60",
  bleu: "bg-sky-50 text-sky-800 border border-sky-200/60",
};

export function Badge({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: TonBadge;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONS[ton]}`}>
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
    <div className="rounded-xl2 border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-3 text-slate-300"
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
