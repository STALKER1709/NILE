import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { getSoldeVendeur } from "@/modules/reversement/reversement";
import { compterCommandesVendeur } from "@/modules/commande/vendeur";
import { Carte, Badge, Prix, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace vendeur" };

export default async function VendeurPage() {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
    include: { _count: { select: { produits: true } } },
  });
  const solde =
    vendeur && !vendeur.estBoutiqueMaison
      ? await getSoldeVendeur(vendeur.id)
      : null;
  const compteurs = vendeur ? await compterCommandesVendeur(vendeur.id) : null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Espace vendeur</h1>

      <Carte className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Boutique</p>
            <p className="text-lg font-semibold">{vendeur?.nomBoutique ?? "—"}</p>
          </div>
          <Badge ton={vendeur?.statutValidation === "VALIDE" ? "vert" : "ambre"}>
            {vendeur?.statutValidation}
          </Badge>
        </div>
        {vendeur?.statutValidation === "EN_ATTENTE" && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Votre boutique est en attente de validation. Vous pouvez préparer vos produits ;
            la publication sera possible une fois validée par un administrateur.
          </p>
        )}
        <p className="mt-3 text-sm text-gray-500">
          {vendeur?._count.produits ?? 0} produit(s) dans votre boutique.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/vendeur/produits" className={btn("primaire", "md")}>
            Gérer mes produits
          </Link>
          <Link href="/vendeur/commandes" className={btn("secondaire", "md")}>
            Mes commandes
            {compteurs && compteurs.aPreparer > 0 && (
              <span className="ml-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                {compteurs.aPreparer}
              </span>
            )}
          </Link>
        </div>
      </Carte>

      {solde && (
        <Carte className="p-5">
          <h2 className="font-semibold">Mes gains</h2>
          <p className="mt-1 text-xs text-gray-500">
            Une vente est comptée quand la commande est livrée et payée.
            Commission NILE : {solde.tauxPourcent} %.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500">Ventes livrées</dt>
              <dd className="font-medium"><Prix montant={solde.brut} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Net vendeur</dt>
              <dd className="font-medium"><Prix montant={solde.net} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Déjà reversé</dt>
              <dd className="font-medium"><Prix montant={solde.dejaReverse} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Reste à recevoir</dt>
              <dd className="text-lg font-bold text-nile"><Prix montant={solde.solde} /></dd>
            </div>
          </dl>
        </Carte>
      )}
    </div>
  );
}
