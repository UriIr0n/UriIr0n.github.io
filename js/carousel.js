// קרוסלה אינסופית בכיוון אחד: הכרטיסים נפרסים לכל רוחב הסקשן וזזים ברצף,
// בלי "כרטיס מרכזי" ובלי צד ריק. הפריטים משוכפלים עד שהם מכסים לפחות פעמיים
// את רוחב התצוגה, כך שהתנועה נראית רציפה, וה-offset מתאפס מודולו רוחב הרצף.
// המערכת מבוססת transform בלבד (לא scrollLeft), ולכן היא לא "נתקעת" ב-RTL.
// window.Carousel.init(root) חשוף כדי שגם תוכן שנבנה דינמית יוכל להשתמש בה.
window.Carousel = (function () {
  const SPEED = 26; // פיקסלים בשנייה

  function setupCarousel(root) {
    // קריאה חוזרת על אותו root (למשל דף שהיה מוסתר בטעינה ונחשף אחר-כך) חייבת
    // לפרק את המופע הקודם קודם: שני לולאות rAF/ResizeObserver על אותו track
    // "נלחמות" זו בזו על ה-transform, וזה מה שגרם לספירת שכפולים שגויה.
    if (root.__carouselCleanup) root.__carouselCleanup();

    const track = root.querySelector('[data-carousel-track]');
    // מסננים שכפולים ישנים כבר בזמן הלכידה - לא רק מוחקים אותם אחר-כך - כדי
    // שה"מקוריים" לעולם לא יכללו אלמנט שכבר הוסר מה-DOM (רוחב 0 קבוע).
    const originals = Array.from(track.children).filter((n) => !n.hasAttribute('data-carousel-clone'));
    if (!originals.length) return;

    // ניקוי שאריות מאתחול קודם (הכרטיסים מצוירים מחדש בכל סינון)
    track.querySelectorAll('[data-carousel-clone]').forEach((n) => n.remove());

    // אין פקדי חיצים: הקרוסלה זזה מעצמה בכיוון אחד. אם נשארו פקדים ישנים בדף,
    // מסירים. גם פקד העצירה מוסר כאן, כי setupCarousel יכול לרוץ שוב על אותו
    // root ואחרת ייערמו כמה כפתורים.
    root.querySelector('[data-carousel-controls]')?.remove();
    root.querySelector('.carousel-toggle')?.remove();

    let offset = 0;      // כמה הרצף הוזז (px, תמיד גדל)
    let seqWidth = 0;    // רוחב רצף מקורי אחד כולל הרווחים
    let paused = false;
    let dragging = false;
    let stopped = false; // מופע שפורק - לולאת ה-rAF שלו מפסיקה להתקדם

    // התנועה כאן רצה על rAF ועל transform, ולכן בלוק ה-prefers-reduced-motion
    // ב-CSS (שמאפס רק animation/transition-duration) לא נוגע בה בכלל. בודקים
    // בעצמנו, ומכבדים גם שינוי הגדרה תוך כדי גלישה.
    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = reduceMQ.matches;

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
      if (stopped) return;
      if (last) {
        const dt = Math.min(now - last, 60) / 1000;
        if (!paused && !userPaused && !dragging) advance(SPEED * dt);
      }
      last = now;
      requestAnimationFrame(tick);
    }

    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });
    // במגע ובמקלדת אין hover, ולכן בלי אלה אין שום דרך לעצור כדי לקרוא
    root.addEventListener('focusin', () => { paused = true; });
    root.addEventListener('focusout', () => { paused = false; });

    // פקד עצירה גלוי
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'carousel-toggle';
    const syncToggle = () => {
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-label', userPaused ? 'הפעלת תנועת הקרוסלה' : 'עצירת תנועת הקרוסלה');
      toggle.textContent = userPaused ? '▶' : '❚❚';
    };
    toggle.addEventListener('click', () => { userPaused = !userPaused; syncToggle(); });
    syncToggle();
    root.appendChild(toggle);

    // מי שמדליק "הפחתת תנועה" תוך כדי, עוצר מיד
    const onReduceChange = (e) => { userPaused = e.matches; syncToggle(); };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduceChange);

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
      if (stopped) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (!stopped) { offset = 0; fill(); render(); } }, 150);
    }
    window.addEventListener('resize', rebuild);

    // כשהסקשן נחשף לראשונה (או משנה רוחב) מודדים מחדש ומשכפלים לפי הרוחב האמיתי
    let observer = null;
    if (window.ResizeObserver) {
      let lastW = 0;
      observer = new ResizeObserver(() => {
        const w = Math.round(root.getBoundingClientRect().width);
        if (w && Math.abs(w - lastW) > 2) { lastW = w; rebuild(); }
      });
      observer.observe(root);
    }

    root.__carouselCleanup = () => {
      stopped = true;
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', rebuild);
      if (reduceMQ.removeEventListener) reduceMQ.removeEventListener('change', onReduceChange);
      observer?.disconnect();
    };

    fill();
    render();
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

  return { init: setupCarousel };
})();
