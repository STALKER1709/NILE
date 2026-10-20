/**
 * Panneau éditorial commun aux parcours de connexion et d'inscription.
 * Le contenu rassure sans promettre de livraison gratuite ni de moyens non activés.
 */
export function PanneauMarque() {
  return <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-[28px] bg-blue-950 p-9 text-white lg:flex xl:p-12">
    <div className="absolute -right-20 -top-16 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
    <div className="absolute -right-4 top-0 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
    <div className="relative z-10">
      <p className="flex items-center gap-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 font-titre text-xl text-blue-950">N</span><span className="font-titre text-xl tracking-tight">NILE <span className="font-normal text-blue-200">Marketplace</span></span></p>
      <p className="mt-14 text-[11px] font-bold uppercase tracking-[.2em] text-amber-300">Le commerce local, connecté</p>
      <h2 className="mt-4 max-w-md font-titre text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">Le bon produit. La bonne boutique. En quelques gestes.</h2>
      <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75">Un espace pour acheter, suivre vos commandes et, si vous le souhaitez, développer votre propre boutique en ligne.</p>
    </div>
    <div className="relative z-10 mt-12 grid gap-3">
      <Atout titre="Une expérience simple">Parcourez le catalogue et retrouvez vos informations au même endroit.</Atout>
      <Atout titre="Des choix visibles">Consultez les options de règlement et de livraison proposées à la commande.</Atout>
      <Atout titre="Un espace pour chaque rôle">Acheteurs, vendeurs et équipe d’administration disposent de parcours dédiés.</Atout>
    </div>
    <span className="absolute bottom-8 right-8 font-titre text-8xl font-bold tracking-[-.08em] text-white/[.04]" aria-hidden="true">NILE</span>
  </div>;
}
function Atout({ titre, children }: { titre: string; children: React.ReactNode }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-blue-950"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></span>
    <span><span className="block text-sm font-bold">{titre}</span><span className="mt-1 block text-xs leading-5 text-blue-100/70">{children}</span></span>
  </div>;
}
