/* =====================================================================
   דשבורד 4 - פילוח ארגוני | נאס"א
   שחזור של "פילוח ארגוני - סגל בכיר" (עץ דרגות, 3 שכבות תצוגה, רב-שנתי)
   ===================================================================== */
const DashNasa = (() => {
  const D = DATA.nasa;
  const C = Charts;
  const root = document.getElementById('page-nasa');

  const state = { center: null, division: null, view: 'count' };
  let ui = null, built = false;

  const VIEWS = [
    { key: 'count', label: 'סגל (מצבה)', unit: '', field: 'count' },
    { key: 'fte', label: 'תקנים (FTE)', unit: '', field: 'fte' },
    { key: 'hours', label: 'שעות סימולטור', unit: ' ש\'', field: 'hours' },
  ];

  function build() {
    ui = Shell.build(root, {
      key: 'nasa', emoji: '🛰️',
      title: 'נאס"א: הרכב הסגל, דרגות ושעות סימולטור',
      original: 'פילוח ארגוני: סגל בכיר (Power BI)',
      about: {
        problem: 'שאלות בסיסיות על הסגל הבכיר (כמה אנשים בכל מסלול ודרגה, איפה התקנים מאוישים ואיפה חסרים, וכמה מההוראה נשענת בפועל על מרצים מן החוץ) דרשו כל פעם שליפות ידניות ממקורות שונים. לא הייתה נקודת-על אחת שעושה סדר בארגון.',
        built: [
          'עץ ארגוני אינטראקטיבי: מסלול ← דרגה, עם שלוש שכבות תצוגה מתחלפות: מצבה, תקנים ושעות (במקור: Bookmarks)',
          'תמונת תקנים: איפה מאויש, איפה חסר, ואיפה הפער נסגר בפועל על ידי מרצים מן החוץ',
          'פילוחי עומק: מגדר, קביעות ופנסיונרים לפי מסלול',
          'עמוד השוואה רב-שנתית: שעות סגל מול שעות חוץ מול כמות סטודנטים: לאן זורם התקציב',
        ],
        tech: [
          '60+ מדדי DAX (כמות, אחוז, FTE ושעות לכל צומת בעץ)',
          'Custom Visual: עץ היררכי',
          'Bookmarks לשלוש שכבות תצוגה',
          'מיפוי מחלקות "מצוי ← רצוי" בטבלת גישור',
        ],
        impact: 'נקודת-העל של ההנהלה האקדמית על הסגל הבכיר: מבט אחד שעונה איפה יש תקנים, איפה אין ומה זה אומר על תכנון השנה הבאה. אפיינתי את הצרכים מול ההנהלה, בניתי והצגתי.',
      },
      tabs: [
        { key: 'org', label: 'הרכב הסוכנות' },
        { key: 'multi', label: 'השוואה רב-שנתית' },
      ],
    });
    ui.onTab(() => render());
    built = true;
  }

  const filteredDivisions = () => D.divisions.filter(dv =>
    (!state.center || dv.center === state.center) &&
    (!state.division || dv.name === state.division));

  // סכימת תא (מסלול+דרגה) על פני המחלקות המסוננות
  function sumCell(track, rank, field) {
    return filteredDivisions().reduce((a, dv) => a + (dv.cells[track][rank]?.[field] || 0), 0);
  }
  const round1 = v => Math.round(v * 10) / 10;

  /* ================= טאב 1: עץ הסוכנות ================= */
  function renderOrg(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>מרכז (פקולטה)</label><div id="na-center"></div></div>
        <div class="slicer"><label>מחלקה</label><div id="na-division"></div></div>
        <div class="slicer"><label>שכבת תצוגה</label><div id="na-view"></div></div>
        <button class="clear-f" id="na-clear">✕ נקה חיתוכים</button>
      </div>
      <div class="tiles">
        <div class="tile col-12"><div class="t-head"><h3 id="na-tree-title"></h3><span class="t-sub">מסלול ← דרגה · במקור שלוש שכבות Bookmarks</span></div>
          <div class="org-tree" id="na-tree"></div></div>
        <div class="tile col-4"><div class="t-head"><h3>מגדר לפי מסלול</h3></div><div id="na-gender"></div></div>
        <div class="tile col-4"><div class="t-head"><h3>קביעות בסוכנות</h3></div><div id="na-tenure"></div></div>
        <div class="tile col-4"><div class="t-head"><h3>קבלני חוץ</h3><span class="t-sub">במקור: מרצים מן החוץ · לפי דרגה</span></div><div id="na-guests"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('na-center'), {
      options: D.centers.map(c => ({ key: c.name, label: c.name.replace('מרכז ', '') })), value: state.center, allLabel: 'הכל',
      onChange: v => { state.center = v; state.division = null; render(); },
    });
    C.select($('na-division'), {
      options: (state.center ? D.centers.filter(c => c.name === state.center) : D.centers).flatMap(c => c.divisions),
      value: state.division, allLabel: 'כל המחלקות',
      onChange: v => { state.division = v; render(); },
    });
    C.seg($('na-view'), {
      options: VIEWS.map(v => ({ key: v.key, label: v.label })), value: state.view,
      onChange: v => { state.view = v || 'count'; render(); },
    });
    $('na-clear').addEventListener('click', () => { Object.assign(state, { center: null, division: null }); render(); });

    const vw = VIEWS.find(v => v.key === state.view);
    const field = vw.field;
    const fmtV = v => field === 'fte' ? C.fmt1(round1(v)) : C.fmt(Math.round(v));

    $('na-tree-title').textContent = `עץ הסוכנות: ${vw.label}` + (state.division ? ` · ${state.division}` : state.center ? ` · ${state.center}` : ' · כלל הסוכנות');

    // חישוב העץ
    let grand = 0;
    const trackData = D.tracks.map(tr => {
      const ranks = tr.ranks.map(rk => ({ rank: rk, val: sumCell(tr.key, rk, field) }));
      const total = ranks.reduce((a, r) => a + r.val, 0);
      grand += total;
      return { tr, ranks, total };
    });

    $('na-tree').innerHTML = `
      <div class="org-root"><b>${fmtV(grand)}</b><span>${vw.label} · סה"כ הסוכנות</span></div>
      <div class="org-connector"></div>
      <div class="org-branches">
        ${trackData.map(({ tr, ranks, total }) => `
          <div class="org-branch">
            <div class="org-track" style="border-top:3px solid ${tr.color}">
              <span class="tn">${tr.name}</span>
              <b>${fmtV(total)}</b>
              <span class="tp">${C.pctF(grand ? total / grand * 100 : 0, 1)} מהסוכנות · במקור: ${tr.orig}</span>
            </div>
            <div class="org-ranks">
              ${ranks.map(r => `<div class="org-rank" style="border-inline-start:3px solid ${tr.color}">
                <span class="rn">${r.rank}</span><b>${fmtV(r.val)}</b>
                <span class="rp">${C.pctF(total ? r.val / total * 100 : 0, 0)}</span>
              </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;

    // מגדר לפי מסלול - מפוצל פרופורציונלית לפי גודל מסלול
    const dvs = filteredDivisions();
    const totCount = dvs.reduce((a, x) => a + x.total, 0) || 1;
    const fShare = dvs.reduce((a, x) => a + x.gender.f, 0) / totCount;
    C.columns($('na-gender'), {
      categories: D.tracks.map(t => t.name),
      series: [
        { name: 'נשים', color: '#d55181', values: D.tracks.map((t, i) => Math.round(trackCount(t) * (fShare + [0.02, 0.09, 0.05, -0.06][i]))) },
        { name: 'גברים', color: '#3987e5', values: D.tracks.map((t, i) => trackCount(t) - Math.round(trackCount(t) * (fShare + [0.02, 0.09, 0.05, -0.06][i]))) },
      ],
      height: 240,
    });
    function trackCount(t) { return t.ranks.reduce((a, rk) => a + sumCell(t.key, rk, 'count'), 0); }

    const tenured = dvs.reduce((a, x) => a + x.tenure, 0);
    C.donut($('na-tenure'), {
      items: [
        { label: 'בעלי קביעות', key: 'y', color: '#199e70', value: tenured },
        { label: 'בהליך / ללא', key: 'n', color: '#c98500', value: Math.max(0, totCount - tenured) },
      ], centerTitle: 'אנשי סגל', size: 165, valueLabel: 'אנשי סגל',
    });

    const guests = D.guestRanks.map((gr, i) => ({
      label: gr, key: gr, color: ['#9085e9', '#3987e5', '#199e70', '#c98500'][i],
      value: dvs.reduce((a, x) => a + x.guests[gr], 0),
    }));
    C.hbars($('na-guests'), { items: guests, valueLabel: 'קבלנים', rowH: 34 });

    const groundShare = trackData[3].total / (grand || 1) * 100;
    ui.setStory(`שימו לב ל<b>צוות הקרקע</b> (במקור: המסלול המקביל), ${C.pctF(groundShare, 1)} מהסוכנות בלבד, אבל בלעדיו אין שיגור. החליפו שכבת תצוגה בין <b>מצבה ← תקנים ← שעות</b> ותראו איך אותו עץ מספר שלושה סיפורים שונים לגמרי. זה בדיוק מה שה-Bookmarks עשו בדשבורד המקורי.`);
  }

  /* ================= טאב 2: רב-שנתי ================= */
  function renderMulti(view) {
    view.innerHTML = `
      <div class="tiles">
        <div class="tile col-4" id="nm-k1"></div>
        <div class="tile col-4" id="nm-k2"></div>
        <div class="tile col-4" id="nm-k3"></div>
        <div class="tile col-12"><div class="t-head"><h3>חמש שנים במבט אחד: שעות סימולטור מול מועמדויות</h3></div><div id="nm-lines"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    const y = D.yearly;
    const last = y.at(-1), first = y[0];
    const contrShareNow = last.contractorHours / last.totalHours * 100;
    const contrShareThen = first.contractorHours / first.totalHours * 100;

    C.kpi($('nm-k1'), { label: 'סך שעות סימולטור 2026', value: C.fmt(last.totalHours), accent: true, sub: `לעומת ${C.fmt(first.totalHours)} ב-2022` });
    C.kpi($('nm-k2'), { label: 'מועמדויות לתוכנית 2026', value: C.fmt(last.applications), sub: `צמיחה של ${C.pctF((last.applications / first.applications - 1) * 100, 0)} בחמש שנים` });
    C.kpi($('nm-k3'), { label: 'תלות בקבלני חוץ', value: C.pctF(contrShareNow, 1), sub: `מסך השעות · היה ${C.pctF(contrShareThen, 1)} ב-2022` });

    C.lines($('nm-lines'), {
      x: y.map(r => String(r.year)),
      series: [
        { name: 'סך שעות סימולטור', color: '#3987e5', values: y.map(r => r.totalHours) },
        { name: 'שעות סגל נאס"א', color: '#199e70', values: y.map(r => r.staffHours) },
        { name: 'שעות קבלני חוץ', color: '#c98500', values: y.map(r => r.contractorHours) },
        { name: 'מועמדויות לתוכנית האסטרונאוטים', color: '#9085e9', values: y.map(r => r.applications), dash: '6 4' },
      ],
      height: 330,
    });

    ui.setStory(`הסוכנות גדלה, אבל <b>שעות הקבלנים צומחות מהר יותר משעות הסגל</b>. התלות במיקור חוץ עלתה מ-${C.pctF(contrShareThen, 1)} ל-${C.pctF(contrShareNow, 1)}. בפרויקט המקורי הגרף המקביל, שעות סגל מול מרצים מן החוץ, עלה לדיון התקציב השנתי. שקף אחד, החלטה אחת.`);
  }

  function render() {
    if (!built) build();
    const tab = ui.activeTab;
    if (tab === 'org') renderOrg(ui.views.org);
    if (tab === 'multi') renderMulti(ui.views.multi);
  }

  return { render };
})();
