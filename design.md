# HOMEPAGE.md — Implementation Reference

Source: `Recording 2026-11-12 013103.mp4` (12.47 s, 846×484, 30 fps, desktop-width capture, audio track present but not analysed).
Legend used throughout: **[OBSERVED]** = seen in the video · **[REQUESTED]** = from the brief, not in the video · **[RECOMMENDED]** = my implementation suggestion.

---

## 0. READ FIRST — the video does not show columns

The brief describes vertically arranged, rotating columns, one per fashion aesthetic. **The video shows something different**: a white, minimal "NOWHERE" storefront where nine full-length people photographed from above are arranged on an **elliptical ring** that rotates. Nothing in the video is a column, and no text matches "NO MORE BLIND SHOPPING" or neon pink. The video's palette is white / black / grey.

Per the instruction "video is the primary source of truth, do not invent interactions", this document therefore:

1. Documents the video faithfully (§1–§8).
2. Treats the **column layout** and the **neon-pink right-side headline** as **[REQUESTED]** additions and specifies them separately in §9, borrowing the video's interaction language (drag cursor, active-item label, zoom-in detail view) where it transfers.

**DECISION (owner, 2026-11-12): the RING is the hero.** The columns concept is dropped as the primary layout; §9.1 is kept only as an optional fallback. The build target is §1–§8 plus §9.3 (Ring adaptation) and §9.2 (neon headline).

---

## 1. Overview of the observed experience [OBSERVED]

A single full-viewport, white, editorial "lookbook" screen with two states:

| State | What the user sees |
|---|---|
| **A. Ring (home)** | 9 looks orbiting an ellipse around a centred serif title *"Stay out of the loop"*. Bottom bar shows the current look and its 3 items. |
| **B. Look detail** | Clicking a figure fades the ring out and the chosen figure scales up to fill the left/centre. Title becomes "03. *LONG WALKS*", clickable hotspot dots appear on garments, and a **till-receipt panel** (itemised list, total, barcode) appears on the right. |

Closing (✕) returns to the ring. The brand reads **NOWHERE©**. Fictional context strings: "VOL. 01 · TILL 0034 · LISBON", "THANKS FOR GOING NOWHERE." — shopping is framed as a receipt, not a product grid.

Feel: airy, almost empty, tiny uppercase UI labels against huge whitespace, one serif display title, dashed-outline pill buttons.

---

## 2. Layout and component hierarchy [OBSERVED]

Viewport ≈ 846×484 (16:9-ish). Coordinates below are % of viewport, approximate.

```
<Page bg=white, rounded black frame corners>
├─ TopBar (full width, y≈3%)
│   ├─ BackButton        black filled circle ~32px, white ← arrow, x≈2%, y≈4%  (overlaps status text)
│   ├─ StatusText        "…AM  ▂ LOW SIGNAL"  tiny uppercase, left (phone-status-bar pastiche)
│   ├─ QR code           ~25px, under back button, x≈2%, y≈10%
│   ├─ Wordmark          "NOWHERE©" centred, small caps-ish sans, y≈3%
│   └─ Right cluster     battery icon "12%" + dashed-outline pill "BAG (0)"
├─ SideTab Left          vertical dashed pill "LOOKS", x≈1–3%, y≈45–55%
├─ SideToggle Right      vertical pill pair "RING" (active = black fill, white text) / "GRID", x≈97%, y≈43–55%
├─ Stage (state A)
│   ├─ Ellipse ring      hairline very light grey stroke, centred ≈ (50%, 46%), rx≈35% of width, ry≈25% of height… (see §3)
│   ├─ 9 × LookFigure    cut-out photos, no backgrounds, soft contact shadow under feet
│   └─ CenterTitle       "Stay out / of the loop" serif (two lines, centred, ≈ 7% of viewport height per line)
│       └─ Subtitle      "Vol. 01 — Nine looks"  tiny sans, grey, below title
├─ BottomBar (y≈90–96%)
│   ├─ Left: "02 / 09" counter + small circled ▶ (autoplay toggle), under it look name "DIAL-UP" (large-ish uppercase sans, ~20px)
│   ├─ Centre: 3 × ItemPill (dashed rounded outline; thumbnail + NAME + price in italic)
│   └─ Right: "SHOP THIS FIT" label + 40px black circle with white "+"
└─ CursorFollower        custom cursor (see §5)
```

State B replaces Stage and BottomBar:

```
├─ BackButton (kept), Wordmark (kept), status text (kept)
├─ LookTitle         top-left "03. LONG WALKS"  ("03." upright, "LONG WALKS" italic serif, ~22px)
├─ CloseButton       dashed circle with ×, x≈73%, y≈10%
├─ HeroFigure        single large figure, centre-left (≈ 45% of viewport height×? — head at y≈17%, feet y≈85%), big soft ground shadow
├─ Hotspots          numbered dots 02, 03 (black filled), 01 (white, becomes pill when active)
├─ HotspotLabel      dashed pill "POLAR FLEECE ZIP  $92" attached to dot 01
├─ Hint              "TAP A DOT TO SHOP THIS ITEM" tiny uppercase, bottom centre
└─ ReceiptPanel      right column x≈79–97% (see §6)
```

---

## 3. The ring (state A) [OBSERVED]

- **9 looks** ("02 / 09" counter confirms nine; subtitle says "Nine looks").
- Figures are shot **from directly above/high angle looking down at the camera** — each person looks up into the lens, feet toward the viewer, body foreshortened. Full-body, transparent cut-outs. Each wears a distinct outfit (corduroy trucker + shorts, lilac fleece + black shorts, yellow hooded jacket, striped rugby shirt, etc.).
- **Depth cue by position**: figures at the *back* (top of ellipse) render smaller (~55–60 px tall in the 846px capture); figures at the *front* (bottom of ellipse) render larger (~110–120 px). The front-most figure is the **active look**.
- Ellipse: centre ≈ x 50%, y 46%; visible hairline guide spanning roughly x 22%→78%, y 25%→78%. Figures sit on it, so they appear to circle the title.
- **Rotation direction**: figures travel **right → bottom → left → top**, i.e. **clockwise on screen**. Observed over ~4 s: the lilac-fleece person moved from the lower right to the exact bottom centre.
- **Speed**: roughly one slot (360°/9 = 40°) per ~3–4 s while drifting; see §4 for the snap behaviour. Exact easing not determinable (see §10).
- Title and subtitle stay fixed in the centre; figures never overlap the title text (they remain on the rim).

---

## 4. Motion behaviour [OBSERVED unless marked]

Timeline of the clip (approx.):

| t (s) | Event |
|---|---|
| 0.0–2.0 | Ring visible, look 02 "DIAL-UP" active (corduroy-jacket man at front). Ring rotates slowly clockwise. Cursor hovers the lilac figure; a small grey dot follows the cursor. |
| ~1.5–2.5 | A figure arrives at front-centre → bottom label **cross-fades** "DIAL-UP" → "LONG WALKS", counter **02/09 → 03/09**, item pills **blur out and re-fade in** with the new look's three items. During the swap the label is briefly blurred and low-opacity (a blur-fade text transition, ~0.4 s). |
| 2.5–4.5 | New active look settles at front; ring continues to turn. Cursor follower grows into a **grey/black disc** with text. |
| ~4.5–5.5 | Cursor over a figure shows a **black disc labelled "VIEW"**. Click. |
| ~5.5 | **Open transition**: ring, title, side tabs, bottom bar and status items fade to ~0 over ~0.4 s while the clicked figure scales up toward the centre. Ring figures remain faintly ghosted behind during the cross-fade. |
| 6–7 | Hero figure fully sized; "03. LONG WALKS" title fades in top-left; "TAP A DOT…" hint fades in at bottom. A hotspot pill "POLAR FLEECE ZIP $92" is already showing. |
| 7–9 | Receipt panel enters from the **top-right, sliding down** into place (first frames show only its barcode footer, then it settles); hero figure's right dots appear. |
| 9–11 | Cursor moves over hotspot 01 → dot becomes a white circle with "01" and the pill shows. Dots 02 (on shorts) and 03 (on shoes) appear. Receipt shows full header "NOWHERE© / VOL. 01 · TILL 0034 · LISBON / LOOK 03 — LONG WALKS". |
| ~11.3 | Click ✕ → reverse transition: hero shrinks back, ring/title/bar fade in, receipt panel fades out (greyed while fading). |
| 12.0–12.47 | Back on ring. Cursor follower reads **"DRAG"** (dashed ring outline). Look 03 is at the front; bottom bar shows LONG WALKS. |

### Rotation is **automatic**, and also **draggable** [OBSERVED / partly inferred]
- Automatic: the ring moves without input (seen in the first seconds, with the cursor stationary-ish).
- Draggable: the cursor follower shows the word **"DRAG"** on empty space → the ring is meant to be dragged. **No drag gesture is actually performed in the clip**, so drag physics (inertia, snap) are **[RECOMMENDED]** only.
- Not scroll-driven (no scrolling is shown) and not hover-triggered (hovering shows "VIEW", it does not rotate).
- Autoplay toggle: the small circled ▶ next to "02 / 09" implies play/pause; it is never clicked in the clip.

---

## 5. Cursor follower [OBSERVED]

Native arrow cursor remains visible, plus a **trailing circular follower** (lag/lerp behind the pointer):

| Context | Follower |
|---|---|
| Empty ring space | Dashed-outline circle, ~34 px, text **"DRAG"** (also seen as a small solid grey dot ~8 px while moving fast / just entering) |
| Over a figure | Solid black circle ~36 px, white text **"VIEW"** (first seen on lower-left figure as "OPEN"/"VIEW" — small text, not fully legible) |
| Over hotspot (state B) | Hotspot itself is the affordance; no separate follower label |
| Over ✕ | Native arrow only |
| Teal/cyan arrow appears at top-right in some frames | Likely a second cursor from the screen recorder / remote collaborator marker; **not part of the design** — ignore |

[RECOMMENDED] Implement as a `position: fixed` div following `pointermove` with `lerp(0.18)`, `pointer-events:none`, `mix-blend-mode` unnecessary (it is opaque). Hide on touch.

---

## 6. Detail view and receipt [OBSERVED]

**Look title**: `03.` upright + `LONG WALKS` *italic serif*, top-left.

