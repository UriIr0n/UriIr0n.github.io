/* =====================================================================
   הרכבה: מונים, טוסט, וטעינה ראשונית.
   ===================================================================== */
window.App = (function () {
  var C = window.CFG;
  var toastTimer;

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function refreshCounters() {
    return window.DB.stats().then(function (st) {
      var n = st ? st.total : null;
      var bCount = document.getElementById('bCount');
      var gNow = document.getElementById('gNow');
      var gGoal = document.getElementById('gGoal');
      var gFill = document.getElementById('gFill');
      var gLeft = document.getElementById('gLeft');

      if (bCount) bCount.textContent = n == null ? '—' : n.toLocaleString('he-IL');
      if (gNow) gNow.textContent = n == null ? '—' : n.toLocaleString('he-IL');
      if (gGoal) gGoal.textContent = C.GOAL;
      if (gFill) gFill.style.width = Math.min(100, ((n || 0) / C.GOAL) * 100) + '%';
      if (gLeft) {
        gLeft.textContent = n == null ? '' :
          (n >= C.GOAL ? 'היעד הושג' : 'חסרים ' + (C.GOAL - n));
      }
      return st;
    });
  }

  function init() {
    // הקיר נטען ראשון — הוא הדבר הראשון שנראה, וגם המקור לטבלת המשפטים בדשבורד
    window.Wall.load().then(function () {
      window.Dashboard.load();
    });
    refreshCounters();
    window.Survey.init();

    if (C.MOCK) {
      console.info('[משוב] מצב הדגמה — נתוני דמה, שום דבר לא נשלח לשרת.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { toast: toast, refreshCounters: refreshCounters };
})();
