import Link from "next/link";

export function IconeWhatsApp({ taille = 22 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.2-.2-.2-.4-.3z" />
    </svg>
  );
}

/**
 * Bulle WhatsApp flottante (standard des e-commerces africains). Affichée
 * seulement si CONTACT_WHATSAPP est configuré. Positionnée au-dessus de la
 * barre de navigation mobile.
 */
export function BulleWhatsApp({ numero }: { numero: string }) {
  return (
    <Link
      href={`https://wa.me/${numero}?text=${encodeURIComponent("Bonjour NILE, j'ai une question :")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed bottom-20 right-3 z-40 grid h-12 w-12 animate-apparition place-items-center rounded-full bg-emerald-500 text-white shadow-flottant transition hover:scale-105 hover:bg-emerald-600 sm:bottom-5 sm:right-5"
    >
      <IconeWhatsApp taille={26} />
    </Link>
  );
}