**Hero figure**: same cut-out, scaled ~4× vs. ring, soft elliptical ground shadow (blurred grey, offset to lower-left), figure occupies x≈22–48%, y≈15–85%.

**Hotspots** (numbered, matching receipt rows):
- 01 → Polar fleece zip (chest/arm area), 02 → Nylon hike shorts, 03 → Mesh trainers (feet).
- Idle: black filled ~16 px circle with white two-digit number. Active/hover: white filled with black number, widens to a **dashed pill**: `[01] POLAR FLEECE ZIP  $92`.
- Hint text below: "TAP A DOT TO SHOP THIS ITEM".

**Receipt panel (right column)**, monospace-feel tiny uppercase, dashed separators:

```
NOWHERE©                        (larger serif-ish/sans wordmark, centred)
VOL. 01 · TILL 0034 · LISBON
LOOK 03 — LONG WALKS
- - - - - - - - - - - - - - -
01 POLAR FLEECE ZIP        $92
   TOP                    [ADD]
- - - - - - - - - - - - - - -
02 NYLON HIKE SHORTS       $58
   BOTTOM                 [ADD]
- - - - - - - - - - - - - - -
03 MESH TRAINERS          $124
   SHOES                  [ADD]
- - - - - - - - - - - - - - -
SUBTOTAL                  $274
WHOLE FIT −10%         −$27.40
- - - - - - - - - - - - - - -
TOTAL            $246.60   (large, ~22px, label light + price regular)
[ ADD WHOLE FIT TO BAG  → ]     (full-width black bar, white tiny caps)
|||||||||||| barcode ||||||||||||
THANKS FOR GOING NOWHERE.
```
`[ADD]` = small dashed pill buttons per row. Prices add up: 92+58+124 = 274; 10% = 27.40; total 246.60. The whole-fit discount is the commercial hook.

**Ring-state data observed** (bottom pills):
- Look 02 "DIAL-UP": Corduroy trucker $142 · Pleated shorts $64 · Suede moccasin $118
- Look 03 "LONG WALKS": Polar fleece zip $92 · Nylon hike shorts $58 · Mesh trainers $124
- Each pill: 28px rounded thumbnail of the garment (cut-out) + uppercase name (tiny) + italic price; dashed 1px border, fully rounded.

---

## 7. Typography and colour [OBSERVED, values estimated from pixels]

| Role | Observation | [RECOMMENDED] stand-in |
|---|---|---|
| Hero title "Stay out of the loop" | High-contrast **condensed serif**, tight leading (~0.95), ~7% vh per line, near-black | *Instrument Serif*, *Gambarino*, or *PP Editorial New* |
| Look title (detail) | Same serif; number upright, name italic | same |
| Look name (bottom-left) | Light/regular grotesque, uppercase, ~20px, slightly wide tracking | *Inter Tight / Neue Montreal* |
| UI micro-labels | Grotesque or mono, uppercase, 6–8 px in capture (≈10–11 px at 1×), tracking +0.06em | *JetBrains Mono / Geist Mono* at 10px |
| Receipt | Mono/grotesque small caps; TOTAL line larger | mono |

Colours: page `#FFFFFF`; text `#0A0A0A`; secondary grey ≈ `#8A8A8A`; ring hairline ≈ `#ECECEC`; dashed outlines `#1A1A1A` at ~1px; solid black chips `#0A0A0A`. A thin **black rounded frame** surrounds the capture (screen-recorder border; likely not design).
The only colour comes from the photography (lilac, yellow, tan, navy).

---

## 8. Responsive behaviour

Only one desktop viewport is shown. **Nothing responsive is observable.** The "TAP A DOT" copy and the phone-style status bar hint that the design is also meant for touch, but this is unconfirmed. See §10.

---

## 9. [REQUESTED] Column-based homepage + neon headline

These are the brief's requirements. They are **not** in the video; they are specified here so a developer can build them while reusing the video's visual language.

