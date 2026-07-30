import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { deconnexionAction } from "@/app/(auth)/actions";
import { statsAcheteur } from "@/modules/stats/stats";
import { listerCommandesAcheteur } from "@/modules/commande/commande";
import { env } from "@/lib/env";
import { ActiverNotifications } from "@/components/push/ActiverNotifications";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { Vignette } from "@/components/ui/Vignette";
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
  const [vendeur, stats, toutesCommandes] = await Promise.all([
    utilisateur.role === "VENDEUR"
      ? prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id } })
      : Promise.resolve(null),
    statsAcheteur(utilisateur.id),
    listerCommandesAcheteur(utilisateur.id),
  ]);
  const recentes = toutesCommandes.slice(0, 4);

  return (
    <div className="space-y-5">
      {ok === "mdp" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Ton mot de passe a bien été modifié.
        </p>
      )}

      {/* En-tête de profil */}
      <Carte className="p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Initiale plutôt qu'une photo : aucun avatar n'est stocké. */}
          <span className="grid h-28 w-28 shrink-0 place-items-center rounded-full border-4 border-surface-haute bg-gradient-to-br from-nile-800 to-nile-600 text-5xl font-bold text-accent shadow-carte-hover sm:h-32 sm:w-32">
            {utilisateur.nom.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
              {utilisateur.nom}
            </h1>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
              <span className="truncate">{utilisateur.email}</span>
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
              </svg>
              {utilisateur.telephone}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge ton="bleu">{utilisateur.role}</Badge>
              {vendeur && (
                <Badge ton={vendeur.statutValidation === "VALIDE" ? "vert" : "ambre"}>
                  {vendeur.nomBoutique}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-contour-carte pt-5">
          <Kpi label="En cours" valeur={String(stats.enCours)} accent={stats.enCours > 0} />
          <Kpi label="Livrées" valeur={String(stats.livrees)} />
          <Kpi label="Total dépensé" valeur={<Prix montant={stats.totalDepense} />} />
        </div>
      </Carte>

      <div className="grid grid-cols-1 items-start gap-gouttiere lg:grid-cols-12">
        {/* Commandes récentes */}
        <div className="lg:col-span-8">
          <Carte className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-titre-sm text-nile-800">Commandes récentes</h2>
              <Link href="/commandes" className="shrink-0 text-etiquette-md text-accent-deep hover:underline">
                Tout l&apos;historique
              </Link>
            </div>

            {recentes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-corps-sm text-slate-500">
                  Vous n&apos;avez pas encore commandé.
                </p>
                <Link href="/catalogue" className={btn("primaire", "md", "mt-4")}>
                  Parcourir le catalogue
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start gap-4 rounded border border-transparent bg-surface-basse p-4 transition-colors hover:border-contour-clair">
                    <Link
                      href={`/commandes/${c.id}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded"
                    >
                      <Vignette
                        url={c.lignes[0]?.produit.images[0]?.url}
                        alt={c.lignes[0]?.titreProduit ?? ""}
                        sizes="64px"
                        fond="bg-surface-haute"
                        className="h-full w-full"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{c.numero}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(c.dateCreation).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        <Prix montant={c.total} />
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-row items-center justify-between gap-2 border-t border-contour-carte pt-2.5 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        <BadgeStatutCommande statut={c.statutCommande} />
                        <BadgeStatutPaiement statut={c.statutPaiement} />
                      </div>
                      <Link
                        href={`/commandes/${c.id}`}
                        className="text-etiquette-md text-nile-700 hover:underline"
                      >
                        Suivre →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>

        {/* Réglages du compte */}
        <div className="space-y-gouttiere lg:col-span-4">
          <Carte className="overflow-hidden">
            <div className="border-b border-contour-carte px-5 py-4">
              <h2 className="font-bold text-slate-900">Mon espace</h2>
            </div>
            <nav className="p-2">
              <LigneReglage href="/compte/profil" libelle="Mon profil">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" strokeLinecap="round" />
              </LigneReglage>
              <LigneReglage href="/commandes" libelle="Mes commandes">
                <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
                <path d="M8 9a4 4 0 0 1 8 0" />
              </LigneReglage>
              <LigneReglage href="/panier" libelle="Mon panier">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </LigneReglage>
              <LigneReglage href="/catalogue" libelle="Continuer mes achats">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </LigneReglage>
              {utilisateur.role === "VENDEUR" && (
                <LigneReglage href="/vendeur" libelle="Espace vendeur">
                  <path d="M4 9h16l-1 11H5L4 9z" strokeLinejoin="round" />
                  <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                </LigneReglage>
              )}
              {utilisateur.role === "ADMIN" && (
                <LigneReglage href="/admin" libelle="Back-office">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </LigneReglage>
              )}
              <LigneReglage href="/aide" libelle="Aide et contact">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.4V14" strokeLinecap="round" />
                <path d="M12 17.5v.01" strokeLinecap="round" />
              </LigneReglage>
            </nav>
          </Carte>

          {/* Notifications push (si configurées) */}
          {env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
            <Carte className="p-5">
              <h2 className="font-bold text-slate-900">Notifications</h2>
              <p className="mb-3 mt-1 text-sm text-slate-500">
                Soyez prévenu de l'avancement de vos commandes.
              </p>
              <ActiverNotifications clePublique={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
            </Carte>
          )}

          {/* Aide : reprend la carte d'assistance de la maquette. */}
          <div className="rounded border border-contour-carte bg-surface-basse p-5">
            <h2 className="text-etiquette-md text-nile-800">
              Un problème avec une commande ?
            </h2>
            <p className="mt-2 text-corps-sm text-slate-600">
              Notre équipe répond aux heures ouvrées sur vos livraisons et vos
              paiements.
            </p>
            <Link
              href="/aide"
              className="mt-4 inline-flex items-center gap-2 text-etiquette-md text-nile-700 transition-transform hover:translate-x-1"
            >
              Contacter le support
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Session : seul accès à la déconnexion sur mobile */}
          <Carte className="p-5">
            <h2 className="font-bold text-slate-900">Session</h2>
            <p className="mb-3 mt-1 text-sm text-slate-500">
              Connecté en tant que {utilisateur.email}.
            </p>
            <form action={deconnexionAction}>
              <button type="submit" className={btn("danger", "md", "w-full")}>
                Se déconnecter
              </button>
            </form>
          </Carte>
        </div>
      </div>
    </div>
  );
}

/** Ligne du menu « Mon espace » : icône, libellé, chevron. */
function LigneReglage({
  href,
  libelle,
  children,
}: {
  href: string;
  libelle: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded p-3 transition-colors hover:bg-slate-50"
    >
      <span className="flex items-center gap-3">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-slate-400 transition-colors group-hover:text-nile-700" aria-hidden="true">
          {children}
        </svg>
        <span className="text-sm font-semibold text-slate-800">{libelle}</span>
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-300" aria-hidden="true">
        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
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
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className={`text-lg font-bold leading-tight ${accent ? "text-accent-dark" : "text-nile-800"}`}>
        {valeur}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}


