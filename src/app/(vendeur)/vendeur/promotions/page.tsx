import { exigerVendeur } from "@/modules/auth/access";
import { listerProduitsVendeur } from "@/modules/catalogue/produits";
import { listerPromotionsVendeur } from "@/modules/promotion/promotion";
import { estPromotionActive } from "@/modules/promotion/promotion-core";
import { Carte, Prix, btn, champClass, labelClass } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import { creerPromotionAction, annulerPromotionAction } from "@/app/(vendeur)/vendeur/promotions/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions" };

const MESSAGES_OK: Record<string, string> = {
  creee: "Promotion créée.",
  annulee: "Promotion annulée.",
};

type PromotionAffichee = Awaited<ReturnType<typeof listerPromotionsVendeur>>[number];

export default async function PromotionsVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const [produits, promotions] = await Promise.all([
    listerProduitsVendeur(vendeur.id),
    listerPromotionsVendeur(vendeur.id),
  ]);

  const maintenant = new Date();
  const actives = promotions.filter((p) => estPromotionActive(p, maintenant));
  const aVenir = promotions.filter((p) => !p.annulee && p.dateDebut > maintenant);
  const terminees = promotions.filter(
    (p) => p.annulee || (p.dateFin < maintenant && p.dateDebut <= maintenant),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Promotions</h1>
        <p className="mt-1 text-corps-sm text-slate-500">
          Réduisez le prix d&apos;un produit précis, ou de toute votre boutique,
          pendant une période choisie.
        </p>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-5 sm:p-6">
        <h2 className="text-titre-sm text-nile-800">Créer une promotion</h2>
        <form action={creerPromotionAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="produitId" className={labelClass}>Cible</label>
            <select id="produitId" name="produitId" className={`${champClass} mt-1`} defaultValue="">
              <option value="">Toute la boutique</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titre} — {p.prix.toLocaleString("fr-FR")} FCFA
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className={labelClass}>Type de réduction</label>
            <select id="type" name="type" className={`${champClass} mt-1`} defaultValue="POURCENTAGE">
              <option value="POURCENTAGE">Pourcentage</option>
              <option value="MONTANT">Montant fixe (FCFA)</option>
            </select>
          </div>
          <div>
            <label htmlFor="valeur" className={labelClass}>Valeur</label>
            <input
              id="valeur"
              name="valeur"
              type="number"
              required
              min={1}
              step={1}
              placeholder="Ex : 20 (%) ou 1000 (FCFA)"
              className={`${champClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="dateDebut" className={labelClass}>Début</label>
            <input
              id="dateDebut"
              name="dateDebut"
              type="datetime-local"
              required
              className={`${champClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="dateFin" className={labelClass}>Fin</label>
            <input
              id="dateFin"
              name="dateFin"
              type="datetime-local"
              required
              className={`${champClass} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <BoutonSoumettre enCours="Création…" className={btn("accent", "md")}>
              Lancer la promotion
            </BoutonSoumettre>
          </div>
        </form>
      </Carte>

      <PromotionsListe titre="Actives" promotions={actives} annulable />
      <PromotionsListe titre="À venir" promotions={aVenir} annulable />
      <PromotionsListe titre="Terminées / annulées" promotions={terminees} />
    </div>
  );
}

function PromotionsListe({
  titre,
  promotions,
  annulable = false,
}: {
  titre: string;
  promotions: PromotionAffichee[];
  annulable?: boolean;
}) {
  if (promotions.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-titre-sm text-nile-800">{titre}</h2>
      <ul className="space-y-2">
        {promotions.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-contour-carte bg-white p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                {p.produit ? p.produit.titre : "Toute la boutique"}
              </p>
              <p className="text-corps-sm text-slate-500">
                {p.type === "POURCENTAGE" ? (
                  `-${p.valeur}%`
                ) : (
                  <>-<Prix montant={p.valeur} /></>
                )}
                {" · "}
                {p.dateDebut.toLocaleDateString("fr-FR")} au {p.dateFin.toLocaleDateString("fr-FR")}
                {p.annulee && " · annulée"}
              </p>
            </div>
            {annulable && (
              <form action={annulerPromotionAction}>
                <input type="hidden" name="promotionId" value={p.id} />
                <BoutonConfirme
                  question="Annuler cette promotion ?"
                  enCours="Annulation…"
                  className={btn("danger", "sm")}
                >
                  Annuler
                </BoutonConfirme>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
