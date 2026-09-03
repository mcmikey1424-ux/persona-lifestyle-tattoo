# PERSONA Lifestyle Tattoo — PROJECT MEMORY

Audience: the next session. Decisions and *why*, gotchas, measured values, outstanding work.
Repo `mcmikey1424-ux/persona-lifestyle-tattoo` · branch `master` · local `Documents/PersonaLifestyle/`

---

## What this is

Static site. `index.html` + `css/style.css` + `js/main.js`. **No package.json, no build step.**
Three.js 0.152.2, GSAP 3.12.5 + ScrollTrigger, and Lenis 1.1.13 all load from jsDelivr, so the
page needs network even locally.

**Cache-busting is manual.** Both `css/style.css?v=N` and `js/main.js?v=N` in `index.html` must
be bumped together on every change, or returning visitors keep the old file. Currently `v=178`.

### Running it locally

Any static server over the project root. There is no dev server in the repo — `.claude/` is
gitignored and holds a small node static server plus a `launch.json` for the Claude Code
preview. Port 5173 is usually taken by the ZenConstruction dev server on this machine, so the
preview config uses `autoPort`.

---

## The hero portrait system (the fiddly part)

A fixed layer `#orbit` holds one `<img id="orbitImgA">` that crossfades between six cutouts
every 5s, inside a 3D text ring (`.orbit__tilt` → `.orbit__ring`, radius `--orbR: 330px`).

`PORTRAIT_LIST` rows are `[file, vh, NAME, @handle, dx]`.

**`vh` equalizes FACE scale, not image height.** Each artist was photographed at a different
distance, so a uniform height makes some faces much larger than others. The per-portrait values
(95.5 / 88.6 / 89.6 / 98.5 / 87 / 88.5) are the tuned balance. **Do not flatten them to one
number** — that was done once (`5c305c6`) and made the friends read 7–13% larger than Alfrey.
Resize all six together with `PORTRAIT_SCALE` instead; it preserves the ratios.

**`dx` centres the HEAD, not the image box.** Measured off each alpha silhouette, as a percent
of that cutout's own width (so it survives any size or viewport):

| | head offset from its image centre | dx |
|---|---|---|
| Alfrey | +0.1% (already centred) | 0 |
| Emelyn | +14.0% right | −14 |
| Breanna | −0.5% | 0 |
| Jared | −9.4% left | +9.4 |
| Bernice | −6.4% left | +6.4 |
| Jae | −5.0% left | +5 |

Centring the *box* leaves the person visibly off-centre, and pushes the two widest cutouts
(Alfrey 0.932, Jared 0.935 aspect — everyone else is 0.65–0.76) into the hero tagline.

### The trap: inline style beats a media query

`applyPortraitBox()` writes `height` **inline**. The `@media (max-width: 900px)` rule that drops
portraits to `73vh` therefore has no effect once a swap happens — the portraits silently jumped
~31% oversized on narrow windows. The narrow factor is now folded into `portraitScale()`
(`73 / 95.5`), and a debounced `resize` listener re-applies it. **Anything else that writes an
inline style here must fold in the narrow factor too.**

Note: CDP/devtools viewport emulation does **not** dispatch `resize` or `matchMedia` change
events to the page, so this path cannot be verified by resizing an automated browser — the
inline value looks stale when it is not. Dispatch a real `resize` event to test it.

### Current tuned values (set by JMStudio 2026-09-04)

`PORTRAIT_SCALE 0.75` · `RING_Y 35` · `--drop 11vh` (all six dropped equally below dead-centre).
Vertical centring lives in CSS; JS owns only size and `--dx`.

---

## Measured, so nobody re-derives it

Cutouts are near-full-bleed: the subject fills ~99.7% of each canvas, top padding under 1%. The
BiRefNet re-matting (`31084cc`) preserved framing exactly — only Jared's *width* changed
(874→823), which does not affect height-based sizing. Alpha carries a lot of semi-transparent
matting residue, so silhouette measurement needs a **threshold of ~200 with a minimum run**, not
`alpha > 0`.

Clearances at 1472×922, left of the hero tagline / right of the showreel card:
Alfrey −33/156 · Emelyn 19/322 · Breanna 53/253 · Jared 23/86 · Bernice 87/214 · Jae 96/257

---

## Outstanding

- **Alfrey's shoulder overlaps the hero tagline by ~33px.** It lands in the mask's fade zone
  (≤62% opacity) so it reads as a soft shadow, and it cannot be nudged away now that position
  follows the head. Fixes: shrink him ~5% alone, or move the tagline. Left as a judgement call.
- **The ring's far arc draws in front of the body** instead of passing behind it. Long-standing,
  not a regression. A proper fix is 3D depth-sorting between `.orbit__img` and the ring chars.
- **No README.** Setup/structure/deploy are undocumented outside this file.
- The `[ SHOWREEL ]` / NOW HIRING card and tunnel sections were not touched this session.
