# Architecture: Live Preview System

This document explains how the interactive wireframe's live preview system works, so future agents (AI or human) can add new pages, sections, or questions without breaking existing functionality.

---

## Core Concept

The app is a **single HTML file** (`index.html`) containing CSS, HTML wireframes, and JS. Team members click numbered hotspots on the wireframe, answer design questions in a side panel, and their choices **instantly update the wireframe** via CSS class toggles, CSS custom properties, or DOM manipulation.

```
User clicks option  →  P handler fires  →  wireframe updates  →  "Preview updated" toast
```

---

## Key Data Structures

### `AN` and `AN_LISTING` — Annotation Arrays

Each page has an array of annotation objects. These define the hotspots, questions, and specs for each section.

```js
{
  id: 1,                          // Hotspot number (displayed in the yellow circle)
  zone: "zone-l-gallery",         // ID of the HTML element to attach the hotspot to
  label: "Photo Gallery",         // Short name shown in panel header + overview sidebar
  section: "Visual Impact",       // Category label (shown above the title)
  x: "88%", y: "30px",           // Hotspot position relative to the zone element
  specs: [                        // Read-only spec rows shown at top of panel
    { k: "Layout", v: "1 large + 3 small grid" }
  ],
  questions: [                    // Design questions with voteable options
    {
      key: "l-gallery-layout",   // Unique key — used for storage AND to look up the P handler
      q: "Photo gallery layout?", // Question text
      opts: [                     // Array of option strings (index = vote value)
        "Grid: 1 large + 3 small (current Airbnb style)",
        "Full-width carousel with dots & arrows",
        "Masonry grid — 5 images variable height",
        "Single hero image + thumbnail strip below"
      ]
    }
  ],
  ideas: [                        // Optional idea cards shown below questions
    { title: "Image CDN", text: "Use Webflow's image CDN..." }
  ]
}
```

### `P` — Preview Handlers Object

The `P` object maps question keys to functions. When a user selects option index `v`, `P[key](v)` is called.

```js
const P = {
  "l-gallery-layout": v => {
    const g = document.getElementById('zone-l-gallery');
    g.classList.remove('carousel', 'masonry', 'hero-strip');
    if (v === 1) g.classList.add('carousel');
    if (v === 2) g.classList.add('masonry');
    if (v === 3) g.classList.add('hero-strip');
    // v === 0 is the default (no extra class)
  },
};
```

**If a key exists in `P`, the panel shows a green "LIVE PREVIEW" badge next to the question.** If there's no `P` entry, the question still works for voting — it just won't visually change anything.

---

## Three Preview Strategies

### 1. CSS Class Toggle (preferred for layout changes)

Add/remove classes on a container. Define variant styles in CSS.

**When to use:** Layout changes, showing/hiding child elements, grid reconfigurations.

```css
/* Default: 2-column grid */
.l-gallery { display: grid; grid-template-columns: 1fr 1fr; }

/* Variant: carousel */
.l-gallery.carousel { grid-template-columns: 1fr; grid-template-rows: 380px; }
.l-gallery.carousel .l-gallery-item:not(.l-gallery-main) { display: none; }
.l-gallery.carousel .l-gallery-dots { display: flex; }
```

```js
"l-gallery-layout": v => {
  const g = document.getElementById('zone-l-gallery');
  g.classList.remove('carousel', 'masonry', 'hero-strip');
  if (v === 1) g.classList.add('carousel');
  // ...
},
```

**Pattern:** Default state = no extra class. Each variant = one class. CSS handles all visual differences.

### 2. CSS Custom Properties (preferred for theme/color changes)

Set `--var` values on `:root`. Used by the index page extensively.

**When to use:** Colors, sizes, visibility toggles that affect many elements.

```js
"hero-cta": v => {
  R.setProperty('--hero-cta-display', v === 0 ? 'none' : 'flex');
  R.setProperty('--hero-cta-bg', v === 1 ? 'var(--y)' : 'transparent');
},
```

### 3. Direct DOM Manipulation (for content swaps or complex logic)

Directly modify `innerHTML`, `style`, or add/remove elements.

**When to use:** Text content changes, showing/hiding independent sections, creating new elements.

```js
"l-breadcrumb": v => {
  const bc = document.getElementById('zone-l-breadcrumb');
  if (v === 0) bc.innerHTML = '<a>Flex Space</a><span>›</span>...';
  if (v === 1) bc.innerHTML = '<a>← Back to Manchester results</a>';
},
```

---

## How to Add a New Design Question

### Step 1: Add the HTML element (if new section)

Give it a unique `id` starting with `zone-l-` (listing) or `zone-` (index).

```html
<div class="l-section" id="zone-l-pricing-table">
  <!-- default state markup here -->
</div>
```

### Step 2: Add CSS for variants (if using class toggle strategy)

