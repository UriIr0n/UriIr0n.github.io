/* =====================================================================
   דשבורד 5 — פילוח עובדים | המשלחת האולימפית
   שחזור של "פילוח עובדים" — דמוגרפיה עם חיתוך צולב מלא
   ===================================================================== */
const DashOlympic = (() => {
  const D = DATA.olympic;
  const C = Charts;
  const root = document.getElementById('page-olympic');

  // כל לחיצה על כל תרשים מסננת את כל השאר (חיתוך צולב כמו ב-Power BI)
  const state = { gender: null, sport: null, ageB: null, tenB: null, center: null };
  let ui = null, built = false;

  function build() {
    ui = Shell.build(root, {
      key: 'olympic', emoji: '🥇',
      title: 'המשלחת האולימפית — פילוח הספורטאים',
      original: 'פילוח עובדים — דמוגרפיה ארגונית (Power BI)',
      about: {
        problem: 'ההנהלה ביקשה "תמונת מצבה" אחת: מי העובדים שלנו? מה הרכב הגילאים והוותק, איך נראית החלוקה המגדרית והגיאוגרפית — ואיך כל זה משתנה כשמסתכלים על אוכלוסייה מסוימת?',
        built: [
          'עמוד דמוגרפיה אחד עם שישה פילוחים מסונכרנים',
          'חיתוך צולב מלא: לחיצה על כל פלח/מוט מסננת את כל שאר התרשימים',
          'קבוצות גיל וותק מחושבות (Binning) במקום שדות גולמיים',
        ],
        tech: [
          'עמודות מחושבות ל-Binning של גיל וותק',
          'Cross-filtering דו-כיווני מבוקר',
          'ניקוי נתוני עובדים רגישים ב-Power Query',
        ],
        impact: 'כלי המצבה השוטף של הארגון — התשובה המהירה לכל שאלה שמתחילה ב"כמה עובדים יש לנו ש...". גם אותו אפיינתי, בניתי והצגתי.',
      },
      tabs: [{ key: 'main', label: 'פילוח' }],
    });
    built = true;
  }

  const filtered = (skip) => D.list.filter(a =>
    (skip === 'gender' || !state.gender || a.gender === state.gender) &&
    (skip === 'sport' || !state.sport || a.sport === state.sport) &&
    (skip === 'ageB' || !state.ageB || a.ageB === state.ageB) &&
    (skip === 'tenB' || !state.tenB || a.tenB === state.tenB) &&
    (skip === 'center' || !state.center || a.center === state.center));

  const toggle = (k, v) => { state[k] = state[k] === v ? null : v; render(); };
  const anyFilter = () => Object.values(state).some(v => v);

  function renderMain(view) {
    view.innerHTML = `
      <div class="slicer-bar">
        <div class="slicer"><label>מגדר</label><div id="ol-gender"></div></div>
        <div class="slicer"><label>ענף ספורט (הרכב)</label><div id="ol-sport"></div></div>
        <button class="clear-f" id="ol-clear">✕ נקה את כל החיתוכים</button>
      </div>
      <div class="tiles">
        <div class="tile col-4" id="ol-kpi"></div>
        <div class="tile col-8"><div class="t-head"><h3>מגדר</h3><span class="t-sub">לחיצה מסננת הכול</span></div><div id="ol-gdonut"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>קבוצות גיל</h3><span class="t-sub">לחיצה מסננת</span></div><div id="ol-age"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>ותק בנבחרת (שנים)</h3><span class="t-sub">לחיצה מסננת</span></div><div id="ol-ten"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>ענף ספורט</h3><span class="t-sub">במקור: "הרכב" · לחיצה מסננת</span></div><div id="ol-sportc"></div></div>
        <div class="tile col-6"><div class="t-head"><h3>מרכז אימון</h3><span class="t-sub">במקור: "איזור" · לחיצה מסננת</span></div><div id="ol-center"></div></div>
      </div>`;

    const $ = id => view.querySelector('#' + id);

    C.seg($('ol-gender'), {
      options: D.genders.map(g => ({ key: g.key, label: g.label })), value: state.gender, allLabel: 'הכל',
      onChange: v => { state.gender = v; render(); },
    });
    C.seg($('ol-sport'), {
      options: D.sports.map(s => ({ key: s.key, label: s.label })), value: state.sport, allLabel: 'הכל',
      onChange: v => { state.sport = v; render(); },
    });
    $('ol-clear').addEventListener('click', () => { Object.keys(state).forEach(k => state[k] = null); render(); });

    const all = filtered();
    C.kpi($('ol-kpi'), {
      label: 'ספורטאים במשלחת', value: C.fmt(all.length), accent: true,
      sub: anyFilter() ? `מתוך ${D.list.length} · לפי החיתוך הנוכחי` : 'סך המשלחת',
    });

    // מגדר (דונאט קטן)
    const gset = filtered('gender');
    C.donut($('ol-gdonut'), {
      items: D.genders.map(g => ({
        label: g.label, key: g.key, color: g.key === 'f' ? '#d55181' : '#3987e5',
        value: gset.filter(a => a.gender === g.key).length,
      })).filter(x => x.value), size: 150, centerTitle: 'ספורטאים', valueLabel: 'ספורטאים',
      selectedKey: state.gender,
      onClick: it => toggle('gender', it.key),
    });

    // גיל
    const aset = filtered('ageB');
    C.columns($('ol-age'), {
      categories: D.ageBuckets.map(b => b.label),
      keys: D.ageBuckets.map(b => b.key),
      series: [{ name: 'ספורטאים', color: '#3987e5', values: D.ageBuckets.map(b => aset.filter(a => a.ageB === b.key).length) }],
      height: 235, showValues: true, selectedKey: state.ageB,
      onClick: it => toggle('ageB', it.key),
    });

    // ותק
    const tset = filtered('tenB');
    C.columns($('ol-ten'), {
      categories: D.tenureBuckets.map(b => b.label),
      keys: D.tenureBuckets.map(b => b.key),
      series: [{ name: 'ספורטאים', color: '#199e70', values: D.tenureBuckets.map(b => tset.filter(a => a.tenB === b.key).length) }],
      height: 235, showValues: true, selectedKey: state.tenB,
      onClick: it => toggle('tenB', it.key),
    });

    // ענף ספורט
    const sset = filtered('sport');
    C.donut($('ol-sportc'), {
      items: D.sports.map(s => ({
        label: s.label, key: s.key, color: s.color,
        value: sset.filter(a => a.sport === s.key).length,
      })).filter(x => x.value), centerTitle: 'ספורטאים', valueLabel: 'ספורטאים',
      selectedKey: state.sport,
      onClick: it => toggle('sport', it.key),
    });

    // מרכז אימון
    const cset = filtered('center');
    C.columns($('ol-center'), {
      categories: D.centers, keys: D.centers,
      series: [{ name: 'ספורטאים', color: '#9085e9', values: D.centers.map(c => cset.filter(a => a.center === c).length) }],
      height: 235, showValues: true, selectedKey: state.center,
      onClick: it => toggle('center', it.key),
    });

    // סיפור דינמי לפי הסינון
    const wingateShare = C.pctF(D.list.filter(a => a.center === 'מכון וינגייט').length / D.list.length * 100, 0);
    let story;
    if (state.center === 'אילת') {
      story = 'סיננתם לאילת — כמעט כולם משיט וגלישה. חתך גיאוגרפי אחד, וכל ההיגיון של המשלחת מסתדר לבד.';
    } else if (state.sport === 'gym') {
      story = 'סיננתם להתעמלות — שימו לב לקבוצות הגיל: כמעט כולן מתחת ל-23. בפרויקט המקורי, בדיוק ככה קפצו הבדלי פרופיל הגיל בין מחלקות.';
    } else if (anyFilter()) {
      story = `נשארו <b>${all.length} ספורטאים</b> בחיתוך הנוכחי. כל תרשים ממשיך להציג את ההתפלגות שלו בתוך האוכלוסייה המסוננת — בדיוק ההתנהגות של Cross-filtering ב-Power BI.`;
    } else {
      story = `<b>${wingateShare} מהמשלחת מתאמנת במכון וינגייט</b> — הלב הפועם של הספורט הישראלי. לחצו על כל פלח או מוט וצפו בכל שאר התרשימים מסתננים יחד — זה הקסם של חיתוך צולב.`;
    }
    ui.setStory(story);
  }

  function render() {
    if (!built) build();
    renderMain(ui.views.main);
  }

  return { render };
})();
