import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduitPublicParSlug } from "@/modules/catalogue/produits";
import { formaterXAF } from "@/lib/money";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { listerAvisProduit, peutLaisserAvis } from "@/modules/avis/avis";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { creerAvisAction } from "@/app/(public)/produit/[slug]/actions";
import { Vignette } from "@/components/ui/Vignette";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { Carte, Etoiles, Prix, Badge, btn, champClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** SEO + aperçus de partage (WhatsApp, Facebook…) : titre, description, photo. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produit = await getProduitPublicParSlug(slug);
  if (!produit) return { title: "Produit introuvable" };

  const description = `${formaterXAF(produit.prix)} — ${produit.description.slice(0, 140)}`;
  return {
    title: produit.titre,
    description,
    alternates: { canonical: `/produit/${produit.slug}` },
    openGraph: {
      title: produit.titre,
      description,
      type: "website",
      images: produit.images[0] ? [{ url: produit.images[0].url }] : undefined,
    },
  };
}

function PuceCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="shrink-0 text-emerald-600"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function FicheProduitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { slug } = await params;
  const { erreur, ok } = await searchParams;
  const produit = await getProduitPublicParSlug(slug);
  if (!produit) notFound();

  const utilisateur = await getUtilisateurCourant();
  const [avis, peutNoter, quantites] = await Promise.all([
    listerAvisProduit(produit.id),
    utilisateur ? peutLaisserAvis(utilisateur.id, produit.id) : Promise.resolve(false),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);
  const enRupture = produit.stock === 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/catalogue" className="hover:text-nile">Catalogue</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{produit.categorie.nom}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Galerie */}
        <div className="space-y-2">
          <Vignette
            url={produit.images[0]?.url}
            alt={produit.titre}
            priority
            sizes="(max-width: 768px) 100vw, 480px"
            className="aspect-square w-full rounded-xl2 border border-gray-100"
          />
          {produit.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {produit.images.map((img) => (
                <Vignette
                  key={img.id}
                  url={img.url}
                  alt=""
                  sizes="72px"
                  className="h-16 w-16 shrink-0 rounded-lg border border-gray-100"
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos + achat */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-snug">{produit.titre}</h1>
            {produit.nbAvis > 0 ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Etoiles note={produit.noteMoyenne} />
                {produit.noteMoyenne.toFixed(1)} · {produit.nbAvis} avis
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Pas encore d'avis</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Vendu par{" "}
              <Link href={`/boutique/${produit.vendeur.id}`} className="font-medium text-nile hover:underline">
                {produit.vendeur.nomBoutique}
              </Link>
            </p>
          </div>

          <div className="border-y border-gray-100 py-3">
            <Prix montant={produit.prix} className="block text-3xl font-extrabold text-promo" />
            <p className="mt-1 text-xs text-gray-500">Prix TTC · FCFA (XAF), sans frais cachés</p>
          </div>

          {erreur && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
          )}
          {ok === "avis" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Merci, votre avis a été publié.
            </p>
          )}

          {/* Encadré d'achat (type marketplace) */}
          <Carte className="space-y-3 p-4">
            <p className="text-2xl font-extrabold text-promo">
              <Prix montant={produit.prix} />
            </p>

            {enRupture ? (
              <Badge ton="rouge">Indisponible (rupture)</Badge>
            ) : (
              <p className="text-sm font-semibold text-emerald-700">
                En stock ({produit.stock} disponible{produit.stock > 1 ? "s" : ""})
              </p>
            )}

            <BoutonPanier
              produitId={produit.id}
              stock={produit.stock}
              quantiteInitiale={quantites[produit.id] ?? 0}
              taille="lg"
            />
            <Link href="/panier" className={btn("secondaire", "md", "w-full")}>
              Voir mon panier
            </Link>

            <ul className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <PuceCheck /> Paiement à la livraison possible
              </li>
              <li className="flex items-center gap-2">
                <PuceCheck /> Mobile Money (MTN MoMo, Orange Money)
              </li>
              <li className="flex items-center gap-2">
                <PuceCheck /> Livraison partout au Cameroun
              </li>
            </ul>
            <p className="text-xs text-gray-400">Compte requis uniquement pour valider la commande.</p>
          </Carte>
        </div>
      </div>

      {/* Description */}
      <Carte className="p-5">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{produit.description}</p>
      </Carte>

      {/* Avis */}
      <Carte className="space-y-4 p-5">
        <h2 className="font-semibold">Avis ({produit.nbAvis})</h2>

        {peutNoter && (
          <form action={creerAvisAction} className="space-y-2 rounded-lg border border-gray-200 p-3">
            <input type="hidden" name="produitId" value={produit.id} />
            <input type="hidden" name="slug" value={produit.slug} />
            <div>
              <label htmlFor="note" className="block text-xs text-gray-500">Votre note</label>
              <select id="note" name="note" defaultValue="5" className={`${champClass} mt-1 w-28`}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </div>
            <textarea name="commentaire" rows={2} placeholder="Votre commentaire (facultatif)" className={champClass} />
            <button type="submit" className={btn("primaire", "sm")}>Publier mon avis</button>
          </form>
        )}

        {avis.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {avis.map((a) => (
              <li key={a.id} className="py-3 first:pt-0">
                <Etoiles note={a.note} />
                {a.commentaire && <p className="mt-1 text-sm text-gray-700">{a.commentaire}</p>}
                <p className="mt-0.5 text-xs text-gray-400">
                  {a.acheteur.nom} · {new Date(a.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
