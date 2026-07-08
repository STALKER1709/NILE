import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerProduitsVendeur } from "@/modules/catalogue/produits";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, Badge, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

const MESSAGES_OK: Record<string, string> = {
  cree: "Produit créé.",
  maj: "Produit mis à jour.",
  statut: "Statut mis à jour.",
  supprime: "Produit supprimé.",
};

export default async function ListeProduitsVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const produits = await listerProduitsVendeur(vendeur.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mes produits</h1>
        <Link href="/vendeur/produits/nouveau" className={btn("primaire", "md")}>+ Nouveau</Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>
      )}
      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {vendeur.statutValidation !== "VALIDE" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Boutique <strong>{vendeur.statutValidation}</strong> — publication possible une fois validée.
        </p>
      )}

      {produits.length === 0 ? (
        <EtatVide titre="Aucun produit pour l'instant.">Créez votre premier produit.</EtatVide>
      ) : (
        <div className="space-y-2">
          {produits.map((p) => (
            <Link key={p.id} href={`/vendeur/produits/${p.id}`} className="block">
              <Carte className="flex items-center gap-3 p-3 transition hover:shadow-flottant">
                <Vignette url={p.images[0]?.url} alt="" sizes="56px" className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.titre}</p>
                  <p className="text-sm text-gray-500"><Prix montant={p.prix} /> · stock {p.stock}</p>
                </div>
                <Badge ton={p.statut === "ACTIF" ? "vert" : p.statut === "REJETE" ? "rouge" : "neutre"}>{p.statut}</Badge>
              </Carte>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
