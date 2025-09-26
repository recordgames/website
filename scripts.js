(function () {
  const layers = document.querySelectorAll('.layer');
  const hero = document.getElementById('hero');
  const heroInner = hero ? hero.querySelector('.hero__inner') : null;
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (!hero || !layers.length || !heroInner) {
    return;
  }

  const layerData = Array.from(layers).map((layer) => ({
    element: layer,
    speed: Number(layer.dataset.speed) || 0,
    reveal: Number(layer.dataset.reveal || 0),
  }));

  const maxRevealOrder = layerData.reduce(
    (max, layer) => (layer.reveal > max ? layer.reveal : max),
    0
  );

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const heroRect = hero.getBoundingClientRect();
  let heroTop = heroRect.top + window.scrollY;
  let heroHeight = hero.offsetHeight;
  let heroInnerHeight = heroInner.offsetHeight;
  let pinDistance = Math.max(heroHeight - heroInnerHeight, 1);

  const updateMetrics = () => {
    const rect = hero.getBoundingClientRect();
    heroTop = rect.top + window.scrollY;
    heroHeight = hero.offsetHeight;
    heroInnerHeight = heroInner.offsetHeight;
    pinDistance = Math.max(heroHeight - heroInnerHeight, 1);
  };

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const pinnedScroll = scrollY - heroTop;
    const progress = clamp(pinnedScroll / pinDistance, 0, 1);
    const revealProgress = progress;

    layerData.forEach(({ element, speed, reveal }) => {
      const translate = progress * speed * -120;
      element.style.transform = `translate3d(0, ${translate}vh, 0)`;

      if (reveal === 0 || maxRevealOrder === 0) {
        element.style.opacity = '1';
        return;
      }

      const step = 1 / maxRevealOrder;
      const start = (reveal - 1) * step;
      const opacity = Math.min(Math.max((revealProgress - start) / step, 0), 1);
      element.style.opacity = opacity.toString();
    });
  };

  const handleResize = () => {
    updateMetrics();
    handleScroll();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);

  updateMetrics();
  handleScroll();
})();
