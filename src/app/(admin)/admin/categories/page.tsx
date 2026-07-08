import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import {
  listerCategories,
  construireArbre,
  aplatirPourSelect,
  type CategorieAvecEnfants,
} from "@/modules/catalogue/categories";
import { creerCategorieAction } from "@/app/(admin)/admin/categories/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const categories = await listerCategories();
  const arbre = construireArbre(categories);
  const options = aplatirPourSelect(categories);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Catégories</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Back-office</Link>
      </div>

      {ok === "cree" && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Catégorie créée.</p>}
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      <Carte className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Ajouter une catégorie</h2>
        <form action={creerCategorieAction} className="space-y-3">
          <div>
            <label htmlFor="nom" className={labelClass}>Nom</label>
            <input id="nom" name="nom" required className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="parentId" className={labelClass}>Catégorie parente (facultatif)</label>
            <select id="parentId" name="parentId" defaultValue="" className={`${champClass} mt-1`}>
              <option value="">— Aucune (racine)</option>
              {options.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" className={btn("primaire", "md")}>Créer</button>
        </form>
      </Carte>

      <Carte className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Arborescence ({categories.length})</h2>
        {arbre.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune catégorie.</p>
        ) : (
          <Arbre noeuds={arbre} />
        )}
      </Carte>
    </div>
  );
}

function Arbre({ noeuds }: { noeuds: CategorieAvecEnfants[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
      {noeuds.map((n) => (
        <li key={n.id}>
          {n.nom} <span className="text-gray-400">/{n.slug}</span>
          {n.enfants.length > 0 && <Arbre noeuds={n.enfants} />}
        </li>
      ))}
    </ul>
  );
}
