"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formaterXAF } from "@/lib/money";

interface Suggestion {
  slug: string;
  titre: string;
  prix: number;
  image: string | null;
}

/**
 * Barre de recherche avec autocomplétion. Suggère des produits dès 2 lettres
 * (requête débouncée), navigation au clavier (flèches + Entrée). Reste un vrai
 * formulaire GET vers /catalogue : fonctionne même sans JavaScript.
 */
export function BarreRecherche({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [terme, setTerme] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const conteneur = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Requête débouncée des suggestions.
  useEffect(() => {
    const t = terme.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }
    const minuteur = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      try {
        const rep = await fetch(
          `/api/recherche/suggestions?q=${encodeURIComponent(t)}`,
          { signal: abort.current.signal },
        );
        const data = (await rep.json()) as { produits: Suggestion[] };
        setSuggestions(data.produits ?? []);
        setActif(-1);
      } catch {
        // requête annulée ou réseau : on n'affiche rien de plus.
      }
    }, 220);
    return () => clearTimeout(minuteur);
  }, [terme]);

  // Ferme la liste au clic extérieur.
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function allerVersProduit(s: Suggestion) {
    setOuvert(false);
    router.push(`/produit/${s.slug}`);
  }

  function surTouche(e: React.KeyboardEvent) {
    if (!ouvert || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && actif >= 0) {
      e.preventDefault();
      const choix = suggestions[actif];
      if (choix) allerVersProduit(choix);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  }

  const afficherListe = ouvert && suggestions.length > 0;

  return (
    <div ref={conteneur} className={`relative ${className}`}>
      <form
        method="get"
        action="/catalogue"
        className="flex w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-accent"
        autoComplete="off"
      >
        <input
          type="search"
          name="q"
          value={terme}
          onChange={(e) => {
            setTerme(e.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onKeyDown={surTouche}
          placeholder="Rechercher un produit, une marque…"
          aria-label="Rechercher"
          aria-expanded={afficherListe}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Lancer la recherche"
          className="grid w-11 place-items-center bg-accent text-white hover:bg-accent-dark"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {afficherListe && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 text-left shadow-flottant"
        >
          {suggestions.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === actif}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  allerVersProduit(s);
                }}
                onMouseEnter={() => setActif(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                  i === actif ? "bg-nile-50" : "hover:bg-gray-50"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded bg-gray-50">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300" aria-hidden="true">
                      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-gray-800">{s.titre}</span>
                  <span className="text-xs font-semibold text-promo">{formaterXAF(s.prix)}</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOuvert(false);
                router.push(`/catalogue?q=${encodeURIComponent(terme.trim())}`);
              }}
              className="w-full border-t border-gray-100 px-3 py-2 text-left text-xs font-medium text-nile hover:bg-gray-50"
            >
              Voir tous les résultats pour « {terme.trim()} »
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
