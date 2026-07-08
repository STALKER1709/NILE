import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { getProduitDuVendeur } from "@/modules/catalogue/produits";
import { listerCategories, aplatirPourSelect } from "@/modules/catalogue/categories";
import {
  mettreAJourProduitAction,
  changerStatutProduitAction,
  supprimerProduitAction,
  ajouterImageAction,
  supprimerImageAction,
} from "@/app/(vendeur)/vendeur/produits/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Badge, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

const MESSAGES_OK: Record<string, string> = {
  cree: "Produit créé. Ajoutez des images et publiez-le.",
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
        <Link href="/vendeur/produits" className="shrink-0 text-sm text-gray-500 hover:underline">← Mes produits</Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>
      )}
      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {/* Statut / publication */}
      <Carte className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Statut</span>
          <Badge ton={produit.statut === "ACTIF" ? "vert" : produit.statut === "REJETE" ? "rouge" : "neutre"}>{produit.statut}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {produit.statut !== "ACTIF" && <BoutonStatut id={produit.id} statut="ACTIF" libelle="Publier" />}
          {produit.statut === "ACTIF" && <BoutonStatut id={produit.id} statut="INACTIF" libelle="Dépublier" variante="secondaire" />}
          {produit.statut !== "BROUILLON" && <BoutonStatut id={produit.id} statut="BROUILLON" libelle="Brouillon" variante="secondaire" />}
          {produit.statut === "ACTIF" && (
            <Link href={`/produit/${produit.slug}`} className={btn("ghost", "sm")}>Voir la fiche</Link>
          )}
        </div>
      </Carte>

      {/* Images */}
      <Carte className="p-4">
        <h2 className="text-sm font-semibold">Images</h2>
        {produit.images.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {produit.images.map((img) => (
              <li key={img.id}>
                <Vignette url={img.url} alt="" sizes="80px" className="h-20 w-20 rounded-lg border border-gray-100" />
                <form action={supprimerImageAction}>
                  <input type="hidden" name="produitId" value={produit.id} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <button type="submit" className="mt-1 w-full text-xs text-red-600 hover:underline">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Aucune image.</p>
        )}
        <form action={ajouterImageAction} encType="multipart/form-data" className="mt-3 flex items-end gap-2">
          <input type="hidden" name="produitId" value={produit.id} />
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className={champClass} />
          <button type="submit" className={btn("secondaire", "md")}>Ajouter</button>
        </form>
      </Carte>

      {/* Informations */}
      <Carte className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Informations</h2>
        <form action={mettreAJourProduitAction} className="space-y-4">
          <input type="hidden" name="produitId" value={produit.id} />
          <div>
            <label htmlFor="titre" className={labelClass}>Titre</label>
            <input id="titre" name="titre" required defaultValue={produit.titre} className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea id="description" name="description" required rows={4} defaultValue={produit.description} className={`${champClass} mt-1`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prix" className={labelClass}>Prix (FCFA)</label>
              <input id="prix" name="prix" type="number" min={1} step={1} required defaultValue={produit.prix} className={`${champClass} mt-1`} />
            </div>
            <div>
              <label htmlFor="stock" className={labelClass}>Stock</label>
              <input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={produit.stock} className={`${champClass} mt-1`} />
            </div>
          </div>
          <div>
            <label htmlFor="categorieId" className={labelClass}>Catégorie</label>
            <select id="categorieId" name="categorieId" required defaultValue={produit.categorieId} className={`${champClass} mt-1`}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" className={btn("primaire", "md", "w-full")}>Enregistrer</button>
        </form>
      </Carte>

      {/* Suppression */}
      <Carte className="border-red-100 bg-red-50/50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Zone dangereuse</h2>
        <form action={supprimerProduitAction} className="mt-2">
          <input type="hidden" name="produitId" value={produit.id} />
          <button type="submit" className={btn("danger", "md")}>Supprimer ce produit</button>
        </form>
      </Carte>
    </div>
  );
}

function BoutonStatut({
  id,
  statut,
  libelle,
  variante = "primaire",
}: {
  id: string;
  statut: "ACTIF" | "INACTIF" | "BROUILLON";
  libelle: string;
  variante?: "primaire" | "secondaire";
}) {
  return (
    <form action={changerStatutProduitAction}>
      <input type="hidden" name="produitId" value={id} />
      <input type="hidden" name="statut" value={statut} />
      <button type="submit" className={btn(variante, "sm")}>{libelle}</button>
    </form>
  );
}
