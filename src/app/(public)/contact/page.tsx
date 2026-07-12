import type { Metadata } from "next";
import { env } from "@/lib/env";
import { IconeWhatsApp } from "@/components/layout/BulleWhatsApp";
import { Carte } from "@/components/ui/kit";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter l'équipe NILE Marketplace : WhatsApp, email.",
};

export default function ContactPage() {
  const whatsapp = env.CONTACT_WHATSAPP;
  const email = env.CONTACT_EMAIL;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Nous contacter</h1>
        <p className="mt-1 text-sm text-gray-500">
          Une question sur une commande, une livraison, un produit ? On te répond.
        </p>
      </div>

      {!whatsapp && !email && (
        <Carte className="p-6 text-sm text-gray-600">
          Nos coordonnées de contact seront affichées ici très prochainement.
          En attendant, les vendeurs sont joignables via leur boutique.
        </Carte>
      )}

      {whatsapp && (
        <Carte className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <IconeWhatsApp taille={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">WhatsApp</p>
            <p className="text-sm text-gray-500">
              Réponse rapide aux heures ouvrées · le canal le plus simple.
            </p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour NILE, j'ai une question :")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Écrire
          </a>
        </Carte>
      )}

      {email && (
        <Carte className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nile-50 text-nile">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Email</p>
            <p className="truncate text-sm text-gray-500">{email}</p>
          </div>
          <a
            href={`mailto:${email}`}
            className="shrink-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-nile hover:text-nile"
          >
            Écrire
          </a>
        </Carte>
      )}

      <Carte className="p-5 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">Avant de nous écrire</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Le suivi de ta commande est dans « Mes commandes » (statut en temps réel).</li>
          <li>Indique ton numéro de commande (NILE-…) pour une réponse plus rapide.</li>
          <li>Paiement Mobile Money : joins la référence de la transaction en cas de souci.</li>
        </ul>
      </Carte>
    </div>
  );
}
