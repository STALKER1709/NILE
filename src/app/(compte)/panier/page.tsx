import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { calculerTotal } from "@/modules/commande/commande-core";
import { formaterXAF } from "@/lib/money";
import {
  modifierQuantiteAction,
  retirerLigneAction,
} from "@/app/(compte)/panier/actions";

export const dynamic = "force-dynamic";

export default async function PanierPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const utilisateur = await exigerConnexion();
  const panier = await getPanierAvecLignes(utilisateur.id);

  const total = calculerTotal(
    panier.lignes.map((l) => ({ prix: l.produit.prix, quantite: l.quantite })),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Mon panier</h1>

      {ok === "ajoute" && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Produit ajouté au panier.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {panier.lignes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Votre panier est vide.{" "}
          <Link href="/catalogue" className="text-nile hover:underline">
            Parcourir le catalogue
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
            {panier.lignes.map((l) => {
              const indisponible =
                l.produit.statut !== "ACTIF" ||
                l.produit.vendeur.statutValidation !== "VALIDE";
              const stockInsuffisant = l.produit.stock < l.quantite;
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.produit.images[0]?.url ?? "/placeholder-produit.svg"}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produit/${l.produit.slug}`}
                      className="truncate font-medium hover:underline"
                    >
                      {l.produit.titre}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {formaterXAF(l.produit.prix)} × {l.quantite} ={" "}
                      <span className="font-medium">
                        {formaterXAF(l.produit.prix * l.quantite)}
                      </span>
                    </p>
                    {indisponible && (
                      <p className="text-xs font-medium text-red-600">
                        Produit indisponible — retirez-le pour commander.
                      </p>
                    )}
                    {!indisponible && stockInsuffisant && (
                      <p className="text-xs font-medium text-red-600">
                        Stock restant : {l.produit.stock}. Réduisez la quantité.
                      </p>
                    )}
                  </div>
                  <form action={modifierQuantiteAction} className="flex items-center gap-1">
                    <input type="hidden" name="ligneId" value={l.id} />
                    <input
                      name="quantite"
                      type="number"
                      min={0}
                      defaultValue={l.quantite}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button type="submit" className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
                      MAJ
                    </button>
                  </form>
                  <form action={retirerLigneAction}>
                    <input type="hidden" name="ligneId" value={l.id} />
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Retirer
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-nile">{formaterXAF(total)}</span>
          </div>

          <Link
            href="/commander"
            className="block rounded bg-nile px-4 py-3 text-center text-sm font-medium text-white hover:bg-nile-dark"
          >
            Passer la commande
          </Link>
        </>
      )}
    </div>
  );
}
