/**
 * Panneau de marque affiché à côté des formulaires de connexion et
 * d'inscription sur grand écran. Rappelle la proposition de valeur.
 */
export function PanneauMarque() {
  return (
    <div className="hidden flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-nile-900 via-nile-800 to-nile-700 p-8 text-white lg:flex">
      <div>
        <p className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded bg-accent text-nile-950">N</span>
          NILE Marketplace
        </p>
        <h2 className="mt-6 text-2xl font-bold leading-snug">
          Le shopping en ligne, à la camerounaise.
        </h2>
        <p className="mt-2 text-sm text-white/75">
          Un compte suffit pour acheter, suivre vos livraisons et vendre vos
          produits.
        </p>
      </div>

      <ul className="mt-8 space-y-4 text-sm">
        <Atout titre="Paiement à la livraison">
          Vérifiez votre colis avant de payer, en espèces.
        </Atout>
        <Atout titre="Mobile Money sécurisé">
          MTN MoMo et Orange Money, confirmés côté serveur.
        </Atout>
        <Atout titre="Livraison gratuite">
          Partout au Cameroun, sans frais cachés.
        </Atout>
      </ul>
    </div>
  );
}

function Atout({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span>
        <span className="block font-semibold">{titre}</span>
        <span className="text-white/70">{children}</span>
      </span>
    </li>
  );
}
