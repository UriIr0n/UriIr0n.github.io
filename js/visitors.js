/* =====================================================================
   visitors.js - מוני המבקרים החיים של האתר

   ספק המונים: Abacus (abacus.jasoncameron.dev) - חינמי, בלי הרשמה
   ובלי מפתח בקוד, עם CORS פתוח. החלפנו אליו את CounterAPI v1 שהוצא
   משימוש ומחזיר 410 Gone, ולכן כל המונים באתר הפסיקו לעבוד.

   נקודות קצה:
     /hit/<ns>/<key>  - מגדיל ב-1 ומחזיר {"value": N}  (יוצר מונה אם אין)
     /get/<ns>/<key>  - קריאה בלבד, בלי להגדיל

   שתי החלטות שחשוב לשמור עליהן:
   1. כל מונה נספר פעם אחת למכשיר (דגל ב-localStorage), לא לפי כניסה.
   2. הערך האחרון שנקרא בהצלחה נשמר בקאש מקומי ומוצג מיד בטעינה. ככה
      תקלת רשת רגעית לא הופכת את הווידג'ט ל"לא זמין" מול מגייס שצופה.
   ===================================================================== */
(() => {
  'use strict';

  // Namespace נקי: המונים של v1 אבדו בהוצאה משימוש ואי אפשר לשחזר, והספרות
  // שנצברו בזמן הבדיקות לא מייצגות מבקרים אמיתיים. מתחילים מאפס.
  const NS = 'uriiron-portfolio-2026';
  const BASE = 'https://abacus.jasoncameron.dev';
  // כל מפתחות ה-localStorage נושאים את שם ה-namespace, כדי שאיפוס מונים
  // (החלפת NS) יאפס גם את הקאש וגם את דגלי "כבר נספר" של המכשיר.
  const LS = name => `${NS}_${name}`;
  const CACHE = key => LS(`count_${key}`);

  // קריאה מהקאש המקומי - מה שהוצג בפעם האחרונה שהרשת ענתה.
  function cached(key) {
    const raw = localStorage.getItem(CACHE(key));
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  // bump=true מגדיל את המונה, אחרת קריאה בלבד. תמיד מחזיר מספר או null.
  // 404 מהשרת = המונה עדיין לא נוצר, כלומר אפס אמיתי - ולא "לא ידוע". רק
  // כשל רשת/פורמט נופל חזרה לקאש, ואם גם הוא ריק מוחזר null.
  function counter(key, bump) {
    const url = `${BASE}/${bump ? 'hit' : 'get'}/${NS}/${key}`;
    return fetch(url)
      .then(r => {
        if (r.status === 404) return { value: 0 };
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(d => {
        if (typeof d.value !== 'number') throw new Error('bad payload');
        localStorage.setItem(CACHE(key), String(d.value));
        return d.value;
      })
      .catch(() => cached(key));
  }

  const heNum = n => n.toLocaleString('he-IL');

  // מספר נמוך בגופן ענק הוא הוכחה חברתית שלילית: "2 מבקרים" אומר למגייס
  // שאף אחד לא נכנס לכאן. הבלוק מתחיל מוסתר ב-HTML ונחשף רק כשהמונה הראשי
  // עובר את הסף, כך שאין הבהוב של "···" שנעלם. עד אז נשארות שאלת התפקיד
  // והדונאט, שהם החלק המעניין ממילא.
  const SHOW_FROM = 25;
  const countsEl = document.getElementById('visitor-counts');
  function revealIfEnough(n) {
    if (countsEl && typeof n === 'number' && n >= SHOW_FROM) countsEl.hidden = false;
  }

  /* ---------------------------------------------------------------
     1. מונה מבקרים ייחודיים
     --------------------------------------------------------------- */
  (() => {
    const KEY = 'site-visits';
    const SEEN = LS('visited');
    const el = document.getElementById('visitor-count');
    if (!el) return;

    const label = 'מבקרים באתר';
    const render = n => {
      el.innerHTML = typeof n === 'number'
        ? `<b>${heNum(n)}</b><span>${label}</span>`
        : `<b>···</b><span>${label}</span>`;
    };
    render(cached(KEY)); // מציגים מיד את הערך המוכר, בלי להמתין לרשת

    const isNew = localStorage.getItem(SEEN) !== '1';
    counter(KEY, isNew).then(n => {
      if (isNew) localStorage.setItem(SEEN, '1');
      render(n);
      revealIfEnough(n);
    });
  })();

  /* ---------------------------------------------------------------
     2. שאלון "מי אני" + דונאט התפלגות מבקרים
     בחירה אחת למכשיר, כל קטגוריה = מונה נפרד באותו namespace.
     --------------------------------------------------------------- */
  (() => {
    const ROLE_KEY = LS('role');
    const ROLES = [
      { key: 'client',    label: 'מתעניין/ת בשירות', counter: 'role-client',    color: '#199e70' },
      { key: 'recruiter', label: 'מגייס/ת',          counter: 'role-recruiter', color: '#3987e5' },
      { key: 'bi',        label: 'קולגה',            counter: 'role-bi',        color: '#9085e9' },
      { key: 'friend',    label: 'חבר/מכר/סקרן',     counter: 'role-friend',    color: '#e66767' },
    ];

    const promptEl = document.getElementById('visitor-roles-prompt');
    const btnsEl = document.getElementById('visitor-roles-btns');
    const chartEl = document.getElementById('visitor-roles-chart');
    if (!promptEl || !btnsEl || !chartEl || typeof Charts === 'undefined') return;

    let counts = ROLES.map(r => cached(r.counter) || 0);

    function draw() {
      Charts.donut(chartEl, {
        items: ROLES.map((r, i) => ({ label: r.label, value: counts[i], color: r.color, key: r.key })),
        size: 116,
        centerTitle: 'ענו',
        valueLabel: 'ענו',
        emptyHint: 'תהיו הראשונים שעונים',
      });
    }

    draw();
    Promise.all(ROLES.map(r => counter(r.counter, false)))
      .then(vals => { counts = vals.map(v => v || 0); draw(); });

    if (localStorage.getItem(ROLE_KEY)) {
      promptEl.style.display = 'none';
      return;
    }

    ROLES.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.label;
      b.addEventListener('click', () => {
        localStorage.setItem(ROLE_KEY, r.key);
        promptEl.style.display = 'none';
        // מציירים מיד את הקול שנוסף, בלי להמתין לתשובת הרשת - הגרף אמור
        // להגיב ללחיצה מיידית.
        counts[i] += 1;
        draw();
        counter(r.counter, true).then(n => {
          if (typeof n === 'number') { counts[i] = n; draw(); }
        });
      });
      btnsEl.appendChild(b);
    });
  })();

  /* ---------------------------------------------------------------
     3. מבקר חוזר - הודעת "שמח לראות אותך שוב" + מונה חוזרים ייחודי
     מונה נפרד שסופר כל מכשיר פעם אחת בלבד, בכניסה החוזרת הראשונה שלו.
     --------------------------------------------------------------- */
  (() => {
    const KEY = 'returning-visits';
    const SEEN_KEY = LS('first_seen');        // סומן אחרי הכניסה הראשונה
    const RET_COUNTED_KEY = LS('returning_counted'); // המכשיר כבר נספר כחוזר

    const isReturning = localStorage.getItem(SEEN_KEY) === '1';
    if (!isReturning) localStorage.setItem(SEEN_KEY, '1'); // כניסה ראשונה - לא מציגים כלום

    const banner = document.getElementById('welcome-back');
    if (isReturning && banner) {
      banner.hidden = false;
      // נסגרת לבד אחרי 5 שניות כדי שלא תדרוש פעולה מהמבקר. מי שמרחף מעליה
      // או ניגש אליה במקלדת מקבל עוד זמן.
      let dismissTimer = setTimeout(() => { banner.hidden = true; }, 5000);
      const hold = () => clearTimeout(dismissTimer);
      const resume = () => { hold(); dismissTimer = setTimeout(() => { banner.hidden = true; }, 2500); };
      banner.addEventListener('mouseenter', hold);
      banner.addEventListener('mouseleave', resume);
      banner.addEventListener('focusin', hold);
      banner.addEventListener('focusout', resume);
      document.getElementById('welcome-back-close')
        ?.addEventListener('click', () => { clearTimeout(dismissTimer); banner.hidden = true; });
    }

    // אייקון SVG נקי בלי רקע (בסגנון קו, כמו שאר האתר)
    const ICON = '<svg class="ret-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
    const el = document.getElementById('visitor-returning-count');
    if (!el) return;

    const render = n => {
      el.innerHTML = typeof n === 'number'
        ? `<b>${heNum(n)}</b><span>${ICON} חזרו לבקר שוב</span>`
        : `<b>···</b><span>${ICON} חזרו לבקר שוב</span>`;
    };
    render(cached(KEY));

    const firstReturn = isReturning && localStorage.getItem(RET_COUNTED_KEY) !== '1';
    counter(KEY, firstReturn).then(n => {
      if (firstReturn) localStorage.setItem(RET_COUNTED_KEY, '1');
      render(n);
    });
  })();
})();
