import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerProduitsModeration } from "@/modules/admin/moderation";
import { modererProduitAction } from "@/app/(admin)/admin/moderation/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, Badge, btn } from "@/components/ui/kit";

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
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Back-office</Link>
      </div>

      {ok && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Produit mis à jour.</p>}
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      <div className="space-y-2">
        {produits.map((p) => (
          <Carte key={p.id} className="flex items-center gap-3 p-3">
            <Vignette url={p.images?.[0]?.url} alt="" sizes="48px" className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.titre}</p>
              <p className="text-xs text-gray-500">{p.vendeur.nomBoutique} · {p.categorie.nom} · <Prix montant={p.prix} /></p>
            </div>
            <Badge ton={p.statut === "ACTIF" ? "vert" : p.statut === "REJETE" ? "rouge" : "neutre"}>{p.statut}</Badge>
            {p.statut !== "REJETE" ? (
              <form action={modererProduitAction}>
                <input type="hidden" name="produitId" value={p.id} />
                <input type="hidden" name="statut" value="REJETE" />
                <button type="submit" className={btn("danger", "sm")}>Rejeter</button>
              </form>
            ) : (
              <form action={modererProduitAction}>
                <input type="hidden" name="produitId" value={p.id} />
                <input type="hidden" name="statut" value="ACTIF" />
                <button type="submit" className={btn("primaire", "sm")}>Réactiver</button>
              </form>
            )}
          </Carte>
        ))}
      </div>
    </div>
  );
}
