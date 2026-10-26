# Outils design et animation — NILE

NILE utilise Next.js App Router, React 19, Tailwind CSS 3.4 et pnpm. Les outils doivent être ajoutés progressivement et testés avant fusion sur `main`.

## 1. Motion (anciennement Framer Motion)

Depuis la racine du dépôt :

```bash
pnpm add motion
```

Vérifier que `package.json` et `pnpm-lock.yaml` sont tous deux modifiés, puis lancer :

```bash
pnpm typecheck
pnpm test
pnpm build
```

Exemple dans un composant interactif :

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

La bibliothèque ne doit être utilisée que là où l'animation apporte une vraie valeur. Préserver l'accessibilité et les préférences de réduction des animations.

## 2. Skills Claude Code

Des instructions spécifiques au dépôt sont versionnées dans :
- `.claude/skills/nile-ui-ux/SKILL.md`
- `.claude/skills/motion-react/SKILL.md`
- `.claude/skills/21st-components/SKILL.md`

Claude Code doit être redémarré/rechargé si les nouveaux skills ne sont pas reconnus.

Le skill Motion officiel peut aussi être installé depuis la racine du dépôt avec :

```bash
npx motion-ai
```

Vérifier les choix de l'installateur avant de confirmer.

## 3. 21st.dev / 21st MCP

Le CLI et MCP officiels permettent de rechercher et intégrer des composants. L'activation nécessite un compte et peut nécessiter une clé API.

Installation du CLI :

```bash
npm i -g @21st-dev/cli
21st login
npx @21st-dev/cli install-skill
```

Ou installer le plugin officiel dans Claude Code en suivant les instructions maintenues par 21st :
https://github.com/21st-dev/claude-code-plugin

Ne jamais commiter une clé API. Vérifier la connexion via `/mcp` dans Claude Code.

## 4. Composants

La bibliothèque 21st.dev est un catalogue de composants à rechercher et intégrer individuellement, pas une dépendance unique qu'il faut importer entièrement. Choisir un composant, inspecter ses dépendances et son accessibilité, l'adapter aux tokens de NILE, puis vérifier le build.

## Contrôle final avant fusion

```bash
pnpm typecheck
pnpm test
pnpm build
```

Ne pas fusionner sur `main` tant que CI et le déploiement de prévisualisation ne sont pas verts.
