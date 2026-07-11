import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { deconnexionAction } from "@/app/(auth)/actions";
import { statsAcheteur } from "@/modules/stats/stats";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { Carte, Badge, Prix, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte" };

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const utilisateur = await exigerConnexion();
  const [vendeur, stats] = await Promise.all([
    utilisateur.role === "VENDEUR"
      ? prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id } })
      : Promise.resolve(null),
    statsAcheteur(utilisateur.id),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Mon compte</h1>

      {ok === "mdp" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Ton mot de passe a bien été modifié.
        </p>
      )}

      {/* Mes achats en un coup d'œil */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="En cours" valeur={String(stats.enCours)} accent={stats.enCours > 0} />
        <Kpi label="Livrées" valeur={String(stats.livrees)} />
        <Kpi label="Total dépensé" valeur={<Prix montant={stats.totalDepense} />} />
      </div>

      {stats.derniereCommande && (
        <Carte className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Dernière commande</p>
              <p className="font-semibold">{stats.derniereCommande.numero}</p>
              <p className="text-xs text-gray-500">
                {new Date(stats.derniereCommande.dateCreation).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {stats.derniereCommande._count.lignes} article
                {stats.derniereCommande._count.lignes > 1 ? "s" : ""} ·{" "}
                <Prix montant={stats.derniereCommande.total} />
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <BadgeStatutCommande statut={stats.derniereCommande.statutCommande} />
              <BadgeStatutPaiement statut={stats.derniereCommande.statutPaiement} />
              <Link
                href={`/commandes/${stats.derniereCommande.id}`}
                className={btn("secondaire", "sm")}
              >
                Suivre
              </Link>
            </div>
          </div>
        </Carte>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Raccourci href="/commandes" libelle="Mes commandes" />
        <Raccourci href="/panier" libelle="Mon panier" />
        <Raccourci href="/catalogue" libelle="Catalogue" />
        {utilisateur.role === "VENDEUR" && <Raccourci href="/vendeur" libelle="Espace vendeur" />}
        {utilisateur.role === "ADMIN" && <Raccourci href="/admin" libelle="Back-office" />}
      </div>

      <Carte className="p-5">
        <h2 className="mb-3 font-semibold">Informations</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Info label="Nom" valeur={utilisateur.nom} />
          <Info label="Email" valeur={utilisateur.email} />
          <Info label="Téléphone" valeur={utilisateur.telephone} />
          <div>
            <dt className="text-gray-500">Rôle</dt>
            <dd className="mt-0.5"><Badge ton="bleu">{utilisateur.role}</Badge></dd>
          </div>
        </dl>
      </Carte>

      {vendeur && (
        <Carte className="p-5">
          <h2 className="font-semibold">Ma boutique</h2>
          <p className="mt-1 text-sm text-gray-600">{vendeur.nomBoutique}</p>
          <div className="mt-2"><Badge ton={vendeur.statutValidation === "VALIDE" ? "vert" : "ambre"}>{vendeur.statutValidation}</Badge></div>
          <Link href="/vendeur" className={btn("secondaire", "sm", "mt-3")}>Gérer mes produits</Link>
        </Carte>
      )}

      {/* Déconnexion : seul accès sur mobile (l'en-tête ne l'affiche qu'en grand écran) */}
      <Carte className="p-5">
        <h2 className="mb-1 font-semibold">Session</h2>
        <p className="mb-3 text-sm text-gray-500">
          Connecté en tant que {utilisateur.email}.
        </p>
        <form action={deconnexionAction}>
          <button type="submit" className={btn("danger", "md", "w-full sm:w-auto")}>
            Se déconnecter
          </button>
        </form>
      </Carte>
    </div>
  );
}

function Kpi({
  label,
  valeur,
  accent = false,
}: {
  label: string;
  valeur: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Carte className="p-4 text-center">
      <p className={`truncate text-xl font-bold ${accent ? "text-accent-dark" : "text-nile"}`}>
        {valeur}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </Carte>
  );
}

function Raccourci({ href, libelle }: { href: string; libelle: string }) {
  return (
    <Link href={href} className="rounded-xl2 border border-gray-100 bg-white p-4 text-center text-sm font-medium text-gray-700 shadow-carte transition hover:border-nile hover:text-nile">
      {libelle}
    </Link>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{valeur}</dd>
    </div>
  );
}
