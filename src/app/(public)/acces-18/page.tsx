import Link from "next/link";
import { redirect } from "next/navigation";
import { aConfirmeMajorite } from "@/modules/catalogue/acces-18";
import { confirmerMajoriteAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accès réservé aux adultes | NILE", robots: { index: false, follow: false } };

export default async function Acces18Page({
  searchParams,
}: {
  searchParams: Promise<{ retour?: string }>;
}) {
  const { retour } = await searchParams;
  const destination = retour?.startsWith("/") && !retour.startsWith("//") ? retour : "/catalogue";
  if (await aConfirmeMajorite()) redirect(destination);

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Espace à accès limité</p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Contenu réservé aux adultes</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Cette rubrique est réservée aux personnes âgées de 18 ans ou plus. En continuant,
        vous déclarez avoir au moins 18 ans. Votre choix est mémorisé sur cet appareil
        pendant 30 jours.
      </p>
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Cette déclaration est un contrôle d’accès déclaratif, pas une vérification officielle
        de votre identité ou de votre date de naissance.
      </p>
      <form action={confirmerMajoriteAction} className="mt-6 space-y-3">
        <input type="hidden" name="retour" value={destination} />
        <button name="confirme" value="oui" className="w-full rounded-xl bg-nile-800 px-5 py-3 font-bold text-white hover:bg-nile-700">
          J’ai 18 ans ou plus — continuer
        </button>
        <Link href="/catalogue" className="block rounded-xl border border-stone-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Quitter cette rubrique
        </Link>
      </form>
    </section>
  );
}
