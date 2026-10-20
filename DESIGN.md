---
name: NILE — Le marché sans frontières
colors:
  background: '#F7F8FC'
  surface: '#FFFFFF'
  surface-muted: '#F1F3F8'
  surface-strong: '#E7EAF0'
  ink: '#151D32'
  ink-muted: '#6D7689'
  primary: '#1E3A8A'
  primary-deep: '#13275E'
  primary-soft: '#EAF0FF'
  accent: '#F59E0B'
  accent-soft: '#FFF2D4'
  border: '#E7EAF0'
  success: '#14845D'
  warning: '#92400E'
  danger: '#B42318'
typography:
  display:
    fontFamily: Manrope
    fontSize: 54px
    fontWeight: '800'
    lineHeight: 1.1
    letterSpacing: '-0.045em'
  display-mobile:
    fontFamily: Manrope
    fontSize: 35px
    fontWeight: '800'
    lineHeight: 1.1
    letterSpacing: '-0.035em'
  heading:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 1.2
    letterSpacing: '-0.03em'
  body:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 1.5
  label:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 1.4
rounded:
  sm: 0.5rem
  DEFAULT: 0.625rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  2xl: 1.0625rem
  3xl: 1.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1240px
  gutter: 22px
  margin-mobile: 14px
  margin-desktop: 22px
  section-padding: 36px
shadows:
  default: '0 6px 22px rgba(20, 35, 73, 0.07)'
  hover: '0 14px 40px rgba(20, 35, 73, 0.08)'
  floating: '0 8px 24px -4px rgba(20, 35, 73, 0.10)'
---

## Product direction

NILE is a Cameroonian-first multi-vendor marketplace for physical goods. The interface helps people discover products from local sellers, compare clear product details, and understand each order's available options. It is mobile-first and must remain useful on slow networks and modest devices.

## Visual concept — the connected trading floor

Follow the supplied NILE reference: a clean white shopping header under a compact deep-blue service strip; a warm pale-blue-to-amber hero; product photography framed like a curated shop window; restrained white cards; navy promotion panels; and orange reserved for decisive actions and real promotion cues. It should feel like contemporary commerce, not a generic dashboard or discount flyer.

## Brand

- Primary cobalt: `#1E3A8A`; deep service blue: `#13275E`; secondary cobalt: `#2849A5`.
- Action orange: `#F59E0B`; soft orange: `#FFF2D4`.
- Page paper: `#F7F8FC`; surfaces: white; ink: `#151D32`; muted copy: `#6D7689`; borders: `#E7EAF0`.
- Display and interface headings use **Manrope** (700–800); interface/body copy uses **DM Sans**.
- Orange is for primary actions, active navigation cues, and actual offers—not for every panel.
- MTN MoMo and Orange Money marks identify payment providers only. They do not imply endorsement or live integration; checkout options are determined by runtime configuration.

## Layout and components

- Public shopping pages use a 1240px editorial grid, clear product discovery, compact utility header, white search field, and white navigation with an orange active underline.
- Hero sections use a pale blue-to-cream field and real NILE catalog imagery—not fabricated product or review data.
- Product cards prioritize image, title, price, availability, real promotion status, and one clear action.
- Buyer/checkout, seller, and admin surfaces share the same visual language but retain separate shells and operational navigation.
- Use an 8px rhythm, 12–17px card radii, 20–28px feature-panel radii, subtle borders, and restrained shadows.
- Never fill an empty state with invented ratings, countdowns, stock claims, delivery promises, or customer statistics.

## Responsive and accessibility

- Work from 320px width upward; keep search discoverable on mobile and preserve touch targets around 44px.
- Preserve server authorization, checkout validation, inventory/variant handling, provider-verified payment status, seller KYC, and admin controls.
- Use semantic links and buttons, visible keyboard focus, accessible labels, descriptive image alternatives, stable loading/error states, and reduced-motion support.
