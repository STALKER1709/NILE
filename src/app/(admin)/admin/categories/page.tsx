import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import {
  listerCategories,
  construireArbre,
  aplatirPourSelect,
  type CategorieAvecEnfants,
} from "@/modules/catalogue/categories";
import { creerCategorieAction } from "@/app/(admin)/admin/categories/actions";
import {
  declarerAxeAction,
  retirerAxeAction,
} from "@/app/(admin)/admin/categories/axes-actions";
import { axesDeclares, type AxeAdmin } from "@/modules/catalogue/axes";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const [categories, axesParCat] = await Promise.all([
    listerCategories(),
    axesDeclares(),
  ]);
  const arbre = construireArbre(categories);
  const options = aplatirPourSelect(categories);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Catégories</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      {ok === "cree" && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Catégorie créée.</p>}
      {erreur && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      <Carte className="p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Ajouter une catégorie</h2>
        <form action={creerCategorieAction} className="space-y-3">
          <div>
            <label htmlFor="nom" className={labelClass}>Nom</label>
            <input id="nom" name="nom" required className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="parentId" className={labelClass}>Catégorie parente (facultatif)</label>
            <select id="parentId" name="parentId" defaultValue="" className={`${champClass} mt-1`}>
              <option value="">- Aucune (racine)</option>
              {options.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" className={btn("primaire", "md")}>Créer</button>
        </form>
      </Carte>

      <Carte className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Axes de déclinaison</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Ce que les vendeurs pourront renseigner et les acheteurs choisir sur
          les articles de cette catégorie — « Taille » pour un vêtement,
          « Pointure » pour une chaussure. Une catégorie sans axe n&apos;affiche
          aucun sélecteur : c&apos;est ainsi qu&apos;on ne demande jamais une
          télévision en taille M. Les sous-catégories héritent des axes de leur
          parent tant qu&apos;elles n&apos;en déclarent aucun.
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-700">
          L&apos;ordre des valeurs est conservé tel que vous le saisissez : il
          sert à l&apos;affichage. Écrivez « S, M, L, XL » et non « L, M, S, XL ».
        </p>

        <div className="mt-4 space-y-4">
          {options.map((opt) => {
            const axes = axesParCat.get(opt.id) ?? [];
            return (
              <div key={opt.id} className="rounded border border-contour-carte p-3">
                <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[1, 2].map((rang) => (
                    <FormAxe
                      key={rang}
                      categorieId={opt.id}
                      rang={rang}
                      axe={axes.find((a) => a.rang === rang)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Carte>

      <Carte className="p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Arborescence ({categories.length})</h2>
        {arbre.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune catégorie.</p>
        ) : (
          <Arbre noeuds={arbre} />
        )}
      </Carte>
    </div>
  );
}

function Arbre({ noeuds }: { noeuds: CategorieAvecEnfants[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-sm text-slate-700">
      {noeuds.map((n) => (
        <li key={n.id}>
          {n.nom} <span className="text-slate-400">/{n.slug}</span>
          {n.enfants.length > 0 && <Arbre noeuds={n.enfants} />}
        </li>
      ))}
    </ul>
  );
}

/**
 * Déclaration d'un axe. Deux au maximum par catégorie : au-delà, le nombre de
 * combinaisons à saisir devient ingérable pour un vendeur.
 */
function FormAxe({
  categorieId,
  rang,
  axe,
}: {
  categorieId: string;
  rang: number;
  axe?: AxeAdmin;
}) {
  return (
    <div className="rounded bg-surface-basse p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Axe {rang}
        </span>
        {axe && (
          <form action={retirerAxeAction}>
            <input type="hidden" name="categorieId" value={categorieId} />
            <input type="hidden" name="rang" value={rang} />
            {/* Retirer un axe ne touche pas aux déclinaisons déjà créées ni aux
                commandes passées : cela dit « on ne propose plus ce choix ». */}
            <BoutonSoumettre className="text-xs text-red-600 hover:underline">
              Retirer
            </BoutonSoumettre>
          </form>
        )}
      </div>
      <form action={declarerAxeAction} className="mt-2 space-y-2">
        <input type="hidden" name="categorieId" value={categorieId} />
        <input type="hidden" name="rang" value={rang} />
        <input
          name="libelle"
          defaultValue={axe?.libelle ?? ""}
          placeholder={rang === 1 ? "Taille" : "Couleur"}
          className={champClass}
        />
        <input
          name="valeurs"
          defaultValue={axe?.valeurs.join(", ") ?? ""}
          placeholder={rang === 1 ? "XS, S, M, L, XL" : "Noir, Blanc, Bleu"}
          className={champClass}
        />
        <BoutonSoumettre className={btn("secondaire", "sm", "w-full")}>
          {axe ? "Mettre à jour" : "Déclarer"}
        </BoutonSoumettre>
      </form>
    </div>
  );
}
