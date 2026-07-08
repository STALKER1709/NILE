import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { exigerConnexion } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { formaterXAF } from "@/lib/money";
import { simulerPaiementAction } from "@/app/(compte)/paiement/simulation/actions";

export const dynamic = "force-dynamic";

/**
 * Page de simulation de paiement (mode mock). En production (Monetbil),
 * l'acheteur est redirigé vers le vrai widget et ne voit jamais cette page.
 */
export default async function SimulationPaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; montant?: string }>;
}) {
  if (env.PAYMENT_PROVIDER !== "mock") notFound();
  const utilisateur = await exigerConnexion();
  const { ref, montant } = await searchParams;
  if (!ref) notFound();

  const paiement = await prisma.paiement.findUnique({
    where: { id: ref },
    include: { commande: true },
  });
  if (!paiement || paiement.commande.acheteurId !== utilisateur.id) notFound();

  const montantAffiche = montant ? Number(montant) : paiement.montant;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="rounded-lg border-2 border-dashed border-nile/40 bg-white p-5 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-nile">
          Simulation de paiement (mode test)
        </p>
        <h1 className="mt-2 text-lg font-bold">Paiement Mobile Money</h1>
        <p className="mt-1 text-sm text-gray-500">Commande {paiement.commande.numero}</p>
        <p className="mt-4 text-3xl font-bold text-nile">
          {formaterXAF(montantAffiche)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          En production, cette étape est le vrai widget Monetbil (MTN MoMo / Orange Money).
        </p>

        <div className="mt-6 space-y-2">
          <form action={simulerPaiementAction}>
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="resultat" value="succes" />
            <button
              type="submit"
              className="w-full rounded bg-nile px-4 py-3 text-sm font-medium text-white hover:bg-nile-dark"
            >
              Simuler un paiement réussi
            </button>
          </form>
          <form action={simulerPaiementAction}>
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="resultat" value="echec" />
            <button
              type="submit"
              className="w-full rounded border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Simuler un échec
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        La commande ne sera marquée « payée » que par la notification serveur vérifiée.
      </p>
    </div>
  );
}
