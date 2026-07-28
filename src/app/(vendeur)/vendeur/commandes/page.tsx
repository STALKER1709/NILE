import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import {
  listerCommandesVendeur,
  compterCommandesVendeur,
} from "@/modules/commande/vendeur";
import {
  affecterTransporteurVendeurAction,
  expedierVendeurAction,
  livrerVendeurAction,
} from "@/app/(vendeur)/vendeur/commandes/actions";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, Prix, EtatVide, btn, champClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes · vendeur" };

const MESSAGES_OK: Record<string, string> = {
  preparation: "Commande en préparation · bon courage !",
  expediee: "Commande marquée expédiée. L'acheteur est prévenu.",
  livree: "Commande livrée. Bien joué !",
};

export default async function CommandesVendeurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const [commandes, compteurs] = await Promise.all([
    listerCommandesVendeur(vendeur.id),
    compterCommandesVendeur(vendeur.id),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight text-nile-900 sm:text-3xl">Mes commandes</h1>
        <Link href="/vendeur" className="text-sm text-nile hover:underline">← Espace vendeur</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Compteur label="À préparer" valeur={compteurs.aPreparer} accent />
        <Compteur label="Expédiées" valeur={compteurs.enCours} />
        <Compteur label="Livrées" valeur={compteurs.livrees} />
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <p className="text-sm text-slate-500">
        <strong>Ta boutique pilote la livraison</strong> de ses commandes :
        préparation, expédition, livraison · l&apos;acheteur est prévenu
        automatiquement à chaque étape, et NILE supervise. Un colis refusé à la
        livraison ou un souci d&apos;encaissement : contacte NILE (page{" "}
        <Link href="/contact" className="text-nile hover:underline">contact</Link>).
      </p>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande pour l'instant.">
          Tes ventes apparaîtront ici dès la première commande.
        </EtatVide>
      ) : (
        <div className="space-y-3">
          {commandes.map((c) => (
            <Carte key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.numero}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.dateCreation).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <BadgeStatutCommande statut={c.statutCommande} />
                  <BadgeStatutPaiement statut={c.statutPaiement} />
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {c.lignes.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {l.titreProduit} × {l.quantite}
                    </span>
                    <Prix montant={l.sousTotal} className="shrink-0 text-slate-700" />
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                <span>Total de tes articles</span>
                <Prix montant={c.totalVendeur} className="text-nile" />
              </p>

              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="font-medium text-slate-700">Livraison</p>
                <p>
                  {c.destNom} · {c.destTelephone}
                </p>
                <p>
                  {c.quartier}, {c.ville}
                  {c.reperes ? ` · ${c.reperes}` : ""}
                </p>
                {c.livraison?.transporteur && (
                  <p className="mt-1">Transporteur : {c.livraison.transporteur}</p>
                )}
              </div>

              {/* Pilotage du suivi par la boutique (commande entièrement à elle). */}
              {c.gereeParVendeur ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {c.statutCommande === "CONFIRMEE" && (
                    <form
                      action={affecterTransporteurVendeurAction}
                      className="flex flex-col gap-2 sm:flex-row sm:items-end"
                    >
                      <input type="hidden" name="commandeId" value={c.id} />
                      <div className="flex-1">
                        <label htmlFor={`tr-${c.id}`} className="block text-xs text-slate-500">
                          Qui livre ? (transporteur, livreur, ou toi-même)
                        </label>
                        <input
                          id={`tr-${c.id}`}
                          name="transporteur"
                          required
                          placeholder="Ex : Moto Express, Jean 6XX…, moi-même"
                          className={`${champClass} mt-1`}
                        />
                      </div>
                      <BoutonSoumettre enCours="Un instant…" className={btn("primaire", "md", "sm:shrink-0")}>
                        Commencer la préparation
                      </BoutonSoumettre>
                    </form>
                  )}
                  {c.statutCommande === "EN_PREPARATION" && (
                    <form action={expedierVendeurAction}>
                      <input type="hidden" name="commandeId" value={c.id} />
                      <BoutonSoumettre enCours="Un instant…" className={btn("primaire", "md")}>
                        Marquer expédiée
                      </BoutonSoumettre>
                      <span className="ml-2 text-xs text-slate-500">
                        L&apos;acheteur recevra la notification d&apos;expédition.
                      </span>
                    </form>
                  )}
                  {c.statutCommande === "EXPEDIEE" && (
                    <form action={livrerVendeurAction}>
                      <input type="hidden" name="commandeId" value={c.id} />
                      <BoutonSoumettre enCours="Un instant…" className={btn("accent", "md")}>
                        Marquer livrée
                      </BoutonSoumettre>
                      {c.modePaiement === "COD" && (
                        <span className="ml-2 text-xs text-slate-500">
                          Encaisse <Prix montant={c.total} /> à la remise du colis.
                        </span>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Commande multi-boutiques : le suivi est coordonné par NILE.
                </p>
              )}
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}

function Compteur({
  label,
  valeur,
  accent = false,
}: {
  label: string;
  valeur: number;
  accent?: boolean;
}) {
  return (
    <Carte className="p-3 text-center sm:p-4">
      <p className={`text-2xl font-bold ${accent && valeur > 0 ? "text-accent-dark" : "text-nile"}`}>
        {valeur}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </Carte>
  );
}
