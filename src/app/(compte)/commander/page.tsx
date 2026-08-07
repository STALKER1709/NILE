import Link from "next/link";
import { redirect } from "next/navigation";
import { exigerConnexion } from "@/modules/auth/access";
import { getPanierAvecLignes } from "@/modules/commande/panier";
import { calculerTotal } from "@/modules/commande/commande-core";
import { chargerAffichagePrixPourProduits } from "@/modules/promotion/promotion";
import { env } from "@/lib/env";
import { getPlafondCOD, getPlafondDetteCOD } from "@/modules/commande/config";
import { codBloqueParDette } from "@/modules/commande/commande-core";
import { dettesVendeurs } from "@/modules/reversement/reversement";
import { getDerniereAdresse } from "@/modules/commande/commande";
import { lireBrouillon } from "@/modules/commande/brouillon";
import { axesParCategorie } from "@/modules/catalogue/axes";
import { libelleVariante } from "@/modules/catalogue/variante-core";
import { paiementSansRedirection } from "@/modules/paiement";
import { passerCommandeAction } from "@/app/(compte)/commander/actions";
import { BoutonSoumettre } from "@/components/ui/BoutonSoumettre";
import { Vignette } from "@/components/ui/Vignette";
import { ChampVille } from "@/components/commande/ChampVille";
import { ChoixOperateur } from "@/components/paiement/ChoixOperateur";
import { Carte, Prix, btn, champClass, labelClass } from "@/components/ui/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Passer la commande" };

