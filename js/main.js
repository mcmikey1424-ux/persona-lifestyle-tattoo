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

/* ---------- Glitch scramble reveal (Creative Director port) ----------
   Characters cycle through a glyph set before settling on the real text.
   Queue cadence, reset chars, 35ms frame clock and the deterministic
   glyph formula are ported 1:1 from the reference ScrambleText. */
const SCRAMBLE_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const SCRAMBLE_RESET = new Set(["C", "E", "O", "P"]);
function scrambleReveal(el, { simultaneous = false } = {}) {
  const text = el.textContent;
  const queue = [];
  let ti = 0;
  for (const ch of text) {
    if (SCRAMBLE_RESET.has(ch)) ti = 0;
    const start = simultaneous ? 0 : ti * 3 + Math.floor(Math.random() * 2);
    const end = simultaneous
      ? start + 25 + Math.floor(Math.random() * 20)
      : start + 8 + Math.floor(Math.random() * 6);
    queue.push({ ch, start, end });
    ti++;
  }
  let frame = 0;
  const esc = (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c);
  const iv = setInterval(() => {
    frame++;
    if (queue.every((q) => frame >= q.end)) {
      el.textContent = text;
      clearInterval(iv);
      return;
    }
    el.innerHTML = queue
      .map((q, i) => {
        if (q.ch === " ") return " ";
        if (frame < q.start) return `<span style="visibility:hidden">${esc(q.ch)}</span>`;
        if (frame >= q.end) return esc(q.ch);
        return esc(SCRAMBLE_SET[(i * 31 + frame * 17) % SCRAMBLE_SET.length]);
      })
      .join("");
  }, 35);
}
function scrambleOnEnter(el, opts) {
  ScrollTrigger.create({
    trigger: el,
    start: "top 85%",
    once: true,
    onEnter: () => scrambleReveal(el, opts),
  });
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
  /* portrait + orbit: arrive close-up, then ZOOM OUT into place */
  .fromTo(
    "#orbit",
    { scale: 1.22, opacity: 0, transformOrigin: "50% 62%" },
    { scale: 1, opacity: 1, duration: 1.35, ease: "power3.out" },
    "-=0.85"
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
  /* text blocks sweep OUT to their own sides on scroll (portrait untouched) */
  .to("#heroTagline", { x: () => -window.innerWidth * 0.6, opacity: 0, ease: "power1.in" }, 0)
  .to("#heroHint", { opacity: 0, ease: "none", duration: 0.25 }, 0)
  .to("#heroMono", { x: () => window.innerWidth * 0.6, opacity: 0, ease: "power1.in" }, 0)
  /* explicit from-value: with invalidateOnRefresh, a refresh mid-intro
     (orbit still hidden) would otherwise capture opacity 0 as the start
     and pin the orbit invisible */
  /* black-hole exit: pure compositor zoom (no blur/rotation — those
     forced repaints every frame and made the shrink judder) */
  .fromTo("#orbit",
    { opacity: 1, scale: 1 },
    { opacity: 0, scale: 0.02,
      transformOrigin: "50% 58%", ease: "power1.inOut", duration: 0.42,
      force3D: true, immediateRender: false },
    0);

/* ---------- Typography orbit (reference: tender-researchers framer) ----
   Exact system from the reference DOM: each character is its own div at
   translate(-50%,-50%) rotateY(i*360/N) translateZ(330px) inside a
   preserve-3d ring that spins 360deg every 25s (linear), mounted on a
   tilted axis translate(-45px,42px) rotateX(-9) rotateY(5) rotateZ(-26),
   all inside a perspective:1000px stage. Backfaces stay visible (the
   mirrored text at the back is part of the look); the cutout portrait
   sits at z=0 in the same 3D context so the ring passes in front of and
   behind him. */
const orbitRing = document.getElementById("orbitRing");
function orbitTextFor(name, handle) {
  return `MEET ${name} ✦ RESIDENT ARTIST ✦ MEET ${name} ✦ 27A HAJI LANE SINGAPORE ✦ ${handle} ✦ `;
}
function buildRing(text) {
  const N = text.length;
  orbitRing.innerHTML = [...text].map((ch, i) =>
    `<div class="orbit__ch" style="transform:translate(-50%,-50%) rotateY(${(i * 360 / N).toFixed(4)}deg) translateZ(var(--orbR))">${ch === " " ? "&nbsp;" : ch}</div>`
  ).join("");
}
if (orbitRing) {
  buildRing(orbitTextFor("ALFREY", "@ALFREYTATTOO"));
  /* scroll-driven spin: the ring turns with scroll, direction follows
     the scroll direction, smoothed with a light lerp for inertia */
  const ORBIT_DEG_PER_PX = 0.35;   /* scroll boost */
  const ORBIT_IDLE_DPS = 14.4;     /* idle auto-spin, 360deg/25s like the reference */
  let orbitCur = 0, orbitScrollSm = 0;
  gsap.ticker.add((t, dtMs) => {
    const dt = Math.min(dtMs, 100) / 1000;
    const scrollTarget = (window.scrollY || 0) * ORBIT_DEG_PER_PX;
    orbitScrollSm += (scrollTarget - orbitScrollSm) * 0.09; /* lerped scroll spin */
    orbitCur += ORBIT_IDLE_DPS * dt;                        /* idle auto-spin */
    gsap.set(orbitRing, { rotationY: orbitCur + orbitScrollSm });
  });
}

/* ---------- Portrait auto-switch: crossfade through the crew ---------- */
const PORTRAIT_CDN = "https://cdn.jsdelivr.net/gh/mcmikey1424-ux/persona-lifestyle-tattoo@master/assets/";
/* per-portrait height (vh): equalizes face scale — each photo was shot
   at a different distance, so a uniform height gave mismatched "FOV" */
const PORTRAIT_LIST = [
  ["alfrey-cut.png", 95.5, "ALFREY", "@ALFREYTATTOO"],
  ["friend-2.png", 88.6, "EMELYN", "@LETTERBEFORE.N"],
  ["friend-3.png", 89.6, "BREANNA", "@BREANNX_"],
  ["friend-4.png", 98.5, "JARED", "@PRETTY5TRANGE"],
  ["friend-5.png", 87, "BERNICE", "@BERTATTOOIST"],
  ["friend-6.png", 88.5, "JAE", "@CRYINGBAPHOMET"],
];
const PORTRAITS = PORTRAIT_LIST.map(([f]) => PORTRAIT_CDN + f);
const PORTRAIT_VH = PORTRAIT_LIST.map(([, vh]) => vh);
const orbitImgA = document.getElementById("orbitImgA");
if (orbitImgA && !reduceMotion) {
  PORTRAITS.forEach((src) => { const i = new Image(); i.crossOrigin = "anonymous"; i.src = src; });
  let pIdx = 0;
  setInterval(() => {
    pIdx = (pIdx + 1) % PORTRAITS.length;
    const [, vh, name, handle] = PORTRAIT_LIST[pIdx];
    /* sequential swap: fully out, swap, fully in — no double-exposure.
       The ring element itself is never faded (opacity < 1 would kill
       preserve-3d and flatten the ring); its flat char leaves fade. */
    gsap.to(orbitImgA, { opacity: 0, duration: 0.45, ease: "power1.in" });
    gsap.to(orbitRing.children, {
      opacity: 0, duration: 0.45, ease: "power1.in",
      onComplete: () => {
        orbitImgA.src = PORTRAITS[pIdx];
        orbitImgA.style.height = vh + "vh";
        buildRing(orbitTextFor(name, handle));
        gsap.set(orbitRing.children, { opacity: 0 });
        const reveal = () => {
          gsap.to(orbitImgA, { opacity: 1, duration: 0.5, ease: "power1.out" });
          gsap.to(orbitRing.children, { opacity: 1, duration: 0.5, ease: "power1.out" });
        };
        if (orbitImgA.complete && orbitImgA.naturalWidth) reveal();
        else orbitImgA.onload = reveal;
      },
    });
  }, 5000);
}

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

/* ---------- Ink in Motion: crossing headings ----------
   Choreography (mirroring the reference, directions per spec):
   after the wordmark docks, row 1 rides in from the RIGHT, row 2 from
   the LEFT; they cross mid-section and exit the opposite sides.
   Fully scrubbed and reversible. */

const motionRow1 = document.getElementById("motionRow1");
const motionRow2 = document.getElementById("motionRow2");

const motionTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#motion",
    start: "top top",
    end: "+=160%",
    scrub: 0.8,
    pin: "#motionStage",
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (window.__glassProgress) window.__glassProgress.p = self.progress;
      if (window.__glassHint) window.__glassHint.style.opacity = Math.max(0, 1 - self.progress * 4.5).toString();
    },
  },
});
ScrollTrigger.create({
  trigger: "#motion",
  start: "top 60%",
  once: true,
  onEnter: () => {
    scrambleReveal(motionRow1, { simultaneous: true });
    scrambleReveal(motionRow2, { simultaneous: true });
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
  ;



/* ---------- GlassGallery (Framer GlassGallery-kQ8n3A, ported 1:1) ----
   Photos folded onto a spinning glass cube that UNFOLDS into a flat
   grid on scroll. Layout config, materials, lights, damping formulas
   and the rotation/scale/glass/face lerps are verbatim from the
   reference; scroll progress is fed from the motion section pin. */
(function () {
  const canvas = document.getElementById("glassCanvas");
  const container = document.getElementById("motionStage");
  if (!canvas || !container || typeof THREE === "undefined") return;

  const HP = Math.PI / 2;
  const CS = 0.5;                 /* cubeSize (reference default) */
  const AUTO_SPIN = 0.15, SCROLL_SPINS = 1, TILT = 1;
  const GLASS = { thickness: 1.3, roughness: 0.12, opacity: 0.16, color: "#ffffff" };
  const PHOTO_OPACITY = 1;

  const IMAGES = [
    "work-irezumi", "work-blackwork", "work-realism", "work-neotrad",
  ].map((f) => "https://cdn.jsdelivr.net/gh/mcmikey1424-ux/persona-lifestyle-tattoo@master/assets/" + f + ".jpg");

  /* quad layout: 24 faces, verbatim table from buildLayoutConfig */
  const qO = 0.715 * CS, bO = 1.51 * CS;
  const qdS = [1.37 * CS, 1.37 * CS];
  const RAW = [
    [[-bO, +qO, -qO], [0, -HP, 0], 0, 0, 0], [[-bO, -qO, -qO], [0, -HP, 0], 12, 0, 2],
    [[-bO, +qO, +qO], [0, -HP, 0], 1, 1, 0], [[-bO, -qO, +qO], [0, -HP, 0], 13, 1, 2],
    [[-qO, +qO, bO], [0, 0, 0], 2, 2, 0],    [[-qO, -qO, bO], [0, 0, 0], 14, 2, 2],
    [[+qO, +qO, bO], [0, 0, 0], 3, 3, 0],    [[+qO, -qO, bO], [0, 0, 0], 15, 3, 2],
    [[bO, +qO, +qO], [0, HP, 0], 4, 4, 0],   [[bO, -qO, +qO], [0, HP, 0], 16, 4, 2],
    [[bO, +qO, -qO], [0, HP, 0], 5, 5, 0],   [[bO, -qO, -qO], [0, HP, 0], 17, 5, 2],
    [[+qO, +qO, -bO], [0, Math.PI, 0], 6, 6, 0], [[+qO, -qO, -bO], [0, Math.PI, 0], 18, 6, 2],
    [[-qO, +qO, -bO], [0, Math.PI, 0], 7, 7, 0], [[-qO, -qO, -bO], [0, Math.PI, 0], 19, 7, 2],
    [[-qO, bO, -qO], [-HP, 0, 0], 8, 0, 1],  [[-qO, bO, +qO], [-HP, 0, 0], 20, 1, 1],
    [[+qO, bO, -qO], [-HP, 0, 0], 9, 2, 1],  [[+qO, bO, +qO], [-HP, 0, 0], 21, 3, 1],
    [[-qO, -bO, +qO], [HP, 0, 0], 10, 4, 1], [[-qO, -bO, -qO], [HP, 0, 0], 22, 5, 1],
    [[+qO, -bO, +qO], [HP, 0, 0], 11, 6, 1], [[+qO, -bO, -qO], [HP, 0, 0], 23, 7, 1],
  ];
  const COLS = 8, ROWS = 3;
  const gX = 0.12 * CS, gY = 0.12 * CS;
  const fw = qdS[0], fh = qdS[1];
  const startX = -((COLS - 1) * (fw + gX)) / 2;
  const startY = ((ROWS - 1) * (fh + gY)) / 2;
  const CONFIG = RAW.map(function (r) {
    return {
      basePos: r[0], baseRot: r[1], texIndex: r[2],
      flatPos: [startX + r[3] * (fw + gX), startY - r[4] * (fh + gY), 0],
    };
  });

  const w0 = container.clientWidth || window.innerWidth;
  const h0 = container.clientHeight || window.innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w0 / h0, 0.1, 100);
  camera.position.z = 6.6;
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(w0, h0, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.debug.checkShaderErrors = false;

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const dir1 = new THREE.DirectionalLight(0xffffff, 1.2); dir1.position.set(-8, 10, -2); scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.7); dir2.position.set(8, -5, 6); scene.add(dir2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4));
  const coreLight = new THREE.PointLight(0xffffff, 0, 10, 1.6); scene.add(coreLight);
  const group = new THREE.Group(); scene.add(group);

  /* glass cube */
  const glassMat = new THREE.MeshPhysicalMaterial({
    transmission: 1, roughness: GLASS.roughness, thickness: GLASS.thickness,
    clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.45,
    color: new THREE.Color(GLASS.color), transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(3.02 * CS, 3.02 * CS, 3.02 * CS), glassMat);
  group.add(glassMesh);

  /* face meshes */
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = "anonymous";
  const texCache = new Map();
  const geo = new THREE.PlaneGeometry(qdS[0], qdS[1]);
  const faces = CONFIG.map(function (fc) {
    const url = IMAGES[fc.texIndex % IMAGES.length];
    let tex = texCache.get(url);
    if (!tex) {
      tex = texLoader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      texCache.set(url, tex);
    }
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex, emissiveMap: tex, emissive: new THREE.Color("#ffffff"),
      transparent: true, opacity: 1, side: THREE.DoubleSide,
      roughness: 1, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.25,
      depthWrite: true, toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fc.basePos[0], fc.basePos[1], fc.basePos[2]);
    mesh.rotation.set(fc.baseRot[0], fc.baseRot[1], fc.baseRot[2]);
    group.add(mesh);
    return { mesh: mesh, mat: mat, fc: fc };
  });

  /* scroll progress is written by the motion pin's onUpdate */
  const glassProgress = { p: 0 };
  const hint = document.getElementById("glassHint");

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    }, 150);
  });

  /* animation loop - formulas verbatim from the reference */
  let t = 0, lerped = 0, startRotY = 0, hasStartedScroll = false;
  let lastTime = performance.now();
  const pointer = { x: 0, y: 0 };
  window.addEventListener("mousemove", function (e) {
    const rect = container.getBoundingClientRect();
    if (rect.width > 0) {
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
  });

  let running = false, rafId = 0;
  function animate(time) {
    if (!running) return;
    const delta = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;
    const d60 = delta * 60;
    const damping = 1 - Math.exp(-0.12 * d60);
    const rotDamping = 1 - Math.exp(-0.08 * d60);
    const glassDamping = 1 - Math.exp(-0.15 * d60);

    lerped += (glassProgress.p - lerped) * damping;
    const u = 1 - Math.min(1, lerped);

    if (glassProgress.p === 0) {
      if (hasStartedScroll) { t = group.rotation.y / Math.max(0.01, AUTO_SPIN); hasStartedScroll = false; }
      t += delta;
    } else if (!hasStartedScroll) {
      const wr = ((group.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      group.rotation.y = wr; startRotY = wr; hasStartedScroll = true;
    }
    const rotEase = 0.5 * (1 - Math.cos(u * Math.PI));
    const targetRotX = (0.35 + 0.1 * Math.sin(t * 0.5) - pointer.y * TILT) * rotEase;
    const targetRotY = glassProgress.p === 0
      ? t * AUTO_SPIN + pointer.x * TILT
      : (startRotY + pointer.x * TILT) * rotEase + (1 - rotEase) * (SCROLL_SPINS * Math.PI * 2);
    const targetRotZ = (0.2 + 0.08 * Math.cos(t * 0.4)) * rotEase;
    group.rotation.x += (targetRotX - group.rotation.x) * rotDamping;
    group.rotation.y += (targetRotY - group.rotation.y) * rotDamping;
    group.rotation.z += (targetRotZ - group.rotation.z) * rotDamping;

    const aspect = camera.aspect;
    const responsiveScale = aspect < 1 ? Math.max(0.65, aspect) : 1;
    const targetScale = (0.55 + 0.45 * u) * responsiveScale;
    const nextScale = group.scale.x + (targetScale - group.scale.x) * damping;
    group.scale.set(nextScale, nextScale, nextScale);

    const glassTargetOp = glassProgress.p === 0 ? GLASS.opacity : 0;
    glassMat.opacity += (glassTargetOp - glassMat.opacity) * glassDamping;
    const glassScale = 0.001 + 0.999 * u;
    glassMesh.scale.set(glassScale, glassScale, glassScale);
    coreLight.intensity = 5 * u;

    for (let i = 0; i < faces.length; i++) {
      const mesh = faces[i].mesh, mat = faces[i].mat, fc = faces[i].fc;
      const tx = (1 - u) * fc.flatPos[0] + u * fc.basePos[0];
      const ty = (1 - u) * fc.flatPos[1] + u * fc.basePos[1];
      const tz = (1 - u) * fc.flatPos[2] + u * fc.basePos[2];
      mesh.position.x += (tx - mesh.position.x) * damping;
      mesh.position.y += (ty - mesh.position.y) * damping;
      mesh.position.z += (tz - mesh.position.z) * damping;
      mesh.rotation.x += (fc.baseRot[0] * u - mesh.rotation.x) * damping;
      mesh.rotation.y += (fc.baseRot[1] * u - mesh.rotation.y) * damping;
      mesh.rotation.z += (fc.baseRot[2] * u - mesh.rotation.z) * damping;
      const targetOp = 1 - (1 - PHOTO_OPACITY) * u;
      mat.opacity += (targetOp - mat.opacity) * glassDamping;
      mat.color.setRGB(u, u, u);
      mat.emissive.setRGB(1 - u, 1 - u, 1 - u);
    }
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }
  function start() { if (running) return; running = true; lastTime = performance.now(); rafId = requestAnimationFrame(animate); }
  function stop() { if (!running) return; running = false; cancelAnimationFrame(rafId); }
  new IntersectionObserver(function (es) {
    if (es[0] && es[0].isIntersecting) start(); else stop();
  }, { threshold: 0.01 }).observe(container);
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });

  window.__glassProgress = glassProgress;
  window.__glassHint = hint;
  window.__glassDebug = function () { return { running: running, lerped: lerped, t: t, rotY: group.rotation.y, f0: faces[0].mesh.position.toArray() }; };
})();

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
  scrambleOnEnter(work.querySelector(".work__title"));
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
  scrambleOnEnter(row.querySelector(".service__title"));
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
  scrambleOnEnter(row.querySelector(".journal__title"));
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
