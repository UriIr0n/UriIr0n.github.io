/* =====================================================================
   דשבורד 3 - סטטוס הרשמה | מנויי Claude
   שחזור של "סטטוס הרשמה - השוואה תקופתית במצבי ההרשמה"
   ===================================================================== */
const DashClaude = (() => {
  const D = DATA.claude;
  const C = Charts;
  const root = document.getElementById('page-claude');
  const REGION_COLORS = { 'אמריקה': '#3987e5', 'אירופה והמזרח התיכון': '#c98500', 'אסיה-פסיפיק': '#199e70' };

  const state = { country: null, region: null, track: null };
  let ui = null, built = false;

  function build() {
    ui = Shell.build(root, {
      key: 'claude', emoji: '✨',
      title: 'המרוץ למיליון: הרשמות ומנויים בהשקות Claude',
      original: 'סטטוס הרשמה: השוואה תקופתית (Power BI)',
      about: {
        problem: 'במשך שנים, עובדת ישבה פעם בשבוע ארבע שעות והכינה ידנית דוח אקסל מבולגן על מצב ההרשמה. נתוני העבר היו פזורים בעשרות קבצים כאלה, בלי מבנה אחיד, וכל השוואה בין שנים הייתה ניחוש.',
        built: [
          'שיטחתי שנים של דוחות אקסל ישנים לבסיס נתונים אחד אחיד, כך שנתוני העבר נשמרו והפכו שמישים',
          'אוטומציה מקצה לקצה: הדוח השוטף ממערכת "מכלול" עובר טרנספורמציה ונטען לבסיס הנתונים אוטומטית, בלי מגע יד',
          'ציר זמן מנורמל שמיישר את כל המחזורים, אפשר להשוות כל נקודה לאותה נקודה בשנים קודמות',
          'ארבעה גרפי מגמה במקביל, אחד לכל שלב במשפך ההרשמה, על פני ארבע שנות נתונים',
        ],
        tech: [
          'טבלת Snapshot עם ציר תאריך-תצוגה מנורמל',
          'Python + Power Query לטרנספורמציה וטעינה אוטומטית',
          'DAX להשוואת מחזורים (Cycle-over-Cycle)',
          'עיצוב Small Multiples: אותו ציר בכל הגרפים',
        ],
        impact: 'הפרויקט המשמעותי ביותר שבניתי: ארבע שעות עבודה ידנית בשבוע ירדו לאפס, ארבע שנות היסטוריה נשמרו במקום אחד, והמערכת תמשיך לרוץ קדימה לבד. את זרימת ההרשמה לאוניברסיטה רואים היום במבט אחד. אפיינתי את התהליך מקצה לקצה והצגתי אותו להנהלה.',
      },
      tabs: [
        { key: 'trend', label: 'משפך ההרשמה לאורך זמן' },
        { key: 'geo', label: 'מפת המדינות' },
      ],
    });
    ui.onTab(() => render());
    built = true;
  }

  // סכימת סדרות לפי הסינון הנוכחי
  function seriesFor(cycleKey, statusKey) {
    const countries = D.parties.filter(p =>
      (!state.country || p.name === state.country) &&
      (!state.region || p.bloc === state.region));
    const tracks = state.track ? [state.track] : D.tracks;
    const n = D.weeks.length;
    const out = new Array(n).fill(0);
    countries.forEach(p => tracks.forEach(t => {
      const arr = D.data[cycleKey][p.name][t][statusKey];
      for (let i = 0; i < n; i++) out[i] += arr[i];
    }));
    return out;
  }

  /* ================= טאב 1: מגמות ================= */
  function renderTrend(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>אזור</label><div id="cl-region"></div></div>
        <div class="slicer"><label>מדינה</label><div id="cl-country"></div></div>
        <div class="slicer"><label>פלטפורמה</label><div id="cl-track"></div></div>
        <button class="clear-f" id="cl-clear">✕ נקה חיתוכים</button>
      </div>
      <div class="tiles">
        <div class="tile col-4" id="cl-k1"></div>
        <div class="tile col-4" id="cl-k2"></div>
        <div class="tile col-4" id="cl-k3"></div>
        ${D.statuses.map(s => `<div class="tile col-6">
          <div class="t-head"><h3>${s.label}</h3><span class="t-sub">${s.desc} · שבועות עד סוף מבצע ההשקה</span></div>
          <div id="cl-${s.key}"></div></div>`).join('')}
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('cl-region'), {
      options: D.blocs.map(b => ({ key: b, label: b })), value: state.region, allLabel: 'הכל',
      onChange: v => { state.region = v; if (v && state.country && !D.parties.find(p => p.name === state.country && p.bloc === v)) state.country = null; render(); },
    });
    C.select($('cl-country'), {
      options: D.parties.filter(p => !state.region || p.bloc === state.region).map(p => p.name),
      value: state.country, allLabel: 'כל המדינות',
      onChange: v => { state.country = v; render(); },
    });
    C.seg($('cl-track'), {
      options: D.tracks.map(t => ({ key: t, label: t })), value: state.track, allLabel: 'הכל',
      onChange: v => { state.track = v; render(); },
    });
    $('cl-clear').addEventListener('click', () => { Object.assign(state, { country: null, region: null, track: null }); render(); });

    // KPI - סוף מחזור נוכחי מול קודם
    const regNow = seriesFor(2026, 'reg').at(-1);
    const regPrev = seriesFor(2025, 'reg').at(-1);
    const apprNow = seriesFor(2026, 'appr').at(-1);
    const growth = regPrev ? (regNow / regPrev - 1) * 100 : 0;
    C.kpi($('cl-k1'), { label: 'נרשמו: השקת Claude 5', value: C.fmt(regNow), accent: true, sub: 'נכון לסוף מבצע ההשקה' });
    C.kpi($('cl-k2'), { label: 'צמיחה מול השקת Claude 4', value: (growth >= 0 ? '+' : '') + C.pctF(growth, 1), sub: `${C.fmt(regPrev)} נרשמו ב-2025` });
    C.kpi($('cl-k3'), { label: 'הפכו למנויים בתשלום', value: C.fmt(apprNow), sub: 'המרה מחשבון חינמי למנוי' });

    D.statuses.forEach(s => {
      C.lines($('cl-' + s.key), {
        x: D.weeks,
        series: D.cycles.map(c => ({ name: c.label, color: c.color, values: seriesFor(c.key, s.key) })),
        height: 240, xTickEvery: 3,
      });
    });

    // הסיפור: הספרינט של הרגע האחרון
    const reg26 = seriesFor(2026, 'reg');
    const lastTwo = reg26.at(-1) - reg26[reg26.length - 4];
    const lastPct = C.pctF(lastTwo / reg26.at(-1) * 100, 0);
    ui.setStory(`הדפוס חוזר בכל השקה: <b>${lastPct} מהנרשמים מגיעים בשלושת השבועות האחרונים</b>, רגע לפני שמחיר ההשקה נגמר. בפרויקט המקורי (הרשמת סטודנטים) הדפוס היה זהה, רק שהדדליין היה פתיחת הסמסטר. נסו לסנן אזור או מדינה: כל ארבעת הגרפים מגיבים יחד.`);
  }

  /* ================= טאב 2: מפת המדינות ================= */
  function renderGeo(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>פלטפורמה</label><div id="cg-track"></div></div>
      </div>
      <div class="tiles">
        <div class="tile col-7"><div class="t-head"><h3>נרשמים לפי מדינה: סוף מבצע Claude 5</h3><span class="t-sub">צבע לפי אזור</span></div><div id="cg-bars"></div></div>
        <div class="tile col-5"><div class="t-head"><h3>חלוקת ההרשמות בין האזורים</h3></div><div id="cg-donut"></div></div>
        <div class="tile col-12"><div class="t-head"><h3>מי צמחה הכי מהר? Claude 5 מול Claude 4</h3><span class="t-sub">אחוז שינוי בנרשמים</span></div><div id="cg-growth"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);
    C.seg($('cg-track'), {
      options: D.tracks.map(t => ({ key: t, label: t })), value: state.track, allLabel: 'הכל',
      onChange: v => { state.track = v; render(); },
    });

    const tracks = state.track ? [state.track] : D.tracks;
    const countryTotal = (cycle, cname) => tracks.reduce((a, t) => a + D.data[cycle][cname][t].reg.at(-1), 0);

    const rows = D.parties.map(p => ({
      label: p.name, key: p.name, color: REGION_COLORS[p.bloc],
      value: countryTotal(2026, p.name),
      extraTip: `<div class="row">אזור: <b>${p.bloc}</b></div>`,
    })).sort((a, b) => b.value - a.value);
    C.hbars($('cg-bars'), {
      items: rows, valueLabel: 'נרשמים',
      legend: D.blocs.map(b => ({ label: b, color: REGION_COLORS[b] })),
    });

    C.donut($('cg-donut'), {
      items: D.blocs.map(b => ({
        label: b, key: b, color: REGION_COLORS[b],
        value: D.parties.filter(p => p.bloc === b).reduce((a, p) => a + countryTotal(2026, p.name), 0),
      })), centerTitle: 'נרשמים', valueLabel: 'נרשמים',
    });

    const growth = D.parties.map(p => {
      const now = countryTotal(2026, p.name), prev = countryTotal(2025, p.name);
      return { label: p.name, key: p.name, color: REGION_COLORS[p.bloc], value: +((now / prev - 1) * 100).toFixed(1) };
    }).sort((a, b) => b.value - a.value);
    C.hbars($('cg-growth'), { items: growth, valueFmt: v => (v >= 0 ? '+' : '') + C.pctF(v, 1), valueLabel: 'צמיחה' });

    const top = rows[0], fastest = growth[0];
    ui.setStory(`<b>${top.label}</b> מובילה בגודל (${C.fmt(top.value)} נרשמים), אבל הסיפור האמיתי הוא <b>${fastest.label}</b>, צמיחה של ${C.pctF(fastest.value, 0)} בין השקה להשקה. גודל זה נתון; מומנטום זו תובנה. <span style="color:var(--ink-3)">(והאתר הזה נבנה עם Claude Code, אז הדשבורד הזה הוא סגירת מעגל.)</span>`);
  }

  function render() {
    if (!built) build();
    const tab = ui.activeTab;
    if (tab === 'trend') renderTrend(ui.views.trend);
    if (tab === 'geo') renderGeo(ui.views.geo);
  }

  return { render };
})();
