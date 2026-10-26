---
name: 21st-components
description: Finds and integrates professional React components from 21st.dev while preserving NILE's design system and production quality.
---

# 21st.dev components for NILE

Official portal: https://21st.dev/community/components
Official agent setup: https://21st.dev/mcp

## Workflow
1. Search 21st.dev for an existing component before writing a complex UI from scratch.
2. Prefer components that fit Next.js App Router, React 19 and Tailwind CSS 3.4.
3. Inspect source code, dependencies, accessibility, license/usage terms and client/server boundaries before adding.
4. Adapt colors, typography, radius, spacing and responsive behavior to NILE's existing `DESIGN.md` and Tailwind tokens.
5. Do not paste a full demo page or import unnecessary libraries for a single effect.
6. Keep business logic, checkout, authentication, payment and server actions intact.
7. Run typecheck, tests and production build after integration.

## Suggested NILE component priorities
Product card, search input, category scroller, cart/favorites feedback, skeleton loader, mobile drawer and accessible toast. Integrate one component at a time and verify it on mobile.

## Authentication
21st MCP/CLI may require a personal 21st.dev account/API key. Never commit the key. Configure it locally as `API_KEY_21ST` or use the official Claude Code plugin instructions. Do not invent credentials or claim MCP is connected unless verified.
