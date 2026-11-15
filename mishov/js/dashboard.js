/* =====================================================================
   התמונה המצטברת. זו גם סיבת החזרה לאתר וגם מה שנכנס לדוח למבקר.
   ===================================================================== */
window.Dashboard = (function () {
  var C = window.CFG;

  // charts.js מקבל צבע כערך מפורש, כמו בשאר הדשבורדים באתר
  var PAL = { s1: '#189CAB', s2: '#3ECBDA', s3: '#E0A73B', s4: '#4FB477',
              s5: '#8E7CE0', s6: '#E06B6B', s7: '#D9679A', s8: '#E0813B',
              muted: '#7E98A6' };

  var THEME_COLORS = [PAL.s6, PAL.s3, PAL.s8, PAL.s7, PAL.s5, PAL.s1, PAL.s2];

  function cohortLabel(k) {
    var c = C.COHORTS.filter(function (x) { return x.key === k; })[0];
    return c ? c.label : k;
  }

  function render(st) {
    var host = document.getElementById('dashBody');
    if (!host) return;

    if (!st) {
      host.innerHTML = '<div class="gated">לא הצלחנו לטעון את הנתונים כרגע. רענן/י את הדף.</div>';
      return;
    }

    if (st.gated) {
      host.innerHTML = '<div class="gated">' +
        'עד כה <b>' + st.total + '</b> משובים. הסטטיסטיקה נפתחת החל מ־<b>' + st.min_n + '</b> משיבים — ' +
        'סף שנועד למנוע מצב שבו אפשר לצמצם פילוח עד לזיהוי אדם בודד.<br>' +
        '<a class="btn primary sm" href="#survey" style="margin-top:16px">אני ממלא/ת</a></div>';
      return;
    }

    host.innerHTML =
      '<div class="tiles">' +
        '<div class="tile col-4"><div id="k1"></div></div>' +
        '<div class="tile col-4"><div id="k2"></div></div>' +
        '<div class="tile col-4"><div id="k3"></div></div>' +

        '<div class="tile col-8">' +
          '<div class="t-head">חומרת הבעיה לפי נושא</div>' +
          '<div class="t-sub">ממוצע דירוג, 1 = לא בעיה · 5 = בעיה חמורה</div>' +
          '<div class="chart-box" id="cThemes"></div>' +
        '</div>' +

        '<div class="tile col-4">' +
          '<div class="t-head">מי ענה</div>' +
          '<div class="t-sub">פילוח המשיבים</div>' +
          '<div class="chart-box" id="cCohorts"></div>' +
        '</div>' +

        '<div class="tile col-6">' +
          '<div class="t-head">"עד כמה התואר הכין אותך לעולם העבודה"</div>' +
          '<div class="t-sub">התפלגות התשובות · ממוצע ' +
            (st.ready_avg != null ? window.Charts.fmt1(st.ready_avg) : '—') + ' מתוך 5</div>' +
          '<div class="chart-box" id="cReady"></div>' +
        '</div>' +

        '<div class="tile col-6">' +
          '<div class="t-head">מוכנות לפי מיומנות</div>' +
          '<div class="t-sub">הערכה עצמית ממוצעת, 1 עד 5</div>' +
          '<div class="chart-box" id="cSkills"></div>' +
        '</div>' +

        '<div class="tile col-12">' +
          '<div class="t-head">המשפטים המחוזקים ביותר</div>' +
          '<div class="t-sub">כמה אנשים סימנו "גם אני חוויתי את זה"</div>' +
          '<div id="topQuotes"></div>' +
        '</div>' +
      '</div>' +
      '<p class="data-note">כל דלי עם פחות מ־' + st.min_n + ' משיבים מוחזר ריק מהשרת ולא מוצג כאן.</p>';

    var Ch = window.Charts;

    Ch.kpi(document.getElementById('k1'), {
      label: 'משובים', value: st.total.toLocaleString('he-IL'),
      sub: 'מתוך יעד ' + C.GOAL, accent: true
    });
    Ch.kpi(document.getElementById('k2'), {
      label: 'מוכנות ממוצעת', value: st.ready_avg != null ? Ch.fmt1(st.ready_avg) : '—',
      sub: 'מתוך 5'
    });
    Ch.kpi(document.getElementById('k3'), {
      label: 'חיזוקים על משפטים', value: (st.endorsements || 0).toLocaleString('he-IL'),
      sub: (st.quotes_approved || 0) + ' משפטים מאושרים'
    });

    // נושאים, מהחמור לקל
    var themes = C.THEMES.map(function (t, i) {
      return { label: t.short || t.label, value: Number(st.themes[t.key]) || 0,
               color: THEME_COLORS[i % THEME_COLORS.length], key: t.key };
    }).filter(function (x) { return x.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });

    Ch.hbars(document.getElementById('cThemes'), {
      items: themes, max: 5, valueFmt: Ch.fmt1, labelWidth: 150, rowH: 34
    });

    // מי ענה
    var cohorts = Object.keys(st.cohorts || {}).map(function (k, i) {
      return { label: cohortLabel(k), value: st.cohorts[k], key: k,
               color: [PAL.s1, PAL.s2, PAL.s5][i % 3] };
    });
    Ch.donut(document.getElementById('cCohorts'), {
      items: cohorts, size: 170, centerTitle: String(st.total)
    });

    // התפלגות המוכנות
    var dist = st.ready_dist || {};
    Ch.columns(document.getElementById('cReady'), {
      categories: ['1', '2', '3', '4', '5'],
      series: [{ name: 'משיבים', values: [1, 2, 3, 4, 5].map(function (n) { return dist[String(n)] || 0; }),
                 color: PAL.s1 }],
      height: 230, showValues: true
    });

    // מיומנויות, מהחלש לחזק
    var skills = C.SKILLS.map(function (s) {
      return { label: s.short || s.label, value: Number(st.skills[s.key]) || 0, key: s.key,
               color: (Number(st.skills[s.key]) || 0) < 2.5 ? PAL.s6 : PAL.s1 };
    }).filter(function (x) { return x.value > 0; })
      .sort(function (a, b) { return a.value - b.value; });

    Ch.hbars(document.getElementById('cSkills'), {
      items: skills, max: 5, valueFmt: Ch.fmt1, labelWidth: 150, rowH: 32
    });

    renderTopQuotes();
  }

  function renderTopQuotes() {
    var host = document.getElementById('topQuotes');
    if (!host) return;
    var qs = window.Wall.all().slice()
      .sort(function (a, b) { return (b.endorsements || 0) - (a.endorsements || 0); })
      .slice(0, 5);

    if (!qs.length) { host.innerHTML = '<div class="chart-empty">עוד אין משפטים מאושרים</div>'; return; }

    host.innerHTML = qs.map(function (q) {
      return '<div class="gap ok" style="border-inline-start-color:#189CAB;margin-bottom:10px">' +
        '<p style="color:var(--ink);font-size:15px">' +
          String(q.body).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) +
        '</p>' +
        '<div class="next" style="color:var(--ink-3);font-size:13px">' +
          (q.endorsements || 0) + ' סטודנטים סימנו שחוו את זה גם</div></div>';
    }).join('');
  }

  function load() {
    return window.DB.stats().then(function (st) { render(st); return st; });
  }

  return { load: load, render: render };
})();
