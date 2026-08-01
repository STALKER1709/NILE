import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { listerCommandesAcheteur } from "@/modules/commande/commande";
import { Carte, Prix, EtatVide, btn } from "@/components/ui/kit";
import {
  BadgeStatutCommande,
  BadgeStatutPaiement,
} from "@/components/commande/StatutBadges";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { racheterCommandeAction } from "@/app/(compte)/commandes/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

export default async function MesCommandesPage() {
  const utilisateur = await exigerConnexion();
  const commandes = await listerCommandesAcheteur(utilisateur.id);

  return (
    <div className="space-y-5">
      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Mes commandes</h1>

      {commandes.length === 0 ? (
        <EtatVide titre="Aucune commande pour l'instant.">
          <Link href="/catalogue" className="text-nile hover:underline">Parcourir le catalogue</Link>
        </EtatVide>
      ) : (
        <div className="space-y-3">
          {/* La carte n'est pas un lien englobant : elle contient un
              formulaire (rachat), qu'un <a> parent rendrait invalide. Seul le
              bloc d'informations est cliquable. */}
          {commandes.map((c) => (
            <Carte key={c.id} className="p-4 transition hover:shadow-flottant">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/commandes/${c.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold">{c.numero}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.dateCreation).toLocaleDateString("fr-FR")} · {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <BadgeStatutCommande statut={c.statutCommande} />
                    <BadgeStatutPaiement statut={c.statutPaiement} />
                  </div>
                </Link>
                <Prix montant={c.total} className="shrink-0 text-lg font-bold text-nile" />
              </div>

              <form action={racheterCommandeAction} className="mt-3 border-t border-contour-carte pt-3">
                <input type="hidden" name="commandeId" value={c.id} />
                <BoutonSoumettre enCours="Ajout…" className={btn("ghost", "sm")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
                    <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Ajouter au panier actuel
                </BoutonSoumettre>
              </form>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}
