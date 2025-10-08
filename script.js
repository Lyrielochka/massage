const carouselEl = document.querySelector('[data-carousel]');
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
if (carouselEl && navButtons.length){
  const mobileMQ = window.matchMedia('(max-width:768px)');
  let flkty = null;
  let wheelHandlerBound = false;
  let lastWheel = 0;
  let scrollListenerAttached = false;
  let ticking = false;

  const getCells = () => Array.from(carouselEl.querySelectorAll('.carousel-cell')).filter(cell => !cell.classList.contains('is-cloned'));

  const setActive = (index) => {
    navButtons.forEach((btn, idx) => {
      const isActive = idx === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  const scrollToCell = (index) => {
    const cells = getCells();
    const target = cells[index];
    if (!target) return;
    target.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
  };

  const updateActiveByScroll = () => {
    const cells = getCells();
    if (!cells.length) return;
    const midpoint = carouselEl.scrollLeft + carouselEl.clientWidth / 2;
    let closestIndex = 0;
    let minDelta = Infinity;
    cells.forEach((cell, idx) => {
      const center = cell.offsetLeft + cell.offsetWidth / 2;
      const delta = Math.abs(center - midpoint);
      if (delta < minDelta){
        minDelta = delta;
        closestIndex = idx;
      }
    });
    setActive(closestIndex);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateActiveByScroll();
    });
  };

  const attachMobileScroll = () => {
    if (scrollListenerAttached) return;
    carouselEl.addEventListener('scroll', onScroll, { passive:true });
    scrollListenerAttached = true;
  };

  const detachMobileScroll = () => {
    if (!scrollListenerAttached) return;
    carouselEl.removeEventListener('scroll', onScroll);
    scrollListenerAttached = false;
    ticking = false;
  };

  const wheelHandler = (event) => {
    if (!flkty) return;
    if (mobileMQ.matches) return;
    if (window.matchMedia('(max-width:520px)').matches) return;
    const now = Date.now();
    if (now - lastWheel < 650) return;
    const delta = event.deltaY || event.wheelDelta || -event.detail;
    if (Math.abs(delta) < 10) return;
    event.preventDefault();
    delta > 0 ? flkty.next() : flkty.previous();
    lastWheel = now;
  };

  const bindWheel = () => {
    if (wheelHandlerBound) return;
    window.addEventListener('wheel', wheelHandler, { passive:false });
    wheelHandlerBound = true;
  };

  const unbindWheel = () => {
    if (!wheelHandlerBound) return;
    window.removeEventListener('wheel', wheelHandler, { passive:false });
    wheelHandlerBound = false;
  };

  const enterMobileMode = () => {
    if (flkty){
      unbindWheel();
      flkty.destroy();
      flkty = null;
    }
    carouselEl.classList.add('is-mobile-scroll');
    detachMobileScroll();
    navButtons.forEach((btn, idx) => {
      btn.onclick = () => scrollToCell(idx);
    });
    carouselEl.scrollLeft = 0;
    setActive(0);
    updateActiveByScroll();
    attachMobileScroll();
  };

  const enterDesktopMode = () => {
    detachMobileScroll();
    carouselEl.classList.remove('is-mobile-scroll');
    flkty = new Flickity(carouselEl, {
      wrapAround:true,
      setGallerySize:false,
      prevNextButtons:true,
      pageDots:true,
      draggable:'>1',
      selectedAttraction:0.02,
      friction:0.35
    });

    const applyActive = () => setActive(flkty.selectedIndex);
    flkty.on('select', applyActive);
    applyActive();

    navButtons.forEach((btn, idx) => {
      btn.onclick = () => flkty.select(idx);
    });

    const setDraggable = (shouldDrag) => {
      if (flkty.options.draggable === shouldDrag) return;
      flkty.options.draggable = shouldDrag;
      flkty.updateDraggable();
    };

    flkty.on('dragStart', () => {
      const index = flkty.selectedIndex;
      const needsScroll = (index === 1 || index === 3) && window.matchMedia('(max-width:768px)').matches;
      setDraggable(!needsScroll);
    });
    flkty.on('settle', () => {
      const index = flkty.selectedIndex;
      const needsScroll = (index === 1 || index === 3) && window.matchMedia('(max-width:768px)').matches;
      setDraggable(!needsScroll);
    });

    bindWheel();
  };

  const setupMode = () => {
    if (mobileMQ.matches){
      enterMobileMode();
    } else {
      enterDesktopMode();
    }
  };

  mobileMQ.addEventListener('change', setupMode);
  setupMode();
}
