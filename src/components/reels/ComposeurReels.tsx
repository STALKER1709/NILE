"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demanderUploadAction, confirmerUploadAction, creerPublicationAction } from "@/app/(vendeur)/vendeur/reels/actions";
import {
  validerMedia,
  messageErreurPublication,
  DUREE_VIDEO_MAX_SECONDES,
  MAX_MEDIAS_PAR_PUBLICATION,
  MAX_VIDEOS_PAR_PUBLICATION,
  MAX_TAGS_PRODUITS,
  TEXTE_PUBLICATION_MAX,
} from "@/modules/reels/reels-core";
import { typeMimeDepuisExtension } from "@/modules/stockage/StorageProvider";
import { formaterXAF } from "@/lib/money";
import { btn, labelClass } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

/**
 * Composeur de publication (« Reels »), entièrement client.
 *
 * Par fichier : validation locale (type/poids/durée AVANT d'envoyer des Mo —
 * data chère) → ticket serveur → PUT direct → confirmation serveur. Pour une
 * vidéo, une image d'aperçu (« poster ») est capturée dans le navigateur au
 * moment du choix du fichier : aucun transcodage, aucune dépendance serveur.
 *
 * La soumission passe par `creerPublicationAction` qui RENVOIE son résultat :
 * une erreur laisse le composeur intact (aucun re-téléversement).
 */

type MediaCompose = {
  id: string;
  apercu: string; // URL objet locale, aperçu instantané sans ré-envoi
  nom: string;
  statut: "envoi" | "pret" | "erreur";
  message?: string;
  type?: "IMAGE" | "VIDEO";
  chemin?: string;
  posterChemin?: string;
};

/** Fichier → type MIME, avec repli sur l'extension (certains OS donnent ""). */
function typeMimePour(fichier: File): string {
  if (fichier.type) return fichier.type;
  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  return typeMimeDepuisExtension(ext) ?? "";
}

function messageEnvoi(code: string): string {
  if (code === "ENVOI_ECHEC" || code === "ERREUR" || code === "ERREUR_SERVEUR") {
    return "Envoi impossible : vérifiez votre connexion et réessayez.";
  }
  if (code === "CHEMIN_INVALIDE" || code === "MEDIA_ABSENT" || code === "ABSENT") {
    return "Fichier non reçu par le stockage. Réessayez l'envoi.";
  }
  if (code === "BOUTIQUE_NON_VALIDEE") {
    return "Votre boutique doit d'abord être validée par NILE pour publier des Reels.";
  }
  if (code === "NON_CONNECTE" || code === "INTERDIT") {
    return "Session expirée : reconnectez-vous puis réessayez.";
  }
  return messageErreurPublication(code);
}

/** Durée de la vidéo via les métadonnées (aucun téléchargement complet). */
function lireDuree(fichier: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(fichier);
    const video = document.createElement("video");
    video.preload = "metadata";
    const fin = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      fin();
      // Durée illisible (NaN/Infinity) → null : le garde-fou réel reste le
      // poids (15 Mo), la durée est un contrôle de confort côté client.
      resolve(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      fin();
      resolve(null);
    };
    video.src = url;
  });
}

