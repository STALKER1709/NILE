"use client";

import { useState } from "react";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import {
  valeursProposees,
  valeur2Pour,
  conserverValeur2,
  trouverVariante,
  varianteDisponible,
  type Variante,
  type AxeDeclinaison,
} from "@/modules/catalogue/variante-core";

/**
 * Choix de la déclinaison sur la fiche produit, puis ajout au panier.
 *
 * Rien n'est présélectionné : sur un article décliné, un choix par défaut
 * ferait partir des commandes en taille M parce que l'acheteur n'aura pas vu
 * qu'il y avait quelque chose à choisir. Le bouton d'ajout reste donc inactif
 * tant qu'une combinaison complète n'est pas désignée.
 *
 * Les valeurs épuisées restent AFFICHÉES, barrées et inactives : les faire
 * disparaître donne l'impression d'un dysfonctionnement — l'acheteur qui
 * cherche son 42 doit voir qu'il existe et qu'il est parti, pas se demander
 * pourquoi la boutique ne le référence plus.
 */
export function SelecteurDeclinaison({
  variantes,
  axes,
  quantitesParVariante,
}: {
  variantes: Variante[];
  axes: AxeDeclinaison[];
  /** Quantité déjà au panier, par déclinaison (compteur « supermarché »). */
  quantitesParVariante: Record<string, number>;
}) {
  const axe1 = axes.find((a) => a.rang === 1);
  const axe2 = axes.find((a) => a.rang === 2);
  const [valeur1, setValeur1] = useState<string>("");
  const [valeur2, setValeur2] = useState<string>("");

  const valeurs1 = valeursProposees(variantes, 1, axe1);
  const valeurs2 = valeursProposees(variantes, 2, axe2);
  // Toutes les combinaisons ne sont pas tenues : du noir en 40 et en 42, du
  // blanc en 40 seulement. Le second axe se lit donc à travers le premier.
  const disponiblesPour1 = valeur1 ? valeur2Pour(variantes, valeur1, axe2) : [];

  const attendSecondAxe = valeurs2.length > 0;
  const choixComplet = valeur1 !== "" && (!attendSecondAxe || valeur2 !== "");
  const variante = choixComplet
    ? trouverVariante(variantes, { valeur1, valeur2 })
    : null;

  /** Une valeur du premier axe est-elle encore commandable ? */
  function premierAxeDisponible(v: string): boolean {
    return variantes.some((x) => x.valeur1 === v && varianteDisponible(x));
  }

  function choisirValeur1(v: string) {
    setValeur1(v);
    // Le second axe est remis à zéro s'il n'existe pas dans la nouvelle
    // valeur : garder « Blanc » après un passage du 40 au 42 laisserait
    // afficher une combinaison que le vendeur ne tient pas.
    setValeur2(conserverValeur2(variantes, v, valeur2));
  }

  return (
    <div className="space-y-4">
      {axe1 && (
        <GroupeChoix
          libelle={axe1.libelle}
          valeurs={valeurs1}
          choisie={valeur1}
          estDisponible={premierAxeDisponible}
          onChoisir={choisirValeur1}
        />
      )}

      {axe2 && attendSecondAxe && (
        <GroupeChoix
          libelle={axe2.libelle}
          valeurs={valeurs2}
          choisie={valeur2}
          // Avant tout choix de taille, le second axe est présenté en entier
          // mais inactif : l'acheteur voit les couleurs existantes sans
          // pouvoir composer une combinaison qui n'existe pas.
          estDisponible={(v) => disponiblesPour1.includes(v)}
          onChoisir={setValeur2}
        />
      )}

      {variante ? (
        <>
          <p className="text-corps-sm text-slate-600">
            {variante.stock <= 5
              ? `Plus que ${variante.stock} en stock pour ce choix.`
              : `${variante.stock} disponibles pour ce choix.`}
          </p>
          <BoutonPanier
            varianteId={variante.id}
            stock={variante.stock}
            quantiteInitiale={quantitesParVariante[variante.id] ?? 0}
            taille="lg"
          />
        </>
      ) : (
        <>
          <span
            aria-disabled="true"
            className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded bg-slate-100 text-base font-medium text-slate-400"
          >
            {messageChoixManquant(axe1, axe2, valeur1, attendSecondAxe)}
          </span>
          {/* Combinaison choisie mais introuvable : le vendeur ne la tient
              pas. Le dire vaut mieux qu'un bouton qui ne réagit pas. */}
          {choixComplet && (
            <p className="text-corps-sm text-promo">
              Cette combinaison n&apos;est pas disponible.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Invite à compléter le choix, en nommant l'axe qui manque. */
function messageChoixManquant(
  axe1: AxeDeclinaison | undefined,
  axe2: AxeDeclinaison | undefined,
  valeur1: string,
  attendSecondAxe: boolean,
): string {
  if (!valeur1 && axe1) return `Choisissez : ${axe1.libelle.toLowerCase()}`;
  if (attendSecondAxe && axe2) return `Choisissez : ${axe2.libelle.toLowerCase()}`;
  return "Choisissez vos options";
}

/** Un axe : son nom, la valeur retenue, et les pastilles cliquables. */
function GroupeChoix({
  libelle,
  valeurs,
  choisie,
  estDisponible,
  onChoisir,
}: {
  libelle: string;
  valeurs: string[];
  choisie: string;
  estDisponible: (valeur: string) => boolean;
  onChoisir: (valeur: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-corps-sm font-semibold text-slate-900">
        {libelle}
        {choisie && <span className="ml-1 font-normal text-slate-500">· {choisie}</span>}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {valeurs.map((valeur) => {
          const dispo = estDisponible(valeur);
          const active = choisie === valeur;
          return (
            <button
              key={valeur}
              type="button"
              onClick={() => onChoisir(valeur)}
              disabled={!dispo}
              aria-pressed={active}
              // Zone de 44 px de haut : c'est la cible minimale confortable au
              // pouce, et cet écran se consulte au téléphone.
              className={`min-h-11 min-w-11 rounded border px-3 text-corps-sm font-semibold transition-colors ${
                active
                  ? "border-nile-700 bg-nile-700 text-white"
                  : dispo
                    ? "border-contour-carte bg-white text-slate-800 hover:border-nile-500 hover:bg-nile-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through"
              }`}
            >
              {valeur}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
