import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerCategories, aplatirPourSelect } from "@/modules/catalogue/categories";
import { listerMarquesVendeur } from "@/modules/catalogue/produits";
import { creerProduitAction } from "@/app/(vendeur)/vendeur/produits/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const [categories, marques] = await Promise.all([
    listerCategories().then(aplatirPourSelect),
    listerMarquesVendeur(vendeur.id),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Nouveau produit</h1>
        <Link href="/vendeur/produits" className="text-sm text-slate-500 hover:underline">← Retour</Link>
      </div>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-5">
        <form action={creerProduitAction} encType="multipart/form-data" className="space-y-4">
          <div>
            <label htmlFor="titre" className={labelClass}>Titre</label>
            <input id="titre" name="titre" required className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea id="description" name="description" required rows={4} className={`${champClass} mt-1`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prix" className={labelClass}>Prix (FCFA)</label>
              <input id="prix" name="prix" type="number" min={1} step={1} required className={`${champClass} mt-1`} />
            </div>
            <div>
              <label htmlFor="stock" className={labelClass}>Stock</label>
              <input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={0} className={`${champClass} mt-1`} />
            </div>
          </div>
          <div>
            <label htmlFor="marque" className={labelClass}>
              Marque <span className="font-normal text-slate-500">(facultatif)</span>
            </label>
            {/* Saisie libre, mais les marques déjà utilisées sont proposées :
                sans cela « Nike », « NIKE » et « nike » se multiplieraient et
                le filtre du catalogue deviendrait inutilisable. La
                normalisation à l'écriture les fait converger de toute façon. */}
            <input
              id="marque"
              name="marque"
              list="marques-connues"
              maxLength={60}
              placeholder="Ex. Nike"
              className={`${champClass} mt-1`}
             
            />
            <datalist id="marques-connues">
              {marques.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="categorieId" className={labelClass}>Catégorie</label>
            <select id="categorieId" name="categorieId" required defaultValue="" className={`${champClass} mt-1`}>
              <option value="" disabled>Choisir…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {categories.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">Aucune catégorie · un administrateur doit en créer.</p>
            )}
          </div>
          <div>
            <label htmlFor="images" className={labelClass}>Images (facultatif)</label>
            <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className={`${champClass} mt-1`} />
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG ou WEBP · 2 Mo max par image.</p>
          </div>
          <BoutonSoumettre enCours="Création (envoi des images)…" className={btn("primaire", "lg", "w-full")}>Créer le produit</BoutonSoumettre>
        </form>
      </Carte>
    </div>
  );
}
