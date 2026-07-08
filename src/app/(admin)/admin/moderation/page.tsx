import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerProduitsModeration } from "@/modules/admin/moderation";
import { formaterXAF } from "@/lib/money";
import { modererProduitAction } from "@/app/(admin)/admin/moderation/actions";

export const dynamic = "force-dynamic";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const produits = await listerProduitsModeration();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Modération du catalogue</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← Back-office
        </Link>
      </div>

      {ok && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Produit mis à jour.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
        {produits.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.titre}</p>
              <p className="text-xs text-gray-500">
                {p.vendeur.nomBoutique} · {p.categorie.nom} · {formaterXAF(p.prix)}
              </p>
            </div>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">{p.statut}</span>
            <div className="flex gap-2">
              {p.statut !== "REJETE" && (
                <form action={modererProduitAction}>
                  <input type="hidden" name="produitId" value={p.id} />
                  <input type="hidden" name="statut" value="REJETE" />
                  <button type="submit" className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
                    Rejeter
                  </button>
                </form>
              )}
              {p.statut === "REJETE" && (
                <form action={modererProduitAction}>
                  <input type="hidden" name="produitId" value={p.id} />
                  <input type="hidden" name="statut" value="ACTIF" />
                  <button type="submit" className="rounded bg-nile px-3 py-1.5 text-xs font-medium text-white hover:bg-nile-dark">
                    Réactiver
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
