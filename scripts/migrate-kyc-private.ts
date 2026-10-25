import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { creerClientAdmin } from "../src/modules/auth/supabase/serverClient";

/**
 * Migration des pièces KYC héritées du bucket public vers le bucket privé.
 * Par défaut, dry-run. Exécuter avec --apply uniquement après sauvegarde DB.
 * Le fichier original est supprimé du bucket public seulement après copie
 * réussie et mise à jour du champ URL en base.
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

async function main() {
  if (env.SUPABASE_KYC_BUCKET === env.SUPABASE_STORAGE_BUCKET) {
    throw new Error("Le bucket KYC doit être distinct du bucket public des médias.");
  }
  const dossiers = await prisma.kycVendeur.findMany();
  let aMigrer = 0;
  let migres = 0;
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
        console.error(`KYC ${dossier.id}: URL héritée sans chemin (${fichier.champ}); ignorée.`);
        continue;
      }
      aMigrer += 1;
      if (!appliquer) continue;

      const { data: blob, error: telechargementErreur } = await client.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .download(fichier.chemin);
      if (telechargementErreur || !blob) {
        console.error(`KYC ${dossier.id}: téléchargement impossible pour ${fichier.champ}; original conservé.`);
        continue;
      }
      const typeMime = blob.type || "application/octet-stream";
      const { error: uploadErreur } = await client.storage
        .from(env.SUPABASE_KYC_BUCKET)
        .upload(fichier.chemin, blob, { contentType: typeMime, upsert: true });
      if (uploadErreur) {
        console.error(`KYC ${dossier.id}: copie privée impossible pour ${fichier.champ}; original conservé.`);
        continue;
      }

      try {
        await mettreAJourUrl(dossier.id, fichier.champ, `kyc://${fichier.chemin}`);
      } catch (erreur) {
        console.error(`KYC ${dossier.id}: mise à jour DB impossible pour ${fichier.champ}; original conservé.`, erreur);
        continue;
      }

      const { error: suppressionErreur } = await client.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([fichier.chemin]);
      if (suppressionErreur) {
        console.error(`KYC ${dossier.id}: URL migrée, mais suppression de l'original à terminer manuellement (${fichier.champ}).`);
        continue;
      }
      migres += 1;
    }
  }
  console.info(`Objets hérités trouvés: ${aMigrer} · objets migrés et originaux supprimés: ${migres}`);
  if (!appliquer) console.info("Aucune modification effectuée. Relancer avec --apply après sauvegarde pour migrer.");
}

main()
  .catch((erreur) => {
    console.error("Migration KYC interrompue:", erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
