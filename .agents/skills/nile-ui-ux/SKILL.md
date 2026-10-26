---
name: nile-ui-ux
description: Apply professional UI/UX and visual design standards to NILE marketplace pages and components. Use when building or reviewing frontend layouts, responsive behavior, accessibility, interaction states, product cards, navigation, checkout, and motion.
---

# NILE UI/UX design skill

## Project context
- NILE is a Cameroon-focused, mobile-first multi-vendor marketplace.
- Keep the experience fast on low-end phones and slow or expensive connections.
- Preserve existing Next.js App Router, React, TypeScript, Tailwind CSS, authentication, cart/favorites events, checkout, and Mobile Money flows.
- Respect the existing brand palette and tokens in DESIGN.md and tailwind.config.ts; do not invent a new visual identity without explicit request.

## Before changing UI
1. Inspect the target page, its parent layout, existing components, DESIGN.md, and relevant tests.
2. Reuse existing components and design tokens before adding dependencies or duplicating components.
3. Search the 21st.dev catalog for a suitable component before hand-writing a large new pattern. Adapt the returned code to NILE's tokens and accessibility needs.
4. Keep changes focused. Do not alter API contracts, business logic, payment state, auth, or data models as part of a visual change.

## Visual quality
- Establish a clear hierarchy, readable type scale, consistent spacing, restrained shadows, and intentional alignment.
- Design mobile-first; test narrow screens, tablet, and desktop.
- Include loading, empty, error, disabled, focus, hover, pressed, and success states where relevant.
- Ensure semantic HTML, keyboard navigation, visible focus, accessible names, sufficient contrast, and reduced-motion support.
- Avoid generic gradients, excessive glassmorphism, decorative clutter, and unneeded animation.

## Motion
- Use motion/react only in client components that need animation.
- Prefer short, purposeful transitions; animate opacity and transform where possible.
- Respect prefers-reduced-motion using Motion's reduced-motion support or an equivalent accessible fallback.
- Do not animate every element, block navigation, or make checkout/cart interactions feel slower.
- Keep server components as server components unless client-side interaction is required.

## 21st.dev components
- Search first, inspect component dependencies and source, and install only what fits the use case.
- Keep component code local and review it before accepting; never blindly overwrite shared UI.
- Do not add shadcn/ui or other dependencies just because a catalog component uses them. Check compatibility and explain required additions first.
- Ensure any added component follows existing TypeScript, Tailwind, and project conventions.

## Validation
- Run the relevant tests and typecheck, then the production build when feasible.
- Review mobile responsiveness and console/build errors.
- Never claim device push notifications, payment behavior, or real-world mobile behavior has been tested unless it was actually exercised.
- Keep changes on a feature branch and merge to main only after checks pass.