(function () {
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
  layerData.forEach(l => {
    // depthNear = 1 for layer--0 (near), 0 for layer--7 (far)
    const t = (l.order - minOrder) / Math.max(1, (maxOrder - minOrder));
    const depthNear = 1 - t;
    l.start = START_FAR_VH + (START_NEAR_VH - START_FAR_VH) * depthNear;
    l.speed = SPEED_FAR  + (SPEED_NEAR   - SPEED_FAR)   * depthNear;
  });

  let vpH = 0, pinTop = 0, pinHeight = 0, pinScrollable = 1;

  function measure() {
    vpH = window.innerHeight;
    const rect = pin.getBoundingClientRect();
    const start = rect.top + window.scrollY;
    const end = start + pin.offsetHeight - vpH;
    pinTop = start;
    pinHeight = pin.offsetHeight;
    pinScrollable = Math.max(1, end - start);
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
    const raw = (y - pinTop) / pinScrollable;
    const { p, exitT } = mapWithHoldAndExit(raw);
    apply(p);

    // Ease the hero upward during the final ramp
    const ramp = USE_EXIT_EASING ? easeInOutCubic(exitT) : exitT;
    const lift = -EXIT_LIFT_VH * ramp; // negative moves up
    hero.style.transform = `translate3d(0, ${lift}vh, 0)`;
  }

  function onResize() {
    measure();
    onScroll();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { measure(); apply(1); return; }

  measure();
  apply(0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
})();
