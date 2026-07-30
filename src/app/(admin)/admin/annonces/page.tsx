import { exigerRole } from "@/modules/auth/access";
import { listerAnnonces } from "@/modules/annonce/annonce";
import { Carte, EtatVide, btn, champClass, labelClass } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { BoutonConfirme } from "@/components/ui/BoutonConfirme";
import {
  creerAnnonceAction,
  basculerEpingleAction,
  supprimerAnnonceAction,
} from "@/app/(admin)/admin/annonces/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Annonces vendeurs" };

const MESSAGES_OK: Record<string, string> = {
  creee: "Annonce publiée.",
  maj: "Annonce mise à jour.",
  supprimee: "Annonce supprimée.",
};

export default async function AdminAnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const annonces = await listerAnnonces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titre-md font-bold text-nile-900">Annonces vendeurs</h1>
        <p className="text-sm text-slate-500">
          Diffusez des actualités et briefs aux vendeurs. Diffusion à sens
          unique : les vendeurs consultent, ils ne répondent pas ici.
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

      <Carte className="p-5">
        <h2 className="font-bold text-slate-900">Nouvelle annonce</h2>
        <form action={creerAnnonceAction} className="mt-3 space-y-3">
          <div>
            <label htmlFor="titre" className={labelClass}>Titre</label>
            <input id="titre" name="titre" required maxLength={150} className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="contenu" className={labelClass}>Contenu</label>
            <textarea id="contenu" name="contenu" required rows={4} maxLength={4000} className={`${champClass} mt-1`} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="epinglee" className="accent-nile-700" />
            Épingler en haut du flux
          </label>
          <BoutonSoumettre enCours="Publication…" className={btn("accent", "md")}>
            Publier
          </BoutonSoumettre>
        </form>
      </Carte>

      {annonces.length === 0 ? (
        <EtatVide titre="Aucune annonce publiée pour l'instant." />
      ) : (
        <ul className="space-y-3">
          {annonces.map((a) => (
            <li key={a.id}>
              <Carte className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold text-slate-900">
                      {a.epinglee && (
                        <span className="rounded-full bg-accent-fixe px-2 py-0.5 text-[10px] font-bold uppercase text-accent-sur">
                          Épinglée
                        </span>
                      )}
                      {a.titre}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.contenu}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Publiée le{" "}
                      {a.dateCreation.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={basculerEpingleAction}>
                      <input type="hidden" name="annonceId" value={a.id} />
                      <input type="hidden" name="epinglee" value={(!a.epinglee).toString()} />
                      <button type="submit" className={btn("secondaire", "sm")}>
                        {a.epinglee ? "Désépingler" : "Épingler"}
                      </button>
                    </form>
                    <form action={supprimerAnnonceAction}>
                      <input type="hidden" name="annonceId" value={a.id} />
                      <BoutonConfirme
                        question="Supprimer définitivement cette annonce ?"
                        enCours="Suppression…"
                        className={btn("danger", "sm")}
                      >
                        Supprimer
                      </BoutonConfirme>
                    </form>
                  </div>
                </div>
              </Carte>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
