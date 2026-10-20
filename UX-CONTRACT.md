# NILE — UX contract

## Scope
This redesign changes the presentation and navigation shell only. Existing server actions, data contracts, authorization checks, inventory rules, payment-provider verification, order states, seller KYC policy and admin operations remain authoritative and must not be bypassed by UI.

## Route families and shell ownership
- Public commerce: `/`, `/catalogue`, `/produit/*`, `/boutiques`, `/boutique/*`, `/promotions`, `/reels`, help, contact and legal pages. Uses the public header, category navigation, footer and mobile tab bar.
- Authentication: `/connexion`, `/inscription`, password recovery and reset. Uses a quiet standalone auth shell; no commerce navigation that competes with form completion.
- Buyer account: `/compte`, `/commandes`, `/favoris`, `/notifications`, `/compte/profil`. Uses a dedicated account workspace and contextual side navigation.
- Checkout: `/panier`, `/commander`, `/paiement/*`. Uses a minimal purchase shell without the account sidebar, to preserve focus.
- Seller workspace: `/vendeur/*`. Uses Seller Studio with task navigation, order queue visibility and a clear primary action to add a product.
- Administration: `/admin/*`. Uses NILE Control with distinct operational navigation and a protected server-side role check.

## Non-negotiable behavior
- Visual components never authorize an operation. Existing server-side role checks and action validations remain in place.
- Do not state that a payment succeeded based only on a browser return. The provider's verified status is authoritative.
- Never suggest Orange or MTN has endorsed NILE. Provider logos identify the brands only. Show payment options according to runtime availability.
- Do not invent delivery fees, free delivery, ratings, customer counts, transaction success rates or other commercial proof.
- Preserve stock validation, variant selection, COD eligibility, seller KYC, order cancellation windows and reconciliation semantics.
- Checkout must remain keyboard-usable and mobile-first; errors must preserve entered values and explain the next action.

## Shared visual behavior
- Cobalt is navigation and trust; orange is the primary conversion accent; warm paper separates the marketplace from operational workspaces.
- Cards, form fields, buttons, empty states and badges share the canonical components in `src/components/ui/kit.tsx`.
- Interactive elements use native links/buttons, visible focus, touch-sized controls and reduced-motion support.
- Desktop workspaces use persistent side navigation; mobile converts it to a horizontal, scrollable navigation rather than hiding routes.
