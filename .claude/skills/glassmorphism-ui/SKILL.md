---
name: glassmorphism-ui
description: "CampusEvents glassmorphism UI design system. Use when building, restyling, or reviewing any frontend component, page, or layout. Triggered by UI work, styling, component creation, page building, or design review. Enforces the liquid glass aesthetic with deep-green brand identity across light, dark, and mobile breakpoints."
disable-model-invocation: false
---

# CampusEvents Glassmorphism UI System

> **You are a UI implementation agent.** When applying this system, you produce React + Tailwind CSS v4 code
> that follows every rule below. You do NOT deviate, improvise colors, or invent new patterns.
> Reference files in `.claude/skills/glassmorphism-ui/data/` are the canonical visual targets.

---

## 1. Technology Stack

| Layer        | Tool                          |
| ------------ | ----------------------------- |
| Framework    | React 19 + TypeScript         |
| Bundler      | Vite 8                        |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Router       | react-router-dom v7           |
| Runtime      | Bun                           |
| CSS File     | `frontend/src/index.css`      |

**Tailwind v4 note:** This project uses `@import "tailwindcss"` and `@theme {}` blocks in CSS — NOT a `tailwind.config.js` file. All theme extensions go in `@theme {}` inside `index.css`. Never create a `tailwind.config.js`.

---

## 2. Color Palette

### Brand Colors (Deep Green)

| Role            | Hex/Value                        | Tailwind Usage           | When to Use                        |
| --------------- | -------------------------------- | ------------------------ | ---------------------------------- |
| Brand Dark      | `#1a4f3b`                        | `bg-[#1a4f3b]`          | Primary buttons, sidebar icons, brand logo bg |
| Brand Mid       | `#2b5c50`                        | `bg-[#2b5c50]`          | CTA buttons (Grab Ticket, Remind Me) |
| Brand Accent    | `#2f6d56`                        | `bg-[#2f6d56]`          | Hover states, secondary actions    |
| Brand Light     | `#c8e6d8`                        | `bg-[#c8e6d8]`          | Badge backgrounds, icon containers |
| Brand Glow BG   | `#e6f0eb`                        | `bg-[#e6f0eb]`          | Stat card icon backgrounds         |

### Text Colors

| Role          | Value       | Tailwind Class         |
| ------------- | ----------- | ---------------------- |
| Primary text  | `#1e293b`   | `text-slate-800`       |
| Secondary     | `#64748b`   | `text-slate-500`       |
| Muted         | `#94a3b8`   | `text-slate-400`       |
| On-dark       | `#ffffff`   | `text-white`           |
| On-dark muted | `#d1d5db`   | `text-gray-300`        |

### Category Tag Colors

| Category   | Background  | Text Color  | CSS Class Suggestion      |
| ---------- | ----------- | ----------- | ------------------------- |
| Community  | `#c8e6c9`   | `#2e7d32`   | `bg-[#c8e6c9] text-[#2e7d32]` |
| Social     | `#b2dfdb`   | `#00695c`   | `bg-[#b2dfdb] text-[#00695c]` |
| Sports     | `#dcedc8`   | `#33691e`   | `bg-[#dcedc8] text-[#33691e]` |

All category tags: `text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider`

### Status Badge Colors (from index.css)

| Badge     | Background  | Text      | Border    |
| --------- | ----------- | --------- | --------- |
| Success   | `#ecfdf5`   | `#065f46` | `#a7f3d0` |
| Warning   | `#fffbeb`   | `#92400e` | `#fde68a` |
| Danger    | `#fef2f2`   | `#991b1b` | `#fecaca` |
| Info      | `#eff6ff`   | `#1e40af` | `#bfdbfe` |
| Neutral   | `#f8fafc`   | `#475569` | `#e2e8f0` |

Use the `.badge`, `.badge-success`, etc. classes from `index.css`.

---

## 3. Backgrounds

### Light Mode (Desktop — Admin/Student Desktop)

```css
background: linear-gradient(135deg, #e0eaf5 0%, #c8d8e6 50%, #d8e2ea 100%);
background-attachment: fixed;
```

