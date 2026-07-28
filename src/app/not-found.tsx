import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      <p className="text-5xl font-bold text-nile">404</p>
      <h1 className="text-titre-sm text-nile-800 sm:text-titre-md">Page introuvable</h1>
      <p className="text-slate-600">
        Cette page n'existe pas ou n'est plus disponible.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/" className="rounded bg-nile px-4 py-2 text-sm font-medium text-white hover:bg-nile-dark">
          Accueil
        </Link>
        <Link href="/catalogue" className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Catalogue
        </Link>
      </div>
    </div>
  );
}
