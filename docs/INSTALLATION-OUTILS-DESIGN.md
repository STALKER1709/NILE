# Outils design et animation — NILE

NILE utilise Next.js App Router, React 19, TypeScript, Tailwind CSS 3.4 et pnpm. Motion est compatible avec React 18.2 et supérieur. Voir la documentation officielle : https://motion.dev/docs/react-installation.

## 1. Installer Motion et les skills

Depuis PowerShell, à la racine du dépôt NILE :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-design-tools.ps1
```

Le script :
- ajoute le paquet `motion` au projet via pnpm et met à jour `package.json` ainsi que `pnpm-lock.yaml` ;
- installe le skill officiel Motion ;
- installe les skills 21st.dev via skills.sh et le CLI officiel.

Si tu préfères installer Motion séparément :

```powershell
pnpm add motion
npx --yes motion-ai
npx --yes skills add 21st-dev/skill -y
npx --yes @21st-dev/cli install-skill
```

Exemple d'animation dans un composant interactif :

```tsx
"use client";

import { motion } from "motion/react";

export function ExampleMotion() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      Contenu
    </motion.div>
  );
}
```

N'ajoute `"use client"` qu'aux composants qui en ont besoin. Pour les composants compatibles, `motion/react-client` peut limiter le JavaScript client. Privilégie les animations courtes et respecte `prefers-reduced-motion`.

## 2. Skills Claude Code versionnés dans le dépôt

- `.claude/skills/nile-ui-ux/SKILL.md` : règles responsive, accessibilité, performances et parcours marketplace.
- `.claude/skills/motion-react/SKILL.md` : usage responsable de Motion dans Next.js App Router.
- `.claude/skills/21st-components/SKILL.md` : recherche, revue et intégration de composants 21st.dev.

Les instructions sont dans le dépôt. Les skills installés par les commandes ci-dessus complètent ces règles.

## 3. Connecter 21st MCP dans Claude Code

La connexion MCP nécessite une session Claude Code locale et une clé API 21st.dev. Aucune clé ne doit être commitée.

Dans Claude Code, exécute :

```text
/plugin marketplace add 21st-dev/claude-code-plugin
/plugin install 21st@21st
```

Obtiens une clé sur https://21st.dev/settings/api-keys et configure la variable d'environnement `API_KEY_21ST` dans l'environnement qui lance Claude Code. Redémarre ou recharge Claude Code puis vérifie avec `/mcp` que le serveur `21st` est connecté.

Documentation officielle : https://github.com/21st-dev/claude-code-plugin

## 4. Ajouter des composants 21st.dev

21st.dev est un catalogue, pas un paquet unique à importer intégralement. Cherche un composant adapté au besoin, inspecte son code, ses dépendances, son accessibilité et sa compatibilité avec Tailwind 3.4, puis adapte-le aux tokens et au système de design existants de NILE.

Priorités recommandées : recherche, cartes produit, carrousel de catégories, états de chargement, tiroir mobile et notifications accessibles. Ne remplace pas les données réelles par des données fictives et ne modifie pas les flux de paiement ou d'authentification pour une simple refonte visuelle.

## 5. Contrôle avant fusion

```powershell
pnpm typecheck
pnpm test
pnpm build
```

Vérifie aussi le rendu à 320 px, 375 px, 768 px et desktop, le clavier, les états de chargement/erreur et les préférences de réduction des animations. Ne fusionne pas un changement UI si les contrôles CI échouent.

## Limites d'exécution

Le script d'installation s'exécute sur la machine du développeur, pas sur GitHub. Après l'avoir lancé localement, vérifie `git status`, puis committe et pousse les fichiers générés par pnpm et les éventuelles configurations non sensibles. N'ajoute jamais une clé API ou un jeton au dépôt.
