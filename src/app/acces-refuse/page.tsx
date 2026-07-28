import Link from "next/link";
import { btn } from "@/components/ui/kit";

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
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="text-2xl font-black tracking-tight text-nile-900 sm:text-3xl">Accès refusé</h1>
      <p className="text-slate-600">{message}</p>
      <Link href="/" className={btn("primaire", "md")}>Retour à l'accueil</Link>
    </div>
  );
}
