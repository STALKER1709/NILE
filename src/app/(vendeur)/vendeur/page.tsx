import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSoldeVendeur } from "@/modules/reversement/reversement";
import { compterCommandesVendeur } from "@/modules/commande/vendeur";
import { statsVendeur } from "@/modules/stats/stats";
import { ActiverNotifications } from "@/components/push/ActiverNotifications";
import { GraphBarres } from "@/components/stats/GraphBarres";
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
    return <p className="text-sm text-gray-500">Profil boutique introuvable.</p>;
  }
  const [solde, compteurs, stats] = await Promise.all([
    vendeur.estBoutiqueMaison ? Promise.resolve(null) : getSoldeVendeur(vendeur.id),
    compterCommandesVendeur(vendeur.id),
    statsVendeur(vendeur.id),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Espace vendeur</h1>
        <Badge ton={vendeur.statutValidation === "VALIDE" ? "vert" : "ambre"}>
          {vendeur.nomBoutique} · {vendeur.statutValidation}
        </Badge>
      </div>

      {vendeur.statutValidation === "EN_ATTENTE" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
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
          />
        </Link>
        <Kpi
          label="Ventes ce mois"
          valeur={<Prix montant={stats.ventesMois} />}
          sousTitre="livrées et payées"
        />
        <Kpi
          label="Produits actifs"
          valeur={String(stats.produitsActifs)}
          sousTitre={`${vendeur._count.produits} au total`}
        />
        <Kpi
          label="Note boutique"
          valeur={stats.noteMoyenne ? `★ ${stats.noteMoyenne.toFixed(1)}` : "-"}
          sousTitre={`${stats.nbAvis} avis`}
        />
      </div>

      {/* Activité de la semaine */}
      <Carte className="p-5">
        <GraphBarres points={stats.activite7Jours} titre="Tes ventes des 7 derniers jours" />
      </Carte>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Actions rapides */}
        <Carte className="p-5">
          <h2 className="font-semibold">Gérer ma boutique</h2>
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
          <h2 className="font-semibold">Stock en alerte</h2>
          {stats.produitsEnAlerte.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              Aucun produit actif à 2 unités ou moins. 👍
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 text-sm">
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
          <h2 className="font-semibold">Mes gains</h2>
          <p className="mt-1 text-xs text-gray-500">
            Une vente est comptée quand la commande est livrée et payée.
            Commission NILE : {solde.tauxPourcent} %.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500">Ventes livrées</dt>
              <dd className="font-medium"><Prix montant={solde.brut} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Net vendeur</dt>
              <dd className="font-medium"><Prix montant={solde.net} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Déjà reversé</dt>
              <dd className="font-medium"><Prix montant={solde.dejaReverse} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Reste à recevoir</dt>
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
}: {
  label: string;
  valeur: React.ReactNode;
  sousTitre?: string;
  accent?: boolean;
}) {
  return (
    <Carte className="h-full p-4 transition hover:shadow-flottant">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold ${accent ? "text-accent-dark" : "text-nile"}`}>
        {valeur}
      </p>
      {sousTitre && <p className="mt-0.5 text-[11px] text-gray-400">{sousTitre}</p>}
    </Carte>
  );
}