### 9.1 Columns by aesthetic
- 5–7 full-height vertical columns edge-to-edge (default list: Streetwear, Old Money, Goth, Y2K, Techwear, Quiet Luxury, Coquette; others from the brief — Casual, Minimalist, Vintage, Grunge, Formal — can replace any). Treat the list as data, not hard-coded.
- Each column: full-bleed fashion photography (`object-fit: cover`), small label at the foot in the video's bottom-left style: `02 / 07` counter + aesthetic name in the grotesque uppercase.
- Keep the video's UI chrome: tiny top bar (wordmark, BAG pill), dashed pill buttons, black circle CTA, custom "DRAG"/"VIEW" follower cursor.
- **Movement** (choose, mirroring the video's *continuous clockwise rotation + front-item activation*):
  - [RECOMMENDED] Each column is an independent vertical marquee of 3–4 photos of that aesthetic, moving slowly; adjacent columns alternate direction (up/down) to create a woven rhythm. Speed ≈ 20–35 px/s, linear, paused on hover of that column.
  - Active column (hovered/focused) expands (`flex-grow` 1 → 3) and its label + "VIEW" follower appear; others compress and desaturate slightly. Click → detail view like §6 (aesthetic page with shoppable hotspots).
- Because the brief wants "rotating columns", an alternative that is closer to the video is a **3-D cylinder per column** (`rotateY` loop). That is an invention beyond the reference; keep only if the owner confirms.

### 9.2 Hero headline — "NO MORE BLIND SHOPPING"
- Exact text, uppercase, **not** centred; right-aligned block on the right side of the viewport. Stack as 4 lines (`NO / MORE / BLIND / SHOPPING`) or 2 lines depending on width.
- Colour: neon pink. [RECOMMENDED] `#FF2E93` (or `#FF1493`/`#FF2D95`) — owner to confirm the exact hex. Do not substitute another hue.
- Font: heavy/extra-bold display grotesque (e.g. *Anton*, *Archivo Black*, *Druk*, *Inter Tight 900*). Letter-spacing `-0.04em`; line-height `0.85`.
- Size: `clamp(4rem, 11vw, 12rem)`; occupies ~35–45% of the viewport width on the right.
- Layering: sits **above** the columns with `z-index`, `position:absolute; right: 3vw; top:50%; transform:translateY(-50%); text-align:right; pointer-events:none`. Readability over photos: `mix-blend-mode: normal`, plus a very subtle dark gradient scrim on the right (≈ 20–30% black) behind it; no outline or drop-shadow on the type.
- Must not block interaction with columns (`pointer-events:none`; only buttons re-enable).
- The video's centred serif "Stay out of the loop" is **replaced** by this headline; the video's small sub-line style ("Vol. 01 — Nine looks") may be reused beneath it in white/black at 11px.
- Entrance [RECOMMENDED]: lines slide up from a mask, 0.9 s, `cubic-bezier(.2,.8,.2,1)`, 80 ms stagger.

### 9.3 Ring adaptation (chosen direction) [REQUESTED + RECOMMENDED]
- **Each of the ring's figures = one fashion aesthetic** (e.g. Streetwear, Old Money, Goth, Y2K, Techwear, Quiet Luxury, Coquette, Grunge, Minimalist; nine slots, list is data). The bottom-left look name becomes the aesthetic name ("03 / 09 STREETWEAR"); item pills show that aesthetic's three pieces. Everything else (rotation, front-slot activation, VIEW/DRAG cursor, detail view, receipt) stays as observed.
- **Headline placement:** "NO MORE BLIND SHOPPING" replaces the centred serif title and goes on the **right**, so the ring must shift left: ring centre ≈ x 36%, rx ≈ 24% of width; headline block occupies x ≈ 58–97%, right-aligned, vertically centred. The ring remains fully visible and unobscured (headline `pointer-events:none`, sits beside it, not over figures).
- **Background:** **superseded by Part D (FD-3):** home stays white as in the video; the giant headline is large enough (≥ 24 px bold) to pass contrast in neon pink on white; small pink text uses `--pink-ink`. Neon pink is used for text only; clothing photos are never filtered or recoloured.
- **Right-side conflicts to resolve:** the video's RING/GRID toggle sits at the far right edge; keep it at x ≈ 97% beneath/overlapping nothing by vertically aligning it to the lower right, clear of the headline.
- **Detail view:** unchanged; the headline fades out with the ring (400 ms) and returns on close.
- **Photography rule:** all nine cut-outs share the same top-down camera angle; only the styling differs by aesthetic.

---

## 10. Details that cannot be determined from the video

1. **Whether columns, GRID view, or any column concept exists** — the "GRID" toggle exists but its layout is never shown.
2. Exact rotation speed, easing, and whether motion is continuous or step-and-pause (the clip is 12 s, and the active look changes once).
3. Drag behaviour (inertia, snapping, direction mapping) — never performed.
4. What the **autoplay ▶**, **LOOKS** side tab, **RING/GRID** toggle, **BAG (0)**, **SHOP THIS FIT +** and **ADD** buttons do — none is clicked. "SHOP THIS FIT +" probably opens the receipt for the active look (unconfirmed).
5. Responsive/mobile layout; tablet breakpoints.
6. Scroll behaviour (none shown).
7. Exact fonts, hex values, easing curves, durations (estimated from 30 fps frames).
8. Whether the status-bar strip ("…AM LOW SIGNAL", battery 12%, QR) is live data or decorative; the QR target.
9. Hover state of the figures other than the "VIEW" follower (any lift/scale?). None visible.
10. Audio track contents; any sound design.
11. Full list of the nine looks (only DIAL-UP and LONG WALKS are legible; the other seven have no visible name).
12. Teal cursor at the top-right in some frames — assumed recorder artefact.
13. Bag drawer, checkout, product pages — not shown.

---

## 11. Open decisions for the owner

1. ~~Ring vs. columns vs. hybrid~~ — **resolved: Ring.**
2. Keep the NOWHERE-style white minimal theme, or dark/colour-blocked to make neon pink pop? (Pink on white has weak contrast; [RECOMMENDED] near-black `#0A0A0A` background for the column version, keeping the video's UI details in white.)
3. Exact neon pink hex.
4. Is the receipt/"whole fit −10%" mechanic wanted? It is the video's main commerce idea.
5. Image sourcing: cut-outs (video style) vs. full-bleed editorial (column style).

---

## 12. Image and asset requirements

**For the video's style (ring):** 9 transparent PNG/WebP cut-outs, top-down high-angle full-body, ~1200×1800 px (shown at 4× in detail view), consistent camera angle, consistent soft lighting; per-look hotspot coordinates (x,y in %) and 3 garment thumbnails (cut-out, 160×160); pre-rendered soft ground shadow or CSS radial gradient.

**For the column version:** one hero image per aesthetic ≥ 1200×2000 (portrait 3:5), 3–4 images each for marquee loop; AVIF/WebP with `srgb`, `<=250 KB` each; focal point metadata (so `object-position` keeps the face/outfit visible when columns narrow); alt text per aesthetic.

Icons: back arrow, ×, ▶/⏸, +, battery, barcode (generate as SVG), QR (SVG).

---

## 13. Suggested component architecture

```
<App>
 ├─ <TopBar/>  (BackButton, StatusStrip, Wordmark, BagPill)
 ├─ <ViewSwitcher/>  (RING | GRID | COLUMNS)
 ├─ <Home>
 │   ├─ <RingStage looks onSelect/>        // video version
 │   │     └─ <LookFigure/> ×9, <EllipseGuide/>
 │   ├─ <ColumnStage styles onSelect/>     // requested version
 │   │     └─ <StyleColumn/> ×N (Marquee)
 │   ├─ <HeroHeadline text="NO MORE BLIND SHOPPING"/>   // requested
 │   ├─ <BottomBar look/>  (Counter, AutoplayToggle, LookName, ItemPills, ShopThisFit)
 │   └─ <CursorFollower/>
 └─ <LookDetail look onClose/>
       ├─ <LookTitle/>, <HeroFigure/>, <Hotspot/>×n, <Hint/>
       └─ <Receipt items discount onAdd onAddAll/>
```
State: `{ view: 'ring'|'grid'|'columns', activeIndex, autoplay, selectedLook|null, bag[] }`. Data-driven `looks.json`: `{id,name,image,items:[{name,price,thumb,hotspot:{x,y},role}]}`.

---

## 14. Implementation recommendations

**Ring positioning** (CSS/JS): for figure *i* with angle `θ = base + i·40°`, place at
`x = cx + rx·sin θ`, `y = cy − ry·cos θ`, `scale = 0.55 + 0.45·(1 + cos(θ − 180°))/2`, `z-index = round(scale·100)`. Animate `base` with one `requestAnimationFrame` loop (≈ +10°/s clockwise); apply via `transform: translate3d() scale()` only. When a figure's `θ` is within ±20° of the bottom, set it active (update bottom bar with a 400 ms blur-fade: `filter: blur(6px); opacity:0 → blur(0); opacity:1`).

**Drag** [RECOMMENDED]: pointer-capture, map `dx → Δθ`, release with inertia (`friction 0.95`) then snap to the nearest 40° with `cubic-bezier(.22,1,.36,1)` 600 ms.

**Open/close transition**: FLIP animation — measure the figure's rect, animate it to the detail rect (600–700 ms `cubic-bezier(.76,0,.24,1)`) while the rest fades (400 ms); or View Transitions API (`view-transition-name: look-{id}`).

**Receipt entrance**: `transform: translateY(-110%) → 0`, 700 ms, 150 ms delay.

**Column marquee** (requested version):
```css
.col__track{animation:col-up 40s linear infinite}
.col:nth-child(even) .col__track{animation-direction:reverse}
.col:hover .col__track{animation-play-state:paused}
@keyframes col-up{to{transform:translateY(-50%)}}  /* track holds images twice */
.cols{display:flex;height:100svh}
.col{flex:1;transition:flex-grow .7s cubic-bezier(.22,1,.36,1);overflow:hidden}
.col:hover{flex-grow:3}
.headline{position:absolute;right:3vw;top:50%;translate:0 -50%;text-align:right;
  font:900 clamp(4rem,11vw,12rem)/.85 "Anton",sans-serif;letter-spacing:-.04em;color:#FF2E93;pointer-events:none}
```
Also: respect `prefers-reduced-motion` (stop rotation, keep fades); pause when the tab is hidden; preload only the active + neighbouring images; use `will-change: transform` sparingly; keep touch fallback (swipe to rotate, tap to open) [RECOMMENDED].


---
---

# PART B — Virtual Fit Check (Real-Time 3D Fitting Room)

> **Status:** [REQUESTED] by the owner; **not in the reference video**. Everything below is specification and technology investigation, not observed behaviour. No code is to be written yet.
> Numbering: sections here are prefixed **VF-** so they do not collide with §1–§14 above.

## VF-1. Concept and where it lives

A real-time WebGL fitting room: the user uploads a full-body photo and enters height; the browser estimates body proportions and configures a **parametric 3D avatar**; the selected product is shown as a **3D garment on that avatar**; the user can rotate, zoom, change size/colour, and play practical animations (walk, turn, arms up, sit…). No video generation, no pre-rendered clips, no photo stacks, no rotating flat images. If a device cannot render real-time 3D, the feature is **unavailable with a clear message** (size chart still works) — it is never faked.

**Integration with the homepage [RECOMMENDED]:** the video's detail view (State B, §2/§6) already shows a look, hotspots and a receipt with per-item `ADD`. Add a **State C – Fit Check**:
- Entry: a dashed pill `VIRTUAL FIT CHECK ↗` in the receipt panel (per item and for the whole fit) and on the bottom bar next to "SHOP THIS FIT +".
- Visual language stays the same (white/black, dashed pills, tiny uppercase labels, serif title "Fit Check", mono receipt).
- Exit: "← Return to product details" (reuses the black circular back button and ✕).

```
<Home> → <LookDetail> → <FitCheck product={…}/>
```

## VF-2. User flow

1. **Consent screen** (before any upload): what happens to the photo (processed **on this device**, never uploaded in the default path), what is stored, how to delete. Checkbox/primary button "Continue". Declining returns to the product page with the size chart.
2. **Upload** a full-body photo (drag-drop, file picker, mobile camera `capture`). Guidance overlay: stand straight, arms slightly away, full body in frame, fitted clothing, plain background, camera at hip height.
3. **Height** (cm/ft-in) — required. Optional: weight band, chest/waist/hip (cm) if known, sex/body-type slider for the base mesh (inclusive options, not forced binary).
4. **Pose detection** (MediaPipe) → landmarks shown on the photo for the user to confirm/adjust (drag points). Quality checks: full body visible, torso not occluded, tilt < ~10°, resolution ≥ 720 px tall; otherwise explain and ask for a retake.
5. **Estimate → configure avatar**: proportions, skin tone, hair colour (sampled; editable swatches).
6. **Fitting room**: avatar wearing the selected garment, idle animation, controls (VF-6).
7. **Replace photo / Delete my data** available at all times.

## VF-3. Can a photo become a usable 3D avatar? (honest assessment)

| Approach | Verdict |
|---|---|
| **Photo → full-fidelity 3D body mesh** (SMPL-class regressors such as HMR2/SHAPY/ PIXIE, NeRF/Gaussian-splat from one image) | Research-grade; models are large (100 MB+), GPU-heavy, license-restricted (SMPL is non-commercial without a licence), and a single frontal photo gives poor depth (waist/chest circumference ±5–10 cm). **Not recommended for v1.** Possible Phase 4 server-side or WebGPU/ONNX experiment with explicit consent. |
| **Photo → 2D landmarks → parametric avatar** (MediaPipe Pose + segmentation, scale by height) | **Practical and recommended.** Gives height-normalised segment lengths (shoulder width, torso, leg, arm), body-width silhouette at key heights (from the segmentation mask: shoulder, chest, waist, hip, thigh), and rough shape class. Circumferences are *estimated from widths with a depth ratio assumption*, so they are approximations. |
| **Measurements-only** (user types height, chest, waist, hips…) | Most accurate when the user knows their numbers; simple. Use as manual override and as the fallback path. |

**Recommendation:** photo + height → proportions → drive a **morph-target (blend-shape) parametric avatar**; always let the user fine-tune sliders (shoulder width, chest, waist, hips, leg length, arm length, belly, muscle). Label everything "estimated". Do **not** attempt face reconstruction; use a generic head with selectable hair and skin tone sampled from visible skin (forearm/neck regions, lighting-corrected, user-editable).

## VF-4. Technology stack and investigation

| Need | Choice | Notes |
|---|---|---|
| 3D engine | **Three.js** (or **React Three Fiber** + drei if the app is React) | WebGL2; `GLTFLoader`, `AnimationMixer`, `SkinnedMesh`, morph targets |
| Asset format | **glTF/GLB** + **KTX2 (Basis)** textures + **meshopt/Draco** compression | small downloads; `gltf-transform` CLI in the build pipeline |
| Pose detection | **MediaPipe Tasks Vision – PoseLandmarker** (33 landmarks + optional segmentation mask), WASM/WebGL, runs fully on-device | model file self-hosted (~6–10 MB lite/full); no server call. Validate licence (Apache-2.0 at time of writing – re-check) |
| Avatar base mesh | A **CC0 / commercially licensed** rigged base (e.g. MakeHuman-exported, or a purchased/commissioned base) with **ARKit-less body morph targets** | Verify licences; avoid services that may shut down or bill per avatar. Do not assume Ready Player Me availability — check its current status before depending on it |
| Rig / skeleton | Humanoid skeleton compatible with **Mixamo** (so existing clips retarget) | author/rig in **Blender** (Rigify or Mixamo auto-rig for the base once) |
| Animation clips | Mixamo (free, Adobe licence – check commercial terms) or custom Blender clips; exported as GLB, retargeted to the avatar rig | idle, walk (loop, in place), turn L/R, 360, raise arms, cross arms, sit, torso twist; plus view-hold poses |
| Garments | See VF-5 | |
| Cloth motion | Skinning + spring bones + (Phase 4) optional lightweight PBD/verlet | See VF-7 |
| Fit maths | Plain TypeScript, no ML | See VF-9 |
| Authoring | **Blender** for retopo, weight painting, morph targets for sizes, baking | headless `bpy` export script for the pipeline |
| Optional cloth authoring | Marvelous Designer/CLO for pattern-accurate garments, then retopo + bake | paid tools; not needed at runtime |

Everything above runs **client-side**; no paid video-generation API is involved.

## VF-5. Putting the *actual product* on the avatar

A flat product photo must not be stretched over the body. Options ranked by quality:

**A. Real 3D garment asset per product (best, recommended for hero items).**
Garment modelled/scanned (or exported from CLO/MD), retopologised ≤ 15–25k tris, **rigged to the same skeleton as the avatar** (weights transferred in Blender with *Data Transfer*), UV-unwrapped to real pattern panels, textures: albedo (front/back/sleeves with logos & prints), normal, roughness, optional AO. Size variants = **shape keys** (S/M/L/XL) or separately exported meshes. Visual limits: authoring cost per SKU.

**B. Parametric garment templates + product textures (scalable).**
A small library of category templates (tee, long-sleeve, hoodie, shirt, jacket, trousers, shorts, skirt/dress later), each with panel-based UVs (front, back, left/right sleeve, collar, hem). The product's **front and back photos are mapped to the correct panels** by a one-time per-SKU "panel cutter" step (manual crop or assisted with segmentation); colour change = hue/lookup in shader on the base fabric region (print masks stay unchanged). Visual limits: silhouette is the template's, not the exact product's; unusual cuts (cropped, oversized, asymmetric) need new templates; fine prints distort at seams; back/side detail only if those photos exist.

**C. Image-to-3D / garment reconstruction models (TripoSR-style, single-image garment fitting).**
Experimental, server-side or heavy. Output quality for garments is currently inconsistent (thin geometry, wrong backs, baked lighting). **Not recommended for production**; may be explored in Phase 4.

**D. Flat texture projection onto the torso (the thing to avoid).**
Documented only as a rejected option: it produces the "sticker on a body" look, wrong silhouette, no sleeves or hem. **Not allowed** as the product experience.

**Fallback when no 3D asset exists:** use approach B if a template matches; otherwise show a notice "3D fit check not yet available for this item" with size chart and product photos. Do not substitute a fake rotating image.

**Clipping prevention:** (1) make the garment shell ~2–6 mm outside the body in the authored size M; (2) per-region **body mask** — hide body triangles covered by the garment (`material.alphaTest`/vertex group culling) so skin never pokes through; (3) when size/body morphs change, **push garment vertices out** along normals to at least the body surface + epsilon (precomputed per-vertex "min offset" or a cheap per-frame capsule/SDF check on limbs and torso, ~15 capsules); (4) test extreme poses (arms crossed, sitting) and add corrective shape keys where it fails.

## VF-6. Controls

| Control | Behaviour |
|---|---|
| Drag to rotate | `OrbitControls` (azimuth free, polar clamped, damping 0.08); touch: one-finger rotate, two-finger pinch zoom |
| Zoom | wheel / pinch / +− buttons; min/max distance so the garment can be inspected closely |
| View buttons | **FRONT / SIDE / BACK** animate camera to 0°/90°/180° in 500 ms, `cubic-bezier(.22,1,.36,1)`; avatar switches to the neutral A-pose-hold clip so the garment is readable |
| Animation selector | Pill row: IDLE · WALK · TURN L · TURN R · 360 · ARMS UP · ARMS CROSSED · SIT · TWIST (cross-fade 250–400 ms) |
| Reset camera | restores default framing (3/4 view) |
| Size | S / M / L / XL (+ product's own scale) – swaps shape key / garment variant live |
| Colour | swatches from product variants (texture/tint swap) |
| Replace photo | returns to upload step, discards derived data of the previous photo |
| Delete my data | wipes photo, landmarks, measurements (VF-10) |
| Return to product details | back to State B |
| Heatmap toggle | VF-9 |

The avatar stays interactive during every state (no blocking modals except consent/upload).

## VF-7. Animation and garment behaviour

**Required clips** (all in-place, loopable, ~1–3 s, garment-friendly): Idle (subtle breathing), Walk, Turn Left, Turn Right, 360° turn, Arms raised overhead, Arms crossed, Sit (onto an invisible chair/stool, hips lowered, thighs horizontal), Upper-body twist, and Front/Side/Back inspection holds.
Rules: no unrelated dance, no extreme acrobatics; root motion disabled (avatar stays centred); `AnimationMixer` with `crossFadeTo`; additive layers for breathing.

**Cloth strategy (tiered):**
1. **Skeletal skinning** (baseline, all devices): garment skinned to the avatar skeleton incl. sleeve twist bones and torso split bones → sleeves/torso follow movement.
2. **Corrective shape keys** driven by joint angles (shoulder raise, elbow bend, hip flex when sitting) to avoid collapse/candy-wrapper artefacts.
3. **Spring bones** (secondary motion): extra bones in hem, loose sleeve ends, hood, skirt; verlet chain with stiffness/damping/gravity per garment type (`@pixiv/three-vrm` spring-bone solver or a ~100-line custom solver); capsule colliders on thighs/arms/torso. Cost: negligible on mobile; enable for loose garments only (hoodie, oversized, dress), minimal for fitted.
4. **Phase-4 option:** GPU/CPU position-based dynamics on a coarse hem/sleeve patch, or baked cloth caches from Blender (per animation, per size) played as morph animation — high visual quality, large assets; evaluate per hero SKU.

Full cloth simulation is **not** required in v1. Priority is convincing results at stable 60 fps (30 fps acceptable on low tier).

**Breakdance step — flagged conflict [OWNER DECISION NEEDED]:** the Phase-2 list in the brief contains "breakdance step", while §3 of the same brief says "do not use unrelated dance animations or excessive movement". Recommendation: include **one** short, standing top-rock style step as an opt-in clip labelled "STRETCH TEST — DANCE STEP", clearly separate from the core fitting poses, because it stress-tests cloth (and exposes clipping). **Exclude floor moves (freezes, windmills, headspins)** — they are physically extreme for skinned garments and would require a cloth solver. Mixamo has suitable clips; confirm licence.

## VF-8. Photo analysis pipeline (on-device)

1. Load image, strip EXIF (apply orientation first), downscale to ≤ 1280 px tall in a canvas.
2. `PoseLandmarker` (image mode, `outputSegmentationMasks:true`).
3. Validate: all of nose, shoulders, hips, knees, ankles visible with visibility > 0.6; reject/ask for retake otherwise.
4. Scale: `px_per_cm = (ankle–to–head-top pixel distance) / height_cm` (head-top estimated from nose + head-ratio; subtract ~1–1.5 % for ankle-to-floor; correct for camera perspective only roughly).
5. Segment lengths: shoulder width, torso (shoulder→hip), leg (hip→ankle), upper/lower arm, in cm.
6. Mask widths at chest (~shoulder + 0.25 torso), waist (narrowest between ribs and hips), hips (widest below waist) → front widths in cm; **circumference ≈ π·(a+b)/ratio**-type estimate with depth = width × k, where k is from a prior (body-type slider / optional side photo / user-entered values). Report ± uncertainty (e.g. ±6 cm).
7. Map to avatar sliders (z-score vs. the base mesh's neutral dimensions).
8. Skin tone: sample non-clothed skin patches (face/neck/hands/forearms via landmarks), convert to linear, neutralise by the photo's white balance estimate, snap to a swatch the user can change. Hair colour from pixels above the head landmark region; user-editable.
9. Optional second photo (side view) improves depth ratios → "Improve accuracy" prompt.

All steps run in a Web Worker (OffscreenCanvas) to keep the UI responsive.

## VF-9. Fit analysis, heatmap and size recommendation

**Inputs:** body measurements (estimated or user-entered) + garment size chart (chest, waist, hem, shoulder, sleeve, length by size, in cm, *garment* measurements, with stretch % if given).

**Ease per region:** `ease = garment_circumference(size) − body_circumference` (with fabric stretch allowance). Target comfortable ease by category (e.g. tee ~6–12 cm chest, shirt 8–14, hoodie 12–22, oversized 20+). Define `t = (ease − target_min) / (target_max − target_min)`.

**Heatmap (approximate):**
- Per-vertex scalar `fit` stored as a vertex attribute (or a low-res region texture), computed on size/measurement change from the **actual distance from garment to body surface** (precomputed per size and per body-morph bucket, interpolated), so it tracks real geometry.
- Fragment shader colour ramp: **red** (tight, `fit < 0`) → **neutral/transparent** (comfortable) → **blue** (loose, `fit > 1`), blended over the garment at ~60 % opacity; legend + "Estimate" label; toggle button.

**Size comparison:** S/M/L/XL swap live on the same avatar; optional split-screen/ghost overlay (two garments, one wireframe) for direct comparison.

**Recommendation:** choose the smallest size whose chest/waist/hip ease is inside the target range; if two are close, bias by a user preference (fitted / regular / relaxed). Output: "Recommended: **M** — chest ease +8 cm (est.), shoulders ✓; L would be relaxed." Show a confidence indicator (high when measurements are user-entered or side photo provided; low for a single frontal photo). If no size chart: show visual comparison only, no numerical claim.

**Mandatory wording:** "Estimates only. Based on your photo and height; not a body scan. Check the size chart and return policy."

## VF-10. Privacy and data handling

- **Default: 100 % on-device.** Photo, landmarks, masks and measurements never leave the browser. Models are static files served by the site (no third-party calls at runtime). State this on the consent screen.
- Photo kept **in memory only** (object URL revoked on exit, canvas cleared). Derived data (measurements, slider values) optionally saved to `localStorage`/IndexedDB **only if the user opts in** ("Remember my fit").
- **Delete my data**: button always visible; wipes memory, storage, and any server copies (if the user opted in), confirms completion.
- **Server processing is opt-in only** and only for features that need it (e.g. a Phase-4 higher-accuracy reconstruction). Before sending: explain *what* is sent (image / derived measurements), *why*, retention period (e.g. deleted within 24 h or immediately after processing), processor, and obtain **explicit, separate consent**; provide deletion on request. TLS, no third-party analytics receiving image data, no training use.
- No face recognition or identity reconstruction; strip EXIF/GPS; reject uploads where the user indicates a minor needs guardian consent (policy decision).
- Comply with applicable law (GDPR/CCPA etc.; some jurisdictions treat body/biometric data specially) — legal review needed [OPEN].

## VF-11. Performance and compatibility

| Tier | Detection | Behaviour |
|---|---|---|
| High (desktop GPU, recent phones) | WebGL2 + fps probe ≥ 55 | DPR ≤ 2, soft shadow, spring bones, heatmap, 2k textures |
| Mid | fps 30–55 | DPR 1.5, baked contact shadow, spring bones on key garment only, 1k textures |
| Low | fps < 30 or `maxTextureSize` small | DPR 1, no shadows, skinning only, no spring bones, simplified materials |
| None | WebGL2 unavailable / context lost | Message + size chart + product photos; **no fake try-on** |

Budgets: avatar ≤ 30k tris, garment ≤ 20k, total download ≤ ~8–12 MB (meshopt + KTX2), animation clips ≤ 150 KB each, MediaPipe model lazy-loaded only after consent; Web Worker for photo analysis; one draw call group, instancing not needed; pause `requestAnimationFrame` when the tab is hidden; render on demand when idle in low tier; `prefers-reduced-motion` → start on idle only, no autoplay turntable. Handle `webglcontextlost`. Tested on iOS Safari (memory limits ≈ GPU 1–1.5 GB), Android mid-range, desktop Chrome/Firefox/Safari.

## VF-12. Component architecture (adds to §13)

```
<FitCheck>
 ├─ <ConsentGate/>
 ├─ <PhotoUpload/>  ─ <PhotoGuidelines/>, <LandmarkEditor/>
 ├─ <BodyInputs/>   (height, optional measurements, body-type slider)
 ├─ <FitStage/>                    // R3F <Canvas>
 │    ├─ <Avatar morphs skin hair/>
 │    ├─ <Garment product size colour heatmap springBones/>
 │    ├─ <AnimationController clip/>
 │    ├─ <CameraRig view/>  (Orbit + presets)
 │    └─ <Lights/>, <ContactShadow/>
 ├─ <FitControls/>  (views, animations, size, colour, reset, replace photo)
 ├─ <FitPanel/>     (measurements, recommended size, legend, disclaimers)
 └─ <PrivacyPanel/> (what's stored, Delete my data)
workers/poseWorker.ts   (MediaPipe + measurement estimation)
lib/fit.ts              (ease, heatmap, recommendation)
lib/avatarMap.ts        (measurements → morph weights)
lib/capabilities.ts     (tier detection)
```
State: `{ photoStatus, measurements{value,uncertainty}, avatarParams, product, size, colour, clip, view, heatmap, tier, consent }`.

## VF-13. Phased delivery with acceptance criteria

**Phase 1 – Core:** consent, photo upload, height input, pose-based estimate → adjustable avatar; selected garment (approach A or B) on avatar; drag/zoom; FRONT/SIDE/BACK buttons. *Accept:* avatar proportions visibly change with height/sliders; garment shows front **and** back graphics; ≥ 30 fps on mid-range phone; photo never leaves device (verified in network tab).
**Phase 2 – Animation:** idle, walk, turn L/R, 360, arms raised, arms crossed, sit, twist; skinning + corrective shapes + spring bones for loose garments; optional dance step per VF-7. *Accept:* no visible skin poking through garment in any clip for the test body set; sleeves/hem react to movement.
**Phase 3 – Fit intelligence:** measurement estimation with uncertainty, size chart ingestion, size comparison, heatmap, recommendation with disclaimers. *Accept:* validated against ≥ 20 volunteers' tape measurements; report mean error; copy keeps "estimate" wording.
**Phase 4 – Advanced:** better physics (PBD/baked cloth), improved body reconstruction (optional opt-in server), richer fabric materials (sheen, weave normal maps), exportable avatar preview — static PNG/turntable image export **generated from the real-time render** (labelled as an export, not the product experience) and GLB share.

## VF-14. Risks and unknowns

1. Single-photo circumferences are approximate; clothing in the photo (baggy) biases results — mitigate with guidance and manual sliders.
2. 3D garment content is the bottleneck (authoring per SKU); template approach limits silhouette accuracy.
3. Avatar likeness is body-shape only (no face), by design; skin/hair are approximations.
4. Asset licensing (Mixamo, base meshes, any avatar service) must be checked before commercial use.
5. Mobile memory/thermal limits for long sessions.
6. Fit predictions depend on accurate garment specs; many retailers lack them.
7. Legal/privacy review for body-image data in target markets.
8. The brief's "breakdance step" vs. "no unrelated dance" conflict (VF-7).
9. Not in the video: how State C should look inside the existing UI beyond the integration sketch in VF-1 — design review needed.


---
---

# PART C — Cart Page: Printing Receipt

Source: `Recording 2026-11-12 013406.mp4` (5.7 s, 692×748 portrait, 30 fps, silent-analysis only). Labels as before: **[OBSERVED]**, **[REQUESTED]**, **[RECOMMENDED]**. Section prefix **CR-**.

> The video comes from a different site (the receipt says "@moodreceipt presents"), where the receipt is a *mood-board* for drinks → outfits, **not a shopping cart**. There are no prices, quantities, totals or checkout controls in it. What transfers to your cart page is the **mechanic and look**: a thermal printer slot that feeds out a cream paper receipt carrying cut-out images, mono type, asterisk rules and a barcode. Cart-specific content (line items, total, checkout) is therefore [RECOMMENDED], and it continues the receipt idea already in the NOWHERE detail view (§6).

> **DECISION (owner, 2026-11-12): the cart uses the BLACK & WHITE theme, not the video's olive green.** Stage `#FFFFFF` (or near-black `#0A0A0A` if the site goes dark per §9.3), printer slot in black/white with a grey hairline shadow, receipt paper `#FFFFFF`/`#FAFAFA` with a hairline `#E5E5E5` edge (on a white stage the paper needs the shadow `0 8px 24px #0002` to separate), ink `#0A0A0A`, status LED reduced to a black dot (printing: blinking) → solid grey `#8A8A8A` (idle) with **no amber/green**, chips white with dashed black outline and black fill when selected (matching §2/§6). The only colour on the page remains the product photography. Where the sections below mention olive, amber or green, read them as black/white/grey.

> **DECISION (owner, 2026-11-12): the cart is a FULL PAGE** (own route, e.g. `/cart`), not a drawer or overlay. It reuses the persistent chrome from the ring page (back button, `NOWHERE©` wordmark, `BAG (n)` pill, status strip); the stage fills the viewport and the receipt prints at its centre. Navigating in from `BAG (n)` or from "ADD WHOLE FIT TO BAG →" triggers the print animation on load; browser Back returns to the previous page. A long cart scrolls **inside the page** (the printer slot stays fixed at the top; the paper keeps feeding and the page scrolls vertically beneath it). Still open: chips in the cart, and line-by-line vs. full re-print on item add.

## CR-1. Observed layout [OBSERVED]

Portrait stage (≈ 692×748 capture, 0.92 aspect), centred column; dark `#2B2B2B` bars at left and right in the capture are the recording frame, not design.

```
<Stage bg = olive green, soft vignette (darker toward bottom), faint tile-grid lines + a diagonal light streak>
├─ PrinterSlot   white rounded bar, ~82% stage width, ~28 px tall, y≈5%, soft drop shadow;
│                 inner dark horizontal line (the slot), small status LED at right end
├─ Receipt       cream paper, ~69% of stage width, hangs below the slot, torn zig-zag bottom edge
│   ├─ Title line        "COLD BREW INSPIRED"  (mono, bold, uppercase, centred)
│   ├─ Asterisk rule     ******************************** (full paper width, mono)
│   ├─ Image block       model cut-out (left, tall) + product cut-outs stacked on the right
│   │                     (jacket, can, loafer) — transparent PNGs, no frames, slight overlap allowed
│   ├─ Asterisk rule
│   ├─ Footer row        tiny tags "CLASSIC / WARM / BOLD" (3 lines, left) + barcode (right)
│   └─ Sign-off          "THANK YOU!"  (mono, bold, centred)
├─ Hint (idle only)  handwritten white script "pick a drink, get a fit ↓" above the chips
└─ ChipBar (bottom)  4 pill buttons: ● STRAWBERRY  ● MATCHA  ● COLD BREW  ● BLUEBERRY
```

**Chips:** white pill, soft shadow, 10 px mono uppercase label, coloured dot at left (pink, pale green, brown, periwinkle). Selected chip = **black fill, white text** (COLD BREW during the print). Four chips fill ~80% of the stage width.

**Two receipts seen**
1. *Selected-item receipt* (COLD BREW): title `COLD BREW INSPIRED`; model + jacket + can + loafer; tags `CLASSIC / WARM / BOLD`; barcode; `THANK YOU!`.
2. *Idle/intro receipt*: header `@moodreceipt presents` (small), `LOOK INSPO FROM` (small caps), huge pixel-font **`DRINKS`** (black, bitmap/8-bit face), row of four full-length models side by side (one per chip colour: pink, green, brown, blue), asterisk rule, centred barcode, footer `tell me your fav after ♡` (lowercase, tiny). This one is shorter (no product stack) and the LED is **green**.

**Typography [OBSERVED/estimated]:** receipt body = monospace (Space Mono / Geist Mono–like), uppercase, 8–11 px at capture scale, titles bold; `DRINKS` = pixel display font (Silkscreen / Pixelify Sans / Jersey 10 class); hint = casual handwritten script (Caveat / Gochi Hand class). Palette: stage olive `≈#5F7B46` → `≈#4E6639` toward the bottom; paper `≈#FBFAF4`; ink `#111`; chips white `#FFF`/selected `#0E0E0E`; LED amber `≈#F2B632` (printing) → green `≈#8BD04F` (idle).

## CR-2. Printing animation [OBSERVED]

- **Mechanism:** the paper is a tall element **clipped by the printer slot**; it **translates downward out of the slot**, so new content emerges from beneath the slot while the zig-zag tail edge descends. Content therefore appears **bottom-first**: the first things visible are the shoes/can, then the barcode/`THANK YOU!` zone moving down, then the model's legs, torso, and last the title row. Nothing is typed character by character; the whole paper is pre-rendered and **slides**.
- **Timing:** feed duration ≈ **2.5–3 s**, **ease-out** (fast at first, slowing to a stop; the last few frames move only a few px). Travel ≈ the receipt height (≈ 330 px at 692-wide capture). Capture started mid-print, so the start of the feed (paper first leaving the slot, any initial paper-ratchet shake) **is not visible**.
- **LED:** amber/yellow while feeding; dims/pale at the end of feed.
- **Settled state (t ≈ 3 – 3.5 s):** receipt hangs still beneath the slot, top edge tucked behind the slot lip (the title is at the very top, tight to the slot), zig-zag bottom ≈ 45–50 % down the stage. Lots of empty olive space beneath, then the chip bar.
- **Swap:** from the selected-item receipt to the *intro* receipt (`DRINKS`) is an **instant cut** between two adjacent frames at 7.5 fps (≤ 133 ms): no slide-out, no print, no fade is visible. Simultaneously the selected chip loses its black fill (all chips white), the script hint appears above the chips, and the LED turns green. Whether this is a "reset/loop" of the clip, a timeout, or the real idle state of the page cannot be told from 5.7 s.
- **Cursor:** native arrow only, no custom cursor. At the very end the pointer moves onto `STRAWBERRY`; no click occurs in the clip.

Not visible: what happens when another chip is clicked (retract? new print? colour change of the stage?). See CR-7.

## CR-3. Cart-page adaptation [REQUESTED + RECOMMENDED]

Brief: the cart page should be a receipt that prints, like the video. Keep the printer + paper + mono language, and put real cart data on the paper.

```
<CartPage>
 ├─ <PrinterSlot status="idle|printing|error"/>
 ├─ <ReceiptPaper>                         // clipped, slides out of the slot
 │    ├─ Header     NOWHERE©  ·  VOL. 01 · TILL 0034 · LISBON · date/time      [uses §6 header]
 │    ├─ ****** rule
 │    ├─ LineItem × N   (cut-out thumb 56–72 px, NAME, role/size/colour, qty stepper − 1 +, price, REMOVE)
 │    ├─ ****** rule
 │    ├─ SUBTOTAL / WHOLE-FIT −10% (if all 3 pieces of a look are in the bag) / SHIPPING / TOTAL (large)
 │    ├─ [ CHECKOUT → ] full-width black bar (reuses §6 "ADD WHOLE FIT TO BAG →" style)
 │    ├─ barcode (SVG, derived from cart id)    + tags (e.g. look names, like CLASSIC/WARM/BOLD)
 │    └─ THANK YOU!  /  THANKS FOR GOING NOWHERE.  + zig-zag tear edge
 └─ <ChipBar/>  optional: re-use for look/aesthetic filter or "continue shopping" chips (not observed in cart context)
```

- **Look and feel:** olive-green stage and printer as in the video, **or** the NOWHERE white/black theme (owner decision, CR-7). Whichever stage is used, the receipt itself stays cream, mono, with asterisk rules and the torn edge.
- **Receipt content ordering** mirrors the video's visual order: title/header → rule → imagery → rule → barcode/tags → sign-off, with line items and totals added between the imagery and the barcode.
- **Cut-out imagery:** use the same transparent product/model PNGs as the ring, arranged like the video (large model left, product stack right) as a "look summary" block at the top; the line items follow.
- **Empty cart:** printer slot with a blank paper stub printing `NOTHING HERE YET.` + `START SHOPPING →`.
- **Mobile:** paper width 88 % of viewport; same portrait layout (the reference is already portrait).

## CR-4. Interaction & animation spec [RECOMMENDED unless marked]

| Event | Behaviour |
|---|---|
| Open cart | LED amber; paper slides out of the slot **(observed mechanism)**: `translateY(-100% → 0)` inside an `overflow:hidden` slot window, 2.6 s, `cubic-bezier(.16,1,.3,1)` (ease-out like the video). Optional: tiny stepped "ratchet" jitter (±1 px at ~20 Hz) during feed — **not observed**, optional. LED → pale/green at end |
| Add item while open | Re-print: the paper retracts 8 % and feeds again with the new line inserted, or the new line "prints" below the existing ones by extending the paper (preferred: line-by-line stepped feed, 120 ms per line) — invention, keep short |
| Remove item | Line collapses (height → 0, 250 ms), paper tail shortens, totals recount (digit roll) |
| Qty change | Number change + total recount |
| Checkout | Paper feeds out fully / tears off (translate down + fade 500 ms) then navigates |
| Swap/reset between receipts | Hard cut (as observed) is acceptable for state resets; do not use it for item edits |
| `prefers-reduced-motion` | No slide; paper fades in fully printed (200 ms) |

```css
.printer{position:relative;width:82%;margin:0 auto;z-index:2}
.paper-window{position:relative;width:69%;margin:-1px auto 0;overflow:hidden;
  /* extend downward so the tail is not clipped */ height:calc(100svh - 12rem)}
.paper{background:#FBFAF4;font:600 11px/1.45 "Space Mono",monospace;text-transform:uppercase;
  transform:translateY(-100%);animation:feed 2.6s cubic-bezier(.16,1,.3,1) forwards;
  --tooth:8px; mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/var(--tooth) 51% repeat-x,
                   linear-gradient(#000 0 0) top/100% calc(100% - var(--tooth)*.5) no-repeat} /* zig-zag tail */
@keyframes feed{to{transform:translateY(0)}}
.led{width:6px;height:6px;border-radius:50%;background:#F2B632;animation:blink 0.5s steps(2) infinite}
.paper.done ~ .led{animation:none;background:#8BD04F}
```
Notes: the paper's **tail** (bottom, zig-zag) leads, so give `.paper-window` enough height or animate the paper's `margin-top` from `-height` to `0`; add a soft inner shadow under the slot lip so the paper appears to emerge from inside the machine; paper shadow `0 8px 24px #0003`. Barcode: SVG Code-128 bars generated from the cart id; asterisk rules: `"*".repeat(n)` in mono sized to paper width (or CSS `repeating-linear` on a dotted mask).

## CR-5. Assets & content requirements

- Transparent PNG/WebP cut-outs of products (consistent crop, shadowless) and model shots (full body, 3:5), ≥ 600 px wide for the paper-image block.
- Fonts: mono (Space Mono / Geist Mono / IBM Plex Mono), pixel display font for big receipt titles (e.g. `YOUR BAG` in the style of `DRINKS`), handwriting font for the helper note ("pick a drink, get a fit ↓" → e.g. "tap an item to edit ↓").
- SVG: printer slot with LED, barcode generator, zig-zag edge, chip dots.
- Optional paper-grain texture (very subtle noise, ≤ 8 KB) and stage tile-line texture.

## CR-6. Implementation recommendations

- Component names: `<Printer/>`, `<ReceiptPaper/>`, `<ReceiptLine/>`, `<TearEdge/>`, `<Barcode/>`, `<StatusLed/>`; cart state in a store (items, qty, discounts, total) separate from the animation state machine `idle → printing → printed → editing → checkout`.
- Animate with a transform on one element (GPU compositing); avoid animating `height` of the whole paper except for line add/remove.
- Accessibility: the receipt is real DOM text (not an image); `aria-live="polite"` on the total; the printing animation must not delay interaction — controls are enabled once the paper is ~60 % out (or immediately for keyboard users); focus order: items → quantity → remove → checkout.
- Totals use the actual cart prices; any "whole fit −10 %" must match the rule used on the product page (§6).

## CR-7. Not determinable from this video / open decisions

1. How the clip begins (first ~0.1 s of feeding) and whether there's a ratchet/jitter or sound (audio not analysed).
2. What the **chips** do on click: re-print another receipt, retract the old one first, change the stage colour (the chips' colours suggest theme-per-flavour; the stage stayed green in both receipts, so unknown).
3. Why the receipt hard-cuts to the `DRINKS` intro (loop, timeout, or idle state), and whether the intro receipt prints in the same way.
4. Any line items, prices, quantity controls, totals, checkout, remove, or empty state — **none shown**; all in CR-3 are recommendations.
5. Hover/press states of chips, receipt, LED meaning (printing vs. idle) is inferred from colour only.
6. Responsive behaviour beyond the portrait capture; exact fonts/hex values/easing (estimated from 30 fps frames).
7. **Owner decisions:** (a) stage colour — keep the video's olive green for the cart, or the NOWHERE white/black theme; (b) whether chips appear in the cart (and as what); (c) whether the cart is a full page or a drawer/overlay over the ring page; (d) line-by-line print on item add vs. a simple re-print.


---
---

# PART D — Frontend Assessment, Filled Blanks & Design System

Prefix **FD-**. This part (1) audits Parts A–C as a frontend engineer, (2) **resolves the open items with concrete defaults** (owner may overrule any; each is tagged **DEFAULT**), and (3) defines the final **black & white + neon-pink-text** art direction. Still documentation only; nothing is implemented.

## FD-1. Assessment of the current document

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Colour direction was inconsistent: §9.3 recommended a near-black stage "or white", Part C had olive/amber/green. | High | FD-3 fixes one system. Supersedes §9.3 background bullet and all green/olive/amber in Part C. |
| 2 | Neon pink on white fails WCAG for small text (≈3.5 : 1 for `#FF2E93`). | High | FD-3 pink rules: large display text on white, any size on black, and a darker "pink-ink" for small text on white. |
| 3 | The ring needs a mobile layout and a no-pointer path; the video shows desktop only. | High | FD-6, FD-9. |
| 4 | Side controls (LOOKS, RING/GRID, autoplay ▶, SHOP THIS FIT +, BAG) had no defined behaviour. | High | FD-5. |
| 5 | Ring accessibility: 9 absolutely-positioned moving images are not keyboard- or screen-reader-friendly. | High | FD-9. |
| 6 | No data model, routing, state or file structure. | Medium | FD-7, FD-8. |
| 7 | No loading/empty/error states, no performance budget for 9 large cut-outs + a 3D room. | Medium | FD-10, FD-11. |
| 8 | §9.1 (columns) desaturated inactive columns — conflicts with "clothes keep natural colour". | Medium | Columns are dropped; rule added in FD-3: **never filter garment photos**. |
| 9 | Cart open questions (chips, line-by-line print, drawer vs page). | Medium | FD-5.7 (decided). |
| 10 | Part B (3D fitting room) has no visual spec in the new theme. | Medium | FD-12. |
| 11 | No motion tokens; durations/easings scattered. | Low | FD-4. |
| 12 | Section numbering is mixed (§, VF-, CR-, FD-). | Low | Kept for traceability; FD-14 gives a single build order. |

## FD-2. Art direction — "editorial, silent, a little loud"

**One idea:** a quiet black-and-white gallery in which the only things allowed to be loud are (a) the clothes and (b) the pink words.
- **Monochrome UI.** Everything that is not a garment or the pink text is white, black or grey. No gradients on the UI, no coloured buttons, no coloured shadows.
- **Clothing stays natural.** Model and product images are shown exactly as photographed — no `grayscale()`, `saturate()`, `mix-blend-mode`, tint overlays, or hover recolouring on any garment, ever. Colour swatches in the UI show the real garment colours.
- **Neon pink = text only** (plus its caret/selection colour). Never as a button fill, background, border, shadow, or icon (keeps pink rare enough to hit hard). The one exception: a 1 px underline on pink text links.
- **Texture of print:** hairline rules (1 px), dashed outlines, mono micro-type, asterisk rules, barcodes, zig-zag paper edge. Quiet 3–4 % paper grain on white surfaces.
- **Scale contrast:** extreme — a 12 vw headline next to 10 px mono labels; very few mid-sized elements.
- **Whitespace is the luxury.** The ring never has more than the title/headline, nine figures and four chrome clusters on screen.

## FD-3. Colour system (final)

```css
:root{
  /* neutrals */
  --white:#FFFFFF;  --paper:#FAFAF7;  --mist:#F1F1EF;  --hair:#E4E4E1;
  --ash:#A8A8A4;    --smoke:#6E6E6A; --ink:#0A0A0A;    --black:#000000;
  /* the accent — TEXT ONLY */
  --pink:#FF2E93;          /* neon, display text / any text on dark */
  --pink-ink:#D4006C;      /* small text on light backgrounds (≥4.5:1) */
  --pink-glow: 0 0 .35em #FF2E9366;   /* text-shadow on dark only, optional */
}
```

**Contrast table (measured values; recheck in the build):**
| Pair | Ratio | Use |
|---|---|---|
| `--pink` `#FF2E93` on `--ink` | ≈ 5.7 : 1 | any size ✓ |
| `--pink` on `--white` | ≈ 3.5 : 1 | **large/bold text only (≥ 24 px, or ≥ 18.66 px bold)** — OK for the hero headline |
| `--pink-ink` `#D4006C` on `--white` | ≈ 5.1 : 1 | small pink text on light ✓ |
| `--ink` on `--white` | ≈ 19.9 : 1 | body ✓ |
| `--smoke` `#6E6E6A` on `--white` | ≈ 5.1 : 1 | secondary text ✓ |
| `--ash` on `--white` | ≈ 2.4 : 1 | decoration only (hairlines, ring guide), **never text** |

**Theme assignment (DEFAULT):**
| Surface | Background | Text | Pink usage |
|---|---|---|---|
| **Home / ring** | `--white` (as in the video) | `--ink` | Hero headline (large) in `--pink`; "Vol. 01 — Nine looks" micro-label in `--pink-ink` |
| **Look detail** | `--white` | `--ink` | Look title numeral `03.` in `--pink`; hotspot label price in `--pink-ink` |
| **Cart page** | stage `--ink` (black) with white receipt paper — this makes the paper "glow" and lets pink work at any size on the stage | paper text `--ink` | Stage text (e.g. "YOUR BAG" label outside paper, LED caption) in `--pink`; on paper only `TOTAL` currency symbol in `--pink-ink` |
| **Fit Check (3D)** | `--ink` → `--white` radial studio backdrop | white UI | pink only for the "ESTIMATE" tag and recommended-size text |

Why: white home keeps fidelity with the reference video; a **black cart stage** gives the printer/receipt a dramatic contrast and solves the pink-on-white problem there. (If the owner prefers a white cart, keep paper on `--mist` and a 1 px `--hair` edge with `0 12px 32px #0002`.)

Selection/caret: `::selection{background:var(--ink);color:var(--pink)}` · `caret-color:var(--pink)`.
Focus ring: `outline:2px solid var(--ink); outline-offset:3px` on light, `2px solid var(--white)` on dark (never pink-only focus).
Forbidden: any CSS filter/blend on `<img>` of garments; coloured shadows; gradient fills on UI; pink buttons.

## FD-4. Typography & motion tokens

**Type families (DEFAULT, all open-licence from Google Fonts / Fontshare; self-host, `font-display: swap`, subset to Latin):**
| Role | Family | Notes |
|---|---|---|
| Serif display (titles) | **Instrument Serif** (regular + italic) | "Stay out of the loop"-style titles, look titles |
| Brand statement | **Anton** or **Archivo Black** (single weight, uppercase) | `NO MORE BLIND SHOPPING`; tracking −0.03em, leading 0.84 |
| UI / body | **Inter Tight** 400/500/600 | |
| Mono (receipts, micro labels) | **Space Mono** 400/700 (or Geist Mono) | uppercase, tracking +0.06em |
| Pixel display (cart titles, optional) | **Silkscreen** or **Jersey 10** | only for 1 receipt title ("YOUR BAG") — keeps the video's bitmap flavour |
| Handwritten helper (cart hint) | **Caveat** | white on black stage, once |

Scale (fluid): `--t-hero: clamp(4rem, 11vw, 12rem)` · `--t-title: clamp(2.5rem, 6vw, 5.5rem)` · `--t-look: clamp(1.4rem, 2.2vw, 2rem)` · `--t-ui: .8125rem` · `--t-micro: .625rem` (10 px, mono, uppercase; minimum size for non-essential labels — never below 10 px).

**Motion tokens:**
```css
:root{
  --ease-out:cubic-bezier(.22,1,.36,1);   /* arrivals, snaps */
  --ease-io:cubic-bezier(.76,0,.24,1);    /* open/close of look detail */
  --ease-print:cubic-bezier(.16,1,.3,1);  /* receipt feed */
  --d-fast:160ms; --d-base:320ms; --d-slow:640ms; --d-print:2600ms;
}
@media (prefers-reduced-motion:reduce){:root{--d-base:1ms;--d-slow:1ms;--d-print:1ms}}
```

## FD-5. Filled blanks — behaviour decisions (all **DEFAULT**, overrule freely)

**FD-5.1 The nine aesthetics (ring order, clockwise from the front slot):** 01 STREETWEAR · 02 OLD MONEY · 03 GOTH · 04 Y2K · 05 TECHWEAR · 06 QUIET LUXURY · 07 COQUETTE · 08 GRUNGE · 09 MINIMALIST. (Casual, Vintage, Formal live in the GRID view's extra tabs — see 5.3.) Each look = 1 model cut-out + 3 pieces (top/bottom/shoes or equivalent). The video's two-word look names (DIAL-UP, LONG WALKS) become the aesthetic name + a poetic sub-name kept for detail pages, e.g. `03 GOTH — "Midnight Shift"`.

**FD-5.2 RING/GRID toggle (right edge):** RING = home. GRID = a clean 3×3 contact sheet of the nine looks (cut-outs on `--white` cells, 1 px `--hair` dividers, name + number in mono under each, hover lifts figure 6 px, no colour change). Switch animation: figures fly from ring positions into grid cells (FLIP, 600 ms `--ease-io`). GRID is a bottom-sheet on mobile (FD-6) and the no-JS-motion fallback.

**FD-5.3 LOOKS side tab (left edge):** opens a slim left drawer (320 px, `--white`, hairline border) listing all aesthetics (01–12 incl. the three extra) as mono rows with a tiny cut-out; click rotates the ring to that look (or opens it if not on ring). Close with Esc / outside click.

**FD-5.4 Autoplay ▶ next to "03 / 09":** toggles ring rotation (default **on**, ~10°/s). Pauses automatically on: figure hover, drag, tab hidden, `prefers-reduced-motion` (starts paused). State persisted for the session.

**FD-5.5 SHOP THIS FIT +:** adds all three pieces of the active look to the bag with the whole-fit −10 % applied, the BAG counter increments with a digit-roll, and a transient mono toast `+3 ITEMS — WHOLE FIT −10%` appears beside the pill (3 s). It does **not** navigate. Clicking `BAG (n)` opens the cart page.

**FD-5.6 Item pills (bottom bar):** hover = pill fills black/white text; click = open that item in the detail view with its hotspot pre-activated.

**FD-5.7 Cart open questions → decided:** (a) **No chips** in the cart. The handwritten hint is replaced by a Caveat line `tear along the dotted line ↓` above the checkout bar (decorative). (b) **Line-by-line print** on add (120 ms per line, 1 s cap, paper extends); first page load uses the full 2.6 s feed. (c) **Full page** (already decided). (d) The cart page also shows a **"COMPLETE THE LOOK"** strip beneath the paper: up to 3 cut-outs of missing pieces from looks already in the bag (monochrome frame, natural-colour garments, dashed pill CTA `+ ADD`).

**FD-5.8 Checkout path:** CART → `CHECKOUT →` bar → single-page checkout styled as a *second receipt* (shipping form fields as printed lines with dotted underlines) → payment (provider-hosted fields) → order confirmation receipt with the barcode = order id and `THANKS FOR GOING NOWHERE.` Only the cart receipt is in scope for now; checkout is flagged as a later part (do not build yet).

**FD-5.9 Headline behaviour:** `NO MORE BLIND SHOPPING` is static display type (not a link). Entrance: line-mask reveal 0.9 s, 80 ms stagger. On hovering a ring figure it does **not** move. On rotation it stays fixed. Optional (RECOMMENDED, subtle): the word `BLIND` gets a 1 px `--ink` strike-through that draws left→right once, 1.2 s after load, then fades — the only decorative flourish on the headline. Colour is always `--pink`.

**FD-5.10 Page transitions:** ring ↔ detail: FLIP (video-faithful). Any route change: 240 ms cross-fade, header chrome persists (view-transition API where supported, fallback to fade).

**FD-5.11 Home intro (first visit, ≤ 2 s, skippable):** black → white wipe from the left; wordmark `NOWHERE©` types in mono; figures drop in one by one along the ellipse (60 ms stagger, 500 ms `--ease-out`), headline mask-reveals. Not shown again in the session; skipped under reduced motion.

## FD-6. Responsive specification

| Breakpoint | Layout |
|---|---|
| **≥ 1280 px (desktop)** | Ring on the left: centre x 36 %, rx 24 vw (capped 380 px), ry 0.7·rx; headline block right (x 56–97 %), 4 lines right-aligned; chrome as in §2. |
| **1024–1279 px** | Same, headline `--t-hero` clamps down; BAG pill and status strip lose the battery/QR items. |
| **768–1023 px (tablet)** | Ring centred below; headline stays **right-aligned**, set at the top-right in 2 lines (`NO MORE / BLIND SHOPPING`); bottom bar pills collapse to a horizontal scroller. |
| **< 768 px (mobile)** | **Ring stays the hero, drawn as a half-ellipse** — ring shown as a front-facing arc (only the front 5 figures visible, back 4 hidden, scale 0.5–1) beneath the headline (4 lines, right-aligned, `--t-hero` ≈ 18 vw). Horizontal swipe rotates the ring; GRID toggle is a bottom-sheet. Bottom bar: counter + name left, `SHOP +` circle right; item pills in a swipeable row above. Status strip, QR, side tab hidden. Cart: receipt paper 88 vw. |
| **Touch** | No custom cursor follower; "DRAG" hint appears as a one-time pill `SWIPE ↔` for 3 s; tap a figure = open (no hover state); hotspots 44×44 px hit areas. |
| **Landscape phones** | Reduce vertical chrome; ring ry 0.55·rx. |

(DEFAULT: mobile ring = front arc. Chosen because a full ellipse at 375 px wide makes figures ~40 px tall and unreadable.)

## FD-7. Tech stack & architecture (DEFAULT)

- **Framework:** Next.js (App Router) + TypeScript; RSC for static content, client islands for ring/cart/3D.
- **Styling:** CSS variables from FD-3/4 + Tailwind (utility layer) or CSS Modules; no CSS-in-JS runtime.
- **Motion:** GSAP (ring orbit, FLIP, receipt feed) **or** Framer Motion + `requestAnimationFrame` for the orbit. Use one library, not both. WAAPI/CSS for micro-interactions.
- **State:** Zustand (`bag`, `ui`, `ring`, `fit`), persisted bag in `localStorage` (try/catch), cart total computed, never stored.
- **3D:** React Three Fiber + drei, lazy-loaded route-segment (`/fit-check`), see Part B.
- **Data:** `looks.json` / headless CMS later; images from a CDN with AVIF/WebP.
- **Testing:** Vitest + Testing Library (cart maths, ring geometry), Playwright (ring→detail→cart flow, keyboard path), axe-core in CI, Lighthouse CI budget.

```
app/
  (shop)/page.tsx                 // home: <Ring/> + <Headline/>
  (shop)/look/[slug]/page.tsx     // detail (also intercepted as overlay from ring)
  (shop)/cart/page.tsx            // printing receipt
  (shop)/fit-check/page.tsx       // 3D fitting room (lazy)
components/
  chrome/ TopBar BackButton StatusStrip BagPill SideTab ViewToggle
  ring/   Ring LookFigure EllipseGuide Orbit(useOrbit) BottomBar ItemPill CursorFollower
  look/   LookDetail Hotspot HotspotLabel Receipt(Panel)
  cart/   Printer ReceiptPaper ReceiptLine TearEdge Barcode StatusLed CompleteTheLook
  fit/    …(Part B VF-12)
  ui/     DashedPill CircleButton MonoLabel Toast Drawer
lib/ ring-math.ts  fit.ts  format-money.ts  motion.ts  capabilities.ts
styles/ tokens.css  base.css
data/ looks.json
```

**Data model:**
```ts
type Item  = { id:string; name:string; role:'top'|'bottom'|'shoes'|'outer'|'accessory'; price:number; thumb:string; cutout:string;
               hotspot:{x:number;y:number}; sizes:string[]; sizeChart?:Record<string,Record<string,number>>; fitAsset?:string };
type Look  = { id:string; index:number; aesthetic:string; subtitle:string; model:string /*cut-out*/; items:[Item,Item,Item] };
```
**Ring math (updated for the right-hand headline):** `θ_i = base + i·40°`; `x = cx + rx·sin θ`; `y = cy − ry·cos θ`; `scale = 0.55 + 0.45·(1+cos(θ−180°))/2`; `z = round(scale·100)`; active = figure with `θ` nearest 180°. `cx = 0.36·W`, `cy = 0.50·H`.

## FD-8. Routing & state map

`/` ring · `/look/[slug]` detail (soft-navigated with FLIP from ring; direct hit renders standalone) · `/cart` · `/fit-check?look=&item=` · (later) `/checkout`. Browser Back always restores ring state (`activeIndex`, rotation, autoplay) from the store.

## FD-9. Accessibility (WCAG 2.1 AA target)

- Ring = `role="listbox"`-style carousel with `aria-roledescription="carousel"`; each figure is a `<button>` with `aria-label="03 of 09, Goth, 3 items from $…"`. **Arrow keys** rotate; `Enter` opens; `Space` toggles autoplay; `Esc` closes detail; `Tab` order: top bar → ring (single tab stop) → bottom bar → side controls.
- A visually hidden **list view** of the nine looks (real links) exists for screen readers and no-JS.
- `aria-live="polite"` announces the active look when it changes (debounced 600 ms; not during autoplay unless focused).
- Moving content: autoplay can be paused (WCAG 2.2.2); pauses on focus/hover; off under reduced motion.
- Headline is a real `<h1>` with the exact text (`NO MORE BLIND SHOPPING`); the line-mask animation wraps words in spans with `aria-hidden` duplicates avoided (animate the originals).
- Images: cut-outs `alt="{aesthetic} look: {top}, {bottom}, {shoes}"`; decorative shadows/QR/barcode `alt=""`/`aria-hidden`.
- Hotspots: buttons with the item name; focus = pill expands; list of items also in the receipt (non-visual path).
- Cart: receipt is semantic (`<ul>` of lines, quantity `<input type=number>` or steppers with labels), total in `aria-live`.
- Touch targets ≥ 44 px; focus ring per FD-3; pink text rules per contrast table.

## FD-10. Loading, empty and error states

- **Ring loading:** first paint shows the title/headline + hairline ellipse; figures fade in as their cut-outs decode (`<img decoding="async">` with `fetchpriority="high"` only for the three front-most; others `loading="eager"` but low priority). Placeholder = 1 px dashed circle at each slot (no spinners).
- **Image error:** dashed-outline silhouette + mono `IMAGE UNAVAILABLE`.
- **Empty bag:** `NOTHING HERE YET.` printed on a blank stub, `START SHOPPING →`.
- **Offline/API failure:** receipt prints `ERR — PAPER JAM`, LED blinks, `RETRY` dashed pill.
- **3D unsupported:** per VF-11.

## FD-11. Performance budget

| Metric | Target |
|---|---|
| LCP (home) | ≤ 2.5 s on 4G mid phone (headline text is the LCP element — keep it text, not an image) |
| CLS | < 0.05 (reserve ring/hero boxes with `aspect-ratio`) |
| INP | < 200 ms |
| JS, home route | ≤ 170 KB gz (R3F/three only in `/fit-check`) |
| Images | each ring cut-out ≤ 90 KB (WebP/AVIF, 600 px tall for ring, 1600 px for detail); `srcset`/`sizes`; fonts ≤ 5 files, ≤ 120 KB total |
| Animation | transform/opacity only; ring updates via one rAF loop writing `style.transform`; `will-change` only on moving figures; pause when off-screen/tab hidden |

## FD-12. Fit Check in the new theme

Dark studio: `--ink` background with a faint white radial floor spot; avatar on a soft round contact shadow; UI in white with dashed outlines (same pill language); controls bottom-centre as dashed pills; fit heatmap colours (red/blue per Part B) are **data colours, not brand colours** and are allowed inside the garment overlay only. "ESTIMATE" tag and recommended-size text in `--pink`. Garment keeps its real colour (the avatar wears the product as photographed — no monochrome shading).

## FD-13. Aesthetic details — the "make it beautiful" checklist [RECOMMENDED]

1. **Paper grain** overlay (SVG noise, 3 % opacity, `mix-blend-mode: multiply`) on white page background only — never over photos (keeps clothing colour pure; apply on a layer *behind* the figures).
2. **Hairline ring** with 9 tick marks and a tiny rotating index number at the front slot (`03`) in mono.
3. **Ticker strip** (optional, home bottom edge or cart footer): `NO MORE BLIND SHOPPING ✺ FIT FIRST ✺ …` mono 10 px, 20 s linear loop; pauses under reduced motion; hairline top border.
4. **Cursor follower** per §5 but with a 1 px `--ink` dashed ring and `mix-blend-mode:difference` **disabled** (avoid altering photo colours).
5. **Hover on a ring figure:** figure lifts 8 px with a deeper contact shadow and neighbours dim to 55 % opacity (opacity only, no desaturation).
6. **Receipt micro-details:** perforation dots along left/right paper edges, a printed timestamp, tiny `★ ★ ★` row, barcode digits under the bars, subtle paper texture, a 2 px shadow gradient under the slot lip.
7. **Number roll** for BAG counter and totals (translateY slot-machine, 300 ms).
8. **Sound:** none by default; optional `PRINT` thermal-printer tick (≤ 30 KB), off unless the user toggles `SOUND` in the status strip. (Audio not part of either reference.)
9. **Scroll-less home:** the home page does not scroll; a footer (shipping, returns, size guide, contact, socials) lives in the `LOOKS` drawer and on `/info`.
10. **Selection colour** = black on pink text (FD-3) for a signature detail.

## FD-14. Build order

1. Tokens, fonts, base + chrome (TopBar, pills, buttons).
2. Static ring layout with real geometry + headline; then orbit, drag, active-slot logic.
3. Bottom bar, item pills, counter, autoplay.
4. Look detail (FLIP), hotspots, receipt panel, bag store.
5. Cart page + printer animation + line-by-line printing.
6. GRID view, LOOKS drawer, responsive/touch variants.
7. Accessibility pass (keyboard, SR, reduced motion) + performance pass.
8. Fit Check Phase 1 → 4 (Part B).
9. Checkout (later).

## FD-15. Remaining truly-open items

1. Exact neon pink hex (default `#FF2E93`) and font licences (all defaults are open-licence).
2. Real photography: the nine top-down cut-outs, three pieces each, plus the 3D garment assets.
3. Whether the home stays white (video-faithful, default) or goes fully black.
4. Backend: catalogue, inventory, payments, size charts — none specified.
5. Brand name (reference uses NOWHERE©) and copy for the sub-lines.
