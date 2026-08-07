/**
 * Contrôle avant vol du paiement — à lancer AVANT le premier encaissement réel.
 *
 * Le pire scénario du passage en live n'est pas une erreur bruyante, c'est une
 * configuration à moitié juste qu'on découvre au moment où un client paie :
 * clé A live avec clé B de test, guillemets recopiés depuis Vercel, secret de
 * webhook oublié. Ce script provoque ces erreurs dans un terminal plutôt que
 * dans le parcours d'achat.
 *
 * Il ne déplace AUCUN argent : le seul appel réseau est l'échange des clés
 * contre un jeton de transaction, celui-là même que l'application fait avant
 * chaque encaissement. S'il aboutit, les clés sont bonnes et le KYC est passé ;
 * s'il échoue, le message du fournisseur est reproduit tel quel.
 *
 *   pnpm verif:paiement
 */

import {
  environnementCle,
  clesCoherentes,
  racineHrSkills,
} from "@/modules/paiement/hrskills/hrskills-cles";
import { sansGuillemets } from "@/lib/env-valeurs";

const BASE_PAR_DEFAUT = "https://api.hrskills-pay.com";

/**
 * Lecture directe de l'environnement, SANS passer par `@/lib/env`.
 *
 * Ce module-là valide la configuration ENTIÈRE de l'application et refuse de
 * se charger s'il manque quoi que ce soit — `DATABASE_URL` incluse. C'est le
 * bon comportement pour démarrer l'application, et le mauvais ici : ce
 * contrôle doit pouvoir tourner là où se trouvent les clés de paiement, qui
 * n'est pas forcément une machine portant toute la configuration.
 *
 * La même normalisation des guillemets est appliquée — c'est précisément
 * l'erreur qu'on vient chercher (l'interface de Vercel enregistre la valeur
 * littéralement, guillemets compris).
 */
function lire(nom: string): string {
  const valeur = process.env[nom];
  return typeof valeur === "string" ? sansGuillemets(valeur) : "";
}

const OK = "  ✅";
const KO = "  ❌";
const INFO = "  •";
const ATTENTION = "  ⚠️ ";

let bloquant = 0;

function echec(message: string): void {
  bloquant += 1;
  console.log(`${KO} ${message}`);
}

/**
 * Empreinte d'une clé, sans la clé.
 *
 * Le préfixe suffit à savoir de quel environnement elle vient — c'est
 * exactement ce qu'on cherche à vérifier — et la sortie de ce script finira
 * tôt ou tard collée dans une conversation.
 */
function empreinte(cle: string): string {
  const morceaux = cle.split("_");
  const prefixe = morceaux.slice(0, 3).join("_");
  return `${prefixe}_…${cle.slice(-4)} (${cle.length} caractères)`;
}

