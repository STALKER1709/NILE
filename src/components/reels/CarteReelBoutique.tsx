import Link from "next/link";
import Image from "next/image";
import { formaterXAF } from "@/lib/money";

/**
 * Carte de publication (« Reel ») affichée sur la fiche boutique.
 *
 * Lecture au clic, jamais d'autoplay : la data est chère, on ne télécharge une
 * vidéo que sur demande. L'aperçu (poster) est une image JPEG capturée par le
 * vendeur au moment du choix du fichier — aucun transcodage serveur.
 *
 * Seul le PREMIER média sert de couverture ici ; le fil complet arrive avec la
 * page /reels (incrément suivant).
 */
export type PublicationBoutique = {
  id: string;
  texte: string | null;
  dateCreation: Date;
  medias: {
    type: "IMAGE" | "VIDEO";
    url: string;
    posterUrl: string | null;
    ordre: number;
  }[];
  produits: {
    produit: { id: string; slug: string; titre: string; prix: number };
  }[];
};

export function CarteReelBoutique({
  publication,
  index = 0,
}: {
  publication: PublicationBoutique;
  index?: number;
}) {
  const couverture = publication.medias[0];
  if (!couverture) return null;
  const estVideo = couverture.type === "VIDEO";
  const apercu = estVideo ? couverture.posterUrl : couverture.url;
  const nbRestants = publication.medias.length - 1;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
      className="group flex w-44 shrink-0 snap-start animate-fondu-haut flex-col overflow-hidden rounded-xl border border-contour-carte bg-white sm:w-52"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-slate-950">
        {estVideo ? (
          // Contrôles natifs : lecture au clic, muette, aucun téléchargement
          // de flux avant l'action de l'acheteur.
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster={apercu ?? undefined}
            src={couverture.url}
          />
        ) : (
          <Image
            src={couverture.url}
            alt={publication.texte ?? "Publication de la boutique"}
            fill
            sizes="(max-width: 640px) 45vw, 208px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={index < 2}
          />
        )}
        {estVideo && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Vidéo
          </span>
        )}
        {nbRestants > 0 && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white">
            +{nbRestants}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {publication.texte && (
          <p className="ligne-2 min-h-[2.4rem] text-corps-sm leading-snug text-slate-700">
            {publication.texte}
          </p>
        )}
        {publication.produits.length > 0 && (
          <ul className="mt-auto flex flex-col gap-1">
            {publication.produits.slice(0, 2).map(({ produit }) => (
              <li key={produit.id}>
                <Link
                  href={`/produit/${produit.slug}`}
                  className="flex items-center justify-between gap-2 rounded bg-surface-subtile px-2 py-1.5 text-etiquette-xs transition-colors hover:bg-nile-50"
                >
                  <span className="truncate font-semibold text-slate-700">
                    {produit.titre}
                  </span>
                  <span className="shrink-0 font-bold text-nile-700">
                    {formaterXAF(produit.prix)}
                  </span>
                </Link>
              </li>
            ))}
            {publication.produits.length > 2 && (
              <li className="px-2 text-[11px] text-slate-400">
                +{publication.produits.length - 2} produit
                {publication.produits.length > 3 ? "s" : ""}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