Alternative (lighter):
```css
background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
```

Use `.bg-mesh` or `.bg-hero` classes from `index.css` for pages with radial gradient overlays.

### Dark Mode (Mobile/App views)

```css
background: radial-gradient(circle at 20% 0%, #908276 0%, #5c5d63 40%, #25272c 80%, #1b1c20 100%);
```

- Body text color: `#ffffff`
- Section headings on dark: `text-white tracking-wide`
- Muted text on dark: `text-gray-300`

### When to Use Which

| Context                  | Background          |
| ------------------------ | ------------------- |
| Desktop dashboard        | Light linear gradient |
| Mobile app view          | Dark radial gradient  |
| Auth/login pages         | Dark radial gradient  |
| Admin panels             | Light linear gradient |

---

## 4. Glassmorphism Tiers

There are **three tiers** of glass effect, each with specific use cases:

### Tier 1: Glass (Navigation, Headers, Overlays)

```css
background: rgba(255, 255, 255, 0.78);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(226, 232, 240, 0.6);
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
```

**CSS class:** `.glass` (from index.css)
**Use for:** Top header bar, sidebar panel, sticky navs, modal overlays

### Tier 2: Glass Heavy (Cards, Content Containers)

```css
background: rgba(255, 255, 255, 0.92);
backdrop-filter: blur(24px) saturate(200%);
-webkit-backdrop-filter: blur(24px) saturate(200%);
border: 1px solid rgba(226, 232, 240, 0.7);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
```

**CSS class:** `.glass-heavy` (from index.css)
**Use for:** Event cards, stat cards, form containers, detail panels

### Tier 3: Glass Subtle (Inputs, Secondary Elements)

```css
background: rgba(255, 255, 255, 0.55);
backdrop-filter: blur(12px) saturate(160%);
-webkit-backdrop-filter: blur(12px) saturate(160%);
border: 1px solid rgba(226, 232, 240, 0.4);
```

**CSS class:** `.glass-subtle` (from index.css)
**Use for:** Input fields, secondary panels, background sections

### Dark-Mode Glass (Mobile Views)

On dark backgrounds, glass cards increase opacity:
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.3);
color: #1a1c23;
```

### Colored Glass Accents

Use `.glass-blue`, `.glass-violet`, `.glass-emerald` classes for tinted glass sections (from index.css).

---

## 5. Typography

### Font Stack

**Primary:** `"Inter", ui-sans-serif, system-ui, sans-serif`

Already configured in `@theme { --font-sans }` in `index.css`. Import:
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
```

### Type Scale

| Element              | Classes                                              |
| -------------------- | ---------------------------------------------------- |
| Page title           | `text-3xl font-bold`                                 |
| Page subtitle        | `text-text-muted` or `text-slate-500`                |
| Section heading      | `text-2xl font-bold tracking-wide`                   |
| Card title           | `font-bold text-lg leading-tight`                    |
| Stat number          | `text-4xl font-bold` (desktop) / `text-3xl font-bold leading-none` (mobile) |
| Stat label           | `text-xs font-semibold uppercase tracking-wider`     |
| Body text            | `text-sm`                                            |
| Caption/meta         | `text-xs`                                            |
| User name (header)   | `text-xl font-semibold leading-tight` (mobile) / `font-semibold text-lg leading-tight` (desktop sidebar) |
| User role            | `text-sm text-gray-600` (mobile) / `text-xs text-slate-500` (desktop) |

### Text on Dark Backgrounds

- Headings: `text-white`
- Links: `text-gray-300 hover:text-white`
- Body: `text-gray-300`

### Gradient Text (accent)

