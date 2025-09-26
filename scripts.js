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

  const getLayerIndex = (layer) => {
    const match = layer.id && layer.id.match(/hero_(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  // Ensure layers stack in the correct order (0 is foreground, 7 is background)
  layers.forEach((layer) => {
    const depth = getLayerIndex(layer);
    gsap.set(layer, { zIndex: 100 - depth });
  });

  const backgroundLayer = layers.reduce((acc, layer) =>
    getLayerIndex(layer) > getLayerIndex(acc) ? layer : acc
  , layers[0]);

  const revealLayers = layers
    .filter((layer) => layer !== backgroundLayer)
    .sort((a, b) => getLayerIndex(b) - getLayerIndex(a));

  if (!revealLayers.length) return;

  revealLayers.forEach((layer) => {
    gsap.set(layer, { yPercent: 60, autoAlpha: 0 });
  });

  gsap.set(backgroundLayer, { autoAlpha: 1, yPercent: 0 });

  const revealDuration = 0.9;
  const stagger = 0.55;
  const totalScrollTime = (revealLayers.length - 1) * stagger + revealDuration;
  const scrollDistance = Math.max(totalScrollTime * 450, 1400);

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: `+=${scrollDistance}`,
      scrub: true,
      pin: heroSection,
      anticipatePin: 1,
    },
  });

  revealLayers.forEach((layer, index) => {
    const startTime = index * stagger;
    timeline.to(layer, { autoAlpha: 1, yPercent: 0, duration: revealDuration }, startTime);
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
})();
