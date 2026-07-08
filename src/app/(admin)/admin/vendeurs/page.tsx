import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerVendeurs } from "@/modules/admin/vendeurs";
import { changerStatutVendeurAction } from "@/app/(admin)/admin/vendeurs/actions";

export const dynamic = "force-dynamic";

function BoutonStatut({
  vendeurId,
  statut,
  libelle,
  variante,
}: {
  vendeurId: string;
  statut: string;
  libelle: string;
  variante: "primaire" | "danger" | "neutre";
}) {
  const cls =
    variante === "primaire"
      ? "bg-nile text-white hover:bg-nile-dark"
      : variante === "danger"
        ? "border border-red-300 text-red-700 hover:bg-red-50"
        : "border border-gray-300 hover:bg-gray-50";
  return (
    <form action={changerStatutVendeurAction}>
      <input type="hidden" name="vendeurId" value={vendeurId} />
      <input type="hidden" name="statut" value={statut} />
      <button type="submit" className={`rounded px-3 py-1.5 text-xs font-medium ${cls}`}>
        {libelle}
      </button>
    </form>
  );
}

export default async function AdminVendeursPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const vendeurs = await listerVendeurs();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Vendeurs</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← Back-office
        </Link>
      </div>

      {ok && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Statut du vendeur mis à jour.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {vendeurs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Aucun vendeur.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
          {vendeurs.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {v.nomBoutique}
                  {v.estBoutiqueMaison && (
                    <span className="ml-2 rounded bg-nile/10 px-2 py-0.5 text-xs text-nile">maison</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {v.utilisateur.nom} · {v.utilisateur.email} · {v._count.produits} produit(s)
                </p>
              </div>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                {v.statutValidation}
              </span>
              <div className="flex gap-2">
                {v.statutValidation !== "VALIDE" && (
                  <BoutonStatut vendeurId={v.id} statut="VALIDE" libelle="Valider" variante="primaire" />
                )}
                {v.statutValidation === "EN_ATTENTE" && (
                  <BoutonStatut vendeurId={v.id} statut="REJETE" libelle="Rejeter" variante="danger" />
                )}
                {v.statutValidation === "VALIDE" && (
                  <BoutonStatut vendeurId={v.id} statut="SUSPENDU" libelle="Suspendre" variante="danger" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
