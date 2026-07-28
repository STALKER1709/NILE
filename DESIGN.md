---
name: Lumina Nile
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404946'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707976'
  outline-variant: '#bfc9c5'
  surface-tint: '#2d685f'
  primary: '#00352f'
  on-primary: '#ffffff'
  primary-container: '#0a4d45'
  on-primary-container: '#82bdb2'
  inverse-primary: '#97d2c7'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#242f41'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a4558'
  on-tertiary-container: '#a7b2c9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b2eee3'
  primary-fixed-dim: '#97d2c7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#0f5048'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  nile-deep: '#062C29'
  accent-gold: '#D97706'
  slate-900: '#0F172A'
  surface-subtle: '#F1F5F9'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 80px
---

## Brand & Style

The design system is rooted in the concepts of "Flow and Precision." It targets a sophisticated audience that values both innovation and the reliability of established institutions. The brand personality is professional, calm, and forward-thinking, evoking an emotional response of security paired with cutting-edge capability.

The visual style is **Corporate Modern with a Minimalist edge**. It leverages high-quality typography and generous whitespace to create a premium feel. Subtle depth is achieved through tonal layering rather than aggressive shadows, ensuring the interface feels light, fast, and structured. This approach avoids the clutter of traditional enterprise software while maintaining the "trustworthy" essence of the original Nile brand.

## Colors

The palette is a refined evolution of the original colors. The primary green (`#0A4D45`) has been slightly adjusted for better accessibility and a more modern, jewel-toned depth. It represents stability and growth. The secondary gold (`#F59E0B`) is used sparingly as an "action" or "highlight" color to draw attention to critical conversion points without overwhelming the professional aesthetic.

The neutral palette shifts toward a cooler "Slate" spectrum to ensure the interface feels crisp and modern. We utilize a "Light" default mode with high-contrast text (`#0F172A`) to ensure maximum legibility and a premium, paper-like quality. Backgrounds use very subtle grays to distinguish between different content zones without needing heavy borders.

## Typography

This design system utilizes a dual-font strategy to balance character with utility. **Hanken Grotesk** is used for headlines; its sharp, contemporary geometry provides a "designed" feel that signals innovation. For body text and data-heavy interfaces, **Inter** is employed for its exceptional legibility and neutral, systematic tone.

Text hierarchy is strictly enforced through weight and scale. Large display headers use tight letter spacing to feel more cohesive, while small labels use slightly increased tracking to ensure clarity at small sizes. All body text is optimized for a comfortable 1.5x line height to promote reading endurance.

## Layout & Spacing

The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A consistent 8px base unit (the "spacing rhythm") governs all margins and paddings, ensuring mathematical harmony across the interface.

On desktop, the container is centered with a maximum width of 1280px to prevent line lengths from becoming unreadable. Whitespace is used intentionally as a structural element—sections are separated by significant vertical padding (`80px`) to create a sense of "premium" breathing room. Elements should be "stacked" using the defined stack variables to maintain consistent grouping logic.

## Elevation & Depth

This design system moves away from traditional heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

1.  **Level 0 (Base):** The primary background color (`#F8FAFC`).
2.  **Level 1 (Cards/Surface):** White background with a 1px border (`#E2E8F0`). No shadow.
3.  **Level 2 (Interaction):** White background with a very soft, ambient shadow (Color: `#0A4D45` at 4% opacity, 12px blur, 4px Y-offset). Used for hovered states or menus.
4.  **Overlays:** High-diffusion "shadow-glows" using the primary green tint are reserved for modals to suggest focus without using harsh blacks.

## Shapes

The shape language is "Refined-Rounded." By using a **0.5rem (8px)** base roundedness, we avoid the clinical feel of sharp corners while remaining more professional than fully pill-shaped "playful" designs. 

Buttons, input fields, and cards all share this 8px radius to create a unified visual language. Larger components, like hero sections or large containers, may scale up to `rounded-xl` (1.5rem) to emphasize their role as structural containers.

## Components

### Buttons
- **Primary:** Solid primary green (`#0A4D45`) with white text. 8px radius.
- **Secondary:** Transparent background with a 1px border of primary green.
- **Tertiary:** Text-only with a subtle background hover state (`#F1F5F9`).
- **Interaction:** All buttons should have a 150ms transition on hover, slightly darkening the background.

### Input Fields
- Inputs use a white background, 1px slate-200 border, and `body-md` typography.
- On focus, the border changes to primary green with a 2px "soft glow" (box-shadow) in the same color at 10% opacity.

### Cards
- Cards are the primary container for information. They feature a white background, 1px `#E2E8F0` border, and 24px internal padding. 
- Avoid heavy shadows; use a subtle 1px border to define the edge.

### Chips & Tags
- Used for categorization. These should have a `rounded-full` (pill) shape to contrast against the 8px corners of larger containers. 
- Use low-saturation background tints of the primary or secondary colors with dark text for high legibility.

### Data Tables
- Use `body-sm` for table content. Row separators should be minimal (`1px solid #F1F5F9`). Headers should use `label-xs` (uppercase) for clear distinction.