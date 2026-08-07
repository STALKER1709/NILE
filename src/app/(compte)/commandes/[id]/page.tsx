import Link from "next/link";
import { RafraichirSiChange } from "@/components/ui/RafraichirSiChange";
import { signatureCommandeAcheteur } from "@/modules/commande/signature";
import { signatureCommandeAction } from "@/app/(compte)/commandes/actions";
import { notFound } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getCommandeAcheteur } from "@/modules/commande/commande";
import {
  annulerCommandeAction,
  reprendrePaiementAction,
  racheterCommandeAction,
  confirmerReceptionAction,
} from "@/app/(compte)/commandes/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, btn } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { IconeWhatsApp } from "@/components/layout/BulleWhatsApp";
import { ActiverNotifications } from "@/components/push/ActiverNotifications";
import { CodeReception } from "@/components/livraison/CodeReception";
import { ChoixOperateur } from "@/components/paiement/ChoixOperateur";
import { SuiviPaiement } from "@/components/paiement/SuiviPaiement";
import { paiementSansRedirection } from "@/modules/paiement";
import { choisirAlerte } from "@/modules/commande/alertes-core";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const ETAPES = ["CONFIRMEE", "EN_PREPARATION", "EXPEDIEE", "LIVREE"] as const;
const ICONES_ETAPE: Record<(typeof ETAPES)[number], React.ReactNode> = {
  CONFIRMEE: <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 14 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></>,
  EN_PREPARATION: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" strokeLinejoin="round" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></>,
  EXPEDIEE: <><path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></>,
  LIVREE: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" /></>,
};

/** Libellés lisibles des statuts de livraison (jamais l'énumération brute). */
const LIVRAISON_LIB: Record<string, string> = {
  EN_ATTENTE: "en attente de prise en charge",
  AFFECTEE: "confiée au livreur",
  EN_TRANSIT: "en cours d'acheminement",
  LIVREE: "livrée",
  ECHEC: "échec de livraison",
  RETOURNEE: "retournée à la boutique",
};

/** Ce que chaque étape signifie concrètement pour l'acheteur. */
const EXPLICATION: Record<(typeof ETAPES)[number], string> = {
  CONFIRMEE: "Votre commande est enregistrée. La boutique va la préparer.",
  EN_PREPARATION: "La boutique rassemble vos articles avant expédition.",
  EXPEDIEE: "Votre colis est en route. Vérifiez-le à la réception avant de payer.",
  LIVREE: "Colis livré. Merci de votre confiance !",
};

