import Link from "next/link";
import Image from "next/image";

/**
 * Diapositives du carrousel d'accueil.
 * Deux rendus possibles par diapo :
 *  - photo réelle en fond (fichiers /public/bannieres/*.jpg) + voile dégradé ;
 *  - illustration SVG dessinée (repli tant que les photos ne sont pas là).
 * Passer PHOTOS_ACTIVES à true quand les trois fichiers sont dans le dépôt :
 *  public/bannieres/marche.jpg, livraison.jpg, momo.jpg (1200 px de large,
 * compressés, licence libre pour usage commercial).
 */
const PHOTOS_ACTIVES = true;

const PHOTOS = {
  marche: "/bannieres/marche.jpg",
  livraison: "/bannieres/livraison.jpg",
  momo: "/bannieres/momo.jpg",
} as const;

function Slide({
  fond,
  kicker,
  titre,
  texte,
  cta,
  ctaHref,
  ctaClair = false,
  illustration,
  photo,
  voile,
}: {
  fond: string;
  kicker: string;
  titre: string;
  texte: string;
  cta: string;
  ctaHref: string;
  ctaClair?: boolean;
  illustration: React.ReactNode;
  photo?: string;
  /** Dégradé posé sur la photo pour garder le texte lisible. */
  voile?: string;
}) {
  const avecPhoto = PHOTOS_ACTIVES && photo;
  return (
    <div className={`relative flex h-52 items-center overflow-hidden sm:h-64 ${fond}`}>
      {avecPhoto && (
        <>
          <Image
            src={photo}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className={`absolute inset-0 ${voile ?? "bg-gradient-to-r from-nile-950/85 via-nile-900/60 to-nile-900/10"}`} />
        </>
      )}
      <div className="relative z-10 max-w-[62%] px-5 py-6 sm:max-w-[55%] sm:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
          {kicker}
        </p>
        <h2 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-3xl">
          {titre}
        </h2>
        <p className="mt-1.5 hidden text-sm text-white/80 sm:block">{texte}</p>
        <Link
          href={ctaHref}
          className={`mt-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold sm:mt-4 ${
            ctaClair
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-accent text-nile-950 hover:bg-accent-dark"
          }`}
        >
          {cta}
        </Link>
      </div>
      {!avecPhoto && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[45%] items-center justify-center">
          {illustration}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Illustrations SVG ---------------------------- */

function Colis() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full max-w-[220px]" aria-hidden="true">
      <circle cx="140" cy="80" r="70" fill="#ffffff" opacity="0.08" />
      <circle cx="140" cy="80" r="46" fill="#ffffff" opacity="0.08" />
      {/* colis principal */}
      <g transform="rotate(-4 100 90)">
        <rect x="62" y="62" width="84" height="66" rx="8" fill="#fde68a" />
        <rect x="62" y="62" width="84" height="22" rx="8" fill="#fbbf24" />
        <rect x="98" y="62" width="12" height="66" fill="#b45309" opacity="0.55" />
        <circle cx="132" cy="106" r="9" fill="#ffffff" />
        <path d="m128.5 106 2.5 2.5 5-5" stroke="#0f766e" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* petit colis */}
      <g transform="rotate(7 60 120)">
        <rect x="38" y="104" width="42" height="34" rx="6" fill="#ffffff" opacity="0.92" />
        <rect x="56" y="104" width="7" height="34" fill="#0f766e" opacity="0.35" />
      </g>
      {/* traits de vitesse */}
      <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.5">
        <path d="M18 70h22" />
        <path d="M10 88h30" />
        <path d="M20 106h18" />
      </g>
    </svg>
  );
}

