// קרוסלה אינסופית בכיוון אחד: הכרטיסים נפרסים לכל רוחב הסקשן וזזים ברצף,
// בלי "כרטיס מרכזי" ובלי צד ריק. הפריטים משוכפלים עד שהם מכסים לפחות פעמיים
// את רוחב התצוגה, כך שהתנועה נראית רציפה, וה-offset מתאפס מודולו רוחב הרצף.
// המערכת מבוססת transform בלבד (לא scrollLeft), ולכן היא לא "נתקעת" ב-RTL.
// window.Carousel.init(root) חשוף כדי שגם תוכן שנבנה דינמית יוכל להשתמש בה.
window.Carousel = (function () {
  const SPEED = 26; // פיקסלים בשנייה

  function setupCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const originals = Array.from(track.children);
    if (!originals.length) return;

    // ניקוי שאריות מאתחול קודם (הכרטיסים מצוירים מחדש בכל סינון)
    track.querySelectorAll('[data-carousel-clone]').forEach((n) => n.remove());

    // אין פקדים: הקרוסלה זזה מעצמה בכיוון אחד. אם נשארו פקדים ישנים בדף, מסירים.
    root.querySelector('[data-carousel-controls]')?.remove();

    let offset = 0;      // כמה הרצף הוזז (px, תמיד גדל)
    let seqWidth = 0;    // רוחב רצף מקורי אחד כולל הרווחים
    let paused = false;
    let dragging = false;

    function gapPx() {
      const g = parseFloat(getComputedStyle(track).columnGap || '0');
      return Number.isFinite(g) ? g : 0;
    }

    function measure() {
      const gap = gapPx();
      seqWidth = originals.reduce((sum, el) => sum + el.getBoundingClientRect().width + gap, 0);
    }

    // הסקשנים מוסתרים בזמן טעינה, ולכן רוחב ה-root יכול לצאת 0 באתחול.
    // נופלים חזרה לרוחב החלון כדי שתמיד ייווצרו מספיק שכפולים.
    function viewportWidth() {
      return Math.max(root.getBoundingClientRect().width, window.innerWidth || 0);
    }

    function fill() {
      track.querySelectorAll('[data-carousel-clone]').forEach((n) => n.remove());
      measure();
      if (!seqWidth) return;
      const needed = Math.ceil((viewportWidth() * 2) / seqWidth) + 1;
      for (let c = 0; c < needed; c++) {
        originals.forEach((el) => {
          const clone = el.cloneNode(true);
          clone.setAttribute('data-carousel-clone', '');
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('a, button, input').forEach((f) => f.setAttribute('tabindex', '-1'));
          track.appendChild(clone);
        });
      }
    }

    function render() {
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    }

    function advance(px) {
      if (!seqWidth) return;
      offset += px;
      // מודולו: כשהרצף הראשון יצא מהמסך מחזירים אחורה בדיוק רוחב רצף אחד
      while (offset >= seqWidth) offset -= seqWidth;
      while (offset < 0) offset += seqWidth;
      render();
    }

    let last = 0;
    function tick(now) {
      if (last) {
        const dt = Math.min(now - last, 60) / 1000;
        if (!paused && !dragging) advance(SPEED * dt);
      }
      last = now;
      requestAnimationFrame(tick);
    }

    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });

    // גרירה בעכבר, גם היא רק קדימה (גרירה אחורה לא מוגבלת ויזואלית כי הרצף אינסופי)
    let startX = 0, startOffset = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      track.classList.add('dragging');
      startX = e.clientX;
      startOffset = offset;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      offset = startOffset + (e.clientX - startX);
      while (offset >= seqWidth) offset -= seqWidth;
      while (offset < 0) offset += seqWidth;
      render();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    let resizeTimer;
    function rebuild() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { offset = 0; fill(); render(); }, 150);
    }
    window.addEventListener('resize', rebuild);

    // כשהסקשן נחשף לראשונה (או משנה רוחב) מודדים מחדש ומשכפלים לפי הרוחב האמיתי
    if (window.ResizeObserver) {
      let lastW = 0;
      new ResizeObserver(() => {
        const w = Math.round(root.getBoundingClientRect().width);
        if (w && Math.abs(w - lastW) > 2) { lastW = w; rebuild(); }
      }).observe(root);
    }

    fill();
    render();
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

  return { init: setupCarousel };
})();
