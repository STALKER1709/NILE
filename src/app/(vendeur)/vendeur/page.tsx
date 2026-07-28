import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSoldeVendeur } from "@/modules/reversement/reversement";
import {
  compterCommandesVendeur,
  listerCommandesVendeur,
} from "@/modules/commande/vendeur";
import { statsVendeur } from "@/modules/stats/stats";
import { ActiverNotifications } from "@/components/push/ActiverNotifications";
import { GraphBarres } from "@/components/stats/GraphBarres";
import { BadgeStatutCommande } from "@/components/commande/StatutBadges";
import { Carte, Badge, Prix, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace vendeur" };

export default async function VendeurPage() {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
    include: { _count: { select: { produits: true } } },
  });
  if (!vendeur) {
    return <p className="text-sm text-slate-500">Profil boutique introuvable.</p>;
  }
  const [solde, compteurs, stats, commandes] = await Promise.all([
    vendeur.estBoutiqueMaison ? Promise.resolve(null) : getSoldeVendeur(vendeur.id),
    compterCommandesVendeur(vendeur.id),
    statsVendeur(vendeur.id),
    listerCommandesVendeur(vendeur.id),
  ]);
  // Les 5 dernières commandes touchant cette boutique (aperçu du tableau de bord).
  const recentes = commandes.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bonjour {utilisateur.nom.split(" ")[0]}, voici l'activité de{" "}
            <span className="font-semibold text-slate-700">{vendeur.nomBoutique}</span>.
          </p>
        </div>
        <Badge ton={vendeur.statutValidation === "VALIDE" ? "vert" : "ambre"}>
          {vendeur.statutValidation === "VALIDE" ? "Boutique validée" : "En attente de validation"}
        </Badge>
      </div>

      {vendeur.statutValidation === "EN_ATTENTE" && (
        <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
          Votre boutique est en attente de validation. Vous pouvez préparer vos
          produits ; la publication sera possible une fois validée.
        </p>
      )}

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/vendeur/commandes">
          <Kpi
            label="À préparer"
            valeur={String(compteurs.aPreparer)}
            accent={compteurs.aPreparer > 0}
            sousTitre="commandes en attente"
            icone={
              <>
                <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
                <path d="M8 9a4 4 0 0 1 8 0" />
              </>
            }
          />
        </Link>
        <Kpi
          label="Ventes ce mois"
          valeur={<Prix montant={stats.ventesMois} />}
          sousTitre="livrées et payées"
          icone={
            <>
              <path d="M3 17l6-6 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 8h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </>
          }
        />
        <Kpi
          label="Produits actifs"
          valeur={String(stats.produitsActifs)}
          sousTitre={`${vendeur._count.produits} au total`}
          icone={
            <>
              <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" strokeLinejoin="round" />
              <path d="M3 7.5 12 12l9-4.5M12 12v9" />
            </>
          }
        />
        <Kpi
          label="Note boutique"
          valeur={stats.noteMoyenne ? `★ ${stats.noteMoyenne.toFixed(1)}` : "-"}
          sousTitre={`${stats.nbAvis} avis`}
          icone={
            <path
              d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z"
              strokeLinejoin="round"
            />
          }
        />
      </div>

      {/* Activité de la semaine */}
      <Carte className="p-5">
        <GraphBarres points={stats.activite7Jours} titre="Tes ventes des 7 derniers jours" />
      </Carte>

      {/* Commandes récentes */}
      <Carte className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-contour-carte px-5 py-4">
          <h2 className="font-bold text-slate-900">Commandes récentes</h2>
          <Link
            href="/vendeur/commandes"
            className="flex items-center gap-1 text-sm font-bold text-nile-700 hover:underline"
          >
            Tout voir
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Aucune commande pour l'instant. Elles apparaîtront ici dès votre
            première vente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Commande</th>
                  <th className="px-5 py-3 font-semibold">Acheteur</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentes.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href="/vendeur/commandes"
                        className="font-semibold text-nile-800 hover:underline"
                      >
                        {c.numero}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(c.dateCreation).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{c.destNom}</td>
                    <td className="px-5 py-3.5">
                      <BadgeStatutCommande statut={c.statutCommande} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      <Prix montant={c.totalVendeur} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Actions rapides */}
        <Carte className="p-5">
          <h2 className="font-bold text-slate-900">Gérer ma boutique</h2>
          {env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
            <div className="mt-3">
              <ActiverNotifications clePublique={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/vendeur/commandes" className={btn("primaire", "md")}>
              Mes commandes
              {compteurs.aPreparer > 0 && (
                <span className="ml-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                  {compteurs.aPreparer}
                </span>
              )}
            </Link>
            <Link href="/vendeur/produits" className={btn("secondaire", "md")}>
              Mes produits
            </Link>
            <Link href={`/boutique/${vendeur.id}`} className={btn("ghost", "md")}>
              Voir ma boutique publique
            </Link>
          </div>
        </Carte>

        {/* Alerte stock */}
        <Carte className="p-5">
          <h2 className="font-bold text-slate-900">Stock en alerte</h2>
          {stats.produitsEnAlerte.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Aucun produit actif à 2 unités ou moins. 👍
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {stats.produitsEnAlerte.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <Link
                    href={`/vendeur/produits/${p.id}`}
                    className="min-w-0 truncate hover:text-nile hover:underline"
                  >
                    {p.titre}
                  </Link>
                  <Badge ton={p.stock === 0 ? "rouge" : "ambre"}>
                    {p.stock === 0 ? "Rupture" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {/* Gains (vendeurs tiers uniquement) */}
      {solde && (
        <Carte className="p-5">
          <h2 className="font-bold text-slate-900">Mes gains</h2>
          <p className="mt-1 text-xs text-slate-500">
            Une vente est comptée quand la commande est livrée et payée.
            Commission NILE : {solde.tauxPourcent} %.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Ventes livrées</dt>
              <dd className="font-medium"><Prix montant={solde.brut} /></dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Net vendeur</dt>
              <dd className="font-medium"><Prix montant={solde.net} /></dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Déjà reversé</dt>
              <dd className="font-medium"><Prix montant={solde.dejaReverse} /></dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reste à recevoir</dt>
              <dd className="text-lg font-bold text-nile"><Prix montant={solde.solde} /></dd>
            </div>
          </dl>
        </Carte>
      )}
    </div>
  );
}

function Kpi({
  label,
  valeur,
  sousTitre,
  accent = false,
  icone,
}: {
  label: string;
  valeur: React.ReactNode;
  sousTitre?: string;
  accent?: boolean;
  icone?: React.ReactNode;
}) {
  return (
    <Carte className="h-full p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-carte-hover">
      <div className="flex items-start gap-3">
        {icone && (
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              accent ? "bg-accent-fixe text-accent-dark" : "bg-nile-50 text-nile-700"
            }`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {icone}
            </svg>
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
          <p
            className={`mt-0.5 text-lg font-bold leading-tight ${
              accent ? "text-accent-dark" : "text-nile-800"
            }`}
          >
            {valeur}
          </p>
          {sousTitre && <p className="mt-0.5 text-[11px] text-slate-400">{sousTitre}</p>}
        </div>
      </div>
    </Carte>
  );
}
