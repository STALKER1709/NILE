import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { listerCategories } from "@/modules/catalogue/categories";
import { axesParCategorie } from "@/modules/catalogue/axes";
import { listerMarquesVendeur } from "@/modules/catalogue/produits";
import { creerProduitAction } from "@/app/(vendeur)/vendeur/produits/actions";
import { FormulaireNouveauProduit } from "./FormulaireNouveauProduit";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const [categoriesBrutes, marques] = await Promise.all([
    listerCategories(),
    listerMarquesVendeur(vendeur.id),
  ]);
  const categories = categoriesBrutes.map(({ id, nom, parentId }) => ({ id, nom, parentId }));
  const axes = await axesParCategorie(categoriesBrutes.map((c) => c.id));
  const axesJSON = Object.fromEntries([...axes.entries()]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B192C] sm:text-3xl">Ajouter un produit</h1>
          <p className="mt-1 text-sm text-slate-500">Créez une fiche et gérez toutes ses variantes au même endroit.</p>
        </div>
        <Link href="/vendeur/produits" className="shrink-0 text-sm text-slate-500 hover:underline">← Retour</Link>
      </div>
      {erreur && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Aucune catégorie n’est disponible. Un administrateur doit en créer avant que vous puissiez ajouter un produit.
        </div>
      ) : (
        <FormulaireNouveauProduit categories={categories} axesParCategorie={axesJSON} marques={marques} action={creerProduitAction} />
      )}
    </div>
  );
}
