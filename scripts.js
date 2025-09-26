(function () {
  const layers = document.querySelectorAll('.layer');
  const hero = document.getElementById('hero');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (!hero || !layers.length) {
    return;
  }

  const heroRect = hero.getBoundingClientRect();
  let heroTop = heroRect.top + window.scrollY;
  let heroHeight = heroRect.height;

  const updateMetrics = () => {
    const rect = hero.getBoundingClientRect();
    heroTop = rect.top + window.scrollY;
    heroHeight = rect.height;
  };

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const progress = Math.min(Math.max((scrollY - heroTop) / heroHeight, 0), 1.5);

    layers.forEach((layer) => {
      const speed = Number(layer.dataset.speed) || 0;
      const translate = progress * speed * -120;
      layer.style.transform = `translate3d(0, ${translate}vh, 0)`;
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
