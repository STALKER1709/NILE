import Link from "next/link";
import type { ReactNode } from "react";
import { formaterXAF } from "@/lib/money";

export const champClass = "block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700/10";
export const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

type Variante = "primaire" | "accent" | "secondaire" | "danger" | "ghost";
type Taille = "sm" | "md" | "lg";
const VARIANTES: Record<Variante, string> = {
  primaire: "bg-blue-900 text-white font-semibold hover:bg-blue-950 active:bg-blue-950",
  accent: "bg-amber-400 text-blue-950 font-bold hover:bg-amber-300 active:bg-amber-500",
  secondaire: "border border-stone-300 bg-white text-slate-800 font-semibold hover:border-blue-300 hover:bg-blue-50",
  danger: "border border-red-200 bg-red-50 text-red-700 font-semibold hover:border-red-300 hover:bg-red-100",
  ghost: "text-slate-600 font-semibold hover:bg-blue-50 hover:text-blue-900",
};
const TAILLES: Record<Taille, string> = {
  sm: "min-h-9 rounded-lg px-3 py-2 text-xs",
  md: "min-h-10 rounded-xl px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-5 py-3 text-sm",
};
export function btn(variante: Variante = "primaire", taille: Taille = "md", extra = ""): string {
  return `inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`;
}

export function Carte({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-2xl border border-stone-200 bg-white transition-colors duration-200 ${className}`}>{children}</section>;
}

type TonBadge = "neutre" | "vert" | "ambre" | "rouge" | "bleu";
const TONS: Record<TonBadge, { conteneur: string; point: string }> = {
  neutre: { conteneur: "border-stone-200 bg-stone-100 text-slate-700", point: "bg-slate-400" },
  vert: { conteneur: "border-emerald-200 bg-emerald-50 text-emerald-800", point: "bg-emerald-500" },
  ambre: { conteneur: "border-amber-200 bg-amber-50 text-amber-900", point: "bg-amber-500" },
  rouge: { conteneur: "border-red-200 bg-red-50 text-red-800", point: "bg-red-500" },
  bleu: { conteneur: "border-blue-200 bg-blue-50 text-blue-800", point: "bg-blue-500" },
};
export function Badge({ children, ton = "neutre", avecPoint = false }: { children: ReactNode; ton?: TonBadge; avecPoint?: boolean }) {
  const conf = TONS[ton];
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${conf.conteneur}`}>{avecPoint && <span className={`h-1.5 w-1.5 rounded-full ${conf.point}`} />}{children}</span>;
}
export function Prix({ montant, className = "" }: { montant: number; className?: string }) {
  return <span className={`font-semibold tracking-tight tabular-nums ${className}`}>{formaterXAF(montant)}</span>;
}
export function Etoiles({ note, taille = "sm" }: { note: number; taille?: "sm" | "md" }) {
  const pleines = Math.round(note);
  const cls = taille === "md" ? "text-base" : "text-xs";
  return <span className={`${cls} flex items-center text-amber-500`} aria-label={`Note ${note} sur 5`}>{"★".repeat(pleines)}<span className="text-stone-200">{"★".repeat(5 - pleines)}</span></span>;
}
export function EtatVide({ titre, children }: { titre: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-800"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
    <p className="font-semibold text-slate-900">{titre}</p>{children && <div className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{children}</div>}
  </div>;
}
