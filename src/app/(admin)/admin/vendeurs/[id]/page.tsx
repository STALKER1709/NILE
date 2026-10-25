import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerRole } from "@/modules/auth/access";
import { getVendeurDetail } from "@/modules/admin/vendeurs";
import { resoudreUrlKyc } from "@/modules/kyc/kyc-storage";
import {
  libelleStatutKyc,
  badgeTonKyc,
  peutValiderKyc,
  type StatutKyc,
} from "@/modules/kyc/kyc-core";
import {
  validerKycAdminAction,
  rejeterKycAdminAction,
} from "@/app/(admin)/admin/vendeurs/actions";
import { Carte, Badge, btn, champClass, labelClass } from "@/components/ui/kit";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";

export const dynamic = "force-dynamic";

export default async function AdminVendeurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await exigerRole("ADMIN");
  const { id } = await params;
  const { ok, erreur } = await searchParams;

  const vendeur = await getVendeurDetail(id);
  if (!vendeur) notFound();

  const kycBrut = vendeur.kyc;
  // Les URL signées ne sont générées qu'après exigerRole("ADMIN") ci-dessus.
  const kyc = kycBrut ? {
    ...kycBrut,
    pieceRectoUrl: await resoudreUrlKyc(kycBrut.pieceRectoUrl, kycBrut.pieceRectoChemin),
    pieceVersoUrl: await resoudreUrlKyc(kycBrut.pieceVersoUrl, kycBrut.pieceVersoChemin),
    selfieUrl: await resoudreUrlKyc(kycBrut.selfieUrl, kycBrut.selfieChemin),
    registreCommerceUrl: await resoudreUrlKyc(kycBrut.registreCommerceUrl, kycBrut.registreCommerceChemin),
  } : null;
  const statutKyc: StatutKyc = (kyc?.statut as StatutKyc) ?? "NON_SOUMIS";
  const peutAgir = peutValiderKyc(statutKyc);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">
              Dossier Vendeur · {vendeur.nomBoutique}
            </h1>
            {vendeur.estBoutiqueMaison && <Badge ton="bleu">Maison</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {vendeur.utilisateur.nom} · {vendeur.utilisateur.email} · {vendeur.utilisateur.telephone}
          </p>
        </div>
        <Link href="/admin/vendeurs" className="text-sm text-slate-500 hover:underline">
          ← Retour aux vendeurs
        </Link>
      </div>

      {ok && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {ok}
        </div>
      )}

      {erreur && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erreur}
        </div>
      )}

      {/* Résumé statuts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Carte className="p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Statut Boutique</p>
          <div className="mt-2 flex items-center justify-between">
            <Badge
              ton={
                vendeur.statutValidation === "VALIDE"
                  ? "vert"
                  : vendeur.statutValidation === "EN_ATTENTE"
                  ? "ambre"
                  : "rouge"
              }
            >
              {vendeur.statutValidation}
            </Badge>
            <span className="text-xs text-slate-400">
              {vendeur._count.produits} produit(s)
            </span>
          </div>
        </Carte>

        <Carte className="p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Statut KYC (Identité)</p>
          <div className="mt-2 flex items-center justify-between">
            <Badge ton={badgeTonKyc(statutKyc)}>
              {libelleStatutKyc(statutKyc)}
            </Badge>
            {kyc?.dateSoumission && (
              <span className="text-xs text-slate-400">
                Soumis le {new Date(kyc.dateSoumission).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </Carte>
      </div>

      {/* Dossier KYC */}
      {!kyc || statutKyc === "NON_SOUMIS" ? (
        <Carte className="p-8 text-center">
          <p className="text-base font-semibold text-slate-700">Aucun dossier KYC soumis</p>
          <p className="mt-1 text-xs text-slate-400">
            Ce vendeur n'a pas encore téléversé ses pièces d'identité ni son selfie de vérification.
          </p>
        </Carte>
      ) : (
        <div className="space-y-6">
          {/* Informations déclarées */}
          <Carte className="p-6">
            <h2 className="text-base font-bold text-slate-900">
              Informations d'identité déclarées
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Nom complet sur la pièce</dt>
                <dd className="font-semibold text-slate-900">{kyc.nomComplet ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Type de pièce</dt>
                <dd className="font-semibold text-slate-900">{kyc.typePiece}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Numéro de pièce</dt>
                <dd className="font-mono font-medium text-slate-900">{kyc.numeroPiece ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Date d'expiration</dt>
                <dd className="font-medium text-slate-900">
                  {kyc.dateExpirationPiece
                    ? new Date(kyc.dateExpirationPiece).toLocaleDateString("fr-FR")
                    : "Non renseignée / Illimitée"}
                </dd>
              </div>
            </dl>

            {kyc.estEntreprise && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-800">Données Entreprise</h3>
                <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Raison sociale</dt>
                    <dd className="font-semibold text-slate-900">{kyc.nomEntreprise ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">NIU</dt>
                    <dd className="font-mono text-slate-900">{kyc.niu ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">RCCM</dt>
                    <dd className="font-mono text-slate-900">{kyc.rccm ?? "-"}</dd>
                  </div>
                  {kyc.registreCommerceUrl && (
                    <div>
                      <dt className="text-xs text-slate-500">Justificatif RCCM</dt>
                      <dd>
                        <a
                          href={kyc.registreCommerceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-nile hover:underline"
                        >
                          Ouvrir le document ↗
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </Carte>

          {/* Comparaison visuelle : Pièce d'identité vs Selfie */}
          <Carte className="p-6">
            <h2 className="text-base font-bold text-slate-900">
              Contrôle visuel : Pièce d'identité vs Selfie de vérification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Vérifiez attentivement que la personne sur le selfie est bien celle qui figure sur la pièce d'identité officielle.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {/* Selfie */}
              <div className="rounded-lg border-2 border-amber-400 bg-amber-50/30 p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  📸 Selfie de vérification (Obligatoire)
                </span>
                <div className="mt-2 aspect-[3/4] overflow-hidden rounded bg-slate-100">
                  {kyc.selfieUrl ? (
                    <a href={kyc.selfieUrl} target="_blank" rel="noreferrer">
                      <img
                        src={kyc.selfieUrl}
                        alt="Selfie vendeur"
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      Aucun selfie
                    </div>
                  )}
                </div>
                {kyc.selfieUrl && (
                  <a
                    href={kyc.selfieUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-center text-xs text-slate-500 hover:underline"
                  >
                    Agrandir l'image ↗
                  </a>
                )}
              </div>

              {/* Recto */}
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  📄 Pièce d'identité (Recto)
                </span>
                <div className="mt-2 aspect-[3/4] overflow-hidden rounded bg-slate-100">
                  {kyc.pieceRectoUrl ? (
                    <a href={kyc.pieceRectoUrl} target="_blank" rel="noreferrer">
                      <img
                        src={kyc.pieceRectoUrl}
                        alt="Pièce recto"
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      Non fourni
                    </div>
                  )}
                </div>
                {kyc.pieceRectoUrl && (
                  <a
                    href={kyc.pieceRectoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-center text-xs text-slate-500 hover:underline"
                  >
                    Agrandir l'image ↗
                  </a>
                )}
              </div>

              {/* Verso */}
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  📄 Pièce d'identité (Verso)
                </span>
                <div className="mt-2 aspect-[3/4] overflow-hidden rounded bg-slate-100">
                  {kyc.pieceVersoUrl ? (
                    <a href={kyc.pieceVersoUrl} target="_blank" rel="noreferrer">
                      <img
                        src={kyc.pieceVersoUrl}
                        alt="Pièce verso"
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      {kyc.typePiece === "PASSEPORT"
                        ? "Non requis (Passeport)"
                        : "Non fourni"}
                    </div>
                  )}
                </div>
                {kyc.pieceVersoUrl && (
                  <a
                    href={kyc.pieceVersoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-center text-xs text-slate-500 hover:underline"
                  >
                    Agrandir l'image ↗
                  </a>
                )}
              </div>
            </div>
          </Carte>

          {/* Motif actuel si rejeté */}
          {statutKyc === "REJETE" && kyc.motifRejet && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">Dossier actuellement rejeté :</p>
              <p className="mt-1">{kyc.motifRejet}</p>
            </div>
          )}

          {/* Actions d'approbation ou de rejet */}
          <Carte className="p-6">
            <h2 className="text-base font-bold text-slate-900">Décision Administrateur</h2>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <form action={validerKycAdminAction}>
                <input type="hidden" name="vendeurId" value={vendeur.id} />
                <BoutonSoumettre
                  enCours="Validation…"
                  disabled={!peutAgir}
                  className={btn("primaire", "md")}
                >
                  ✓ Valider le KYC et activer la boutique
                </BoutonSoumettre>
              </form>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-800">Rejeter le dossier avec motif</h3>
              <form action={rejeterKycAdminAction} className="mt-3 space-y-3">
                <input type="hidden" name="vendeurId" value={vendeur.id} />
                <div>
                  <label htmlFor="motif" className={labelClass}>
                    Motif du rejet <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="motif"
                    name="motif"
                    rows={2}
                    required
                    minLength={5}
                    placeholder="Ex: Le selfie est flou, ou la photo ne correspond pas à la pièce d'identité..."
                    className={champClass}
                  />
                </div>
                <BoutonSoumettre
                  enCours="Rejet en cours…"
                  disabled={!peutAgir}
                  className={btn("danger", "md")}
                >
                  ✕ Rejeter le dossier KYC
                </BoutonSoumettre>
              </form>
            </div>
          </Carte>
        </div>
      )}
    </div>
  );
}
