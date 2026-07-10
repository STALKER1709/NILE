import Link from "next/link";
import { inscriptionAction } from "@/app/(auth)/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Créer un compte" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-sm text-gray-500">Rejoignez NILE Marketplace en quelques secondes.</p>
      </div>

      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-6">
        <form action={inscriptionAction} className="space-y-4">
          <div>
            <label htmlFor="nom" className={labelClass}>Nom complet</label>
            <input id="nom" name="nom" required autoComplete="name" className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="telephone" className={labelClass}>Téléphone</label>
            <input id="telephone" name="telephone" required placeholder="6XX XXX XXX" autoComplete="tel" className={`${champClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="motDePasse" className={labelClass}>Mot de passe</label>
            <input id="motDePasse" name="motDePasse" type="password" required minLength={8} autoComplete="new-password" className={`${champClass} mt-1`} />
            <p className="mt-1 text-xs text-gray-500">Au moins 8 caractères.</p>
          </div>
          <div>
            <label htmlFor="role" className={labelClass}>Je veux</label>
            <select id="role" name="role" required defaultValue="ACHETEUR" className={`${champClass} mt-1`}>
              <option value="ACHETEUR">Acheter des produits</option>
              <option value="VENDEUR">Vendre des produits</option>
            </select>
          </div>
          <div>
            <label htmlFor="nomBoutique" className={labelClass}>
              Nom de la boutique <span className="text-gray-400">(vendeurs)</span>
            </label>
            <input id="nomBoutique" name="nomBoutique" className={`${champClass} mt-1`} />
            <p className="mt-1 text-xs text-gray-500">Requis si vous vendez. Boutique validée par un administrateur.</p>
          </div>
          <button type="submit" className={btn("primaire", "lg", "w-full")}>Créer mon compte</button>
        </form>
      </Carte>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-nile hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
