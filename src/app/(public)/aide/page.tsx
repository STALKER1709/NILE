import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { IconeWhatsApp } from "@/components/layout/BulleWhatsApp";
import { CentreAide, type Question } from "@/components/aide/CentreAide";

export const metadata: Metadata = {
  title: "Centre d'aide",
  description:
    "Réponses aux questions fréquentes sur les commandes, le paiement Mobile Money, la livraison au Cameroun et la vente sur NILE Marketplace.",
};

export default function AidePage() {
  const whatsapp = env.CONTACT_WHATSAPP;
  const email = env.CONTACT_EMAIL;
  const delai = env.DELAI_LIVRAISON_TEXTE;

  // Contenu strictement aligné sur le fonctionnement réel de la plateforme.
  const questions: Question[] = [
    {
      rubrique: "commandes",
      question: "Comment suivre ma commande ?",
      texte:
        "suivi commande statut mes commandes confirmée préparation expédiée livrée notification email",
      reponse: (
        <>
          Rendez-vous dans{" "}
          <Link href="/commandes" className="font-semibold text-nile-700 hover:underline">
            Mes commandes
          </Link>
          . Chaque commande affiche son avancement : confirmée, en préparation,
          expédiée, puis livrée. La boutique qui vend le produit met ce suivi à
          jour, et vous recevez un email à chaque changement de statut.
        </>
      ),
    },
    {
      rubrique: "commandes",
      question: "Dois-je créer un compte pour commander ?",
      texte: "compte inscription panier visiteur invité créer valider commande",
      reponse: (
        <>
          Non, pas pour parcourir le catalogue ni pour remplir votre panier. Un
          compte n'est demandé qu'au moment de <strong>valider la commande</strong>,
          afin de pouvoir vous livrer et vous tenir informé. Votre panier est
          conservé lors de la création du compte.
        </>
      ),
    },
    {
      rubrique: "commandes",
      question: "Comment laisser un avis sur un produit ?",
      texte: "avis note étoiles commentaire vérifié achat livré",
      reponse: (
        <>
          Le formulaire d'avis apparaît sur la fiche produit une fois que la
          commande contenant cet article vous a été <strong>livrée</strong>.
          C'est pourquoi tous les avis affichés portent la mention « achat
          vérifié » : ils proviennent uniquement d'acheteurs réels.
        </>
      ),
    },
    {
      rubrique: "paiement",
      question: "Quels moyens de paiement acceptez-vous ?",
      texte:
        "paiement mtn momo mobile money orange money espèces livraison cod comment payer",
      reponse: (
        <>
          Trois possibilités : <strong>MTN Mobile Money</strong>,{" "}
          <strong>Orange Money</strong>, ou le paiement{" "}
          <strong>en espèces à la livraison</strong>. Vous choisissez au moment
          de valider la commande.
        </>
      ),
    },
    {
      rubrique: "paiement",
      question: "Comment fonctionne le paiement à la livraison ?",
      texte:
        "paiement livraison espèces cod vérifier colis réception plafond montant",
      reponse: (
        <>
          Vous commandez sans rien payer en ligne. À la réception, vous vérifiez
          votre colis, puis vous réglez en espèces au livreur. Ce mode est
          disponible jusqu'à un certain montant de commande ; au-delà, le
          paiement Mobile Money est demandé.
        </>
      ),
    },
    {
      rubrique: "paiement",
      question: "Mon paiement Mobile Money est-il sécurisé ?",
      texte: "sécurité paiement mobile money confirmation serveur fraude",
      reponse: (
        <>
          Oui. Une commande n'est marquée comme payée qu'après{" "}
          <strong>confirmation reçue directement par notre serveur</strong>
          auprès de l'opérateur, jamais sur la seule base de ce qu'affiche votre
          navigateur. Nous ne stockons aucun code secret Mobile Money.
        </>
      ),
    },
    {
      rubrique: "livraison",
      question: "Combien coûte la livraison ?",
      texte: "livraison gratuite frais prix coût partout cameroun",
      reponse: (
        <>
          La livraison est <strong>gratuite partout au Cameroun</strong>, sur
          toutes les commandes, sans montant minimum. Le prix affiché sur la
          fiche produit est celui que vous payez.
        </>
      ),
    },
    {
      rubrique: "livraison",
      question: "Sous quel délai serai-je livré ?",
      texte: "délai livraison temps jours douala yaoundé régions",
      reponse: delai ? (
        <>Délai indicatif : <strong>{delai}</strong>. Il peut varier selon votre localité et la disponibilité du produit.</>
      ) : (
        <>
          Le délai dépend de votre localité et de la boutique qui expédie. Il
          vous est communiqué lors de la confirmation de votre commande.
        </>
      ),
    },
    {
      rubrique: "livraison",
      question: "Puis-je retourner un article ?",
      texte: "retour remboursement échange refus vente ferme vérifier colis",
      reponse: (
        <>
          Les ventes sont <strong>fermes : il n'y a pas de retour après
          acceptation du colis</strong>. C'est précisément pour cela que nous
          vous invitons à <strong>vérifier votre colis devant le livreur</strong>{" "}
          avant de le prendre et de payer. Si le produit ne correspond pas à la
          commande, refusez-le à ce moment-là.
        </>
      ),
    },
    {
      rubrique: "vendre",
      question: "Comment ouvrir une boutique sur NILE ?",
      texte: "vendeur boutique inscription devenir vendre validation",
      reponse: (
        <>
          Créez un compte vendeur depuis la page{" "}
          <Link href="/inscription" className="font-semibold text-nile-700 hover:underline">
            Devenir vendeur
          </Link>
          . Votre boutique est ensuite examinée par notre équipe : une fois
          validée, vos produits deviennent visibles dans le catalogue.
        </>
      ),
    },
    {
      rubrique: "vendre",
      question: "Comment et quand suis-je payé ?",
      texte: "reversement paiement vendeur commission gains retrait momo",
      reponse: (
        <>
          Vos ventes livrées alimentent votre solde, visible dans votre espace
          vendeur. Vous demandez un reversement quand vous le souhaitez, versé
          sur votre compte Mobile Money. NILE prélève une commission sur chaque
          vente, déduite automatiquement.
        </>
      ),
    },
    {
      rubrique: "vendre",
      question: "Qui gère le suivi des commandes de ma boutique ?",
      texte: "vendeur suivi commandes statut expédier gérer boutique",
      reponse: (
        <>
          Chaque boutique gère elle-même le suivi de ses commandes depuis son
          espace vendeur : passage en préparation, expédition, livraison.
          L'administration NILE supervise l'ensemble sans se substituer à vous.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <CentreAide questions={questions} />

      {/* Contact direct */}
      <section className="text-center">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Vous n'avez pas trouvé ?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Écrivez-nous directement, nous répondons aux heures ouvrées.
        </p>

        {!whatsapp && !email ? (
          <p className="mx-auto mt-6 max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Nos coordonnées seront affichées ici très prochainement. En
            attendant, les vendeurs restent joignables depuis leur boutique.
          </p>
        ) : (
          <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-3.5 sm:grid-cols-2">
            {whatsapp && (
              <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-6 shadow-carte">
                <span className="mb-3.5 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <IconeWhatsApp taille={26} />
                </span>
                <p className="font-bold text-slate-900">WhatsApp</p>
                <p className="mb-4 mt-1 text-sm text-slate-500">
                  Le canal le plus rapide
                </p>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour NILE, j'ai une question :")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg bg-nile-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-nile-800"
                >
                  Nous écrire
                </a>
              </div>
            )}
            {email && (
              <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-6 shadow-carte">
                <span className="mb-3.5 grid h-14 w-14 place-items-center rounded-full bg-nile-50 text-nile-700">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                </span>
                <p className="font-bold text-slate-900">Email</p>
                <p className="mb-4 mt-1 text-sm text-slate-500">
                  Demandes détaillées et litiges
                </p>
                <a
                  href={`mailto:${email}`}
                  className="w-full rounded-lg bg-nile-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-nile-800"
                >
                  Envoyer un email
                </a>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
