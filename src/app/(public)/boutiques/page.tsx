import { listerBoutiques } from "@/modules/catalogue/boutiques";
import { CarteBoutique } from "@/components/boutique/CarteBoutique";
import { EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Boutiques",
  description:
    "Découvrez les boutiques vérifiées de NILE Marketplace au Cameroun.",
};

export default async function BoutiquesPage() {
  const boutiques = await listerBoutiques({ tri: "nom" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Boutiques</h1>
        <p className="mt-1 text-sm text-slate-500">
          {boutiques.length} boutique{boutiques.length > 1 ? "s" : ""} vérifiée
          {boutiques.length > 1 ? "s" : ""} · vendeurs de confiance au Cameroun
        </p>
      </div>

      {boutiques.length === 0 ? (
        <EtatVide titre="Aucune boutique en ligne pour l'instant.">
          Revenez bientôt, de nouveaux vendeurs arrivent.
        </EtatVide>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boutiques.map((b, i) => (
            <CarteBoutique key={b.id} boutique={b} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
