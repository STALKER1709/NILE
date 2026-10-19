import Link from "next/link";
import { exigerVendeur } from "@/modules/auth/access";
import { getKycVendeur } from "@/modules/kyc/kyc";
import {
  libelleStatutKyc,
  badgeTonKyc,
  peutSoumettreKyc,
  type StatutKyc,
} from "@/modules/kyc/kyc-core";
import { soumettreKycAction } from "./actions";
import { Carte, Badge, champClass, labelClass, btn } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vérification d'identité (KYC) — Vendeur" };

export default async function VendeurKycPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const { vendeur } = await exigerVendeur();
  const kyc = await getKycVendeur(vendeur.id);

  const statut: StatutKyc = (kyc?.statut as StatutKyc) ?? "NON_SOUMIS";
  const peutEditer = peutSoumettreKyc(statut);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
            Vérification d'identité (KYC)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Conformité et sécurité des transactions sur NILE Marketplace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge ton={badgeTonKyc(statut)}>{libelleStatutKyc(statut)}</Badge>
          <Link href="/vendeur" className="text-sm text-slate-500 hover:underline">
            ← Tableau de bord
          </Link>
        </div>
      </div>

      {ok && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Votre dossier KYC a été soumis avec succès. Notre équipe va examiner vos
          pièces dans les plus brefs délais.
        </div>
      )}

      {erreur && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erreur}
        </div>
      )}

      {statut === "REJETE" && kyc?.motifRejet && (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Motif du refus de votre dossier :</p>
          <p className="mt-1 text-sm text-red-700">{kyc.motifRejet}</p>
          <p className="mt-2 text-xs text-red-600">
            Veuillez corriger les informations ou renouveler les photos ci-dessous
            puis re-soumettre votre dossier.
          </p>
        </div>
      )}

      {statut === "VALIDE" && (
        <Carte className="p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Votre identité est validée
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Votre boutique <span className="font-semibold text-slate-800">{vendeur.nomBoutique}</span> est certifiée. Vous pouvez publier vos produits et recevoir vos reversements.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/vendeur/produits" className={btn("primaire", "md")}>
              Gérer mes produits
            </Link>
            <Link href="/vendeur" className={btn("secondaire", "md")}>
              Retour à l'accueil vendeur
            </Link>
          </div>
        </Carte>
      )}

      {statut === "EN_REVUE" && (
        <Carte className="p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Dossier en cours d'examen
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Nos équipes vérifient l'authenticité de vos pièces d'identité et de votre selfie. Vous serez notifié dès que la validation sera effectuée.
          </p>
        </Carte>
      )}

      {peutEditer && (
        <Carte className="p-6">
          <form action={soumettreKycAction} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                1. Identité du responsable ou représentant
              </h2>
              <p className="text-xs text-slate-500">
                Informations telles qu'elles figurent sur votre document d'identité officiel.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="nomComplet" className={labelClass}>
                    Nom et prénoms complets <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nomComplet"
                    name="nomComplet"
                    required
                    defaultValue={kyc?.nomComplet ?? ""}
                    placeholder="Ex: Paul Biya"
                    className={champClass}
                  />
                </div>

                <div>
                  <label htmlFor="typePiece" className={labelClass}>
                    Type de pièce d'identité <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="typePiece"
                    name="typePiece"
                    required
                    defaultValue={kyc?.typePiece ?? "CNI"}
                    className={champClass}
                  >
                    <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                    <option value="PASSEPORT">Passeport</option>
                    <option value="RECEPISSE">Récépissé de CNI valide</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="numeroPiece" className={labelClass}>
                    Numéro de la pièce <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="numeroPiece"
                    name="numeroPiece"
                    required
                    defaultValue={kyc?.numeroPiece ?? ""}
                    placeholder="Ex: 108392019"
                    className={champClass}
                  />
                </div>

                <div>
                  <label htmlFor="dateExpirationPiece" className={labelClass}>
                    Date d'expiration <span className="text-slate-400">(si mentionnée)</span>
                  </label>
                  <input
                    id="dateExpirationPiece"
                    name="dateExpirationPiece"
                    type="date"
                    defaultValue={
                      kyc?.dateExpirationPiece
                        ? new Date(kyc.dateExpirationPiece).toISOString().split("T")[0]
                        : ""
                    }
                    className={champClass}
                  />
                </div>
              </div>
            </div>

            {/* Section Entreprise (optionnelle) */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                2. Entreprise ou établissement enregistré (facultatif)
              </h2>
              <p className="text-xs text-slate-500">
                Cochez si vous vendez sous une entité morale déclarée au Cameroun (SARL, Ets, SAS...).
              </p>

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="estEntreprise"
                    id="estEntreprise"
                    defaultChecked={kyc?.estEntreprise ?? false}
                    className="h-4 w-4 rounded border-slate-300 text-nile-700 focus:ring-nile-700"
                  />
                  <span>Je représente une société ou une boutique officiellement enregistrée</span>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="nomEntreprise" className={labelClass}>
                    Raison sociale ou nom d'entreprise
                  </label>
                  <input
                    id="nomEntreprise"
                    name="nomEntreprise"
                    defaultValue={kyc?.nomEntreprise ?? ""}
                    placeholder="Ex: Global Tech SARL"
                    className={champClass}
                  />
                </div>
                <div>
                  <label htmlFor="niu" className={labelClass}>
                    Numéro d'Identification Unique (NIU)
                  </label>
                  <input
                    id="niu"
                    name="niu"
                    defaultValue={kyc?.niu ?? ""}
                    placeholder="Ex: M051812345678A"
                    className={champClass}
                  />
                </div>
                <div>
                  <label htmlFor="rccm" className={labelClass}>
                    N° RCCM
                  </label>
                  <input
                    id="rccm"
                    name="rccm"
                    defaultValue={kyc?.rccm ?? ""}
                    placeholder="Ex: RC/DLA/2021/B/123"
                    className={champClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="registreCommerce" className={labelClass}>
                    Document RCCM ou Attestation fiscale <span className="text-slate-400">(PDF ou image)</span>
                  </label>
                  <input
                    id="registreCommerce"
                    name="registreCommerce"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className={champClass}
                  />
                </div>
              </div>
            </div>

            {/* Section Pièces & Selfie obligatoire */}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. Pièces d'identité & Selfie de vérification
              </h2>
              <p className="text-xs text-slate-500">
                Photos nettes, lisibles et sans reflets. Formats acceptés : JPEG, PNG, WEBP (max 2 Mo par fichier).
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="pieceRecto" className={labelClass}>
                    Photo Recto de la pièce d'identité <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pieceRecto"
                    name="pieceRecto"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required={!kyc?.pieceRectoUrl}
                    className={champClass}
                  />
                  {kyc?.pieceRectoUrl && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ Une photo recto a déjà été téléversée. Choisissez un nouveau fichier uniquement pour la remplacer.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="pieceVerso" className={labelClass}>
                    Photo Verso de la pièce d'identité <span className="text-slate-400">(Requis pour CNI et Récépissé)</span>
                  </label>
                  <input
                    id="pieceVerso"
                    name="pieceVerso"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={champClass}
                  />
                  {kyc?.pieceVersoUrl && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ Une photo verso a déjà été téléversée.
                    </p>
                  )}
                </div>

                {/* SELFIE OBLIGATOIRE */}
                <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <label htmlFor="selfie" className="block font-bold text-slate-900">
                        Selfie avec la pièce d'identité en main <span className="text-red-500">*</span>
                      </label>
                      <p className="mt-1 text-xs text-slate-600">
                        Pour garantir que la pièce d'identité vous appartient bien, prenez une photo de votre visage tenant votre document d'identité bien visible à côté de votre visage.
                      </p>
                      <input
                        id="selfie"
                        name="selfie"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required={!kyc?.selfieUrl}
                        className={`${champClass} mt-3 bg-white`}
                      />
                      {kyc?.selfieUrl && (
                        <p className="mt-1 text-xs text-emerald-600">
                          ✓ Votre selfie de vérification est enregistré. Choisissez un nouveau fichier pour le mettre à jour.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <BoutonSoumettre
              enCours="Téléversement et vérification…"
              className={btn("primaire", "lg", "w-full")}
            >
              Soumettre mon dossier de vérification
            </BoutonSoumettre>
          </form>
        </Carte>
      )}
    </div>
  );
}
