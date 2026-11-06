import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides d’achat et conseils — NILE Cameroun",
  description: "Conseils pratiques pour acheter en ligne au Cameroun : choisir un produit, vérifier une boutique, comprendre les paiements et préparer une livraison.",
  alternates: { canonical: "/guides" },
  openGraph: { title: "Guides d’achat — NILE", description: "Conseils pratiques pour acheter en ligne au Cameroun.", url: "/guides", type: "website", locale: "fr_CM" },
};

const guides = [
  { titre: "Bien choisir un produit avant de commander", texte: "Comparez les caractéristiques, les photos, le prix et les informations de disponibilité. Pour un appareil électronique, vérifiez notamment le modèle exact, l’état du produit, les accessoires inclus et les conditions de garantie annoncées par le vendeur." },
  { titre: "Vérifier une boutique avant l’achat", texte: "Consultez la page de la boutique, sa localisation publique, ses informations de contact lorsqu’elles sont affichées et les avis disponibles. En cas de doute sur une caractéristique ou une disponibilité, demandez une confirmation avant de valider votre commande." },
  { titre: "Préparer une livraison au Cameroun", texte: "Indiquez un numéro de téléphone joignable et un lieu de livraison facile à reconnaître. Ajoutez un repère connu, un quartier, un carrefour ou un établissement voisin afin d’aider le livreur à vous retrouver." },
  { titre: "Comprendre les moyens de paiement", texte: "Les moyens proposés peuvent varier selon le parcours de commande et la configuration de NILE. Vérifiez toujours le récapitulatif de commande et les instructions affichées avant de confirmer un paiement. Ne communiquez jamais votre code secret Mobile Money à un tiers." },
];

export default function GuidesPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Guides d’achat NILE", description: "Conseils pour acheter en ligne au Cameroun.", url: "/guides" };
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 pt-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Conseils pratiques</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B192C] sm:text-4xl">Guides pour acheter en ligne au Cameroun</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Des repères simples pour comparer les offres, choisir une boutique et préparer votre commande sur NILE.</p></header>
      <div className="space-y-4">{guides.map((g, i) => <article key={g.titre} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Guide {i + 1}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{g.titre}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{g.texte}</p></article>)}</div>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/catalogue" className="rounded-full bg-nile-700 px-5 py-3 text-sm font-semibold text-white hover:bg-nile-800">Explorer le catalogue</Link><Link href="/boutiques" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-nile-700 hover:bg-nile-50">Voir les boutiques</Link></div>
    </div>
  );
}
