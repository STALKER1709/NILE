import Link from "next/link";
import Image from "next/image";

/**
 * Diapositives du carrousel d'accueil.
 * Deux rendus possibles par diapo :
 *  - photo réelle en fond (fichiers /public/bannieres/*.jpg) + voile dégradé ;
 *  - illustration SVG dessinée (repli tant que les photos ne sont pas là).
 */
const PHOTOS_ACTIVES = true;

const PHOTOS = {
  marche: "/bannieres/marche.jpg",
  livraison: "/bannieres/livraison.jpg",
  momo: "/bannieres/momo.jpg",
} as const;

function Slide({
  fond,
  titre,
  texte,
  cta,
  ctaHref,
  ctaClair = false,
  illustration,
  photo,
  voile,
  prioritaire = false,
}: {
  fond: string;
  titre: string;
  texte: string;
  cta: string;
  ctaHref: string;
  ctaClair?: boolean;
  illustration: React.ReactNode;
  photo?: string;
  /** Dégradé posé sur la photo pour garder le texte lisible. */
  voile?: string;
  /** Seule la première diapo est préchargée (les autres sont hors écran). */
  prioritaire?: boolean;
}) {
  const avecPhoto = PHOTOS_ACTIVES && photo;
  return (
    <div className={`group relative flex h-[28rem] items-center overflow-hidden sm:h-[34rem] rounded-2xl ${fond}`}>
      {avecPhoto && (
        <>
          <Image
            src={photo}
            alt=""
            fill
            priority={prioritaire}
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Voile dégradé doux pour lisibilité parfaite */}
          <div
            className={`absolute inset-0 ${
              voile ?? "bg-gradient-to-r from-nile-950/95 via-nile-950/70 to-transparent sm:via-nile-950/50"
            }`}
          />
        </>
      )}
      <div className="relative z-10 flex max-w-2xl flex-col px-6 py-8 sm:px-14">
        <h2 className="font-titre text-display-mobile text-white sm:text-display-lg leading-[1.15]">
          {titre}
        </h2>
        <p className="mt-4 max-w-lg text-corps-md text-slate-100/90 sm:text-corps-lg leading-relaxed">
          {texte}
        </p>
        <div className="mt-8">
          <Link
            href={ctaHref}
            className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
              ctaClair
                ? "bg-white text-nile-900 hover:bg-slate-50"
                : "bg-accent text-slate-950 hover:bg-accent-dark hover:text-white"
            }`}
          >
            <span>{cta}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
      {!avecPhoto && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] items-center justify-center sm:flex">
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
      <g transform="rotate(-4 100 90)">
        <rect x="62" y="62" width="84" height="66" rx="8" fill="#fde68a" />
        <rect x="62" y="62" width="84" height="22" rx="8" fill="#fbbf24" />
        <rect x="98" y="62" width="12" height="66" fill="#b45309" opacity="0.55" />
        <circle cx="132" cy="106" r="9" fill="#ffffff" />
        <path d="m128.5 106 2.5 2.5 5-5" stroke="#0f766e" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(7 60 120)">
        <rect x="38" y="104" width="42" height="34" rx="6" fill="#ffffff" opacity="0.92" />
        <rect x="56" y="104" width="7" height="34" fill="#0f766e" opacity="0.35" />
      </g>
    </svg>
  );
}

function TelephoneMomo() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full max-w-[220px]" aria-hidden="true">
      <circle cx="130" cy="80" r="68" fill="#ffffff" opacity="0.08" />
      <g transform="rotate(6 120 80)">
        <rect x="92" y="22" width="66" height="118" rx="12" fill="#06231f" />
        <rect x="98" y="34" width="54" height="86" rx="6" fill="#0d9488" />
        <rect x="104" y="44" width="42" height="10" rx="5" fill="#ffffff" opacity="0.85" />
        <rect x="104" y="60" width="42" height="26" rx="5" fill="#ffffff" opacity="0.25" />
        <text x="125" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">FCFA</text>
        <rect x="104" y="92" width="42" height="12" rx="6" fill="#f59e0b" />
        <circle cx="125" cy="130" r="4.5" fill="#ffffff" opacity="0.7" />
      </g>
      <g>
        <circle cx="62" cy="98" r="26" fill="#f59e0b" />
        <circle cx="62" cy="98" r="20" fill="#fbbf24" />
        <text x="62" y="103" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350f">F</text>
      </g>
    </svg>
  );
}

function SacsShopping() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full max-w-[220px]" aria-hidden="true">
      <circle cx="128" cy="82" r="68" fill="#ffffff" opacity="0.08" />
      <g transform="rotate(-3 110 100)">
        <path d="M84 62h64l6 66a8 8 0 0 1-8 9H86a8 8 0 0 1-8-9z" fill="#f59e0b" />
        <path d="M84 62h64l2 22H82z" fill="#fbbf24" />
        <path d="M100 62v-8a16 16 0 0 1 32 0v8" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ------------------------------- Diapos ----------------------------------- */

export function DiapoMarque() {
  return (
    <Slide
      fond="bg-gradient-to-r from-nile-950 via-nile-900 to-nile-800"
      titre="Le meilleur du commerce camerounais en ligne"
      texte="Des milliers d'articles certifiés auprès de boutiques locales et de nos stocks propres. Commandez en toute sérénité."
      cta="Parcourir le catalogue"
      ctaHref="/catalogue"
      illustration={<SacsShopping />}
      photo={PHOTOS.marche}
      prioritaire
    />
  );
}

export function DiapoLivraison() {
  return (
    <Slide
      fond="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600"
      titre="Paiement à la livraison, zéro surprise"
      texte="Passez votre commande en ligne, vérifiez votre colis à la réception, puis réglez en espèces."
      cta="Commander en confiance"
      ctaHref="/catalogue"
      ctaClair
      illustration={<Colis />}
      photo={PHOTOS.livraison}
      voile="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-transparent"
    />
  );
}

export function DiapoMomo() {
  return (
    <Slide
      fond="bg-gradient-to-r from-nile-900 via-nile-800 to-emerald-800"
      titre="MTN MoMo & Orange Money intégrés"
      texte="Réglez vos achats directement par Mobile Money avec confirmation instantanée et sécurisée."
      cta="Découvrir les offres"
      ctaHref="/promotions"
      illustration={<TelephoneMomo />}
      photo={PHOTOS.momo}
    />
  );
}
