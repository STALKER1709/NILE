import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";
import { Carte } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Back-office" };

const LIENS = [
  { href: "/admin/vendeurs", titre: "Vendeurs", desc: "Valider / suspendre les boutiques" },
  { href: "/admin/commandes", titre: "Commandes & livraisons", desc: "Suivi, transporteur, preuve, refus" },
  { href: "/admin/moderation", titre: "Modération", desc: "Rejeter / réactiver des produits" },
  { href: "/admin/categories", titre: "Catégories", desc: "Gérer l'arborescence" },
  { href: "/admin/reconciliation", titre: "Réconciliation COD", desc: "Cash collecté / reversé" },
];

export default async function AdminPage() {
  await exigerRole("ADMIN");
  const [nbUtilisateurs, nbVendeurs, nbEnAttente, nbCommandes] = await Promise.all([
    prisma.utilisateur.count(),
    prisma.vendeur.count(),
    prisma.vendeur.count({ where: { statutValidation: "EN_ATTENTE" } }),
    prisma.commande.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Back-office</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Utilisateurs" valeur={nbUtilisateurs} />
        <Stat label="Vendeurs" valeur={nbVendeurs} />
        <Stat label="À valider" valeur={nbEnAttente} accent />
        <Stat label="Commandes" valeur={nbCommandes} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LIENS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Carte className="p-4 transition hover:shadow-flottant">
              <p className="font-semibold text-nile">{l.titre}</p>
              <p className="text-sm text-gray-500">{l.desc}</p>
            </Carte>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, valeur, accent = false }: { label: string; valeur: number; accent?: boolean }) {
  return (
    <Carte className="p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent && valeur > 0 ? "text-accent-dark" : "text-nile"}`}>{valeur}</p>
    </Carte>
  );
}
