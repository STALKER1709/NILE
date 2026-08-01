import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerProduitsModeration } from "@/modules/admin/moderation";
import { modererProduitAction } from "@/app/(admin)/admin/moderation/actions";
import { supprimerProduitAdminAction } from "@/app/(admin)/admin/maintenance/actions";
import { Vignette } from "@/components/ui/Vignette";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
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
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Modération du catalogue</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      {ok && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Produit mis à jour.</p>}
      {erreur && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      <div className="space-y-2">
        {produits.map((p) => (
          <Carte key={p.id} className="flex items-center gap-3 p-3">
            <Vignette url={p.images?.[0]?.url} alt="" sizes="48px" className="h-12 w-12 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.titre}</p>
              <p className="text-xs text-slate-500">{p.vendeur.nomBoutique} · {p.categorie.nom} · <Prix montant={p.prix} /></p>
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
            {/* Suppression : définitive si le produit n'a jamais été commandé,
                mise en corbeille sinon — la commande le référence. */}
            <form action={supprimerProduitAdminAction}>
              <input type="hidden" name="produitId" value={p.id} />
              <input type="hidden" name="retour" value="/admin/moderation" />
              <BoutonConfirme
                question={`Supprimer « ${p.titre} » ? S'il figure dans des commandes, il sera mis en corbeille au lieu d'être effacé.`}
                enCours="…"
                titre="Supprimer ce produit"
                className="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-400 transition-colors hover:bg-promo-conteneur hover:text-promo disabled:opacity-50"
              >
                <span className="sr-only">Supprimer {p.titre}</span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </BoutonConfirme>
            </form>
          </Carte>
        ))}
      </div>
    </div>
  );
}
