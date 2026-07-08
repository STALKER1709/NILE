import Link from "next/link";
import { inscriptionAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const champ =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-nile focus:outline-none focus:ring-1 focus:ring-nile";
const label = "block text-sm font-medium text-gray-700";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Créer un compte</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <form action={inscriptionAction} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="nom" className={label}>Nom complet</label>
          <input id="nom" name="nom" required className={champ} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required className={champ} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="telephone" className={label}>Téléphone</label>
          <input id="telephone" name="telephone" required className={champ} placeholder="6XX XXX XXX" autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="motDePasse" className={label}>Mot de passe</label>
          <input id="motDePasse" name="motDePasse" type="password" required minLength={8} className={champ} autoComplete="new-password" />
          <p className="mt-1 text-xs text-gray-500">Au moins 8 caractères.</p>
        </div>
        <div>
          <label htmlFor="role" className={label}>Je veux</label>
          <select id="role" name="role" required className={champ} defaultValue="ACHETEUR">
            <option value="ACHETEUR">Acheter des produits</option>
            <option value="VENDEUR">Vendre des produits</option>
          </select>
        </div>
        <div>
          <label htmlFor="nomBoutique" className={label}>
            Nom de la boutique <span className="text-gray-400">(vendeurs)</span>
          </label>
          <input id="nomBoutique" name="nomBoutique" className={champ} />
          <p className="mt-1 text-xs text-gray-500">
            Requis si vous choisissez « Vendre ». Un compte vendeur est validé par un administrateur.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark"
        >
          Créer mon compte
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-nile hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