export default async function CommanderPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const utilisateur = await exigerConnexion();
  const panier = await getPanierAvecLignes(utilisateur.id);
  if (panier.lignes.length === 0) redirect("/panier");

  const affichages = await chargerAffichagePrixPourProduits(
    panier.lignes.map((l) => ({ id: l.produit.id, prix: l.produit.prix, vendeurId: l.produit.vendeurId })),
  );
  const prixEffectif = (produitId: string, prix: number) =>
    affichages.get(produitId)?.prixPromo ?? prix;

  const total = calculerTotal(
    panier.lignes.map((l) => ({ prix: prixEffectif(l.produit.id, l.produit.prix), quantite: l.quantite })),
  );
  const [plafond, derniere, brouillon, seuilDette, dettes, axesParCat] = await Promise.all([
    getPlafondCOD(),
    getDerniereAdresse(utilisateur.id),
    // Ce que l'acheteur avait saisi avant un refus. Prime sur l'adresse de sa
    // dernière commande : c'est le plus récent, et c'est ce qu'il vient de
    // taper.
    lireBrouillon(),
    getPlafondDetteCOD(),
    dettesVendeurs([...new Set(panier.lignes.map((l) => l.produit.vendeurId))]),
    // Sans le nom de la déclinaison, deux lignes du même t-shirt — un M et un
    // XL — seraient indiscernables sur l'écran où l'acheteur valide.
    axesParCategorie(panier.lignes.map((l) => l.produit.categorieId)),
  ]);
  const depassePlafond = total > plafond;
  // Articles dont le vendeur doit trop de commission pour continuer à vendre
  // en espèces. Affiché ici pour que l'acheteur puisse arbitrer avant de
  // valider ; le refus reste prononcé côté serveur, cet écran ne fait
  // qu'éviter un aller-retour inutile.
  const articlesBloquesCOD = panier.lignes
    .filter((l) => codBloqueParDette(dettes.get(l.produit.vendeurId) ?? 0, seuilDette))
    .map((l) => l.produit.titre);
  const codIndisponible = articlesBloquesCOD.length > 0;
  // Le fournisseur actif débite-t-il le téléphone du client sans page de
  // paiement ? Si oui, il faut lui demander son opérateur ici même.
  const sansRedirection = paiementSansRedirection();
  // Unités commandées, pas lignes : 2 exemplaires comptent pour 2 articles.
  const nbArticles = panier.lignes.reduce((s, l) => s + l.quantite, 0);

  // Ordre de préséance des valeurs du formulaire : ce qui vient d'être saisi,
  // puis la dernière adresse connue, puis le profil.
  const val = (champ: "destNom" | "destTelephone" | "ville" | "quartier" | "reperes") =>
    brouillon[champ] ?? derniere?.[champ] ?? "";
  // Le mode retenu ne se rétablit que s'il reste proposable : un COD conservé
  // alors qu'il vient d'être refusé remettrait l'acheteur dans l'impasse.
  const codPossible = !depassePlafond && !codIndisponible;
  const modeCOD = brouillon.mode ? brouillon.mode === "COD" && codPossible : codPossible;

  return (
    <div className="space-y-5">
      <nav aria-label="Étapes" className="flex items-center gap-2 text-corps-sm">
        <Link href="/panier" className="text-slate-500 transition-colors hover:text-nile-700">Panier</Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-nile-700">Commande</span>
        <span className="text-slate-300">›</span>
        <span className="text-slate-400">Confirmation</span>
      </nav>

      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Passer la commande</h1>

      {erreur && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <form action={passerCommandeAction} className="space-y-5 lg:col-span-2">
          <Carte className="space-y-4 p-5">
            <h2 className="flex items-center gap-2.5 text-titre-sm text-slate-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
                <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7" strokeLinejoin="round" />
                <circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" />
              </svg>
              Adresse de livraison
            </h2>
            {/* Ne s'affiche que si les champs viennent RÉELLEMENT de la
                dernière commande. Après un refus, ils portent ce que l'acheteur
                vient de taper : lui dire le contraire l'inviterait à corriger
                une adresse qui est déjà la sienne. */}
            {derniere && !brouillon.destNom && (
              <p className="rounded bg-nile-50 px-3 py-2 text-xs text-nile-800">
                Adresse pré-remplie depuis ta dernière commande · modifie si besoin.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="destNom" className={labelClass}>Nom du destinataire</label>
                <input id="destNom" name="destNom" required defaultValue={val("destNom") || utilisateur.nom} className={`${champClass} mt-1`} />
              </div>
              <div>
                <label htmlFor="destTelephone" className={labelClass}>Téléphone de contact</label>
                <input id="destTelephone" name="destTelephone" required defaultValue={val("destTelephone") || utilisateur.telephone} placeholder="6XX XXX XXX" className={`${champClass} mt-1`} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChampVille valeurInitiale={val("ville")} />
              <div>
                <label htmlFor="quartier" className={labelClass}>Quartier</label>
                <input id="quartier" name="quartier" required defaultValue={val("quartier")} placeholder="Akwa" className={`${champClass} mt-1`} />
              </div>
            </div>
            <div>
              <label htmlFor="reperes" className={labelClass}>Points de repère (facultatif)</label>
              <textarea id="reperes" name="reperes" rows={2} defaultValue={val("reperes")} placeholder="Ex : en face de la pharmacie, immeuble bleu…" className={`${champClass} mt-1`} />
            </div>
          </Carte>

          <Carte className="space-y-3 p-5">
            <h2 className="flex items-center gap-2.5 text-titre-sm text-slate-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-nile-700" aria-hidden="true">
                <rect x="2.5" y="6" width="19" height="12" rx="2" />
                <path d="M2.5 10h19M6 14h4" strokeLinecap="round" />
              </svg>
              Mode de paiement
            </h2>
            {/* Un seul `group` pour les deux modes : ce qui ne concerne qu'un
                mode ne s'affiche que s'il est retenu. En CSS seul, sans
                JavaScript, pour que cela fonctionne aussi sur les navigateurs
                où les scripts n'ont pas chargé. */}
            <div className="group space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded border border-contour-carte p-4 transition-colors hover:bg-surface-basse has-[:checked]:border-nile-700 has-[:checked]:bg-nile-50">
                <input type="radio" name="mode" value="COD" defaultChecked={modeCOD} className="mt-1 accent-nile-700" />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-surface-haute">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-nile-800" aria-hidden="true">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-etiquette-md text-slate-900">Paiement à la livraison</span>
                  <span className="block text-corps-sm text-slate-500">
                    Vous payez en espèces à la réception, après vérification du colis.
                  </span>
                </span>
              </label>
              {codIndisponible && (
                <p className="hidden rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-xs text-amber-800 group-has-[input[value=COD]:checked]:block">
                  Le paiement à la livraison n&apos;est pas disponible pour{" "}
                  <span className="font-semibold">{articlesBloquesCOD.join(", ")}</span>.
                  Retirez ces articles de votre panier pour payer à la
                  livraison, ou réglez toute la commande par Mobile Money.
                </p>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded border border-contour-carte p-4 transition-colors hover:bg-surface-basse has-[:checked]:border-nile-700 has-[:checked]:bg-nile-50">
                <input type="radio" name="mode" value="MONETBIL" defaultChecked={!modeCOD} className="mt-1 accent-nile-700" />
                <span className="flex shrink-0 gap-1.5">
                  <span className="grid h-8 w-8 place-items-center rounded bg-[#ffcb05] text-[10px] font-bold text-black">MTN</span>
                  <span className="grid h-8 w-8 place-items-center rounded bg-[#ff7900] text-[10px] font-bold text-white">OM</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-etiquette-md text-slate-900">Mobile Money</span>
                  <span className="block text-corps-sm text-slate-500">
                    {sansRedirection
                      ? "MTN MoMo ou Orange Money. La demande de paiement arrive sur votre téléphone."
                      : "MTN MoMo ou Orange Money, sur une page de paiement sécurisée."}
                  </span>
                </span>
              </label>

              {/* L'opérateur ne s'affiche QUE si Mobile Money est retenu : il
                  n'a aucun sens sous un paiement en espèces, et l'afficher en
                  permanence encombrait l'écran d'un choix hors sujet. Le
                  fournisseur sollicite directement le portefeuille du client,
                  il faut donc savoir lequel interroger — et le serveur le
                  revérifie, cet affichage ne protège de rien. */}
              {sansRedirection && (
                <div className="hidden group-has-[input[value=MONETBIL]:checked]:block">
                  <ChoixOperateur
                    telephone={val("destTelephone") || utilisateur.telephone}
                    valeurInitiale={brouillon.operateur}
                    note="Gardez votre téléphone à portée : la demande expire au bout de 10 minutes sans confirmation."
                  />
                </div>
              )}
            </div>

            {/* Code promo. Le montant de la remise n'est PAS calculé ici :
                il est établi au moment d'enregistrer la commande, sur le total
                recalculé côté serveur. Afficher un montant ici obligerait à le
                recalculer deux fois, et à répondre du désaccord entre les deux.
                Les codes ne valent qu'en Mobile Money — NILE ne remise que
                l'argent qui transite par elle. */}
            <div className="border-t border-contour-carte pt-3">
              <label htmlFor="codePromo" className="block text-etiquette-md text-slate-900">
                Code promo <span className="font-normal text-slate-500">(facultatif)</span>
              </label>
              <input
                id="codePromo"
                name="codePromo"
                type="text"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Ex. BIENVENUE10"
                defaultValue={brouillon.codePromo ?? ""}
                className="mt-1.5 w-full rounded border border-contour-carte px-3 py-2.5 text-corps-sm uppercase placeholder:normal-case placeholder:text-slate-400 focus:border-nile-700 focus:outline-none"
              />
              <p className="mt-1 text-etiquette-xs text-slate-500">
                Mobile Money uniquement · remise appliquée à la validation.
              </p>
            </div>

            {depassePlafond && (
              <p className="rounded border border-amber-200 bg-accent-fixe px-3 py-2 text-xs text-amber-800">
                Le total dépasse le plafond du paiement à la livraison (<Prix montant={plafond} />).
                Choisissez Mobile Money ou réduisez le panier.
              </p>
            )}
          </Carte>

          {/* Le montant n'est PAS répété ici : il est déjà au récapitulatif,
              juste à côté sur grand écran et juste au-dessus sur mobile. Deux
              fois le même chiffre à deux centimètres d'écart n'informe pas,
              il encombre — et le jour où les deux divergeraient, plus personne
              ne saurait lequel croire. */}
          <BoutonSoumettre
            enCours="Commande en cours…"
            className={btn("accent", "lg", "h-14 w-full")}
          >
            <span>Confirmer la commande</span>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BoutonSoumettre>
        </form>

        {/* Sur mobile, le récapitulatif passe AVANT le formulaire : on ne
            demande pas de confirmer une commande avant d'avoir montré ce
            qu'elle contient. Sur grand écran il retrouve sa colonne de droite,
            où il reste visible pendant la saisie. */}
        <div className="order-first lg:order-none lg:col-span-1">
          <Carte className="overflow-hidden lg:sticky lg:top-24">
            <h2 className="border-b border-contour-carte px-5 py-4 text-titre-sm text-slate-900">
              Votre commande{" "}
              <span className="text-corps-sm font-normal text-slate-500">
                ({nbArticles} article{nbArticles > 1 ? "s" : ""})
              </span>
            </h2>
            {/* Liste défilante : un panier long ne doit pas repousser le total
                hors de l'écran. */}
            <ul className="max-h-[19rem] divide-y divide-slate-100 overflow-y-auto">
              {panier.lignes.map((l) => {
                const prixLigne = prixEffectif(l.produit.id, l.produit.prix);
                const enPromo = prixLigne < l.produit.prix;
                const declinaison = libelleVariante(
                  l.variante,
                  axesParCat.get(l.produit.categorieId) ?? [],
                );
                return (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                    <Vignette
                      url={l.produit.images[0]?.url}
                      alt={l.produit.titre}
                      sizes="48px"
                      className="h-12 w-12 shrink-0 rounded border border-contour-carte"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-corps-sm font-semibold text-slate-900">
                        {l.produit.titre}
                      </span>
                      <span className="block text-etiquette-xs text-slate-500">
                        {declinaison ? `${declinaison} · ` : ""}Quantité : {l.quantite}
                      </span>
                      <span className="flex items-center gap-2">
                        <Prix
                          montant={prixLigne * l.quantite}
                          className="block text-corps-sm font-bold text-slate-900"
                        />
                        {enPromo && (
                          <Prix
                            montant={l.produit.prix * l.quantite}
                            className="text-etiquette-xs text-slate-400 line-through"
                          />
                        )}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 bg-surface-basse px-5 py-4">
              <div className="flex justify-between text-titre-sm text-slate-900">
                <span>Total</span>
                <Prix montant={total} className="text-nile-700" />
              </div>
              <p className="text-etiquette-xs text-slate-500">
                Livraison gratuite · prix TTC
                {env.DELAI_LIVRAISON_TEXTE
                  ? ` · délai estimé : ${env.DELAI_LIVRAISON_TEXTE}`
                  : ""}
              </p>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
