/* PERSONA LIFESTYLE TATTOO — motion system */
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Text scramble on hover ---------- */
const GLYPHS = "▪▮/\\|<>*#01";
document.querySelectorAll("[data-scramble]").forEach((el) => {
  const original = el.textContent;
  let frame = 0, raf = null;
  el.addEventListener("mouseenter", () => {
    cancelAnimationFrame(raf);
    frame = 0;
    const tick = () => {
      frame++;
      const reveal = Math.floor((frame / 14) * original.length);
      el.textContent = original
        .split("")
        .map((c, i) => {
          if (c === " " || i < reveal) return c;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      if (reveal < original.length) raf = requestAnimationFrame(tick);
      else el.textContent = original;
    };
    tick();
  });
});

/* ---------- Split helpers ---------- */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="gw">${w}</span>`).join(" ");
  return el.querySelectorAll(".gw");
}

/* ---------- 3D char tumble: signature typography reveal ---------- */
function splitTumble(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.classList.add("t3d");
  el.innerHTML = words
    .map(
      (w) =>
        `<span class="tw">` +
        w.split("").map((c) => `<span class="tch">${c}</span>`).join("") +
        `</span>`
    )
    .join(" ");
  return el.querySelectorAll(".tch");
}

function tumbleIn(el, { scrub = false } = {}) {
  const chars = splitTumble(el);
  const from = { rotationX: -90, yPercent: 60, opacity: 0 };
  const to = {
    rotationX: 0, yPercent: 0, opacity: 1,
    stagger: 0.022,
    duration: 0.9,
    ease: "power3.out",
  };
  to.scrollTrigger = scrub
    ? { trigger: el, start: "top 85%", end: "top 40%", scrub: 0.5 }
    : { trigger: el, start: "top 85%", toggleActions: "play none none reverse" };
  if (scrub) { to.ease = "power1.out"; }
  gsap.fromTo(chars, from, to);
}

/* ---------- Scroll text: per-word 3D scale-up ----------
   Each word scrubs from small/tilted/deep to flat as it crosses the
   viewport; words complete one after another (sequential stagger). */
function scaleUpText(el, opts = {}) {
  const words = splitWords(el);
  el.classList.add("su3d");
  gsap.fromTo(
    words,
    {
      opacity: 0.2,
      scale: 0.8,
      x: -36,
      rotationY: 38,
      z: -100,
      transformOrigin: "0% 100%", /* left-hinged: words swing in from the left */
      textShadow: "0 8px 22px rgba(0,0,0,0.12)",
    },
    {
      opacity: 1,
      scale: 1,
      x: 0,
      rotationY: 0,
      z: 0,
      textShadow: "0 4px 15px rgba(0,0,0,0)",
      ease: "none",
      duration: 1.6, /* long per-word travel so the reveal feels unhurried */
      stagger: 0.35,
      scrollTrigger: {
        /* reveal spans nearly the text's whole trip up the viewport */
        trigger: el,
        start: opts.start || "top 95%",
        end: opts.end || "bottom 12%",
        scrub: 1,
      },
    }
  );
}

/* ---------- Preloader ---------- */
const pre = document.getElementById("preloader");
const introTl = gsap.timeline();
introTl
  .to(".preloader__bar span", { scaleX: 1, duration: 0.9, ease: "power2.inOut" })
  .to(pre, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "+=0.15")
  .set(pre, { display: "none" })
  /* wordmark letters: masked rise + blur, staggered (reference behavior) */
  .fromTo(
    ".hero__word .hl",
    { yPercent: 105, opacity: 0, filter: "blur(10px)" },
    {
      yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.05, stagger: 0.07, ease: "power4.out",
      /* drop the filter layers afterwards so the scaling wordmark
         rasterizes as one clean surface (prevents shimmer/flicker) */
      onComplete: () => gsap.set(".hero__word .hl", { clearProps: "filter,willChange" }),
    },
    "-=0.45"
  )
  /* tagline: per-word masked rise + blur */
  .fromTo(
    "#heroTagline .tg",
    { yPercent: 120, opacity: 0.1, filter: "blur(6px)" },
    { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.055, ease: "power3.out" },
    "-=0.75"
  )
  /* mono paragraph: masked line rise */
  .fromTo(
    "#heroMono .line",
    { yPercent: 110 },
    { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" },
    "-=0.6"
  )
  .to("#heroHint", { opacity: 1, duration: 0.6 }, "-=0.3");

/* ---------- Hero shrink into nav ---------- */
const heroWord = document.getElementById("heroWord");
const navLogo = document.getElementById("navLogo");

function heroScale() {
  return navLogo.getBoundingClientRect().width / heroWord.getBoundingClientRect().width || 0.1;
}

gsap.timeline({
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    end: "72% top",
    scrub: 0.7,
    invalidateOnRefresh: true,
  },
})
  .to(heroWord, { scale: () => heroScale(), top: 20, ease: "power1.inOut", force3D: true }, 0)
  .to("#heroTagline", { scale: 0.6, opacity: 0, yPercent: -40, ease: "none" }, 0)
  .to("#heroHint", { opacity: 0, ease: "none", duration: 0.25 }, 0)
  .to("#heroMono", { opacity: 0, yPercent: -60, ease: "none" }, 0);

/* Nav links appear once the morph completes. The fixed morphing wordmark
   itself stays as the permanent logo (no swap — no end-of-shrink flicker);
   the invisible #navLogo only serves as the size/position target. */
ScrollTrigger.create({
  trigger: "#hero",
  start: "74% top",
  onEnter: () => {
    gsap.to(".nav__link", {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.55,
      stagger: 0.07,
    });
  },
  onLeaveBack: () => {
    gsap.to(".nav__link", { opacity: 0, filter: "blur(6px)", duration: 0.3 });
  },
});

/* ---------- Wordmark hover: scramble-flip PERSØNA ⇄ LIFESTYLE ----------
   The fixed morphing logo is one element, so the flip works at hero size
   and while docked in the nav alike. */
const WORD_A = "PERSØNA";
const WORD_B = "LIFESTYLE";
let wordRaf = null;
let wordTimeout = null;
let wordTarget = WORD_A; /* guard: re-fired hover events can't restart a scramble */

function renderWord(text) {
  heroWord.innerHTML = text
    .split("")
    .map(
      (c) =>
        `<span class="hl-mask"><span class="hl${c === "Ø" ? " oslash" : ""}">${c}</span></span>`
    )
    .join("");
}

/* code-glitch decode: unsettled slots cycle through code glyphs with
   RGB-split ghosting, jitter and flicker until they lock in, left to right */
const CODE_GLYPHS = "01<>[]{}/\\|=+*#$%&@!?;:^~";

function scrambleWordTo(target) {
  if (target === wordTarget) return;
  wordTarget = target;
  cancelAnimationFrame(wordRaf);
  clearTimeout(wordTimeout);
  heroWord.classList.add("glitching");
  const startLen = heroWord.textContent.replace(/\s+/g, "").length || WORD_A.length;
  const t0 = performance.now();
  const DURATION = 520; /* ms — time-based so throttled tabs still finish */
  const tick = () => {
    const p = Math.min(1, (performance.now() - t0) / DURATION);
    const len = Math.round(startLen + (target.length - startLen) * p);
    const reveal = Math.floor(p * target.length);
    if (p >= 1) {
      renderWord(target);
      heroWord.classList.remove("glitching");
      return;
    }
    heroWord.innerHTML = Array.from({ length: len }, (_, i) => {
      if (i < reveal) {
        const t = target[i] || "";
        return `<span class="hl-mask"><span class="hl${t === "Ø" ? " oslash" : ""}">${t}</span></span>`;
      }
      const c = CODE_GLYPHS[(Math.random() * CODE_GLYPHS.length) | 0];
      const dx = (Math.random() * 8 - 4).toFixed(1);
      const dy = (Math.random() * 6 - 3).toFixed(1);
      const sk = (Math.random() * 10 - 5).toFixed(1);
      const red = Math.random() < 0.16 ? " glr" : "";
      const op = Math.random() < 0.14 ? 0.3 : 1;
      return `<span class="hl-mask"><span class="hl glx${red}" style="transform:translate(${dx}px,${dy}px) skewX(${sk}deg);opacity:${op}">${c}</span></span>`;
    }).join("");
    wordRaf = requestAnimationFrame(tick);
  };
  tick();
  /* backstop: guarantee the final word even if rAF frames stall */
  wordTimeout = setTimeout(() => {
    cancelAnimationFrame(wordRaf);
    renderWord(target);
    heroWord.classList.remove("glitching");
  }, DURATION + 90);
}

heroWord.addEventListener("mouseenter", () => scrambleWordTo(WORD_B));
heroWord.addEventListener("mouseleave", () => scrambleWordTo(WORD_A));
heroWord.addEventListener("click", () => {
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Ink in Motion: crossing headings + arc carousel ----------
   Choreography (mirroring the reference, directions per spec):
   after the wordmark docks, row 1 rides in from the RIGHT, row 2 from
   the LEFT; they cross mid-section and exit the opposite sides while a
   curved band of work shots sweeps up from the bottom, over the
   headings, and away off the top. Fully scrubbed and reversible. */
const motionBand = document.getElementById("motionBand");
const MOTION_IMGS = [
  "work-irezumi", "work-blackwork", "work-realism",
  "work-neotrad", "work-irezumi", "work-blackwork",
];
MOTION_IMGS.forEach((n) => {
  const d = document.createElement("div");
  d.className = "motion__card";
  d.innerHTML = `<img loading="lazy" decoding="async" crossorigin="anonymous" src="https://cdn.jsdelivr.net/gh/mcmikey1424-ux/persona-lifestyle-tattoo@master/assets/${n}.jpg" alt="Studio work">`;
  motionBand.appendChild(d);
});

/* bow the band: cards follow a parabolic arc, each tilted tangent to it */
[...motionBand.children].forEach((card, i, arr) => {
  const t = i / (arr.length - 1) - 0.5; /* -0.5 … 0.5 across the band */
  gsap.set(card, { yPercent: t * t * 190 - 16, rotation: t * 24 });
});

const motionRow1 = document.getElementById("motionRow1");
const motionRow2 = document.getElementById("motionRow2");

const motionTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#motion",
    start: "top top",
    end: "+=320%",
    scrub: 0.8,
    pin: "#motionStage",
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
});
motionTl
  /* row 1: enters from the right, exits left */
  .fromTo(
    motionRow1,
    { x: () => window.innerWidth + 60 },
    { x: () => -motionRow1.offsetWidth - 60, ease: "none", duration: 10 },
    0
  )
  /* row 2: enters from the left, exits right — they cross mid-way */
  .fromTo(
    motionRow2,
    { x: () => -motionRow2.offsetWidth - 60 },
    { x: () => window.innerWidth + 60, ease: "none", duration: 10 },
    0
  )
  /* arc band: rides from below the fold, sweeps over the crossing
     headings, and exits off the top with a slow counter-roll */
  .fromTo(
    motionBand,
    { y: () => window.innerHeight * 1.35, x: () => -window.innerWidth * 0.05, rotation: -9 },
    { y: () => -window.innerHeight * 1.5, x: () => window.innerWidth * 0.04, rotation: 7, ease: "none", duration: 7 },
    2.6
  );

/* ---------- Mosaic: scattered tiles assemble ---------- */
const tilesWrap = document.getElementById("mosaicTiles");
const COLS = 6, ROWS = 4;
const tiles = [];

const MOSAIC_RATIO = 1304 / 1440; /* natural size of the cropped irezumi photo */
function layoutTiles() {
  const H = tilesWrap.clientHeight * 0.86;
  const W = H * MOSAIC_RATIO;
  const ox = (tilesWrap.clientWidth - W) / 2;
  const oy = (tilesWrap.clientHeight - H) / 2;
  const tw = W / COLS, th = H / ROWS;
  tiles.forEach(({ el, c, r }) => {
    el.style.width = tw + "px";
    el.style.height = th + "px";
    el.style.left = ox + c * tw + "px";
    el.style.top = oy + r * th + "px";
    el.style.backgroundSize = `${W}px ${H}px`;
    el.style.backgroundPosition = `${-c * tw}px ${-r * th}px`;
  });
}

/* deterministic pseudo-random scatter so the layout is stable */
function rand(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const el = document.createElement("div");
    el.className = "tile";
    tilesWrap.appendChild(el);
    tiles.push({ el, c, r });
  }
}
layoutTiles();
window.addEventListener("resize", layoutTiles);

/* hide roughly a third of tiles for the fragmented look, keep them missing until late */
const mosaicTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#mosaic",
    start: "top top",
    end: "+=250%",
    scrub: 0.6,
    pin: "#mosaicStage",
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
});

tiles.forEach(({ el, c, r }, i) => {
  const seed = i + 1;
  const dx = (rand(seed) - 0.5) * window.innerWidth * 0.9;
  const dy = (rand(seed + 40) - 0.5) * window.innerHeight * 0.9;
  const late = rand(seed + 80) > 0.65; /* some tiles arrive last */
  gsap.set(el, { x: dx, y: dy, opacity: 0, filter: "blur(14px)", scale: 1.06 });
  mosaicTl.to(
    el,
    {
      x: 0, y: 0, opacity: 1, scale: 1,
      filter: "blur(0px)",
      ease: "power2.inOut",
      duration: late ? 0.55 : 0.8,
    },
    late ? 0.35 + rand(seed + 7) * 0.25 : rand(seed + 3) * 0.3
  );
});
mosaicTl.fromTo(
  ".mosaic__overlay > *",
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, immediateRender: true },
  0.15
);

/* ---------- Pixel-render canvas reveal (produx-style) ---------- */
function makePixelReveal(wrap) {
  const img = wrap.querySelector("img");
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");
  const state = { p: 0 }; /* 0 = coarsest blocks, 1 = full render */
  const STEPS = [64, 40, 24, 14, 8, 4, 1];
  let lastStep = -1;

  function coverRect() {
    const cw = canvas.width, chh = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return null;
    const s = Math.max(cw / iw, chh / ih);
    const sw = cw / s, sh = chh / s;
    return [(iw - sw) / 2, (ih - sh) / 2, sw, sh];
  }

  function draw(force) {
    const idx = Math.min(STEPS.length - 1, Math.floor(state.p * STEPS.length));
    if (idx === lastStep && !force) return;
    lastStep = idx;
    const src = coverRect();
    if (!src) return;
    const px = STEPS[idx];
    const w = canvas.width, h = canvas.height;
    if (px <= 1) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, ...src, 0, 0, w, h);
      return;
    }
    const dw = Math.max(1, Math.round(w / px));
    const dh = Math.max(1, Math.round(h / px));
    off.width = dw; off.height = dh;
    offCtx.imageSmoothingEnabled = true;
    offCtx.drawImage(img, ...src, 0, 0, dw, dh);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(off, 0, 0, dw, dh, 0, 0, w, h);
  }

  function size() {
    canvas.width = wrap.clientWidth;
    canvas.height = Math.round(wrap.clientHeight * 1.12);
    draw(true);
  }
  if (img.complete && img.naturalWidth) size();
  else img.addEventListener("load", size);
  window.addEventListener("resize", size);

  return { canvas, state, draw };
}

/* ---------- Works: pixel reveal, parallax, dimming ---------- */
document.querySelectorAll("[data-work]").forEach((work) => {
  const wrap = work.querySelector(".work__imgwrap");
  const { canvas, state, draw } = makePixelReveal(wrap);
  const tags = work.querySelectorAll(".work__tags li");
  const desc = work.querySelector(".work__desc");
  tumbleIn(work.querySelector(".work__title"));
  const view = work.querySelector(".work__view");

  /* diagonal clip wipe + progressive pixel render, exactly like the reference */
  gsap.timeline({
    scrollTrigger: { trigger: work, start: "top 78%", toggleActions: "play none none reverse" },
  })
    .fromTo(
      canvas,
      { clipPath: "inset(100% 100% 0% 0%)", scale: 1.08, transformOrigin: "0% 100%" },
      { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.1, ease: "power3.inOut" },
      0
    )
    .to(state, { p: 1, duration: 1.25, ease: "none", onUpdate: () => draw() }, 0);

  /* whole-card blur/brightness entrance (card-level, like the reference) */
  gsap.fromTo(
    work,
    { filter: "blur(10px) brightness(0.6)" },
    {
      filter: "blur(0px) brightness(1)",
      ease: "none",
      scrollTrigger: { trigger: work, start: "top 95%", end: "top 45%", scrub: 0.5 },
    }
  );
  /* gentle parallax drift of the oversized canvas layer */
  gsap.fromTo(
    canvas,
    { yPercent: -4 },
    {
      yPercent: 4, ease: "none",
      scrollTrigger: { trigger: work, start: "top bottom", end: "bottom top", scrub: true },
    }
  );
  /* meta entrance */
  gsap.timeline({
    scrollTrigger: { trigger: work, start: "top 65%", toggleActions: "play none none reverse" },
  })
    .from(tags, { y: 18, opacity: 0, stagger: 0.06, duration: 0.45, ease: "power2.out" })
    .from(desc, { opacity: 0, duration: 0.5 }, "-=0.35")
    .from(view, { opacity: 0, y: 20, duration: 0.5 }, "-=0.4");

  /* hover: slow media zoom */
  const zoomIn = gsap.quickTo(canvas, "scale", { duration: 0.8, ease: "power2.out" });
  work.addEventListener("mouseenter", () => zoomIn(1.045));
  work.addEventListener("mouseleave", () => zoomIn(1));

  /* dim when leaving focus */
  gsap.to(work, {
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: work, start: "bottom 45%", end: "bottom 5%", scrub: true },
  });
});

/* ---------- Philosophy: per-word 3D scale-up ---------- */
scaleUpText(document.querySelector(".philosophy__text"));
gsap.from(".philosophy .btn", {
  opacity: 0, y: 24, duration: 0.7,
  scrollTrigger: { trigger: ".philosophy", start: "top 55%", toggleActions: "play none none reverse" },
});

/* ---------- Services rows ---------- */
gsap.utils.toArray("[data-service]").forEach((row, i) => {
  gsap.from(row, {
    opacity: 0, y: 40, duration: 0.7, delay: i * 0.05,
    ease: "power2.out",
    scrollTrigger: { trigger: row, start: "top 88%", toggleActions: "play none none reverse" },
  });
  tumbleIn(row.querySelector(".service__title"));
});

/* ---------- Green act: page tint + word reveal + hotspots ---------- */
scaleUpText(document.getElementById("greenWords"), { start: "top 95%", end: "bottom 15%" });

/* pinned centerpiece: float + hotspots appear in sequence */
const greenTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#greenStage",
    start: "top top",
    end: "+=180%",
    scrub: 0.5,
    pin: true,
    anticipatePin: 1,
  },
});
greenTl
  .from("#greenObj", { scale: 0.7, opacity: 0, rotate: -6, duration: 0.9, ease: "power2.out" })
  .to("#greenObj", { rotate: 4, yPercent: -4, duration: 2, ease: "none" }, 0.6);

document.querySelectorAll("[data-hotspot]").forEach((h, i) => {
  greenTl.to(h, { opacity: 1, y: -8, duration: 0.35 }, 0.7 + i * 0.45);
});

/* whole-page tint while inside the green act — created after the pin so its
   end position accounts for the pin spacer on refresh */
ScrollTrigger.create({
  trigger: "#green",
  start: "top 55%",
  endTrigger: ".reviews",
  end: "top 65%",
  onToggle: (self) => document.body.classList.toggle("body--green", self.isActive),
});

/* idle float loop for the centerpiece */
if (!reduceMotion) {
  gsap.to("#greenObj", {
    y: "+=14",
    duration: 3.2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
}

/* ---------- Reviews: staggered parallax cards ---------- */
gsap.utils.toArray("[data-review]").forEach((card, i) => {
  gsap.from(card, {
    y: 90 + (i % 3) * 50,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: ".reviews", start: "top 70%", toggleActions: "play none none reverse" },
    delay: i * 0.08,
  });
  /* differential drift while scrolling through */
  gsap.to(card, {
    y: (i % 2 === 0 ? -40 : 40),
    ease: "none",
    scrollTrigger: { trigger: ".reviews", start: "top bottom", end: "bottom top", scrub: true },
  });
});

/* ---------- Statement ---------- */
scaleUpText(document.getElementById("statementText"), { start: "top 95%", end: "bottom 12%" });

/* ---------- Journal rows ---------- */
gsap.utils.toArray("[data-journal]").forEach((row) => {
  gsap.from(row, {
    opacity: 0, y: 34, duration: 0.65, ease: "power2.out",
    scrollTrigger: { trigger: row, start: "top 90%", toggleActions: "play none none reverse" },
  });
  tumbleIn(row.querySelector(".journal__title"));
});

/* ---------- Footer wordmark rise ---------- */
gsap.from("#footerWord", {
  yPercent: 55,
  opacity: 0,
  duration: 1.1,
  ease: "power3.out",
  scrollTrigger: { trigger: ".footer", start: "top 55%", toggleActions: "play none none reverse" },
});

/* ---------- Depth layers: every component drifts at its own speed ---------- */
/* Positive speed = moves slower than the page (feels deeper),
   negative = moves faster (floats above). Applied as a scrubbed
   drift across each element's journey through the viewport. */
const DEPTH_LAYERS = [
  [".work__meta", 26],
  [".work__tags", -14],
  [".philosophy__text", 18],
  [".philosophy .btn", -22],
  [".service__num", -18],
  [".green__words", 14],
  [".hotspot--1", -16],
  [".hotspot--2", -26],
  [".hotspot--3", -10],
  [".journal__title", 10],
  [".journal__tag", -12],
  [".reviews__cta", -18],
  [".statement__text", 12],
  [".footer__grid", 16],
];

DEPTH_LAYERS.forEach(([sel, dist]) => {
  gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(
      el,
      { y: dist },
      {
        y: -dist,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
});

/* ---------- Anchor navigation through Lenis ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (href.length < 2) { e.preventDefault(); return; } /* bare "#" placeholder links */
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* refresh once images settle */
window.addEventListener("load", () => ScrollTrigger.refresh());
