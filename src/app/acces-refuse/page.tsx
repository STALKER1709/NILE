import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccesRefusePage({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string }>;
}) {
  const { motif } = await searchParams;
  const message =
    motif === "suspendu"
      ? "Votre compte est suspendu. Contactez le support."
      : "Vous n'avez pas les droits pour accéder à cette page.";

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-xl font-bold">Accès refusé</h1>
      <p className="text-gray-600">{message}</p>
      <Link href="/" className="inline-block text-sm text-nile hover:underline">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
