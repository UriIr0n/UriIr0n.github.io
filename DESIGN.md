---
name: אורי עירון — AI + Data Services
description: Dark, data-viz-native services site for a BI analyst offering Power BI+AI, chatbots, and automation
colors:
  page: "#0d0d0d"
  surface: "#1a1a19"
  surface-2: "#222220"
  ink: "#ffffff"
  ink-2: "#c3c2b7"
  ink-3: "#898781"
  grid: "#2c2c2a"
  hairline: "rgba(255,255,255,0.08)"
  hairline-2: "rgba(255,255,255,0.14)"
  accent-blue: "#3987e5"
  accent-green: "#199e70"
  accent-amber: "#c98500"
  accent-purple: "#9085e9"
  accent-coral: "#e66767"
  accent-pink: "#d55181"
  accent-orange: "#d95926"
  good: "#0ca30c"
  critical: "#e05555"
typography:
  display:
    fontFamily: "Heebo, Segoe UI, system-ui, -apple-system, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.125rem, 6vw, 3.625rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.4vw, 2.125rem)"
    fontWeight: 800
  body:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "1px"
rounded:
  s: "10px"
  m: "14px"
  pill: "999px"
spacing:
  section-y-desktop: "92px"
  section-y-mobile: "60px"
  tile-gap: "14px"
components:
  button-primary:
    backgroundColor: "color-mix(in srgb, {colors.accent-blue} 82%, black)"
    textColor: "#ffffff"
    rounded: "{rounded.s}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, {colors.accent-blue} 70%, black)"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.s}"
    padding: "11px 22px"
---

# Design System: אורי עירון — AI + Data Services

## Overview

**Creative North Star: "The Operations Room"**

A dark, data-dense, dashboard-native surface — the visual language of a real BI operations screen, not a marketing template wearing dark mode as a costume. Every accent color, chart type, and card shape already exists because it does real work somewhere on the site (a KPI tile, a chart series, a status pill); nothing is decoration borrowed from a generic SaaS-landing vocabulary. The site inherited this identity from its life as an interactive portfolio and keeps it as the base for its new life as a services site: the confidence comes from *demonstrated* dashboard craft, not from marketing polish layered on top.

