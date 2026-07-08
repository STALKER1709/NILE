import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerProduitsVendeur } from "@/modules/catalogue/produits";
import { formaterXAF } from "@/lib/money";

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
        <Link
          href="/vendeur/produits/nouveau"
          className="rounded bg-nile px-3 py-2 text-sm font-medium text-white hover:bg-nile-dark"
        >
          + Nouveau produit
        </Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {vendeur.statutValidation !== "VALIDE" && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Votre boutique est <strong>{vendeur.statutValidation}</strong>. Vous
          pouvez préparer vos produits, mais la publication (mise en ligne) sera
          possible une fois la boutique validée par un administrateur.
        </p>
      )}

      {produits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucun produit pour l'instant. Créez votre premier produit.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
          {produits.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]?.url ?? "/placeholder-produit.svg"}
                alt=""
                className="h-14 w-14 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.titre}</p>
                <p className="text-sm text-gray-500">
                  {formaterXAF(p.prix)} · stock {p.stock} ·{" "}
                  <span className="font-medium">{p.statut}</span>
                </p>
              </div>
              <Link
                href={`/vendeur/produits/${p.id}`}
                className="shrink-0 text-sm text-nile hover:underline"
              >
                Gérer
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
