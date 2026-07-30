"use client";

import { useState } from "react";

/**
 * Icônes de partage d'une fiche produit.
 *
 * WhatsApp et Facebook acceptent un lien pré-rempli en paramètre d'URL : le
 * partage s'y fait en un clic, sans quitter la page.
 *
 * Instagram et TikTok n'offrent PAS d'équivalent public pour partager un lien
 * externe depuis un site web (contrairement à WhatsApp `wa.me` ou au
 * `sharer.php` de Facebook) : leurs SDK de partage ne couvrent que du contenu
 * déjà hébergé chez eux. Un bouton qui prétendrait « partager » directement y
 * échouerait silencieusement. On copie donc le lien dans le presse-papiers et
 * on ouvre le réseau, avec un message explicite : l'utilisateur colle
 * lui-même le lien dans sa story ou son message.
 */
export function BoutonPartage({ titre }: { titre: string }) {
  const [copie, setCopie] = useState<"whatsapp" | "instagram" | "tiktok" | null>(null);

  function urlEtTexte() {
    const url = window.location.href;
    return { url, texte: `${titre} — sur NILE` };
  }

  function partagerWhatsApp() {
    const { url, texte } = urlEtTexte();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${texte} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function partagerFacebook() {
    const { url } = urlEtTexte();
    // Fenêtre de partage officielle de Facebook : accepte un lien en
    // paramètre, sans avoir besoin d'app ID pour ce cas simple.
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=560,height=600",
    );
  }

  /** Copie le lien puis ouvre le réseau : seule voie possible sans SDK natif. */
  async function copierEtOuvrir(reseau: "instagram" | "tiktok", site: string) {
    const { url } = urlEtTexte();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Presse-papiers indisponible (permission refusée, contexte non
      // sécurisé) : on ouvre quand même le réseau, l'utilisateur copiera
      // l'adresse manuellement depuis la barre du navigateur.
    }
    window.open(site, "_blank", "noopener,noreferrer");
    setCopie(reseau);
    setTimeout(() => setCopie(null), 3000);
  }

  return (
    <div className="flex items-center gap-1.5">
      <IconePartage
        libelle="Partager sur WhatsApp"
        onClick={partagerWhatsApp}
        classeIcone="text-[#25D366]"
      >
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.2-.2-.2-.4-.3z" />
      </IconePartage>

      <IconePartage
        libelle="Partager sur Facebook"
        onClick={partagerFacebook}
        classeIcone="text-[#1877F2]"
      >
        <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.3.2 2.3.2v2.53h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12z" />
      </IconePartage>

      <IconePartage
        libelle="Copier le lien pour Instagram"
        titre={copie === "instagram" ? "Lien copié — collez-le sur Instagram" : undefined}
        onClick={() => copierEtOuvrir("instagram", "https://www.instagram.com/")}
        classeIcone="text-[#E1306C]"
        rempli={false}
      >
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </IconePartage>

      <IconePartage
        libelle="Copier le lien pour TikTok"
        titre={copie === "tiktok" ? "Lien copié — collez-le sur TikTok" : undefined}
        onClick={() => copierEtOuvrir("tiktok", "https://www.tiktok.com/")}
        classeIcone="text-slate-900"
      >
        <path d="M16.6 5.82a4.28 4.28 0 0 1-1.03-2.75h-3.05v13.02a2.6 2.6 0 1 1-1.84-2.49v-3.1a5.72 5.72 0 1 0 4.9 5.66V9.35a7.4 7.4 0 0 0 4.32 1.38V7.68a4.27 4.27 0 0 1-3.3-1.86z" />
      </IconePartage>

      {(copie === "instagram" || copie === "tiktok") && (
        <span className="text-[11px] font-medium text-nile-700" role="status">
          Lien copié
        </span>
      )}
    </div>
  );
}

function IconePartage({
  libelle,
  titre,
  onClick,
  classeIcone,
  rempli = true,
  children,
}: {
  libelle: string;
  /** Info-bulle temporaire (confirmation de copie), distincte du libellé accessible. */
  titre?: string;
  onClick: () => void;
  classeIcone: string;
  /** false = tracé en contour (Instagram) plutôt qu'en aplat. */
  rempli?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      title={titre ?? libelle}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-contour-carte transition-colors hover:border-current hover:bg-surface-basse ${classeIcone}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={rempli ? "currentColor" : "none"}
        stroke={rempli ? "none" : "currentColor"}
        strokeWidth={rempli ? undefined : 1.8}
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
