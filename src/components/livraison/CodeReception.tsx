"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Code de réception présenté par l'ACHETEUR au livreur, sur le pas de sa
 * porte. QR à scanner, et les mêmes 6 chiffres en clair pour les dicter
 * quand le livreur n'a pas de caméra.
 *
 * Le code change toutes les 30 secondes : une capture d'écran transmise au
 * vendeur serait périmée avant d'être utilisable. C'est ce renouvellement
 * qui donne sa valeur à la preuve.
 *
 * Le QR arrive déjà encodé depuis le serveur (~1,5 Ko de SVG) : aucune
 * bibliothèque n'est chargée dans le navigateur.
 */
interface EtatCode {
  code: string;
  svg: string;
  secondesRestantes: number;
}

export function CodeReception({ commandeId }: { commandeId: string }) {
  const [etat, setEtat] = useState<EtatCode | null>(null);
  const [erreur, setErreur] = useState(false);
  const [restant, setRestant] = useState(0);

  const charger = useCallback(async () => {
    try {
      const reponse = await fetch(`/api/commandes/${commandeId}/code-reception`, {
        cache: "no-store",
      });
      if (!reponse.ok) {
        setErreur(true);
        return;
      }
      const data = (await reponse.json()) as EtatCode & { ok: boolean };
      setEtat({ code: data.code, svg: data.svg, secondesRestantes: data.secondesRestantes });
      setRestant(data.secondesRestantes);
      setErreur(false);
    } catch {
      setErreur(true);
    }
  }, [commandeId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Décompte local, puis rechargement quand le code expire : on n'interroge
  // le serveur qu'une fois par période, pas toutes les secondes.
  useEffect(() => {
    const minuteur = setInterval(() => {
      setRestant((r) => {
        if (r <= 1) {
          void charger();
          return 30;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(minuteur);
  }, [charger]);

  if (erreur) {
    return (
      <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-corps-sm text-amber-800">
        Impossible d&apos;afficher votre code pour l&apos;instant. Rechargez la
        page, ou demandez au livreur de contacter NILE.
      </p>
    );
  }

  if (!etat) {
    return (
      <p className="text-corps-sm text-slate-500">Préparation de votre code…</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {etat.svg ? (
        <div
          className="w-44 max-w-full [&>svg]:h-auto [&>svg]:w-full"
          // Le SVG vient de notre propre serveur (bibliothèque qrcode), il ne
          // contient aucune donnée saisie par un tiers.
          dangerouslySetInnerHTML={{ __html: etat.svg }}
          aria-label="QR code de réception à faire scanner par le livreur"
          role="img"
        />
      ) : null}

      <div>
        <p className="text-etiquette-xs uppercase tracking-wider text-slate-500">
          Code à dicter au livreur
        </p>
        <p className="font-mono text-3xl font-bold tracking-[0.3em] text-nile-800">
          {etat.code}
        </p>
      </div>

      <p className="text-etiquette-xs text-slate-500">
        Nouveau code dans {restant} s
      </p>

      {/* Donner le code n'est pas un geste anodin : il clôt la commande et,
          en COD, vaut reconnaissance de paiement. L'acheteur doit le savoir
          AVANT, pas en découvrant le statut ensuite. */}
      <p className="flex gap-2 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-left text-corps-sm text-amber-900">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="mt-0.5 shrink-0" aria-hidden="true">
          <path d="M12 9v4M12 17v.01" strokeLinecap="round" />
          <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>Vérifiez le colis avant de donner ce code.</strong> Une fois
          communiqué, la commande est close et considérée comme reçue — et
          payée si vous réglez à la livraison. Ne le donnez qu&apos;au livreur,
          en main propre.
        </span>
      </p>
    </div>
  );
}
