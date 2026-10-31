"use client";

export function BoutonImprimer({ libelle = "Imprimer" }: { libelle?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-bold text-[#0B192C] shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 print:hidden"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 14h10v7H7z" strokeLinejoin="round"/>
      </svg>
      {libelle}
    </button>
  );
}
