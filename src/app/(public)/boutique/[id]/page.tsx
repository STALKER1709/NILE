import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { favorisParmi } from "@/modules/catalogue/favoris";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduit } from "@/components/produit/CarteProduit";
import { Badge, EtatVide, Etoiles } from "@/components/ui/kit";
import { enrichirProduitsPourCartes } from "@/modules/promotion/promotion";
import { listerPublicationsBoutique } from "@/modules/reels/reels";
import { CarteReelBoutique } from "@/components/reels/CarteReelBoutique";

export const dynamic = "force-dynamic";

/** Boutique publique : uniquement les boutiques VALIDÉES, produits ACTIFS. */
async function getBoutique(id: string) {
  return prisma.vendeur.findFirst({
    where: { id, statutValidation: "VALIDE" },
    select: { id: true, nomBoutique: true, description: true, dateCreation: true, localisationPublique: true, telephonePublic: true, whatsappPublic: true, emailPublic: true, afficherCoordonnees: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boutique = await getBoutique(id);
  if (!boutique) return { title: "Boutique introuvable" };
  return {
    title: `Boutique ${boutique.nomBoutique}`,
    description:
      boutique.description ??
      `Tous les produits de ${boutique.nomBoutique} sur NILE Marketplace.`,
  };
}

export default async function BoutiquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boutique = await getBoutique(id);
  if (!boutique) notFound();

  const utilisateur = await getUtilisateurCourant();
  const [produitsBruts, quantites, publications] = await Promise.all([
    prisma.produit.findMany({
      where: { vendeurId: boutique.id, statut: "ACTIF" },
      orderBy: { dateMaj: "desc" },
      include: {
        images: { orderBy: { ordre: "asc" }, take: 1 },
        vendeur: { select: { id: true, nomBoutique: true } },
      },
    }),
    getQuantitesAffichees(utilisateur?.id ?? null),
    listerPublicationsBoutique(boutique.id),
  ]);
  const produits = await enrichirProduitsPourCartes(produitsBruts);
  // Restreint aux articles affichés : charger toute la liste de souhaits pour
  // cocher quelques cœurs serait disproportionné.
  const favoris = await favorisParmi(
    utilisateur?.id ?? null,
    produits.map((p) => p.id),
  );

  // Note globale de la boutique : moyenne pondérée des avis de ses produits.
  const totalAvis = produits.reduce((s, p) => s + p.nbAvis, 0);
  const noteGlobale =
    totalAvis > 0
      ? produits.reduce((s, p) => s + p.noteMoyenne * p.nbAvis, 0) / totalAvis
      : 0;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-contour-carte bg-white shadow-carte">
        <div className="h-20 bg-gradient-to-r from-nile-800 via-nile-700 to-emerald-700 sm:h-24" />
        <div className="p-5 pt-0">
        <div className="-mt-7 flex flex-wrap items-end gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-nile text-xl font-bold text-white ring-4 ring-white">
            {boutique.nomBoutique.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-titre-sm leading-tight text-nile-800">{boutique.nomBoutique}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge ton="vert">Boutique vérifiée</Badge>
              <span>
                Sur NILE depuis{" "}
                {new Date(boutique.dateCreation).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Indicateurs de confiance */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <strong className="font-semibold text-slate-900">{produits.length}</strong>
            <span className="text-slate-500">
              produit{produits.length > 1 ? "s" : ""} en ligne
            </span>
          </span>
          {totalAvis > 0 && (
            <span className="flex items-center gap-1.5">
              <Etoiles note={noteGlobale} />
              <strong className="font-semibold text-slate-900">
                {noteGlobale.toFixed(1)}
              </strong>
              <span className="text-slate-500">
                ({totalAvis} avis vérifié{totalAvis > 1 ? "s" : ""})
              </span>
            </span>
          )}
        </div>
        {boutique.description && (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{boutique.description}</p>
        )}
        {(boutique.localisationPublique || (boutique.afficherCoordonnees && (boutique.telephonePublic || boutique.whatsappPublic || boutique.emailPublic))) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-sm">
            {boutique.localisationPublique && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-slate-600">📍 {boutique.localisationPublique}</span>}
            {boutique.afficherCoordonnees && boutique.telephonePublic && <a href={`tel:${boutique.telephonePublic}`} className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-nile-700 hover:bg-nile-50">Appeler la boutique</a>}
            {boutique.afficherCoordonnees && boutique.whatsappPublic && <a href={`https://wa.me/${boutique.whatsappPublic.replace(/\\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-nile-700 hover:bg-nile-50">WhatsApp</a>}
            {boutique.afficherCoordonnees && boutique.emailPublic && <a href={`mailto:${boutique.emailPublic}`} className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-nile-700 hover:bg-nile-50">E-mail</a>}
          </div>
        )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-titre-sm text-slate-900">Produits</h2>
        <span className="text-sm text-slate-500">
          {produits.length} produit{produits.length > 1 ? "s" : ""}
        </span>
      </div>

      {produits.length === 0 ? (
        <EtatVide titre="Cette boutique n'a pas encore de produits en ligne." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {produits.map((p, i) => (
            <CarteProduit
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 5}
              index={i}
              favori={
                utilisateur
                  ? { enFavori: favoris.has(p.id), retour: `/boutique/${boutique.id}` }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Reels de la boutique : défilement horizontal, lecture au clic */}
      {publications.length > 0 && (
        <section aria-label="Publications de la boutique" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-titre-sm text-slate-900">Reels</h2>
            <span className="text-sm text-slate-500">
              {publications.length} publication
              {publications.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {publications.map((pub, i) => (
              <CarteReelBoutique key={pub.id} publication={pub} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
