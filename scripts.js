(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();

(function () {
  // Respect reduced motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const stage = document.querySelector('#hero .parallax-stage');
  if (!stage) return;

  // Collect layers foreground -> background (0..7). If some IDs missing, fall back to class order.
  const layers = [];
  for (let i = 0; i <= 7; i++) {
    const el = document.getElementById('hero_' + i);
    if (el) layers.push(el);
  }
  if (!layers.length) {
    document.querySelectorAll('#hero .parallax-layer').forEach((el) => layers.push(el));
  }

  // Parallax factors: foreground moves most, background least.
  const factors = [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2, 0.12];

  // Start offset in viewport-relative units so it scales on mobile/desktop.
  const baseOffsetVH = 18; // tweak for more/less travel

  // Ensure everything starts with the “sun” composition centered;
  // we only move layers relative to that frame.
  layers.forEach((el, idx) => {
    const f = factors[idx] ?? factors[factors.length - 1];
    gsap.set(el, { yPercent: baseOffsetVH * f });
  });

  // Build timeline mapped to scroll; pin the section.
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=200%',
      scrub: true,
      pin: true,
      anticipatePin: 1,
    },
  });

  // Animate each layer upward to y=0. Background (higher index) moves less.
  layers.forEach((el, idx) => {
    const f = factors[idx] ?? factors[factors.length - 1];
    tl.to(el, { yPercent: 0 }, 0);
  });

  // Refresh on resize/orientation changes
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
})();
