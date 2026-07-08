import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getCommandeAcheteur } from "@/modules/commande/commande";
import { formaterXAF } from "@/lib/money";
import {
  annulerCommandeAction,
  reprendrePaiementAction,
} from "@/app/(compte)/commandes/actions";

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
  const paiementARelancer =
    commande.modePaiement === "MONETBIL" &&
    commande.statutPaiement === "EN_ATTENTE" &&
    commande.statutCommande === "EN_ATTENTE";
  const annulee = commande.statutCommande === "ANNULEE";
  const refusee = commande.statutCommande === "REFUSEE";
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
      {ok === "paye" && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Paiement confirmé. Merci !
        </p>
      )}
      {ok === "echec" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Le paiement a échoué. La commande a été annulée et le stock restitué.
        </p>
      )}

      {paiementARelancer && (
        <form action={reprendrePaiementAction}>
          <input type="hidden" name="commandeId" value={commande.id} />
          <button
            type="submit"
            className="w-full rounded bg-nile px-4 py-3 text-sm font-medium text-white hover:bg-nile-dark"
          >
            Payer maintenant (Mobile Money)
          </button>
        </form>
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

        {!annulee && !refusee && (
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
        {annulee && (
          <p className="mt-3 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Commande annulée.
          </p>
        )}
        {refusee && (
          <p className="mt-3 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
            Commande refusée à la livraison.
          </p>
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
        {commande.livraison && (
          <div className="mt-2 border-t border-gray-100 pt-2 text-sm">
            <p className="text-gray-600">
              Suivi : <span className="font-medium">{commande.livraison.statut}</span>
              {commande.livraison.transporteur && (
                <> · {commande.livraison.transporteur}</>
              )}
            </p>
            {commande.livraison.dateLivraison && (
              <p className="text-xs text-gray-500">
                Livrée le{" "}
                {new Date(commande.livraison.dateLivraison).toLocaleDateString("fr-FR")}
              </p>
            )}
            {commande.livraison.preuveUrl && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Preuve de livraison</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={commande.livraison.preuveUrl}
                  alt="Preuve de livraison"
                  className="mt-1 h-24 rounded object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
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
