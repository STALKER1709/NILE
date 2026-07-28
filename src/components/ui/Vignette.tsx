import Image from "next/image";

/**
 * Image produit optimisée (next/image : responsive, lazy, AVIF/WebP) avec
 * repli visuel si aucune image. Le conteneur doit avoir une taille
 * (ex. aspect-square w-full).
 *
 * Deux modes d'ajustement :
 *  - "contenir" (défaut) : le produit est visible EN ENTIER, centré sur fond
 *    blanc, quel que soit le format de la photo (norme e-commerce). Un léger
 *    padding interne évite que le produit touche les bords.
 *  - "couvrir" : l'image remplit le cadre (recadrée si besoin) — pour les
 *    visuels décoratifs, pas pour les photos produit.
 */
export function Vignette({
  url,
  alt,
  sizes = "(max-width: 640px) 50vw, 240px",
  className = "",
  classImage = "",
  ajustement = "contenir",
  priority = false,
}: {
  url?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  /** Classes appliquées à l'image interne (ex. zoom au survol, confiné au cadre). */
  classImage?: string;
  ajustement?: "contenir" | "couvrir";
  priority?: boolean;
}) {
  const contenir = ajustement === "contenir";
  return (
    <div
      className={`relative overflow-hidden ${contenir ? "bg-white" : "bg-slate-100"} ${className}`}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`${contenir ? "object-contain p-1.5" : "object-cover"} ${classImage}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v8.6l3.5-3.5 2.5 2.5L15 10l4 4V7H5zm3 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
        </div>
      )}
    </div>
  );
}
