import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { creerClientAdmin } from "../src/modules/auth/supabase/serverClient";

/**
 * Migration des pièces KYC héritées du bucket public vers le bucket privé.
 * Par défaut, dry-run. Exécuter avec --apply uniquement après sauvegarde DB.
 * Les chemins partagés avec des médias publics sont exclus avant toute copie
 * ou modification DB : ils nécessitent une séparation manuelle des fichiers.
 */
const appliquer = process.argv.includes("--apply");
const client = creerClientAdmin();

type ChampUrl = "pieceRectoUrl" | "pieceVersoUrl" | "selfieUrl" | "registreCommerceUrl";

async function mettreAJourUrl(id: string, champ: ChampUrl, url: string) {
  switch (champ) {
    case "pieceRectoUrl": return prisma.kycVendeur.update({ where: { id }, data: { pieceRectoUrl: url } });
    case "pieceVersoUrl": return prisma.kycVendeur.update({ where: { id }, data: { pieceVersoUrl: url } });
    case "selfieUrl": return prisma.kycVendeur.update({ where: { id }, data: { selfieUrl: url } });
    case "registreCommerceUrl": return prisma.kycVendeur.update({ where: { id }, data: { registreCommerceUrl: url } });
  }
}

async function cheminPartageAvecMediaPublic(chemin: string): Promise<boolean> {
  const [imagesCatalogue, mediasPublication] = await Promise.all([
    prisma.imageProduit.count({ where: { chemin } }),
    prisma.publicationMedia.count({ where: { chemin } }),
  ]);
  return imagesCatalogue > 0 || mediasPublication > 0;
}

async function main() {
  if (env.SUPABASE_KYC_BUCKET === env.SUPABASE_STORAGE_BUCKET) {
    throw new Error("Le bucket KYC doit être distinct du bucket public des médias.");
  }
  const dossiers = await prisma.kycVendeur.findMany();
  let candidats = 0;
  let migres = 0;
  let ignoresCheminPartage = 0;
  let erreurs = 0;
  console.info(`Mode: ${appliquer ? "APPLICATION" : "SIMULATION"} · dossiers: ${dossiers.length}`);

  for (const dossier of dossiers) {
    const fichiers: Array<{ champ: ChampUrl; url: string | null; chemin: string | null }> = [
      { champ: "pieceRectoUrl", url: dossier.pieceRectoUrl, chemin: dossier.pieceRectoChemin },
      { champ: "pieceVersoUrl", url: dossier.pieceVersoUrl, chemin: dossier.pieceVersoChemin },
      { champ: "selfieUrl", url: dossier.selfieUrl, chemin: dossier.selfieChemin },
      { champ: "registreCommerceUrl", url: dossier.registreCommerceUrl, chemin: dossier.registreCommerceChemin },
    ];
    for (const fichier of fichiers) {
      if (!fichier.url || fichier.url.startsWith("kyc://")) continue;
      if (!fichier.chemin) {
        erreurs += 1;
        console.error(`KYC ${dossier.id}: URL héritée sans chemin (${fichier.champ}); ignorée.`);
        continue;
      }
      candidats += 1;

      // Vérifier avant toute copie et surtout avant de modifier l'URL en base.
      // Un chemin partagé avec un média public doit être séparé manuellement :
      // le fichier original ne peut pas être supprimé sans casser ce média.
      if (await cheminPartageAvecMediaPublic(fichier.chemin)) {
        ignoresCheminPartage += 1;
        console.error(`KYC ${dossier.id}: chemin partagé avec un média public; migration automatique ignorée (${fichier.champ}, ${fichier.chemin}).`);
        continue;
      }
      if (!appliquer) continue;

      const { data: blob, error: telechargementErreur } = await client.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .download(fichier.chemin);
      if (telechargementErreur || !blob) {
        erreurs += 1;
        console.error(`KYC ${dossier.id}: téléchargement impossible pour ${fichier.champ}; original conservé.`);
        continue;
      }
      const typeMime = blob.type || "application/octet-stream";
      const { error: uploadErreur } = await client.storage
        .from(env.SUPABASE_KYC_BUCKET)
        .upload(fichier.chemin, blob, { contentType: typeMime, upsert: true });
      if (uploadErreur) {
        erreurs += 1;
        console.error(`KYC ${dossier.id}: copie privée impossible pour ${fichier.champ}; original conservé.`);
        continue;
      }

      try {
        await mettreAJourUrl(dossier.id, fichier.champ, `kyc://${fichier.chemin}`);
      } catch (erreur) {
        erreurs += 1;
        console.error(`KYC ${dossier.id}: mise à jour DB impossible pour ${fichier.champ}; original conservé. Vérifier et supprimer l'éventuelle copie privée orpheline.`, erreur);
        continue;
      }

      const { error: suppressionErreur } = await client.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([fichier.chemin]);
      if (suppressionErreur) {
        erreurs += 1;
        console.error(`KYC ${dossier.id}: URL migrée, mais suppression de l'original public à terminer manuellement (${fichier.champ}, ${fichier.chemin}).`);
        continue;
      }
      migres += 1;
    }
  }
  console.info(`Candidats: ${candidats} · migrés et originaux supprimés: ${migres} · chemins partagés ignorés: ${ignoresCheminPartage} · erreurs: ${erreurs}`);
  if (!appliquer) console.info("Aucune modification effectuée. Sauvegarder la base, vérifier les résultats, puis relancer avec --apply pour migrer.");
  if (appliquer && (ignoresCheminPartage > 0 || erreurs > 0)) {
    process.exitCode = 1;
    console.error("Migration partielle : traiter les éléments signalés puis relancer un audit.");
  }
}

main()
  .catch((erreur) => {
    console.error("Migration KYC interrompue:", erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
