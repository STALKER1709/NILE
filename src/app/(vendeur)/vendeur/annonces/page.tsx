import { exigerVendeur } from "@/modules/auth/access";
import { listerAnnonces } from "@/modules/annonce/annonce";
import { Carte, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Annonces NILE" };

export default async function AnnoncesVendeurPage() {
  await exigerVendeur();
  const annonces = await listerAnnonces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Annonces NILE</h1>
        <p className="mt-1 text-corps-sm text-slate-500">
          Actualités et briefs publiés par NILE pour les vendeurs.
        </p>
      </div>

      {annonces.length === 0 ? (
        <EtatVide titre="Aucune annonce pour l'instant." />
      ) : (
        <ul className="space-y-3">
          {annonces.map((a) => (
            <li key={a.id}>
              <Carte className={`p-5 ${a.epinglee ? "border-nile-700/30 bg-nile-50" : ""}`}>
                <p className="flex items-center gap-2 text-titre-sm text-nile-800">
                  {a.epinglee && (
                    <span className="rounded-full bg-accent-fixe px-2 py-0.5 text-[10px] font-bold uppercase text-accent-sur">
                      Épinglée
                    </span>
                  )}
                  {a.titre}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-corps-sm text-slate-600">{a.contenu}</p>
                <p className="mt-3 text-etiquette-xs text-slate-400">
                  {a.dateCreation.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </Carte>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
