# Guide: responsive landing pages + scalable app mockups

> **For Claude Code.** This fixes two things on the Lenslate landing pages (`Lenslate iOS.html`, `Lenslate Web.html`):
> 1. **The web "animation" window was too small and its dashboard looked cramped** (columns squeezed, paddings oversized).
> 2. **Both pages weren't responsive on mobile** (mockups overflowed / squished).
>
> Both have the **same root cause and the same fix**, explained below. Drop-in files are included.

---

## 1. Root cause: app mockups were *reflowing* instead of *scaling*

An app UI — a desktop dashboard, a phone screen — is designed for **one width** (a dashboard ≈ 900px; a phone ≈ 390px). The landing pages were dropping those UIs into marketing frames of arbitrary width and letting them **reflow**:

- In the web scrollytelling the browser frame was only ~460px wide, so a 900px-class dashboard got crushed — table columns collided, the 196px sidebar ate half the width, paddings looked huge. *That's the "spacing issue."*
- On mobile, a fixed-width phone (356px) sat in a ~320px viewport and **overflowed horizontally**.

**The fix:** never reflow an app mock to fit. **Render it once at its true design size and scale the whole thing** like a screenshot. Proportions and spacing stay perfect at any size, and it can't overflow because the wrapper is capped at 100% of its container.

That's what `ScaledCanvas` does (file included):

```
containerWidth measured → scale = min(maxScale, containerWidth / designWidth)
→ CSS transform: scale(...) on a fixed designWidth×designHeight box
→ reserve designHeight*scale so layout doesn't jump
```

Transformed DOM text re-rasterizes, so it stays **crisp** whether scaled down (mobile/scrolly) or up (large hero). `maxScale = 1` for phones (never upscale); `maxScale ≈ 1.45` for the browser so it can fill a big hero crisply.

---

## 2. Drop-in files (Next.js, App Router)

| File | Put it at | What |
|---|---|---|
| `ScaledCanvas.tsx` | `src/components/marketing/ScaledCanvas.tsx` | the measure-and-scale primitive (Client Component) |
| `DeviceFrames.tsx` | `src/components/marketing/DeviceFrames.tsx` | `PhoneFrame` + `BrowserFrame`, both built on `ScaledCanvas` |
| `landing-responsive.css` | with your landing styles | the page-shell breakpoints (see §4) |

Usage:

```tsx
import { PhoneFrame, BrowserFrame } from '@/components/marketing/DeviceFrames';

// iOS page — phone, scales down on mobile, never upscales past 356
<PhoneFrame designWidth={356}><ProjectsScreen /></PhoneFrame>

// Web page — dashboard renders at 920×440 and scales to the frame
<BrowserFrame designWidth={920} designHeight={440}><Dashboard /></BrowserFrame>
```

**Your app mock must fill its design box:** root element `height: 100%`, and inner scroll areas `overflow: hidden` so nothing spills past `designHeight`.

---

## 3. Fixing the web "animation" window size + spacing

Two changes on the web page:

**a) Make the window bigger.** In the hero and the scrollytelling, the browser frame was undersized. New values:

- **Hero:** container `max-width: 1060px`; `<BrowserFrame designWidth={920} designHeight={440} maxWidth={1060} />`. At ~1060px the dashboard scales to ~1.15× — large and crisp.
- **Scrollytelling:** device column width `min(54vw, 660px)` (was `min(46vw, 500px)`); `<BrowserFrame designWidth={920} designHeight={440} glow={false} />`. Keep `deviceWidth + copyWidth + gap < 1180` so the desktop row never overflows (660 + 400 + ~70 = 1130 ✓).

**b) Let spacing come from the design, not the frame.** Because the dashboard now always renders at 920px and scales, its internal spacing is correct everywhere — you do **not** tweak its paddings per breakpoint. Two small mock hygiene fixes that were needed: give the header's count badge and the "New project" button `white-space: nowrap` + `flex-shrink: 0` so they don't wrap at the design width.

> Want it even bigger? Raise `designWidth`/`maxWidth` together. Raising only the frame width (old approach) just stretches columns — raise the *design* and let it scale.

---

## 4. Fixing mobile responsiveness (both pages)

The page **shell** is already fluid (max-width container + `clamp()` typography). Only a few things needed explicit handling — all in `landing-responsive.css`:

- **≤1024px** — the scrollytelling stacks (copy above device); **widen the pinned device to `min(88vw, 460px)`** so the scaled mock stays legible (it was using the narrow desktop column width). Hide the side progress dots.
- **≤860px** — hide/condense secondary nav; feature grid 3→2; footer 4→2; hero CTAs stack; section-title+lead grid collapses to one column.
- **≤640px** — section padding 24→18px; tighter hero top padding; feature grid →1 column; trust strip wraps tighter.

**Critical:** there is **no media query that resizes the phone/browser mockups.** `ScaledCanvas` handles them structurally (width 100%, capped, scales down). Hand-resizing mocks per breakpoint is exactly what caused the original cramping — don't reintroduce it.

### Verify mobile
At 360–390px viewport width, on **both** pages:
- [ ] `document.body.scrollWidth - document.body.clientWidth === 0` (no horizontal scroll).
- [ ] Hero phone/dashboard sits fully inside the viewport, scaled down, not clipped.
- [ ] Scrollytelling stacks; the device is large enough to read.
- [ ] Feature grid is a single column; nav doesn't crowd; CTAs stack full-width.
- [ ] Tap targets ≥ 44px.

---

## 5. Reference implementation (the working pages)

Included so you can diff against a known-good build:
- `Lenslate Web.html`, `Lenslate iOS.html` — the live pages with all the above applied.
- `landing-shared.jsx` — contains the canonical `ScaledCanvas`, `PhoneFrame`, `BrowserFrame` (vanilla-React form of the TSX files here).
- `landing-mocks.jsx` — the app mock screens (`WebDashboard`, `MockProjects`, etc.) showing the `height: 100%` + `overflow: hidden` fill pattern and the nowrap header fixes.

> These HTML files use in-browser Babel + `Object.assign(window, …)` exports because they're standalone artifacts. In the real Next app, use the `.tsx` files in this bundle instead — same logic, proper modules.

---

## 6. Files in this bundle
- `README.md` — this guide.
- `ScaledCanvas.tsx` — the scale-to-fit primitive.
- `DeviceFrames.tsx` — `PhoneFrame` + `BrowserFrame`.
- `landing-responsive.css` — page-shell breakpoints.
- `Lenslate Web.html`, `Lenslate iOS.html`, `landing-shared.jsx`, `landing-mocks.jsx` — working reference.
