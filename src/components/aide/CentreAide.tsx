"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Rubrique = "commandes" | "paiement" | "livraison" | "vendre";

export interface Question {
  rubrique: Rubrique;
  question: string;
  reponse: ReactNode;
  /** Texte brut de la réponse, utilisé pour la recherche. */
  texte: string;
}

const RUBRIQUES: {
  cle: Rubrique;
  titre: string;
  description: string;
  icone: ReactNode;
}[] = [
  {
    cle: "commandes",
    titre: "Commandes",
    description: "Suivre, comprendre les statuts, consulter l'historique.",
    icone: (
      <>
        <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
        <path d="M8 9a4 4 0 0 1 8 0" />
      </>
    ),
  },
  {
    cle: "paiement",
    titre: "Paiement",
    description: "Mobile Money, espèces à la livraison, sécurité.",
    icone: (
      <>
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <path d="M2.5 10h19M6 14h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    cle: "livraison",
    titre: "Livraison",
    description: "Délais, zones couvertes, réception du colis.",
    icone: (
      <>
        <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
        <circle cx="7" cy="17" r="1.5" />
        <circle cx="17" cy="17" r="1.5" />
      </>
    ),
  },
  {
    cle: "vendre",
    titre: "Vendre sur NILE",
    description: "Ouvrir une boutique, gérer son stock, être reversé.",
    icone: (
      <>
        <path d="M4 9h16l-1 11H5L4 9z" strokeLinejoin="round" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
  },
];

/** Retire les accents pour une recherche tolérante (« delai » trouve « délai »). */
function normaliser(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Centre d'aide interactif : recherche par mots-clés et filtrage par rubrique
 * sur une liste de questions fréquentes. Le repli/dépli utilise <details>,
 * donc les réponses restent lisibles même sans JavaScript.
 */
export function CentreAide({ questions }: { questions: Question[] }) {
  const [terme, setTerme] = useState("");
  const [rubrique, setRubrique] = useState<Rubrique | null>(null);

  const resultats = useMemo(() => {
    const t = normaliser(terme.trim());
    return questions.filter((q) => {
      if (rubrique && q.rubrique !== rubrique) return false;
      if (t.length < 2) return true;
      return (
        normaliser(q.question).includes(t) || normaliser(q.texte).includes(t)
      );
    });
  }, [questions, terme, rubrique]);

  return (
    <>
      {/* Héro : recherche */}
      <section className="-mx-3 bg-nile-900 px-4 py-14 text-center text-white sm:-mx-4 sm:rounded-2xl sm:py-16">
        <h1 className="text-titre-md sm:text-display-mobile">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/75 sm:text-base">
          Du suivi de votre livraison à l'ouverture de votre boutique, retrouvez
          ici les réponses aux questions les plus courantes.
        </p>
        <div className="relative mx-auto mt-7 max-w-xl">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Rechercher une question, un mot-clé…"
            aria-label="Rechercher dans l'aide"
            className="h-14 w-full rounded-xl border-none bg-white pl-12 pr-4 text-sm text-slate-900 shadow-carte-hover outline-none ring-amber-400 transition placeholder:text-slate-400 focus:ring-4"
          />
        </div>
      </section>

      {/* Rubriques */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {RUBRIQUES.map((r) => {
          const actif = rubrique === r.cle;
          return (
            <button
              key={r.cle}
              type="button"
              onClick={() => setRubrique(actif ? null : r.cle)}
              aria-pressed={actif}
              className={`group rounded-xl border bg-white p-5 text-left shadow-carte transition-all duration-200 hover:-translate-y-0.5 hover:shadow-carte-hover ${
                actif ? "border-nile-600 ring-1 ring-nile-600" : "border-contour-carte"
              }`}
            >
              <span
                className={`mb-3.5 grid h-11 w-11 place-items-center rounded-full transition-colors ${
                  actif
                    ? "bg-nile-600 text-white"
                    : "bg-slate-100 text-slate-600 group-hover:bg-nile-50 group-hover:text-nile-700"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  {r.icone}
                </svg>
              </span>
              <span className="block text-lg font-bold text-slate-900">{r.titre}</span>
              <span className="mt-1 block text-sm text-slate-500">{r.description}</span>
            </button>
          );
        })}
      </section>

      {/* Questions fréquentes */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-titre-sm text-slate-900 sm:text-titre-md">
            Questions fréquentes
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Les réponses rapides aux questions que l'on nous pose le plus
            souvent. Vous ne trouvez pas ? Écrivez-nous, plus bas.
          </p>
          {rubrique && (
            <button
              type="button"
              onClick={() => setRubrique(null)}
              className="mt-4 text-sm font-bold text-nile-700 hover:underline"
            >
              ← Voir toutes les rubriques
            </button>
          )}
          <div className="mt-6 rounded-xl border border-contour-carte bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Conseil
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Gardez le numéro de votre commande sous la main : nous vous
              répondrons beaucoup plus vite.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 lg:col-span-2">
          {resultats.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aucune question ne correspond à votre recherche. Contactez-nous
              directement, on vous répond.
            </p>
          ) : (
            resultats.map((q) => (
              <details
                key={q.question}
                className="group rounded-xl border border-contour-carte bg-white transition-colors open:border-nile-600/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold text-slate-900">
                  {q.question}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                  {q.reponse}
                </div>
              </details>
            ))
          )}
        </div>
      </section>
    </>
  );
}
