/* =====================================================================
   visitors.js - מונה מבקרים ייחודי למכשיר (לא לפי כניסה)
   מסתמך על CounterAPI (api.counterapi.dev) + דגל ב-localStorage
   כדי שאותו מכשיר לא ייספר יותר מפעם אחת.
   ===================================================================== */
(() => {
  const API_BASE = 'https://api.counterapi.dev/v1/uriiron-portfolio/site-visits';
  const STORAGE_KEY = 'uriiron_portfolio_visited';
  const el = document.getElementById('visitor-count');
  if (!el) return;

  const alreadyCounted = localStorage.getItem(STORAGE_KEY) === '1';
  // הכתובת ל"קריאה בלבד" חייבת סלאש בסוף - אחרת השרת מפנה (301) לכתובת עם סלאש,
  // וההפניה הזו לא נושאת כותרות CORS ונחסמת בדפדפן.
  const url = alreadyCounted ? `${API_BASE}/` : `${API_BASE}/up`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (!alreadyCounted) localStorage.setItem(STORAGE_KEY, '1');
      if (typeof data.count === 'number') {
        el.innerHTML = `<b>${data.count.toLocaleString('he-IL')}</b><span>👁 מבקרים באתר</span>`;
      }
    })
    .catch(() => {}); // כשל שקט - לא חוסם את האתר
})();

/* =====================================================================
   שאלון "מי אני" + דונאט התפלגות מבקרים
   בחירה אחת למכשיר, כל קטגוריה = מונה CounterAPI נפרד באותו namespace.
   ===================================================================== */
(() => {
  const NS = 'uriiron-portfolio';
  const STORAGE_KEY = 'uriiron_portfolio_role';
  const ROLES = [
    { key: 'recruiter', label: 'מגייס/ת',      counter: 'role-recruiter', color: '#3987e5' },
    { key: 'employer',  label: 'מעסיק/ה',       counter: 'role-employer',  color: '#199e70' },
    { key: 'bi',        label: 'עמית/ה ל-BI',   counter: 'role-bi',        color: '#9085e9' },
    { key: 'friend',    label: 'חבר/מכר',       counter: 'role-friend',    color: '#e66767' },
    { key: 'other',     label: 'אחר',           counter: 'role-other',     color: '#c98500' },
  ];

  const promptEl = document.getElementById('visitor-roles-prompt');
  const btnsEl = document.getElementById('visitor-roles-btns');
  const chartEl = document.getElementById('visitor-roles-chart');
  if (!promptEl || !btnsEl || !chartEl || typeof Charts === 'undefined') return;

  // כמו במונה הראשי: לקריאה בלבד חובה סלאש בסוף כדי לא ליפול בהפניה חסרת CORS.
  const readUrl = counter => `https://api.counterapi.dev/v1/${NS}/${counter}/`;
  const upUrl = counter => `https://api.counterapi.dev/v1/${NS}/${counter}/up`;

  function fetchCount(counter) {
    return fetch(readUrl(counter))
      .then(r => r.json())
      .then(d => (typeof d.count === 'number' ? d.count : 0))
      .catch(() => 0); // מונה שעוד לא נוצר / כשל רשת - מתייחסים כ-0
  }

  function renderChart() {
    Promise.all(ROLES.map(r => fetchCount(r.counter))).then(counts => {
      const items = ROLES.map((r, i) => ({ label: r.label, value: counts[i], color: r.color, key: r.key }));
      Charts.donut(chartEl, { items, size: 116, centerTitle: 'ענו', valueLabel: 'ענו' });
    });
  }

  if (localStorage.getItem(STORAGE_KEY)) {
    promptEl.style.display = 'none';
  } else {
    ROLES.forEach(r => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.label;
      b.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, r.key);
        promptEl.style.display = 'none';
        fetch(upUrl(r.counter)).catch(() => {}).finally(renderChart);
      });
      btnsEl.appendChild(b);
    });
  }

  renderChart();
})();

/* =====================================================================
   מבקר חוזר - הודעת "שמח לראות אותך שוב" + מונה חוזרים ייחודי
   מונה נפרד ב-CounterAPI שסופר כל מכשיר פעם אחת בלבד, בכניסה החוזרת
   הראשונה שלו (כל מי שנכנס יותר מפעם אחת).
   ===================================================================== */
(() => {
  const NS = 'uriiron-portfolio';
  const RET_COUNTER = 'returning-visits';
  const SEEN_KEY = 'uriiron_portfolio_first_seen';            // סומן אחרי הכניסה הראשונה
  const RET_COUNTED_KEY = 'uriiron_portfolio_returning_counted'; // המכשיר כבר נספר כחוזר

  const isReturning = localStorage.getItem(SEEN_KEY) === '1';
  if (!isReturning) localStorage.setItem(SEEN_KEY, '1'); // כניסה ראשונה - לא מציגים כלום

  // הודעת "שמח לראות אותך שוב"
  const banner = document.getElementById('welcome-back');
  if (isReturning && banner) {
    banner.hidden = false;
    document.getElementById('welcome-back-close')
      ?.addEventListener('click', () => { banner.hidden = true; });
  }

  // מונה החוזרים - אייקון SVG נקי בלי רקע (בסגנון קו, כמו שאר האתר)
  const RET_ICON = '<svg class="ret-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
  const countEl = document.getElementById('visitor-returning-count');
  const render = n => {
    if (countEl && typeof n === 'number')
      countEl.innerHTML = `<b>${n.toLocaleString('he-IL')}</b><span>${RET_ICON} חזרו לבקר שוב</span>`;
  };

  const firstReturn = isReturning && localStorage.getItem(RET_COUNTED_KEY) !== '1';
  const counter = firstReturn ? RET_COUNTER + '/up' : RET_COUNTER + '/';
  const url = `https://api.counterapi.dev/v1/${NS}/${counter}`;

  fetch(url)
    .then(r => r.json())
    .then(d => {
      if (firstReturn) localStorage.setItem(RET_COUNTED_KEY, '1');
      render(d.count);
    })
    .catch(() => {}); // כשל שקט
})();
