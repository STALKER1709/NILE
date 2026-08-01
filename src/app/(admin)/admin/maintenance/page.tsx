import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { apercuPurge } from "@/modules/admin/maintenance";
import {
  PHRASE_PURGE,
  PHRASE_REINITIALISATION,
} from "@/modules/admin/suppression-core";
import {
  purgerHistoriqueAction,
  reinitialiserAction,
  supprimerUtilisateurAction,
} from "@/app/(admin)/admin/maintenance/actions";
import { Carte, champClass, btn } from "@/components/ui/kit";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance" };

const MESSAGES_OK: Record<string, string> = {
  purge: "Historique effacé.",
  reinit: "Plateforme réinitialisée.",
  compte_supprime: "Compte supprimé.",
  compte_anonymise: "Compte anonymisé : son historique de vente est conservé.",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; commandes?: string; avis?: string; produits?: string; utilisateurs?: string }>;
}) {
  const sp = await searchParams;
  const admin = await exigerRole("ADMIN");
  const [apercu, utilisateurs] = await Promise.all([
    apercuPurge(admin.id),
    prisma.utilisateur.findMany({
      orderBy: { dateCreation: "desc" },
      take: 100,
      select: {
        id: true, nom: true, email: true, role: true, statut: true,
        _count: { select: { commandes: true, avis: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titre-md font-bold text-nile-900">Maintenance</h1>
        <p className="text-sm text-slate-500">
          Suppressions de comptes et purges de données. Ces opérations sont
          irréversibles.
        </p>
      </div>

      {sp.ok && MESSAGES_OK[sp.ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {MESSAGES_OK[sp.ok]}
          {sp.ok === "purge" && ` ${sp.commandes ?? 0} commande(s), ${sp.avis ?? 0} avis.`}
          {sp.ok === "reinit" && ` ${sp.produits ?? 0} produit(s), ${sp.utilisateurs ?? 0} compte(s).`}
        </p>
      )}
      {sp.erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.erreur}</p>
      )}

      {/* Ce que la base protège d'elle-même : à dire avant, pas au moment de l'échec. */}
      <Carte className="p-5">
        <h2 className="font-bold text-slate-900">Ce qui ne peut pas être effacé</h2>
        <p className="mt-1 text-sm text-slate-600">
          Une vente laisse des écritures que la base refuse de détruire. Quand
          la suppression franche est impossible, NILE bascule automatiquement :
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>· Un <strong>produit déjà commandé</strong> part en corbeille au lieu d&apos;être effacé.</li>
          <li>· Un <strong>compte ayant commandé, noté ou vendu</strong> est anonymisé : nom, email et téléphone remplacés, connexion supprimée, historique de vente conservé.</li>
        </ul>
      </Carte>

      {/* Comptes */}
      <Carte className="overflow-hidden">
        <div className="border-b border-contour-carte p-5">
          <h2 className="font-bold text-slate-900">Comptes</h2>
          <p className="text-sm text-slate-500">
            {utilisateurs.length} compte(s) · les 100 plus récents
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-contour-carte bg-surface-basse text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Compte</th>
                <th className="px-5 py-3 font-semibold">Rôle</th>
                <th className="px-5 py-3 text-center font-semibold">Historique</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {utilisateurs.map((u) => {
                const aHistorique = u._count.commandes + u._count.avis > 0;
                const soiMeme = u.id === admin.id;
                return (
                  <tr key={u.id} className="hover:bg-surface-subtile">
                    <td className="px-5 py-3">
                      <span className="block font-medium text-slate-900">{u.nom}</span>
                      <span className="block truncate text-xs text-slate-500">{u.email}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.role}</td>
                    <td className="px-5 py-3 text-center text-xs text-slate-500">
                      {aHistorique
                        ? `${u._count.commandes} cmd · ${u._count.avis} avis`
                        : "aucun"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {soiMeme ? (
                        <span className="text-xs text-slate-400">votre compte</span>
                      ) : (
                        <form action={supprimerUtilisateurAction}>
                          <input type="hidden" name="utilisateurId" value={u.id} />
                          <input type="hidden" name="retour" value="/admin/maintenance" />
                          <BoutonConfirme
                            question={
                              aHistorique
                                ? `Anonymiser « ${u.nom} » ? Ses données personnelles seront effacées et il ne pourra plus se connecter. Son historique de vente sera conservé.`
                                : `Supprimer définitivement « ${u.nom} » ? Cette action est irréversible.`
                            }
                            enCours="…"
                            className={btn("danger", "sm")}
                          >
                            {aHistorique ? "Anonymiser" : "Supprimer"}
                          </BoutonConfirme>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Carte>

      {/* Purge de l'historique */}
      <Carte className="border-amber-200 bg-accent-fixe/40 p-5">
        <h2 className="font-bold text-amber-900">Effacer l&apos;historique</h2>
        <p className="mt-1 text-sm text-amber-900">
          Efface <strong>{apercu.commandes} commande(s)</strong>, {apercu.avis} avis,{" "}
          {apercu.reversements} reversement(s), {apercu.promotions} promotion(s),{" "}
          {apercu.annonces} annonce(s) et {apercu.lignesPanier} ligne(s) de panier.
          <br />
          Conserve les comptes, le catalogue et les catégories. C&apos;est la
          remise à zéro avant lancement.
        </p>
        <form action={purgerHistoriqueAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label htmlFor="conf-purge" className="block text-xs font-medium text-amber-900">
              Recopiez « {PHRASE_PURGE} » pour confirmer
            </label>
            <input
              id="conf-purge"
              name="confirmation"
              required
              autoComplete="off"
              placeholder={PHRASE_PURGE}
              className={`${champClass} mt-1`}
            />
          </div>
          <button type="submit" className={btn("danger", "md")}>
            Effacer l&apos;historique
          </button>
        </form>
      </Carte>

      {/* Réinitialisation complète */}
      <Carte className="border-red-300 bg-red-50 p-5">
        <h2 className="font-bold text-red-800">Tout réinitialiser</h2>
        <p className="mt-1 text-sm text-red-800">
          Efface l&apos;historique <strong>et</strong> {apercu.produits} produit(s),{" "}
          {apercu.vendeurs} boutique(s) et {apercu.utilisateursSupprimables} compte(s).
          Seul votre compte administrateur est conservé.
          <br />
          <strong>Le catalogue sera entièrement à refaire.</strong>
        </p>
        <form action={reinitialiserAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label htmlFor="conf-reinit" className="block text-xs font-medium text-red-800">
              Recopiez « {PHRASE_REINITIALISATION} » pour confirmer
            </label>
            <input
              id="conf-reinit"
              name="confirmation"
              required
              autoComplete="off"
              placeholder={PHRASE_REINITIALISATION}
              className={`${champClass} mt-1`}
            />
          </div>
          <button type="submit" className={btn("danger", "md")}>
            Tout réinitialiser
          </button>
        </form>
      </Carte>

      <p className="text-sm text-slate-500">
        Pour retirer un produit précis, passez par{" "}
        <Link href="/admin/moderation" className="font-semibold text-nile-700 hover:underline">
          la modération
        </Link>
        .
      </p>
    </div>
  );
}
