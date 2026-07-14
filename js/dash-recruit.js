/* =====================================================================
   דשבורד 1 - גיוס | NovaTech Inc. (הייטק)
   שחזור של "דשבורד גיוס" - סטטוס משרות, גיל משרה, מגמות שנתי
   ===================================================================== */
const DashRecruit = (() => {
  const D = DATA.recruit;
  const C = Charts;
  const root = document.getElementById('page-recruit');
  const GROUP_COLORS = { 'טכנולוגי': '#3987e5', 'עסקי': '#199e70' };
  const REASON_COLORS = ['#3987e5', '#9085e9', '#199e70', '#c98500', '#d55181'];

  const state = {
    year: 2026, month: 5, fillType: null,
    deptSel: null, reasonSel: null,
    ageDept: null, only100: false,
    trendYear: 2026,
  };
  let ui = null, built = false;

  function build() {
    ui = Shell.build(root, {
      key: 'recruit', emoji: '🚀',
      title: 'גיוס ב-NovaTech: חדר המצב של צוות הרכש',
      original: 'דשבורד גיוס ארגוני (Power BI)',
      about: {
        problem: 'לא היה שום דוח שעונה על השאלה "כמה משרות פתוחות לנו עכשיו, וכמה זמן הן פתוחות". אפיינתי מאפס שלושה דוחות מקור מול מערכת "אדם" (משרות חדשות, פתוחות וסגורות), וישבתי עם המגייסות, ראש מדור הגיוס והסמנכ"ל כדי להבין מה כל אחד מהם צריך לראות כדי לקבל החלטה.',
        built: [
          'עמוד סטטוס: משרות פתוחות במצטבר, כמה נפתחו ונסגרו החודש, סיבות פתיחה ופילוחים לצלילה',
          'עמוד "גיל משרה" עבור המגייסות: כמה זמן כל משרה פתוחה, איזו לתעדף, ואם משרה לא נסגרת, לעצור ולברר למה',
          'דוח מגמות שנתי שמזהה עונות שיא ושפל: לפני שיא נערכים מראש, ובשפל מתפנים לסגור את המשרות הוותיקות',
          'פייפליין Power Query שמאחד אוטומטית את קובצי המקור מתוך מבנה תיקיות (שנה ← חודש ← קובץ)',
        ],
        tech: [
          'Power Query: Folder.Files ואיחוד דינמי',
          'מדדי DAX: משרות פתוחות נכון-לחודש, אחוז חסרים לתקן',
          'Bookmarks + עמודי הרחבה (חלונות קופצים)',
          'מיון חכם עם מדד עזר (Smart Sort)',
        ],
        impact: 'כלי עבודה תפעולי בשימוש שוטף של המגייסות, ראש מדור הגיוס והסמנכ"ל. מתעדכן פעמיים בחודש: באמצע החודש עם הנתונים שהצטברו עד אז, ובסוף החודש עם התמונה הסגורה. אפיינתי, בניתי והצגתי אותו בעצמי.',
      },
      tabs: [
        { key: 'status', label: 'סטטוס משרות' },
        { key: 'age', label: 'גיל משרות פתוחות' },
        { key: 'trend', label: 'מגמות שנתי' },
      ],
    });
    ui.onTab(() => render());
    built = true;
  }

  /* ---------- עזרי סינון ---------- */
  function filteredPositions() {
    return D.positions.filter(p =>
      (!state.fillType || p.fillType === state.fillType) &&
      (!state.deptSel || p.dept === state.deptSel) &&
      (!state.reasonSel || p.reason === state.reasonSel));
  }
  const monthRec = () => D.monthly.find(m => m.year === state.year && m.month === state.month);

  /* ================= טאב 1: סטטוס משרות ================= */
  function renderStatus(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>שנה</label><div id="rc-year"></div></div>
        <div class="slicer"><label>חודש</label><div id="rc-month"></div></div>
        <div class="slicer"><label>סוג איוש</label><div id="rc-fill"></div></div>
        <button class="clear-f" id="rc-clear">✕ נקה חיתוכים</button>
      </div>
      <div class="tiles">
        <div class="tile col-3" id="rc-kpi1"></div>
        <div class="tile col-3" id="rc-kpi2"></div>
        <div class="tile col-3" id="rc-kpi3"></div>
        <div class="tile col-3" id="rc-kpi4"></div>
        <div class="tile col-6"><div class="t-head"><h3>משרות פתוחות לפי סיבת גיוס</h3><span class="t-sub">לחיצה מסננת</span></div><div id="rc-donut"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>משרות פתוחות לפי מחלקה</h3><span class="t-sub">לחיצה מסננת</span></div><div id="rc-bars"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>אחוז תקנים חסרים לפי מחלקה</h3><span class="t-sub">חסרים מתוך תקן מאושר</span></div><div id="rc-gap"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>המשרות הפתוחות: פירוט</h3><span class="t-sub">לפי החיתוך הנוכחי · מיון בלחיצה</span></div><div id="rc-table"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);

    // סלייסרים
    C.seg($('rc-year'), {
      options: [{ key: 2025, label: '2025' }, { key: 2026, label: '2026' }],
      value: state.year,
      onChange: v => { state.year = v; state.month = Math.min(state.month, state.year === 2026 ? 5 : 11); render(); },
    });
    C.select($('rc-month'), {
      options: D.monthly.filter(m => m.year === state.year).map(m => ({ key: m.month, label: m.monthName })),
      value: state.month, allLabel: 'בחר חודש…',
      onChange: v => { state.month = v == null ? (state.year === 2026 ? 5 : 11) : +v; render(); },
    });
    C.seg($('rc-fill'), {
      options: D.fillTypes.map(f => ({ key: f, label: f })), value: state.fillType, allLabel: 'הכל',
      onChange: v => { state.fillType = v; render(); },
    });
    $('rc-clear').addEventListener('click', () => {
      Object.assign(state, { fillType: null, deptSel: null, reasonSel: null }); render();
    });

    // נתונים מסוננים
    const pos = filteredPositions();
    const mr = monthRec();
    const share = pos.length / D.positions.length || 0;
    const openNow = pos.length;

    C.kpi($('rc-kpi1'), { label: `נסגרו ב${mr.monthName}`, value: C.fmt(Math.round(mr.closed * share)), sub: 'משרות שאוישו' });
    C.kpi($('rc-kpi2'), { label: `נפתחו ב${mr.monthName}`, value: C.fmt(Math.round(mr.opened * share)), sub: 'דרישות גיוס חדשות' });
    C.kpi($('rc-kpi3'), { label: 'משרות פתוחות', value: C.fmt(openNow), accent: true, sub: state.deptSel || state.reasonSel || state.fillType ? 'לפי החיתוך הנוכחי' : 'בכל החברה' });
    C.kpi($('rc-kpi4'), { label: 'אחוז פתוחות מהמצבה', value: C.pctF(openNow / D.headcount * 100, 1), sub: `מתוך ${C.fmt(D.headcount)} עובדים` });

    // דונאט סיבות
    const byReason = D.reasons.map((rs, i) => ({
      label: rs, key: rs, color: REASON_COLORS[i],
      value: pos.filter(p => p.reason === rs).length,
    })).filter(x => x.value > 0);
    C.donut($('rc-donut'), {
      items: byReason, centerTitle: 'משרות', valueLabel: 'משרות',
      selectedKey: state.reasonSel,
      onClick: it => { state.reasonSel = state.reasonSel === it.key ? null : it.key; render(); },
    });

    // מחלקות
    const deptCounts = D.depts.map(d => ({
      label: d.name, key: d.name, color: GROUP_COLORS[d.group],
      value: pos.filter(p => p.dept === d.name).length,
      extraTip: `<div class="row">אגף: <b>${d.group}</b></div>`,
    })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
    C.hbars($('rc-bars'), {
      items: deptCounts, valueLabel: 'משרות פתוחות',
      legend: [{ label: 'אגף טכנולוגי', color: GROUP_COLORS['טכנולוגי'] }, { label: 'אגף עסקי', color: GROUP_COLORS['עסקי'] }],
      selectedKey: state.deptSel,
      onClick: it => { state.deptSel = state.deptSel === it.key ? null : it.key; render(); },
    });

    // אחוז חסרים
    const gaps = D.depts.map(d => {
      const q = D.quota[d.name];
      return {
        label: d.name, key: d.name, color: GROUP_COLORS[d.group],
        value: +(q.missing / q.quota * 100).toFixed(1),
        extraTip: `<div class="row">חסרים: <b>${q.missing}</b> מתוך תקן <b>${q.quota}</b></div>`,
      };
    }).sort((a, b) => b.value - a.value).slice(0, 8);
    C.hbars($('rc-gap'), { items: gaps, valueFmt: v => C.pctF(v, 1), valueLabel: 'אחוז חסרים' });

    // טבלה
    C.table($('rc-table'), {
      columns: [
        { key: 'id', label: 'מס\' משרה', num: true },
        { key: 'dept', label: 'מחלקה' },
        { key: 'title', label: 'תפקיד' },
        { key: 'reason', label: 'סיבת גיוס' },
        { key: 'ageDays', label: 'ימים פתוחה', num: true },
      ],
      rows: pos, sortKey: 'ageDays', maxHeight: 300,
    });

    const worst = gaps[0];
    ui.setStory(`ב-NovaTech פתוחות כרגע <b>${openNow} משרות</b>, ${C.pctF(openNow / D.headcount * 100, 1)} מהמצבה. הפער הכי כואב: <b>${worst.label}</b> עם ${C.pctF(worst.value, 1)} תקנים חסרים. נסו ללחוץ על פלח בדונאט או על מוט בגרף, הכול מסתנן יחד, בדיוק כמו ב-Power BI.`);
  }

  /* ================= טאב 2: גיל משרות ================= */
  function renderAge(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>מחלקה</label><div id="ra-dept"></div></div>
        <div class="slicer"><label>תצוגה</label><div id="ra-100"></div></div>
        <button class="clear-f" id="ra-clear">✕ נקה חיתוכים</button>
      </div>
      <div class="tiles">
        <div class="tile col-6" id="ra-kpi1"></div>
        <div class="tile col-6" id="ra-kpi2"></div>
        <div class="tile col-6"><div class="t-head"><h3>הרכב גילאי משרה לפי מחלקה</h3><span class="t-sub">100% נערם · ימים מאז פתיחת המשרה</span></div><div id="ra-stack"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>התפלגות קטגוריות גיל</h3></div><div id="ra-donut"></div></div>
        <div class="tile col-12"><div class="t-head"><h3>פירוט משרות</h3><span class="t-sub">מיון בלחיצה על כותרת</span></div><div id="ra-table"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);

    C.select($('ra-dept'), {
      options: D.depts.map(d => d.name), value: state.ageDept,
      onChange: v => { state.ageDept = v; render(); },
    });
    C.seg($('ra-100'), {
      options: [{ key: false, label: 'כל המשרות' }, { key: true, label: 'חריגות 100+ בלבד 🔥' }],
      value: state.only100,
      onChange: v => { state.only100 = v; render(); },
    });
    $('ra-clear').addEventListener('click', () => { state.ageDept = null; state.only100 = false; render(); });

    let pos = D.positions.filter(p => !state.ageDept || p.dept === state.ageDept);
    if (state.only100) pos = pos.filter(p => p.ageDays >= 100);

    const sorted = [...pos].sort((a, b) => a.ageDays - b.ageDays);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].ageDays : 0;
    C.kpi($('ra-kpi1'), { label: 'חציון גיל משרה', value: `${C.fmt(median)} ימים`, accent: true, sub: 'מחצית מהמשרות פתוחות יותר מזה' });
    C.kpi($('ra-kpi2'), { label: 'משרות בתצוגה', value: C.fmt(pos.length), sub: state.only100 ? 'משרות שפתוחות 100+ ימים' : 'כלל המשרות הפתוחות' });

    const bucketOf = p => D.ageBuckets.find(b => b.test(p.ageDays));

    // נערם לפי מחלקות (עד 8 הגדולות)
    const deptTop = [...new Set(pos.map(p => p.dept))]
      .map(d => ({ d, n: pos.filter(p => p.dept === d).length }))
      .sort((a, b) => b.n - a.n).slice(0, 8);
    C.stack100($('ra-stack'), {
      rows: deptTop.map(({ d }) => ({
        label: d,
        parts: Object.fromEntries(D.ageBuckets.map(b => [b.key, pos.filter(p => p.dept === d && b.test(p.ageDays)).length])),
      })),
      keys: D.ageBuckets.map(b => ({ key: b.key, label: b.label, color: b.color })),
    });

    C.donut($('ra-donut'), {
      items: D.ageBuckets.map(b => ({ label: b.label, key: b.key, color: b.color, value: pos.filter(p => b.test(p.ageDays)).length })).filter(x => x.value),
      centerTitle: 'משרות', valueLabel: 'משרות',
    });

    C.table($('ra-table'), {
      columns: [
        { key: 'id', label: 'מס\' משרה', num: true },
        { key: 'dept', label: 'מחלקה' },
        { key: 'title', label: 'תפקיד' },
        { key: 'reason', label: 'סיבת גיוס' },
        { key: 'ageDays', label: 'גיל משרה (ימים)', num: true, html: (v) => {
            const cls = v >= 100 ? 'bad' : v > 60 ? 'warn' : 'ok';
            return `<b>${v}</b> <span class="pill ${cls}">${v >= 100 ? 'חריגה' : v > 60 ? 'מתבגרת' : 'תקינה'}</span>`;
          } },
      ],
      rows: pos, sortKey: 'ageDays', maxHeight: 320,
    });

    const n100 = D.positions.filter(p => p.ageDays >= 100).length;
    ui.setStory(state.only100
      ? `<b>${pos.length} משרות</b> פתוחות כבר מעל 100 ימים. בפרויקט המקורי, העמוד הזה הפך לשגרת שבועית של סמנכ"לית ה-HR. כל משרה כזו עולה כסף ושוחקת את הצוות שמחכה לתגבור.`
      : `חציון גיל משרה: <b>${median} ימים</b>. שימו לב לזנב: <b>${n100} משרות</b> כבר חצו את קו ה-100. עברו למצב "חריגות 100+" כדי לראות אותן בלבד (בפרויקט המקורי זה היה עמוד Drill-through נפרד).`);
  }

  /* ================= טאב 3: מגמות שנתי ================= */
  function renderTrend(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>שנה</label><div id="rt-year"></div></div>
      </div>
      <div class="tiles">
        <div class="tile col-4" id="rt-kpi1"></div>
        <div class="tile col-4" id="rt-kpi2"></div>
        <div class="tile col-4" id="rt-kpi3"></div>
        <div class="tile col-6"><div class="t-head"><h3>נפתחו מול נסגרו, לפי חודש</h3></div><div id="rt-cols"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>מגמת עומס: משרות פתוחות בסוף כל חודש</h3></div><div id="rt-area"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('rt-year'), {
      options: [{ key: 2025, label: '2025' }, { key: 2026, label: '2026 (חלקית)' }],
      value: state.trendYear,
      onChange: v => { state.trendYear = v; render(); },
    });

    const rows = D.monthly.filter(m => m.year === state.trendYear);
    const opened = rows.reduce((a, m) => a + m.opened, 0);
    const closed = rows.reduce((a, m) => a + m.closed, 0);
    const avgStock = Math.round(rows.reduce((a, m) => a + m.stock, 0) / rows.length);

    C.kpi($('rt-kpi1'), { label: 'סה"כ אוישו השנה', value: C.fmt(closed), sub: 'משרות שנסגרו בהצלחה' });
    C.kpi($('rt-kpi2'), { label: 'סה"כ נפתחו השנה', value: C.fmt(opened), sub: 'דרישות גיוס חדשות' });
    C.kpi($('rt-kpi3'), { label: 'ממוצע משרות פתוחות', value: C.fmt(avgStock), accent: true, sub: 'עומס חודשי ממוצע על הצוות' });

    C.columns($('rt-cols'), {
      categories: rows.map(m => m.monthName),
      series: [
        { name: 'נפתחו', color: '#3987e5', values: rows.map(m => m.opened) },
        { name: 'נסגרו', color: '#199e70', values: rows.map(m => m.closed) },
      ],
      height: 280,
    });

    C.lines($('rt-area'), {
      x: rows.map(m => m.monthName).reverse(),
      series: [{ name: 'משרות פתוחות', color: '#3987e5', values: rows.map(m => m.stock).reverse() }],
      area: true, height: 280,
    });

    const gap = opened - closed;
    ui.setStory(gap > 0
      ? `ב-${state.trendYear} נפתחו <b>${gap} משרות יותר משנסגרו</b>. צוות הגיוס רץ אחרי היעד. בגרסה המקורית, הגרף הזה שכנע את ההנהלה לתקצב רכזת גיוס נוספת.`
      : `ב-${state.trendYear} קצב הסגירה עקף את קצב הפתיחה, <b>${-gap} משרות</b> "נוקו" מהמלאי. זה בדיוק הסיפור שדוח מגמות אמור לספר בשקף אחד.`);
  }

  function render() {
    if (!built) build();
    const tab = ui.activeTab;
    if (tab === 'status') renderStatus(ui.views.status);
    if (tab === 'age') renderAge(ui.views.age);
    if (tab === 'trend') renderTrend(ui.views.trend);
  }

  return { render };
})();
