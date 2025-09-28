(function () {
  const logo = document.querySelector('.logo-splash');
  const LOGO_TRAVEL = 0.95; // fraction of viewport height the logo moves (1:1 px)
  const LOGO_BASE_SHIFT_VH = -6;   // negative = move up (tweak: -4…-10)
  const CENTER_BELOW_HEADER = true; // also compensate for sticky header height

  const layers = Array.from(document.querySelectorAll('.layer'));
  const hero = document.getElementById('hero');
  const pin = document.getElementById('hero-pin');
  const yearEl = document.getElementById('year');
  const HOLD_TAIL = 0.25; // last 15% of the pin is a hold (tweak 0.1–0.25)
  const EXIT_RAMP       = 0.1; // last 8% of pin is the ease-out ramp
  const EXIT_LIFT_VH    = 16;   // lift hero up by ~16vh during the ramp
  const USE_EXIT_EASING = true; // ease shape for the ramp

  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!pin || !hero || !layers.length) return;

  // ---- Tweak these to taste (linear mapping near→far) ----
  const START_NEAR_VH = 1600;  // layer--0 starts 120vh below, travels most
  const START_FAR_VH  = 0;   // layer--7 starts 10vh below, travels least
  const SPEED_NEAR    = 1.2;  // layer--0 moves fastest
  const SPEED_FAR     = 0.0;  // layer--7 moves slowest
  const USE_EASING    = true; // set false for perfectly linear motion
  // --------------------------------------------------------

  // Build layer model (infer order from class layer--N)
  const N = layers.length;
  const layerData = layers.map((el, i) => {
    const classMatch = el.className.match(/layer--(\d+)/);
    const inferred = classMatch ? Number(classMatch[1]) : (N - 1 - i);
    return { el, order: inferred };
  }).sort((a, b) => a.order - b.order); // 0(front) ... 7(back)

  // Precompute linear start/speed by depth
  const minOrder = Math.min(...layerData.map(l => l.order));
  const maxOrder = Math.max(...layerData.map(l => l.order));

  const STATIONARY_ORDER = 7;

  const GLOBAL_START_BOOST_VH = 160; // extra 30vh added to every non-stationary layer

  layerData.forEach(l => {
    // depthNear = 1 for layer--0 (near), 0 for layer--7 (far)
    const t = (l.order - minOrder) / Math.max(1, (maxOrder - minOrder));
    const depthNear = 1 - t;

    if (l.order === STATIONARY_ORDER) {
      l.start = 0;  // no offset
      l.speed = 0;  // no movement
      return;
    }

    l.start = START_FAR_VH + (START_NEAR_VH - START_FAR_VH) * depthNear;
    l.speed = SPEED_FAR  + (SPEED_NEAR   - SPEED_FAR)   * depthNear;

    if (l.order !== STATIONARY_ORDER) l.start += GLOBAL_START_BOOST_VH;
  });

  let vpH = 0, pinTop = 0, pinHeight = 0, pinScrollable = 1, headerH = 0;
  const headerEl = document.querySelector('.site-header');

  // use visual viewport height on mobile if available
  function measure() {
    vpH = (window.visualViewport?.height) || window.innerHeight;
    const rect = pin.getBoundingClientRect();
    const start = rect.top + window.scrollY;
    const end = start + pin.offsetHeight - vpH;
    pinTop = start;
    pinHeight = pin.offsetHeight;
    pinScrollable = Math.max(1, end - start);
    headerH = headerEl ? headerEl.offsetHeight : 0;
  }


  function apply(progress) {
    const p = Math.min(Math.max(progress, 0), 1);
    const eased = USE_EASING ? (1 - Math.pow(1 - p, 3)) : p; // easeOutCubic or linear

    layerData.forEach(({ el, start, speed }) => {
      const translateVH = (1 - eased) * start * speed;
      el.style.transform = `translate3d(0, ${translateVH}vh, 0)`;
      // No fade/reveal anymore
      el.style.opacity = '1';
    });
  }

  function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  function mapWithHoldAndExit(raw){
    const c = Math.min(Math.max(raw, 0), 1);
    const animEnd    = Math.max(0, 1 - HOLD_TAIL - EXIT_RAMP); // end of main animation
    const plateauEnd = Math.max(animEnd, 1 - EXIT_RAMP);       // end of plateau, start ramp

    let p = 0;      // parallax progress 0..1
    let exitT = 0;  // exit ramp 0..1

    if (c <= animEnd) {
      p = c / Math.max(1e-6, animEnd);
    } else if (c <= plateauEnd) {
      p = 1; // hold/plateau
    } else {
      p = 1;
      exitT = (c - plateauEnd) / Math.max(1e-6, 1 - plateauEnd);
    }
    return { p, exitT };
  }

  function onScroll() {
    const y = window.scrollY;
    const scrolledPx = Math.min(Math.max(y - pinTop, 0), pinScrollable);

    // 1) Logo phase: move 1:1 (px) until it's off-screen
    // const logoExitPx = Math.round(vpH * LOGO_TRAVEL);
    // if (logo) {
    //   const liftPx = -Math.min(scrolledPx, logoExitPx); // 1:1 with scroll
    //   logo.style.transform = `translate3d(0, ${liftPx}px, 0)`;
    //   // Optional: once past exit, hide it completely
    //   logo.style.opacity = scrolledPx >= logoExitPx ? '0' : '1';
    // }

    const logoExitPx = Math.round(vpH * LOGO_TRAVEL);
    if (logo) {
      // Base offset = manual VH shift + (optional) half the header height
      const manualPx = (LOGO_BASE_SHIFT_VH / 100) * vpH;
      const headerCompPx = CENTER_BELOW_HEADER ? -(headerH / 2) : 0;
      const baseShiftPx = manualPx + headerCompPx;

      const liftPx = baseShiftPx - Math.min(scrolledPx, logoExitPx);
      logo.style.transform = `translate3d(0, ${liftPx}px, 0)`;
      const hideAt = logoExitPx - 8; // tiny buffer for iOS
      logo.style.opacity = scrolledPx > hideAt ? '0' : '1';
    }

    // 2) Parallax phase: starts after logo exits
    const segLen = Math.max(1, pinScrollable - logoExitPx);
    const segRaw = (scrolledPx - logoExitPx) / segLen; // 0..1 within the remainder

    // If you have the hold/exit-ramp mapper, use it; else just clamp
    let p = Math.min(Math.max(segRaw, 0), 1);
    let exitT = 0;

    if (typeof mapWithHoldAndExit === 'function') {
      const mapped = mapWithHoldAndExit(p);
      p = mapped.p;
      exitT = mapped.exitT || 0;
    }

    apply(p); // drive your parallax layers

    // If you implemented the hero exit ramp earlier, keep lifting during that ramp:
    if (typeof easeInOutCubic === 'function' && typeof USE_EXIT_EASING !== 'undefined') {
      const ramp = USE_EXIT_EASING ? easeInOutCubic(exitT) : exitT;
      const lift = - (window.EXIT_LIFT_VH || 16) * ramp; // use your existing config
      hero.style.transform = `translate3d(0, ${lift}vh, 0)`;
    }
  }

  function onResize() {
    measure();
    onScroll();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { measure(); apply(1); return; }

  // Init (set positions immediately so there's no jump)
  measure();
  onScroll();  // sets logo transform + p=0 right away

  // Re-run once after first paint and after fonts load (prevents late jumps)
  requestAnimationFrame(() => { measure(); onScroll(); });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); onScroll(); });
  }

  // If the logo is an <img>, re-apply when it finishes loading
  const logoImg =
    document.querySelector('.logo-splash img') ||
    (logo && logo.querySelector && logo.querySelector('img'));
  if (logoImg && !logoImg.complete) {
    logoImg.addEventListener('load', () => { measure(); onScroll(); }, { once: true });
  }

  // Listeners (keep these after the init/re-run)
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
    window.visualViewport.addEventListener('scroll', onResize);
  }

})();
