import Link from "next/link";
import { inscriptionAction } from "@/app/(auth)/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";
import { PanneauMarque } from "@/components/auth/PanneauMarque";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";
export const metadata = { title: "Créer un compte" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suite?: string }>;
}) {
  const { erreur, suite } = await searchParams;
  const suiteSure = suite?.startsWith("/") && !suite.startsWith("//") ? suite : "";

  return (
    <div className="mx-auto grid max-w-4xl gap-6 py-6 lg:grid-cols-2">
      <PanneauMarque />
      <div className="mx-auto w-full max-w-md space-y-4 lg:mx-0">
      <div className="text-center">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-500">Rejoignez NILE Marketplace en quelques secondes.</p>
      </div>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-6">
        <form action={inscriptionAction} className="space-y-4">
          {suiteSure && <input type="hidden" name="suite" value={suiteSure} />}
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
            <p className="mt-1 text-xs text-slate-500">Au moins 8 caractères.</p>
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
              Nom de la boutique <span className="text-slate-400">(vendeurs)</span>
            </label>
            <input id="nomBoutique" name="nomBoutique" className={`${champClass} mt-1`} />
            <p className="mt-1 text-xs text-slate-500">Requis si vous vendez. Boutique validée par un administrateur.</p>
          </div>
          <BoutonSoumettre enCours="Création du compte…" className={btn("primaire", "lg", "w-full")}>Créer mon compte</BoutonSoumettre>
        </form>
      </Carte>

      <p className="text-center text-sm text-slate-600">
        Déjà un compte ?{" "}
        <Link
          href={suiteSure ? `/connexion?suite=${encodeURIComponent(suiteSure)}` : "/connexion"}
          className="font-medium text-nile hover:underline"
        >
          Se connecter
        </Link>
      </p>
      </div>
    </div>
  );
}
