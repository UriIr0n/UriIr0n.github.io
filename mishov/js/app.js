/* =====================================================================
   הרכבה: מונים, טוסט, סרגל תחתון, וטעינה ראשונית.
   ===================================================================== */
window.App = (function () {
  var C = window.CFG;
  var toastTimer;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ספירה למעלה. המספר הזה הוא ההוכחה שמישהו כבר מילא, אז שווה
     שהעין תתפוס אותו זז. */
  function countTo(el, target) {
    if (!el) return;
    if (reduced || target <= 0) { el.textContent = target.toLocaleString('he-IL'); return; }
    var start = performance.now(), dur = 850;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('he-IL');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  function refreshCounters() {
    return window.DB.stats().then(function (st) {
      var n = st ? st.total : null;
      var live = document.getElementById('liveCount');
      var gNow = document.getElementById('gNow');
      var dNow = document.getElementById('dNow');
      var gGoal = document.getElementById('gGoal');
      var gFill = document.getElementById('gFill');
      var gLeft = document.getElementById('gLeft');

      if (n == null) {
        if (live) live.textContent = '';
        return st;
      }

      if (live) live.innerHTML = '<span class="dot"></span>' + n.toLocaleString('he-IL') + ' מילאו';
      countTo(gNow, n);
      countTo(dNow, n);
      if (gGoal) gGoal.textContent = C.GOAL;
      if (gFill) {
        // ההמתנה נותנת לפס להתמלא מול העין ולא להיות מלא כבר בטעינה
        setTimeout(function () {
          gFill.style.width = Math.min(100, (n / C.GOAL) * 100) + '%';
        }, 260);
      }
      if (gLeft) gLeft.textContent = n >= C.GOAL ? 'היעד הושג' : 'חסרים ' + (C.GOAL - n);
      return st;
    });
  }

  /* הסרגל התחתון מוסתר בזמן שהטופס עצמו על המסך, אחרת הוא מציע
     למשתמש לעשות בדיוק את מה שהוא כבר עושה. */
  function wireDock() {
    var dock = document.getElementById('dock');
    var survey = document.getElementById('survey');
    if (!dock || !survey || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      dock.classList.toggle('hide', entries[0].isIntersecting);
    }, { threshold: 0.12 }).observe(survey);
  }

  function hideDock() {
    var dock = document.getElementById('dock');
    if (dock) dock.classList.add('hide');
  }

  /* בדסקטופ הדשבורד פתוח תמיד. בטלפון הוא נשאר מקופל עד שמבקשים. */
  function wireFold() {
    var fold = document.getElementById('dashFold');
    if (!fold) return;
    var wide = window.matchMedia('(min-width: 700px)');
    function sync() { if (wide.matches) fold.open = true; }
    sync();
    if (wide.addEventListener) wide.addEventListener('change', sync);
  }

  function init() {
    // הקיר נטען ראשון, הוא הדבר שמושך את המבט וגם המקור לטבלת המשפטים בדשבורד
    window.Wall.load().then(function () {
      window.Dashboard.load();
    });
    refreshCounters();
    window.Survey.init();
    wireDock();
    wireFold();

    if (C.MOCK) {
      console.info('[משוב] מצב הדגמה, נתוני דמה. שום דבר לא נשלח לשרת.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { toast: toast, refreshCounters: refreshCounters, hideDock: hideDock };
})();
