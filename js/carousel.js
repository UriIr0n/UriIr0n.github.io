// קרוסלת כרטיסים גוללת (ללא ספריות): מספר כרטיסים מלאים לפי רוחב המסך (בלי חיתוך),
// דפדוף לפי "עמודים" (לא לפי כרטיס בודד) כדי שהחצים לא ייתקעו, וגרירה בעכבר בדסקטופ.
(function () {
  function setupCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const items = Array.from(track.children);
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    let currentPage = 0;

    function getCols() {
      const val = parseInt(getComputedStyle(root).getPropertyValue('--cols'), 10);
      return !val || val < 1 ? 1 : val;
    }
    function pageCount() {
      return Math.max(1, Math.ceil(items.length / getCols()));
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      const n = pageCount();
      for (let i = 0; i < n; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `עמוד ${i + 1} מתוך ${n}`);
        dot.addEventListener('click', () => goToPage(i));
        dotsWrap.appendChild(dot);
      }
    }

    function updateUI() {
      const max = pageCount() - 1;
      if (currentPage > max) currentPage = max;
      Array.from(dotsWrap.children).forEach((d, idx) => d.classList.toggle('on', idx === currentPage));
      if (prevBtn) prevBtn.disabled = currentPage === 0;
      if (nextBtn) nextBtn.disabled = currentPage === max;
    }

    function goToPage(p) {
      currentPage = Math.max(0, Math.min(pageCount() - 1, p));
      const targetIndex = Math.min(items.length - 1, currentPage * getCols());
      items[targetIndex].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      updateUI();
    }

    prevBtn?.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn?.addEventListener('click', () => goToPage(currentPage + 1));

    let scrollTimer;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const width = track.clientWidth;
        if (!width) return;
        const raw = Math.round(Math.abs(track.scrollLeft) / width);
        currentPage = Math.max(0, Math.min(pageCount() - 1, raw));
        updateUI();
      }, 120);
    }, { passive: true });

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

    window.addEventListener('resize', () => { buildDots(); updateUI(); });

    buildDots();
    updateUI();
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
})();
