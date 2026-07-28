import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerVendeurs } from "@/modules/admin/vendeurs";
import { changerStatutVendeurAction } from "@/app/(admin)/admin/vendeurs/actions";
import { Carte, Badge, btn, EtatVide } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

function BoutonStatut({ vendeurId, statut, libelle, variante }: {
  vendeurId: string; statut: string; libelle: string;
  variante: "primaire" | "danger" | "secondaire";
}) {
  return (
    <form action={changerStatutVendeurAction}>
      <input type="hidden" name="vendeurId" value={vendeurId} />
      <input type="hidden" name="statut" value={statut} />
      <button type="submit" className={btn(variante, "sm")}>{libelle}</button>
    </form>
  );
}

export default async function AdminVendeursPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  await exigerRole("ADMIN");
  const vendeurs = await listerVendeurs();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Vendeurs</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      {ok && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Statut mis à jour.</p>}
      {erreur && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      {vendeurs.length === 0 ? (
        <EtatVide titre="Aucun vendeur." />
      ) : (
        <div className="space-y-2">
          {vendeurs.map((v) => (
            <Carte key={v.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {v.nomBoutique}
                  {v.estBoutiqueMaison && <span className="ml-2"><Badge ton="bleu">maison</Badge></span>}
                </p>
                <p className="text-xs text-slate-500">{v.utilisateur.nom} · {v.utilisateur.email} · {v._count.produits} produit(s)</p>
              </div>
              <Badge ton={v.statutValidation === "VALIDE" ? "vert" : v.statutValidation === "EN_ATTENTE" ? "ambre" : "rouge"}>{v.statutValidation}</Badge>
              <div className="flex gap-2">
                {v.statutValidation !== "VALIDE" && <BoutonStatut vendeurId={v.id} statut="VALIDE" libelle="Valider" variante="primaire" />}
                {v.statutValidation === "EN_ATTENTE" && <BoutonStatut vendeurId={v.id} statut="REJETE" libelle="Rejeter" variante="danger" />}
                {v.statutValidation === "VALIDE" && <BoutonStatut vendeurId={v.id} statut="SUSPENDU" libelle="Suspendre" variante="danger" />}
              </div>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}
