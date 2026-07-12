/**
 * Icône de rayon choisie d'après le nom/slug de la catégorie.
 * Trait cohérent (1.8), remplace les pastilles à initiale.
 */
export function IconeCategorie({ nom, taille = 22 }: { nom: string; taille?: number }) {
  const cle = nom.toLowerCase();
  const props = {
    width: taille,
    height: taille,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (/électro|electro|téléphon|telephon|informat|tv|audio/.test(cle)) {
    return (
      <svg {...props}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </svg>
    );
  }
  if (/maison|cuisine|meuble|déco|deco|électromén/.test(cle)) {
    return (
      <svg {...props}>
        <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 21v-8h6v8" />
      </svg>
    );
  }
  if (/mode|vêtement|vetement|chaussure|textile|accessoire/.test(cle)) {
    return (
      <svg {...props}>
        <path d="m8 4-5 4 3 3 2-1.5V20h8v-10.5L18 11l3-3-5-4a4 4 0 0 1-8 0z" />
      </svg>
    );
  }
  if (/beauté|beaute|santé|sante|cosmét|cosmet|parfum|hygiène|hygiene/.test(cle)) {
    return (
      <svg {...props}>
        <path d="M12 21C7 17 3 13.6 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5c0 4.1-4 7.5-9 11.5z" />
      </svg>
    );
  }
  if (/sport|fitness|loisir/.test(cle)) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a15 15 0 0 1 0 18M3.5 9h17M3.5 15h17" />
      </svg>
    );
  }
  if (/enfant|bébé|bebe|jouet|jeu/.test(cle)) {
    return (
      <svg {...props}>
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M12 8V5.5A1.5 1.5 0 0 1 13.5 4H14" />
        <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
        <path d="M9.5 16.5c1.6 1 3.4 1 5 0" />
      </svg>
    );
  }
  if (/aliment|épicerie|epicerie|boisson|courses/.test(cle)) {
    return (
      <svg {...props}>
        <path d="M5 8h14l-1.5 12a2 2 0 0 1-2 1.8h-7A2 2 0 0 1 6.5 20z" />
        <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
      </svg>
    );
  }
  // rayon générique
  return (
    <svg {...props}>
      <path d="m3.7 12.3 8-8a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.9a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-5.9-5.9a2 2 0 0 1 0-2.8z" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
