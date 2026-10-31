"use client";

import { useMemo, useState } from "react";
import { champClass, labelClass } from "@/components/ui/kit";

type CategorieCascade = { id: string; nom: string; parentId: string | null };

export function SelecteurCategorieCascade({
  categories,
  value,
  onChange,
}: {
  categories: CategorieCascade[];
  value: string;
  onChange: (id: string) => void;
}) {
  const enfantsParParent = useMemo(() => {
    const map = new Map<string | null, CategorieCascade[]>();
    for (const categorie of categories) {
      const liste = map.get(categorie.parentId) ?? [];
      liste.push(categorie);
      map.set(categorie.parentId, liste);
    }
    for (const liste of map.values()) liste.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    return map;
  }, [categories]);

  const cheminActif = useMemo(() => {
    if (!value) return [];
    const parId = new Map(categories.map((c) => [c.id, c]));
    const chemin: CategorieCascade[] = [];
    let courant = parId.get(value);
    while (courant && chemin.length < 20) {
      chemin.unshift(courant);
      courant = courant.parentId ? parId.get(courant.parentId) : undefined;
    }
    return chemin;
  }, [categories, value]);

  const [selection, setSelection] = useState<string[]>([]);
  const chemin = selection.length > 0 ? selection : cheminActif.map((c) => c.id);

  function choisir(niveau: number, id: string) {
    const prochain = [...chemin.slice(0, niveau), id];
    setSelection(prochain);
    const enfants = enfantsParParent.get(id) ?? [];
    onChange(enfants.length === 0 ? id : "");
  }

  const niveaux = [{ parentId: null as string | null, titre: "Grande famille" }];
  for (let i = 0; i < chemin.length; i += 1) {
    const parentId = chemin[i];
    if (!parentId) continue;
    if ((enfantsParParent.get(parentId) ?? []).length > 0) {
      niveaux.push({ parentId, titre: i === 0 ? "Sous-catégorie" : "Préciser la catégorie" });
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Catégorie du produit</label>
        <p className="mt-1 text-xs text-slate-500">Choisissez une famille, puis affinez votre sélection jusqu'à la catégorie la plus précise.</p>
      </div>
      {niveaux.map((niveau, index) => {
        const options = enfantsParParent.get(niveau.parentId) ?? [];
        const selected = chemin[index] ?? "";
        return (
          <div key={niveau.parentId ?? "racines"}>
            <label htmlFor={`categorie-niveau-${index}`} className="mb-1 block text-xs font-medium text-slate-600">{niveau.titre}</label>
            <select
              id={`categorie-niveau-${index}`}
              value={selected}
              onChange={(event) => choisir(index, event.target.value)}
              className={champClass}
              required
            >
              <option value="">Choisir…</option>
              {options.map((option) => <option key={option.id} value={option.id}>{option.nom}</option>)}
            </select>
          </div>
        );
      })}
      {value ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Catégorie retenue : <strong>{cheminActif.map((c) => c.nom).join(" › ")}</strong>
        </p>
      ) : chemin.length > 0 ? (
        <p className="text-xs text-amber-700">Sélectionnez le niveau le plus précis pour continuer.</p>
      ) : null}
      <input type="hidden" name="categorieId" value={value} />
    </div>
  );
}
