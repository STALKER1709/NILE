import Link from "next/link";
import { listerVariantesVendeur } from "@/modules/catalogue/variantes";
import { axesDeCategorie } from "@/modules/catalogue/axes";
import { libelleVariante, trierSelonAxe } from "@/modules/catalogue/variante-core";
import {
  ajouterVarianteAction,
  majStockVarianteAction,
  basculerVarianteAction,
  supprimerVarianteAction,
} from "@/app/(vendeur)/vendeur/produits/variantes-actions";
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
  const [marques, variantes, axes] = await Promise.all([
    listerMarquesVendeur(vendeur.id),
    listerVariantesVendeur(vendeur.id, id),
    axesDeCategorie(produit.categorieId),
  ]);

  // Un article est décliné dès qu'il porte autre chose que la déclinaison par
  // défaut (deux axes vides). Le champ « Stock » du formulaire ne s'applique
  // qu'à celle-ci : sur un article décliné, il ne pilote plus rien.
  const estDecline = (variantes ?? []).some((v) => v.valeur1 !== "" || v.valeur2 !== "");
  const stockDeclinaisons = (variantes ?? [])
    .filter((v) => v.actif)
    .reduce((somme, v) => somme + Math.max(0, v.stock), 0);

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
              {/* Article décliné : le stock se tient déclinaison par
                  déclinaison, plus bas. Ce champ n'alimente plus rien —
                  laisser un chiffre modifiable ferait croire au vendeur qu'il
                  vient de réapprovisionner. */}
              <input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step={1}
                required
                readOnly={estDecline}
                aria-describedby={estDecline ? "stock-decline" : undefined}
                defaultValue={estDecline ? stockDeclinaisons : produit.stock}
                className={`${champClass} mt-1 ${estDecline ? "bg-slate-100 text-slate-500" : ""}`}
              />
              {estDecline && (
                <p id="stock-decline" className="mt-1 text-xs text-slate-500">
                  Total des déclinaisons — modifiable plus bas.
                </p>
              )}
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

      {/* Déclinaisons */}
      <Carte className="p-4">
        <h2 className="text-sm font-bold text-slate-900">Déclinaisons</h2>
        {axes.length === 0 ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            La catégorie de ce produit ne déclare aucun axe : il se vend en une
            seule version, et le champ « Stock » ci-dessus suffit. Pour le
            décliner par taille ou par couleur, un administrateur doit
            d&apos;abord déclarer ces axes sur la catégorie.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Chaque combinaison a son propre stock. Dès la première
              déclinaison ajoutée, le champ « Stock » ci-dessus cesse de
              s&apos;appliquer : c&apos;est ici que tout se gère.
            </p>

            <div className="mt-3 space-y-2">
              {(variantes ?? []).map((v) => {
                const estDefaut = !v.valeur1 && !v.valeur2;
                return (
                  <div
                    key={v.id}
                    className={`flex flex-wrap items-center gap-2 rounded border p-2 ${
                      v.actif ? "border-contour-carte" : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    {/* Jamais tronqué : « Taille M · Co… » s'affiche à
                        l'identique pour le noir et le blanc, et le vendeur ne
                        sait plus quel stock il est en train de corriger. Le
                        libellé prend donc sa propre ligne quand il le faut. */}
                    <span className="w-full text-sm font-medium text-slate-900 sm:w-auto sm:min-w-[9rem] sm:flex-1">
                      {estDefaut ? "Version unique (sans déclinaison)" : libelleVariante(v, axes)}
                    </span>

                    <form action={majStockVarianteAction} className="flex items-center gap-1">
                      <input type="hidden" name="produitId" value={produit.id} />
                      <input type="hidden" name="varianteId" value={v.id} />
                      <label htmlFor={`stock-${v.id}`} className="text-xs text-slate-500">
                        Stock
                      </label>
                      <input
                        id={`stock-${v.id}`}
                        name="stock"
                        type="number"
                        min={0}
                        defaultValue={v.stock}
                        className={`${champClass} w-20`}
                      />
                      <BoutonSoumettre className={btn("secondaire", "sm")}>OK</BoutonSoumettre>
                    </form>

                    {/* Désactiver plutôt que supprimer : les commandes passées
                        y font référence, et une déclinaison se réactive au
                        réassort. */}
                    <form action={basculerVarianteAction}>
                      <input type="hidden" name="produitId" value={produit.id} />
                      <input type="hidden" name="varianteId" value={v.id} />
                      <BoutonSoumettre className={btn("secondaire", "sm")}>
                        {v.actif ? "Retirer de la vente" : "Remettre en vente"}
                      </BoutonSoumettre>
                    </form>

                    {!estDefaut && (
                      <form action={supprimerVarianteAction}>
                        <input type="hidden" name="produitId" value={produit.id} />
                        <input type="hidden" name="varianteId" value={v.id} />
                        <BoutonSoumettre className="text-xs text-red-600 hover:underline">
                          Supprimer
                        </BoutonSoumettre>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            <form
              action={ajouterVarianteAction}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-contour-carte pt-3"
            >
              <input type="hidden" name="produitId" value={produit.id} />
              {axes.map((axe) => (
                <div key={axe.rang}>
                  <label htmlFor={`valeur${axe.rang}`} className={labelClass}>
                    {axe.libelle}
                  </label>
                  <select
                    id={`valeur${axe.rang}`}
                    name={`valeur${axe.rang}`}
                    required
                    defaultValue=""
                    className={`${champClass} mt-1`}
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {/* Ordonnées par le référentiel : c'est lui qui classe
                        « S, M, L, XL » comme « 36, 38, 40 ». */}
                    {trierSelonAxe(axe.valeurs, axe).map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label htmlFor="stock-nouveau" className={labelClass}>Stock</label>
                <input
                  id="stock-nouveau"
                  name="stock"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className={`${champClass} mt-1 w-24`}
                />
              </div>
              <BoutonSoumettre className={btn("primaire", "md")}>Ajouter</BoutonSoumettre>
            </form>
          </>
        )}
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
