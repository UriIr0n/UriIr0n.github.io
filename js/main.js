/* =====================================================================
   main.js - כרטיסי פרויקטים, ניתוב, רספונסיביות
   ===================================================================== */
(() => {

  const PROJECTS = [
    {
      id: 'recruit', emoji: '🚀', accent: '#3987e5',
      theme: 'בעולם של: חברת הייטק NovaTech Inc.',
      title: 'חדר המצב של הגיוס',
      original: 'דשבורד גיוס ארגוני',
      desc: 'אפיינתי מאפס שלושה דוחות מקור מול מערכת "אדם" ובניתי כלי תפעולי שמתעדכן פעמיים בחודש: כמה משרות פתוחות במצטבר, מה נפתח ונסגר החודש, כמה זמן כל משרה פתוחה ואיזו לתעדף. משמש את המגייסות, ראש מדור הגיוס והסמנכ"ל.',
      tags: ['אפיון מול מערכת "אדם"', 'Power Query: איחוד תיקיות', 'Drill-down', 'מגמות שנתיות'],
    },
    {
      id: 'hogwarts', emoji: '🪄', accent: '#9085e9',
      theme: 'בעולם של: הוגוורטס',
      title: 'היעדרויות סגל: פרופיל בית',
      original: 'דשבורד היעדרויות: פרופיל מחלקתי',
      desc: 'כלי שמראה לכל מחלקה איפה היא עומדת מול שאר הארגון: ניצול מחלה, חופשה וסך היעדרות מול ערכי סף שהגדרנו, צלילה עד העובד החורג, וכל רבעון מול הרבעון המקביל אשתקד. עם RLS, כל מנהל רואה רק את המחלקה שלו. (ספוילר: סלית\'רין.)',
      tags: ['RLS: הרשאות ברמת שורה', 'ערכי סף וחריגים', 'השוואה אשתקד', 'גרף⇄טבלה ב-Bookmarks'],
    },
    {
      id: 'claude', emoji: '✨', accent: '#d95926',
      theme: 'בעולם של: Anthropic, מנויי Claude',
      title: 'המרוץ למיליון נרשמים',
      original: 'סטטוס הרשמה: השוואה תקופתית',
      desc: 'דוח שהוכן ידנית ארבע שעות בשבוע, במשך שנים, הפך לאוטומציה מקצה לקצה: שיטחתי את כל דוחות העבר לבסיס נתונים אחד, וכל דוח חדש ממערכת "מכלול" נטען אליו אוטומטית. ארבע שנות מגמות הרשמה במסך אחד, שממשיך לרוץ קדימה לבד.',
      tags: ['אוטומציה מקצה לקצה', 'איחוד נתוני עבר', 'ציר זמן מנורמל', 'השוואת מחזורים'],
    },
    {
      id: 'nasa', emoji: '🛰️', accent: '#199e70',
      theme: 'בעולם של: נאס"א',
      title: 'הרכב הסוכנות: מסלולים, דרגות ותקנים',
      original: 'פילוח ארגוני: סגל בכיר',
      desc: 'נקודת-העל של ההנהלה על הסגל הבכיר: איפה יש תקנים, איפה חסרים ומי מאייש בפועל. עץ ארגוני חי (מסלול ← דרגה) עם שלוש שכבות תצוגה: מצבה, תקנים ושעות סימולטור, כולל קבלני חוץ והשוואה רב-שנתית שמראה לאן זורם התקציב.',
      tags: ['60+ מדדי DAX', 'Custom Visual', '3 שכבות Bookmarks', 'טבלת גישור'],
    },
    {
      id: 'olympic', emoji: '🥇', accent: '#e66767',
      theme: 'בעולם של: המשלחת האולימפית',
      title: 'המשלחת האולימפית: דמוגרפיה',
      original: 'פילוח עובדים',
      desc: 'תעודת הזהות של המשלחת: גיל, ותק, מגדר, ענף ומרכז אימון במסך אחד. לחיצה על כל פלח מסננת את שאר התרשימים בזמן אמת. נסו לסנן לאילת.',
      tags: ['Cross-filtering מלא', 'Binning גיל וותק', 'סלייסרים מסונכרנים', 'דמוגרפיה'],
    },
  ];

  const DASHBOARDS = {
    recruit: () => DashRecruit.render(),
    hogwarts: () => DashHogwarts.render(),
    claude: () => DashClaude.render(),
    nasa: () => DashNasa.render(),
    olympic: () => DashOlympic.render(),
  };

  /* ---------- כרטיסי פרויקטים + סלייסר - כן, גם העמוד הזה דשבורד ---------- */
  const CAPS = {
    recruit: ['auto', 'interact'],
    hogwarts: ['rls', 'compare', 'interact'],
    claude: ['auto', 'compare'],
    nasa: ['interact', 'compare'],
    olympic: ['interact'],
  };
  const CAP_OPTIONS = [
    { key: 'auto', label: 'אוטומציה מקצה לקצה' },
    { key: 'compare', label: 'השוואה תקופתית' },
    { key: 'rls', label: 'RLS והרשאות' },
    { key: 'interact', label: 'Drill-down וחיתוך צולב' },
  ];
  const grid = document.getElementById('projects-grid');
  let capFilter = null;

  function renderProjects() {
    const shown = PROJECTS.filter(p => !capFilter || CAPS[p.id].includes(capFilter));
    grid.innerHTML = shown.map(p => `
    <a class="proj-card" style="--accent:${p.accent}" href="#/${p.id}" aria-label="פתיחת דשבורד ${p.title}">
      <div class="head">
        <span class="emoji" aria-hidden="true">${p.emoji}</span>
        <div><div class="theme">${p.theme}</div><h3>${p.title}</h3></div>
      </div>
      <div class="desc"><b style="color:var(--ink)">הפרויקט המקורי: ${p.original}.</b> ${p.desc}</div>
      <div class="tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      <span class="open">כניסה לדשבורד האינטראקטיבי <span class="arr">←</span></span>
    </a>`).join('');
    grid.querySelectorAll('.proj-card').forEach(c => c.style.textDecoration = 'none');

    const slicerEl = document.getElementById('projects-slicer');
    if (slicerEl) Charts.seg(slicerEl, {
      options: CAP_OPTIONS, value: capFilter, allLabel: 'הכל',
      onChange: v => { capFilter = v; renderProjects(); },
    });
    const countEl = document.getElementById('projects-count');
    if (countEl) countEl.textContent = capFilter
      ? `מציג ${shown.length} מתוך ${PROJECTS.length} דשבורדים`
      : `${PROJECTS.length} דשבורדים · נסו את הסלייסר`;
  }
  renderProjects();

  /* ---------- חותמת תאריך ושעה עדכנית בעמוד הבית ---------- */
  const refreshEl = document.getElementById('hero-refresh');
  if (refreshEl) {
    const now = new Date();
    refreshEl.textContent = '· ' +
      now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- ניתוב ---------- */
  let active = null;   // הדשבורד הפעיל
  let onHome = true;   // האם המסך הנוכחי הוא עמוד הבית
  let homeScroll = 0;  // מיקום הגלילה האחרון בעמוד הבית - לשחזור מדויק ב"חזרה"
  // מבטלים את שחזור הגלילה האוטומטי של הדפדפן כדי לשלוט בו בעצמנו
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function route() {
    // לפני שעוזבים את עמוד הבית - זוכרים בדיוק איפה היינו
    if (onHome) homeScroll = window.scrollY;

    const h = location.hash.replace(/^#\/?/, '');
    const [page, anchor] = h.split('#');
    const target = DASHBOARDS[page] ? page : 'home';

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + (target === 'home' ? 'home' : target)).classList.add('active');

    if (target === 'home') {
      active = null;
      onHome = true;
      if (anchor) {
        requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }));
      } else {
        // חזרה מדשבורד - קופצים בדיוק לנקודה שממנה יצאנו
        const y = homeScroll;
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
      }
    } else {
      active = target;
      onHome = false;
      window.scrollTo({ top: 0 });
      DASHBOARDS[target]();
    }
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- כפתורי מייל: פתיחת טיוטה מותאמת למבקר + העתקה ללוח ---------- */
  (function emailCopy() {
    const EMAIL = 'uriiron20@gmail.com';
    const ROLE_KEY = 'uriiron_portfolio_role';

    // טיוטה מוכנה לפי סוג המבקר (מהשאלון "מי אני?"). המבקר הוא שכותב אליי,
    // אז הניסוח מנוסח מצדו - נושא + גוף שהוא רק צריך להשלים ולשלוח.
    const DRAFTS = {
      recruiter: {
        subject: 'פנייה דרך תיק העבודות – הזדמנות תעסוקתית',
        body: 'היי אורי,\n\nהגעתי לתיק העבודות שלך והפרויקטים עשו עליי רושם.\nיש אצלנו תפקיד בתחום ה-BI/דאטה שנראה לי מתאים לך, ואשמח לתאם שיחה קצרה.\n\nמתי נוח לך לדבר?\n\n',
      },
      employer: {
        subject: 'פנייה בנוגע לתפקיד BI / דאטה',
        body: 'היי אורי,\n\nראיתי את האתר ואת הדשבורדים שבנית, וזה בדיוק סוג העבודה שאנחנו מחפשים.\nאשמח שנקבע שיחה כדי לבדוק התאמה.\n\nתודה,\n\n',
      },
      bi: {
        subject: 'רשמים מהאתר – מ-BI ל-BI',
        body: 'היי אורי,\n\nנהניתי לעבור על האתר, במיוחד על מנוע התרשימים שכתבת בוונילה.\nאשמח להחליף רשמים ולשמוע איך בנית את זה.\n\nכל טוב,\n\n',
      },
      friend: {
        subject: 'היי, נכנסתי לאתר שלך',
        body: 'היי אורי,\n\nנכנסתי לאתר וזה יצא ממש מגניב.\nרק רציתי להגיד יישר כוח.\n\n',
      },
      other: {
        subject: 'פנייה דרך תיק העבודות',
        body: 'היי אורי,\n\nהגעתי לתיק העבודות שלך ורציתי ליצור קשר.\n\n',
      },
    };
    function mailtoUrl() {
      const d = DRAFTS[localStorage.getItem(ROLE_KEY)] || DRAFTS.other;
      return `mailto:${EMAIL}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`;
    }

    let toast = null, toastT = null;
    function showToast(msg) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastT);
      toastT = setTimeout(() => toast.classList.remove('show'), 3200);
    }
    function legacyCopy(text) {
      // fallback לדפדפנים ישנים / file://
      return new Promise((res, rej) => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        ok ? res() : rej(new Error('copy failed'));
      });
    }
    function copy(text) {
      if (navigator.clipboard?.writeText)
        return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
      return legacyCopy(text);
    }
    document.querySelectorAll('[data-copy-email]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        // קודם מעתיקים את הכתובת ללוח (בזמן שיש עדיין פוקוס), כגיבוי
        copy(EMAIL).then(
          () => showToast('✉ פתחתי לך טיוטה במייל · הכתובת גם הועתקה: ' + EMAIL),
          () => showToast('המייל שלי: ' + EMAIL),
        );
        // ואז פותחים בתוכנת המייל טיוטה מוכנה, מותאמת לסוג המבקר
        window.location.href = mailtoUrl();
      });
    });
  })();

  /* ---------- דשבורד הרפאים ברקע ה-Hero ---------- */
  (function ghostDash() {
    const svg = document.getElementById('gd-svg');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent = svg) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      parent.appendChild(e); return e;
    };
    // מחולל דטרמיניסטי - אותה תנועה בכל טעינה
    let seed = 20260712;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;

    // קווי רשת
    for (let y = 130; y <= 480; y += 88)
      el('line', { x1: 30, y1: y, x2: 1170, y2: y, stroke: '#3987e5', 'stroke-width': 1, opacity: 0.07 });

    // עמודות "נושמות" לאורך התחתית
    const barColors = ['#3987e5', '#9085e9', '#199e70'];
    for (let i = 0; i < 26; i++) {
      const x = 40 + i * 44;
      const h = 90 + rnd() * 150;
      const bar = el('rect', {
        x, y: 560 - h, width: 24, height: h, rx: 4,
        fill: barColors[i % 3], opacity: 0.18, class: 'gd-bar',
      });
      bar.style.setProperty('--a', (0.35 + rnd() * 0.25).toFixed(2));
      bar.style.setProperty('--b', (0.75 + rnd() * 0.25).toFixed(2));
      bar.style.setProperty('--dur', (3 + rnd() * 3.5).toFixed(1) + 's');
      bar.style.setProperty('--del', (-rnd() * 6).toFixed(1) + 's');
    }

    // שני גרפי קווים שמציירים את עצמם
    const wave = (baseY, amp, phase) => {
      let d = `M0,${baseY}`;
      for (let x = 60; x <= 1200; x += 60) {
        const y = baseY - Math.sin(x / 160 + phase) * amp - rnd() * 26;
        d += ` L${x},${Math.round(y)}`;
      }
      return d;
    };
    const l1 = el('path', { d: wave(300, 42, 0.5), stroke: '#3987e5', 'stroke-width': 2.5, opacity: 0.3, class: 'gd-line', pathLength: 1 });
    l1.style.setProperty('--dur', '12s');
    const l2 = el('path', { d: wave(370, 30, 2.2), stroke: '#9085e9', 'stroke-width': 2, opacity: 0.22, class: 'gd-line', pathLength: 1 });
    l2.style.setProperty('--dur', '12s');
    l2.style.setProperty('--del', '-6s');

    // דונאט מסתובב לאט (פינה עליונה)
    const donut = el('g', { class: 'gd-spin', opacity: 0.2 });
    const segs = [[0, 130, '#3987e5'], [140, 90, '#9085e9'], [240, 70, '#199e70'], [320, 30, '#c98500']];
    segs.forEach(([start, len, color]) => {
      const c = 2 * Math.PI * 64;
      el('circle', {
        cx: 1050, cy: 150, r: 64, fill: 'none', stroke: color, 'stroke-width': 17,
        'stroke-dasharray': `${(len / 360) * c} ${c}`,
        transform: `rotate(${start} 1050 150)`,
      }, donut);
    });

    // כרטיסי KPI עם נקודת דופק
    [[70, 90], [250, 90]].forEach(([x, y], i) => {
      const g = el('g', { opacity: 0.18 });
      el('rect', { x, y, width: 150, height: 64, rx: 10, fill: 'none', stroke: '#c3c2b7', 'stroke-width': 1.2 }, g);
      el('rect', { x: x + 88, y: y + 38, width: 46, height: 8, rx: 4, fill: '#c3c2b7', opacity: 0.5 }, g);
      el('rect', { x: x + 46, y: y + 16, width: 88, height: 12, rx: 5, fill: '#c3c2b7', opacity: 0.8 }, g);
      const dot = el('circle', { cx: x + 22, cy: y + 22, r: 5, fill: i ? '#199e70' : '#3987e5', class: 'gd-pulse' }, g);
      dot.style.setProperty('--del', i ? '-1.2s' : '0s');
    });
  })();

  /* ---------- רינדור מחדש בשינוי גודל ---------- */
  let rzT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { if (active) DASHBOARDS[active](); }, 180);
  });
})();
