"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formaterXAF } from "@/lib/money";

export function ReelsClient({ utilisateur }: { utilisateur: any }) {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePub, setActivePub] = useState<any>(null);
  const [commentaire, setCommentaire] = useState("");
  const [envoiCommentaire, setEnvoiCommentaire] = useState(false);

  useEffect(() => {
    chargerPublications();
  }, []);

  async function chargerPublications() {
    try {
      const res = await fetch("/api/reels?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPublications(data.publications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(pubId: string) {
    if (!utilisateur) {
      alert("Connectez-vous pour aimer cette publication");
      return;
    }
    try {
      const res = await fetch(`/api/reels/${pubId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Mettre à jour localement
        chargerPublications();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function ajouterCommentaire(pubId: string) {
    if (!utilisateur) {
      alert("Connectez-vous pour commenter");
      return;
    }
    if (!commentaire.trim()) return;
    setEnvoiCommentaire(true);
    try {
      const res = await fetch(`/api/reels/${pubId}/commentaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentaire }),
      });
      if (res.ok) {
        setCommentaire("");
        // Recharger
        if (activePub && activePub.id === pubId) {
          const r = await fetch(`/api/reels/${pubId}`);
          if (r.ok) {
            const d = await r.json();
            setActivePub(d.publication);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnvoiCommentaire(false);
    }
  }

  async function partager(pubId: string, canal: string) {
    try {
      await fetch(`/api/reels/${pubId}/partager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal }),
      });
      if (canal === "whatsapp") {
        const url = `${window.location.origin}/reels`;
        window.open(`https://wa.me/?text=${encodeURIComponent("Regardez ce Reel sur NILE: " + url)}`, "_blank");
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-nile-800">Réels</h1>
          <p className="text-sm text-slate-500">Découvrez les publications des boutiques</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {publications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-500">Aucune publication pour le moment</p>
            <Link href="/catalogue" className="mt-4 inline-block text-nile-700 font-semibold">
              Parcourir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {publications.map((pub) => (
              <article key={pub.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nile-100 flex items-center justify-center text-nile-700 font-bold">
                    {pub.vendeur?.nomBoutique?.[0] || "N"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{pub.vendeur?.nomBoutique}</p>
                    <p className="text-xs text-slate-500">{new Date(pub.dateCreation).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                {/* Media */}
                <div className="relative aspect-[9/16] max-h-[600px] bg-slate-900">
                  {pub.medias?.[0]?.type === "VIDEO" ? (
                    <video
                      src={pub.medias[0].url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={pub.medias?.[0]?.url}
                      alt={pub.texte || ""}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(pub.id)}
                      className="flex items-center gap-2 text-slate-700 hover:text-red-500 transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>{pub._count?.likes || 0}</span>
                    </button>
                    <button
                      onClick={() => setActivePub(pub)}
                      className="flex items-center gap-2 text-slate-700 hover:text-nile-700 transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>{pub._count?.commentaires || 0}</span>
                    </button>
                    <button
                      onClick={() => partager(pub.id, "whatsapp")}
                      className="flex items-center gap-2 text-slate-700 hover:text-green-600 transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span>{pub._count?.partages || 0}</span>
                    </button>
                  </div>

                  {pub.texte && <p className="text-slate-700">{pub.texte}</p>}

                  {pub.produits && pub.produits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pub.produits.map((p: any) => (
                        <Link
                          key={p.produit.id}
                          href={`/produit/${p.produit.slug}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-nile-50 rounded-lg text-sm hover:bg-nile-100 transition-colors"
                        >
                          <span className="text-slate-700">{p.produit.titre}</span>
                          <span className="font-semibold text-nile-700">{formaterXAF(p.produit.prix)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modal commentaires */}
      {activePub && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setActivePub(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold">Commentaires</h2>
              <button onClick={() => setActivePub(null)} className="text-slate-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activePub.commentaires?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                    {c.utilisateur?.nom?.[0] || "U"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{c.utilisateur?.nom}</p>
                    <p className="text-sm text-slate-700">{c.contenu}</p>
                  </div>
                </div>
              ))}
            </div>
            {utilisateur ? (
              <div className="p-4 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  onKeyPress={(e) => e.key === "Enter" && ajouterCommentaire(activePub.id)}
                />
                <button
                  onClick={() => ajouterCommentaire(activePub.id)}
                  disabled={envoiCommentaire || !commentaire.trim()}
                  className="px-4 py-2 bg-nile-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 text-center text-sm text-slate-500">
                <Link href="/connexion" className="text-nile-700 font-semibold">Connectez-vous</Link> pour commenter
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
