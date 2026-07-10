import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { Carte, Badge, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace vendeur" };

export default async function VendeurPage() {
  const utilisateur = await exigerRole("VENDEUR");
  const vendeur = await prisma.vendeur.findUnique({
    where: { utilisateurId: utilisateur.id },
    include: { _count: { select: { produits: true } } },
  });

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
        <Link href="/vendeur/produits" className={btn("primaire", "md", "mt-4")}>
          Gérer mes produits
        </Link>
      </Carte>
    </div>
  );
}
