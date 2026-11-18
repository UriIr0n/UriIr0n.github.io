# Design system (recruiter redesign, 2026-11-18)

Direction "מכאוס לדוח", palette "ירוק עמוק", picked by Uri from 3 hero directions and 6 palettes.

## Colors

| Token | Value | Use |
|---|---|---|
| `--page` | `#0f2621` | page background (bottle green) |
| `--surface` / `--surface-2` | `#15322b` / `#1c3d35` | cards, hover |
| `--ink` / `--ink-2` / `--ink-3` | `#eef3ef` / `#c3d4cb` / `#8ea69b` | text levels |
| `--mint` | `#d6e7de` | hero particles, fact numbers |
| `--gold` | `#f0c14b` | the one accent: primary buttons, CV button, status dot, dates, highlighted bar |
| `--s1`...`--s8` | unchanged chart series | data colors inside dashboards only |

Gold is the only UI accent. Chart series colors stay for data, never for chrome.

## Type

- Rubik (300 for the light half of headlines, 700 for the bold half, 400/500 body).
- IBM Plex Mono for small data labels: dates, phase line, captions, project "world" line.

## Signature element

`js/hero.js`: 1,500 points on a Canvas 2D, a rotating cloud that eases into a 7-bar chart and back on a 10 s loop, tallest bar in gold. Pauses when the home page is hidden; static (chart state) under reduced motion. No libraries.

## Rules

- No emoji as icons. UI glyphs (✕, ☰, ▶) are fine.
- Pill buttons (999px), cards 18px radius, hairline dividers between sections.
- New styles go in `css/redesign.css` (loaded after `style.css`), which holds the overrides.
- The pre-redesign design system (dark "Operations Room", Heebo, blue accent) is in git history before this commit.
