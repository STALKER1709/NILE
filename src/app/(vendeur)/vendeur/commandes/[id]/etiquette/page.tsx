import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { exigerVendeur } from "@/modules/auth/access";
import { BoutonImprimer } from "@/components/ui/BoutonImprimer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Étiquette colis · vendeur" };

function dateLisible(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Étiquette de préparation imprimable inspirée de la maquette Stitch.
 * Elle ne prétend pas être un scellé inviolable : NILE ne stocke actuellement
 * ni numéro de scellé, ni certificat d'essai, ni données de garantie atelier.
 */
export default async function EtiquetteCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendeur } = await exigerVendeur();

  // Une commande multi-boutiques n'est pas imprimable depuis l'espace d'un
  // vendeur : seule NILE coordonne ces colis.
  const commande = await prisma.commande.findFirst({
    where: {
      id,
      lignes: {
        some: { vendeurId: vendeur.id },
        every: { vendeurId: vendeur.id },
      },
    },
    include: {
      livraison: true,
      lignes: {
        where: { vendeurId: vendeur.id },
        select: {
          id: true,
          titreProduit: true,
          declinaison: true,
          quantite: true,
        },
      },
    },
  });
  if (!commande || commande.lignes.length === 0) notFound();

  // Le QR ne contient que la référence de commande : aucune adresse,
  // coordonnée personnelle, donnée de paiement ou code OTP n'est exposée.
  const qrSvg = await QRCode.toString(commande.numero, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    width: 220,
  });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/vendeur/commandes" className="text-sm font-semibold text-slate-600 hover:text-[#0B192C]">
          ← Retour aux commandes
        </Link>
        <BoutonImprimer libelle="Imprimer l'étiquette" />
      </div>

      <article className="mx-auto w-full max-w-[700px] overflow-hidden rounded-2xl border-2 border-[#0B192C] bg-white shadow-sm print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex items-center justify-between gap-4 bg-[#0B192C] px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">NILE · Logistique</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Étiquette colis</h1>
            <p className="mt-1 text-xs text-slate-300">Document de préparation et d'identification</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-300">Commande</p>
            <p className="font-mono text-sm font-bold">{commande.numero}</p>
          </div>
        </header>

        <section className="grid gap-5 p-5 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Destinataire</p>
              <h2 className="mt-1 text-xl font-extrabold text-[#0B192C]">{commande.destNom}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-800">{commande.destTelephone}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Adresse de livraison</p>
              <p className="mt-1 font-bold text-[#0B192C]">{commande.quartier}, {commande.ville}</p>
              {commande.reperes && <p className="mt-1 text-sm leading-5 text-slate-700">Repère : {commande.reperes}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Contenu du colis</p>
              <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
                {commande.lignes.map((ligne) => (
                  <li key={ligne.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 font-semibold text-slate-800">
                      {ligne.titreProduit}
                      {ligne.declinaison ? <span className="block text-xs font-normal text-slate-500">{ligne.declinaison}</span> : null}
                    </span>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 font-bold text-[#0B192C]">× {ligne.quantite}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="flex flex-col items-center justify-start gap-2 rounded-xl border border-slate-200 p-3 text-center">
            <div className="w-full max-w-[160px] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="font-mono text-xs font-bold text-[#0B192C]">{commande.numero}</p>
            <p className="text-[10px] leading-4 text-slate-500">QR de référence uniquement. Ne valide pas la livraison.</p>
          </aside>
        </section>

        <section className="grid grid-cols-2 gap-3 border-t border-slate-200 px-5 py-4 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-500">Transporteur</p>
            <p className="mt-1 font-semibold text-slate-800">{commande.livraison?.livreurNom || commande.livraison?.transporteur || "À renseigner"}</p>
            {commande.livraison?.livreurTelephone && <p className="mt-1 text-slate-600">{commande.livraison.livreurTelephone}</p>}
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-500">Préparé le</p>
            <p className="mt-1 font-semibold text-slate-800">{dateLisible(new Date())}</p>
          </div>
        </section>

        <footer className="border-t-2 border-dashed border-slate-300 bg-amber-50 px-5 py-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#0B192C]">Consigne de remise</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">
            Le destinataire doit vérifier le colis avant de communiquer son code de réception. Le code OTP est affiché uniquement dans le suivi de commande de l'acheteur ; ne l'imprimez pas sur cette étiquette.
          </p>
        </footer>
      </article>

      <p className="mx-auto max-w-[700px] text-xs leading-5 text-slate-500 print:hidden">
        Cette étiquette identifie le colis. Elle n'est pas un certificat de garantie, un rapport de test technique ou un scellé de sécurité certifié.
      </p>

      <style>{`
        @page { size: A6 portrait; margin: 6mm; }
        @media print {
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