/** Capture d'une image d'aperçu à ~1 s : servie avec <video poster>. */
async function capturerApercu(
  fichier: File,
  duree: number | null,
): Promise<Blob | null> {
  const url = URL.createObjectURL(fichier);
  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("VIDEO_ILLISIBLE"));
      video.src = url;
    });
    const cible = Math.min(Math.max(0.1, (duree ?? 1) / 2), 1.5);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = cible;
    });
    const canvas = document.createElement("canvas");
    const largeur = Math.min(720, video.videoWidth || 720);
    const hauteur = Math.round(
      largeur * ((video.videoHeight || 1280) / (video.videoWidth || 720)),
    );
    canvas.width = largeur;
    canvas.height = hauteur;
    canvas.getContext("2d")?.drawImage(video, 0, 0, largeur, hauteur);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
  } catch {
    // Aperçu impossible (codec exotique) : la vidéo reste publiable sans
    // poster, l'aperçu sera la première image chargée par le navigateur.
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ComposeurReels({
  produits,
}: {
  /** Produits ACTIFS de ce vendeur (pour le taggage). */
  produits: { id: string; titre: string; prix: number }[];
}) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [medias, setMedias] = useState<MediaCompose[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const inputFichiers = useRef<HTMLInputElement>(null);

  // Miroir synchrone du state : la boucle d'envoi traite les fichiers un par
  // un et doit lire l'état COURANT à chaque itération.
  const mediasRef = useRef<MediaCompose[]>([]);
  const appliquer = (liste: MediaCompose[]) => {
    mediasRef.current = liste;
    setMedias(liste);
  };
  const majMedia = (id: string, patch: Partial<MediaCompose>) =>
    appliquer(
      mediasRef.current.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );

  const enEnvoi = medias.some((m) => m.statut === "envoi");
  const prets = medias.filter((m) => m.statut === "pret");

  /** Ticket → PUT → confirmation. Renvoie la clé, lève une chaîne de code. */
  async function envoyer(
    fichier: File,
    typeMime: string,
    duree?: number,
  ): Promise<string> {
    const ticket = await demanderUploadAction({
      typeMime,
      tailleOctets: fichier.size,
      dureeSecondes: duree,
    });
    if (!ticket.ok || !ticket.ticket) throw ticket.code ?? "ERREUR";

    let rep: Response;
    if (ticket.ticket.mode === "signe") {
      // URL signée Supabase : corps FormData (cacheControl + fichier), le
      // token est déjà dans l'URL — aucun secret côté navigateur.
      const corps = new FormData();
      corps.append("cacheControl", "3600");
      corps.append("", fichier);
      rep = await fetch(ticket.ticket.url, {
        method: ticket.ticket.methode,
        body: corps,
        headers: { "x-upsert": "false" },
      });
    } else {
      // Route locale (dev) : corps brut, en-têtes d'identité du fichier.
      rep = await fetch(ticket.ticket.url, {
        method: ticket.ticket.methode,
        body: fichier,
        headers: { "content-type": typeMime, "x-chemin": ticket.ticket.chemin },
      });
    }
    if (!rep.ok) throw "ENVOI_ECHEC";

    const confirme = await confirmerUploadAction({
      chemin: ticket.ticket.chemin,
      typeMime,
    });
    if (!confirme.ok || !confirme.chemin) throw confirme.code ?? "ERREUR";
    return confirme.chemin;
  }

  async function choisirFichiers(liste: FileList) {
    setErreur(null);
    for (const brut of Array.from(liste)) {
      if (mediasRef.current.length >= MAX_MEDIAS_PAR_PUBLICATION) {
        setErreur(messageErreurPublication("TROP_DE_MEDIAS"));
        return;
      }
      const typeMime = typeMimePour(brut);
      const estVideo = typeMime.startsWith("video/");
      const nbVideos = mediasRef.current.filter(
        (m) => m.type === "VIDEO",
      ).length;
      if (estVideo && nbVideos >= MAX_VIDEOS_PAR_PUBLICATION) {
        setErreur(messageErreurPublication("TROP_DE_VIDEOS"));
        return;
      }

      // Un type d'extension absente du catalogue est rejeté tout de suite.
      const type = estVideo ? "VIDEO" : "IMAGE";
      const id = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random());
      const apercu = URL.createObjectURL(brut);
      appliquer([
        ...mediasRef.current,
        { id, apercu, nom: brut.name, statut: "envoi", type },
      ]);

      try {
        const duree = estVideo ? await lireDuree(brut) : null;
        const verdict = validerMedia({
          typeMime,
          tailleOctets: brut.size,
          dureeSecondes: duree ?? undefined,
        });
        if (!verdict.ok) throw verdict.code;

        // Normalise le type MIME du File si l'OS l'a laissé vide : le
        // stockage vérifie la concordance type/extension côté serveur.
        const fichier =
          brut.type === typeMime
            ? brut
            : new File([brut], brut.name, { type: typeMime });

        const chemin = await envoyer(fichier, typeMime, duree ?? undefined);

        let posterChemin: string | undefined;
        if (estVideo) {
          const poster = await capturerApercu(brut, duree);
          if (poster) {
            try {
              posterChemin = await envoyer(
                new File([poster], "apercu.jpg", { type: "image/jpeg" }),
                "image/jpeg",
              );
            } catch (echec) {
              // L'aperçu est un confort : la vidéo reste publiable sans lui.
              console.error("[composeur] aperçu vidéo non téléversé :", echec);
            }
          }
        }
        majMedia(id, { statut: "pret", chemin, posterChemin, message: undefined });
      } catch (echec) {
        const code = typeof echec === "string" ? echec : "ERREUR";
        majMedia(id, { statut: "erreur", message: messageEnvoi(code) });
      }
    }
  }

  function retirer(media: MediaCompose) {
    appliquer(mediasRef.current.filter((m) => m.id !== media.id));
    URL.revokeObjectURL(media.apercu);
    if (media.chemin || media.posterChemin) {
      // Nettoyage best-effort : un échec est journalisé côté serveur.
      void confirmerSuppression(
        [media.chemin, media.posterChemin].filter((c): c is string => !!c),
      );
    }
  }

  async function confirmerSuppression(chemins: string[]) {
    try {
      const { supprimerUploadAction } = await import(
        "@/app/(vendeur)/vendeur/reels/actions"
      );
      await supprimerUploadAction({ chemins });
    } catch (echec) {
      console.error("[composeur] nettoyage d'envoi échoué :", echec);
    }
  }

  async function soumettre(formData: FormData) {
    if (mediasRef.current.some((m) => m.statut === "envoi")) {
      setErreur("Attendez la fin des envois en cours avant de publier.");
      return;
    }
    if (prets.length === 0) {
      setErreur(messageErreurPublication("AUCUN_MEDIA"));
      return;
    }
    setErreur(null);
    const res = await creerPublicationAction(formData);
    if (res.ok) {
      for (const m of mediasRef.current) URL.revokeObjectURL(m.apercu);
      router.push("/vendeur/reels?ok=cree");
      router.refresh();
    } else {
      setErreur(res.message);
    }
  }

  const tagsChoisis = tags
    .map((id) => produits.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const candidats = produits
    .filter(
      (p) =>
        !tags.includes(p.id) &&
        (recherche.trim() === "" ||
          p.titre.toLowerCase().includes(recherche.trim().toLowerCase())),
    )
    .slice(0, 6);

  return (
    <form action={soumettre} className="space-y-5">
      <input type="hidden" name="texte" value={texte} />
      <input
        type="hidden"
        name="medias"
        value={JSON.stringify(
          prets.map((m) => ({
            type: m.type,
            chemin: m.chemin,
            posterChemin: m.posterChemin ?? null,
          })),
        )}
      />
      <input
        type="hidden"
        name="produitIds"
        value={JSON.stringify(tags)}
      />

      {/* Légende */}
      <section className="rounded border border-contour-carte bg-white p-4">
        <label htmlFor="texte" className={labelClass}>
          Légende
        </label>
        <textarea
          id="texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={TEXTE_PUBLICATION_MAX}
          rows={3}
          placeholder="Quoi de neuf dans votre boutique ? (facultatif)"
          className="block w-full rounded border border-contour-carte bg-white px-3.5 py-2.5 text-[16px] leading-6 text-slate-900 placeholder:text-slate-400 focus:border-nile-700 focus:outline-none focus:ring-2 focus:ring-nile-700/10"
        />
        <p className="mt-1 text-right text-etiquette-xs text-slate-400">
          {texte.length}/{TEXTE_PUBLICATION_MAX}
        </p>
      </section>

      {/* Médias */}
      <section className="rounded border border-contour-carte bg-white p-4">
        <p className={labelClass}>Photos et vidéo</p>
        <p className="mb-3 text-corps-sm text-slate-500">
          JPEG, PNG ou WEBP (2 Mo max) · vidéo MP4 ({DUREE_VIDEO_MAX_SECONDES} s
          max, 15 Mo) · {MAX_MEDIAS_PAR_PUBLICATION} médias dont une seule vidéo.
          La première image sert d&apos;aperçu dans le fil.
        </p>

        <input
          ref={inputFichiers}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void choisirFichiers(e.target.files);
            e.target.value = ""; // permet de re-choisir le même fichier
          }}
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {medias.map((media) => (
            <li
              key={media.id}
              className="relative overflow-hidden rounded-lg border border-contour-carte bg-slate-50"
            >
              <div className="relative aspect-[3/4]">
                <object
                  data={media.apercu}
                  type={media.type === "VIDEO" ? "video/mp4" : "image/jpeg"}
                  className="h-full w-full"
                  aria-label={media.nom}
                >
                  <span className="grid h-full w-full place-items-center text-xs text-slate-400">
                    {media.nom}
                  </span>
                </object>
                {media.statut === "envoi" && (
                  <div className="absolute inset-0 grid place-items-center bg-white/75">
                    <span className="flex items-center gap-2 text-etiquette-md text-nile-800">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                      </svg>
                      Envoi…
                    </span>
                  </div>
                )}
                {media.statut === "erreur" && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-600/95 px-2 py-1.5 text-[11px] font-medium text-white">
                    {media.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => retirer(media)}
                disabled={media.statut === "envoi"}
                aria-label={`Retirer ${media.nom}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80 disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
          {medias.length < MAX_MEDIAS_PAR_PUBLICATION && (
            <li>
              <button
                type="button"
                onClick={() => inputFichiers.current?.click()}
                className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-contour-clair text-etiquette-md text-slate-500 transition-colors hover:border-nile-600 hover:text-nile-700"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ajouter
              </button>
            </li>
          )}
        </ul>
      </section>

      {/* Tags produits (conversion) */}
      <section className="rounded border border-contour-carte bg-white p-4">
        <p className={labelClass}>
          Produits mis en avant ({tags.length}/{MAX_TAGS_PRODUITS})
        </p>
        {tagsChoisis.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {tagsChoisis.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-1.5 rounded-full bg-nile-50 py-1 pl-3 pr-1.5 text-etiquette-xs font-semibold text-nile-800"
              >
                {p.titre}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== p.id))}
                  aria-label={`Retirer ${p.titre}`}
                  className="grid h-5 w-5 place-items-center rounded-full bg-nile-100 hover:bg-nile-200"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        {tags.length < MAX_TAGS_PRODUITS && produits.length > 0 && (
          <>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un de vos produits…"
              className="block w-full rounded border border-contour-carte bg-white px-3.5 py-2.5 text-[16px] text-slate-900 placeholder:text-slate-400 focus:border-nile-700 focus:outline-none focus:ring-2 focus:ring-nile-700/10"
            />
            {candidats.length > 0 && (
              <ul className="mt-2 divide-y divide-surface-subtile rounded border border-contour-carte">
                {candidats.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setTags([...tags, p.id])}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-corps-sm transition-colors hover:bg-surface-subtile"
                    >
                      <span className="truncate">{p.titre}</span>
                      <span className="shrink-0 font-semibold text-nile-700">
                        {formaterXAF(p.prix)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {produits.length === 0 && (
          <p className="text-corps-sm text-slate-500">
            Aucun produit en ligne : publiez d&apos;abord un produit pour pouvoir
            le mettre en avant ici.
          </p>
        )}
      </section>

      {erreur && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {erreur}
        </p>
      )}

      <div className="flex items-center gap-3">
        <BoutonSoumettre
          className={btn("primaire", "lg")}
          enCours="Publication…"
        >
          Publier la publication
        </BoutonSoumettre>
        <span className="text-etiquette-xs text-slate-500">
          {prets.length} média{prets.length > 1 ? "s" : ""} prêt
          {prets.length > 1 ? "s" : ""}
          {enEnvoi ? " · envois en cours…" : ""}
        </span>
      </div>
    </form>
  );
}
