/* =====================================================================
   דשבורד 2 — היעדרויות | הוגוורטס
   שחזור של "דשבורד היעדרויות — פרופיל מחלקתי"
   ===================================================================== */
const DashHogwarts = (() => {
  const D = DATA.hogwarts;
  const C = Charts;
  const root = document.getElementById('page-hogwarts');

  const state = {
    house: 'גריפינדור', year: 'תשנ"ד',
    mode: { vac: 'chart', sick: 'chart', tot: 'chart' }, // דונאט ⇄ טבלה (Bookmarks)
    cmpHouse: 'גריפינדור',
  };
  let ui = null, built = false;

  const STORIES = {
    'גריפינדור': 'בגריפינדור נעדרים בעיקר סביב משחקי קווידיץ\'. מקגונגל דורשת אישור מחלה חתום — גם מהארי.',
    'סלית\'רין': 'סלית\'רין מוביל בימי מחלה בפער ניכר. סנייפ טוען שזה "אוויר צלוב במרתפים". הדשבורד טוען אחרת.',
    'רייבנקלו': 'ברייבנקלו כמעט לא מנצלים חופשות — פליטוויק נאלץ לשלוח סגל הביתה בכוח. גם זו חריגה שצריך לראות.',
    'הפלפאף': 'הפלפאף מאוזנים להפליא: ניצול חופשה בריא, מעט מחלות. ספראוט מייחסת את זה לתה הצמחים שלה.',
  };

  function build() {
    ui = Shell.build(root, {
      key: 'hog', emoji: '🪄',
      title: 'היעדרויות סגל הוגוורטס — פרופיל בית',
      original: 'דשבורד היעדרויות — פרופיל מחלקתי (Power BI)',
      about: {
        problem: 'מנהלי מחלקות לא ידעו לענות על שאלה פשוטה: "האם ההיעדרויות אצלי חריגות ביחס לארגון?" הנתונים ישבו בדוחות רבעוניים של מערכת הנוכחות, בפורמט שאף מנהל לא פותח — ולא היו ערכי סף מוסכמים שקובעים מה בכלל נחשב חריג.',
        built: [
          'פרופיל מחלקתי עם שלושה מדדי ניצול — מחלה, חופשה וסך היעדרות — מול הממוצע של כלל המחלקות, כך שכל מחלקה רואה בדיוק איפה היא עומדת ומה יש לשפר',
          'ערכי סף שהוגדרו יחד עם הסמנכ"ל, עם Drill-down לרשימת העובדים שחורגים מהם',
          'הרשאות ברמת שורה (RLS): כל מנהל רואה רק את המחלקה שלו; אני והסמנכ"ל רואים את כולן',
          'השוואה תקופתית גמישה — רבעון, מחצית, שלושה רבעונים או שנה — כל תקופה מול המקבילה לה אשתקד, לזיהוי מגמות',
        ],
        tech: [
          'Row-Level Security (RLS) ברמת מחלקה',
          'Field Parameters להחלפת ציר השוואה',
          'כותרות דינמיות עם SELECTEDVALUE',
          'Bookmarks + Selection Pane לגרף⇄טבלה',
          'נרמול נתוני נוכחות רבעוניים ב-Power Query',
        ],
        impact: 'כלי עבודה תפעולי שמנהלי המחלקות פותחים על הנתונים של עצמם. את הצרכים וערכי הסף אפיינתי יחד עם הסמנכ"ל, ואת הדשבורד הצגתי למנהלים שמשתמשים בו.',
      },
      tabs: [
        { key: 'profile', label: 'פרופיל בית' },
        { key: 'compare', label: 'השוואה לאשתקד' },
      ],
    });
    ui.onTab(() => render());
    built = true;
  }

  const houseStaff = () => D.staff.filter(s => s.house === state.house);
  const avg = (arr, f) => arr.length ? arr.reduce((a, x) => a + f(x), 0) / arr.length : 0;

  function kpiCompare(el, label, houseVal, orgVal, goodIsLow = true) {
    const diff = houseVal - orgVal;
    const isGood = goodIsLow ? diff <= 0 : diff >= 0;
    el.innerHTML = `<div class="kpi">
      <div class="k-label">${label}</div>
      <div class="k-value">${C.pctF(houseVal, 1)}</div>
      <div class="k-sub">ממוצע בית-ספרי: ${C.pctF(orgVal, 1)} ·
        <span class="${isGood ? 'up' : 'down'}">${diff >= 0 ? '▲' : '▼'} ${C.pctF(Math.abs(diff), 1)}</span></div>
    </div>`;
  }

  // אריח עם החלפת גרף⇄טבלה (שחזור Bookmarks)
  function toggleTile(el, id, title, sub, renderChart, renderTable) {
    el.innerHTML = `<div class="t-head"><h3>${title}</h3><span class="t-sub">${sub}</span>
      <div class="t-actions">
        <button data-m="chart" class="${state.mode[id] === 'chart' ? 'on' : ''}">◔ גרף</button>
        <button data-m="table" class="${state.mode[id] === 'table' ? 'on' : ''}">☰ טבלה</button>
      </div></div><div class="tile-body"></div>`;
    el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
      state.mode[id] = b.dataset.m; render();
    }));
    const body = el.querySelector('.tile-body');
    state.mode[id] === 'chart' ? renderChart(body) : renderTable(body);
  }

  /* ================= טאב 1: פרופיל בית ================= */
  function renderProfile(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>בית</label><div id="hg-house"></div></div>
        <div class="slicer"><label>שנת לימודים</label><div id="hg-year"></div></div>
      </div>
      <div class="tiles">
        <div class="tile col-12" id="hg-title" style="text-align:center"></div>
        <div class="tile col-4" id="hg-k1"></div>
        <div class="tile col-4" id="hg-k2"></div>
        <div class="tile col-4" id="hg-k3"></div>
        <div class="tile col-4" id="hg-t1"></div>
        <div class="tile col-4" id="hg-t2"></div>
        <div class="tile col-4" id="hg-t3"></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('hg-house'), {
      options: D.houses.map(h => ({ key: h.name, label: h.name })), value: state.house,
      onChange: v => { state.house = v || state.house; render(); },
    });
    C.seg($('hg-year'), {
      options: D.years.map(y => ({ key: y, label: y })), value: state.year,
      onChange: v => { state.year = v || state.year; render(); },
    });

    const h = D.houses.find(x => x.name === state.house);
    const staff = houseStaff();
    // כותרת דינמית (שחזור "כותרת מנהל דינמי")
    $('hg-title').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap">
      <span style="width:14px;height:14px;border-radius:4px;background:${h.color};display:inline-block"></span>
      <b style="font-size:19px">בית ${h.name}</b>
      <span style="color:var(--ink-2)">ראש הבית: ${h.head}</span>
      <span style="color:var(--ink-3)">· ${staff.length} אנשי סגל · שנת ${state.year}</span></div>`;

    const yf = state.year === 'תשנ"ג' ? 0.93 : 1; // אשתקד מעט נמוך יותר
    const hVac = avg(staff, s => s.vacPct) * yf, oVac = avg(D.staff, s => s.vacPct) * yf;
    const hSick = avg(staff, s => s.sickPct) * yf, oSick = avg(D.staff, s => s.sickPct) * yf;
    const hTot = avg(staff, s => s.totPct) * yf, oTot = avg(D.staff, s => s.totPct) * yf;

    kpiCompare($('hg-k1'), 'ניצול חופשה (סופי שבוע בהוגסמיד)', hVac, oVac, false);
    kpiCompare($('hg-k2'), 'ניצול מחלה (אגף חולים)', hSick, oSick, true);
    kpiCompare($('hg-k3'), 'סך היעדרות', hTot, oTot, true);

    const statusColors = { ok: '#199e70', low: '#3987e5', high: '#c98500', crit: '#e66767' };

    toggleTile($('hg-t1'), 'vac', 'חופשה — סטטוס סגל', 'גרף ⇄ טבלה (Bookmarks)',
      body => C.donut(body, {
        items: [
          { label: 'ניצול תקין (40–80%)', key: 'ok', color: statusColors.ok, value: staff.filter(s => s.vacPct >= 40 && s.vacPct <= 80).length },
          { label: 'ניצול נמוך (<40%)', key: 'low', color: statusColors.low, value: staff.filter(s => s.vacPct < 40).length },
          { label: 'ניצול גבוה (>80%)', key: 'high', color: statusColors.high, value: staff.filter(s => s.vacPct > 80).length },
        ].filter(x => x.value), centerTitle: 'אנשי סגל', size: 160, valueLabel: 'סגל',
      }),
      body => C.table(body, {
        columns: [
          { key: 'name', label: 'שם' },
          { key: 'vacDays', label: 'ימי חופשה', num: true },
          { key: 'vacPct', label: 'אחוז ניצול', num: true, fmt: v => C.pctF(v) },
        ],
        rows: staff, sortKey: 'vacDays', maxHeight: 230,
      }));

    toggleTile($('hg-t2'), 'sick', 'מחלה — מעל 15% ניצול', 'גרף ⇄ טבלה (Bookmarks)',
      body => C.donut(body, {
        items: [
          { label: 'עד 15% ניצול', key: 'ok', color: statusColors.ok, value: staff.filter(s => s.sickPct <= 15).length },
          { label: 'מעל 15% ניצול', key: 'high', color: statusColors.crit, value: staff.filter(s => s.sickPct > 15).length },
        ].filter(x => x.value), centerTitle: 'אנשי סגל', size: 160, valueLabel: 'סגל',
      }),
      body => C.table(body, {
        columns: [
          { key: 'name', label: 'שם' },
          { key: 'sickDays', label: 'ימי מחלה', num: true },
          { key: 'sickPct', label: 'אחוז ניצול', num: true, html: v => `${C.pctF(v)} ${v > 15 ? '<span class="pill bad">חריג</span>' : ''}` },
        ],
        rows: staff, sortKey: 'sickDays', maxHeight: 230,
      }));

    toggleTile($('hg-t3'), 'tot', 'סך היעדרויות — סטטוס', 'גרף ⇄ טבלה (Bookmarks)',
      body => C.donut(body, {
        items: [
          { label: 'תקין', key: 'ok', color: statusColors.ok, value: staff.filter(s => s.totPct <= 55).length },
          { label: 'גבוה', key: 'high', color: statusColors.high, value: staff.filter(s => s.totPct > 55 && s.totPct <= 75).length },
          { label: 'חריג', key: 'crit', color: statusColors.crit, value: staff.filter(s => s.totPct > 75).length },
        ].filter(x => x.value), centerTitle: 'אנשי סגל', size: 160, valueLabel: 'סגל',
      }),
      body => C.table(body, {
        columns: [
          { key: 'name', label: 'שם' },
          { key: 'totDays', label: 'סה"כ ימים', num: true },
          { key: 'totPct', label: 'אחוז', num: true, fmt: v => C.pctF(v) },
        ],
        rows: staff, sortKey: 'totDays', maxHeight: 230,
      }));

    ui.setStory(`${STORIES[state.house]} <span style="color:var(--ink-3)">· בפרויקט המקורי אין בכלל בורר מחלקה: בזכות RLS כל מנהל רואה אוטומטית רק את המחלקה שלו, ואני והסמנכ"ל את כולן. כאן הבורר פתוח כדי שתוכלו לשחק.</span>`);
  }

  /* ================= טאב 2: השוואה לאשתקד ================= */
  function renderCompare(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>בית</label><div id="hc-house"></div></div>
      </div>
      <div class="tiles">
        <div class="tile col-12" id="hc-title" style="text-align:center"></div>
        <div class="tile col-4"><div class="t-head"><h3>ניצול חופשה מצטבר</h3><span class="t-sub">לפי חודש אקדמי</span></div><div id="hc-c1"></div></div>
        <div class="tile col-4"><div class="t-head"><h3>ניצול מחלה מצטבר</h3><span class="t-sub">לפי חודש אקדמי</span></div><div id="hc-c2"></div></div>
        <div class="tile col-4"><div class="t-head"><h3>סך היעדרות מצטבר</h3><span class="t-sub">לפי חודש אקדמי</span></div><div id="hc-c3"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('hc-house'), {
      options: D.houses.map(h => ({ key: h.name, label: h.name })), value: state.cmpHouse,
      onChange: v => { state.cmpHouse = v || state.cmpHouse; render(); },
    });

    const h = D.houses.find(x => x.name === state.cmpHouse);
    $('hc-title').innerHTML = `<b style="font-size:17px">בית ${h.name}</b>
      <span style="color:var(--ink-2)"> — שנת תשנ"ד מול תשנ"ג</span>
      <span style="color:var(--ink-3)">(שחזור "כותרת השוואה דינמית")</span>`;

    const ms = D.monthlySeries[state.cmpHouse];
    const mkChart = (id, metric) => C.columns($(id), {
      categories: D.acadMonths.map(m => m.slice(0, 4) + '\''),
      series: [
        { name: 'תשנ"ד', color: '#3987e5', values: ms['תשנ"ד'][metric] },
        { name: 'תשנ"ג', color: '#898781', values: ms['תשנ"ג'][metric] },
      ],
      height: 300, valueFmt: v => C.pctF(v),
    });
    mkChart('hc-c1', 'vac');
    mkChart('hc-c2', 'sick');
    mkChart('hc-c3', 'tot');

    const dSick = ms['תשנ"ד'].sick.at(-1) - ms['תשנ"ג'].sick.at(-1);
    ui.setStory(`ב${h.name}, ניצול המחלה ${dSick >= 0 ? 'עלה' : 'ירד'} ב-<b>${C.pctF(Math.abs(dSick))}</b> לעומת אשתקד. העמוד הזה שחזר שאלה שמנהלים שאלו שוב ושוב — "רגע, ואיך זה היה שנה שעברה?" — והפך אותה ללחיצה אחת.`);
  }

  function render() {
    if (!built) build();
    const tab = ui.activeTab;
    if (tab === 'profile') renderProfile(ui.views.profile);
    if (tab === 'compare') renderCompare(ui.views.compare);
  }

  return { render };
})();
