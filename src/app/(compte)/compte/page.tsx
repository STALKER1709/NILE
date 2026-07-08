import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { Carte, Badge, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const utilisateur = await exigerConnexion();
  const vendeur =
    utilisateur.role === "VENDEUR"
      ? await prisma.vendeur.findUnique({ where: { utilisateurId: utilisateur.id } })
      : null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Mon compte</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Raccourci href="/commandes" libelle="Mes commandes" />
        <Raccourci href="/panier" libelle="Mon panier" />
        <Raccourci href="/catalogue" libelle="Catalogue" />
        {utilisateur.role === "VENDEUR" && <Raccourci href="/vendeur" libelle="Espace vendeur" />}
        {utilisateur.role === "ADMIN" && <Raccourci href="/admin" libelle="Back-office" />}
      </div>

      <Carte className="p-5">
        <h2 className="mb-3 font-semibold">Informations</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Info label="Nom" valeur={utilisateur.nom} />
          <Info label="Email" valeur={utilisateur.email} />
          <Info label="Téléphone" valeur={utilisateur.telephone} />
          <div>
            <dt className="text-gray-500">Rôle</dt>
            <dd className="mt-0.5"><Badge ton="bleu">{utilisateur.role}</Badge></dd>
          </div>
        </dl>
      </Carte>

      {vendeur && (
        <Carte className="p-5">
          <h2 className="font-semibold">Ma boutique</h2>
          <p className="mt-1 text-sm text-gray-600">{vendeur.nomBoutique}</p>
          <div className="mt-2"><Badge ton={vendeur.statutValidation === "VALIDE" ? "vert" : "ambre"}>{vendeur.statutValidation}</Badge></div>
          <Link href="/vendeur" className={btn("secondaire", "sm", "mt-3")}>Gérer mes produits</Link>
        </Carte>
      )}
    </div>
  );
}

function Raccourci({ href, libelle }: { href: string; libelle: string }) {
  return (
    <Link href={href} className="rounded-xl2 border border-gray-100 bg-white p-4 text-center text-sm font-medium text-gray-700 shadow-carte transition hover:border-nile hover:text-nile">
      {libelle}
    </Link>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{valeur}</dd>
    </div>
  );
}
