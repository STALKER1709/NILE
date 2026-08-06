import Link from "next/link";
import { listerMarquesVendeur } from "@/modules/catalogue/produits";
import { redirect } from "next/navigation";
import { exigerVendeur } from "@/modules/auth/access";
import { getProduitDuVendeur } from "@/modules/catalogue/produits";
import { listerCategories, aplatirPourSelect } from "@/modules/catalogue/categories";
import {
  mettreAJourProduitAction,
  changerStatutProduitAction,
  supprimerProduitAction,
  restaurerProduitAction,
  ajouterImageAction,
  supprimerImageAction,
} from "@/app/(vendeur)/vendeur/produits/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Badge, Prix, champClass, labelClass, btn } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

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
  const marques = await listerMarquesVendeur(vendeur.id);

  // Produit dans la corbeille : vue restreinte, restauration d'abord —
  // pas de formulaire d'édition sur quelque chose qui n'existe plus pour
  // l'acheteur ni pour le catalogue vendeur actif.
  if (produit.statut === "SUPPRIME") {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="truncate text-titre-sm text-nile-800 sm:text-titre-md">{produit.titre}</h1>
          <Link href="/vendeur/produits" className="shrink-0 text-sm text-slate-500 hover:underline">← Mes produits</Link>
        </div>

        {ok && MESSAGES_OK[ok] && (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>
        )}
        {erreur && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
        )}

        <Carte className="p-4">
          <div className="flex items-center gap-3">
            <Vignette url={produit.images[0]?.url} alt="" sizes="64px" className="h-16 w-16 shrink-0 rounded border border-contour-carte" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{produit.titre}</p>
              <Prix montant={produit.prix} className="text-sm text-slate-500" />
            </div>
          </div>
          <p className="mt-4 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
            Ce produit est dans la corbeille : invisible du catalogue et de
            votre inventaire actif. Restaurez-le pour le modifier ou le
            republier.
          </p>
          <form action={restaurerProduitAction} className="mt-4">
            <input type="hidden" name="produitId" value={produit.id} />
            <button type="submit" className={btn("primaire", "md", "w-full")}>
              Restaurer ce produit
            </button>
          </form>
        </Carte>
      </div>
    );
  }

  const categories = aplatirPourSelect(await listerCategories());

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="truncate text-titre-sm text-nile-800 sm:text-titre-md">{produit.titre}</h1>
        <Link href="/vendeur/produits" className="shrink-0 text-sm text-slate-500 hover:underline">← Mes produits</Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
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
        <h2 className="text-sm font-bold text-slate-900">Images</h2>
        {produit.images.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {produit.images.map((img) => (
              <li key={img.id}>
                <Vignette url={img.url} alt="" sizes="80px" className="h-20 w-20 rounded border border-contour-carte" />
                <form action={supprimerImageAction}>
                  <input type="hidden" name="produitId" value={produit.id} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <button type="submit" className="mt-1 w-full text-xs text-red-600 hover:underline">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucune image.</p>
        )}
        <form action={ajouterImageAction} encType="multipart/form-data" className="mt-3 flex items-end gap-2">
          <input type="hidden" name="produitId" value={produit.id} />
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className={champClass} />
          <BoutonSoumettre enCours="Envoi…" className={btn("secondaire", "md")}>Ajouter</BoutonSoumettre>
        </form>
      </Carte>

      {/* Informations */}
      <Carte className="p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Informations</h2>
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
            <label htmlFor="marque" className={labelClass}>
              Marque <span className="font-normal text-slate-500">(facultatif)</span>
            </label>
            {/* Saisie libre, mais les marques déjà utilisées sont proposées :
                sans cela « Nike », « NIKE » et « nike » se multiplieraient et
                le filtre du catalogue deviendrait inutilisable. */}
            <input
              id="marque"
              name="marque"
              list="marques-connues"
              maxLength={60}
              placeholder="Ex. Nike"
              defaultValue={produit.marque ?? ""}
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
            <select id="categorieId" name="categorieId" required defaultValue={produit.categorieId} className={`${champClass} mt-1`}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "md", "w-full")}>Enregistrer</BoutonSoumettre>
        </form>
      </Carte>

      {/* Suppression */}
      <Carte className="border-red-100 bg-red-50/50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Zone dangereuse</h2>
        <p className="mt-1 text-xs text-red-700">
          Déplace le produit dans la corbeille : il disparaît de votre
          catalogue, mais reste restaurable.
        </p>
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
