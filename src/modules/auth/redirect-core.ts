/** Accepte uniquement un chemin local afin d'éviter les redirections ouvertes. */
export function cheminInterneSecurise(value: string | null | undefined): string | null {
  const chemin = value?.trim() ?? "";
  if (
    !chemin.startsWith("/") ||
    chemin.startsWith("//") ||
    chemin.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(chemin)
  ) {
    return null;
  }

  try {
    const url = new URL(chemin, "https://nile.invalid");
    if (url.origin !== "https://nile.invalid") return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
