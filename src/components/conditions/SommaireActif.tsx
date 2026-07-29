"use client";

import { useEffect, useState } from "react";

/**
 * Sommaire des CGV avec surlignage de la section en cours de lecture.
 *
 * Rendu côté client uniquement pour l'état actif : les liens eux-mêmes sont de
 * simples ancres, donc le sommaire reste utilisable sans JavaScript.
 */
export function SommaireActif({
  entrees,
}: {
  entrees: { ancre: string; libelle: string }[];
}) {
  const [actif, setActif] = useState<string | null>(entrees[0]?.ancre ?? null);

  useEffect(() => {
    const sections = entrees
      .map((e) => document.getElementById(e.ancre))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // La section active est la dernière dont le haut est passé sous la barre
    // collante ; à défaut (tout en haut de page), la première.
    const recalculer = () => {
      const seuil = 140;
      let courante = sections[0]?.id ?? null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= seuil) courante = section.id;
      }
      // En bas de page, la dernière section est forcément celle qu'on lit.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        courante = sections[sections.length - 1]?.id ?? courante;
      }
      setActif(courante);
    };

    recalculer();
    window.addEventListener("scroll", recalculer, { passive: true });
    window.addEventListener("resize", recalculer);
    return () => {
      window.removeEventListener("scroll", recalculer);
      window.removeEventListener("resize", recalculer);
    };
  }, [entrees]);

  return (
    <nav className="flex flex-col border-l border-contour-carte px-4 pb-4 lg:px-0 lg:pb-0">
      {entrees.map((e) => {
        const estActif = actif === e.ancre;
        return (
          <a
            key={e.ancre}
            href={`#${e.ancre}`}
            aria-current={estActif ? "true" : undefined}
            className={`-ml-px border-l-2 py-2 pl-3 text-corps-sm transition-colors ${
              estActif
                ? "border-nile-700 bg-nile-50 font-semibold text-nile-800"
                : "border-transparent text-slate-600 hover:border-nile-700 hover:bg-surface-subtile hover:text-nile-800"
            }`}
          >
            {e.libelle}
          </a>
        );
      })}
    </nav>
  );
}
