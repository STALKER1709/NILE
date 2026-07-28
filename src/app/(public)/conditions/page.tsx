import type { Metadata } from "next";
import { Carte } from "@/components/ui/kit";

export const metadata: Metadata = {
  title: "Conditions générales",
  description:
    "Conditions générales d'utilisation et de vente de NILE Marketplace.",
};

const MAJ = "10 juillet 2026";

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Conditions générales</h1>
        <p className="mt-1 text-sm text-slate-500">Dernière mise à jour : {MAJ}</p>
      </div>

      <Carte className="space-y-6 p-6 text-sm leading-relaxed text-slate-700">
        <Section titre="1. Présentation">
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

        <Section titre="2. Comptes">
          <p>
            La création d&apos;un compte est nécessaire pour commander ou vendre.
            Vous êtes responsable de la confidentialité de vos identifiants et
            des actions effectuées depuis votre compte. NILE peut suspendre un
            compte en cas de fraude ou d&apos;usage abusif.
          </p>
        </Section>

        <Section titre="3. Commandes et prix">
          <p>
            Les prix sont affichés en francs CFA (XAF), toutes taxes comprises,
            sans décimales. Une commande est confirmée après validation du
            panier et de l&apos;adresse de livraison. NILE peut refuser ou annuler
            une commande en cas de stock insuffisant, d&apos;erreur manifeste de
            prix ou de suspicion de fraude.
          </p>
        </Section>

        <Section titre="4. Paiement">
          <p>
            Deux modes de paiement sont proposés : le paiement mobile (MTN
            Mobile Money, Orange Money) via l&apos;agrégateur Monetbil, et le
            paiement en espèces à la livraison (dans la limite d&apos;un plafond
            affiché au moment de la commande). Un paiement mobile n&apos;est
            considéré comme reçu qu&apos;après confirmation par
            l&apos;agrégateur.
          </p>
        </Section>

        <Section titre="5. Livraison">
          <p>
            La livraison est <strong>gratuite</strong> et assurée au Cameroun à
            l&apos;adresse indiquée par l&apos;acheteur (ville, quartier, points
            de repère). Les délais affichés lors de la commande sont indicatifs.
          </p>
        </Section>

        <Section titre="6. Vérification à la livraison · ventes fermes">
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

        <Section titre="7. Vendeurs tiers">
          <p>
            Les vendeurs tiers sont responsables de la conformité, de la
            description et de la disponibilité de leurs produits. Toute boutique
            est soumise à validation par NILE avant de pouvoir publier. NILE
            peut retirer un produit ou suspendre une boutique qui contrevient
            aux présentes conditions ou à la loi.
          </p>
        </Section>

        <Section titre="8. Avis">
          <p>
            Seuls les acheteurs ayant reçu un produit peuvent laisser un avis.
            Les avis frauduleux, injurieux ou hors sujet peuvent être retirés.
          </p>
        </Section>

        <Section titre="9. Responsabilité">
          <p>
            NILE met tout en œuvre pour assurer la disponibilité et la sécurité
            de la plateforme, sans garantie d&apos;absence totale
            d&apos;interruption. La responsabilité de NILE ne saurait excéder le
            montant de la commande concernée.
          </p>
        </Section>

        <Section titre="10. Droit applicable">
          <p>
            Les présentes conditions sont régies par le droit camerounais. Tout
            litige sera soumis aux juridictions compétentes du Cameroun, après
            tentative de résolution amiable.
          </p>
        </Section>
      </Carte>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-slate-900">{titre}</h2>
      {children}
    </section>
  );
}
