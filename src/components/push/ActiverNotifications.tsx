"use client";

import { useEffect, useState } from "react";
import {
  enregistrerPushAction,
  supprimerPushAction,
} from "@/app/(compte)/notifications/actions";

type Etat =
  | "chargement"
  | "non-supporte"
  | "refuse"
  | "inactif"
  | "actif"
  | "erreur";

/** Convertit la clé publique VAPID (base64 URL) au format attendu par l'API. */
function cleEnUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(b64);
  const sortie = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

/**
 * Bouton d'activation des notifications push. Nécessite la clé publique VAPID.
 *
 * Sert aux deux publics : vendeurs/admins (nouvelles commandes à préparer) et
 * acheteurs (avancement de leur commande) — d'où les libellés paramétrables,
 * la promesse n'étant pas la même de chaque côté.
 */
export function ActiverNotifications({
  clePublique,
  libelle = "Être prévenu des nouvelles commandes",
  promesse = "des nouvelles commandes",
}: {
  clePublique: string;
  /** Texte du bouton d'activation. */
  libelle?: string;
  /** Complément décrivant ce dont on prévient, si l'autorisation est bloquée. */
  promesse?: string;
}) {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [enCours, setEnCours] = useState(false);
  const [plateforme, setPlateforme] = useState<"android" | "ios" | "autre">("autre");

  useEffect(() => {
    (async () => {
      const agent = navigator.userAgent;
      setPlateforme(/iPhone|iPad|iPod/i.test(agent) ? "ios" : /Android/i.test(agent) ? "android" : "autre");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEtat("non-supporte");
        return;
      }
      if (Notification.permission === "denied") {
        setEtat("refuse");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const abonnement = await reg?.pushManager.getSubscription();
        setEtat(abonnement ? "actif" : "inactif");
      } catch {
        setEtat("inactif");
      }
    })();
  }, []);

  async function activer() {
    setEnCours(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat("refuse");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const abonnement = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: cleEnUint8Array(clePublique) as BufferSource,
      });
      const res = await enregistrerPushAction(JSON.stringify(abonnement));
      setEtat(res.ok ? "actif" : "erreur");
    } catch (e) {
      console.error("Activation push échouée:", e);
      setEtat("erreur");
    } finally {
      setEnCours(false);
    }
  }

  async function desactiver() {
    setEnCours(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const abonnement = await reg?.pushManager.getSubscription();
      if (abonnement) {
        await supprimerPushAction(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat("inactif");
    } catch {
      setEtat("erreur");
    } finally {
      setEnCours(false);
    }
  }

  if (etat === "chargement") return null;
  if (etat === "non-supporte") {
    return (
      <div className="space-y-2 text-xs text-slate-500">
        <p>Les notifications ne sont pas disponibles dans ce navigateur ou dans son mode actuel.</p>
        {plateforme === "ios" ? (
          <p>Sur iPhone/iPad : ouvre NILE depuis son icône sur l’écran d’accueil. Si nécessaire, ajoute d’abord le site à l’écran d’accueil depuis Safari.</p>
        ) : plateforme === "android" ? (
          <p>Sur Android : utilise Chrome ou un navigateur compatible, puis vérifie que les notifications du site sont autorisées dans les paramètres du navigateur.</p>
        ) : (
          <p>Essaie avec un navigateur récent prenant en charge les notifications Web Push.</p>
        )}
      </div>
    );
  }
  if (etat === "refuse") {
    return (
      <div className="space-y-2 text-xs text-slate-600">
        <p>Les notifications sont bloquées par les réglages de cet appareil. Pour recevoir {promesse}, réactive l’autorisation :</p>
        {plateforme === "android" ? (
          <p className="rounded bg-slate-50 p-3">Android · Chrome : menu ⋮ → Paramètres → Paramètres des sites → Notifications → NILE → Autoriser. Vérifie aussi que Chrome peut envoyer des notifications dans les réglages Android.</p>
        ) : plateforme === "ios" ? (
          <p className="rounded bg-slate-50 p-3">iPhone/iPad : ouvre NILE depuis l’écran d’accueil, puis vérifie Réglages → Notifications → NILE. Si NILE n’apparaît pas, ajoute le site à l’écran d’accueil depuis Safari et réessaie.</p>
        ) : (
          <p className="rounded bg-slate-50 p-3">Ouvre les paramètres du navigateur → Confidentialité et sécurité / Paramètres des sites → Notifications, puis autorise NILE.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {etat === "actif" ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <IconeCloche /> Notifications activées
          </span>
          <button
            type="button"
            onClick={desactiver}
            disabled={enCours}
            className="text-xs text-slate-500 hover:text-slate-800 hover:underline disabled:opacity-50"
          >
            Désactiver sur cet appareil
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={activer}
          disabled={enCours}
          className="inline-flex items-center gap-2 rounded bg-nile px-3 py-2 text-sm font-medium text-white hover:bg-nile-dark disabled:opacity-60"
        >
          <IconeCloche />
          {enCours ? "Activation…" : libelle}
        </button>
      )}
      {etat === "erreur" && (
        <p className="text-xs text-red-600">Activation impossible. Réessaie.</p>
      )}
    </div>
  );
}

function IconeCloche() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
