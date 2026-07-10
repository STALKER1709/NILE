import Link from "next/link";
import { connexionAction } from "@/app/(auth)/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Content de vous revoir</h1>
        <p className="mt-1 text-sm text-gray-500">Connectez-vous à votre compte NILE.</p>
      </div>

      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-6">
        <form action={connexionAction} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={`${champClass} mt-1`} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="motDePasse" className={labelClass}>Mot de passe</label>
              <Link href="/mot-de-passe-oublie" className="text-xs text-nile hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <input id="motDePasse" name="motDePasse" type="password" required autoComplete="current-password" className={`${champClass} mt-1`} />
          </div>
          <button type="submit" className={btn("primaire", "lg", "w-full")}>Se connecter</button>
        </form>
      </Carte>

      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-nile hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
