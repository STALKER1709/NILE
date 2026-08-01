"use client";

import { useEffect, useRef, useState } from "react";
import { remettreVendeurAction } from "@/app/(vendeur)/vendeur/commandes/actions";

/**
 * Remise du colis chez le client : remplace l'ancien bouton « marquer
 * livrée », que le vendeur pouvait cliquer depuis n'importe où.
 *
 * Deux voies, la seconde servant de repli à la première :
 *  - scan du QR affiché sur le téléphone de l'acheteur, via l'API native
 *    BarcodeDetector (présente sur Chrome Android, le parc dominant ici) —
 *    aucune bibliothèque à télécharger, la page reste légère ;
 *  - saisie des 6 chiffres dictés par l'acheteur, qui fonctionne partout,
 *    y compris sans caméra ni autorisation accordée.
 */

/** L'API n'est pas encore dans les types standard du DOM. */
interface CodeBarreDetecte {
  rawValue: string;
}
interface DetecteurCodeBarre {
  detect(source: CanvasImageSource): Promise<CodeBarreDetecte[]>;
}
type ConstructeurDetecteur = new (options?: { formats?: string[] }) => DetecteurCodeBarre;

function detecteurDisponible(): ConstructeurDetecteur | null {
  const w = window as unknown as { BarcodeDetector?: ConstructeurDetecteur };
  return w.BarcodeDetector ?? null;
}

export function RemiseParCode({
  commandeId,
  numeroCommande,
}: {
  commandeId: string;
  numeroCommande: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [scanActif, setScanActif] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const champCode = useRef<HTMLInputElement | null>(null);
  const champMode = useRef<HTMLInputElement | null>(null);
  const champNumero = useRef<HTMLInputElement | null>(null);

  // Libère la caméra dès que le composant disparaît : sur mobile, un flux
  // laissé ouvert continue d'allumer l'objectif et vide la batterie.
  useEffect(() => {
    return () => {
      fluxRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function arreterCamera() {
    fluxRef.current?.getTracks().forEach((t) => t.stop());
    fluxRef.current = null;
    setScanActif(false);
  }

  async function lancerScan() {
    setErreur(null);
    const Detecteur = detecteurDisponible();
    if (!Detecteur) {
      setErreur(
        "Ce téléphone ne sait pas scanner : demandez au client de vous dicter les 6 chiffres.",
      );
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      fluxRef.current = flux;
      setScanActif(true);
      if (videoRef.current) {
        videoRef.current.srcObject = flux;
        await videoRef.current.play();
      }
      boucleDetection(new Detecteur({ formats: ["qr_code"] }));
    } catch {
      setErreur(
        "Caméra indisponible. Demandez au client de vous dicter les 6 chiffres.",
      );
      arreterCamera();
    }
  }

  function boucleDetection(detecteur: DetecteurCodeBarre) {
    const tick = async () => {
      const video = videoRef.current;
      if (!video || !fluxRef.current) return;
      try {
        const codes = await detecteur.detect(video);
        const brut = codes[0]?.rawValue;
        if (brut) {
          const analyse = analyser(brut);
          if (!analyse) {
            setErreur("Ce QR n'est pas un code de réception NILE.");
          } else if (analyse.numeroCommande !== numeroCommande) {
            setErreur(
              `Ce QR appartient à la commande ${analyse.numeroCommande}, pas à celle-ci.`,
            );
          } else {
            arreterCamera();
            soumettre(analyse.code, "SCAN", analyse.numeroCommande);
            return;
          }
        }
      } catch {
        // Image illisible sur cette frame : on retente simplement.
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Même format que `contenuQr` côté serveur : NILE:<numéro>:<code>. */
  function analyser(texte: string): { numeroCommande: string; code: string } | null {
    const m = texte.trim().split(":");
    if (m.length !== 3 || m[0] !== "NILE" || !m[1] || !/^\d{6}$/.test(m[2] ?? "")) {
      return null;
    }
    return { numeroCommande: m[1] as string, code: m[2] as string };
  }

  function soumettre(code: string, mode: "SCAN" | "MANUEL", numero?: string) {
    if (champCode.current) champCode.current.value = code;
    if (champMode.current) champMode.current.value = mode;
    if (champNumero.current) champNumero.current.value = numero ?? "";
    formRef.current?.requestSubmit();
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 text-etiquette-md font-bold text-accent-sur transition-colors hover:bg-accent-dark hover:text-white"
      >
        <IconeScan />
        Lancer le scan
      </button>
    );
  }

  return (
    <div className="rounded border border-contour-carte bg-surface-basse p-4">
      <p className="text-etiquette-md text-nile-800">Remise du colis</p>
      <p className="mt-1 text-corps-sm text-slate-600">
        Demandez au client d&apos;ouvrir sa commande sur NILE : un QR et un code
        à 6 chiffres y apparaissent. Le code change toutes les 30 secondes.
      </p>

      {scanActif ? (
        <div className="mt-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className="aspect-square w-full max-w-xs rounded bg-black object-cover"
            playsInline
            muted
          />
          <button
            type="button"
            onClick={arreterCamera}
            className="mt-2 text-corps-sm text-slate-500 hover:underline"
          >
            Arrêter la caméra
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={lancerScan}
          className="mt-3 inline-flex items-center gap-2 rounded bg-nile-700 px-4 py-2.5 text-etiquette-md font-bold text-white transition-colors hover:bg-nile-800"
        >
          <IconeScan />
          Scanner le QR du client
        </button>
      )}

      {erreur && (
        <p className="mt-3 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-corps-sm text-amber-800">
          {erreur}
        </p>
      )}

      <form ref={formRef} action={remettreVendeurAction} className="mt-4 border-t border-contour-carte pt-4">
        <input type="hidden" name="commandeId" value={commandeId} />
        <input ref={champCode} type="hidden" name="code" />
        <input ref={champMode} type="hidden" name="mode" value="MANUEL" />
        <input ref={champNumero} type="hidden" name="numeroAttendu" />
      </form>

      <SaisieManuelle onValider={(code) => soumettre(code, "MANUEL")} />

      <button
        type="button"
        onClick={() => {
          arreterCamera();
          setOuvert(false);
          setErreur(null);
        }}
        className="mt-3 text-corps-sm text-slate-500 hover:underline"
      >
        Annuler
      </button>
    </div>
  );
}

/** Repli universel : le client dicte, le livreur saisit. */
function SaisieManuelle({ onValider }: { onValider: (code: string) => void }) {
  const [code, setCode] = useState("");
  const valide = code.replace(/\D/g, "").length === 6;
  return (
    <div>
      <label htmlFor="code-dicte" className="block text-etiquette-md text-slate-700">
        …ou saisissez le code dicté par le client
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          id="code-dicte"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-36 rounded border border-contour-carte bg-white px-3 py-2.5 text-center font-mono text-lg tracking-widest text-slate-900 focus:border-nile-700 focus:outline-none focus:ring-2 focus:ring-nile-700/10"
        />
        <button
          type="button"
          disabled={!valide}
          onClick={() => onValider(code)}
          className="rounded bg-nile-900 px-4 py-2.5 text-etiquette-md font-bold text-white transition-colors hover:bg-nile-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Valider la remise
        </button>
      </div>
    </div>
  );
}

function IconeScan() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M3 12h18" />
    </svg>
  );
}
