import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerCategories, aplatirPourSelect } from "@/modules/catalogue/categories";
import { creerProduitAction } from "@/app/(vendeur)/vendeur/produits/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

export default async function NouveauProduitPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  await exigerVendeur();
  const categories = aplatirPourSelect(await listerCategories());

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Nouveau produit</h1>
        <Link href="/vendeur/produits" className="text-sm text-gray-500 hover:underline">
          ← Retour
        </Link>
      </div>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <form
        action={creerProduitAction}
        encType="multipart/form-data"
        className="space-y-4 rounded-lg bg-white p-5 shadow-sm"
      >
        <div>
          <label htmlFor="titre" className={label}>Titre</label>
          <input id="titre" name="titre" required className={champ} />
        </div>
        <div>
          <label htmlFor="description" className={label}>Description</label>
          <textarea id="description" name="description" required rows={4} className={champ} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prix" className={label}>Prix (FCFA)</label>
            <input id="prix" name="prix" type="number" min={1} step={1} required className={champ} />
          </div>
          <div>
            <label htmlFor="stock" className={label}>Stock</label>
            <input id="stock" name="stock" type="number" min={0} step={1} required className={champ} defaultValue={0} />
          </div>
        </div>
        <div>
          <label htmlFor="categorieId" className={label}>Catégorie</label>
          <select id="categorieId" name="categorieId" required className={champ} defaultValue="">
            <option value="" disabled>Choisir une catégorie…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Aucune catégorie n'existe encore. Un administrateur doit en créer.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="images" className={label}>Images (facultatif)</label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className={champ}
          />
          <p className="mt-1 text-xs text-gray-500">JPEG, PNG ou WEBP · 2 Mo max par image.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
        >
          Créer le produit
        </button>
      </form>
    </div>
  );
}
