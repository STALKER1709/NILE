---
name: NILE — Commerce de confiance
colors:
  background: '#F8F7F3'
  surface: '#FFFFFF'
  surface-muted: '#F0EFE9'
  surface-strong: '#E7E5DF'
  ink: '#111827'
  ink-muted: '#667085'
  primary: '#1E3A8A'
  primary-deep: '#14265D'
  primary-soft: '#E8EDFA'
  accent: '#F59E0B'
  accent-soft: '#FFF0CC'
  border: '#E7E5DF'
  success: '#166534'
  warning: '#92400E'
  danger: '#B42318'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 1.02
    letterSpacing: '-0.045em'
  display-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 1.06
    letterSpacing: '-0.04em'
  heading:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 1.15
    letterSpacing: '-0.035em'
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 1.65
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 1.4
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 1rem
  lg: 1.25rem
  xl: 1.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1360px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  section-padding: 88px
---

## Product direction

NILE is a Cameroonian-first multi-vendor marketplace for physical goods. The design should make local commerce feel dependable, easy to navigate and contemporary without pretending the platform is a global megastore. It must work well on mobile devices, with low bandwidth and familiar payment and delivery expectations.

## Visual concept — The connected trading floor

A modern trading floor translated into a calm editorial shopping experience: confident cobalt blue for orientation and trust, warm orange for decisive actions, paper-like neutral backgrounds, crisp product photography, and a disciplined grid. It should feel more like a well-run commerce platform than a generic template or a discount flyer.

## Brand

- NILE wordmark and the confirmed cobalt/orange/white identity remain recognizable.
- Primary: cobalt blue `#1E3A8A`; deep blue `#14265D`; action orange `#F59E0B`.
- Background: warm paper `#F8F7F3`; surfaces white; ink `#111827`.
- Orange is reserved for primary conversion actions, price promotions and small emphasis.
- Orange Money and MTN MoMo logos may appear only as recognizable payment-provider marks, not as evidence of endorsement or live integration. The available methods must be described according to actual deployment configuration.

## Typography

Hanken Grotesk is used for headlines and Inter for interface/body text. Large headlines are compact and expressive; operational interfaces prioritize legibility, stable numeric alignment and short labels.

## Layout and components

- Public commerce pages use a wide editorial grid with a strong first viewport and predictable category/product discovery.
- Buyer, seller and admin workflows have distinct shells; marketing chrome must not leak into operational dashboards or authentication forms.
- Cards use crisp borders, restrained corner radii and minimal shadows. Avoid excessive pill shapes, gradients, floating glass panels and generic dashboard-card walls.
- Use an 8px spacing rhythm, 12-column desktop grid, 4-column mobile grid and a 1360px maximum content width.
- Product cards prioritize image, name, price, stock/availability and a clear action. Keep interaction targets comfortable on touch screens.

## Responsive and accessibility

- Mobile-first, usable at 320px width and with a slow connection.
- Keep the essential purchase path visible and reduce decorative assets that compete with product discovery.
- Preserve semantic HTML, visible focus, keyboard access, sufficient contrast, reduced-motion support and descriptive image alternatives.
- Do not invent reviews, sales counts, delivery guarantees, partnership claims or payment availability.
