# UI Polish — Design Spec

## Goal

Elevate every screen to feel genuinely professional and beautiful. Direction: **Clean Light Elevated** — white base, refined emerald accents, soft layered shadows, and precise typographic hierarchy. All screens redesigned consistently.

## Design Direction

**Not** a rebrand. The emerald + gold palette stays. The change is in execution: deeper gradients, layered shadows, rounded floating elements, and tighter typographic hierarchy.

---

## Design Tokens

### Colours (no changes to values, only gradient direction updated)

| Token | Value | Usage |
|---|---|---|
| `--green-hero-start` | `#047857` | Gradient start (was `#059669`) |
| `--green-hero-end` | `#065f46` | Gradient end (unchanged) |
| `--green` | `#059669` | Buttons, active states, labels |
| `--green-light` | `#f0fdf4` | Badge backgrounds, icon wells |
| `--green-subtle` | `#bbf7d0` | Active card borders |

### Gradients

All hero gradients change from `135deg` to `160deg` for a more refined, less flat angle:
```css
background: linear-gradient(160deg, #047857 0%, #065f46 100%);
```

### Cards

```css
background: #ffffff;
border-radius: 16px;
border: 1px solid rgba(0, 0, 0, 0.04);
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
```

### Section labels

Small uppercase labels above card content to create visual hierarchy:
```css
font-size: 10px;
font-weight: 600;
color: #059669;
text-transform: uppercase;
letter-spacing: 0.05em;
```

---

## Files

| File | Action |
|---|---|
| `css/styles.css` | Update gradient angle, card styles, nav styles, add new utility classes |
| `js/home.js` | Redesign `renderHome()` hero + cards + floating nav |
| `js/prayer.js` | Redesign prayer hero, prayer list rows, qibla card |
| `js/quran.js` | Redesign surah list items, reader ayah cards, reader header |
| `js/dhikr.js` | Redesign counter layout and tap button |

---

## Screen 1: Home

### Hero

- Gradient: `160deg, #047857 → #065f46`
- Two decorative circles for depth (absolutely positioned, `rgba(255,255,255,0.05)`):
  - Top-right: `width:140px; height:140px; top:-40px; right:-30px`
  - Bottom-left: `width:90px; height:90px; bottom:-20px; left:-15px`
- Date line: `11px, uppercase, letter-spacing 0.04em, opacity 0.65` — single line (day + Hijri date)
- Arabic greeting: `26px, font-weight:300, letter-spacing:1px`
- English subtitle: `13px, opacity:0.7, font-weight:400`
- **Next prayer pill inside hero** (replaces separate card). `renderHome()` already has access to `state.prayer.times` (global state). Compute next prayer inline using the same logic as `renderPrayerTimes()` in `prayer.js` lines 232–238: iterate `['fajr','dhuhr','asr','maghrib','isha']`, find first time after `Date.now()`. If no prayer times loaded yet (`!state.prayer.times`), render the pill as `<div class="hero-prayer-pill-empty">Prayer times loading...</div>` with `opacity:0.6`.
  ```html
  <div class="hero-prayer-pill">
    <div>
      <div class="hero-pill-label">Next Prayer</div>
      <div class="hero-pill-name">Asr</div>
    </div>
    <div class="hero-pill-right">
      <div class="hero-pill-time">3:45 PM</div>
      <div class="hero-pill-countdown">in 1h 23m</div>
    </div>
  </div>
  ```
  Style: `background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); border-radius:14px; padding:10px 14px;`

### Cards

Each card gets:
- `border-radius: 16px`
- `border: 1px solid rgba(0,0,0,0.04)`
- `box-shadow: 0 2px 12px rgba(0,0,0,0.07)`
- A small green uppercase section label at top (e.g. `CONTINUE READING`, `HADITH OF THE DAY`)
- Icon well on the right: `width:38px; height:38px; background:#f0fdf4; border-radius:12px`