For the services pivot, the system stays the same but its center of gravity shifts: the primary accent (`--s1` blue) now carries more visual weight at decision points (hero CTA, service cards' primary action) than it did as a purely restrained portfolio accent — still not "Drenched," but closer to "Committed" at the moments that ask for a click. Confidence, not loudness: bigger claim on attention for the one action that matters (contact), same restraint everywhere else.

**Key Characteristics:**
- Near-black page (`#0d0d0d`) with two lighter surface steps for cards/hover, never true black-on-white anywhere
- Heebo as the only typeface — RTL Hebrew throughout, hierarchy carried by size/weight, not by a second display face
- One primary accent (blue) plus a fixed 7-color chart palette reused everywhere data needs a series color — the palette *is* the brand, not a separate marketing palette
- Real elevation (offset + blur shadows), never a zero-offset glow
- Pill-shaped chips/badges, 14px/10px card radius, thin low-opacity hairline borders as the default separator

## Colors

Palette character: near-black neutrals carry the whole surface; the accent set exists first as a chart/data-viz palette and is reused for UI (buttons, links, active states) rather than the other way around.

### Primary
- **Signal Blue** (`#3987e5` / `--s1`): the one UI accent — primary buttons, active nav, active filter pills, links. For CTA buttons the raw value is too light against white text (3.6:1) and is always darkened via `color-mix(in srgb, var(--s1) 82%, black)` at rest / `70%` on hover — never use the raw token as a button background.

### Secondary — the chart palette (also does UI duty)
- **Emerald** (`#199e70` / `--s2`): positive/success states, second chart series
- **Amber** (`#c98500` / `--s3`): warning/attention states, third chart series
- **Violet** (`#9085e9` / `--s5`): fourth chart series, the hero's single non-gradient emphasis color
- **Coral** (`#e66767` / `--s6`), **Pink** (`#d55181` / `--s7`), **Burnt Orange** (`#d95926` / `--s8`): remaining chart series, used when a dashboard needs more than 3 categories

### Neutral
- **Void** (`#0d0d0d` / `--page`): page background
- **Panel** (`#1a1a19` / `--surface`): card/tile background, one step up from void
- **Panel Hover** (`#222220` / `--surface-2`): hover/active surface, chip backgrounds
- **Ink** (`#ffffff` / `--ink`): primary text, headings
- **Ink Dim** (`#c3c2b7` / `--ink-2`): body/secondary text
- **Ink Faint** (`#898781` / `--ink-3`): tertiary/caption text — **must** sit on `--surface` or darker; on `--surface-2` it fails contrast (4.4:1) and `--ink-2` should be used instead
- **Hairline** (`rgba(255,255,255,.08)` / `.14` for the emphasized variant): the only border/divider treatment; never a solid gray border

### Named Rules
**The Chart-Palette-Is-The-Brand Rule.** Every color on the site is one of the 8 tokens above. No section, button, or badge introduces a new hue — if a new category needs a color, it's assigned from this set, not invented.

## Typography

**Display/Body Font:** Heebo (400/500/600/700/800), with Segoe UI / system-ui / Helvetica Neue / Arial as fallbacks.

**Character:** One typeface carrying the whole hierarchy through size and weight steps (34→58px display at 800, 24→34px section headings at 800, 16px body at 400, 11.5–13px labels/captions at 600–700 tracked). This is a deliberate choice, not a gap — Heebo's weight range is wide enough to carry hierarchy alone, and a second face would fight Hebrew/RTL cohesion.

### Hierarchy
- **Display** (800, `clamp(34px,6vw,58px)`, 1.12): hero H1 only
- **Headline** (800, `clamp(24px,3.4vw,34px)`): section H2s
- **Title** (700, 18–19px): card/tile H3s
- **Body** (400, 16px, 1.55 line-height, max 58ch measure): paragraph copy
- **Label** (600–700, 11.5–13px, 0.2–1.3px tracking, often uppercase kicker): section eyebrows, chart captions, status badges

## Layout

Container max-widths: 1120px for prose/marketing sections, 1240px for dashboard workspaces. Section vertical rhythm: 92px top/bottom on desktop, 60px on mobile (`@media max-width:700px`). Dashboard tile grid is a strict 12-column grid (`col-3/4/6/8/12`) collapsing to 6-col at 980px and 12-col (full stack) at 620px. Card grids use `repeat(auto-fill, minmax(320px,1fr))`. Gap scale: 14px (tiles), 20px (cards), 16px (form/slicer groups).

## Elevation & Depth

Hybrid: mostly flat surfaces (`--surface` on `--page`) separated by hairline borders, with real drop shadows reserved for cards that should feel lifted (project cards on hover, the visitors-live widget, modals). Every shadow carries a real y-offset and blur — never a zero-offset colored halo.

### Shadow Vocabulary
- **Card rest** (`0 14px 32px -26px rgba(0,0,0,.7)`): default resting elevation on interactive cards
- **Card hover** (`0 24px 48px -20px rgba(0,0,0,.85)`): lift on hover, paired with `translateY(-6px)`
- **Modal** (`0 30px 70px -20px rgba(0,0,0,.7)`): dialogs (skills modal)

## Shapes

Two-step radius scale: 14px (`--radius`, cards/panels/modals) and 10px (`--radius-s`, buttons/inputs/small callouts), plus fully pill (999px) for chips, badges, and segmented-filter buttons. Borders are always the 1px hairline token, never a heavier structural border. No colored left/right accent borders except the one deliberate `.impact` callout inside a dashboard's about-panel.

## Components

### Buttons
- **Shape:** 10px radius, 11px/22px padding
- **Primary:** `color-mix(in srgb, var(--s1) 82%, black)` background / white text (darkened from raw `--s1` for contrast); hover darkens further to `70%` mix — hover deepens rather than lightens, since lightening broke contrast
- **Secondary:** `--surface` background, `--ink` text, hairline-2 border; hover moves to `--surface-2`

### Chips / Segmented Filters
- **Chip:** pill radius, `--surface-2` background, hairline border, `--ink-2` text
- **Seg button (filter pill):** same pill/rectangle-hybrid (8px radius) as chips; `.on` state uses `color-mix(accent 22%, surface-2)` background + accent-tinted border + `--ink` text

### Cards / Containers
- **Corner:** 14px radius
- **Background:** `--surface`, hover moves to `--surface-2`
- **Border:** 1px hairline, hairline-2 on hover
- **Shadow:** card rest → card hover on interactive cards only; static tiles stay flat

### Navigation
- Sticky top bar, `rgba(page,.82)` + 12px backdrop-blur, hairline bottom border. Links are `--ink-2` at rest, `--ink` + `--surface-2` pill on hover/active. Mobile collapses padding, not structure (no hamburger menu currently).

### Story Card (signature component)
A recurring callout (💡 icon + prose) under every dashboard's charts that narrates the current filtered state in a full sentence. This is the site's most distinctive UI pattern — reuse this shape whenever a view needs to restate "what you're looking at and why it matters" rather than inventing a new callout style.

## Do's and Don'ts

### Do:
- **Do** darken `--s1` via `color-mix(..., black)` for any UI surface carrying white text at normal size — the raw token fails WCAG AA.
- **Do** treat the primary CTA (contact) as the one place the accent is allowed to claim more visual weight than "restrained portfolio" would normally allow — this is the sharpened-for-conversion adjustment for the services pivot.
- **Do** reuse the 8-color chart palette for any new UI element that needs a color; never introduce a 9th hue.
- **Do** give shadows a real offset+blur; treat a zero-offset glow as a bug.

### Don't:
- **Don't** introduce a second typeface — Heebo's weight range carries the whole hierarchy.
- **Don't** use `--ink-3` on `--surface-2` — that pairing fails contrast; use `--ink-2` there instead.
- **Don't** add gradient text, decorative left-borders, or icon-in-rounded-square tiles as generic ornament — every existing visual device on this site earns its place by doing real data/status work first.
