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
      desc: 'כלי תפעולי שמתעדכן פעמיים בחודש: כמה משרות פתוחות, מה נפתח ונסגר, ולאיזו לתעדף.',
      tags: ['אפיון מול מערכת "אדם"', 'Power Query: איחוד תיקיות', 'Drill-down', 'מגמות שנתיות'],
    },
    {
      id: 'hogwarts', emoji: '🪄', accent: '#9085e9',
      theme: 'בעולם של: הוגוורטס',
      title: 'היעדרויות סגל: פרופיל בית',
      original: 'דשבורד היעדרויות: פרופיל מחלקתי',
      desc: 'כל מחלקה רואה איפה היא עומדת מול הארגון, עם RLS שמציג לכל מנהל רק את שלו. (ספוילר: סלית\'רין.)',
      tags: ['RLS: הרשאות ברמת שורה', 'ערכי סף וחריגים', 'השוואה אשתקד', 'גרף⇄טבלה ב-Bookmarks'],
    },
    {
      id: 'claude', emoji: '✨', accent: '#d95926',
      theme: 'בעולם של: Anthropic, מנויי Claude',
      title: 'המרוץ למיליון נרשמים',
      original: 'סטטוס הרשמה: השוואה תקופתית',
      desc: 'דוח שהוכן ידנית ארבע שעות בשבוע הפך לאוטומציה מלאה, שממשיכה לרוץ קדימה לבד.',
      tags: ['אוטומציה מקצה לקצה', 'איחוד נתוני עבר', 'ציר זמן מנורמל', 'השוואת מחזורים'],
    },
    {
      id: 'nasa', emoji: '🛰️', accent: '#199e70',
      theme: 'בעולם של: נאס"א',
      title: 'הרכב הסוכנות: מסלולים, דרגות ותקנים',
      original: 'פילוח ארגוני: סגל בכיר',
      desc: 'עץ ארגוני חי: איפה יש תקנים, איפה חסרים, ולאן זורם התקציב לאורך השנים.',
      tags: ['60+ מדדי DAX', 'Custom Visual', '3 שכבות Bookmarks', 'טבלת גישור'],
    },
    {
      id: 'olympic', emoji: '🥇', accent: '#e66767',
      theme: 'בעולם של: המשלחת האולימפית',
      title: 'המשלחת האולימפית: דמוגרפיה',
      original: 'פילוח עובדים',
      desc: 'גיל, ותק, מגדר וענף במסך אחד, עם סינון חוצה-תרשימים בזמן אמת. נסו לסנן לאילת.',
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
      <div class="orig">שחזור של: ${p.original}</div>
      <p class="desc">${p.desc}</p>
      <div class="tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      <span class="open">כניסה לדשבורד האינטראקטיבי <span class="arr">←</span></span>
    </a>`).join('');

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

  /* ---------- יצירת קשר: כפתורי מייל/טלפון + תפריט הבחירה בניווט ---------- */
  (function contactActions() {
    const EMAIL = 'uriiron20@gmail.com';
    const PHONE = '052-624-6347';

    // טיוטה אחידה שנפתחת מוכנה - המבקר רק משלים ושולח.
    const DRAFT = {
      subject: 'פנייה דרך תיק העבודות',
      body: 'היי אורי,\n\nהגעתי דרך תיק העבודות שלך\n',
    };

    // חלון כתיבה של Gmail בלשונית חדשה - נפתח מיד עם הכתובת, הנושא והתוכן,
    // ורק נשאר ללחוץ "שלח" או לערוך. אמין יותר מ-mailto שלפעמים רק שומר טיוטה שקטה.
    function gmailUrl() {
      const p = new URLSearchParams({ view: 'cm', fs: '1', to: EMAIL, su: DRAFT.subject, body: DRAFT.body });
      return 'https://mail.google.com/mail/?' + p.toString();
    }
    function mailtoUrl() {
      return `mailto:${EMAIL}?subject=${encodeURIComponent(DRAFT.subject)}&body=${encodeURIComponent(DRAFT.body)}`;
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
          () => showToast('✉ פתחתי לך חלון כתיבה במייל · הכתובת גם הועתקה: ' + EMAIL),
          () => showToast('המייל שלי: ' + EMAIL),
        );
        // פותחים חלון כתיבה של Gmail בלשונית חדשה, עם טיוטה מוכנה ומותאמת
        const win = window.open(gmailUrl(), '_blank', 'noopener');
        // אם חוסם חלונות מנע את הפתיחה - נופלים חזרה ל-mailto (תוכנת המייל של המכשיר)
        if (!win) window.location.href = mailtoUrl();
        closeContactMenu();
      });
    });

    document.querySelectorAll('[data-copy-phone]').forEach(btn => {
      btn.addEventListener('click', () => {
        copy(PHONE).then(
          () => showToast('📞 מספר הטלפון הועתק: ' + PHONE),
          () => showToast('הטלפון שלי: ' + PHONE),
        );
        closeContactMenu();
      });
    });

    // תפריט "צור קשר" בניווט: בחירה בין שליחת מייל להעתקת הטלפון
    const contactToggle = document.querySelector('[data-contact-toggle]');
    const contactOptions = document.querySelector('[data-contact-options]');
    function closeContactMenu() {
      if (!contactToggle) return;
      contactOptions.hidden = true;
      contactToggle.setAttribute('aria-expanded', 'false');
    }
    if (contactToggle && contactOptions) {
      contactToggle.addEventListener('click', e => {
        e.stopPropagation();
        const willOpen = contactOptions.hidden;
        contactOptions.hidden = !willOpen;
        contactToggle.setAttribute('aria-expanded', String(willOpen));
      });
      document.addEventListener('click', e => {
        if (!e.target.closest('.contact-menu')) closeContactMenu();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeContactMenu();
      });
    }
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