**Continue Reading card:**
```
Label: CONTINUE READING (green, 10px uppercase)
Title: Surah name (15px, bold, #0f172a)
Subtitle: Ayah number + name (12px, #94a3b8)
Right: icon well with 📖
```

**Hadith card:**
```
Label: HADITH OF THE DAY
Body: italic, 13px, #334155, line-height 1.6
Source: 11px, #94a3b8, margin-top 6px
```

### Bottom Nav — Floating

Remove the flat full-width nav. Replace with a floating card:
```css
.tab-bar {
  margin: 0 12px 12px;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.10);
  border: 1px solid rgba(0,0,0,0.04);
  background: #ffffff;
}
```
Active tab label: `font-size:9px; font-weight:700; color:#059669`
Inactive tab label: `font-size:9px; font-weight:500; color:#94a3b8`

---

## Screen 2: Prayer Times

### Hero

- Same gradient as home (`160deg, #047857 → #065f46`)
- One decorative circle: top-right, `width:100px; opacity 0.05`
- City name: `11px, uppercase, letter-spacing 0.05em, opacity 0.6`
- "Next Prayer" label: `13px, opacity 0.75`
- Prayer name: `30px, font-weight:800, letter-spacing:-0.5px`
- Time: `36px, font-weight:300, letter-spacing:2px`
- Countdown pill: `background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:20px; padding:5px 16px; font-size:12px`

### Prayer List Rows

**Past prayers** (before current time):
```css
opacity: 0.45;
```

**Next prayer (active)**:
```css
background: #f0fdf4;
border-left: 3px solid #059669;
```
Name: `font-size:14px; font-weight:700; color:#059669`
"NEXT" badge: `font-size:10px; color:#059669; font-weight:600`
Time: `font-size:14px; color:#059669; font-weight:700`

**Upcoming prayers**: normal styling, `color:#334155`

Each row: `padding:11px 16px; border-bottom:1px solid #f8fafc`
Prayer icon size: `font-size:16px; margin-right:12px`

### Qibla Card

Tappable card below the prayer list. The existing function is `openQiblaCompass()` — use that:
```html
<div class="qibla-card" onclick="openQiblaCompass()">
  <div class="qibla-icon-well">🧭</div>
  <div class="qibla-info">
    <div class="qibla-label">Qibla Direction</div>
    <div class="qibla-value">${state.prayer.qibla ? Math.round(state.prayer.qibla) + '°' : 'Tap to open'}</div>
  </div>
  <span class="qibla-arrow">›</span>
</div>
```
Style: `margin:0 12px 12px; background:white; border-radius:14px; padding:12px 14px; box-shadow:0 2px 10px rgba(0,0,0,0.06); display:flex; align-items:center; gap:10px`

The existing qibla compass DOM (`#qibla-compass-wrap`) remains unchanged — this card just replaces the visual treatment of the "Find Qibla" button row.

---

## Screen 3: Quran List

### Header

- Gradient: `160deg, #047857 → #065f46`
- "Holy Quran" label: `11px, uppercase, opacity 0.6`
- Arabic title: `22px, font-weight:700, letter-spacing:0.5px`
- Search bar integrated in header:
  ```css
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 8px 12px;
  ```

### Surah List Items

```html
<div class="surah-item">
  <div class="surah-num-badge">2</div>   <!-- rounded square -->
  <div class="surah-info">
    <div class="surah-name-en">Al-Baqarah</div>
    <div class="surah-meta">The Cow · 286 verses</div>
  </div>
  <div class="surah-name-ar">البَقَرَة</div>
</div>
```

**Number badge**: `width:36px; height:36px; background:#f0fdf4; border-radius:10px; font-size:13px; font-weight:700; color:#059669`

**Current/reading surah**: badge uses `background:#d1fae5`, row gets `background:#f0fdf4`, and a `READING` pill in top-right (`font-size:9px; color:#059669; font-weight:700`)

**Arabic name**: always visible, right-aligned, `font-size:16px; font-weight:500; color:#065f46; font-family:serif`

