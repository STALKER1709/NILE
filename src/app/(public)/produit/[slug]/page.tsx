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
import { getAffichagePrixProduit } from "@/modules/promotion/promotion";
import { creerAvisAction } from "@/app/(public)/produit/[slug]/actions";
import { GaleriePhotos } from "@/components/produit/GaleriePhotos";
import { BoutonPanier } from "@/components/panier/BoutonPanier";
import { BarreAchatMobile } from "@/components/produit/BarreAchatMobile";
import { RepartitionAvis, BadgeAchatVerifie } from "@/components/produit/RepartitionAvis";
import { MemoriserVu, VusRecemment } from "@/components/produit/VusRecemment";
import { BoutonPartage } from "@/components/produit/BoutonPartage";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { Carte, Etoiles, Prix, btn, champClass } from "@/components/ui/kit";
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

/** Séparateur du fil d'Ariane. */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-300" aria-hidden="true">
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Carte de repère produit (catégorie, livraison…). */
function FicheInfo({
  libelle,
  valeur,
  children,
}: {
  libelle: string;
  valeur: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-contour-carte bg-white p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-nile-50 text-nile-700">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {children}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-slate-500">{libelle}</span>
        <span className="block truncate text-sm font-bold text-slate-900">{valeur}</span>
      </span>
    </div>
  );
}

