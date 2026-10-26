---
name: motion-react
description: Uses Motion for React safely in NILE's Next.js App Router for performant accessible animations.
---

# Motion for React in NILE

Official docs: https://motion.dev/docs/react

## Installation
The application uses pnpm, Next.js App Router and React 19. Add the `motion` package with `pnpm add motion` and commit the matching `pnpm-lock.yaml` update. Never edit the lockfile by hand. Confirm dependency installation and build before using imports.

## Imports
- Client components: `import { motion, AnimatePresence } from "motion/react"` after adding `"use client"`.
- Where supported and appropriate, use `import * as motion from "motion/react-client"` to reduce client JavaScript.
- Keep server components server-side unless an interactive animation requires a client boundary.

## Standards
- Use short, purposeful animations (typically 150–300ms); avoid animating every element.
- Prefer transform and opacity; avoid animating layout-affecting properties unless needed.
- Respect reduced motion with `MotionConfig reducedMotion="user"` or explicit reduced-motion handling.
- Avoid autoplay, scroll hijacking, excessive spring bounce and animation that delays checkout.
- Use `AnimatePresence` for exit transitions only where it improves clarity.
- Test touch interactions and reduced-motion behavior; hover cannot be the only interaction.
- Keep cart, favorites, payment, authentication and notification logic unchanged when adding visual effects.
