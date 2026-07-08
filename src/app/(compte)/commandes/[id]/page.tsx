import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getCommandeAcheteur } from "@/modules/commande/commande";
import { formaterXAF } from "@/lib/money";
import { annulerCommandeAction } from "@/app/(compte)/commandes/actions";

export const dynamic = "force-dynamic";

const ETAPES_COMMANDE = [
  "EN_ATTENTE",
  "CONFIRMEE",
  "EN_PREPARATION",
  "EXPEDIEE",
  "LIVREE",
] as const;

export default async function DetailCommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const utilisateur = await exigerConnexion();

  const commande = await getCommandeAcheteur(utilisateur.id, id);
  if (!commande) notFound();

  const annulable =
    commande.statutCommande === "EN_ATTENTE" ||
    commande.statutCommande === "CONFIRMEE";
  const annulee = commande.statutCommande === "ANNULEE";
  const etapeCourante = ETAPES_COMMANDE.indexOf(
    commande.statutCommande as (typeof ETAPES_COMMANDE)[number],
  );

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{commande.numero}</h1>
        <Link href="/commandes" className="text-sm text-gray-500 hover:underline">
          ← Mes commandes
        </Link>
      </div>

      {ok === "creee" && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Commande enregistrée ! Vous paierez à la livraison.
        </p>
      )}
      {ok === "annulee" && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Commande annulée. Les articles ont été remis en stock.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {/* Statuts */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span>Statut commande</span>
          <span className="font-semibold">{commande.statutCommande}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span>Statut paiement</span>
          <span className="font-semibold">{commande.statutPaiement}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span>Mode de paiement</span>
          <span className="font-semibold">
            {commande.modePaiement === "COD" ? "À la livraison" : commande.modePaiement}
          </span>
        </div>

        {!annulee && (
          <ol className="mt-3 flex flex-wrap gap-1 text-xs">
            {ETAPES_COMMANDE.map((etape, i) => (
              <li
                key={etape}
                className={`rounded px-2 py-1 ${
                  i <= etapeCourante
                    ? "bg-nile text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {etape}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Articles */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Articles</h2>
        <ul className="space-y-1 text-sm text-gray-600">
          {commande.lignes.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span className="truncate">{l.titreProduit} × {l.quantite}</span>
              <span>{formaterXAF(l.sousTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-semibold">
          <span>Total</span>
          <span className="text-nile">{formaterXAF(commande.total)}</span>
        </div>
      </section>

      {/* Livraison */}
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Livraison</h2>
        <p className="text-sm text-gray-600">{commande.destNom} · {commande.destTelephone}</p>
        <p className="text-sm text-gray-600">
          {commande.quartier}, {commande.ville}
        </p>
        {commande.reperes && (
          <p className="text-sm text-gray-500">Repères : {commande.reperes}</p>
        )}
      </section>

      {annulable && (
        <form action={annulerCommandeAction}>
          <input type="hidden" name="commandeId" value={commande.id} />
          <button
            type="submit"
            className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Annuler la commande
          </button>
        </form>
      )}
    </div>
  );
}