/** Puce d'un moyen de paiement accepté. */
function PuceMoyenPaiement({
  libelle,
  sigle,
  couleur,
}: {
  libelle: string;
  sigle: string;
  couleur: string;
}) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-contour-carte bg-white py-1.5 pl-1.5 pr-3.5">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${couleur}`}>
        {sigle}
      </span>
      <span className="text-xs font-bold text-slate-700">{libelle}</span>
    </span>
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
  const [avis, peutNoter, quantites, repartition, similaires, affichagePrix] = await Promise.all([
    listerAvisProduit(produit.id),
    utilisateur ? peutLaisserAvis(utilisateur.id, produit.id) : Promise.resolve(false),
    getQuantitesAffichees(utilisateur?.id ?? null),
    getRepartitionNotes(produit.id),
    getProduitsSimilaires(produit.categorieId, produit.id, 6),
    getAffichagePrixProduit({ id: produit.id, prix: produit.prix, vendeurId: produit.vendeurId }),
  ]);
  const enRupture = produit.stock === 0;
  const quantitePanier = quantites[produit.id] ?? 0;
  const enPromo = affichagePrix.prixPromo != null;
  const prixEffectif = affichagePrix.prixPromo ?? produit.prix;

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-nile-700">Accueil</Link>
        <Chevron />
        <Link href="/catalogue" className="transition-colors hover:text-nile-700">Catalogue</Link>
        <Chevron />
        <span className="font-semibold text-slate-900">{produit.categorie.nom}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Galerie interactive */}
        <GaleriePhotos
          images={produit.images.map((img) => ({ id: img.id, url: img.url }))}
          titre={produit.titre}
        />

        {/* Infos + achat */}
        <div className="space-y-5">
          <div>
            {produit.nbAvis > 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Etoiles note={produit.noteMoyenne} />
                <span>({produit.nbAvis} avis)</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">Pas encore d'avis</p>
            )}

            <h1 className="mt-1.5 text-titre-md leading-tight text-nile-800 sm:text-display-mobile">
              {produit.titre}
            </h1>

            {enPromo ? (
              <p className="mt-3 flex flex-wrap items-baseline gap-2.5">
                <span className="text-3xl font-bold text-promo">
                  <Prix montant={prixEffectif} />
                </span>
                <span className="text-lg text-slate-400 line-through">
                  <Prix montant={produit.prix} />
                </span>
                <span className="rounded-full bg-promo-conteneur px-2.5 py-1 text-xs font-bold text-promo-dark">
                  -{affichagePrix.pourcentageReduction}%
                </span>
              </p>
            ) : (
              <p className="mt-3 text-3xl font-bold text-slate-900">
                <Prix montant={produit.prix} />
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-500">Prix TTC · FCFA (XAF), sans frais cachés</p>

            {/* Disponibilité (pastille colorée) */}
            <p
              className={`mt-2.5 flex items-center gap-2 text-sm font-bold ${
                enRupture
                  ? "text-promo"
                  : produit.stock <= 5
                    ? "text-accent-dark"
                    : "text-emerald-600"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  enRupture
                    ? "bg-promo"
                    : produit.stock <= 5
                      ? "animate-pulse bg-accent"
                      : "bg-emerald-500"
                }`}
              />
              {enRupture
                ? "Indisponible (rupture de stock)"
                : produit.stock <= 5
                  ? `Plus que ${produit.stock} en stock, commandez vite !`
                  : `En stock (${produit.stock} disponibles)`}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">
                Vendu par{" "}
                <Link href={`/boutique/${produit.vendeur.id}`} className="font-bold text-nile-700 hover:underline">
                  {produit.vendeur.nomBoutique}
                </Link>
              </p>
              <BoutonPartage titre={produit.titre} />
            </div>
          </div>

          {erreur && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
          )}
          {ok === "avis" && (
            <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Merci, votre avis a été publié.
            </p>
          )}

          {/* Description mise en avant */}
          <div className="rounded-xl border border-contour-carte bg-slate-50 p-5">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
              {produit.description}
            </p>
          </div>

          {/* Repères produit */}
          <div className="grid grid-cols-2 gap-3">
            <FicheInfo libelle="Catégorie" valeur={produit.categorie.nom}>
              <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
            </FicheInfo>
            <FicheInfo libelle="Livraison" valeur="Gratuite, partout">
              <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
            </FicheInfo>
          </div>

          {/* Achat */}
          <div id="achat-principal" className="space-y-3">
            <BoutonPanier
              produitId={produit.id}
              stock={produit.stock}
              quantiteInitiale={quantitePanier}
              taille="lg"
            />
            <Link href="/panier" className={btn("secondaire", "lg", "w-full")}>
              Voir mon panier
            </Link>
            <p className="text-center text-xs text-slate-400">
              Compte requis uniquement pour valider la commande.
            </p>
          </div>

          {/* Paiements acceptés */}
          <div className="border-t border-contour-carte pt-5">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Paiements acceptés</h2>
            <div className="flex flex-wrap gap-2.5">
              <PuceMoyenPaiement libelle="MTN MoMo" sigle="MTN" couleur="bg-[#ffcc00] text-slate-900" />
              <PuceMoyenPaiement libelle="Orange Money" sigle="OM" couleur="bg-[#ff6600] text-white" />
              <PuceMoyenPaiement libelle="Espèces à la livraison" sigle="₣" couleur="bg-emerald-500 text-white" />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-nile-50 p-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0 text-nile-700" aria-hidden="true">
                <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="17" cy="17" r="1.5" />
              </svg>
              <div>
                <p className="text-sm font-bold text-nile-900">Informations de livraison</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Livraison <strong>gratuite</strong> partout au Cameroun.
                  {env.DELAI_LIVRAISON_TEXTE ? ` Délai : ${env.DELAI_LIVRAISON_TEXTE}.` : ""}{" "}
                  Vérifiez votre colis à la réception : les ventes sont fermes, sans retour.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description complète (rappel accessible + SEO) */}
      <Carte className="p-5 lg:hidden">
        <h2 className="mb-2 font-bold text-slate-900">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{produit.description}</p>
      </Carte>

      {/* Avis */}
      <Carte className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Avis clients ({produit.nbAvis})</h2>

        <RepartitionAvis
          total={repartition.total}
          moyenne={repartition.moyenne}
          parNote={repartition.parNote}
        />

        {peutNoter && (
          <form action={creerAvisAction} className="space-y-2 rounded border border-contour-carte p-3">
            <input type="hidden" name="produitId" value={produit.id} />
            <input type="hidden" name="slug" value={produit.slug} />
            <div>
              <label htmlFor="note" className="block text-xs text-slate-500">Votre note</label>
              <select id="note" name="note" defaultValue="5" className={`${champClass} mt-1 w-28`}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </div>
            <textarea name="commentaire" rows={2} placeholder="Votre commentaire (facultatif)" className={champClass} />
            <BoutonSoumettre enCours="Publication…" className={btn("primaire", "sm")}>Publier mon avis</BoutonSoumettre>
          </form>
        )}

        {avis.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
            {avis.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Etoiles note={a.note} />
                  <BadgeAchatVerifie />
                </div>
                {a.commentaire && <p className="mt-1 text-sm text-slate-700">{a.commentaire}</p>}
                <p className="mt-0.5 text-xs text-slate-400">
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
          <h2 className="mb-3 text-titre-sm text-slate-900">Vous aimerez aussi</h2>
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
          prix={prixEffectif}
        />
      )}
    </div>
  );
}
