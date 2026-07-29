import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import {
  rechercherProduitsVendeur,
  statsInventaireVendeur,
} from "@/modules/catalogue/produits";
import { supprimerProduitAction } from "@/app/(vendeur)/vendeur/produits/actions";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import { Vignette } from "@/components/ui/Vignette";
import { Pagination } from "@/components/ui/Pagination";
import { bornesAffichage } from "@/modules/catalogue/pagination";
import { Carte, Prix, btn, EtatVide, champClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

const PAR_PAGE = 15;

const MESSAGES_OK: Record<string, string> = {
  cree: "Produit créé.",
  maj: "Produit mis à jour.",
  statut: "Statut mis à jour.",
  supprime: "Produit supprimé.",
};

export default async function ListeProduitsVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { ok, erreur } = sp;
  const { vendeur } = await exigerVendeur();

  const q = sp.q?.trim() || undefined;
  const pageDemandee = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [stats, { produits, total, page, pages }] = await Promise.all([
    statsInventaireVendeur(vendeur.id),
    rechercherProduitsVendeur(vendeur.id, { q, page: pageDemandee, parPage: PAR_PAGE }),
  ]);

  const partEnLigne = stats.total > 0 ? Math.round((stats.enLigne / stats.total) * 100) : 0;
  const lienPage = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/vendeur/produits?${params.toString()}`;
  };
  const { debut, fin } = bornesAffichage(page, PAR_PAGE, total);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Gestion d'inventaire</h1>
          <p className="mt-1 text-corps-sm text-slate-500">
            {stats.total} produit{stats.total > 1 ? "s" : ""} dans votre boutique.
          </p>
        </div>
        <Link href="/vendeur/produits/nouveau" className={btn("primaire", "md")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Ajouter un produit
        </Link>
      </div>

      {/* Indicateurs : agrégés sur TOUT le catalogue, pas sur la page affichée. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicateur libelle="Total produits" valeur={String(stats.total)} />
        <Indicateur
          libelle="Stock faible"
          valeur={String(stats.stockFaible).padStart(2, "0")}
          alerte={stats.stockFaible > 0}
          note={stats.stockFaible > 0 ? "à réapprovisionner" : "rien à signaler"}
        />
        <Indicateur libelle="Valeur du stock" valeur={<Prix montant={stats.valeurStock} />} />
        <Indicateur libelle="En ligne" valeur={String(stats.enLigne)} jauge={partEnLigne} />
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

      {stats.total === 0 ? (
        <EtatVide titre="Aucun produit pour l'instant.">Créez votre premier produit.</EtatVide>
      ) : (
        <Carte className="overflow-hidden">
          {/* Recherche : vrai formulaire GET, fonctionne sans JavaScript. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-contour-carte p-4 sm:p-5">
            <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
              <label htmlFor="q" className="sr-only">Rechercher un produit</label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Rechercher un produit…"
                className={`${champClass} max-w-[16rem]`}
              />
              <button type="submit" className={btn("secondaire", "sm")}>Rechercher</button>
              {q && (
                <Link href="/vendeur/produits" className="text-corps-sm text-slate-500 hover:text-nile-700 hover:underline">
                  Réinitialiser
                </Link>
              )}
            </form>
            <p className="shrink-0 text-corps-sm text-slate-500">
              {total === 0 ? "Aucun résultat" : `${debut}–${fin} sur ${total}`}
            </p>
          </div>

          {produits.length === 0 ? (
            <p className="p-8 text-center text-corps-sm text-slate-500">
              Aucun produit ne correspond à « {q} ».
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left">
                <thead>
                  <tr className="border-b border-contour-carte bg-surface-basse text-etiquette-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-semibold">Produit</th>
                    <th className="px-5 py-3 font-semibold">Catégorie</th>
                    <th className="px-5 py-3 text-center font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Prix</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
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
                            <Link href={`/vendeur/produits/${p.id}`} className="block min-w-0 truncate text-corps-sm font-semibold text-slate-900 hover:text-nile-700 hover:underline">
                              {p.titre}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.categorie ? (
                            <span className="inline-block whitespace-nowrap rounded-full bg-accent-fixe px-3 py-1 text-[12px] font-semibold text-accent-sur">
                              {p.categorie.nom}
                            </span>
                          ) : (
                            <span className="text-etiquette-xs text-slate-400">Sans catégorie</span>
                          )}
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
                          {/* Actions en icônes : libellé accessible caché + infobulle. */}
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/vendeur/produits/${p.id}`}
                              title="Modifier ce produit"
                              className="grid h-9 w-9 place-items-center rounded text-slate-500 transition-colors hover:bg-nile-50 hover:text-nile-700"
                            >
                              <span className="sr-only">Modifier {p.titre}</span>
                              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path d="M12 20h9" strokeLinecap="round" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinejoin="round" />
                              </svg>
                            </Link>
                            <form action={supprimerProduitAction}>
                              <input type="hidden" name="produitId" value={p.id} />
                              <BoutonConfirme
                                question={`Supprimer définitivement « ${p.titre} » ? Cette action est irréversible.`}
                                enCours="…"
                                titre="Supprimer ce produit"
                                className="grid h-9 w-9 place-items-center rounded text-slate-500 transition-colors hover:bg-promo-conteneur hover:text-promo disabled:opacity-50"
                              >
                                <span className="sr-only">Supprimer {p.titre}</span>
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
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
          )}

          {pages > 1 && (
            <div className="border-t border-contour-carte p-4 sm:p-5">
              <Pagination page={page} pages={pages} lien={lienPage} etiquette="Pages de l'inventaire" />
            </div>
          )}
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