async function controler(): Promise<void> {

  const fournisseur = lire("PAYMENT_PROVIDER") || "mock";
  console.log(`${INFO} PAYMENT_PROVIDER = ${fournisseur}`);

  if (fournisseur === "mock") {
    console.log(
      `${ATTENTION}Fournisseur simulé : aucun encaissement réel. Pose\n` +
        `     PAYMENT_PROVIDER="hrskills" pour passer en production.`,
    );
    return;
  }

  if (fournisseur !== "hrskills") {
    console.log(
      `${ATTENTION}Ce contrôle ne couvre que HR-Skills. Fournisseur actif : ` +
        `${fournisseur}.`,
    );
    return;
  }

  const cleA = lire("HRSKILLS_CLE_A");
  const cleB = lire("HRSKILLS_CLE_B");
  const secretWebhook = lire("HRSKILLS_WEBHOOK_SECRET");
  const secretCron = lire("CRON_SECRET");
  const baseUrl = lire("HRSKILLS_BASE_URL") || BASE_PAR_DEFAUT;

  if (!cleA || !cleB) {
    echec(
      "HRSKILLS_CLE_A et HRSKILLS_CLE_B sont requises. L'application refusera " +
        "de démarrer sans elles.",
    );
    return;
  }
  console.log(`${INFO} Clé A : ${empreinte(cleA)}`);
  console.log(`${INFO} Clé B : ${empreinte(cleB)}`);

  const environnement = environnementCle(cleA);
  if (!environnement) {
    echec(
      "Impossible de lire l'environnement des clés (ni _test_ ni _live_ dans " +
        "le préfixe).",
    );
    return;
  }
  if (!clesCoherentes(cleA, cleB)) {
    echec("Les deux clés ne portent pas le même environnement.");
    return;
  }

  const racine = racineHrSkills(baseUrl, cleA);
  if (environnement === "live") {
    console.log(`${OK} Environnement : LIVE — les encaissements seront RÉELS.`);
  } else {
    console.log(
      `${ATTENTION}Environnement : TEST (sandbox). Aucun encaissement réel ` +
        `ne partira.`,
    );
  }
  console.log(`${INFO} Racine des appels : ${racine}`);

  if (!secretWebhook) {
    echec("HRSKILLS_WEBHOOK_SECRET absent : les webhooks seront tous rejetés.");
  } else {
    console.log(
      `${OK} Secret de webhook présent (${secretWebhook.length} caractères).`,
    );
    console.log(
      `${ATTENTION}Vérifie qu'il vient bien de l'environnement ` +
        `${environnement === "live" ? "Live" : "Sandbox"} du tableau de bord : ` +
        `c'est une configuration distincte, et rien ici ne peut le contrôler.`,
    );
  }

  if (!secretCron) {
    echec(
      "CRON_SECRET absent : le balayage des paiements en attente est INACTIF. " +
        "Une commande payée dont le webhook n'arrive pas resterait figée, " +
        "argent encaissé et stock immobilisé.",
    );
  } else {
    console.log(`${OK} CRON_SECRET présent.`);
    console.log(
      `${ATTENTION}Il doit être IDENTIQUE dans les secrets du dépôt GitHub, ` +
        `sinon le balayage tourne à vide sans rien signaler.`,
    );
  }

  // Seul appel réseau : l'échange des clés contre un jeton, exactement celui
  // que fait l'application avant chaque encaissement. Rien n'est débité.
  console.log(`\n${INFO} Test d'authentification auprès de HR-Skills…`);
  try {
    const reponse = await fetch(`${baseUrl}/v1/auth/transaction-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleA}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_secret: cleB }),
    });
    const texte = await reponse.text();
    if (!reponse.ok) {
      echec(`Authentification refusée : HTTP ${reponse.status}`);
      console.log(`     Réponse : ${texte.slice(0, 300)}`);
      if (reponse.status === 403 && texte.includes("kyc")) {
        console.log(
          `     → Le KYC n'est pas approuvé dans le tableau de bord HR-Skills. ` +
            `C'est un prérequis au passage en live, rien dans le code ne peut le contourner.`,
        );
      }
    } else {
      const data = JSON.parse(texte) as { transaction_token?: string };
      if (data.transaction_token) {
        console.log(`${OK} Clés acceptées, jeton de transaction obtenu.`);
      } else {
        echec("Réponse acceptée mais sans jeton — format inattendu.");
        console.log(`     Réponse : ${texte.slice(0, 300)}`);
      }
    }
  } catch (erreur) {
    echec(
      `Appel impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    );
  }

  console.log("\n=== Ce que ce script NE peut pas vérifier ===");
  console.log(
    `${INFO} Que l'URL du webhook est déclarée pour l'environnement ` +
      `${environnement === "live" ? "Live" : "Sandbox"} : ` +
      `https://TON-DOMAINE/api/paiement/callback`,
  );
  console.log(
    `${INFO} Que le secret de webhook posé ici est celui de ce même environnement.`,
  );
  console.log(
    `${INFO} Qu'un vrai encaissement aboutit. Seul un premier paiement de petit ` +
      `montant sur ton propre numéro le dira.`,
  );

}

/**
 * Le verdict est imprimé quoi qu'il arrive, y compris quand un contrôle
 * interrompt les suivants : une sortie qui s'arrête sans conclure laisse
 * croire que le reste est passé.
 */
async function main(): Promise<void> {
  console.log("\n=== Contrôle de la configuration de paiement ===\n");
  try {
    await controler();
  } catch (erreur) {
    echec(
      `Contrôle interrompu : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    );
  }
  console.log(
    bloquant === 0
      ? "\n✅ Aucun point bloquant détecté.\n"
      : `\n❌ ${bloquant} point(s) bloquant(s) à corriger avant d'encaisser.\n`,
  );
  if (bloquant > 0) process.exitCode = 1;
}

void main();
