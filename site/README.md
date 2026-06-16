# Yoonspace — marketing studio website

A modern, fully responsive five-page marketing site for **Yoonspace**, a full-service
marketing agency in Ōtautahi Christchurch, New Zealand.

Static HTML + Tailwind CSS. No build step required to view — just open `index.html`.

## Pages

| File | Page |
|------|------|
| `index.html` | Home — hero, services, selected work, stats, process, testimonial |
| `services.html` | Services — detailed offer, engagement models, pricing |
| `work.html` | Work — filterable case-study grid |
| `about.html` | About — story, values, team |
| `contact.html` | Contact — project brief form + details |

## Design system

- **Concept:** *space* — room for brands to grow — grounded in Christchurch's story of
  rebuilding and reinvention. Signature motif: an **orbit** (the hero wordmark, the
  numbered process, the logo glyph).
- **Colour (cosmic theme):** starfield void `#05060F`, panel `#0E1124`,
  nebula violet `#7C5CFF`, aurora cyan `#2FC6FF`, starlight gold `#FFD37A`,
  text `#ECEEFB`. Dark, space-themed throughout with a fixed starfield + nebula glows.
- **Type:** Bricolage Grotesque (display) · Space Grotesk (body) · Space Mono (labels/data),
  loaded from Google Fonts.

## Files

```
site/
├── index.html  services.html  work.html  about.html  contact.html
├── assets/
│   ├── tailwind.css   ← compiled Tailwind utilities (do not edit by hand)
│   ├── styles.css     ← bespoke styles: orbit motion, marquee, reveals, type
│   └── main.js        ← nav, scroll reveals, count-up, work filter, form demo
└── README.md
```

## Running it

Open `index.html` in any browser, or serve the folder:

```bash
cd site && python3 -m http.server 8000   # then visit http://localhost:8000
```

## Editing styles (Tailwind)

`assets/tailwind.css` is precompiled (no runtime CDN — faster, no flash of unstyled
content). If you change the Tailwind classes in the HTML, recompile:

```bash
npx tailwindcss@3 -i input.css -o site/assets/tailwind.css --minify
```

with an `input.css` of `@tailwind base; @tailwind components; @tailwind utilities;`
and a `tailwind.config.js` whose `content` points at `site/**/*.html` and whose
`theme.extend` carries the colours/fonts above.

## Before going live — placeholders to replace

- **Copy & case studies** are illustrative. Client names (Port Hills Coffee, Avon Cycles,
  Tussock Outdoor, etc.), metrics, team members, the testimonial, address, phone and
  email are placeholders — swap in real details.
- **Images:** project cards use colour gradients as stand-ins. Drop in real photography
  (use WebP + `srcset` for performance) and add descriptive `alt` text.
- **Contact form** runs entirely in the browser (demo). Wire it to your inbox, a form
  service (Formspree/Basin), or your CRM before launch.

## Accessibility & performance notes

- Semantic landmarks, skip link, labelled form fields, visible keyboard focus rings.
- `prefers-reduced-motion` is respected — orbit, marquee and reveals all stand down.
- Fluid type via `clamp()`; tested at 390 / 768 / 1024 / 1440px with no horizontal scroll.
- No runtime JS framework; ~19 KB of CSS plus one small vanilla JS file.
