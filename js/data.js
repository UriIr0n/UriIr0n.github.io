/* =====================================================================
   data.js - כל הנתונים באתר בדיוניים לחלוטין (נוצרים דטרמיניסטית)
   ===================================================================== */
const DATA = (() => {

  // מחולל אקראי דטרמיניסטי - אותם "נתונים" בכל טעינה
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, min, max) => Math.floor(r() * (max - min + 1)) + min;
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  const PAL = { s1: '#3987e5', s2: '#199e70', s3: '#c98500', s4: '#008300', s5: '#9085e9', s6: '#e66767', s7: '#d55181', s8: '#d95926' };
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  /* ================= 1) גיוס - NovaTech ================= */
  const recruit = (() => {
    const r = rng(42);
    const depts = [
      { name: 'פיתוח Backend', group: 'טכנולוגי' }, { name: 'פיתוח Frontend', group: 'טכנולוגי' },
      { name: 'דאטה ו-AI', group: 'טכנולוגי' }, { name: 'DevOps וענן', group: 'טכנולוגי' },
      { name: 'אבטחת מידע', group: 'טכנולוגי' }, { name: 'QA ואוטומציה', group: 'טכנולוגי' },
      { name: 'מוצר ועיצוב', group: 'עסקי' }, { name: 'שיווק', group: 'עסקי' },
      { name: 'מכירות Enterprise', group: 'עסקי' }, { name: 'הצלחת לקוח', group: 'עסקי' },
      { name: 'כספים', group: 'עסקי' }, { name: 'משאבי אנוש', group: 'עסקי' },
    ];
    const reasons = ['החלפה עקב עזיבה', 'תקן חדש', 'הרחבת פעילות', 'החלפת חל"ד', 'ניוד פנימי'];
    const fillTypes = ['גיוס חיצוני', 'ניוד פנימי', 'מיקור חוץ'];
    const titles = {
      'פיתוח Backend': ['מהנדס/ת Backend Senior', 'מפתח/ת Java', 'ראש צוות Backend', 'מפתח/ת Python'],
      'פיתוח Frontend': ['מפתח/ת React Senior', 'מפתח/ת Frontend', 'מוביל/ה טכני/ת Web'],
      'דאטה ו-AI': ['Data Scientist', 'מהנדס/ת דאטה', 'אנליסט/ית BI', 'חוקר/ת ML'],
      'DevOps וענן': ['מהנדס/ת DevOps', 'ארכיטקט/ית ענן', 'SRE'],
      'אבטחת מידע': ['אנליסט/ית SOC', 'מומחה/ית אבטחת ענן', 'CISO סגן/ית'],
      'QA ואוטומציה': ['מהנדס/ת אוטומציה', 'בודק/ת QA', 'ראש צוות QA'],
      'מוצר ועיצוב': ['מנהל/ת מוצר', 'מעצב/ת UX/UI', 'מנהל/ת מוצר בכיר/ה'],
      'שיווק': ['מנהל/ת שיווק דיגיטלי', 'מנהל/ת קמפיינים', 'כותב/ת תוכן'],
      'מכירות Enterprise': ['מנהל/ת מכירות שטח', 'Account Executive', 'SDR'],
      'הצלחת לקוח': ['מנהל/ת הצלחת לקוח', 'מוביל/ת Onboarding'],
      'כספים': ['חשב/ת שכר', 'אנליסט/ית FP&A', 'רו"ח'],
      'משאבי אנוש': ['רכז/ת גיוס טכנולוגי', 'HRBP', 'רכז/ת רווחה'],
    };

    // משרות פתוחות כרגע
    const positions = [];
    let pid = 3100;
    depts.forEach(d => {
      const n = d.group === 'טכנולוגי' ? ri(r, 3, 8) : ri(r, 1, 5);
      for (let i = 0; i < n; i++) {
        const age = Math.round(Math.pow(r(), 1.6) * 170) + 3; // רוב המשרות צעירות, זנב ארוך
        positions.push({
          id: pid++, dept: d.name, group: d.group,
          title: pick(r, titles[d.name]), reason: pick(r, reasons),
          fillType: r() < 0.72 ? 'גיוס חיצוני' : pick(r, fillTypes), ageDays: age,
        });
      }
    });

    // סדרה חודשית: 2025 מלאה, 2026 עד יוני
    const monthly = [];
    let stock = 38;
    [2025, 2026].forEach(year => {
      const nMonths = year === 2025 ? 12 : 6;
      for (let m = 0; m < nMonths; m++) {
        const seasonal = 1 + 0.35 * Math.sin((m - 1) / 12 * Math.PI * 2);
        const opened = Math.round(ri(r, 8, 14) * seasonal) + (year === 2026 ? 2 : 0);
        const closed = Math.round(ri(r, 7, 13) * seasonal);
        const frozen = ri(r, 0, 3);
        stock = Math.max(20, stock + opened - closed - frozen);
        monthly.push({ year, month: m, monthName: MONTHS[m], opened, closed, frozen, stock });
      }
    });

    const headcount = 1240; // מצבת החברה
    const quota = {}; // תקן מול חסרים לפי מחלקה
    depts.forEach(d => {
      const staff = d.group === 'טכנולוגי' ? ri(r, 60, 190) : ri(r, 25, 110);
      const missing = positions.filter(p => p.dept === d.name).length;
      quota[d.name] = { quota: staff + missing, missing };
    });

    const ageBuckets = [
      { key: 'a1', label: '0-30 יום', test: d => d <= 30, color: PAL.s2 },
      { key: 'a2', label: '31-60 יום', test: d => d > 30 && d <= 60, color: PAL.s1 },
      { key: 'a3', label: '61-99 יום', test: d => d > 60 && d < 100, color: PAL.s3 },
      { key: 'a4', label: '100+ יום', test: d => d >= 100, color: PAL.s6 },
    ];

    return { depts, reasons, fillTypes, positions, monthly, headcount, quota, ageBuckets };
  })();

  /* ================= 2) היעדרויות - הוגוורטס ================= */
  const hogwarts = (() => {
    const r = rng(1991);
    const houses = [
      { name: 'גריפינדור', color: PAL.s6, head: 'מינרווה מקגונגל' },
      { name: 'סלית\'רין', color: PAL.s4, head: 'סוורוס סנייפ' },
      { name: 'רייבנקלו', color: PAL.s1, head: 'פיליוס פליטוויק' },
      { name: 'הפלפאף', color: PAL.s3, head: 'פומונה ספראוט' },
    ];
    const firstNames = ['אלביה', 'קסנופיליוס', 'ארמינטה', 'ברטי', 'גלינדה', 'דורקאס', 'הוראס', 'ויולטה', 'זכריאס', 'טיבריוס', 'ליבי', 'מירבל', 'נימפדורה', 'סילvanus', 'עמנואלה', 'פיניאס', 'קווינטוס', 'רומילדה', 'שיימוס', 'תיאודורה', 'אורלה', 'בארנבס', 'גווندולין', 'דמיטריוס', 'הסטיה', 'וילהלמינה'];
    const cleanFirst = ['אלביה', 'קסנופיליוס', 'ארמינטה', 'ברטי', 'גלינדה', 'דורקאס', 'הוראס', 'ויולטה', 'זכריאס', 'טיבריוס', 'ליבי', 'מירבל', 'נימפדורה', 'סילבנוס', 'עמנואלה', 'פיניאס', 'קווינטוס', 'רומילדה', 'שיימוס', 'תיאודורה', 'אורלה', 'ברנבס', 'גוונדולין', 'דמיטריוס', 'הסטיה', 'וילהלמינה'];
    const lastNames = ['פלמדריק', 'בלישוויק', 'קרואקפורד', 'הופקירק', 'טרימבל', 'ווספורט', 'מקלגן', 'סלוגהורן-לי', 'פיברלי', 'אברקרומבי', 'דירבורן', 'פנוויק', 'גמפ', 'הורנבי', 'ג\'יגר', 'קטלמור', 'לאוקלין', 'מרצ\'בנקס', 'אוגדן', 'פרקינסון-רו', 'קווירק', 'רוזייר-עם', 'סמת\'ווייק', 'טוויקרוס', 'אורקהארט', 'ואבלינג'];
    const years = ['תשנ"ג', 'תשנ"ד'];

    // עובדים (סגל הבית) עם נתוני ניצול לשנה הנוכחית
    const staff = [];
    houses.forEach((h, hi) => {
      const n = 26 + hi * 2;
      const houseBias = [1.0, 1.18, 0.9, 0.96][hi]; // סלית'רין "חולים" יותר...
      for (let i = 0; i < n; i++) {
        const vac = Math.min(118, Math.round((25 + r() * 75) * (0.9 + r() * 0.3)));
        const sick = Math.min(95, Math.round(Math.pow(r(), 1.7) * 55 * houseBias));
        const vacDays = Math.round(vac / 100 * 22);
        const sickDays = Math.round(sick / 100 * 18);
        staff.push({
          name: pick(r, cleanFirst) + ' ' + pick(r, lastNames),
          house: h.name,
          vacPct: vac, sickPct: sick,
          vacDays, sickDays,
          totDays: vacDays + sickDays,
          totPct: Math.round((vacDays + sickDays) / 40 * 100),
        });
      }
    });

    // סדרות חודשיות לשתי שנים (להשוואה אשתקד) - ממוצע אחוז ניצול מצטבר
    const monthlySeries = {}; // house -> year -> {vac:[], sick:[], tot:[]}
    const acadMonths = ['ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'];
    houses.forEach((h, hi) => {
      monthlySeries[h.name] = {};
      years.forEach((y, yi) => {
        const vac = [], sick = [], tot = [];
        let v = 0, s = 0;
        for (let m = 0; m < acadMonths.length; m++) {
          const winter = (m >= 2 && m <= 5) ? 1.5 : 1; // חורף = יותר מחלה
          const holiday = (m === 3 || m === 7) ? 1.8 : 1; // דצמבר ואפריל = חופשות
          v += (4.5 + r() * 3.5) * holiday * (yi ? 1.06 : 1);
          s += (2.2 + r() * 2.6) * winter * [1, 1.25, 0.85, 0.95][hi] * (yi ? 0.94 : 1);
          vac.push(Math.round(Math.min(v, 104)));
          sick.push(Math.round(Math.min(s, 88)));
          tot.push(Math.round(Math.min((v * 0.55 + s * 0.45), 96)));
        }
        monthlySeries[h.name][y] = { vac, sick, tot };
      });
    });

    return { houses, staff, years, acadMonths, monthlySeries };
  })();

  /* ================= 3) סטטוס הרשמה - מנויי Claude ================= */
  const claude = (() => {
    const r = rng(777);
    const cycles = [
      { key: 2026, label: 'השקת Claude 5 (2026)', color: PAL.s1 },
      { key: 2025, label: 'השקת Claude 4 (2025)', color: PAL.s2 },
      { key: 2024, label: 'השקת Claude 3 (2024)', color: PAL.s3 },
    ];
    const blocs = ['אמריקה', 'אירופה והמזרח התיכון', 'אסיה-פסיפיק'];
    const parties = [
      { name: 'ארה"ב', bloc: 'אמריקה', size: 1.6 },
      { name: 'בריטניה', bloc: 'אירופה והמזרח התיכון', size: 1.1 },
      { name: 'הודו', bloc: 'אסיה-פסיפיק', size: 1.05 },
      { name: 'גרמניה', bloc: 'אירופה והמזרח התיכון', size: 0.95 },
      { name: 'יפן', bloc: 'אסיה-פסיפיק', size: 0.9 },
      { name: 'ישראל', bloc: 'אירופה והמזרח התיכון', size: 0.85 },
      { name: 'קנדה', bloc: 'אמריקה', size: 0.75 },
      { name: 'ברזיל', bloc: 'אמריקה', size: 0.6 },
    ];
    const tracks = ['Web / Desktop', 'Mobile'];
    const weeks = []; // 16 שבועות של מבצע ההשקה
    for (let w = 16; w >= 0; w--) weeks.push(w === 0 ? 'סוף המבצע' : `${w}- שב\'`);
    const nW = weeks.length;

    // משפך: נרשמו (חינם) ← פעילים שבועיים ← התחילו ניסיון ← הפכו למנויים
    const statuses = [
      { key: 'reg', label: 'נרשמו (חינם)', desc: 'חשבונות חדשים' },
      { key: 'act', label: 'פעילים שבועיים', desc: 'משתמשים פעילים' },
      { key: 'cand', label: 'התחילו ניסיון Pro', desc: 'תקופת ניסיון' },
      { key: 'appr', label: 'הפכו למנויים בתשלום', desc: 'המרה לתשלום' },
    ];

    // data[cycle][country][track] = {reg:[..17], act:[], cand:[], appr:[]}
    const data = {};
    cycles.forEach((c, ci) => {
      data[c.key] = {};
      const cycleMult = [1.35, 1.0, 0.78][ci]; // כל דור גדול מקודמו
      parties.forEach(p => {
        data[c.key][p.name] = {};
        tracks.forEach((t, ti) => {
          const base = p.size * cycleMult * (ti === 0 ? 76000 : 36000) * (0.85 + r() * 0.3);
          const reg = [], act = [], cand = [], appr = [];
          let cum = base * 0.12;
          for (let w = 0; w < nW; w++) {
            // צמיחה לוגיסטית - ספרינט של הרגע האחרון לפני סוף המבצע
            const tt = w / (nW - 1);
            const target = base * (0.12 + 0.88 / (1 + Math.exp(-8 * (tt - 0.78))));
            cum = Math.max(cum, target * (0.95 + r() * 0.1));
            reg.push(Math.round(cum));
            act.push(Math.round(cum * (0.32 + r() * 0.05)));
            cand.push(Math.round(cum * 0.05 * (tt > 0.4 ? 1 : tt / 0.4)));
            appr.push(Math.round(cum * 0.032 * (tt > 0.6 ? 1 : tt / 0.6 * 0.7)));
          }
          data[c.key][p.name][t] = { reg, act, cand, appr };
        });
      });
    });

    return { cycles, blocs, parties, tracks, weeks, statuses, data };
  })();

  /* ================= 4) פילוח ארגוני - נאס"א ================= */
  const nasa = (() => {
    const r = rng(66);
    const centers = [
      { name: 'מרכז ג\'ונסון', divisions: ['חיל האסטרונאוטים', 'בקרת משימה', 'רפואת חלל'] },
      { name: 'מרכז קנדי', divisions: ['מערכות שיגור', 'מתחם ההמראה'] },
      { name: 'JPL פסדינה', divisions: ['רובוטיקה פלנטרית', 'ניווט בחלל עמוק'] },
    ];
    const tracks = [
      { key: 'eng', name: 'מהנדסי טיסה', orig: 'מסלול רגיל', color: PAL.s1, ranks: ['מהנדס', 'מהנדס בכיר', 'מהנדס ראשי', 'ראש תחום'] },
      { key: 'sci', name: 'מדעני מחקר', orig: 'מסלול מומחה', color: PAL.s2, ranks: ['חוקר', 'חוקר בכיר', 'מדען ראשי', 'ראש תחום'] },
      { key: 'astro', name: 'אסטרונאוטים', orig: 'מסלול קליני', color: PAL.s5, ranks: ['מועמד', 'אסטרונאוט', 'אסטרונאוט בכיר', 'מפקד משימה'] },
      { key: 'ground', name: 'צוות קרקע', orig: 'מסלול מקביל', color: PAL.s3, ranks: ['טכנאי', 'טכנאי בכיר'] },
    ];
    const guestRanks = ['יועץ ראשי', 'מהנדס קבלן בכיר', 'מהנדס קבלן', 'טכנאי קבלן'];
    const years = [2022, 2023, 2024, 2025, 2026];

    // לכל מחלקה: התפלגות סגל לפי מסלול+דרגה + נתוני עזר
    const divisions = [];
    centers.forEach(c => c.divisions.forEach(dv => {
      const size = ri(r, 28, 85);
      const mix = { eng: 0.42 + r() * 0.1, sci: 0.22 + r() * 0.08, astro: 0.14 + r() * 0.08 };
      mix.ground = Math.max(0.06, 1 - mix.eng - mix.sci - mix.astro);
      const cells = {}; // track -> rank -> {count, fte, hours}
      tracks.forEach(tr => {
        cells[tr.key] = {};
        const trackN = Math.max(1, Math.round(size * mix[tr.key]));
        const rankSplit = tr.ranks.length === 4 ? [0.34, 0.27, 0.26, 0.13] : [0.62, 0.38];
        tr.ranks.forEach((rk, rki) => {
          const count = Math.max(0, Math.round(trackN * rankSplit[rki] * (0.85 + r() * 0.3)));
          const fte = +(count * (0.62 + r() * 0.34)).toFixed(1);
          const hours = Math.round(count * (5.4 + r() * 3.2)); // שעות סימולטור שבועיות
          cells[tr.key][rk] = { count, fte, hours };
        });
      });
      const total = tracks.reduce((a2, tr) => a2 + tr.ranks.reduce((b, rk) => b + cells[tr.key][rk].count, 0), 0);
      const guests = {};
      guestRanks.forEach((gr, gi) => {
        guests[gr] = Math.round(total * [0.06, 0.14, 0.2, 0.1][gi] * (0.7 + r() * 0.6));
      });
      divisions.push({
        center: c.name, name: dv, cells, total, guests,
        gender: { m: Math.round(total * (0.52 + r() * 0.14)), }, // f = total-m
        tenure: Math.round(total * (0.55 + r() * 0.2)),         // בעלי קביעות
      });
    }));
    divisions.forEach(dv => dv.gender.f = dv.total - dv.gender.m);

    // סדרה רב-שנתית (סה"כ הסוכנות)
    const yearly = years.map((y, yi) => {
      const grow = 1 + yi * 0.055;
      const staffH = Math.round(2350 * grow * (0.97 + r() * 0.06));
      const contractorH = Math.round(820 * (1 + yi * 0.09) * (0.95 + r() * 0.1));
      return {
        year: y,
        staffHours: staffH,
        contractorHours: contractorH,
        totalHours: staffH + contractorH,
        applications: Math.round(5100 * grow * (0.97 + r() * 0.06)), // מועמדויות לתוכנית האסטרונאוטים
      };
    });

    return { centers, tracks, guestRanks, divisions, years, yearly };
  })();

  /* ================= 5) פילוח עובדים - משלחת אולימפית ================= */
  const olympic = (() => {
    const r = rng(2028); // לוס אנג'לס
    const sports = [
      { key: 'athletics', label: 'אתלטיקה', color: PAL.s1 },
      { key: 'swim', label: 'שחייה', color: PAL.s5 },
      { key: 'judo', label: 'ג\'ודו', color: PAL.s2 },
      { key: 'gym', label: 'התעמלות', color: PAL.s3 },
      { key: 'sail', label: 'שיט וגלישה', color: PAL.s7 },
      { key: 'cycle', label: 'אופניים', color: PAL.s8 },
    ];
    const centers = ['מכון וינגייט', 'תל אביב', 'ירושלים', 'חיפה', 'אילת'];
    const genders = [{ key: 'f', label: 'ספורטאיות' }, { key: 'm', label: 'ספורטאים' }];
    const ageBuckets = [
      { key: 'b1', label: 'עד 18' }, { key: 'b2', label: '19-22' }, { key: 'b3', label: '23-26' },
      { key: 'b4', label: '27-30' }, { key: 'b5', label: '31-35' }, { key: 'b6', label: '36+' },
    ];
    const tenureBuckets = [
      { key: 't1', label: 'עד שנתיים' }, { key: 't2', label: '3-5' }, { key: 't3', label: '6-9' },
      { key: 't4', label: '10-14' }, { key: 't5', label: '15+' },
    ];

    const list = [];
    for (let i = 0; i < 124; i++) {
      const sport = pick(r, sports).key;
      const center = sport === 'sail' ? pick(r, ['אילת', 'אילת', 'חיפה']) :
                     sport === 'gym' ? pick(r, ['מכון וינגייט', 'תל אביב']) :
                     sport === 'judo' ? pick(r, ['מכון וינגייט', 'מכון וינגייט', 'ירושלים']) : pick(r, centers);
      const age = sport === 'gym' ? ri(r, 16, 24) : sport === 'sail' ? ri(r, 20, 38) : ri(r, 17, 34);
      const ageB = age <= 18 ? 'b1' : age <= 22 ? 'b2' : age <= 26 ? 'b3' : age <= 30 ? 'b4' : age <= 35 ? 'b5' : 'b6';
      const years = Math.min(Math.max(1, age - 15), Math.round(1 + Math.pow(r(), 1.3) * 16));
      const tenB = years <= 2 ? 't1' : years <= 5 ? 't2' : years <= 9 ? 't3' : years <= 14 ? 't4' : 't5';
      list.push({
        gender: r() < 0.48 ? 'f' : 'm',
        sport, center, ageB, tenB,
      });
    }
    return { sports, centers, genders, ageBuckets, tenureBuckets, list };
  })();

  return { PAL, MONTHS, recruit, hogwarts, claude, nasa, olympic };
})();
