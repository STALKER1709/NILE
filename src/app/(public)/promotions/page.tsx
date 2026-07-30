import { listerProduitsEnPromotion } from "@/modules/promotion/promotion";
import { getUtilisateurCourant } from "@/modules/auth/access";
import { getQuantitesAffichees } from "@/modules/commande/panier-invite";
import { CarteProduitVitrine } from "@/components/produit/CarteProduitVitrine";
import { Pagination } from "@/components/ui/Pagination";
import { bornesAffichage } from "@/modules/catalogue/pagination";
import { EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions" };
const PAR_PAGE = 12;

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const utilisateur = await getUtilisateurCourant();
  const [{ produits, total, pages }, quantites] = await Promise.all([
    listerProduitsEnPromotion({ page, parPage: PAR_PAGE }),
    getQuantitesAffichees(utilisateur?.id ?? null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Promotions</h1>
        <p className="mt-1 text-corps-md text-slate-600">
          Les articles actuellement en réduction, tous vendeurs confondus.
        </p>
      </div>

      {produits.length === 0 ? (
        <EtatVide titre="Aucune promotion en cours pour l'instant.">
          Revenez bientôt : les vendeurs lancent régulièrement de nouvelles offres.
        </EtatVide>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-gouttiere lg:grid-cols-3 xl:grid-cols-4">
          {produits.map((p, i) => (
            <CarteProduitVitrine
              key={p.id}
              produit={p}
              quantitePanier={quantites[p.id] ?? 0}
              priority={i < 4}
              index={i}
              actions="simple"
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 280px"
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="space-y-3 pt-2">
          <Pagination
            page={page}
            pages={pages}
            lien={(p) => `/promotions?page=${p}`}
            etiquette="Pages des promotions"
          />
          <p className="text-center text-corps-sm text-slate-500">
            {(() => {
              const { debut, fin } = bornesAffichage(page, PAR_PAGE, total);
              return `Produits ${debut} à ${fin} sur ${total}`;
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
