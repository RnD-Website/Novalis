(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.getElementById("primary-nav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  links.addEventListener("click", () => setMenu(false));

  /* ---------- scroll journey: ring flies into the villa, then the interior opens ---------- */
  const journey = document.getElementById("journey");
  const hero = journey.querySelector(".hero");
  const mark = hero.querySelector(".mark");
  const sceneImg = hero.querySelector(".scene__image");
  const interior = hero.querySelector(".interior");
  const interiorCopy = hero.querySelector(".interior-copy");
  const ui = hero.querySelector(".interior-ui");
  const hotspots = hero.querySelector(".hotspots");
  const bloom = hero.querySelector(".bloom");
  const rail = hero.querySelectorAll(".rail li");
  const fadeEls = hero.querySelectorAll(".intro, .headline, .scroll-cue");
  const VILLA = { u: 0.835, v: 0.43 };       // villa position inside the exterior image (0..1)
  const IMG = { w: 2048, h: 1152, py: 0.6 }; // must match .scene__image sizing/position
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let target = 0, cur = 0;

  const villaPoint = (vw, vh) => {
    const k = Math.max(vw / IMG.w, vh / IMG.h);
    const dw = IMG.w * k, dh = IMG.h * k;
    return [(vw - dw) / 2 + VILLA.u * dw, (vh - dh) * IMG.py + VILLA.v * dh];
  };
  const readScroll = () => {
    const range = journey.offsetHeight - innerHeight;
    target = range > 0 ? clamp(-journey.getBoundingClientRect().top / range) : 0;
  };
  const render = (p) => {
    const vw = hero.clientWidth, vh = hero.clientHeight;
    const [vx, vy] = villaPoint(vw, vh);

    // Camera: pans toward the villa and pushes in, trailing slightly behind the ring.
    const ox = vw / 2, oy = vh / 2;
    const camA = ease(clamp(p / 0.4));
    const s = 1 + 3.2 * ease(clamp((p - 0.04) / 0.56));
    const kx = ox + (vx - ox) * camA, ky = oy + (vy - oy) * camA; // scene point the camera looks at
    // keep the image covering the viewport while panning
    const tx = clamp(-s * (kx - ox), (vw / 2) * (1 - s), (vw / 2) * (s - 1));
    const ty = clamp(-s * (ky - oy), (vh / 2) * (1 - s), (vh / 2) * (s - 1));
    sceneImg.style.transformOrigin = `${ox}px ${oy}px`;
    sceneImg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    // approaching the glass: motion blur builds and the window light brightens the frame
    const q = ease(clamp((p - 0.28) / 0.3));
    sceneImg.style.filter = `blur(${(3.5 * q).toFixed(2)}px) brightness(${(1 + 0.25 * q).toFixed(3)})`;
    sceneImg.style.opacity = String(1 - ease(clamp((p - 0.45) / 0.2)));

    // Ring: leads the camera to wherever the villa currently sits on screen, shrinking into it.
    const vxNow = ox + tx + s * (vx - ox), vyNow = oy + ty + s * (vy - oy);
    const a = ease(clamp(p / 0.3));
    const cx = vw / 2, cy = mark.offsetTop + mark.offsetHeight / 2;
    mark.style.setProperty("--tx", `${(vxNow - cx) * a}px`);
    mark.style.setProperty("--ty", `${(vyNow - cy) * a}px`);
    mark.style.setProperty("--s", String(1 - 0.88 * a));
    mark.style.opacity = String(1 - clamp((p - 0.27) / 0.08));

    // Light bloom at the window masks the hand-over between the two scenes.
    const bl = Math.pow(Math.sin(Math.PI * clamp((p - 0.36) / 0.3)), 1.4);
    bloom.style.opacity = String(bl * 0.75);
    bloom.style.background = `radial-gradient(circle ${(0.35 + 0.6 * bl) * Math.max(vw, vh)}px at ${vxNow}px ${vyNow}px, rgba(255,226,180,.95), rgba(255,160,80,.55) 30%, rgba(255,120,40,0) 70%)`;

    // 3) interior arrives out of focus and settles: focus pull + a gentle deceleration
    const it = clamp((p - 0.4) / 0.4);
    interior.style.opacity = String(ease(clamp((p - 0.41) / 0.22)));
    interior.style.transform = `scale(${1 + 0.1 * Math.pow(1 - it, 2)})`;
    interior.style.filter = `blur(${(9 * Math.pow(1 - clamp((p - 0.42) / 0.26), 2)).toFixed(2)}px) brightness(${(1 + 0.5 * (1 - clamp((p - 0.42) / 0.3))).toFixed(3)})`;

    // hero copy leaves; interior UI arrives in stages
    const out = 1 - clamp(p / 0.14);
    fadeEls.forEach((el) => { el.style.opacity = String(out); });
    hero.querySelector(".headline").style.transform = `translateY(${(1 - out) * -30}px)`;

    const ci = ease(clamp((p - 0.72) / 0.14));
    const hi = clamp((p - 0.86) / 0.1);
    ui.style.setProperty("--ui", String(ci));
    interiorCopy.style.setProperty("--c", ci.toFixed(3));
    interiorCopy.style.opacity = ci > 0 ? "1" : "0";
    interiorCopy.style.transform = `translateY(${(1 - ci) * 28}px)`;
    interiorCopy.classList.toggle("is-live", ci > 0.5);
    hotspots.style.opacity = String(hi);
    hotspots.classList.toggle("is-live", hi > 0.6);

    rail[0].classList.toggle("is-on", p < 0.5);
    rail[1].classList.toggle("is-on", p >= 0.5);
  };

  // place hotspots on the interior photo (same cover maths as the background)
  const placeHotspots = () => {
    const vw = hero.clientWidth, vh = hero.clientHeight, IW = 16, IH = 9;
    const k = Math.max(vw / IW, vh / IH) * 1.12; // the interior layer is 112% of the viewport
    const dw = IW * k, dh = IH * k;
    hotspots.querySelectorAll(".hs").forEach((b) => {
      const x = (vw - dw) / 2 + parseFloat(b.dataset.u) * dw;
      const y = (vh - dh) / 2 + parseFloat(b.dataset.v) * dh;
      b.style.left = `${x}px`;
      // the card hangs from the tag: open rightwards/downwards unless that runs off screen (card ~272 x 380px)
      b.dataset.side = x - 17 + 272 + 16 <= vw ? "right" : "left";
      b.dataset.vert = y + 17 + 380 <= vh - 16 ? "down" : "up";
      b.style.top = `${(vh - dh) / 2 + parseFloat(b.dataset.v) * dh}px`;
    });
  };
  addEventListener("resize", placeHotspots);
  let lastT = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    // frame-rate independent easing toward the scroll position
    cur += (target - cur) * (reduceMotionNow() ? 1 : 1 - Math.exp(-dt * 6));
    if (Math.abs(target - cur) < 0.0003) cur = target;
    render(cur);
    requestAnimationFrame(tick);
  };
  const reduceMotionNow = () => reduce.matches;
  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("resize", readScroll);
  placeHotspots();
  readScroll(); cur = target; requestAnimationFrame(tick);

  /* ---------- floating villa model (glowing architectural line-art) ---------- */
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let scan = null, w = 0, h = 0, dpr = 1, raf = 0, tx = 0, ty = 0, px = 0, py = 0, hover = 0, mx = -9999, my = -9999;

  const rotY = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c + z * s, y, -x * s + z * c]; };
  const rotX = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x, y * c - z * s, y * s + z * c]; };
  const proj = (p, S, oy) => {
    const f = 1 / (1 + p[2] * 0.25);
    return [w / 2 + p[0] * S * f, h / 2 + (p[1] + oy) * S * f];
  };
  const LIGHT = (() => { const l = [-0.4, -0.5, -0.75]; const m = Math.hypot(...l); return l.map((v) => v / m); })();
  const SEG = 64;

  // The model echoes the villa in the scene: a drum with a glass band, a slab roof with an overhang,
  // a smaller upper drum, and a floating platform. y is up-negative; units are fractions of the canvas.
  const PLATFORM = { r: 0.46, y: 0.28 };
  const DRUMS = [
    { r: 0.27, yb: 0.26, yt: 0.03 },   // ground-floor glass drum
    { r: 0.19, yb: -0.02, yt: -0.16 }, // upper drum
  ];
  const SLABS = [
    { r: 0.37, y: 0.03, t: 0.05 },    // main roof / floor slab
    { r: 0.27, y: -0.16, t: 0.045 },  // top roof
  ];

  const orb = (x, y, r, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, `rgba(255,214,150,${a * 0.75})`);
    g.addColorStop(0.25, `rgba(255,150,60,${a * 0.5})`);
    g.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
  };
  const GLOW = 0.6; // overall bloom strength: lower keeps the model quieter against the headline
  const clamp01 = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const draw = (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const time = reduce.matches ? 2 : t / 1000;
    const S = w / 1.36;
    const boost = 1 + 0.18 * hover;

    const spin = 0.6 + time * 0.22 + px * 0.7;
    const tilt = 0.4 + py * 0.2;
    const oy = -0.04 + Math.sin(time * 0.9) * 0.012; // gentle float
    const T = (x, y, z) => rotX(rotY([x, y, z], spin), tilt);
    const P = (p) => proj(p, S, oy);
    const lw = Math.max(1, S * 0.0042);
    ctx.lineJoin = ctx.lineCap = "round";

    // soft pool of light under the platform
    const gp = P(T(0, PLATFORM.y + 0.04, 0));
    ctx.save();
    ctx.translate(gp[0], gp[1]); ctx.scale(1, 0.34);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.62);
    pool.addColorStop(0, `rgba(255,150,70,${0.3 * GLOW * boost})`); pool.addColorStop(1, "rgba(255,150,70,0)");
    ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, S * 0.62, 0, 7); ctx.fill();
    ctx.restore();

    // projector beam: a faint cone of light rising from the platform, widening and fading upwards
    {
      const b0 = P(T(0, PLATFORM.y, 0)), b1 = P(T(0, -0.46, 0));
      const bg = ctx.createLinearGradient(0, b0[1], 0, b1[1]);
      bg.addColorStop(0, `rgba(255,170,90,${0.2 * GLOW * boost})`); bg.addColorStop(0.55, `rgba(255,170,90,${0.06 * GLOW * boost})`); bg.addColorStop(1, "rgba(255,170,90,0)");
      ctx.fillStyle = bg; ctx.beginPath();
      ctx.moveTo(b0[0] - S * 0.3, b0[1]); ctx.lineTo(b0[0] + S * 0.3, b0[1]);
      ctx.lineTo(b1[0] + S * 0.4, b1[1]); ctx.lineTo(b1[0] - S * 0.4, b1[1]); ctx.closePath(); ctx.fill();
    }

    // warm light glowing from inside the villa
    const ig = P(T(0, 0.12, 0));
    const inner = ctx.createRadialGradient(ig[0], ig[1], 0, ig[0], ig[1], S * 0.3);
    inner.addColorStop(0, `rgba(255,190,110,${(0.3 + 0.03 * Math.sin(time * 1.3)) * GLOW * boost})`); inner.addColorStop(1, "rgba(255,150,70,0)");
    ctx.fillStyle = inner; ctx.fillRect(0, 0, w, h);

    // blueprint ring on the ground: dashed, with tick marks
    ctx.save();
    ctx.setLineDash([2, 7]); ctx.strokeStyle = `rgba(255,214,170,${0.4 * boost})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * Math.PI * 2;
      const [x, y] = P(T(0.56 * Math.cos(th), PLATFORM.y + 0.03, 0.56 * Math.sin(th)));
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,214,170,${0.35 * boost})`;
    for (let i = 0; i < 36; i++) {
      const th = (i / 36) * Math.PI * 2, len = i % 3 === 0 ? 0.035 : 0.018;
      const [x0, y0] = P(T(0.56 * Math.cos(th), PLATFORM.y + 0.03, 0.56 * Math.sin(th)));
      const [x1, y1] = P(T((0.56 + len) * Math.cos(th), PLATFORM.y + 0.03, (0.56 + len) * Math.sin(th)));
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.restore();

    // ---- collect primitives, then paint far-to-near ----
    const items = [];
    const line = (a, b, al, wd = 1, y = 0) => items.push({ k: 0, a, b, z: (a[2] + b[2]) / 2, al, wd, y });
    const ring = (r, y, al, wd) => {
      let prev = T(r, y, 0);
      for (let i = 1; i <= SEG; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const cur = T(r * Math.cos(th), y, r * Math.sin(th));
        line(prev, cur, al, wd, y); prev = cur;
      }
    };
    const post = (r, th, y0, y1, al, wd) => line(T(r * Math.cos(th), y0, r * Math.sin(th)), T(r * Math.cos(th), y1, r * Math.sin(th)), al, wd, (y0 + y1) / 2);

    // a scan plane sweeping up and down the model, lighting whatever it crosses
    const sweepY = -0.2 + 0.46 * (0.5 + 0.5 * Math.sin(time * 0.75));
    ring(0.4, sweepY, 0.55, 1);
    ring(0.3, PLATFORM.y - 0.004, 0.9, 1.3); // emitter
    for (const d of DRUMS) for (let y = d.yt + 0.035; y < d.yb - 0.01; y += 0.035) ring(d.r, y, 0.13, 0.8); // contour slices

    // platform
    ring(PLATFORM.r, PLATFORM.y, 0.6, 1.1);
    ring(PLATFORM.r, PLATFORM.y + 0.03, 0.35, 1);
    ring(PLATFORM.r - 0.07, PLATFORM.y, 0.3, 1);
    for (let i = 0; i < 12; i++) post(PLATFORM.r, (i / 12) * Math.PI * 2, PLATFORM.y, PLATFORM.y + 0.03, 0.3, 1);

    // glass drums
    for (const d of DRUMS) {
      ring(d.r, d.yb, 0.75, 1.1);
      ring(d.r, d.yt, 0.85, 1.1);
      for (let i = 0; i < SEG; i++) {
        const t0 = (i / SEG) * Math.PI * 2, t1 = ((i + 1) / SEG) * Math.PI * 2, tm = (t0 + t1) / 2;
        const q = [[t0, d.yt], [t1, d.yt], [t1, d.yb], [t0, d.yb]].map(([th, y]) => T(d.r * Math.cos(th), y, d.r * Math.sin(th)));
        items.push({ k: 1, q, n: T(Math.cos(tm), 0, Math.sin(tm)), z: (q[0][2] + q[2][2]) / 2 });
        if (i % 4 === 0) post(d.r, t0, d.yb, d.yt, 0.5, 0.9); // glazing mullions
      }
    }

    // roof slabs: top surface, both edges and a few edge posts
    for (const s of SLABS) {
      ring(s.r, s.y, 0.8, 1.2);
      ring(s.r, s.y - s.t, 0.95, 1.3);
      for (let i = 0; i < 8; i++) post(s.r, (i / 8) * Math.PI * 2, s.y, s.y - s.t, 0.6, 1);
      const pts = [];
      for (let i = 0; i < SEG; i++) { const th = (i / SEG) * Math.PI * 2; pts.push(T(s.r * Math.cos(th), s.y - s.t, s.r * Math.sin(th))); }
      items.push({ k: 2, pts, z: T(0, s.y - s.t, 0)[2] });
    }

    // a light travelling around the platform edge
    const la = time * 0.5;
    items.push({ k: 3, p: T(PLATFORM.r * Math.cos(la), PLATFORM.y, PLATFORM.r * Math.sin(la)), z: 0 });
    items[items.length - 1].z = items[items.length - 1].p[2];

    items.sort((a, b) => b.z - a.z);
    const glitch = !reduce.matches && (time % 7.3) < 0.14;
    const flick = reduce.matches ? 1 : 1 - 0.09 * Math.max(0, Math.sin(time * 41) * Math.sin(time * 13.7)) - (glitch ? 0.25 : 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = flick;
    for (const it of items) {
      const near = clamp01(0.5 - it.z * 1.4, 0.18, 1);
      if (it.k === 1) {
        const facing = Math.max(0, -it.n[2]);
        const dot = Math.max(0, it.n[0] * LIGHT[0] + it.n[1] * LIGHT[1] + it.n[2] * LIGHT[2]);
        const al = it.n[2] > 0 ? 0.05 + 0.05 * it.n[2] : 0.05 + 0.1 * facing + 0.32 * dot * dot;
        ctx.fillStyle = `rgba(255,${(170 + 60 * dot) | 0},${(100 + 70 * dot) | 0},${Math.min(0.4, al * GLOW * boost)})`;
        ctx.beginPath();
        it.q.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill();
      } else if (it.k === 2) {
        ctx.fillStyle = `rgba(255,196,130,${0.09 * near * boost})`;
        ctx.beginPath();
        it.pts.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill();
      } else if (it.k === 3) {
        const [x, y] = P(it.p);
        orb(x, y, S * 0.012, 0.95 * near + 0.1);
      } else {
        const [x0, y0] = P(it.a), [x1, y1] = P(it.b);
        const sw = Math.exp(-(((it.y - sweepY) / 0.03) ** 2));
        const al = Math.min(1, it.al * near * boost * (1 + 2.4 * sw));
        ctx.beginPath(); ctx.moveTo(x0 - 1.3, y0); ctx.lineTo(x1 - 1.3, y1);
        ctx.strokeStyle = `rgba(110,190,255,${al * 0.3})`; ctx.lineWidth = lw * it.wd * 0.8; ctx.stroke(); // cool ghost
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = `rgba(255,170,90,${al * 0.2 * GLOW})`; ctx.lineWidth = lw * it.wd * 3; ctx.stroke(); // glow
        ctx.strokeStyle = `rgba(255,${(222 + 30 * sw) | 0},${(178 + 60 * sw) | 0},${al})`; ctx.lineWidth = lw * it.wd * 0.9; ctx.stroke(); // core
      }
    }

    // motes of light rising off the emitter
    ctx.fillStyle = "rgb(255,226,186)";
    for (let i = 0; i < 34; i++) {
      const ph = (time * 0.07 + i * 0.618034) % 1, a = i * 2.39996 + time * 0.2, rad = 0.04 + 0.3 * ((i * 0.37) % 1);
      const [x, y, z] = T(rad * Math.cos(a), PLATFORM.y - ph * 0.62, rad * Math.sin(a));
      const [sx, sy] = P([x, y, z]);
      ctx.globalAlpha = flick * Math.sin(ph * Math.PI) * 0.75;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // two small floating orbs
    orb(w / 2 - S * 0.6 + Math.sin(time * 0.5) * 3, h / 2 - S * 0.25 + Math.cos(time * 0.4) * 3, S * 0.011, 0.85);
    orb(w / 2 + S * 0.5 + Math.cos(time * 0.45) * 3, h / 2 - S * 0.5 + Math.sin(time * 0.5) * 3, S * 0.013, 0.9);

    // brief horizontal tear, then scanlines carved out of the picture
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (glitch) {
      const by = Math.round(canvas.height * (0.25 + 0.5 * ((time * 3.1) % 1))), bh = Math.round(canvas.height * 0.05);
      ctx.drawImage(canvas, 0, by, canvas.width, bh, Math.round(8 * dpr), by, canvas.width, bh);
    }
    if (scan) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.translate(0, reduce.matches ? 0 : Math.floor((time * 14) % scan.height));
      ctx.fillStyle = scan.pat; ctx.fillRect(0, -scan.height, canvas.width, canvas.height + scan.height);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const sh = Math.max(3, Math.round(3 * dpr)), pc = document.createElement("canvas");
    pc.width = 1; pc.height = sh;
    const pg = pc.getContext("2d"); pg.fillStyle = "rgba(0,0,0,.3)"; pg.fillRect(0, 0, 1, Math.max(1, Math.round(dpr)));
    scan = { pat: ctx.createPattern(pc, "repeat"), height: sh };
    draw(0);
  };

  const loop = (t) => {
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    const near = Math.hypot(mx - w / 2, my - h / 2) < w * 0.45;
    hover += ((near ? 1 : 0) - hover) * 0.06;
    draw(t);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    cancelAnimationFrame(raf);
    if (!reduce.matches && !document.hidden) raf = requestAnimationFrame(loop); else draw(0);
  };

  addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
    const b = canvas.getBoundingClientRect();
    mx = e.clientX - b.left; my = e.clientY - b.top;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mx = my = -9999; tx = ty = 0; });
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", start);
  reduce.addEventListener?.("change", start);

  resize();
  start();
})();
