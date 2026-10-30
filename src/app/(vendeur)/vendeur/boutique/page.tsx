import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { Carte, btn, champClass, labelClass } from "@/components/ui/kit";
import { enregistrerVitrineAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma vitrine publique" };

export default async function VitrineVendeurPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { vendeur } = await exigerVendeur();
  const { ok, erreur } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Ma vitrine publique</h1><p className="mt-1 text-sm text-slate-500">Choisissez les informations visibles par les acheteurs.</p></div>
        <Link href="/vendeur" className="text-sm text-nile hover:underline">← Espace vendeur</Link>
      </div>
      {ok && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Informations enregistrées.</p>}
      {erreur && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}
      <Carte className="p-5">
        <form action={enregistrerVitrineAction} className="space-y-4">
          <div><label htmlFor="localisationPublique" className={labelClass}>Localisation de la boutique</label><input id="localisationPublique" name="localisationPublique" maxLength={160} defaultValue={vendeur.localisationPublique ?? ""} placeholder="Ex. Odza, Yaoundé" className={`${champClass} mt-1`} /><p className="mt-1 text-xs text-slate-500">Cette localisation sera visible sur votre boutique publique.</p></div>
          <div><label htmlFor="telephonePublic" className={labelClass}>Téléphone professionnel</label><input id="telephonePublic" name="telephonePublic" type="tel" maxLength={30} defaultValue={vendeur.telephonePublic ?? ""} placeholder="+237 6XX XXX XXX" className={`${champClass} mt-1`} /></div>
          <div><label htmlFor="whatsappPublic" className={labelClass}>WhatsApp professionnel</label><input id="whatsappPublic" name="whatsappPublic" type="tel" maxLength={30} defaultValue={vendeur.whatsappPublic ?? ""} placeholder="2376XXXXXXXX" className={`${champClass} mt-1`} /><p className="mt-1 text-xs text-slate-500">Saisissez le numéro avec l’indicatif pays, sans le signe +.</p></div>
          <div><label htmlFor="emailPublic" className={labelClass}>E-mail professionnel</label><input id="emailPublic" name="emailPublic" type="email" maxLength={160} defaultValue={vendeur.emailPublic ?? ""} placeholder="contact@votreboutique.cm" className={`${champClass} mt-1`} /></div>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"><input type="checkbox" name="afficherCoordonnees" defaultChecked={vendeur.afficherCoordonnees} className="mt-1 h-4 w-4 accent-nile-700" /><span><strong className="block text-sm text-slate-900">Afficher mes coordonnées sur la boutique</strong><span className="text-xs text-slate-500">Sans cette option, seuls le nom, la description et la localisation publique restent visibles. Votre téléphone personnel et votre e-mail de connexion ne sont jamais exposés.</span></span></label>
          <button type="submit" className={btn("primaire", "lg", "w-full")}>Enregistrer ma vitrine</button>
        </form>
      </Carte>
    </div>
  );
}
