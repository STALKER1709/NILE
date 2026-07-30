import Link from "next/link";
import { exigerConnexion } from "@/modules/auth/access";
import {
  getBoutiqueDuVendeur,
  lireInfosPaiement,
  aDesInfosPaiement,
} from "@/modules/compte/profil";
import {
  mettreAJourProfilAction,
  mettreAJourBoutiqueAction,
  mettreAJourInfosPaiementAction,
  changerMotDePasseAction,
} from "@/app/(compte)/compte/profil/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, btn, champClass, labelClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil" };

const MESSAGES_OK: Record<string, string> = {
  profil: "Vos informations ont été enregistrées.",
  boutique: "Votre boutique a été mise à jour.",
  paiement: "Vos coordonnées de reversement ont été enregistrées.",
  mdp: "Votre mot de passe a été modifié.",
};

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const utilisateur = await exigerConnexion();
  const boutique =
    utilisateur.role === "VENDEUR"
      ? await getBoutiqueDuVendeur(utilisateur.id)
      : null;
  const infos = lireInfosPaiement(boutique?.infosPaiement);

  return (
    <div className="space-y-6">
      <div>
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-corps-sm text-slate-500">
          <Link href="/compte" className="transition-colors hover:text-nile-700">Mon compte</Link>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-900">Mon profil</span>
        </nav>
        <h1 className="mt-1 text-titre-sm text-nile-800 sm:text-titre-md">Mon profil</h1>
        <p className="mt-1 text-corps-sm text-slate-500">
          Vos informations personnelles
          {boutique ? ", votre boutique" : ""} et votre mot de passe.
        </p>
      </div>

      {ok && MESSAGES_OK[ok] && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <div className="grid grid-cols-1 items-start gap-gouttiere lg:grid-cols-12">
        <div className="space-y-gouttiere lg:col-span-8">
          {/* Informations personnelles */}
          <Carte className="p-5 sm:p-6">
            <EnteteSection
              titre="Informations personnelles"
              icone={
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" strokeLinecap="round" />
                </>
              }
            />
            <form action={mettreAJourProfilAction} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="nom" className={labelClass}>Nom complet</label>
                  <input id="nom" name="nom" required defaultValue={utilisateur.nom} className={`${champClass} mt-1`} />
                </div>
                <div>
                  <label htmlFor="telephone" className={labelClass}>Téléphone</label>
                  <input id="telephone" name="telephone" required defaultValue={utilisateur.telephone} placeholder="6XX XXX XXX" className={`${champClass} mt-1`} />
                </div>
              </div>

              {/* L'email est l'identifiant de connexion : affiché, non modifiable. */}
              <div>
                <label htmlFor="email" className={labelClass}>Adresse e-mail</label>
                {/* Variantes `disabled:` : elles gagnent sur le `bg-white` de
                    champClass, l'ordre des classes ne suffirait pas. */}
                <input
                  id="email"
                  value={utilisateur.email}
                  disabled
                  readOnly
                  className={`${champClass} mt-1 disabled:cursor-not-allowed disabled:bg-surface-moyenne disabled:text-slate-500`}
                />
                <p className="mt-1 text-etiquette-xs text-slate-500">
                  L&apos;e-mail sert d&apos;identifiant de connexion et ne peut
                  pas être changé ici. Écrivez au support si nécessaire.
                </p>
              </div>

              <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "md")}>
                Enregistrer
              </BoutonSoumettre>
            </form>
          </Carte>

          {/* Boutique — vendeurs uniquement */}
          {boutique && (
            <Carte className="p-5 sm:p-6">
              <EnteteSection
                titre="Ma boutique"
                icone={
                  <>
                    <path d="M4 9h16l-1 11H5L4 9z" strokeLinejoin="round" />
                    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                  </>
                }
              />
              {boutique.statutValidation !== "VALIDE" && (
                <p className="mt-4 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
                  Boutique <strong>{boutique.statutValidation}</strong> · vos
                  produits seront publiables une fois la boutique validée.
                </p>
              )}
              <form action={mettreAJourBoutiqueAction} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="nomBoutique" className={labelClass}>Nom de la boutique</label>
                  <input id="nomBoutique" name="nomBoutique" required defaultValue={boutique.nomBoutique} className={`${champClass} mt-1`} />
                  <p className="mt-1 text-etiquette-xs text-slate-500">
                    Visible par les acheteurs sur vos fiches produit.
                  </p>
                </div>
                <div>
                  <label htmlFor="description" className={labelClass}>
                    Description (facultatif)
                  </label>
                  <textarea id="description" name="description" rows={4} maxLength={1000} defaultValue={boutique.description ?? ""} placeholder="Ce que vous vendez, vos délais, votre zone de livraison…" className={`${champClass} mt-1`} />
                </div>
                <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "md")}>
                  Enregistrer la boutique
                </BoutonSoumettre>
              </form>
            </Carte>
          )}

          {/* Coordonnées de reversement — vendeurs uniquement */}
          {boutique && (
            <Carte className="p-5 sm:p-6">
              <EnteteSection
                titre="Coordonnées de reversement"
                icone={
                  <>
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </>
                }
              />
              <p className="mt-3 text-corps-sm text-slate-600">
                Les numéros Mobile Money sur lesquels NILE vous envoie vos gains.
                Au moins l&apos;un des deux est nécessaire pour être payé.
              </p>
              {!aDesInfosPaiement(infos) && (
                <p className="mt-3 rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-sm text-amber-800">
                  Aucun numéro enregistré : renseignez-en un pour que vos
                  reversements puissent être effectués.
                </p>
              )}
              <form action={mettreAJourInfosPaiementAction} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="momoMtn" className={labelClass}>
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-5 w-8 place-items-center rounded bg-[#ffcb05] text-[9px] font-bold text-black">MTN</span>
                        MTN MoMo
                      </span>
                    </label>
                    <input id="momoMtn" name="momoMtn" defaultValue={infos.momoMtn ?? ""} placeholder="6XX XXX XXX" className={`${champClass} mt-1`} />
                  </div>
                  <div>
                    <label htmlFor="momoOrange" className={labelClass}>
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-5 w-8 place-items-center rounded bg-[#ff7900] text-[9px] font-bold text-white">OM</span>
                        Orange Money
                      </span>
                    </label>
                    <input id="momoOrange" name="momoOrange" defaultValue={infos.momoOrange ?? ""} placeholder="6XX XXX XXX" className={`${champClass} mt-1`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="titulaire" className={labelClass}>
                    Nom du titulaire (facultatif)
                  </label>
                  <input id="titulaire" name="titulaire" defaultValue={infos.titulaire ?? ""} placeholder="Nom associé au compte Mobile Money" className={`${champClass} mt-1`} />
                </div>
                <BoutonSoumettre enCours="Enregistrement…" className={btn("primaire", "md")}>
                  Enregistrer les coordonnées
                </BoutonSoumettre>
              </form>
            </Carte>
          )}
        </div>

        {/* Sécurité */}
        <div className="space-y-gouttiere lg:col-span-4">
          <Carte className="p-5 sm:p-6">
            <EnteteSection
              titre="Mot de passe"
              icone={
                <>
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </>
              }
            />
            <form action={changerMotDePasseAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="motDePasse" className={labelClass}>Nouveau mot de passe</label>
                <input id="motDePasse" name="motDePasse" type="password" required minLength={8} autoComplete="new-password" className={`${champClass} mt-1`} />
                <p className="mt-1 text-etiquette-xs text-slate-500">8 caractères minimum.</p>
              </div>
              <div>
                <label htmlFor="confirmation" className={labelClass}>Confirmation</label>
                <input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" className={`${champClass} mt-1`} />
              </div>
              <BoutonSoumettre enCours="Modification…" className={btn("secondaire", "md", "w-full")}>
                Changer le mot de passe
              </BoutonSoumettre>
            </form>
          </Carte>

          <div className="rounded border border-contour-carte bg-surface-basse p-5">
            <h2 className="text-etiquette-md text-nile-800">Besoin d&apos;aide ?</h2>
            <p className="mt-2 text-corps-sm text-slate-600">
              Changement d&apos;e-mail, suppression de compte ou question sur vos
              reversements : notre équipe s&apos;en occupe.
            </p>
            <Link href="/aide" className="mt-4 inline-flex items-center gap-2 text-etiquette-md text-nile-700 transition-transform hover:translate-x-1">
              Contacter le support
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Titre de section : icône teal + libellé. */
function EnteteSection({
  titre,
  icone,
}: {
  titre: string;
  icone: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-titre-sm text-nile-800">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
        {icone}
      </svg>
      {titre}
    </h2>
  );
}