Row: `padding:12px 14px; border-bottom:1px solid #f8fafc; display:flex; align-items:center; gap:12px`

---

## Screen 4: Quran Reader — Verse Mode

### Sticky Header

- Same deep gradient
- Back button: `background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:10px`
- Surah name centred: `14px, font-weight:700`
- Verse/Mushaf toggle: pill switcher inside header
  - Container: `background:rgba(0,0,0,0.2); border-radius:10px; padding:3px`
  - Active tab: `background:white; color:#059669; border-radius:8px; font-weight:700`
  - Inactive: `color:rgba(255,255,255,0.65)`

### Ayah Cards

Each ayah is its own card:
```css
.ayah-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 8px;
}
```

**Card header row**: ayah number badge (left) + action buttons (right)
- Badge default: `width:28px; height:28px; background:#f0fdf4; border-radius:8px; font-size:11px; font-weight:700; color:#059669`
- Action buttons: `background:#f0fdf4; border:none; border-radius:8px; padding:4px 8px`

**Arabic text**: `font-size:20px; text-align:right; line-height:1.8; color:#0f172a; font-family: UthmanicHafs; margin-bottom:10px`

**Translation**: `font-size:12px; color:#64748b; line-height:1.6; border-top:1px solid #f1f5f9; padding-top:8px`

**Playing state** (active ayah):
```css
border: 1.5px solid #bbf7d0;
box-shadow: 0 2px 10px rgba(5, 150, 105, 0.12);
```
- Number badge: `background:#059669; color:white`
- Play button: `background:#059669; color:white`

---

## Screen 5: Dhikr Counter

### Header

Same gradient. "Daily Dhikr" label + Arabic title `التَّسْبِيح`.

### Counter Layout

```
Arabic dhikr text    — 26px, serif, #065f46, line-height 1.4
Transliteration      — 13px, #94a3b8
Count number         — 72px, font-weight:800, #0f172a
"of 33"              — 13px, #94a3b8
Progress bar         — height:8px, background:#f1f5f9, green fill
Tap button           — circular, 110×110px
```

**Tap button**:
```css
width: 110px;
height: 110px;
border-radius: 50%;
background: linear-gradient(160deg, #059669, #047857);
box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
border: none;
color: white;
font-size: 32px;
```

**Progress bar**:
```css
height: 8px;
background: #f1f5f9;
border-radius: 4px;
width: 100px;
margin: 0 auto 24px;
```
Fill: `background: linear-gradient(90deg, #059669, #047857)`

**Dhikr type tabs** (Tasbih / Tahmid / Takbir) at bottom:
```css
/* container */
padding: 10px 12px;
display: flex;
gap: 6px;
border-top: 1px solid #f1f5f9;
background: #f8fafc;

/* active tab */
background: #059669; color: white; border-radius: 10px;

/* inactive tab */
background: white; color: #94a3b8; border-radius: 10px; border: 1px solid #f1f5f9;
```

---

## Dark Mode

Every new CSS class introduced by this redesign needs a corresponding `html.dark` override in `styles.css`. Key rules to add:
- `.hero-prayer-pill` → `background: rgba(255,255,255,0.10)`
- `.ayah-card` → `background: #1e293b; border-color: #334155`
- `.tab-bar` (floating nav) → `background: #1e293b; border-color: #334155`
- `.qibla-card` → `background: #1e293b`
- Surah list rows → `background: #1e293b; border-color: #334155`
- Section labels and meta text → use existing dark text tokens (`#94a3b8`, `#64748b`)

---

## What Does NOT Change

- Colour palette (same emerald and gold values)
- All functionality and logic
- Dark mode (continues to work via `html.dark` class)
- Fonts (Uthmanic Hafs, Noto Naskh Arabic, system UI)
- Tab structure (6 tabs, same order)
- Duas and Learn screens (lower-priority, consistent card styles will naturally improve them)

---

## Version Bump

Service worker and `index.html` references bump to `v108`.
