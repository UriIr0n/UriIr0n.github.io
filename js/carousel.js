// קרוסלת כרטיסים גוללת (ללא ספריות): גלילה טבעית + חצים + נקודות, מבוססת IntersectionObserver
(function () {
  function setupCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const items = Array.from(track.children);
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    let active = 0;

    const dots = items.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `כרטיס ${i + 1} מתוך ${items.length}`);
      dot.addEventListener('click', () => {
        items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function setActive(i) {
      active = i;
      dots.forEach((d, idx) => d.classList.toggle('on', idx === i));
      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = i === items.length - 1;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          setActive(items.indexOf(entry.target));
        }
      });
    }, { root: track, threshold: [0.6] });
    items.forEach((item) => io.observe(item));

    prevBtn?.addEventListener('click', () => {
      const i = Math.max(0, active - 1);
      items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    nextBtn?.addEventListener('click', () => {
      const i = Math.min(items.length - 1, active + 1);
      items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });

    setActive(0);
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
})();
