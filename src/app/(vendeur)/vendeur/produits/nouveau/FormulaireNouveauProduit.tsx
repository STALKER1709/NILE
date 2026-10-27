"use client";

import { useMemo, useState } from "react";
import type { AxeDeclinaison } from "@/modules/catalogue/variante-core";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

type CategorieOption = { id: string; label: string };
type VarianteForm = { valeur1: string; valeur2: string; stock: number };

export function FormulaireNouveauProduit({
  categories,
  axesParCategorie,
  marques,
  action,
}: {
  categories: CategorieOption[];
  axesParCategorie: Record<string, AxeDeclinaison[]>;
  marques: string[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [categorieId, setCategorieId] = useState("");
  const axes = axesParCategorie[categorieId] ?? [];
  const [selection, setSelection] = useState<Record<number, string[]>>({});
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [etape, setEtape] = useState<1 | 2>(1);

  const combinaisons = useMemo(() => {
    if (axes.length === 0) return [];
    const a1 = axes.find((a) => a.rang === 1);
    const a2 = axes.find((a) => a.rang === 2);
    const valeurs1 = a1 ? (selection[1] ?? []) : [""];
    const valeurs2 = a2 ? (selection[2] ?? []) : [""];
    const resultat: VarianteForm[] = [];
    for (const valeur1 of valeurs1) {
      for (const valeur2 of valeurs2) {
        resultat.push({
          valeur1,
          valeur2,
          stock: stocks[`${valeur1}::${valeur2}`] ?? 0,
        });
      }
    }
    return resultat;
  }, [axes, selection, stocks]);

  const jsonVariantes = JSON.stringify(combinaisons);
  const axesActifs = axes.length > 0;
  const nbCombinaisons = combinaisons.length;

  function changerCategorie(value: string) {
    setCategorieId(value);
    setSelection({});
    setStocks({});
    setEtape(1);
  }

  function basculerValeur(rang: number, valeur: string, coche: boolean) {
    setSelection((avant) => {
      const courant = avant[rang] ?? [];
      return {
        ...avant,
        [rang]: coche
          ? [...courant, valeur]
          : courant.filter((v) => v !== valeur),
      };
    });
  }

  function toutSelectionner(rang: number, valeurs: string[], coche: boolean) {
    setSelection((avant) => ({ ...avant, [rang]: coche ? [...valeurs] : [] }));
  }

  function cle(v: VarianteForm) {
    return `${v.valeur1}::${v.valeur2}`;
  }

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5">
      <Carte className="p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nile-800 text-sm font-bold text-white">1</span>
          <div>
            <h2 className="font-semibold text-slate-900">Informations du produit</h2>
            <p className="mt-1 text-sm text-slate-500">Une seule fiche pour toutes les couleurs, tailles ou capacités.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="titre" className={labelClass}>Nom du produit</label>
            <input id="titre" name="titre" required minLength={3} maxLength={200} placeholder="Ex. T-shirt coton premium" className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea id="description" name="description" required minLength={10} maxLength={5000} rows={4} placeholder="Décrivez le produit, sa qualité et ses caractéristiques…" className={`${champClass} mt-1`} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prix" className={labelClass}>Prix commun (FCFA)</label>
              <input id="prix" name="prix" type="number" min={1} step={1} required placeholder="Ex. 12500" className={`${champClass} mt-1`} />
              <p className="mt-1 text-xs text-slate-500">Le prix s’applique à toutes les variantes.</p>
            </div>
            <div>
              <label htmlFor="marque" className={labelClass}>Marque <span className="font-normal text-slate-500">(facultatif)</span></label>
              <input id="marque" name="marque" list="marques-connues" maxLength={60} placeholder="Ex. Samsung, Nike" className={`${champClass} mt-1`} />
              <datalist id="marques-connues">{marques.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
          </div>
          <div>
            <label htmlFor="categorieId" className={labelClass}>Catégorie</label>
            <select id="categorieId" name="categorieId" required value={categorieId} onChange={(e) => changerCategorie(e.target.value)} className={`${champClass} mt-1`}>
              <option value="">Choisir une catégorie…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          {axesActifs && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-950">
              <strong>La catégorie permet les déclinaisons.</strong>
              <p className="mt-1 text-blue-900/80">Sélectionnez les valeurs réellement disponibles en boutique. N’activez pas une couleur ou une taille que vous ne pouvez pas fournir.</p>
            </div>
          )}
          {!axesActifs && categorieId && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label htmlFor="stock" className={labelClass}>Stock disponible</label>
              <input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={0} className={`${champClass} mt-1`} />
              <p className="mt-1 text-xs text-slate-500">Cette catégorie ne propose pas de variantes : le produit sera vendu en version unique.</p>
            </div>
          )}
          {!categorieId && <input type="hidden" name="stock" value="0" />}
        </div>
      </Carte>

      {axesActifs && (
        <Carte className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nile-800 text-sm font-bold text-white">2</span>
            <div>
              <h2 className="font-semibold text-slate-900">Choix des variantes</h2>
              <p className="mt-1 text-sm text-slate-500">Sélection multiple : NILE génère automatiquement les combinaisons.</p>
            </div>
          </div>
          <div className="space-y-5">
            {axes.map((axe) => {
              const choisies = selection[axe.rang] ?? [];
              return (
                <fieldset key={axe.rang} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <legend className="text-sm font-semibold text-slate-800">{axe.libelle}</legend>
                    <button type="button" onClick={() => toutSelectionner(axe.rang, axe.valeurs, choisies.length !== axe.valeurs.length)} className="text-xs font-medium text-nile-800 underline underline-offset-2">
                      {choisies.length === axe.valeurs.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {axe.valeurs.map((valeur) => {
                      const active = choisies.includes(valeur);
                      return (
                        <label key={valeur} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${active ? "border-nile-800 bg-nile-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>
                          <input type="checkbox" checked={active} onChange={(e) => basculerValeur(axe.rang, valeur, e.target.checked)} className="sr-only" />
                          {active && <span aria-hidden="true">✓</span>}{valeur}
                        </label>
                      );
                    })}
                  </div>
                  {choisies.length === 0 && <p className="text-xs text-amber-700">Sélectionnez au moins une valeur.</p>}
                </fieldset>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Combinaisons générées</span>
              <strong className="text-lg text-nile-800">{nbCombinaisons}</strong>
            </div>
            {nbCombinaisons > 100 && <p className="mt-1 text-xs text-red-700">Maximum : 100 combinaisons par produit. Réduisez la sélection.</p>}
            {nbCombinaisons > 0 && nbCombinaisons <= 100 && (
              <button type="button" onClick={() => setEtape(2)} className={`${btn("primaire", "md", "mt-3 w-full")}`}>Configurer le stock des {nbCombinaisons} variantes →</button>
            )}
          </div>
        </Carte>
      )}

      {axesActifs && etape === 2 && nbCombinaisons > 0 && nbCombinaisons <= 100 && (
        <Carte className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nile-800 text-sm font-bold text-white">3</span>
            <div>
              <h2 className="font-semibold text-slate-900">Stock par combinaison</h2>
              <p className="mt-1 text-sm text-slate-500">Chaque taille/couleur ou capacité/couleur garde son propre stock.</p>
            </div>
          </div>
          <div className="space-y-2">
            {combinaisons.map((v) => (
              <div key={cle(v)} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 rounded-lg border border-slate-200 p-3">
                <span className="break-words text-sm font-medium text-slate-800">{[v.valeur1, v.valeur2].filter(Boolean).join(" · ")}</span>
                <label className="text-xs text-slate-500">
                  Stock
                  <input type="number" min={0} max={1000000} step={1} value={v.stock} onChange={(e) => setStocks((avant) => ({ ...avant, [cle(v)]: Math.max(0, Number(e.target.value) || 0) }))} className={`${champClass} mt-1`} />
                </label>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setEtape(1)} className={`${btn("secondaire", "md", "mt-4 w-full")}`}>← Modifier les variantes</button>
        </Carte>
      )}

      <Carte className="p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nile-800 text-sm font-bold text-white">{axesActifs ? "4" : "2"}</span>
          <div>
            <h2 className="font-semibold text-slate-900">Photos du produit</h2>
            <p className="mt-1 text-sm text-slate-500">Ajoutez jusqu’à 3 photos communes à la fiche. Vous pourrez compléter la galerie ensuite.</p>
          </div>
        </div>
        <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className={`${champClass} mt-1`} />
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG ou WEBP · 2 Mo maximum par image · 3 images et 3,5 Mo au total.</p>
      </Carte>

      <input type="hidden" name="variantesJson" value={jsonVariantes} />
      <div className="space-y-2">
        {axesActifs && nbCombinaisons === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Sélectionnez au moins une valeur pour chaque axe, puis configurez le stock avant de créer le produit.</p>}
        {axesActifs && nbCombinaisons > 100 && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Trop de combinaisons : 100 maximum par produit.</p>}
        <BoutonSoumettre disabled={axesActifs && (nbCombinaisons === 0 || nbCombinaisons > 100 || etape !== 2)} enCours="Création du produit…" className={btn("primaire", "lg", "w-full")}>Créer le produit et ses variantes</BoutonSoumettre>
      </div>
    </form>
  );
}
