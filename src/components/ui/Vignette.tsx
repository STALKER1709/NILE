import Image from "next/image";

/**
 * Image optimisée (next/image : responsive, lazy, AVIF/WebP) avec repli visuel
 * si aucune image. Le conteneur doit avoir une taille (ex. aspect-square w-full).
 */
export function Vignette({
  url,
  alt,
  sizes = "(max-width: 640px) 50vw, 240px",
  className = "",
  classImage = "",
  priority = false,
}: {
  url?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  /** Classes appliquées à l'image interne (ex. zoom au survol, confiné au cadre). */
  classImage?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${classImage}`}
        />

      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-300">
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v8.6l3.5-3.5 2.5 2.5L15 10l4 4V7H5zm3 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
        </div>
      )}
    </div>
  );
}
