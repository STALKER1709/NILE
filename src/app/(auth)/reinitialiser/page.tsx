import Link from "next/link";
import type { Metadata } from "next";
import { reinitialiserMotDePasseAction } from "@/app/(auth)/actions";
import { Carte, champClass, labelClass, btn } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ReinitialiserPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-nile-900 sm:text-3xl">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choisis un nouveau mot de passe pour ton compte (8 caractères minimum).
        </p>
      </div>

      {erreur && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <Carte className="p-6">
        <form action={reinitialiserMotDePasseAction} className="space-y-4">
          <div>
            <label htmlFor="motDePasse" className={labelClass}>Nouveau mot de passe</label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${champClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="confirmation" className={labelClass}>Confirme le mot de passe</label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${champClass} mt-1`}
            />
          </div>
          <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "lg", "w-full")}>
            Enregistrer le mot de passe
          </BoutonSoumettre>
        </form>
      </Carte>

      <p className="text-center text-sm text-slate-600">
        Lien expiré ?{" "}
        <Link href="/mot-de-passe-oublie" className="font-medium text-nile hover:underline">
          Redemander un email
        </Link>
      </p>
    </div>
  );
}
