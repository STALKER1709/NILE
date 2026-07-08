import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await exigerRole("ADMIN");

  const [nbUtilisateurs, nbVendeurs, nbVendeursEnAttente] = await Promise.all([
    prisma.utilisateur.count(),
    prisma.vendeur.count(),
    prisma.vendeur.count({ where: { statutValidation: "EN_ATTENTE" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Back-office administrateur</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Utilisateurs" valeur={nbUtilisateurs} />
        <StatCard label="Vendeurs" valeur={nbVendeurs} />
        <StatCard label="Vendeurs en attente" valeur={nbVendeursEnAttente} />
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Gestion</h2>
        <Link href="/admin/categories" className="text-sm text-nile hover:underline">
          → Gérer les catégories
        </Link>
      </section>

      <section className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
        La validation des vendeurs, la modération du catalogue et la supervision
        des paiements arrivent en <strong>Phase 4</strong>.
      </section>
    </div>
  );
}

function StatCard({ label, valeur }: { label: string; valeur: number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-nile">{valeur}</p>
    </div>
  );
}