const ETAPE_LIB: Record<(typeof ETAPES)[number], string> = {
  CONFIRMEE: "Confirmée",
  EN_PREPARATION: "Préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
};

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

  const annulable = commande.statutCommande === "EN_ATTENTE" || commande.statutCommande === "CONFIRMEE";
  const paiementARelancer =
    commande.modePaiement === "MONETBIL" &&
    commande.statutPaiement === "EN_ATTENTE" &&
    commande.statutCommande === "EN_ATTENTE";
  const sansRedirection = paiementSansRedirection();
  const termine = commande.statutCommande === "ANNULEE" || commande.statutCommande === "REFUSEE";
  const etapeCourante = ETAPES.indexOf(commande.statutCommande as (typeof ETAPES)[number]);
  // LIVREE est un état terminal : dès que le code a été scanné ou saisi, la
  // dernière étape est FAITE, pas « en cours ». Le parcours s'arrête là.
  const parcoursAcheve = commande.statutCommande === "LIVREE";
  // Le bandeau ne survit pas au changement d'état qu'il annonçait : le
  // paramètre d'URL est figé à l'arrivée, la commande continue de vivre.
  const alerte = choisirAlerte(ok, commande);
  const signature = await signatureCommandeAcheteur(utilisateur.id, id);
  // Pendant l'attente d'un paiement Mobile Money, c'est `SuiviPaiement` qui
  // interroge le fournisseur toutes les 10 s : le suivi générique ferait
  // double emploi. Une fois la commande terminée, plus rien ne bouge.
  const suivreStatut = !paiementARelancer && !termine && commande.statutCommande !== "LIVREE";
  // Étape effectivement atteinte (repli sur la première si statut hors frise).
  const etapeAffichee = ETAPES[Math.max(etapeCourante, 0)] ?? ETAPES[0];
  // Nombre d'unités commandées, pas de lignes : 2 exemplaires = 2 articles.
  const nbArticles = commande.lignes.reduce((s, l) => s + l.quantite, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-corps-sm text-slate-500">
            <Link href="/commandes" className="transition-colors hover:text-nile-700">Mes commandes</Link>
            <span className="text-slate-300">›</span>
            <span className="font-semibold text-slate-900">{commande.numero}</span>
          </nav>
          <h1 className="mt-1 text-titre-sm text-nile-800 sm:text-titre-md">Suivi de votre commande</h1>
          <p className="mt-1 text-corps-sm text-slate-500">
            Passée le{" "}
            <span className="font-semibold text-slate-700">
              {new Date(commande.dateCreation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {env.CONTACT_WHATSAPP && (
            <Link
              href={`https://wa.me/${env.CONTACT_WHATSAPP}?text=${encodeURIComponent(
                `Bonjour NILE, je souhaite suivre ma commande ${commande.numero}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={btn("secondaire", "md")}
            >
              <IconeWhatsApp taille={17} />
              Suivre sur WhatsApp
            </Link>
          )}
          <Link href="/aide" className={btn("secondaire", "md")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.4V14" strokeLinecap="round" />
              <path d="M12 17.5v.01" strokeLinecap="round" />
            </svg>
            Besoin d'aide ?
          </Link>
        </div>
      </div>

      {/* Activation du push proposée ICI plutôt que reléguée à la page compte :
          c'est en suivant sa commande que l'acheteur a une raison d'accepter
          les notifications. Masquée une fois la commande terminée. */}
      {env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !termine && (
        <Carte className="flex flex-wrap items-center justify-between gap-3 border-nile-700/20 bg-nile-50 p-4">
          <div className="min-w-0">
            <p className="text-etiquette-md text-nile-800">
              Soyez prévenu à chaque étape
            </p>
            <p className="mt-0.5 text-corps-sm text-slate-600">
              Recevez une notification sur ce téléphone quand votre colis part
              et quand il arrive. Gratuit, sans SMS.
            </p>
          </div>
          <ActiverNotifications
            clePublique={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
            libelle="Suivre cette commande"
            promesse="de l'avancement de vos commandes"
          />
        </Carte>
      )}

      {alerte && (
        <p className={`rounded border px-3 py-2 text-sm ${alerte.classe}`}>
          {alerte.texte}
        </p>
      )}
      {/* Tient la promesse faite juste au-dessus (« cette page se met à jour
          dès la confirmation ») : le webhook du fournisseur peut ne jamais
          arriver, on redemande donc le statut nous-mêmes. */}
      {paiementARelancer && <SuiviPaiement commandeId={commande.id} />}
      {suivreStatut && (
        <RafraichirSiChange
          signature={signature}
          // `.bind` et non une closure : une fonction anonyme ne franchit pas
          // la frontière serveur/client, seule une action liée le peut.
          lire={signatureCommandeAction.bind(null, commande.id)}
        />
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {paiementARelancer && (
        <form action={reprendrePaiementAction} className="space-y-3">
          <input type="hidden" name="commandeId" value={commande.id} />
          {/* Sans ce choix, le fournisseur qui débite directement le
              portefeuille ne sait pas quel opérateur solliciter et refuse la
              demande : le bouton échouerait systématiquement. */}
          {sansRedirection && (
            <ChoixOperateur
              telephone={commande.destTelephone}
              note="La demande expire au bout de 10 minutes sans confirmation."
            />
          )}
          <button type="submit" className={btn("accent", "lg", "w-full")}>Payer maintenant (Mobile Money)</button>
        </form>
      )}

      <div className="grid grid-cols-1 items-start gap-gouttiere lg:grid-cols-12">
      <div className="space-y-gouttiere lg:col-span-8">
      {/* Statuts + chronologie */}
      <Carte className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <BadgeStatutCommande statut={commande.statutCommande} />
          <BadgeStatutPaiement statut={commande.statutPaiement} />
        </div>
        {!termine ? (
          <ol className="flex items-start">
            {ETAPES.map((etape, i) => {
              const atteinte = i <= etapeCourante;
              // Une fois la commande livrée, plus rien n'est « en cours » :
              // la dernière étape est franchie, pas en attente.
              const courante = i === etapeCourante && !parcoursAcheve;
              return (
                <li key={etape} className="flex flex-1 items-start last:flex-none">
                  <div className="flex w-full min-w-0 flex-col items-center">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${
                        atteinte
                          ? "bg-nile-700 text-white shadow-carte-hover"
                          : "border-2 border-contour-carte bg-surface-moyenne text-slate-400"
                      } ${courante ? "motion-safe:animate-pulse-douce" : ""}`}
                    >
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        {ICONES_ETAPE[etape]}
                      </svg>
                    </span>
                    <span className={`mt-2.5 px-1 text-center text-etiquette-xs ${atteinte ? "font-semibold text-nile-800" : "text-slate-400"}`}>
                      {ETAPE_LIB[etape]}
                    </span>
                    {/* Aucune date par étape : la plateforme ne conserve pas
                        l'historique des changements de statut. */}
                    <span className="mt-0.5 text-center text-[11px] text-slate-400">
                      {courante ? "en cours" : atteinte ? "fait" : "à venir"}
                    </span>
                  </div>
                  {i < ETAPES.length - 1 && (
                    <span className={`mx-1 mt-6 h-0.5 flex-1 ${i < etapeCourante ? "bg-nile-700" : "bg-contour-carte"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">
            {commande.statutCommande === "ANNULEE" ? "Cette commande a été annulée." : "Commande refusée à la livraison."}
          </p>
        )}

        {!termine && (
          <div className="rounded border-l-4 border-nile-700 bg-surface-basse p-4">
            <p className="flex items-center gap-2 text-etiquette-md text-nile-800">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" strokeLinecap="round" />
              </svg>
              Statut actuel : {ETAPE_LIB[etapeAffichee]}
            </p>
            <p className="mt-1 text-corps-sm text-slate-600">{EXPLICATION[etapeAffichee]}</p>
          </div>
        )}
      </Carte>

      {/* Code de réception : c'est LUI qui fait passer la commande à livrée.
          Le livreur le scanne (ou l'acheteur le lui dicte) sur le pas de la
          porte. Il change toutes les 30 s, pour qu'une capture d'écran
          transmise à distance ne serve à rien. */}
      {commande.statutCommande === "EXPEDIEE" && (
        <Carte className="p-5 sm:p-6">
          <h2 className="text-titre-sm text-nile-800">Votre code de réception</h2>
          <p className="mt-1.5 text-corps-sm text-slate-600">
            À la remise du colis, montrez ce QR au livreur — ou dictez-lui les
            6 chiffres. C&apos;est ce geste qui confirme la livraison.
            {commande.modePaiement === "COD" && (
              <> Vérifiez le colis <strong>avant</strong> de payer et de donner le code.</>
            )}
          </p>
          <div className="mt-4">
            <CodeReception commandeId={commande.id} />
          </div>
        </Carte>
      )}

      {/* Après la remise : ce qui a été attesté, et comment. Une livraison
          forcée par un administrateur n'a pas d'attestation acheteur — le
          bouton de confirmation garde donc son utilité pour ces cas-là. */}
      {commande.statutCommande === "LIVREE" && (
        <Carte className="p-5 sm:p-6">
          {commande.livraison?.confirmationAcheteur ? (
            <p className="flex items-center gap-2.5 text-corps-sm text-nile-800">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nile-100 text-nile-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                Réception confirmée le{" "}
                <strong>
                  {new Date(commande.livraison.confirmationAcheteur).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                . Merci !
              </span>
            </p>
          ) : (
            <>
              <h2 className="text-titre-sm text-nile-800">Avez-vous bien reçu votre colis ?</h2>
              <p className="mt-1.5 text-corps-sm text-slate-600">
                Cette livraison a été validée par NILE sans votre code.
                Confirmez-le de votre côté : c&apos;est ce qui nous permet de
                repérer les livraisons qui se passent mal.
              </p>
              <form action={confirmerReceptionAction} className="mt-4">
                <input type="hidden" name="commandeId" value={commande.id} />
                <BoutonSoumettre enCours="Confirmation…" className={btn("primaire", "md")}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  J&apos;ai bien reçu ma commande
                </BoutonSoumettre>
              </form>
            </>
          )}
        </Carte>
      )}

      {/* Rappel des conditions de réception. Occupe la place que la maquette
          réservait à la carte de suivi GPS et à la fiche du livreur, dont
          aucune donnée n'existe. Contenu aligné sur les CGV. */}
      {!termine && (
        <div className="grid grid-cols-1 gap-gouttiere md:grid-cols-2">
          <Carte className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-etiquette-md text-nile-800">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
                <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" strokeLinejoin="round" />
                <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              À la réception
            </h2>
            <ul className="mt-3 space-y-2 text-corps-sm text-slate-600">
              <li>Vérifiez votre colis devant le livreur.</li>
              {commande.modePaiement === "COD" && (
                <li>Vous payez en espèces <strong>après</strong> vérification.</li>
              )}
              <li>
                S&apos;il ne correspond pas, vous pouvez le refuser : la commande
                est annulée{commande.statutPaiement === "PAYE" ? " et remboursée" : ""}.
              </li>
            </ul>
          </Carte>

          <Carte className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-etiquette-md text-nile-800">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="shrink-0 text-nile-700" aria-hidden="true">
                <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="17" cy="17" r="1.5" />
              </svg>
              Livraison
            </h2>
            <ul className="mt-3 space-y-2 text-corps-sm text-slate-600">
              <li><strong>Gratuite</strong>, partout au Cameroun.</li>
              <li>Les délais annoncés sont indicatifs.</li>
              <li>
                Une fois le colis accepté, les ventes sont fermes —{" "}
                <Link href="/conditions#verification" className="font-semibold text-nile-700 hover:underline">
                  voir les conditions
                </Link>
                .
              </li>
            </ul>
          </Carte>
        </div>
      )}

      {/* Racheter : disponible sur toute commande passée, quel que soit son
          statut. Les prix ne sont pas repris de l'ancienne commande — le
          panier lit toujours le prix courant, promotions comprises. */}
      <div className="flex flex-wrap gap-2">
        <form action={racheterCommandeAction}>
          <input type="hidden" name="commandeId" value={commande.id} />
          <BoutonSoumettre enCours="Ajout…" className={btn("secondaire", "md")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
              <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ajouter au panier actuel
          </BoutonSoumettre>
        </form>

        {annulable && (
          <form action={annulerCommandeAction}>
            <input type="hidden" name="commandeId" value={commande.id} />
            <button type="submit" className={btn("danger", "md")}>Annuler la commande</button>
          </form>
        )}
      </div>
      </div>

      {/* Colonne latérale : adresse, articles, aide */}
      <div className="space-y-gouttiere lg:col-span-4">
      {/* Adresse de livraison */}
      <Carte className="p-5 sm:p-6">
        <EnteteLaterale
          libelle="Adresse de livraison"
          icone={
            <>
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </>
          }
        />
        <p className="font-semibold text-slate-900">{commande.destNom}</p>
        <p className="text-corps-sm text-slate-600">{commande.destTelephone}</p>
        <p className="mt-1 text-corps-sm text-slate-600">{commande.quartier}, {commande.ville}</p>
        {commande.reperes && (
          <p className="text-corps-sm text-slate-600">Repères : {commande.reperes}</p>
        )}
        <p className="text-corps-sm text-slate-600">Cameroun</p>

        {commande.livraison && (
          <div className="mt-4 border-t border-contour-carte pt-4 text-corps-sm text-slate-600">
            <p>
              Suivi :{" "}
              <span className="font-semibold text-slate-800">
                {LIVRAISON_LIB[commande.livraison.statut] ?? commande.livraison.statut}
              </span>
              {commande.livraison.transporteur ? ` · ${commande.livraison.transporteur}` : ""}
            </p>
            {commande.livraison.preuveUrl && (
              <div className="mt-2">
                <p className="text-etiquette-xs text-slate-500">Preuve de livraison</p>
                <Vignette url={commande.livraison.preuveUrl} alt="Preuve de livraison" sizes="120px" className="mt-1 h-28 w-28 rounded" />
              </div>
            )}
          </div>
        )}
      </Carte>

      {/* Articles commandés */}
      <Carte className="p-5 sm:p-6">
        <EnteteLaterale
          libelle={`Articles (${nbArticles})`}
          icone={
            <>
              <path d="M3 9h18l-1.5 10.5A2 2 0 0 1 17.5 21h-11a2 2 0 0 1-2-1.5L3 9z" strokeLinejoin="round" />
              <path d="M8 9a4 4 0 0 1 8 0" />
            </>
          }
        />
        <ul className="space-y-4">
          {commande.lignes.map((l) => (
            <li key={l.id} className="flex gap-4">
              <Link
                href={`/produit/${l.produit.slug}`}
                className="h-16 w-16 shrink-0 overflow-hidden rounded"
              >
                <Vignette
                  url={l.produit.images[0]?.url}
                  alt={l.titreProduit}
                  sizes="64px"
                  fond="bg-surface-basse"
                  className="h-full w-full"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produit/${l.produit.slug}`}
                  className="block truncate text-corps-sm font-semibold text-slate-900 hover:text-nile-700 hover:underline"
                >
                  {l.titreProduit}
                </Link>
                <p className="text-etiquette-xs text-slate-500">Quantité : {l.quantite}</p>
                <Prix montant={l.sousTotal} className="text-etiquette-md text-nile-800" />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-contour-carte pt-4 text-corps-sm">
          {commande.remise > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <Prix montant={commande.total + commande.remise} className="text-slate-900" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Remise{commande.codePromo ? ` · ${commande.codePromo}` : ""}
                </span>
                <span className="font-semibold text-accent-deep">
                  −<Prix montant={commande.remise} />
                </span>
              </div>
            </>
          )}
          <div className="flex items-baseline justify-between text-corps-lg font-bold">
            <span className="text-slate-900">Total</span>
            <Prix montant={commande.total} className="whitespace-nowrap text-nile-800" />
          </div>
          <p className="pt-1 text-etiquette-xs text-slate-500">
            Livraison gratuite · paiement{" "}
            {commande.modePaiement === "COD" ? "en espèces à la livraison" : "Mobile Money"}
          </p>
        </div>
      </Carte>

      {/* Aide */}
      <div className="relative overflow-hidden rounded border border-contour-carte bg-nile-dark p-5 text-white sm:p-6">
        <div className="relative z-10">
          <h2 className="text-titre-sm">Besoin d&apos;aide ?</h2>
          <p className="mt-2 text-corps-sm text-nile-surConteneur">
            Un problème avec cette commande ? Notre équipe répond aux heures
            ouvrées.
          </p>
          <Link href="/aide" className="mt-4 inline-flex items-center gap-2 text-etiquette-md font-bold text-white hover:underline">
            Contacter le support
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <svg
          width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"
          aria-hidden="true" className="absolute -bottom-6 -right-5 text-white/[0.07]"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.4V14" strokeLinecap="round" />
          <path d="M12 17.5v.01" strokeLinecap="round" />
        </svg>
      </div>

      </div>
      </div>
    </div>
  );
}

/** Intitulé des cartes de la colonne latérale : icône + libellé en capitales. */
function EnteteLaterale({
  libelle,
  icone,
}: {
  libelle: string;
  icone: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-etiquette-md uppercase tracking-wider text-slate-500">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
        {icone}
      </svg>
      {libelle}
    </h2>
  );
}
