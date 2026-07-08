import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { getProduitDuVendeur } from "@/modules/catalogue/produits";
import { listerCategories, aplatirPourSelect } from "@/modules/catalogue/categories";
import { formaterXAF } from "@/lib/money";
import {
  mettreAJourProduitAction,
  changerStatutProduitAction,
  supprimerProduitAction,
  ajouterImageAction,
  supprimerImageAction,
} from "@/app/(vendeur)/vendeur/produits/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

const MESSAGES_OK: Record<string, string> = {
  cree: "Produit créé. Ajoutez des images et publiez-le quand il est prêt.",
  maj: "Produit mis à jour.",
  statut: "Statut mis à jour.",
  image: "Image ajoutée.",
  image_supprimee: "Image supprimée.",
};

export default async function GestionProduitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();

  const produit = await getProduitDuVendeur(vendeur.id, id);
  if (!produit) redirect("/vendeur/produits?erreur=Produit%20introuvable.");

  const categories = aplatirPourSelect(await listerCategories());

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="truncate text-xl font-bold">{produit.titre}</h1>
        <Link href="/vendeur/produits" className="shrink-0 text-sm text-gray-500 hover:underline">
          ← Mes produits
        </Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {/* --- Statut / publication --- */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm">
          Statut : <span className="font-semibold">{produit.statut}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {produit.statut !== "ACTIF" && (
            <StatutButton produitId={produit.id} statut="ACTIF" libelle="Publier" />
          )}
          {produit.statut === "ACTIF" && (
            <StatutButton produitId={produit.id} statut="INACTIF" libelle="Dépublier" />
          )}
          {produit.statut !== "BROUILLON" && (
            <StatutButton produitId={produit.id} statut="BROUILLON" libelle="Repasser en brouillon" />
          )}
          {produit.statut === "ACTIF" && (
            <Link
              href={`/produit/${produit.slug}`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Voir la fiche publique
            </Link>
          )}
        </div>
      </section>

      {/* --- Images --- */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Images</h2>
        {produit.images.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {produit.images.map((img) => (
              <li key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
                <form action={supprimerImageAction}>
                  <input type="hidden" name="produitId" value={produit.id} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <button
                    type="submit"
                    className="mt-1 w-full text-xs text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Aucune image.</p>
        )}
        <form action={ajouterImageAction} encType="multipart/form-data" className="mt-3 flex items-end gap-2">
          <input type="hidden" name="produitId" value={produit.id} />
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className={champ}
          />
          <button type="submit" className="shrink-0 rounded bg-nile px-3 py-2 text-sm font-medium text-white hover:bg-nile-dark">
            Ajouter
          </button>
        </form>
      </section>

      {/* --- Modifier les informations --- */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Informations</h2>
        <form action={mettreAJourProduitAction} className="space-y-4">
          <input type="hidden" name="produitId" value={produit.id} />
          <div>
            <label htmlFor="titre" className={label}>Titre</label>
            <input id="titre" name="titre" required defaultValue={produit.titre} className={champ} />
          </div>
          <div>
            <label htmlFor="description" className={label}>Description</label>
            <textarea id="description" name="description" required rows={4} defaultValue={produit.description} className={champ} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prix" className={label}>Prix (FCFA)</label>
              <input id="prix" name="prix" type="number" min={1} step={1} required defaultValue={produit.prix} className={champ} />
            </div>
            <div>
              <label htmlFor="stock" className={label}>Stock</label>
              <input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={produit.stock} className={champ} />
            </div>
          </div>
          <div>
            <label htmlFor="categorieId" className={label}>Catégorie</label>
            <select id="categorieId" name="categorieId" required defaultValue={produit.categorieId} className={champ}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">Prix actuel : {formaterXAF(produit.prix)}</p>
          <button type="submit" className="w-full rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark">
            Enregistrer les modifications
          </button>
        </form>
      </section>

      {/* --- Suppression --- */}
      <section className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Zone dangereuse</h2>
        <form action={supprimerProduitAction} className="mt-2">
          <input type="hidden" name="produitId" value={produit.id} />
          <button type="submit" className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            Supprimer ce produit
          </button>
        </form>
      </section>
    </div>
  );
}

function StatutButton({
  produitId,
  statut,
  libelle,
}: {
  produitId: string;
  statut: "ACTIF" | "INACTIF" | "BROUILLON";
  libelle: string;
}) {
  return (
    <form action={changerStatutProduitAction}>
      <input type="hidden" name="produitId" value={produitId} />
      <input type="hidden" name="statut" value={statut} />
      <button
        type="submit"
        className="rounded bg-nile px-3 py-1.5 text-sm font-medium text-white hover:bg-nile-dark"
      >
        {libelle}
      </button>
    </form>
  );
}
