import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerPublicationsVendeur } from "@/modules/reels/reels";
import { supprimerPublicationAction } from "@/app/(vendeur)/vendeur/reels/actions";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import { Badge, EtatVide, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes Reels" };

const MESSAGES_OK: Record<string, string> = {
  cree: "Publication en ligne : visible sur votre boutique.",
  supprimee: "Publication supprimée.",
};

/** Vignette statique de la première image (ou aperçu vidéo). */
function Apercu({
  url,
  estVideo,
  alt,
}: {
  url?: string;
  estVideo: boolean;
  alt: string;
}) {
  if (!url) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center bg-surface-subtile text-slate-400">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m10 9.5 5 2.5-5 2.5z" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- aperçu vendeur :
    // vignette petite et changeante, l'optimisation next/image ne paierait
    // pas son coût de revalidation ici.
    <img
      src={url}
      alt={alt}
      className="aspect-[3/4] w-full object-cover"
      loading="lazy"
    />
  );
}

export default async function ReelsVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const publications = await listerPublicationsVendeur(vendeur.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Mes Reels</h1>
          <p className="mt-0.5 text-corps-sm text-slate-500">
            Photos et courtes vidéos de votre boutique, visibles sur votre fiche
            boutique.
          </p>
        </div>
        <Link href="/vendeur/reels/nouveau" className={btn("primaire", "md")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle publication
        </Link>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {publications.length === 0 ? (
        <EtatVide titre="Aucune publication pour l'instant.">
          <p className="mt-1 text-corps-sm text-slate-500">
            Montrez vos produits, votre stock, vos arrivages : les acheteurs font
            confiance à une boutique qui montre son visage.
          </p>
          <Link
            href="/vendeur/reels/nouveau"
            className={`${btn("accent", "md")} mt-4`}
          >
            Créer ma première publication
          </Link>
        </EtatVide>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {publications.map((pub) => {
            const media = pub.medias[0];
            const apercu =
              media?.type === "VIDEO" ? media.posterUrl : media?.url;
            return (
              <li
                key={pub.id}
                className="flex flex-col overflow-hidden rounded-xl border border-contour-carte bg-white"
              >
                <Apercu
                  url={apercu ?? undefined}
                  estVideo={media?.type === "VIDEO"}
                  alt={pub.texte ?? "Publication"}
                />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge ton={pub.statut === "ACTIF" ? "vert" : "rouge"}>
                      {pub.statut === "ACTIF" ? "En ligne" : "Masquée"}
                    </Badge>
                    <Badge ton="neutre">
                      {pub.medias.length} média{pub.medias.length > 1 ? "s" : ""}
                    </Badge>
                    {pub._count.produits > 0 && (
                      <Badge ton="ambre">
                        {pub._count.produits} produit
                        {pub._count.produits > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {pub.texte && (
                    <p className="ligne-2 text-corps-sm text-slate-700">
                      {pub.texte}
                    </p>
                  )}
                  <p className="text-etiquette-xs text-slate-400">
                    {new Date(pub.dateCreation).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <form action={supprimerPublicationAction} className="mt-auto pt-1">
                    <input type="hidden" name="publicationId" value={pub.id} />
                    <BoutonConfirme
                      question="Supprimer cette publication ? Les fichiers associés seront également retirés."
                      enCours="Suppression…"
                      className="w-full rounded border border-red-200 px-3 py-1.5 text-etiquette-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Supprimer
                    </BoutonConfirme>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
