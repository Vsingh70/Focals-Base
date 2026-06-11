# Guide: the scroll-through (scrollytelling) section

> **For Claude Code.** This explains how the "Apple-style" scroll animation on the Lenslate landing pages works, why your port is **stacking the screens in a column and ignoring scroll**, and gives you drop-in files to fix it.
>
> **Your symptom → the cause:** if Projects, Project-detail, and Finances all render **stacked vertically and don't react to scroll**, you are missing the *pinned track/stage structure*. The screens are rendering in normal document flow instead of being **overlaid in one sticky stage and swapped by scroll position**. Fix = the four non-negotiables in §2.

---

## 1. The mental model

It is **four parts**, nothing more:

```
TRACK   ── a TALL element (height = N chapters × ~90vh). position: relative.
 └ STAGE ── position: sticky; top:0; height:100vh.  ← this is what "pins"
    └ LAYERS ── every chapter overlaid in the SAME box (absolute), opacity-swapped.
       └ DRIVER ── scroll position → progress 0..1 → active index → toggle a class.
```

- The **track** is tall, so there's scroll distance to consume. Its height controls how long the effect lasts.
- The **stage** is `sticky` and exactly `100vh`, so it stays glued in the viewport while the tall track scrolls past behind it. **This is the pin.**
- The **layers** (chapters/screens) are stacked on top of each other with `position: absolute` so the hidden ones occupy **zero vertical space**. Only `opacity` changes. *(If you skip this, they stack into a column — your exact bug.)*
- The **driver** is a scroll listener that computes how far the track has moved through the viewport (0→1), multiplies by N, `floor()`s it, and toggles `.is-active`.

There is **no scroll-snapping, no IntersectionObserver, no animation library** required. Just `position: sticky` + one scroll handler.

---

## 2. The four non-negotiables (this is what you're missing)

1. **A tall track wraps a sticky stage.** Not one section per screen — *one* sticky stage inside *one* tall track.
   ```jsx
   <div style={{ position: 'relative', height: `${n * 90}vh` }}>   {/* TRACK */}
     <div style={{ position: 'sticky', top: 0, height: '100vh' }}> {/* STAGE */}
       …layers…
     </div>
   </div>
   ```

2. **Chapters are overlaid, not flowed.** First child `position: relative` (gives the box its height); every other child `position: absolute; inset: 0`. Toggle `opacity`, never mount/unmount.
   ```
   ✗ WRONG: three <section>s in flow → they stack in a column (your bug).
   ✓ RIGHT: three layers in one box, absolutely positioned, opacity 0/1.
   ```

3. **No `overflow` on any ancestor.** `position: sticky` is **silently disabled** if *any* ancestor between the stage and the scroll root has `overflow: hidden | auto | scroll` — and that **includes `overflow-x: hidden`** on a wrapper `<div>`. This is the single most common reason sticky "does nothing."
   - `overflow-x: hidden` on the root `<html>`/`<body>` is fine (browsers special-case the document element).
   - `overflow-x: hidden` on a `.page-wrapper`/`.container` around the track is **fatal**. Remove it, or move the clip to `<body>`. To stop horizontal scroll without breaking sticky, prefer `html, body { overflow-x: clip }` (modern) or constrain widths instead.

4. **The scroll handler runs on the client.** In Next.js the component must be a **Client Component** (`'use client'`), and the listener must live in `useEffect`. A Server Component renders the markup but **never wires the scroll**, so it stacks and never reacts — another way to hit your exact symptom.

---

## 3. Drop-in files (Next.js App Router)

Three files in this bundle, ready to copy into the app:

| File | Put it at | What it is |
|---|---|---|
| `useScrollProgress.ts` | `src/lib/useScrollProgress.ts` | the scroll→0..1 hook (rAF-throttled, passive) |
| `Scrollytelling.tsx` | `src/components/marketing/Scrollytelling.tsx` | the pinned component (layout-critical styles inline) |
| `scrollytelling.css` | next to the component, or globals | cosmetic + responsive + reduced-motion |

> Layout-critical rules (track height, sticky, absolute overlay) are **inline in the component on purpose**, so a missing or overridden CSS file can never reintroduce the stacking bug. The CSS file is only cosmetics + the responsive stack.

### Wire it up

