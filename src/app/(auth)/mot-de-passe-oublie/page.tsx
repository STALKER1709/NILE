import Link from "next/link";
import type { Metadata } from "next";
import { demanderReinitialisationAction } from "@/app/(auth)/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { erreur, ok } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-gray-500">
          Indique ton email : nous t&apos;enverrons un lien pour choisir un
          nouveau mot de passe.
        </p>
      </div>

      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}
      {ok === "envoye" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Si un compte existe avec cet email, un lien de réinitialisation vient
          d&apos;être envoyé. Pense à vérifier les spams.
        </p>
      )}

      <Carte className="p-6">
        <form action={demanderReinitialisationAction} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={`${champClass} mt-1`} />
          </div>
          <button type="submit" className={btn("primaire", "lg", "w-full")}>
            Envoyer le lien
          </button>
        </form>
      </Carte>

      <p className="text-center text-sm text-gray-600">
        <Link href="/connexion" className="font-medium text-nile hover:underline">← Retour à la connexion</Link>
      </p>
    </div>
  );
}
