import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProduitPublicParSlug,
  getProduitsSimilaires,
} from "@/modules/catalogue/produits";
import { formaterXAF } from "@/lib/money";
import { env } from "@/lib/env";
import { getUtilisateurCourant } from "@/modules/auth/access";
import {
  listerAvisProduit,
  peutLaisserAvis,
  getRepartitionNotes,
} from "@/modules/avis/avis";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { creerAvisAction } from "@/app/(public)/produit/[slug]/actions";
import { GaleriePhotos } from "@/components/produit/GaleriePhotos";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { BarreAchatMobile } from "@/components/produit/BarreAchatMobile";
import { RepartitionAvis, BadgeAchatVerifie } from "@/components/produit/RepartitionAvis";
import { MemoriserVu, VusRecemment } from "@/components/produit/VusRecemment";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { Carte, Etoiles, Prix, Badge, btn, champClass } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

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

  const description = `${formaterXAF(produit.prix)} · ${produit.description.slice(0, 140)}`;
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
  const [avis, peutNoter, quantites, repartition, similaires] = await Promise.all([
    listerAvisProduit(produit.id),
    utilisateur ? peutLaisserAvis(utilisateur.id, produit.id) : Promise.resolve(false),
    getQuantitesAffichees(utilisateur?.id ?? null),
    getRepartitionNotes(produit.id),
    getProduitsSimilaires(produit.categorieId, produit.id, 6),
  ]);
  const enRupture = produit.stock === 0;
  const quantitePanier = quantites[produit.id] ?? 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/catalogue" className="hover:text-nile">Catalogue</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{produit.categorie.nom}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Galerie interactive */}
        <GaleriePhotos
          images={produit.images.map((img) => ({ id: img.id, url: img.url }))}
          titre={produit.titre}
        />

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

          {erreur && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
          )}
          {ok === "avis" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Merci, votre avis a été publié.
            </p>
          )}

          {/* Encadré d'achat (type marketplace) */}
          <Carte id="achat-principal" className="space-y-3 p-4">
            <div>
              <p className="text-3xl font-extrabold text-promo">
                <Prix montant={produit.prix} />
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Prix TTC · FCFA (XAF), sans frais cachés</p>
            </div>

            {enRupture ? (
              <Badge ton="rouge">Indisponible (rupture)</Badge>
            ) : produit.stock <= 5 ? (
              <p className="text-sm font-semibold text-promo">
                Plus que {produit.stock} en stock — commandez vite !
              </p>
            ) : (
              <p className="text-sm font-semibold text-emerald-700">
                En stock ({produit.stock} disponibles)
              </p>
            )}

            <BoutonPanier
              produitId={produit.id}
              stock={produit.stock}
              quantiteInitiale={quantitePanier}
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
                <PuceCheck /> Livraison <strong>gratuite</strong> partout au Cameroun
              </li>
              <li className="flex items-center gap-2">
                <PuceCheck /> Vérifie ton colis à la livraison (ventes fermes, pas de retour)
              </li>
              {env.DELAI_LIVRAISON_TEXTE && (
                <li className="flex items-center gap-2">
                  <PuceCheck /> Délai : {env.DELAI_LIVRAISON_TEXTE}
                </li>
              )}
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
        <h2 className="font-semibold">Avis clients ({produit.nbAvis})</h2>

        <RepartitionAvis
          total={repartition.total}
          moyenne={repartition.moyenne}
          parNote={repartition.parNote}
        />

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
            <BoutonSoumettre enCours="Publication…" className={btn("primaire", "sm")}>Publier mon avis</BoutonSoumettre>
          </form>
        )}

        {avis.length > 0 && (
          <ul className="divide-y divide-gray-100 border-t border-gray-100 pt-1">
            {avis.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Etoiles note={a.note} />
                  <BadgeAchatVerifie />
                </div>
                {a.commentaire && <p className="mt-1 text-sm text-gray-700">{a.commentaire}</p>}
                <p className="mt-0.5 text-xs text-gray-400">
                  {a.acheteur.nom} · {new Date(a.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Carte>

      {/* Produits similaires */}
      {similaires.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {similaires.map((p, i) => (
              <CarteProduit
                key={p.id}
                produit={p}
                quantitePanier={quantites[p.id] ?? 0}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* Vus récemment (client, localStorage) */}
      <VusRecemment slugCourant={produit.slug} />

      {/* Mémorise ce produit dans l'historique + barre d'achat collante mobile */}
      <MemoriserVu
        produit={{
          slug: produit.slug,
          titre: produit.titre,
          prix: produit.prix,
          image: produit.images[0]?.url,
        }}
      />
      {!enRupture && (
        <BarreAchatMobile
          produitId={produit.id}
          stock={produit.stock}
          quantiteInitiale={quantitePanier}
          prix={produit.prix}
        />
      )}
    </div>
  );
}
