/* =====================================================================
   קיר המשפטים — הרץ ברקע ב-hero, והאינטראקטיבי בסקשן שלו.
   ===================================================================== */
window.Wall = (function () {
  var C = window.CFG;
  var quotes = [];      // מאושרים מהשרת
  var pending = [];     // המשפט של המשתמש הנוכחי, מקומית בלבד
  var filter = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function themeLabel(k) {
    var t = C.THEMES.filter(function (x) { return x.key === k; })[0];
    return t ? t.label : 'כללי';
  }

  /* ---------------- הקיר הרץ ברקע ----------------
     שלושה טורים, כל אחד עם הרשימה פעמיים כדי שהלולאה תיסגר בלי קפיצה.
     כשאין משפטים מאושרים הקיר נשאר ריק — לא ממלאים אותו בטקסט מומצא. */
  function renderHero() {
    var el = document.getElementById('heroWall');
    if (!el) return;
    if (!quotes.length) { el.innerHTML = ''; return; }

    var cols = [[], [], []];
    quotes.forEach(function (q, i) { cols[i % 3].push(q); });

    el.innerHTML = cols.map(function (col, i) {
      if (!col.length) return '';
      var cards = col.map(function (q) {
        return '<div class="wq">' + esc(q.body) + '</div>';
      }).join('');
      return '<div class="col ' + 'abc'[i] + '">' + cards + cards + '</div>';
    }).join('');
  }

  /* ---------------- פילטרים ---------------- */
  function renderFilters() {
    var el = document.getElementById('wallFilters');
    if (!el) return;
    var used = {};
    quotes.forEach(function (q) { used[q.theme || 'other'] = (used[q.theme || 'other'] || 0) + 1; });

    var html = '<button type="button" class="chip' + (filter ? '' : ' on') + '" data-t="">הכל</button>';
    C.THEMES.forEach(function (t) {
      if (!used[t.key]) return;
      html += '<button type="button" class="chip' + (filter === t.key ? ' on' : '') +
              '" data-t="' + t.key + '">' + t.label + ' · ' + used[t.key] + '</button>';
    });
    el.innerHTML = html;

    el.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.dataset.t || null;
        renderFilters(); renderGrid();
      });
    });
  }

  /* ---------------- הרשת האינטראקטיבית ---------------- */
  function renderGrid() {
    var el = document.getElementById('wallGrid');
    var note = document.getElementById('wallNote');
    if (!el) return;

    var done = window.DB.endorsedSet();
    var list = pending.concat(quotes.filter(function (q) {
      return !filter || q.theme === filter;
    }));

    if (!list.length) {
      el.innerHTML = '<div class="gated">עוד לא אושרו משפטים לפרסום. ' +
        '<b>המשפט הראשון על הקיר יכול להיות שלך.</b></div>';
      if (note) note.textContent = '';
      return;
    }

    el.innerHTML = list.map(function (q) {
      if (q._pending) {
        return '<article class="quote pending">' +
          '<p class="quote-body">' + esc(q.body) + '</p>' +
          '<div class="quote-meta"><span class="quote-theme warn">ממתין לאישור</span>' +
          '<span>יעלה לקיר אחרי בדיקה</span></div></article>';
      }
      var isDone = done.has(q.id);
      return '<article class="quote">' +
        '<p class="quote-body">' + esc(q.body) + '</p>' +
        '<div class="quote-meta">' +
          '<span class="quote-theme">' + esc(themeLabel(q.theme)) + '</span>' +
          '<button type="button" class="endorse' + (isDone ? ' done' : '') + '" data-id="' + q.id + '" ' +
            (isDone ? 'aria-disabled="true"' : '') + '>' +
            (isDone ? 'חיזקת' : 'גם אני חוויתי את זה') +
            ' · <b>' + (q.endorsements || 0) + '</b></button>' +
        '</div></article>';
    }).join('');

    if (note) {
      note.textContent = quotes.length + ' משפטים מאושרים · ' +
        quotes.reduce(function (a, q) { return a + (q.endorsements || 0); }, 0) + ' חיזוקים';
    }

    el.querySelectorAll('.endorse:not(.done)').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = Number(b.dataset.id);
        var q = quotes.filter(function (x) { return x.id === id; })[0];
        if (!q) return;
        // עדכון אופטימי: התשובה מהשרת עשויה להיות מטמון, אז לא קוראים מחדש
        q.endorsements = (q.endorsements || 0) + 1;
        window.DB.endorse(id);
        b.classList.add('done');
        b.setAttribute('aria-disabled', 'true');
        b.innerHTML = 'חיזקת · <b>' + q.endorsements + '</b>';
        window.App.toast('נספר. תודה.');
      });
    });
  }

  function render() { renderHero(); renderFilters(); renderGrid(); }

  function load() {
    return window.DB.approvedQuotes().then(function (qs) {
      quotes = qs || [];
      render();
      return quotes;
    });
  }

  // המשפט של המשתמש מוצג לו מיד, מסומן כממתין. הוא לא נשלח לאף אחד אחר.
  function addPending(body) {
    if (!body) return;
    pending = [{ body: body, _pending: true }];
    filter = null;
    renderFilters(); renderGrid();
  }

  return { load: load, render: render, addPending: addPending,
           all: function () { return quotes; } };
})();
