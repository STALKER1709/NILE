import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { statsAdmin } from "@/modules/stats/stats";
import { listerSoldesVendeurs } from "@/modules/reversement/reversement";
import { ActiverNotifications } from "@/components/push/ActiverNotifications";
import { GraphBarres } from "@/components/stats/GraphBarres";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { Carte, Prix } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Back-office" };

const LIENS = [
  { href: "/admin/vendeurs", titre: "Vendeurs", desc: "Valider / suspendre les boutiques" },
  { href: "/admin/commandes", titre: "Commandes & livraisons", desc: "Supervision, multi-boutiques, refus" },
  { href: "/admin/moderation", titre: "Modération", desc: "Rejeter / réactiver des produits" },
  { href: "/admin/categories", titre: "Catégories", desc: "Gérer l'arborescence" },
  { href: "/admin/reconciliation", titre: "Réconciliation COD", desc: "Cash collecté / reversé" },
  { href: "/admin/reversements", titre: "Reversements vendeurs", desc: "Soldes dus et paiements aux vendeurs tiers" },
];

export default async function AdminPage() {
  await exigerRole("ADMIN");
  const [stats, soldes, nbUtilisateurs, nbVendeurs, nbEnAttente, produitsActifs] =
    await Promise.all([
      statsAdmin(),
      listerSoldesVendeurs(),
      prisma.utilisateur.count(),
      prisma.vendeur.count(),
      prisma.vendeur.count({ where: { statutValidation: "EN_ATTENTE" } }),
      prisma.produit.count({ where: { statut: "ACTIF" } }),
    ]);
  const duVendeurs = soldes.reduce((s, v) => s + v.solde, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight text-nile-900 sm:text-3xl">Back-office</h1>
        {env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
          <ActiverNotifications clePublique={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
        )}
      </div>

      {/* Argent */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="CA réalisé (livré & payé)" valeur={<Prix montant={stats.caRealise} />} />
        <Kpi label="CA ce mois" valeur={<Prix montant={stats.caMois} />} />
        <Lien href="/admin/reversements">
          <Kpi
            label="Dû aux vendeurs"
            valeur={<Prix montant={duVendeurs} />}
            accent={duVendeurs > 0}
          />
        </Lien>
        <Lien href="/admin/reconciliation">
          <Kpi
            label="Cash COD à réconcilier"
            valeur={<Prix montant={stats.cashACollecter} />}
            sousTitre={`${stats.nbCashACollecter} livraison${stats.nbCashACollecter > 1 ? "s" : ""}`}
            accent={stats.cashACollecter > 0}
          />
        </Lien>
      </div>

      {/* Plateforme */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Utilisateurs" valeur={String(nbUtilisateurs)} />
        <Lien href="/admin/vendeurs">
          <Kpi
            label="Boutiques à valider"
            valeur={String(nbEnAttente)}
            sousTitre={`${nbVendeurs} vendeurs au total`}
            accent={nbEnAttente > 0}
          />
        </Lien>
        <Lien href="/admin/commandes">
          <Kpi label="Commandes en cours" valeur={String(stats.commandesActives)} />
        </Lien>
        <Kpi label="Produits actifs" valeur={String(produitsActifs)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Carte className="p-5">
          <GraphBarres points={stats.activite7Jours} titre="Commandes des 7 derniers jours" />
        </Carte>

        <Carte className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold text-slate-900">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-xs text-nile hover:underline">
              Tout voir →
            </Link>
          </div>
          {stats.dernieresCommandes.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune commande.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {stats.dernieresCommandes.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/commandes/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{c.numero}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {c.acheteur.nom} · <Prix montant={c.total} />
                      </span>
                    </span>
                    <span className="flex gap-1">
                      <BadgeStatutCommande statut={c.statutCommande} />
                      <BadgeStatutPaiement statut={c.statutPaiement} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LIENS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Carte className="p-4 transition hover:shadow-flottant">
              <p className="font-semibold text-nile">{l.titre}</p>
              <p className="text-sm text-slate-500">{l.desc}</p>
            </Carte>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Lien({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href}>{children}</Link>;
}

function Kpi({
  label,
  valeur,
  sousTitre,
  accent = false,
}: {
  label: string;
  valeur: React.ReactNode;
  sousTitre?: string;
  accent?: boolean;
}) {
  return (
    <Carte className="h-full p-4 transition hover:shadow-flottant">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold ${accent ? "text-accent-dark" : "text-nile"}`}>
        {valeur}
      </p>
      {sousTitre && <p className="mt-0.5 text-[11px] text-slate-400">{sousTitre}</p>}
    </Carte>
  );
}
