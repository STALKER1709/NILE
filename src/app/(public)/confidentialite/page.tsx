import type { Metadata } from "next";
import { Carte } from "@/components/ui/kit";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment NILE Marketplace collecte, utilise et protège vos données personnelles.",
};

const MAJ = "25 octobre 2026";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-slate-500">Dernière mise à jour : {MAJ}</p>
      </div>

      <Carte className="space-y-6 p-6 text-sm leading-relaxed text-slate-700">
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
              référence de transaction Mobile Money et statut de paiement transmis par le prestataire utilisé par NILE. NILE ne stocke jamais vos codes secrets Mobile Money.
              NILE ne stocke <span className="font-medium">jamais</span> vos
              codes secrets Mobile Money.
            </li>
            <li><span className="font-medium">Vérification vendeur (KYC)</span> : photos ou scans de pièces d’identité, selfie de vérification et, le cas échéant, documents d’entreprise. Ces données sont sensibles et réservées aux personnes habilitées à vérifier le dossier.</li>
            <li><span className="font-medium">Contenus et interactions</span> : photos/vidéos publiées par les vendeurs, commentaires, mentions J’aime et partages liés aux publications.</li>
          </ul>
        </Section>

        <Section titre="2. Utilisation">
          <p>
            Vos données servent à créer et sécuriser le compte, traiter et livrer les commandes, rapprocher les paiements, prévenir la fraude, vérifier l’identité des vendeurs, modérer les contenus et répondre aux demandes d’assistance. Elles ne sont ni vendues ni louées.
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
            Les données sont conservées pendant la durée nécessaire aux finalités annoncées et aux obligations légales ou à la gestion des litiges. Les pièces KYC doivent être conservées séparément dans un espace privé et accessibles uniquement par des URL signées de courte durée après contrôle d’accès. Les échanges avec la plateforme sont chiffrés (HTTPS) et l’accès aux données est restreint par rôle.
          </p>
        </Section>

        <Section titre="5. Vos droits">
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la
            suppression de vos données personnelles, conformément à la
            réglementation applicable au Cameroun.
          </p>
          <p className="rounded bg-accent-fixe px-3 py-2 text-amber-800">
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
      <h2 className="font-semibold text-slate-900">{titre}</h2>
      {children}
    </section>
  );
}
