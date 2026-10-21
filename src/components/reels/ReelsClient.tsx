"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formaterXAF } from "@/lib/money";

type ReelMedia = { id: string; type: "IMAGE" | "VIDEO"; url: string; posterUrl?: string | null };
type ReelProduit = { produit: { id: string; slug: string; titre: string; prix: number } };
type ReelCommentaire = { id: string; contenu: string; utilisateur?: { id?: string; nom: string }; dateCreation?: string };
type Reel = {
  id: string;
  texte: string | null;
  dateCreation: string;
  vendeur?: { id: string; nomBoutique: string };
  medias: ReelMedia[];
  produits: ReelProduit[];
  likes?: { id: string }[];
  commentaires?: ReelCommentaire[];
  _count?: { likes: number; commentaires: number; partages: number };
};
type ReelUtilisateur = { id: string; nom: string } | null;

export function ReelsClient({ utilisateur }: { utilisateur: ReelUtilisateur }) {
  const [publications, setPublications] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [actifId, setActifId] = useState<string | null>(null);
  const [reelInitial, setReelInitial] = useState<string | null>(null);
  const [sonActif, setSonActif] = useState(false);
  const [pauses, setPauses] = useState<Record<string, boolean>>({});
  const [likesEnCours, setLikesEnCours] = useState<string[]>([]);
  const [reelCommentaires, setReelCommentaires] = useState<Reel | null>(null);
  const [commentairesOuverts, setCommentairesOuverts] = useState(false);
  const [commentairesChargement, setCommentairesChargement] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [envoiCommentaire, setEnvoiCommentaire] = useState(false);
  const [erreurCommentaire, setErreurCommentaire] = useState<string | null>(null);
  const [messageInfo, setMessageInfo] = useState<string | null>(null);
  const fluxRef = useRef<HTMLDivElement>(null);
  const cartesRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    let annule = false;
    async function charger() {
      try {
        const idInitial = new URLSearchParams(window.location.search).get("reel");
        setReelInitial(idInitial);
        const reponse = await fetch("/api/reels?limit=30", { cache: "no-store" });
        if (!reponse.ok) throw new Error("Chargement impossible");
        const donnees = await reponse.json();
        let liste: Reel[] = Array.isArray(donnees.publications) ? donnees.publications : [];
        // Un lien partagé reste accessible même si le Reel est plus ancien que le fil.
        if (idInitial && !liste.some((pub) => pub.id === idInitial)) {
          const detail = await fetch("/api/reels/" + encodeURIComponent(idInitial), { cache: "no-store" });
          if (detail.ok) {
            const d = await detail.json();
            if (d.publication) liste = [d.publication, ...liste];
          }
        }
        if (!annule) {
          setPublications(liste);
          setActifId(idInitial && liste.some((pub) => pub.id === idInitial) ? idInitial : liste[0]?.id ?? null);
        }
      } catch {
        if (!annule) setErreurChargement(true);
      } finally {
        if (!annule) setLoading(false);
      }
    }
    void charger();
    return () => { annule = true; };
  }, []);

  useEffect(() => {
    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflowInitial; };
  }, []);

  useEffect(() => {
    if (!commentairesOuverts) return;
    const ecouterClavier = (event: KeyboardEvent) => {
      if (event.key === "Escape") fermerCommentaires();
    };
    document.addEventListener("keydown", ecouterClavier);
    return () => document.removeEventListener("keydown", ecouterClavier);
  }, [commentairesOuverts]);

  useEffect(() => {
    if (loading || !publications.length || !reelInitial) return;
    const cible = cartesRef.current.get(reelInitial);
    if (cible) requestAnimationFrame(() => cible.scrollIntoView({ behavior: "auto", block: "start" }));
  }, [loading, publications, reelInitial]);

  useEffect(() => {
    const racine = fluxRef.current;
    if (!racine || !publications.length) return;
    const observer = new IntersectionObserver((entrees) => {
      const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const id = visible?.target.getAttribute("data-reel-id");
      if (id) setActifId(id);
    }, { root: racine, threshold: [0.25, 0.55, 0.8] });
    cartesRef.current.forEach((carte) => observer.observe(carte));
    return () => observer.disconnect();
  }, [publications, loading]);

  // Une seule vidéo est chargée/écoutée à la fois pour limiter la consommation data.
  useEffect(() => {
    cartesRef.current.forEach((carte, id) => {
      const video = carte.querySelector("video");
      if (!video) return;
      if (id === actifId && !commentairesOuverts && document.visibilityState !== "hidden") {
        video.muted = !sonActif;
        const lecture = video.play();
        if (lecture) lecture.then(() => {
          setPauses((etat) => etat[id] === false ? etat : { ...etat, [id]: false });
        }).catch(() => {
          video.muted = true;
          setPauses((etat) => ({ ...etat, [id]: true }));
          if (sonActif) setSonActif(false);
        });
      } else video.pause();
    });
  }, [actifId, sonActif, commentairesOuverts, publications]);

  useEffect(() => {
    const visibilite = () => {
      if (document.visibilityState === "hidden") {
        cartesRef.current.forEach((carte) => carte.querySelector("video")?.pause());
      } else if (actifId && !commentairesOuverts) {
        const video = cartesRef.current.get(actifId)?.querySelector("video");
        if (video) void video.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", visibilite);
    return () => document.removeEventListener("visibilitychange", visibilite);
  }, [actifId, commentairesOuverts]);

  function afficherMessage(message: string) {
    setMessageInfo(message);
    window.setTimeout(() => setMessageInfo((actuel) => actuel === message ? null : actuel), 3200);
  }

  function referenceCarte(id: string, node: HTMLElement | null) {
    if (node) cartesRef.current.set(id, node);
    else cartesRef.current.delete(id);
  }

  function estAime(pub: Reel) { return Boolean(pub.likes?.length); }

  function basculerLecture(id: string) {
    const video = cartesRef.current.get(id)?.querySelector("video");
    if (!video) return;
    if (video.paused) {
      video.muted = !sonActif;
      void video.play().then(() => setPauses((etat) => ({ ...etat, [id]: false })))
        .catch(() => setPauses((etat) => ({ ...etat, [id]: true })));
    } else {
      video.pause();
      setPauses((etat) => ({ ...etat, [id]: true }));
    }
  }

  async function aimer(pub: Reel) {
    if (!utilisateur) { afficherMessage("Connectez-vous pour aimer ce Reel."); return; }
    if (likesEnCours.includes(pub.id)) return;
    const etaitAime = estAime(pub);
    setLikesEnCours((ids) => [...ids, pub.id]);
    setPublications((liste) => liste.map((item) => item.id !== pub.id ? item : {
      ...item,
      likes: etaitAime ? [] : [{ id: "optimiste" }],
      _count: { likes: Math.max(0, (item._count?.likes ?? 0) + (etaitAime ? -1 : 1)), commentaires: item._count?.commentaires ?? 0, partages: item._count?.partages ?? 0 },
    }));
    try {
      const reponse = await fetch("/api/reels/" + encodeURIComponent(pub.id) + "/like", { method: "POST" });
      const donnees = await reponse.json();
      if (!reponse.ok || !donnees.ok) throw new Error("Like impossible");
      setPublications((liste) => liste.map((item) => {
        if (item.id !== pub.id) return item;
        const dejaAime = Boolean(item.likes?.length);
        if (dejaAime === Boolean(donnees.liked)) return item;
        return {
          ...item,
          likes: donnees.liked ? [{ id: "confirme" }] : [],
          _count: { likes: Math.max(0, (item._count?.likes ?? 0) + (donnees.liked ? 1 : -1)), commentaires: item._count?.commentaires ?? 0, partages: item._count?.partages ?? 0 },
        };
      }));
    } catch {
      setPublications((liste) => liste.map((item) => item.id !== pub.id ? item : {
        ...item,
        likes: etaitAime ? [{ id: "retabli" }] : [],
        _count: { likes: Math.max(0, (item._count?.likes ?? 0) + (etaitAime ? 1 : -1)), commentaires: item._count?.commentaires ?? 0, partages: item._count?.partages ?? 0 },
      }));
      afficherMessage("Impossible d'enregistrer le like. Réessayez.");
    } finally {
      setLikesEnCours((ids) => ids.filter((id) => id !== pub.id));
    }
  }

  async function ouvrirCommentaires(pub: Reel) {
    setCommentairesOuverts(true);
    setReelCommentaires(pub);
    setCommentaire("");
    setErreurCommentaire(null);
    setCommentairesChargement(true);
    try {
      const reponse = await fetch("/api/reels/" + encodeURIComponent(pub.id), { cache: "no-store" });
      const donnees = await reponse.json();
      if (!reponse.ok || !donnees.publication) throw new Error("Commentaires indisponibles");
      setReelCommentaires(donnees.publication);
    } catch {
      setErreurCommentaire("Les commentaires n'ont pas pu être chargés. Vérifiez votre connexion.");
    } finally {
      setCommentairesChargement(false);
    }
  }

  function fermerCommentaires() {
    setCommentairesOuverts(false);
    setReelCommentaires(null);
    setErreurCommentaire(null);
  }

  async function ajouterCommentaire() {
    if (!reelCommentaires || !commentaire.trim() || envoiCommentaire) return;
    if (!utilisateur) { afficherMessage("Connectez-vous pour commenter."); return; }
    setEnvoiCommentaire(true);
    setErreurCommentaire(null);
    try {
      const reponse = await fetch("/api/reels/" + encodeURIComponent(reelCommentaires.id) + "/commentaire", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentaire.trim() }),
      });
      const donnees = await reponse.json();
      if (!reponse.ok || !donnees.ok) throw new Error(donnees.error || "Envoi impossible");
      const nouveau = donnees.commentaire as ReelCommentaire;
      setReelCommentaires((pub) => pub ? {
        ...pub, commentaires: [nouveau, ...(pub.commentaires ?? [])],
        _count: { likes: pub._count?.likes ?? 0, commentaires: (pub._count?.commentaires ?? 0) + 1, partages: pub._count?.partages ?? 0 },
      } : pub);
      setPublications((liste) => liste.map((pub) => pub.id !== reelCommentaires.id ? pub : {
        ...pub, _count: { likes: pub._count?.likes ?? 0, commentaires: (pub._count?.commentaires ?? 0) + 1, partages: pub._count?.partages ?? 0 },
      }));
      setCommentaire("");
    } catch (erreur) {
      setErreurCommentaire(erreur instanceof Error ? erreur.message : "Le commentaire n'a pas pu être envoyé.");
    } finally { setEnvoiCommentaire(false); }
  }

  async function partager(pub: Reel) {
    const url = window.location.origin + "/reels?reel=" + encodeURIComponent(pub.id);
    let canal = "whatsapp";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Découvre ce Reel sur NILE", text: pub.texte || "Une vidéo à découvrir sur NILE", url });
        canal = "native";
      } catch (erreur) {
        if (erreur instanceof Error && erreur.name === "AbortError") return;
        window.open("https://wa.me/?text=" + encodeURIComponent("Regarde ce Reel sur NILE : " + url), "_blank", "noopener,noreferrer");
      }
    } else window.open("https://wa.me/?text=" + encodeURIComponent("Regarde ce Reel sur NILE : " + url), "_blank", "noopener,noreferrer");

    void fetch("/api/reels/" + encodeURIComponent(pub.id) + "/partager", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ canal }),
    }).then((reponse) => {
      if (!reponse.ok) return;
      setPublications((liste) => liste.map((item) => item.id !== pub.id ? item : {
        ...item, _count: { likes: item._count?.likes ?? 0, commentaires: item._count?.commentaires ?? 0, partages: (item._count?.partages ?? 0) + 1 },
      }));
    }).catch(() => undefined);
  }

  if (loading) return (
    <section data-reels-page className="fixed inset-0 z-[60] grid place-items-center bg-[#07090d] px-6 text-white">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-blue-950"><Icon name="play" size={27} /></span>
        <p className="mt-4 text-lg font-extrabold">NILE Réels</p>
        <p className="mt-1 text-sm text-white/60">Chargement des vidéos…</p>
        <span className="mx-auto mt-5 block h-1 w-32 overflow-hidden rounded-full bg-white/15"><span className="block h-full w-2/3 animate-pulse rounded-full bg-amber-400" /></span>
      </div>
    </section>
  );

  if (erreurChargement) return (
    <section data-reels-page className="fixed inset-0 z-[60] grid place-items-center bg-[#07090d] px-6 text-white">
      <div className="max-w-sm text-center">
        <Icon name="video" size={38} />
        <h1 className="mt-4 text-xl font-extrabold">Impossible de charger les Réels</h1>
        <p className="mt-2 text-sm leading-6 text-white/65">La connexion semble interrompue. Réessayez quand le réseau sera disponible.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-xl bg-amber-400 px-5 font-bold text-blue-950">Réessayer</button>
      </div>
    </section>
  );

  if (!publications.length) return (
    <section data-reels-page className="fixed inset-0 z-[60] grid place-items-center bg-[#07090d] px-6 text-white">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10"><Icon name="video" size={32} /></span>
        <p className="mt-5 text-2xl font-extrabold">Le prochain Reel peut être le tien.</p>
        <p className="mt-2 text-sm leading-6 text-white/65">Découvre les produits des boutiques NILE en vidéo. De nouvelles publications arrivent bientôt.</p>
        <Link href="/catalogue" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-5 font-extrabold text-blue-950">Explorer les produits</Link>
        {utilisateur?.nom && <p className="mt-4 text-xs text-white/45">Connecté en tant que {utilisateur.nom}</p>}
      </div>
      <Link href="/catalogue" aria-label="Quitter les Réels" className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/10"><Icon name="back" /></Link>
    </section>
  );

  return (
    <section data-reels-page aria-label="Fil de vidéos NILE Réels" className="fixed inset-0 z-[60] bg-black text-white">
      <div ref={fluxRef} className="no-scrollbar h-[100dvh] w-full snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-y-contain bg-black">
        {publications.map((pub, index) => {
          const media = pub.medias?.[0];
          const estVideo = media?.type === "VIDEO";
          const aime = estAime(pub);
          const enPause = pauses[pub.id] ?? false;
          const nomBoutique = pub.vendeur?.nomBoutique || "Boutique NILE";
          return (
            <article key={pub.id} ref={(node) => referenceCarte(pub.id, node)} data-reel-id={pub.id} className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-[#090a0c]">
              <div className="relative mx-auto h-full w-full max-w-[520px] overflow-hidden bg-[#111317]">
                {media ? (estVideo ? (
                  <video key={pub.id + ":" + media.id} src={actifId === pub.id ? media.url : undefined}
                    poster={media.posterUrl || undefined} preload={actifId === pub.id ? "metadata" : "none"}
                    playsInline loop muted={!sonActif} aria-label={pub.texte || "Vidéo de la boutique " + nomBoutique}
                    onClick={() => basculerLecture(pub.id)}
                    onPlay={() => setPauses((etat) => ({ ...etat, [pub.id]: false }))}
                    onPause={() => setPauses((etat) => ({ ...etat, [pub.id]: true }))}
                    className="absolute inset-0 h-full w-full cursor-pointer object-cover" />
                ) : (
                  <img src={media.url} alt={pub.texte || "Publication de la boutique " + nomBoutique}
                    loading={index === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
                )) : <div className="absolute inset-0 grid place-items-center text-white/40"><Icon name="image" size={48} /></div>}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/30 to-transparent" />

                <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
                  <Link href="/catalogue" aria-label="Retour au catalogue" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-md transition hover:bg-black/45"><Icon name="back" /></Link>
                  <div className="min-w-0 flex-1">
                    <p className="font-titre text-lg font-extrabold tracking-tight">NILE <span className="text-amber-300">Réels</span></p>
                    <p className="text-[11px] font-medium text-white/65">Découvre. Choisis. Commande.</p>
                  </div>
                  <button type="button" onClick={() => setSonActif((actif) => !actif)} aria-label={sonActif ? "Désactiver le son" : "Activer le son"} aria-pressed={sonActif} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-md transition hover:bg-black/45"><Icon name={sonActif ? "volume" : "mute"} /></button>
                </header>

                {estVideo && enPause && actifId === pub.id && <button type="button" aria-label="Reprendre la vidéo" onClick={() => basculerLecture(pub.id)} className="absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white shadow-xl backdrop-blur-sm"><Icon name="play" size={30} /></button>}

                <aside aria-label="Actions du Reel" className="absolute bottom-[calc(11.5rem+env(safe-area-inset-bottom))] right-3 z-20 flex flex-col items-center gap-4 sm:bottom-36">
                  <div className="flex flex-col items-center gap-1.5">
                    {utilisateur ? <button type="button" onClick={() => void aimer(pub)} disabled={likesEnCours.includes(pub.id)} aria-label={aime ? "Ne plus aimer" : "Aimer"} aria-pressed={aime} className={"grid h-12 w-12 place-items-center rounded-full bg-black/30 backdrop-blur-md transition active:scale-90 disabled:opacity-60 " + (aime ? "text-rose-400" : "text-white")}><Icon name="heart" size={27} filled={aime} /></button> : <Link href="/connexion?suite=%2Freels" aria-label="Connectez-vous pour aimer" className="grid h-12 w-12 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md"><Icon name="heart" size={27} /></Link>}
                    <span className="text-xs font-bold tabular-nums drop-shadow">{pub._count?.likes ?? 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => void ouvrirCommentaires(pub)} aria-label="Voir les commentaires" className="grid h-12 w-12 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition active:scale-90"><Icon name="comment" size={26} /></button>
                    <span className="text-xs font-bold tabular-nums drop-shadow">{pub._count?.commentaires ?? 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => void partager(pub)} aria-label="Partager ce Reel" className="grid h-12 w-12 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition active:scale-90"><Icon name="share" size={25} /></button>
                    <span className="text-xs font-bold tabular-nums drop-shadow">{pub._count?.partages ?? 0}</span>
                  </div>
                </aside>

                <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pr-[5.5rem] sm:pb-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-gradient-to-br from-blue-700 to-indigo-950 text-sm font-extrabold uppercase shadow-lg">{nomBoutique.slice(0, 1)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold drop-shadow">{nomBoutique}</p>
                      <p className="text-[11px] text-white/65">{new Date(pub.dateCreation).toLocaleDateString("fr-CM", { day: "numeric", month: "short" })}</p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/90">NILE</span>
                  </div>
                  {pub.texte && <p className="mb-3 max-w-full whitespace-pre-wrap break-words text-sm leading-5 text-white drop-shadow sm:text-[15px]">{pub.texte}</p>}
                  {pub.produits?.length > 0 && <div className="space-y-2">
                    {pub.produits.slice(0, 2).map(({ produit }) => (
                      <Link key={produit.id} href={"/produit/" + produit.slug} className="flex min-h-[54px] w-full min-w-0 items-center gap-3 rounded-xl border border-white/15 bg-black/35 px-3 py-2 backdrop-blur-lg transition hover:bg-black/55 active:scale-[.99]">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400 text-blue-950"><Icon name="bag" size={19} /></span>
                        <span className="min-w-0 flex-1"><span className="block ligne-1 text-xs font-bold text-white">{produit.titre}</span><span className="mt-0.5 block text-xs font-extrabold text-amber-300">{formaterXAF(produit.prix)}</span></span>
                        <span className="shrink-0 text-xs font-extrabold text-white">Voir <span aria-hidden="true">↗</span></span>
                      </Link>
                    ))}
                    {pub.produits.length > 2 && <p className="text-[11px] font-semibold text-white/75">+ {pub.produits.length - 2} autres produits associés</p>}
                  </div>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div aria-live="polite" className="pointer-events-none absolute left-1/2 top-[calc(5rem+env(safe-area-inset-top))] z-30 w-max max-w-[calc(100%-2rem)] -translate-x-1/2">
        {messageInfo && <div className="rounded-full border border-white/15 bg-[#17191f]/95 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-2xl backdrop-blur">{messageInfo} {!utilisateur && <Link className="pointer-events-auto ml-1 text-amber-300 underline underline-offset-2" href="/connexion?suite=%2Freels">Connexion</Link>}</div>}
      </div>

      {commentairesOuverts && <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 sm:items-center sm:p-6" onClick={fermerCommentaires}>
        <section role="dialog" aria-modal="true" aria-labelledby="titre-commentaires" className="flex max-h-[min(82dvh,680px)] w-full max-w-[520px] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#fbfbfc] text-slate-900 shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 pb-4 pt-3">
            <div className="min-w-0 flex-1"><span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-slate-300 sm:hidden" /><h2 id="titre-commentaires" className="font-titre text-lg font-extrabold">Commentaires</h2><p className="text-xs text-slate-500">{reelCommentaires?._count?.commentaires ?? reelCommentaires?.commentaires?.length ?? 0} échanges sur ce Reel</p></div>
            <button type="button" onClick={fermerCommentaires} aria-label="Fermer les commentaires" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"><Icon name="close" size={20} /></button>
          </div>
          <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {commentairesChargement && <p className="py-8 text-center text-sm text-slate-500">Chargement des commentaires…</p>}
            {!commentairesChargement && !erreurCommentaire && !reelCommentaires?.commentaires?.length && <div className="py-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-800"><Icon name="comment" size={23} /></span><p className="mt-3 font-bold">Lance la conversation</p><p className="mt-1 text-sm text-slate-500">Pose une question sur le produit ou partage ton avis.</p></div>}
            {reelCommentaires?.commentaires?.map((item) => <div key={item.id} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-900">{item.utilisateur?.nom?.trim().slice(0, 1).toUpperCase() || "N"}</span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5"><p className="text-xs font-extrabold text-slate-800">{item.utilisateur?.nom || "Acheteur NILE"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">{item.contenu}</p></div>
            </div>)}
            {erreurCommentaire && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{erreurCommentaire}</p>}
          </div>
          <div className="border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {utilisateur ? <form onSubmit={(event) => { event.preventDefault(); void ajouterCommentaire(); }} className="flex items-end gap-2">
              <input type="text" maxLength={500} value={commentaire} onChange={(event) => setCommentaire(event.target.value)} placeholder="Écris un commentaire…" aria-label="Ton commentaire" className="min-h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-700/10" />
              <button type="submit" disabled={envoiCommentaire || !commentaire.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-900 text-white transition hover:bg-blue-800 disabled:opacity-40" aria-label="Envoyer le commentaire">{envoiCommentaire ? <span className="text-xs">…</span> : <Icon name="send" size={20} />}</button>
            </form> : <Link href="/connexion?suite=%2Freels" className="flex min-h-11 items-center justify-center rounded-full bg-blue-900 px-4 text-sm font-extrabold text-white">Connecte-toi pour commenter</Link>}
            <p className="mt-2 text-center text-[10px] text-slate-400">Sois respectueux : les commentaires doivent rester utiles à la communauté.</p>
          </div>
        </section>
      </div>}
    </section>
  );
}

function Icon({ name, size = 22, filled = false }: { name: "play" | "video" | "back" | "volume" | "mute" | "heart" | "comment" | "share" | "bag" | "image" | "close" | "send"; size?: number; filled?: boolean }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "play": return <svg {...props} fill="currentColor" stroke="none"><path d="M8 5.5v13l10-6.5z" /></svg>;
    case "video": return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></svg>;
    case "back": return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
    case "volume": return <svg {...props}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
    case "mute": return <svg {...props}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m16 9 5 6m0-6-5 6" /></svg>;
    case "heart": return <svg {...props} fill={filled ? "currentColor" : "none"}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
    case "comment": return <svg {...props}><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.6 8.6 0 0 1-4-.95L3 21l1.7-4.7A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="3" /></svg>;
    case "share": return <svg {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.6 6.6-4m-6.6 6.8 6.6 4" /></svg>;
    case "bag": return <svg {...props}><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
    case "image": return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>;
    case "close": return <svg {...props}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "send": return <svg {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
  }
}
