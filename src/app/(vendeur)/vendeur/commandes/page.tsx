import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import {
  listerCommandesVendeur,
  compterCommandesVendeur,
} from "@/modules/commande/vendeur";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { Carte, Prix, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes — vendeur" };

export default async function CommandesVendeurPage() {
  const { vendeur } = await exigerVendeur();
  const [commandes, compteurs] = await Promise.all([
    listerCommandesVendeur(vendeur.id),
    compterCommandesVendeur(vendeur.id),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Mes commandes</h1>
        <Link href="/vendeur" className="text-sm text-nile hover:underline">← Espace vendeur</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Compteur label="À préparer" valeur={compteurs.aPreparer} accent />
        <Compteur label="Expédiées" valeur={compteurs.enCours} />
        <Compteur label="Livrées" valeur={compteurs.livrees} />
      </div>

      <p className="text-sm text-gray-500">
        Prépare les commandes <strong>confirmées</strong> (le paiement Mobile
        Money est déjà encaissé ; le paiement à la livraison est collecté par
        le livreur). L&apos;expédition et la livraison sont coordonnées avec
        NILE.
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
                  <p className="text-xs text-gray-500">
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

              <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
                {c.lignes.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {l.titreProduit} × {l.quantite}
                    </span>
                    <Prix montant={l.sousTotal} className="shrink-0 text-gray-700" />
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                <span>Total de tes articles</span>
                <Prix montant={c.totalVendeur} className="text-nile" />
              </p>

              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p className="font-medium text-gray-700">Livraison</p>
                <p>
                  {c.destNom} — {c.destTelephone}
                </p>
                <p>
                  {c.quartier}, {c.ville}
                  {c.reperes ? ` · ${c.reperes}` : ""}
                </p>
                {c.livraison?.transporteur && (
                  <p className="mt-1">Transporteur : {c.livraison.transporteur}</p>
                )}
              </div>
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
      <p className="text-xs text-gray-500">{label}</p>
    </Carte>
  );
}