Use `.text-gradient` class from `index.css` for hero or feature headings:
```css
background: linear-gradient(135deg, #4f46e5, #3b82f6);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## 6. Spacing System

| Token    | Value    | Usage                                |
| -------- | -------- | ------------------------------------ |
| `p-2`    | 0.5rem   | Search bar inner padding             |
| `p-3`    | 0.75rem  | Header card padding (mobile)         |
| `p-4`    | 1rem     | Card content padding, main mobile    |
| `p-6`    | 1.5rem   | Stat card padding, desktop header    |
| `p-8`    | 2rem     | Desktop main content area            |
| `gap-3`  | 0.75rem  | Stat cards horizontal scroll (mobile)|
| `gap-4`  | 1rem     | Header action buttons                |
| `gap-6`  | 1.5rem   | Grid gaps (desktop)                  |
| `space-y-2` | 0.5rem | Nav link spacing                   |
| `space-y-4` | 1rem   | Event card list spacing             |
| `space-y-6` | 1.5rem | Main section spacing (mobile)       |
| `mb-4`   | 1rem     | Section header to content            |
| `mb-6`   | 1.5rem   | Dashboard title to cards             |
| `mb-8`   | 2rem     | Stats to main content (desktop)      |
| `mb-10`  | 2.5rem   | Sidebar profile to nav               |

---

## 7. Border Radius

| Element           | Class          | Value  |
| ----------------- | -------------- | ------ |
| Stat cards (desk) | `rounded-3xl`  | 24px   |
| Event cards       | `rounded-2xl`  | 16px   |
| Nav links active  | `rounded-2xl`  | 16px   |
| Buttons           | `rounded-full` | 9999px |
| Search input      | `rounded-full` (desktop) / `rounded-lg` (mobile) | |
| Tags/badges       | `rounded-md`   | 6px    |
| Avatars           | `rounded-full` | Circle |
| Icon containers   | `rounded-2xl`  | 16px   |
| Brand logo box    | `rounded-xl`   | 12px   |
| Cards general     | `rounded-xl`   | 12px   |
| Bottom nav bar    | `rounded-full` | Pill   |

**Rule:** Prefer generous radius. Cards are never sharp-cornered. Minimum radius for any container is `rounded-lg` (8px).

---

## 8. Shadows

| Level           | Value                                      | Usage                     |
| --------------- | ------------------------------------------ | ------------------------- |
| `shadow-sm`     | Tailwind default                           | Headers, stat cards       |
| `shadow-md`     | Tailwind default                           | Event cards               |
| `shadow-lg`     | Tailwind default                           | Bottom nav bar            |
| Glass shadow    | `0 8px 32px rgba(0,0,0,0.05)`             | Glass cards               |
| Header shadow   | `0 4px 30px rgba(0,0,0,0.05)`             | Sticky top header         |
| Nav active      | `0 4px 12px rgba(0,0,0,0.03)`             | Active nav item           |
| Glow button     | `0 4px 20px rgba(26,79,59,0.4)`           | Primary brand CTA         |
| Glow hover      | `0 6px 24px rgba(26,79,59,0.6)`           | Brand CTA hover           |

---

## 9. Buttons

### Primary CTA (Brand Green)

```
bg-[#2b5c50] text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer
```

Hover: `hover:bg-[#1a4f3b]`

### Glow Button (Desktop — prominent actions)

```
bg-[#1a4f3b] text-white py-3.5 rounded-2xl font-semibold shadow-lg cursor-pointer
transition: all 0.3s ease
hover: shadow-[0_6px_24px_rgba(26,79,59,0.6)] transform -translate-y-px
```

### Secondary Button

Use `.btn-secondary` from `index.css`:
```
bg-white text-slate-700 border border-slate-200 shadow-sm rounded-lg
hover: bg-slate-50 border-slate-300
```

### Danger Button

Use `.btn-danger` from `index.css`.

### Button Rules

- ALL buttons MUST have `cursor-pointer`
- ALL buttons MUST have transitions (min `transition-all duration-150`)
- Hover on primary: subtle lift (`-translate-y-px`) + deeper shadow
- Active: `translate-y-0` (cancel lift)
- Disabled: `opacity-50 cursor-not-allowed`
- Respect `prefers-reduced-motion`: no transforms

---

## 10. Inputs & Search

### Glass Input (Mobile)

```
bg-white/60 backdrop-blur-sm border border-white/40
w-full pl-10 pr-4 py-2 rounded-lg text-sm text-gray-800
placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50
```

### Glass Input (Desktop)

```
glass-subtle w-full pl-11 pr-4 py-3 rounded-full text-sm
focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500
```

### Modern Input (Forms)

Use `.input-glass` or `.input-modern` from `index.css`.

### Input Rules

- Search inputs are always `rounded-full` on desktop, `rounded-lg` on mobile
- Always include a search icon (magnifying glass SVG) positioned `absolute left-3`
- Focus ring: `ring-2 ring-white/50` (on glass) or `ring-[#1a4f3b]/30` (on solid backgrounds)
- Never use browser-default focus outlines

---

## 11. Navigation

### Desktop Sidebar

```
w-64 flex flex-col pt-8 pb-6 px-4 h-full border-r border-white/20
```

- Use `.glass` or `.glass-panel` class for background
- Active nav item: `bg-white/70 rounded-xl font-medium shadow-sm` with `text-[#1a4f3b]`
- Inactive: `text-slate-600 hover:bg-white/40 rounded-xl font-medium transition-colors`
- Nav item structure: `flex items-center gap-3 px-4 py-3`
- Icons: `w-5 h-5`, stroke-based SVG (Heroicons outline)

### Mobile Bottom Nav

```
fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 p-4 z-50
```

Inner bar:
```
glass-heavy rounded-full flex justify-between items-center px-6 py-3 shadow-lg bg-white/90
```

- Active item: `text-[#1a4f3b]` (brand green)
- Inactive: `text-gray-400`
- Each item: `flex flex-col items-center` with icon + `text-xs font-medium` label
- Icon sizes in nav: `w-6 h-6`

### Top Header Bar (Desktop)

```
flex items-center justify-between p-6 glass sticky top-0 z-20
shadow-[0_4px_30px_rgba(0,0,0,0.05)]
```

Contains: search bar (left), action buttons + avatar (right).
Action buttons: `p-2 rounded-full hover:bg-white/50 text-gray-500 transition-colors`

---

## 12. Cards

### Stat Card (Desktop)

```
glass-heavy rounded-3xl p-6 flex justify-between items-center
```

- Left: label (`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2`) + number (`text-4xl font-bold`)
- Right: icon container (`w-12 h-12 rounded-2xl bg-[#e6f0eb] flex items-center justify-center text-[#1a4f3b]`)

### Stat Card (Mobile)

```
glass-heavy rounded-xl p-4 flex-shrink-0 w-36 shadow-sm flex flex-col justify-between
```

- Horizontal scrollable row: `flex space-x-3 overflow-x-auto hide-scrollbar pb-2`
- Number: `text-3xl font-bold text-gray-900 leading-none`
- Icon: colored circle `p-1.5 rounded-full` with semantic bg (green-100, blue-100, yellow-100)

### Event Card

```
glass-heavy rounded-2xl overflow-hidden flex flex-col shadow-md
```

Structure:
1. **Image** — `relative h-32 w-full` with `<img class="w-full h-full object-cover">`
2. **Category tag** — `absolute top-2 left-2` with category color classes
3. **Content** — `p-4` containing:
   - Title: `font-bold text-lg text-gray-900 leading-tight mb-1`
   - Meta row: `flex text-sm text-gray-600 mb-3 space-x-3` (date + location with icons)
   - Footer: `flex justify-between items-center mt-2` with attendee avatars + CTA button

### Event Card Grid (Desktop)

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Attendee Avatar Stack

```
flex -space-x-2
```

Each avatar: `w-8 h-8 rounded-full border-2 border-white`
Overflow count: `w-8 h-8 rounded-full border-2 border-white bg-[#1a4f3b] text-white flex items-center justify-center text-xs font-bold z-10`

---

## 13. Layout Patterns

### Mobile (< 768px)

```
main: p-4 space-y-6 max-w-md mx-auto
body: padding-bottom 80px (space for bottom nav)
body min-height: max(884px, 100dvh)
```

- Single column stack
- Horizontal scroll for stat cards
- Bottom nav (fixed pill bar)

### Desktop (>= 768px)

```
body: h-screen overflow-hidden flex
aside: w-64 (sidebar)
main: flex-1 flex flex-col h-full overflow-hidden
scrollable content: flex-1 overflow-y-auto p-8
```

- Sidebar + main content flex layout
- Stats in `grid grid-cols-3 gap-6`
- Event cards in 2-3 column grid

---

## 14. Icons

- **Icon set:** Heroicons Outline (24x24 viewBox, stroke-based)
- **Stroke width:** 2
- **Standard sizes:** `w-4 h-4` (inline/small), `w-5 h-5` (nav/inputs), `w-6 h-6` (header actions)
- **NEVER use emojis as icons**
- **NEVER use filled icons in navigation** — always outline/stroke
- **Icon in stat containers:** Can be filled (`fill="currentColor"`) with semantic colors

---

## 15. Animations & Transitions

### Standard Transitions

- Buttons: `transition-all duration-150 ease`
- Nav items: `transition-colors` or `transition-all`
- Cards: `transition: border-color 0.2s ease, box-shadow 0.2s ease`
- Inputs: `transition: all 0.2s ease`
- Glow buttons: `transition: all 0.3s ease`

### Hover Effects

- Buttons: `translateY(-1px)` + deeper shadow
- Interactive cards: border-color shift + shadow lift (use `.card-interactive` or `.hover-lift`)
- Nav items: background opacity change

### Entry Animations

Use `.animate-fade-in` with `.stagger-1` through `.stagger-4` from `index.css` for sequential card reveals.

### Skeleton Loading

Use `.skeleton` class from `index.css` for loading states.

### Reduced Motion

ALL animations MUST be wrapped or controlled by:
```css
@media (prefers-reduced-motion: reduce) { /* disable transforms, animations */ }
```

Already handled in `index.css` for existing utility classes.

---

## 16. Scrollbars

### Desktop (Custom Webkit)

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

Already in `index.css`.

### Mobile (Hidden for horizontal scroll)

```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

Apply `hide-scrollbar` to any horizontal scroll container.

---

## 17. Accessibility Checklist

Before delivering ANY UI code:

- [ ] No emojis used as icons (SVG only, Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast minimum 4.5:1 (WCAG AA)
- [ ] Focus states visible for keyboard navigation (`focus:ring-2`)
- [ ] `prefers-reduced-motion` respected (no transforms/animations)
- [ ] Responsive tested at: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile (except intentional carousels)
- [ ] All images have `alt` attributes
- [ ] All interactive elements are keyboard accessible

---

## 18. Anti-Patterns (NEVER Do These)

- **Vibrant/neon colors** — This is a muted, natural palette
- **Sharp corners** — Minimum `rounded-lg` on any container
- **Flat/solid backgrounds** — Always use gradients or glass
- **Heavy drop shadows** — Shadows are subtle and diffuse
- **Browser-default focus rings** — Always custom
- **Inline styles for glass effects** — Use the CSS utility classes
- **`tailwind.config.js`** — This is Tailwind v4; use `@theme {}` in CSS
- **Opaque sidebars/navs** — Navigation is always translucent glass
- **Generic blue buttons** — Brand green is the primary action color
- **Layout-shifting hover transforms** — Only `translateY` on buttons, never `scale` on cards in flow

---

## 19. Reference Files

| File | Purpose |
| ---- | ------- |
| `.claude/skills/glassmorphism-ui/data/dashboard_light_admin.html` | Desktop admin layout — sidebar, grid stats, event cards |
| `.claude/skills/glassmorphism-ui/data/dashboard_light_student.html` | Desktop student layout — "The Curator" admin variant with glow effects |
| `.claude/skills/glassmorphism-ui/data/dashboard_dark_student.html` | Dark mobile layout — single column, bottom nav |
| `.claude/skills/glassmorphism-ui/data/dashboard_mobile_light.html` | Mobile layout variant — same structure as dark but light-on-dark glass |
| `frontend/src/index.css` | Production CSS — all glass/card/button/badge/animation utilities |

When building a new page, read the closest matching reference file from `data/` first, then apply these rules.