function TelephoneMomo() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full max-w-[220px]" aria-hidden="true">
      <circle cx="130" cy="80" r="68" fill="#ffffff" opacity="0.08" />
      {/* téléphone */}
      <g transform="rotate(6 120 80)">
        <rect x="92" y="22" width="66" height="118" rx="12" fill="#06231f" />
        <rect x="98" y="34" width="54" height="86" rx="6" fill="#0d9488" />
        <rect x="104" y="44" width="42" height="10" rx="5" fill="#ffffff" opacity="0.85" />
        <rect x="104" y="60" width="42" height="26" rx="5" fill="#ffffff" opacity="0.25" />
        <text x="125" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">FCFA</text>
        <rect x="104" y="92" width="42" height="12" rx="6" fill="#f59e0b" />
        <circle cx="125" cy="130" r="4.5" fill="#ffffff" opacity="0.7" />
      </g>
      {/* pièce */}
      <g>
        <circle cx="62" cy="98" r="26" fill="#f59e0b" />
        <circle cx="62" cy="98" r="20" fill="#fbbf24" />
        <text x="62" y="103" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350f">F</text>
      </g>
      {/* coche envoyée */}
      <g transform="translate(40 34)">
        <circle cx="12" cy="12" r="12" fill="#ffffff" />
        <path d="m7 12 3.5 3.5L18 8" stroke="#0f766e" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function SacsShopping() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full max-w-[220px]" aria-hidden="true">
      <circle cx="128" cy="82" r="68" fill="#ffffff" opacity="0.08" />
      {/* grand sac */}
      <g transform="rotate(-3 110 100)">
        <path d="M84 62h64l6 66a8 8 0 0 1-8 9H86a8 8 0 0 1-8-9z" fill="#f59e0b" />
        <path d="M84 62h64l2 22H82z" fill="#fbbf24" />
        <path d="M100 62v-8a16 16 0 0 1 32 0v8" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
      {/* petit sac */}
      <g transform="rotate(8 60 110)">
        <path d="M44 84h40l4 44a6 6 0 0 1-6 7H46a6 6 0 0 1-6-7z" fill="#ffffff" opacity="0.92" />
        <path d="M54 84v-6a10 10 0 0 1 20 0v6" stroke="#0f766e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="64" cy="108" r="8" fill="#0d9488" opacity="0.5" />
      </g>
      <g fill="#ffffff" opacity="0.7">
        <circle cx="160" cy="34" r="3" />
        <circle cx="176" cy="52" r="2.2" />
        <circle cx="150" cy="18" r="2.2" />
      </g>
    </svg>
  );
}

/* ------------------------------- Diapos ----------------------------------- */

export function DiapoMarque() {
  return (
    <Slide
      fond="bg-gradient-to-r from-nile-900 via-nile-800 to-nile-700"
      kicker="La marketplace du Cameroun"
      titre="Achetez malin, payez comme vous voulez"
      texte="Des produits vérifiés, livrés gratuitement partout au pays."
      cta="Parcourir le catalogue"
      ctaHref="/catalogue"
      illustration={<SacsShopping />}
      photo={PHOTOS.marche}
    />
  );
}

export function DiapoLivraison() {
  return (
    <Slide
      fond="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500"
      kicker="Zéro risque"
      titre="Payez à la livraison"
      texte="Commandez, vérifiez votre colis à la réception, puis payez en espèces."
      cta="Commander en toute confiance"
      ctaHref="/catalogue"
      ctaClair
      illustration={<Colis />}
      photo={PHOTOS.livraison}
      voile="bg-gradient-to-r from-amber-950/85 via-amber-800/55 to-amber-700/10"
    />
  );
}

export function DiapoMomo() {
  return (
    <Slide
      fond="bg-gradient-to-r from-nile-800 via-nile-700 to-emerald-700"
      kicker="MTN MoMo · Orange Money"
      titre="Paiement mobile sécurisé"
      texte="Réglez depuis votre téléphone, confirmation en quelques secondes."
      cta="Voir les produits"
      ctaHref="/catalogue"
      illustration={<TelephoneMomo />}
      photo={PHOTOS.momo}
    />
  );
}
