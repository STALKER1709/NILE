"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formaterXAF } from "@/lib/money";

interface ProduitSuggere {
  slug: string;
  titre: string;
  prix: number;
  image: string | null;
}

interface BoutiqueSuggeree {
  id: string;
  nomBoutique: string;
  nbProduits: number;
}

/** Élément navigable de la liste (boutiques d'abord, puis produits). */
type Item =
  | { type: "boutique"; data: BoutiqueSuggeree }
  | { type: "produit"; data: ProduitSuggere };

/**
 * Barre de recherche avec autocomplétion. Suggère des produits (par titre) et
 * des boutiques (par nom) dès 2 lettres, requête débouncée, navigation au
 * clavier (flèches + Entrée). Reste un vrai formulaire GET vers /catalogue :
 * fonctionne même sans JavaScript.
 */
export function BarreRecherche({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [terme, setTerme] = useState("");
  const [produits, setProduits] = useState<ProduitSuggere[]>([]);
  const [boutiques, setBoutiques] = useState<BoutiqueSuggeree[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const conteneur = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Liste plate pour la navigation clavier : boutiques puis produits.
  const items = useMemo<Item[]>(
    () => [
      ...boutiques.map((b) => ({ type: "boutique" as const, data: b })),
      ...produits.map((p) => ({ type: "produit" as const, data: p })),
    ],
    [boutiques, produits],
  );

  // Requête débouncée des suggestions.
  useEffect(() => {
    const t = terme.trim();
    if (t.length < 2) {
      setProduits([]);
      setBoutiques([]);
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
        const data = (await rep.json()) as {
          produits: ProduitSuggere[];
          boutiques: BoutiqueSuggeree[];
        };
        setProduits(data.produits ?? []);
        setBoutiques(data.boutiques ?? []);
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

  function ouvrirItem(item: Item) {
    setOuvert(false);
    if (item.type === "boutique") {
      router.push(`/boutique/${item.data.id}`);
    } else {
      router.push(`/produit/${item.data.slug}`);
    }
  }

  function surTouche(e: React.KeyboardEvent) {
    if (!ouvert || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && actif >= 0) {
      e.preventDefault();
      const choix = items[actif];
      if (choix) ouvrirItem(choix);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  }

  const afficherListe = ouvert && items.length > 0;

  return (
    <div ref={conteneur} className={`relative ${className}`}>
      <form
        method="get"
        action="/catalogue"
        className="flex w-full overflow-hidden rounded bg-white shadow-sm ring-1 ring-white/20 transition-all focus-within:ring-2 focus-within:ring-amber-400"
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
          placeholder="Rechercher un produit, une boutique…"
          aria-label="Rechercher"
          aria-expanded={afficherListe}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Lancer la recherche"
          className="grid w-11 place-items-center bg-gradient-to-br from-accent to-accent-dark font-bold text-nile-950 transition-all hover:brightness-105 active:scale-95"
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
          className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded border border-contour-carte bg-white py-1 text-left shadow-flottant"
        >
          {boutiques.length > 0 && (
            <li className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Boutiques
            </li>
          )}
          {boutiques.map((b, i) => (
            <li key={`b-${b.id}`} role="option" aria-selected={i === actif}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  ouvrirItem({ type: "boutique", data: b });
                }}
                onMouseEnter={() => setActif(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                  i === actif ? "bg-nile-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-nile text-sm font-bold text-white">
                  {b.nomBoutique.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {b.nomBoutique}
                  </span>
                  <span className="text-xs text-slate-500">
                    Boutique · {b.nbProduits} produit{b.nbProduits > 1 ? "s" : ""}
                  </span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-300" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}

          {produits.length > 0 && boutiques.length > 0 && (
            <li className="mt-1 border-t border-slate-100 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Produits
            </li>
          )}
          {produits.map((s, i) => {
            const idx = boutiques.length + i;
            return (
              <li key={`p-${s.slug}`} role="option" aria-selected={idx === actif}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    ouvrirItem({ type: "produit", data: s });
                  }}
                  onMouseEnter={() => setActif(idx)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                    idx === actif ? "bg-nile-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded bg-slate-50">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300" aria-hidden="true">
                        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-800">{s.titre}</span>
                    <span className="text-xs font-semibold text-promo">{formaterXAF(s.prix)}</span>
                  </span>
                </button>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOuvert(false);
                router.push(`/catalogue?q=${encodeURIComponent(terme.trim())}`);
              }}
              className="w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-medium text-nile hover:bg-slate-50"
            >
              Voir tous les résultats pour « {terme.trim()} »
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
