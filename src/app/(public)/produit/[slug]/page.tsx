import Link from "next/link";
import { notFound } from "next/navigation";
import { formaterXAF } from "@/lib/money";
import { getProduitPublicParSlug } from "@/modules/catalogue/produits";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { listerAvisProduit, peutLaisserAvis } from "@/modules/avis/avis";
import { ajouterAuPanierAction } from "@/app/(compte)/panier/actions";
import { creerAvisAction } from "@/app/(public)/produit/[slug]/actions";

export const dynamic = "force-dynamic";

function etoiles(note: number): string {
  const pleines = Math.round(note);
  return "★★★★★".slice(0, pleines) + "☆☆☆☆☆".slice(0, 5 - pleines);
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
  const [avis, peutNoter] = await Promise.all([
    listerAvisProduit(produit.id),
    utilisateur ? peutLaisserAvis(utilisateur.id, produit.id) : Promise.resolve(false),
  ]);

  const enRupture = produit.stock === 0;

  return (
    <div className="space-y-5">
      <Link href="/catalogue" className="text-sm text-gray-500 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Galerie images */}
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={produit.images[0]?.url ?? "/placeholder-produit.svg"}
            alt={produit.titre}
            className="aspect-square w-full rounded-lg object-cover"
          />
          {produit.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {produit.images.slice(1).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{produit.titre}</h1>
          <p className="text-xl font-semibold text-nile">{formaterXAF(produit.prix)}</p>
          <p className="text-sm text-gray-500">
            Vendu par <span className="font-medium">{produit.vendeur.nomBoutique}</span>
            {" · "}
            {produit.categorie.nom}
          </p>
          {produit.nbAvis > 0 && (
            <p className="text-sm text-amber-500">
              {etoiles(produit.noteMoyenne)}{" "}
              <span className="text-gray-500">
                {produit.noteMoyenne.toFixed(1)} ({produit.nbAvis} avis)
              </span>
            </p>
          )}

          {enRupture ? (
            <p className="inline-block rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              Indisponible (rupture de stock)
            </p>
          ) : (
            <p className="text-sm text-gray-600">En stock : {produit.stock}</p>
          )}

          {erreur && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erreur}
            </p>
          )}

          <form action={ajouterAuPanierAction} className="flex items-end gap-2">
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
                className="mt-1 w-20 rounded border border-gray-300 px-2 py-2 text-sm disabled:bg-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={enRupture}
              className="flex-1 rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Ajouter au panier
            </button>
          </form>
          <p className="text-xs text-gray-400">
            Il faut être connecté pour ajouter au panier.
          </p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Description</h2>
        <p className="whitespace-pre-line text-sm text-gray-700">{produit.description}</p>
      </section>

      {/* Avis */}
      <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Avis ({produit.nbAvis})</h2>

        {ok === "avis" && (
          <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Merci, votre avis a été publié.
          </p>
        )}

        {peutNoter && (
          <form action={creerAvisAction} className="space-y-2 rounded border border-gray-200 p-3">
            <input type="hidden" name="produitId" value={produit.id} />
            <input type="hidden" name="slug" value={produit.slug} />
            <div>
              <label htmlFor="note" className="block text-xs text-gray-500">Votre note</label>
              <select id="note" name="note" defaultValue="5" className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
            <textarea
              name="commentaire"
              rows={2}
              placeholder="Votre commentaire (facultatif)"
              className="block w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded bg-nile px-3 py-1.5 text-sm font-medium text-white hover:bg-nile-dark">
              Publier mon avis
            </button>
          </form>
        )}

        {avis.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour l'instant.</p>
        ) : (
          <ul className="space-y-3">
            {avis.map((a) => (
              <li key={a.id} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                <p className="text-sm text-amber-500">{etoiles(a.note)}</p>
                {a.commentaire && (
                  <p className="text-sm text-gray-700">{a.commentaire}</p>
                )}
                <p className="text-xs text-gray-400">
                  {a.acheteur.nom} · {new Date(a.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
