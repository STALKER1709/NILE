import { prisma } from "@/lib/db";
import {
  genererSecretReception,
  genererCodeReception,
  secondesRestantes,
  contenuQr,
} from "@/modules/livraison/reception-core";

export interface CodeReceptionAffiche {
  code: string;
  /** Contenu à encoder dans le QR (préfixe + numéro de commande + code). */
  contenuQr: string;
  /** Secondes avant renouvellement, pour le compte à rebours côté client. */
  secondesRestantes: number;
  numeroCommande: string;
}

export type ResultatCodeReception =
  | { ok: true; data: CodeReceptionAffiche }
  | { ok: false; code: "INTROUVABLE" | "ETAT_INVALIDE" };

/**
 * Code de réception à présenter au livreur, pour l'ACHETEUR de la commande.
 *
 * Le secret est tiré au sort à la première demande (et non à la création de
 * la commande) : inutile d'en générer un pour les commandes qui n'iront
 * jamais jusqu'à la remise.
 *
 * La commande est retrouvée par (id, acheteurId) : un identifiant fourni par
 * le client ne peut pas afficher le code d'un tiers — ce serait donner à un
 * inconnu de quoi faire valider la livraison d'autrui.
 */
export async function getCodeReception(
  utilisateurId: string,
  commandeId: string,
): Promise<ResultatCodeReception> {
  const commande = await prisma.commande.findFirst({
    where: { id: commandeId, acheteurId: utilisateurId },
    select: {
      numero: true,
      statutCommande: true,
      livraison: { select: { secretReception: true } },
    },
  });
  if (!commande || !commande.livraison) return { ok: false, code: "INTROUVABLE" };

  // Le code n'a de sens qu'au moment de la remise : ni avant l'expédition,
  // ni après la livraison.
  if (commande.statutCommande !== "EXPEDIEE") {
    return { ok: false, code: "ETAT_INVALIDE" };
  }

  let secret = commande.livraison.secretReception;
  if (!secret) {
    secret = genererSecretReception();
    // Filtré sur l'absence de secret : deux onglets ouverts simultanément ne
    // doivent pas aboutir à deux secrets différents, dont l'un invaliderait
    // le code que l'acheteur est en train de montrer.
    await prisma.livraison.updateMany({
      where: { commandeId, secretReception: null },
      data: { secretReception: secret },
    });
    const relu = await prisma.livraison.findUnique({
      where: { commandeId },
      select: { secretReception: true },
    });
    secret = relu?.secretReception ?? secret;
  }

  const maintenant = new Date();
  const code = genererCodeReception(secret, maintenant);
  return {
    ok: true,
    data: {
      code,
      contenuQr: contenuQr(commande.numero, code),
      secondesRestantes: secondesRestantes(maintenant),
      numeroCommande: commande.numero,
    },
  };
}
