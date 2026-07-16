// קרוסלת כרטיסים בסגנון "קאברפלואו": כרטיס מרכזי בפוקוס, שכנים גלויים בצדדים
// עם הטיה, הקטנה ושקיפות לפי מרחק מהמרכז. מבוסס על מיקום אמיתי בעמוד (לא על
// כיוון RTL/LTR של scrollLeft), כדי שהניווט לא "ייתקע". ללא ספריות חיצוניות.
// window.Carousel.init(root) חשוף כדי שגם תוכן שנבנה דינמית (כמו כרטיסי הפרויקטים,
// שמצוירים מחדש בכל שינוי סינון) יוכל להשתמש באותה קרוסלה.
window.Carousel = (function () {
  function setupCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const items = Array.from(track.children);
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    let current = 0;

    function offsetsFromCenter() {
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      return items.map((item) => {
        const r = item.getBoundingClientRect();
        return r.width ? (r.left + r.width / 2 - centerX) / r.width : 0;
      });
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `כרטיס ${i + 1} מתוך ${items.length}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    function updateUI() {
      Array.from(dotsWrap.children).forEach((d, idx) => d.classList.toggle('on', idx === current));
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === items.length - 1;
    }

    function goTo(i) {
      current = Math.max(0, Math.min(items.length - 1, i));
      items[current].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      updateUI();
    }

    function applyTilt(offsets) {
      offsets.forEach((offset, i) => {
        const dist = Math.min(Math.abs(offset), 1.6);
        const tilt = Math.max(-14, Math.min(14, offset * 14));
        items[i].style.setProperty('--dist', dist.toFixed(3));
        items[i].style.setProperty('--tilt', tilt.toFixed(2));
      });
    }

    let tickingTilt = false;
    function requestTilt() {
      if (tickingTilt) return;
      tickingTilt = true;
      requestAnimationFrame(() => { applyTilt(offsetsFromCenter()); tickingTilt = false; });
    }

    let scrollTimer;
    track.addEventListener('scroll', () => {
      requestTilt();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const offsets = offsetsFromCenter();
        let bestIdx = 0, bestAbs = Infinity;
        offsets.forEach((o, i) => {
          const a = Math.abs(o);
          if (a < bestAbs) { bestAbs = a; bestIdx = i; }
        });
        current = bestIdx;
        updateUI();
      }, 120);
    }, { passive: true });

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));

    // גרירה בעכבר בדסקטופ; במגע נשארת הגלילה הטבעית של המערכת
    let dragging = false, startX = 0, startScroll = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      track.classList.add('dragging');
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    window.addEventListener('resize', requestTilt);

    buildDots();
    updateUI();
    requestTilt();
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

  return { init: setupCarousel };
})();
