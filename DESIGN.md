# Bauhaus Design System

> "Form follows function." — Bauhaus, Weimar 1919–1933

A design language derived from the Bauhaus school: geometric, primary-colored, grid-based, and unapologetically functional. Use this as a reference for building UI that channels that aesthetic (landing pages, admin panels, marketing sites, infographics).

---

## 1. Origins & Philosophy

- **Founded:** Weimar, Germany, 1919, by Walter Gropius (Staatliches Bauhaus)
- **Mission:** Unite art, craft, and technology into a single functional design discipline for the modern industrial era
- **Core principle:** Strip ornament. Every shape and color earns its place by serving structure or function, not decoration.

---

## 2. Color Palette

Bauhaus uses a strict, limited primary palette plus black. No gradients, no tints, no shadows — flat, saturated fields only.

| Role | Color | Hex (reference) |
|---|---|---|
| Primary Yellow | Mustard/gold | `#F4B400` – `#F5C518` |
| Primary Blue | Cobalt blue | `#3B5CE6` – `#2255D6` |
| Primary Red | Vermilion/red-orange | `#E8432E` – `#EE4035` |
| Accent Black | Ink black | `#111111` |
| Base White | Paper white | `#FFFFFF` / `#F7F7F5` (off-white grid background) |

**Rules:**
- Pick 3–4 colors max per composition (yellow, blue, red, black on white).
- Use colors as **solid fills**, never gradients.
- Black is reserved for text, key accent circles, and high-contrast focal shapes.
- Backgrounds are white or a very light warm-grey grid, never colored except as a full-bleed frame (e.g. a yellow border/margin).

```css
:root {
  --bauhaus-yellow: #F4B400;
  --bauhaus-blue:   #2255D6;
  --bauhaus-red:    #E8432E;
  --bauhaus-black:  #111111;
  --bauhaus-white:  #FFFFFF;
  --bauhaus-grid-bg: #F5F5F2;
}
```

---

## 3. Shapes & Forms

The core vocabulary is a small set of pure geometric primitives, used repetitively and combinatorially.

- **Circle** — unity, completeness. Often split into half-circles or quarter-circles butted against other shapes.
- **Square / Rectangle** — structure, stability. Used for grid blocks and containment.
- **Triangle / Diamond** — dynamism, direction. Used sparingly as accents.
- **Semi-circles & quarter-circles** — the signature Bauhaus move: circles cut and tiled into a grid so they read as both geometric *and* organic.

**Construction rules:**
- Shapes tile edge-to-edge against an invisible grid — no floating shapes with arbitrary gaps.
- Combine 2–3 shape types per composition, repeated at varying scale.
- Large flat shapes as backdrops (hero sections), small shapes as bullet/icon markers.
- Occasional single black filled circle as a focal "anchor" point in an otherwise colorful field.

---

## 4. Typography

- **Sans-serif only.** Geometric sans faces (e.g. Futura, Century Gothic, Poppins, Space Grotesk, or system sans) — no serifs, no scripts, no decoration.
- **No ornamentation:** no drop shadows, no outlines, no italics for emphasis — weight and size carry hierarchy instead.
- **Historical detail:** Herbert Bayer's Bauhaus philosophy pushed a *universal lowercase alphabet* (eliminating uppercase entirely) as an efficiency/functionalist statement. Optional but authentic touch: set body/label text in all-lowercase.
- **Hierarchy via scale + weight**, not typeface changes:
  - Display/Wordmark: 800–900 weight, huge scale, tight tracking, often all-caps and bleeding off the frame edge.
  - Headline: 700–800 weight, large scale.
  - Section labels: 700 weight, uppercase, smaller scale, wide letter-spacing.
  - Body: 400–500 weight, regular case (or lowercase for authenticity), generous line-height.

```css
--font-bauhaus: 'Poppins', 'Futura', 'Century Gothic', system-ui, sans-serif;

--fs-display: clamp(3rem, 8vw, 7rem);
--fw-display: 900;

--fs-h1: clamp(2rem, 4vw, 3rem);
--fw-h1: 800;

--fs-label: 0.85rem;
--fw-label: 700;
--ls-label: 0.05em; /* letter-spacing */

--fs-body: 1rem;
--fw-body: 400;
--lh-body: 1.6;
```

---

## 5. Layout & Composition

- **Grid-based:** everything sits on a strict underlying grid (visible or implied), including a faint graph/grid background texture in editorial layouts.
- **Asymmetrical balance:** avoid centered, symmetric layouts. Weight one side with a dense shape cluster; keep the other side calm/negative space. Balance is achieved through visual weight, not mirroring.
- **Systematic repetition:** repeat a module (e.g. a row of alternating half-circles and squares) across a header band rather than one-off illustrations.
- **Full-bleed color frames:** an outer colored margin (often yellow) containing an inset white content panel is a recurring device for hero/landing sections.
- **Content zones stay clean:** where actual text/UI content lives (nav, headline, body copy, buttons), keep the background plain white — geometric decoration surrounds but doesn't compete with content.
- **Circles as section dividers:** a large color circle bleeding off an edge is a common way to break monotony between content blocks (see "Legacy Today" section using a blue circle bleed).

---

## 6. UI Component Patterns

| Component | Bauhaus treatment |
|---|---|
| Buttons | Solid black fill, white text, sharp or barely-rounded corners, no shadow |
| Nav links | Plain sans text, black, generous spacing, no underlines until hover |
| Search/inputs | Light grey flat fill, no border, pill or square — pick one and stay consistent |
| Icons | Reduce to flat geometric glyphs (circle/square/line), single color |
| Dividers | Thin solid black or colored rules, sometimes doubled (two thin lines) |
| Cards/panels | Flat color fill blocks, no shadow, no border-radius beyond subtle/none |
| Section markers | Small colored square/circle/diamond trio used as a bullet motif |

**Explicitly avoid:** drop shadows, skeuomorphism, gradients, rounded/soft "friendly" UI, serif fonts, pastel colors, photographic imagery (illustration/geometry only).

---

## 7. Reference Figures (Historical)

| Name | Contribution |
|---|---|
| Walter Gropius | Founder, architect — unified the school's mission |
| Herbert Bayer | Universal (lowercase) alphabet, geometric typography |
| Paul Klee | Form & line theory |
| László Moholy-Nagy | Typography & photography experimentation |
| Wassily Kandinsky | Color theory |

---

## 8. Legacy / Where to Apply This Today

- UI/UX design systems (flat, geometric component libraries)
- Product design (packaging, icon sets)
- Architecture-inspired layout grids for web
- Corporate identity / branding systems

---

## 9. Quick Checklist

- [ ] Palette limited to yellow / blue / red / black / white
- [ ] All shapes are flat-filled, no gradients or shadows
- [ ] Sans-serif type only, hierarchy via weight/scale not style
- [ ] Layout sits on a visible or implied grid
- [ ] Composition is asymmetrical, not centered
- [ ] Circles/semi-circles used as a repeated structural motif
- [ ] Content areas remain clean white space, decoration stays at the edges