import type { Metadata } from "next";
import { Carte } from "@/components/ui/kit";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment NILE Marketplace collecte, utilise et protège vos données personnelles.",
};

const MAJ = "10 juillet 2026";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-gray-500">Dernière mise à jour : {MAJ}</p>
      </div>

      <Carte className="space-y-6 p-6 text-sm leading-relaxed text-gray-700">
        <Section titre="1. Données collectées">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Compte</span> : nom, email, numéro
              de téléphone, mot de passe (stocké sous forme chiffrée par notre
              fournisseur d&apos;authentification).
            </li>
            <li>
              <span className="font-medium">Commandes</span> : adresse de
              livraison (ville, quartier, repères), historique d&apos;achats.
            </li>
            <li>
              <span className="font-medium">Paiement</span> : référence de la
              transaction Mobile Money transmise par l&apos;agrégateur Monetbil.
              NILE ne stocke <span className="font-medium">jamais</span> vos
              codes secrets Mobile Money.
            </li>
          </ul>
        </Section>

        <Section titre="2. Utilisation">
          <p>
            Vos données servent uniquement à : traiter et livrer vos commandes,
            sécuriser les paiements, lutter contre la fraude, et vous contacter
            au sujet de vos commandes. Elles ne sont ni vendues ni louées à des
            tiers.
          </p>
        </Section>

        <Section titre="3. Partage">
          <p>
            Vos données ne sont partagées qu&apos;avec les prestataires
            nécessaires au service : hébergement (Vercel), base de données et
            authentification (Supabase), paiement mobile (Monetbil), et le
            vendeur concerné par votre commande (nom, téléphone et adresse de
            livraison uniquement).
          </p>
        </Section>

        <Section titre="4. Conservation et sécurité">
          <p>
            Les données sont conservées tant que votre compte est actif, puis le
            temps des obligations légales (facturation, litiges). Les échanges
            avec la plateforme sont chiffrés (HTTPS) et l&apos;accès aux données
            est restreint par rôle.
          </p>
        </Section>

        <Section titre="5. Vos droits">
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la
            suppression de vos données personnelles, conformément à la
            réglementation applicable au Cameroun.
          </p>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            [À COMPLÉTER : email/adresse de contact pour l&apos;exercice des
            droits, et délai de réponse.]
          </p>
        </Section>

        <Section titre="6. Cookies">
          <p>
            NILE utilise uniquement des cookies techniques indispensables au
            fonctionnement du site (session de connexion). Aucun cookie
            publicitaire ou de pistage tiers n&apos;est déposé.
          </p>
        </Section>
      </Carte>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-gray-900">{titre}</h2>
      {children}
    </section>
  );
}
