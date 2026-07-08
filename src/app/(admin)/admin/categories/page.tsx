import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import {
  listerCategories,
  construireArbre,
  aplatirPourSelect,
  type CategorieAvecEnfants,
} from "@/modules/catalogue/categories";
import { creerCategorieAction } from "@/app/(admin)/admin/categories/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

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
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← Back-office
        </Link>
      </div>

      {ok === "cree" && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Catégorie créée.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Ajouter une catégorie</h2>
        <form action={creerCategorieAction} className="space-y-3">
          <div>
            <label htmlFor="nom" className={label}>Nom</label>
            <input id="nom" name="nom" required className={champ} />
          </div>
          <div>
            <label htmlFor="parentId" className={label}>Catégorie parente (facultatif)</label>
            <select id="parentId" name="parentId" defaultValue="" className={champ}>
              <option value="">— Aucune (catégorie racine)</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark">
            Créer
          </button>
        </form>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Arborescence ({categories.length})</h2>
        {arbre.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune catégorie.</p>
        ) : (
          <ArbreCategories noeuds={arbre} />
        )}
      </section>
    </div>
  );
}

function ArbreCategories({ noeuds }: { noeuds: CategorieAvecEnfants[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-sm">
      {noeuds.map((n) => (
        <li key={n.id}>
          {n.nom} <span className="text-gray-400">/{n.slug}</span>
          {n.enfants.length > 0 && <ArbreCategories noeuds={n.enfants} />}
        </li>
      ))}
    </ul>
  );
}