```css
.l-pricing-table.compact { /* variant styles */ }
.l-pricing-table.detailed { /* variant styles */ }
```

### Step 3: Add the P handler

```js
"l-pricing-style": v => {
  const el = document.getElementById('zone-l-pricing-table');
  if (!el) return;  // guard — element only exists on listing page
  el.classList.remove('compact', 'detailed');
  if (v === 1) el.classList.add('compact');
  if (v === 2) el.classList.add('detailed');
},
```

### Step 4: Add the annotation entry

Add to `AN_LISTING` (or `AN` for index page):

```js
{
  id: 9,  // next available number
  zone: "zone-l-pricing-table",
  label: "Pricing Table",
  section: "Conversion",
  x: "88%", y: "20px",
  specs: [{ k: "Columns", v: "Monthly, Quarterly, Annual" }],
  questions: [{
    key: "l-pricing-style",  // must match the P handler key
    q: "Pricing table layout?",
    opts: [
      "Full breakdown with all fees (current)",
      "Compact — total only",
      "Detailed — with comparison to market avg"
    ]
  }],
  ideas: []
}
```

### Step 5: Verify

- Hotspot appears on the wireframe at the `zone` element
- Panel opens with your question
- Green "LIVE PREVIEW" badge shows (because `P["l-pricing-style"]` exists)
- Selecting each option visually changes the wireframe
- Votes persist across page reload

---

## How to Add a New Page

Currently there are two pages: `index` (Index/Category) and `listing` (Individual Listing).

### Step 1: Add page HTML

Inside `.frame-inner`, add a new frame div:

```html
<div class="newpage-frame" id="newpageFrame">
  <!-- your wireframe HTML here, with zone- IDs on sections -->
</div>
```

Add CSS to show/hide:

```css
.newpage-frame { display: none }
.newpage-frame.active { display: block }
```

### Step 2: Add annotation array

```js
const AN_NEWPAGE = [
  { id: 1, zone: "zone-np-hero", ... },
];
```

### Step 3: Update `getAN()`

```js
function getAN() {
  if (currentPage === 'listing') return AN_LISTING;
  if (currentPage === 'newpage') return AN_NEWPAGE;
  return AN;
}
```

### Step 4: Update `switchPage()`

Add the toggle for your new frame:

```js
document.getElementById('newpageFrame').classList.toggle('active', page === 'newpage');
```

### Step 5: Add page selector card

In the `.ps-cards` container, add a new `.ps-card` with a click handler:

```js
document.getElementById('psNewpage').addEventListener('click', () => switchPage('newpage'));
```

---

## Naming Conventions

| Thing | Pattern | Example |
|-------|---------|---------|
| Zone ID | `zone-{page prefix}-{name}` | `zone-l-gallery`, `zone-hero` |
| Question key | `{page prefix}-{feature}` | `l-gallery-layout`, `hero-cta` |
| CSS variant class | Descriptive word | `.carousel`, `.masonry`, `.pills` |
| Comment storage key | `{page prefix}s-{annotation id}` | `ls-1` (listing section 1), `s-3` (index section 3) |
| Page prefix | `l-` = listing, none = index | — |

**Page prefixes prevent key collisions** — an index page question `hero-cta` and a listing question `l-cta-button` can coexist in the same localStorage.

---

## Storage & Sync

```
Vote/Comment → localStorage (instant) → POST /api/answers (background) → Netlify Blobs
Login        → GET /api/answers → merge with localStorage → render
Polling      → every 8 seconds, GET /api/answers → merge → re-render if panel is open
```

- `allData[userName]` = `{ answers: { key: optionIndex }, comments: { sectionKey: [{text, time}] } }`
- `APP_VERSION` — bump this to force a page reload on all clients (does NOT wipe data)
- Reset button wipes localStorage + calls `DELETE /api/answers`

---

## Gotchas

1. **Guard your P handlers** — always check `if (!el) return` because the element only exists when that page is active. Both pages' P handlers live in the same `P` object.

2. **Option index 0 = default state** — design your first option as the "current" or "no change" variant. This way the wireframe looks correct before anyone votes.

3. **Don't break hotspot positioning** — hotspots are absolutely positioned inside the `zone` element. If you change the zone's `position` or `overflow`, hotspots may disappear.

4. **CSS transitions** — add `transition: all 0.3s` to containers you'll be toggling classes on. This makes variant switches feel smooth rather than jarring.

5. **Hidden elements for variants** — if a variant needs extra HTML (like carousel dots or a thumbnail strip), add the elements in the default HTML but hide them with CSS (`display: none`). The variant class then shows them. Don't create elements dynamically in P handlers if you can avoid it.

6. **`applyAll()` on page switch** — when the user switches pages, `applyAll()` replays all saved answers through `P` handlers. This ensures the wireframe reflects the user's previous votes. Your P handler must be idempotent.
