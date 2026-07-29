"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Carrousel léger : défilement natif avec accroche (scroll-snap), avance
 * automatique, pause au survol et au toucher, points de navigation.
 */
export function Carrousel({
  children,
  etiquette,
  intervalleMs = 6000,
}: {
  children: ReactNode;
  etiquette: string;
  intervalleMs?: number;
}) {
  const slides = Children.toArray(children);
  const piste = useRef<HTMLDivElement>(null);
  const enPause = useRef(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const minuteur = setInterval(() => {
      const el = piste.current;
      if (!el || enPause.current) return;
      const courant = Math.round(el.scrollLeft / el.clientWidth);
      const suivant = (courant + 1) % slides.length;
      el.scrollTo({ left: suivant * el.clientWidth, behavior: "smooth" });
    }, intervalleMs);
    return () => clearInterval(minuteur);
  }, [slides.length, intervalleMs]);

  function surDefilement() {
    const el = piste.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function aller(i: number) {
    const el = piste.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section
      aria-roledescription="carrousel"
      aria-label={etiquette}
      className="relative"
      onMouseEnter={() => (enPause.current = true)}
      onMouseLeave={() => (enPause.current = false)}
      onTouchStart={() => (enPause.current = true)}
      onTouchEnd={() => (enPause.current = false)}
    >
      <div
        ref={piste}
        onScroll={surDefilement}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-xl"
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full shrink-0 snap-start">
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à la diapositive ${i + 1}`}
              aria-current={i === index}
              onClick={() => aller(i)}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i === index ? "bg-accent" : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