```tsx
'use client';
import { Scrollytelling } from '@/components/marketing/Scrollytelling';
import '@/components/marketing/scrollytelling.css';
import { ProjectsMock, DetailMock, FinancesMock } from './mocks'; // your device visuals

export function HowItWorks() {
  return (
    <Scrollytelling
      side="right"          // device on the right (use "left" for the web page)
      deviceWidth={300}
      vhPerChapter={90}     // higher = slower swaps
      chapters={[
        { eyebrow: 'Projects', title: 'Your pipeline, grouped.',
          body: 'Every shoot in one status pipeline…',
          points: ['Cards show client, balance, and date', 'Filter by phase in a tap'],
          render: () => <ProjectsMock /> },
        { eyebrow: 'A project, in full', title: 'Open one. See everything.',
          body: 'Shoot, balance, and paid — surfaced up top…',
          render: () => <DetailMock /> },
        { eyebrow: 'Finances', title: 'Know your numbers.',
          body: 'Revenue, outstanding balances, every transaction…',
          render: () => <FinancesMock /> },
      ]}
    />
  );
}
```

The `render` functions return your existing phone/browser mockups — the component is visual-agnostic; it only pins and swaps.

> **iOS page** uses `side="right"` with phone mockups. **Web page** uses `side="left"` with a browser-window mockup and a wider device (e.g. `deviceWidth={500}` / `"min(46vw,500px)"`). Everything else is identical.

---

## 4. See it work first: `Scrollytelling Demo.html`

A **self-contained, dependency-free** reference is in this bundle. Open it in a browser and scroll — one stage stays pinned while three screens swap, forward and reverse. It's the same mechanic in ~40 lines of vanilla JS (see the bottom `<script>`), with the four non-negotiables annotated in the CSS. **Diff your implementation against it** — if the demo works and yours doesn't, you've broken one of the four rules in §2 (almost always #3, an `overflow` ancestor, or #4, a Server Component).

---

## 5. Debug checklist (in order)

Run these against your build; each maps to a non-negotiable:

1. **Is the stage actually sticky?**
   `getComputedStyle(document.querySelector('.scrolly-stage')).position` → must be `"sticky"`. If it's `sticky` but doesn't pin, an ancestor has `overflow` (rule #3).
2. **Find the overflow killer:** walk up from the stage —
   ```js
   let el = document.querySelector('.scrolly-stage');
   while (el) { const o = getComputedStyle(el);
     if (/(auto|scroll|hidden)/.test(o.overflow + o.overflowX + o.overflowY))
       console.log('overflow ancestor →', el, o.overflow, o.overflowX, o.overflowY);
     el = el.parentElement; }
   ```
   Any hit (other than the root `<html>`/`<body>`) is breaking sticky. Remove/replace it.
3. **Is the track tall?** The track's height should be ~`N × 90vh` (e.g. 3 chapters ≈ 270vh). If it's `auto`/short, there's no scroll distance and nothing swaps.
4. **Are chapters overlaid?** All chapters after the first must be `position: absolute`. If they read `static`/`relative`, you'll see the column-stack bug.
5. **Is it a Client Component?** The file must start with `'use client'` and the listener must be inside `useEffect`. Log inside the handler — if it never fires on scroll, this is why (rule #4).
6. **Progress sane?** Log `progress` from the hook while scrolling — it must sweep `0 → 1` across the section. Stuck at `0` → track too short or `total <= 0`.

---

## 6. Tuning

- **Speed of swaps:** `vhPerChapter` (default 90). 70 = snappier, 120 = more dwell time per screen.
- **Crossfade feel:** the `.scrolly-screen` / `.scrolly-chapter` transitions in the CSS (opacity .5s, slight scale/translate). Keep them ≤ .6s so they finish before the next swap.
- **Mobile:** under 1024px the CSS stacks copy above device and hides the dots; the pin still works. If you'd rather drop the pin entirely on small screens, render the chapters as plain stacked cards below that breakpoint.
- **Reduced motion:** the CSS already removes the swap transitions under `prefers-reduced-motion`. Content still toggles, just without the fade.

---

## 7. Files in this bundle
- `README.md` — this guide.
- `Scrollytelling Demo.html` — open-and-scroll working reference (vanilla, self-contained).
- `Scrollytelling.tsx` — drop-in Next.js Client Component.
- `useScrollProgress.ts` — the scroll→progress hook.
- `scrollytelling.css` — cosmetic + responsive + reduced-motion styles.
