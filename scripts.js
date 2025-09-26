(function () {
  const layers = Array.from(document.querySelectorAll('.layer'));
  const hero = document.getElementById('hero');
  const pin = document.getElementById('hero-pin');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!pin || !hero || !layers.length) return;

  // ——— CONFIG: turn ON once to prove movement, then you can delete it ———
  const FORCE_DATA_START = true; // set to false after you see it working

  // Build layer model
  const N = layers.length;
  const layerData = layers.map((el, i) => {
    const orderAttr = Number(el.dataset.order);
    const classMatch = el.className.match(/layer--(\d+)/);
    const inferred = classMatch ? Number(classMatch[1]) : (N - 1 - i);
    const order = Number.isFinite(orderAttr) ? orderAttr : inferred;

    return {
      el,
      order,
      speed: Number(el.dataset.speed) || 1,
      reveal: Number(el.dataset.reveal) || 0,
      start: el.dataset.start != null ? Number(el.dataset.start) : null
    };
  }).sort((a, b) => a.order - b.order);

  // If you want guaranteed obvious movement, set starts front→back 16..120vh
  if (FORCE_DATA_START) {
    const minOrder = Math.min(...layerData.map(l => l.order));
    const maxOrder = Math.max(...layerData.map(l => l.order));
    layerData.forEach(l => {
      const t = (l.order - minOrder) / Math.max(1, (maxOrder - minOrder));
      l.start = Math.round(16 + (120 - 16) * t); // 16..120vh
    });
  }

  const maxRevealOrder = layerData.reduce((m, l) => Math.max(m, l.reveal), 0);

  let vpH = 0, pinTop = 0, pinHeight = 0, pinScrollable = 1;

  function measure() {
    vpH = window.innerHeight;
    const rect = pin.getBoundingClientRect();
    // robust start/end for the sticky segment
    const start = rect.top + window.scrollY;
    const end = start + pin.offsetHeight - vpH; // when sticky releases
    pinTop = start;
    pinHeight = pin.offsetHeight;
    pinScrollable = Math.max(1, end - start);
  }

  function defaultStartFor(order, minOrder, maxOrder) {
    const t = (order - minOrder) / Math.max(1, (maxOrder - minOrder));
    return 10 + (120 - 10) * t; // 10..120vh
  }

  function apply(progress) {
    const p = Math.min(Math.max(progress, 0), 1);
    const minOrder = Math.min(...layerData.map(l => l.order));
    const maxOrder = Math.max(...layerData.map(l => l.order));

    layerData.forEach(({ el, order, start, speed, reveal }) => {
      const startVH = start != null ? start : defaultStartFor(order, minOrder, maxOrder);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const translateVH = (1 - eased) * startVH * speed;
      el.style.transform = `translate3d(0, ${translateVH}vh, 0)`;

      if (reveal === 0 || maxRevealOrder === 0) {
        el.style.opacity = '1';
      } else {
        const step = 1 / maxRevealOrder;
        const startT = (reveal - 1) * step;
        const op = Math.min(Math.max((p - startT) / step, 0), 1);
        el.style.opacity = String(op);
      }
    });
  }

  function onScroll() {
    const y = window.scrollY;
    const raw = (y - pinTop) / pinScrollable;
    apply(raw);
  }

  function onResize() {
    measure();
    onScroll();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { apply(1); return; }

  measure();
  apply(0);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
})();
