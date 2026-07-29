import type { Metadata } from "next";
import Link from "next/link";
import { Carte } from "@/components/ui/kit";
import { SommaireActif } from "@/components/conditions/SommaireActif";

export const metadata: Metadata = {
  title: "Conditions générales",
  description:
    "Conditions générales d'utilisation et de vente de NILE Marketplace.",
};

const MAJ = "10 juillet 2026";

/** Sommaire du document (ancres des sections ci-dessous). */
const SOMMAIRE = [
  { ancre: "presentation", libelle: "Présentation" },
  { ancre: "comptes", libelle: "Comptes" },
  { ancre: "commandes", libelle: "Commandes et prix" },
  { ancre: "paiement", libelle: "Paiement" },
  { ancre: "livraison", libelle: "Livraison" },
  { ancre: "verification", libelle: "Vérification · ventes fermes" },
  { ancre: "vendeurs", libelle: "Vendeurs tiers" },
  { ancre: "avis", libelle: "Avis" },
  { ancre: "responsabilite", libelle: "Responsabilité" },
  { ancre: "droit", libelle: "Droit applicable" },
];

export default function ConditionsPage() {
  return (
    <div className="flex flex-col gap-gouttiere lg:flex-row">
      {/* Sommaire : colonne collante sur grand écran, replié sur mobile. */}
      <aside className="lg:w-64 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <h2 className="mb-3 hidden text-etiquette-xs uppercase tracking-widest text-slate-500 lg:block">
            Sommaire
          </h2>
          <details className="rounded border border-contour-carte bg-white lg:border-0 lg:bg-transparent" open>
            <summary className="cursor-pointer list-none p-4 font-semibold text-slate-900 lg:hidden">
              Sommaire
            </summary>
            <SommaireActif entrees={SOMMAIRE} />
          </details>

          <div className="mt-6 rounded border border-contour-carte bg-nile-800 p-5 text-white">
            <p className="text-etiquette-md">Besoin d&apos;aide ?</p>
            <p className="mb-4 mt-1 text-corps-sm text-white/75">
              Une question sur ces conditions ou sur une commande ? Notre équipe
              répond aux heures ouvrées.
            </p>
            <Link href="/aide" className="block rounded bg-white px-4 py-2.5 text-center text-etiquette-md text-nile-800 transition-colors hover:bg-surface-basse">
              Contacter le support
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Conditions générales de vente et d&apos;utilisation</h1>
        <p className="mt-1 text-sm italic text-slate-500">Dernière mise à jour : {MAJ}</p>
      </div>

      <Carte className="space-y-8 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
        <Section titre="1. Présentation" ancre="presentation">
          <p>
            NILE Marketplace (« NILE », « nous ») est une plateforme de commerce
            en ligne opérant au Cameroun. Elle met en relation des acheteurs et
            des vendeurs (y compris la boutique propre de la plateforme) et
            permet le paiement par Mobile Money ou à la livraison.
          </p>
          <p className="rounded bg-accent-fixe px-3 py-2 text-amber-800">
            [À COMPLÉTER : raison sociale, forme juridique, RCCM, NIU, adresse
            du siège, contact officiel.]
          </p>
        </Section>

        <Section titre="2. Comptes" ancre="comptes">
          <p>
            La création d&apos;un compte est nécessaire pour commander ou vendre.
            Vous êtes responsable de la confidentialité de vos identifiants et
            des actions effectuées depuis votre compte. NILE peut suspendre un
            compte en cas de fraude ou d&apos;usage abusif.
          </p>
        </Section>

        <Section titre="3. Commandes et prix" ancre="commandes">
          <p>
            Les prix sont affichés en francs CFA (XAF), toutes taxes comprises,
            sans décimales. Une commande est confirmée après validation du
            panier et de l&apos;adresse de livraison. NILE peut refuser ou annuler
            une commande en cas de stock insuffisant, d&apos;erreur manifeste de
            prix ou de suspicion de fraude.
          </p>
        </Section>

        <Section titre="4. Paiement" ancre="paiement">
          <p>
            Deux modes de paiement sont proposés : le paiement mobile (MTN
            Mobile Money, Orange Money) via l&apos;agrégateur Monetbil, et le
            paiement en espèces à la livraison (dans la limite d&apos;un plafond
            affiché au moment de la commande). Un paiement mobile n&apos;est
            considéré comme reçu qu&apos;après confirmation par
            l&apos;agrégateur.
          </p>
          {/* Uniquement les moyens réellement acceptés : ni carte bancaire,
              ni virement, que la plateforme ne traite pas. */}
          <ul className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            <MoyenAccepte libelle="MTN Mobile Money" pastille="MTN" fond="bg-[#ffcb05]" couleurTexte="text-black" />
            <MoyenAccepte libelle="Orange Money" pastille="OM" fond="bg-[#ff7900]" couleurTexte="text-white" />
            <MoyenAccepte libelle="Espèces à la livraison" />
          </ul>
        </Section>

        <Section titre="5. Livraison" ancre="livraison">
          <p>
            La livraison est <strong>gratuite</strong> et assurée au Cameroun à
            l&apos;adresse indiquée par l&apos;acheteur (ville, quartier, points
            de repère). Les délais affichés lors de la commande sont indicatifs.
          </p>
        </Section>

        <Section titre="6. Vérification à la livraison · ventes fermes" ancre="verification">
          <p>
            L&apos;acheteur est invité à <strong>vérifier son colis au moment de
            la livraison</strong>, avant paiement en cas de paiement à la
            livraison. Si le colis ne correspond pas à la commande, il peut le
            <strong> refuser à la livraison</strong> : la commande est alors
            annulée (et remboursée si elle avait été payée par Mobile Money).
          </p>
          <p>
            Une fois le colis accepté, <strong>les ventes sont fermes : aucun
            retour ni échange n&apos;est accepté</strong>. En cas de refus de
            colis répétés sans motif légitime, NILE peut restreindre
            l&apos;accès au paiement à la livraison.
          </p>
        </Section>

        <Section titre="7. Vendeurs tiers" ancre="vendeurs">
          <p>
            Les vendeurs tiers sont responsables de la conformité, de la
            description et de la disponibilité de leurs produits. Toute boutique
            est soumise à validation par NILE avant de pouvoir publier. NILE
            peut retirer un produit ou suspendre une boutique qui contrevient
            aux présentes conditions ou à la loi.
          </p>
        </Section>

        <Section titre="8. Avis" ancre="avis">
          <p>
            Seuls les acheteurs ayant reçu un produit peuvent laisser un avis.
            Les avis frauduleux, injurieux ou hors sujet peuvent être retirés.
          </p>
        </Section>

        <Section titre="9. Responsabilité" ancre="responsabilite">
          <p>
            NILE met tout en œuvre pour assurer la disponibilité et la sécurité
            de la plateforme, sans garantie d&apos;absence totale
            d&apos;interruption. La responsabilité de NILE ne saurait excéder le
            montant de la commande concernée.
          </p>
        </Section>

        <Section titre="10. Droit applicable" ancre="droit">
          <p>
            Les présentes conditions sont régies par le droit camerounais. Tout
            litige sera soumis aux juridictions compétentes du Cameroun, après
            tentative de résolution amiable.
          </p>
        </Section>
      </Carte>
      </div>
    </div>
  );
}

/** Vignette d'un moyen de paiement accepté par la plateforme. */
function MoyenAccepte({
  libelle,
  pastille,
  fond = "bg-surface-haute",
  couleurTexte = "text-nile-800",
}: {
  libelle: string;
  /** Sigle de l'opérateur ; absent pour le paiement en espèces. */
  pastille?: string;
  fond?: string;
  couleurTexte?: string;
}) {
  return (
    <li className="flex flex-col items-center gap-2 rounded border border-contour-carte p-4 text-center">
      <span className={`grid h-10 w-10 place-items-center rounded-full ${fond}`}>
        {pastille ? (
          <span className={`text-[10px] font-bold ${couleurTexte}`}>{pastille}</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={couleurTexte} aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </span>
      <span className="text-etiquette-md text-nile-800">{libelle}</span>
    </li>
  );
}

function Section({
  titre,
  ancre,
  children,
}: {
  titre: string;
  /** Cible du lien de sommaire. */
  ancre: string;
  children: React.ReactNode;
}) {
  return (
    <section id={ancre} className="scroll-mt-28 space-y-2">
      <h2 className="text-titre-sm text-slate-900">{titre}</h2>
      {children}
    </section>
  );
}
