# Design

## Design References
- https://www.tasteskill.dev/ — clean, minimal, large type
- https://emilkowal.ski/ — typography and whitespace focus
- https://impeccable.style/ — polished component work
- https://phosphoricons.com/ — phosphor icons

## Design Decisions (Applied)

### Color Palette — "Document & Ink"
- **Background:** Warm off-white (`hsl(42 20% 97%)`) — easier on the eyes than pure white
- **Primary (brand):** Deep indigo (`hsl(212 53% 25%)`) — evokes document archives, professional tone
- **Accent (CTA):** Amber/gold (`hsl(38 92% 50%)`) — ink/paper contrast, used for CTAs and highlights
- **Muted:** Warm gray (`hsl(40 16% 92%)`) — subtle card/secondary backgrounds
- **Success:** Muted emerald (`hsl(160 84% 39%)`) — OCR completion status
- **Destructive:** Red (`hsl(0 72% 51%)`)
- **Dark mode:** Deep slate background (`hsl(222 47% 8%)`) with amber primary — accent pops against dark

### Typography
- **UI text:** Inter (sans-serif, 400/500/600/700 weights)
- **Display/headings:** Playfair Display (serif, 600/700 weights) — sophisticated "document" feel for large headings
- **Nepali text results:** Noto Sans Devanagari (400/500/600/700 weights) — proper Devanagari glyph rendering

### OCR Upload Layout
- **Desktop:** Horizontal split — upload zone/preview on the left, result panel on the right, divided by a vertical rule
- **Mobile:** Stacked vertically — upload on top, result below
- Drop zone: Dotted border, amber accent on hover, pulse-glow animation when dragging
- Result panel: Scrollable text area with `font-devanagari`, copy button, engine/metadata display

### Micro-interactions
- Drop zone border glows amber with a pulse animation on drag-over
- Upload button subtle scale on hover
- Processing state: amber-accent scanning line sweeping down the preview image
- Copy button: brief toast notification ("Copied to clipboard") via sonner
- Dark mode: smooth CSS transition via class toggle on `<html>`

### Dark Mode
- Toggle in navbar (sun/moon icon), persisted to `localStorage`
- Respects `prefers-color-scheme` on first visit
- All components use CSS custom properties — no separate dark stylesheets needed

### Navbar
- Sticky with backdrop-blur, subtle bottom border and shadow when scrolled
- Nav links: muted foreground, hover to solid foreground, rounded hover background
- Auth CTAs: outlined Sign In + solid primary Sign Up
- Dark mode toggle icon next to auth buttons
- Mobile: hamburger menu with full-width dropdown