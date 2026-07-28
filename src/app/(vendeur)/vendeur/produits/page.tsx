import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerProduitsVendeur } from "@/modules/catalogue/produits";
import { supprimerProduitAction } from "@/app/(vendeur)/vendeur/produits/actions";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import { Vignette } from "@/components/ui/Vignette";
import { Carte, Prix, Badge, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

const MESSAGES_OK: Record<string, string> = {
  cree: "Produit créé.",
  maj: "Produit mis à jour.",
  statut: "Statut mis à jour.",
  supprime: "Produit supprimé.",
};

export default async function ListeProduitsVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const produits = await listerProduitsVendeur(vendeur.id);

  // Indicateurs d'inventaire, tous calculés à partir des produits réels.
  const enLigne = produits.filter((p) => p.statut === "ACTIF").length;
  const stockFaible = produits.filter((p) => p.statut === "ACTIF" && p.stock <= 2).length;
  const valeurStock = produits.reduce((s, p) => s + p.prix * p.stock, 0);
  const partEnLigne = produits.length > 0 ? Math.round((enLigne / produits.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Gestion d'inventaire</h1>
          <p className="mt-1 text-corps-sm text-slate-500">
            {produits.length} produit{produits.length > 1 ? "s" : ""} dans votre boutique.
          </p>
        </div>
        <Link href="/vendeur/produits/nouveau" className={btn("primaire", "md")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Ajouter un produit
        </Link>
      </div>

      {/* Indicateurs d'inventaire */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicateur libelle="Total produits" valeur={String(produits.length)} />
        <Indicateur
          libelle="Stock faible"
          valeur={String(stockFaible).padStart(2, "0")}
          alerte={stockFaible > 0}
          note={stockFaible > 0 ? "à réapprovisionner" : "rien à signaler"}
        />
        <Indicateur libelle="Valeur du stock" valeur={<Prix montant={valeurStock} />} />
        <Indicateur libelle="En ligne" valeur={String(enLigne)} jauge={partEnLigne} />
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{MESSAGES_OK[ok]}</p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      {vendeur.statutValidation !== "VALIDE" && (
        <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
          Boutique <strong>{vendeur.statutValidation}</strong> · publication possible une fois validée.
        </p>
      )}

      {produits.length === 0 ? (
        <EtatVide titre="Aucun produit pour l'instant.">Créez votre premier produit.</EtatVide>
      ) : (
        <Carte className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left">
              <thead>
                <tr className="border-b border-contour-carte bg-surface-basse text-etiquette-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Produit</th>
                  <th className="px-5 py-3 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Prix</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produits.map((p) => {
                  const bas = p.statut === "ACTIF" && p.stock <= 2;
                  return (
                    <tr key={p.id} className={`transition-colors hover:bg-surface-subtile ${bas ? "bg-promo-conteneur/30" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Vignette url={p.images[0]?.url} alt="" sizes="48px" className="h-12 w-12 shrink-0 rounded border border-contour-carte" />
                          <div className="min-w-0">
                            <Link href={`/vendeur/produits/${p.id}`} className="block truncate text-corps-sm font-semibold text-slate-900 hover:text-nile-700 hover:underline">
                              {p.titre}
                            </Link>
                            <span className="text-etiquette-xs text-slate-500">{p.categorie?.nom ?? "Sans catégorie"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`block text-corps-sm font-bold ${bas ? "text-promo" : "text-slate-900"}`}>
                          {String(p.stock).padStart(2, "0")}
                        </span>
                        {bas && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-promo">
                            Niveau bas
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-corps-sm font-bold text-slate-900">
                        <Prix montant={p.prix} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2 text-corps-sm">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${p.statut === "ACTIF" ? "bg-nile-700" : p.statut === "REJETE" ? "bg-promo" : "bg-slate-300"}`} />
                          <span className={p.statut === "ACTIF" ? "text-nile-800" : "text-slate-500"}>
                            {p.statut === "ACTIF" ? "En ligne" : p.statut === "REJETE" ? "Rejeté" : "Hors ligne"}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/vendeur/produits/${p.id}`} className={btn("ghost", "sm")}>
                            Modifier
                          </Link>
                          <form action={supprimerProduitAction}>
                            <input type="hidden" name="produitId" value={p.id} />
                            <BoutonConfirme
                              question={`Supprimer définitivement « ${p.titre} » ? Cette action est irréversible.`}
                              enCours="…"
                              titre="Supprimer ce produit"
                              className="rounded px-2.5 py-1.5 text-etiquette-xs text-promo transition-colors hover:bg-promo-conteneur disabled:opacity-50"
                            >
                              Supprimer
                            </BoutonConfirme>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Carte>
      )}
    </div>
  );
}

/** Carte d'indicateur d'inventaire. */
function Indicateur({
  libelle,
  valeur,
  note,
  alerte = false,
  jauge,
}: {
  libelle: string;
  valeur: React.ReactNode;
  note?: string;
  alerte?: boolean;
  jauge?: number;
}) {
  return (
    <Carte className={`p-4 ${alerte ? "border-l-4 border-l-promo" : ""}`}>
      <p className="text-etiquette-xs uppercase tracking-wider text-slate-500">{libelle}</p>
      <p className={`mt-1.5 text-titre-sm ${alerte ? "text-promo" : "text-nile-800"}`}>{valeur}</p>
      {note && <p className="mt-0.5 text-etiquette-xs text-slate-400">{note}</p>}
      {jauge !== undefined && (
        <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-haute">
          <span className="block h-full rounded-full bg-nile-700" style={{ width: `${jauge}%` }} />
        </span>
      )}
    </Carte>
  );
}
