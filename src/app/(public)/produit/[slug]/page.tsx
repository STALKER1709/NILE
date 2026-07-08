import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduitPublicParSlug } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { listerAvisProduit, peutLaisserAvis } from "@/modules/avis/avis";
import { ajouterAuPanierAction } from "@/app/(compte)/panier/actions";
import { creerAvisAction } from "@/app/(public)/produit/[slug]/actions";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Etoiles, Prix, Badge, btn, champClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

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
  const [avis, peutNoter] = await Promise.all([
    listerAvisProduit(produit.id),
    utilisateur ? peutLaisserAvis(utilisateur.id, produit.id) : Promise.resolve(false),
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
          </div>

          <Prix montant={produit.prix} className="block text-3xl font-extrabold text-nile" />

          <p className="text-sm text-gray-500">
            Vendu par <span className="font-medium text-gray-700">{produit.vendeur.nomBoutique}</span>
          </p>

          {enRupture ? (
            <Badge ton="rouge">Indisponible (rupture)</Badge>
          ) : (
            <Badge ton="vert">En stock ({produit.stock})</Badge>
          )}

          {erreur && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
          )}
          {ok === "avis" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Merci, votre avis a été publié.
            </p>
          )}

          <Carte className="p-4">
            <form action={ajouterAuPanierAction} className="flex items-end gap-3">
              <input type="hidden" name="produitId" value={produit.id} />
              <input type="hidden" name="slug" value={produit.slug} />
              <div>
                <label htmlFor="quantite" className="block text-xs text-gray-500">Quantité</label>
                <input
                  id="quantite"
                  name="quantite"
                  type="number"
                  min={1}
                  max={produit.stock}
                  defaultValue={1}
                  disabled={enRupture}
                  className={`${champClass} mt-1 w-20`}
                />
              </div>
              <button type="submit" disabled={enRupture} className={btn("accent", "lg", "flex-1")}>
                Ajouter au panier
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-400">Connexion requise pour commander.</p>
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
