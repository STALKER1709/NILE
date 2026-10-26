---
name: nile-ui-ux
description: Applies NILE's product design system, accessibility, responsive and performance standards when building or reviewing UI.
---

# NILE UI/UX design standards

Before changing UI, inspect the existing component, route, design tokens in `DESIGN.md`, Tailwind configuration, and mobile navigation. Preserve current behavior and data flows.

## Product context
- NILE is a mobile-first multi-vendor marketplace for Cameroon.
- Optimize for low-bandwidth connections, affordable Android devices, touch input, and imperfect network conditions.
- Keep the existing brand palette and tokens; do not invent a second visual system.
- Prioritize product discovery, search, trust, seller clarity, cart, favorites, checkout, and Mobile Money flows.

## Quality checklist
- Start with small screens; verify responsive behavior at 320px, 375px, 768px and desktop widths.
- Use semantic HTML, visible focus states, keyboard access, accessible names and sufficient contrast.
- Respect `prefers-reduced-motion`; never make essential information depend on animation.
- Avoid layout shifts, excessive blur, oversized video, unnecessary dependencies and heavy client components.
- Prefer existing components and CSS/Tailwind transitions for simple effects; use Motion only when it materially improves interaction.
- Preserve loading, empty, error, offline and success states.
- Keep server components by default; add `"use client"` only where required.
- Never replace live data with mock data or remove functionality to improve appearance.

## Workflow
1. Inspect the target page and related components.
2. State the intended UX change briefly.
3. Implement the smallest coherent change.
4. Run typecheck, tests and production build when available.
5. Review mobile layout, accessibility, loading/error states and bundle impact.
6. Do not merge or deploy unless checks pass. For NILE changes, target `main` only through a verified PR.
