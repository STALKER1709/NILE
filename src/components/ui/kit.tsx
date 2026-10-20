import Link from "next/link";
import type { ReactNode } from "react";
import { formaterXAF } from "@/lib/money";

/* ------------------------------- Formulaires ------------------------------- */

// Champ de saisie : fond blanc, bordure nette, transition douce, focus émeraude NILE avec halo subtil
export const champClass =
  "block w-full rounded-lg border border-slate-300/80 bg-white px-3.5 py-2.5 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:border-nile-600 focus:outline-none focus:ring-4 focus:ring-nile-700/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]";

export const labelClass =
  "block text-etiquette-md text-slate-700 font-medium mb-1.5";

/* --------------------------------- Boutons --------------------------------- */

type Variante = "primaire" | "accent" | "secondaire" | "danger" | "ghost";
type Taille = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primaire:
    "bg-nile-700 text-white font-medium hover:bg-nile-800 shadow-sm hover:shadow active:scale-[0.98]",
  accent:
    "bg-accent text-slate-950 font-bold hover:bg-accent-dark hover:text-white shadow-sm hover:shadow active:scale-[0.98]",
  secondaire:
    "border border-slate-300/90 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 font-medium shadow-xs active:scale-[0.98]",
  danger:
    "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 font-medium active:scale-[0.98]",
  ghost:
    "text-slate-700 hover:text-nile-800 hover:bg-slate-100/70 font-medium",
};

const TAILLES: Record<Taille, string> = {
  sm: "px-3 py-1.5 text-etiquette-xs rounded-md",
  md: "px-4 py-2 text-etiquette-md rounded-lg",
  lg: "px-5 py-2.5 text-corps-md font-semibold rounded-lg",
};

export function btn(
  variante: Variante = "primaire",
  taille: Taille = "md",
  extra = "",
): string {
  return `inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`;
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
    <section
      id={id}
      className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] transition-shadow duration-200 ${className}`}
    >
      {children}
    </section>
  );
}

/* --------------------------------- Badges ---------------------------------- */

type TonBadge = "neutre" | "vert" | "ambre" | "rouge" | "bleu";

const TONS: Record<TonBadge, { conteneur: string; point: string }> = {
  neutre: {
    conteneur: "bg-slate-100 text-slate-700 border-slate-200/60",
    point: "bg-slate-400",
  },
  vert: {
    conteneur: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    point: "bg-emerald-500",
  },
  ambre: {
    conteneur: "bg-amber-50 text-amber-800 border-amber-200/60",
    point: "bg-amber-500",
  },
  rouge: {
    conteneur: "bg-rose-50 text-rose-800 border-rose-200/60",
    point: "bg-rose-500",
  },
  bleu: {
    conteneur: "bg-sky-50 text-sky-800 border-sky-200/60",
    point: "bg-sky-500",
  },
};

export function Badge({
  children,
  ton = "neutre",
  avecPoint = false,
}: {
  children: ReactNode;
  ton?: TonBadge;
  avecPoint?: boolean;
}) {
  const conf = TONS[ton];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-etiquette-xs font-medium tracking-wide ${conf.conteneur}`}
    >
      {avecPoint && <span className={`h-1.5 w-1.5 rounded-full ${conf.point}`} />}
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
  return <span className={`tabular-nums font-semibold tracking-tight ${className}`}>{formaterXAF(montant)}</span>;
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
  const cls = taille === "md" ? "text-base" : "text-xs";
  return (
    <span className={`${cls} flex items-center text-amber-400`} aria-label={`Note ${note} sur 5`}>
      {"★".repeat(pleines)}
      <span className="text-slate-200">{"★".repeat(5 - pleines)}</span>
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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <p className="font-semibold text-slate-800">{titre}</p>
      {children && <div className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">{children}</div>}
    </div>
  );
}
