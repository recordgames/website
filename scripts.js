(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const heroSection = document.querySelector('#hero');
  const stage = document.querySelector('#hero .parallax-stage');
  if (!heroSection || !stage) return;

  const layers = Array.from(stage.querySelectorAll('.parallax-layer'));
  if (!layers.length) return;

  const anchorLayer = stage.querySelector('#hero_7') || layers[layers.length - 1];
  const movingLayers = layers.filter((layer) => layer !== anchorLayer);

  if (!movingLayers.length) return;

  const baseOffset = 120;
  const offsetStep = 18;

  layers.forEach((layer, index) => {
    gsap.set(layer, { zIndex: index });
  });

  movingLayers.forEach((layer, index) => {
    const offset = baseOffset + offsetStep * index;
    gsap.set(layer, { yPercent: offset });
  });

  gsap.set(anchorLayer, { yPercent: 0 });

  const slowDuration = 1.1;
  const fastDuration = 0.35;
  const count = movingLayers.length;
  const durationStep = count > 1 ? (slowDuration - fastDuration) / (count - 1) : 0;
  const baseDelay = slowDuration;
  const finalDuration = slowDuration - durationStep * (count - 1);
  const totalDuration = (count - 1) * baseDelay + finalDuration;
  const scrollSpan = Math.max(totalDuration * 80, 320);

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: () => `+=${scrollSpan}%`,
      scrub: true,
      pin: heroSection,
      anticipatePin: 1,
    },
  });

  movingLayers.forEach((layer, index) => {
    const duration = slowDuration - durationStep * index;
    const startTime = index * baseDelay;
    timeline.to(layer, { yPercent: 0, duration }, startTime);
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
})();
