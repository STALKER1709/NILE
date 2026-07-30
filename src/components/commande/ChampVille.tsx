"use client";

import { useState } from "react";
import {
  VILLES_CAMEROUN,
  VILLE_AUTRE,
  estVilleConnue,
} from "@/modules/commande/villes";
import { champClass, labelClass } from "@/components/ui/kit";

/**
 * Choix de la ville de livraison : liste des villes principales groupées par
 * région, plus une option « Autre ville » qui révèle un champ libre.
 *
 * Cette échappatoire est nécessaire : beaucoup d'acheteurs habitent une
 * localité absente d'une liste de villes principales, et un select fermé les
 * empêcherait purement et simplement de commander.
 */
export function ChampVille({ valeurInitiale = "" }: { valeurInitiale?: string }) {
  // Une adresse déjà enregistrée hors liste rouvre directement le champ libre.
  const horsListe = valeurInitiale !== "" && !estVilleConnue(valeurInitiale);
  const [choix, setChoix] = useState(horsListe ? VILLE_AUTRE : valeurInitiale);

  return (
    <div>
      <label htmlFor="ville" className={labelClass}>Ville</label>
      <select
        id="ville"
        name="ville"
        required
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
        className={`${champClass} mt-1`}
      >
        <option value="" disabled>
          Choisissez votre ville…
        </option>
        {VILLES_CAMEROUN.map((r) => (
          <optgroup key={r.region} label={r.region}>
            {r.villes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={VILLE_AUTRE}>Autre ville…</option>
      </select>

      {choix === VILLE_AUTRE && (
        <div className="mt-2">
          <label htmlFor="villeAutre" className="sr-only">
            Précisez votre ville
          </label>
          <input
            id="villeAutre"
            name="villeAutre"
            required
            defaultValue={horsListe ? valeurInitiale : ""}
            placeholder="Précisez votre ville"
            className={champClass}
          />
        </div>
      )}
    </div>
  );
}
