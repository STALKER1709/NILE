import Link from "next/link";
import { exigerRole } from "@/modules/auth/access";
import { listerCodesPromo } from "@/modules/promotion/code-promo";
import {
  creerCodePromoAction,
  basculerCodePromoAction,
} from "@/app/(admin)/admin/codes-promo/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Carte, Prix, Badge, EtatVide, btn } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

/** `datetime-local` attend « AAAA-MM-JJTHH:MM », sans fuseau ni secondes. */
function pourChampDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function etatDuCode(c: {
  actif: boolean;
  dateDebut: Date;
  dateFin: Date;
  quotaTotal: number | null;
  nbUtilisations: number;
}): { libelle: string; ton: "vert" | "ambre" | "neutre" } {
  const maintenant = new Date();
  if (!c.actif) return { libelle: "coupé", ton: "neutre" };
  if (maintenant < c.dateDebut) return { libelle: "à venir", ton: "ambre" };
  if (maintenant > c.dateFin) return { libelle: "expiré", ton: "neutre" };
  if (c.quotaTotal !== null && c.nbUtilisations >= c.quotaTotal) {
    return { libelle: "quota épuisé", ton: "neutre" };
  }
  return { libelle: "actif", ton: "vert" };
}

export default async function CodesPromoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await exigerRole("ADMIN");
  const { ok, erreur } = await searchParams;
  const codes = await listerCodesPromo();

  const maintenant = new Date();
  const dansUnMois = new Date(maintenant.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalConsenti = codes.reduce((s, c) => s + c.remiseConsentie, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Codes promo</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back-office</Link>
      </div>

      <p className="rounded border border-contour-carte bg-surface-basse px-3 py-2 text-sm text-slate-600">
        La remise sort de la marge de NILE, pas de celle du vendeur : celui-ci
        est payé au prix plein. Les codes ne valent donc qu&apos;en paiement
        Mobile Money — sur une vente en espèces, NILE n&apos;encaisse rien et
        n&apos;a rien à remiser. Un acheteur ne peut utiliser un code
        qu&apos;une seule fois.
      </p>

      {ok && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Code créé.
        </p>
      )}
      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <Carte className="p-5">
        <h2 className="text-etiquette-md text-slate-900">Nouveau code</h2>
        <form action={creerCodePromoAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Champ label="Code" indice="Majuscules, sans espaces.">
            <input name="code" required maxLength={24} placeholder="BIENVENUE10" className={saisie} />
          </Champ>

          <Champ label="Type de remise">
            <select name="type" className={saisie} defaultValue="POURCENTAGE">
              <option value="POURCENTAGE">Pourcentage (%)</option>
              <option value="MONTANT">Montant fixe (FCFA)</option>
            </select>
          </Champ>

          <Champ label="Valeur" indice="En % (max 90) ou en FCFA selon le type.">
            <input name="valeur" type="number" min={1} required className={saisie} />
          </Champ>

          <Champ
            label="Plafond de remise (FCFA)"
            indice="Pourcentage seulement. Vide = sans plafond — attention aux gros paniers."
          >
            <input name="plafondRemise" type="number" min={0} className={saisie} />
          </Champ>

          <Champ label="Panier minimum (FCFA)" indice="0 = aucune condition.">
            <input name="minPanier" type="number" min={0} defaultValue={0} className={saisie} />
          </Champ>

          <Champ
            label="Quota total d'utilisations"
            indice="Vide = illimité. C'est ce qui borne le budget d'une campagne."
          >
            <input name="quotaTotal" type="number" min={1} className={saisie} />
          </Champ>

          <Champ label="Début">
            <input
              name="dateDebut"
              type="datetime-local"
              required
              defaultValue={pourChampDate(maintenant)}
              className={saisie}
            />
          </Champ>

          <Champ label="Fin">
            <input
              name="dateFin"
              type="datetime-local"
              required
              defaultValue={pourChampDate(dansUnMois)}
              className={saisie}
            />
          </Champ>

          <div className="sm:col-span-2">
            <BoutonSoumettre className={btn("accent", "md")}>Créer le code</BoutonSoumettre>
          </div>
        </form>
      </Carte>

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-etiquette-md text-slate-900">Codes existants</h2>
        {totalConsenti > 0 && (
          <p className="text-corps-sm text-slate-500">
            Remises consenties : <span className="font-semibold text-slate-700"><Prix montant={totalConsenti} /></span>
          </p>
        )}
      </div>

      {codes.length === 0 ? (
        <EtatVide titre="Aucun code promo." />
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const etat = etatDuCode(c);
            return (
              <Carte key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono font-semibold text-nile-800">{c.code}</p>
                  <p className="text-xs text-slate-500">
                    {c.type === "POURCENTAGE" ? `−${c.valeur} %` : <>−<Prix montant={c.valeur} /></>}
                    {c.plafondRemise ? <> · plafond <Prix montant={c.plafondRemise} /></> : null}
                    {c.minPanier > 0 ? <> · dès <Prix montant={c.minPanier} /></> : null}
                    {" · "}
                    {c.nbUtilisations}
                    {c.quotaTotal !== null ? `/${c.quotaTotal}` : ""} utilisation
                    {c.nbUtilisations > 1 ? "s" : ""}
                  </p>
                  {c.remiseConsentie > 0 && (
                    <p className="text-xs text-slate-500">
                      Coût réel : <Prix montant={c.remiseConsentie} />
                    </p>
                  )}
                </div>
                <Badge ton={etat.ton}>{etat.libelle}</Badge>
                <form action={basculerCodePromoAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <BoutonSoumettre className={btn("secondaire", "sm")}>
                    {c.actif ? "Couper" : "Réactiver"}
                  </BoutonSoumettre>
                </form>
              </Carte>
            );
          })}
        </div>
      )}
    </div>
  );
}

const saisie =
  "mt-1 w-full rounded border border-contour-carte px-3 py-2 text-corps-sm focus:border-nile-700 focus:outline-none";

function Champ({
  label,
  indice,
  children,
}: {
  label: string;
  indice?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-etiquette-md text-slate-900">{label}</span>
      {children}
      {indice && <span className="mt-1 block text-etiquette-xs text-slate-500">{indice}</span>}
    </label>
  );
}
