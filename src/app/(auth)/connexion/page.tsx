import Link from "next/link";
import { connexionAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Connexion</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <form action={connexionAction} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required className={champ} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="motDePasse" className={label}>Mot de passe</label>
          <input id="motDePasse" name="motDePasse" type="password" required className={champ} autoComplete="current-password" />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
        >
          Se connecter
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-nile hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
