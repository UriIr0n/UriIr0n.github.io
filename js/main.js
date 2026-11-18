/* =====================================================================
   main.js - כרטיסי פרויקטים, ניתוב, רספונסיביות
   ===================================================================== */
(() => {

  const PROJECTS = [
    {
      id: 'recruit', accent: '#b98a00',
      theme: 'בעולם של: חברת הייטק NovaTech Inc.',
      title: 'חדר המצב של הגיוס',
      original: 'דשבורד גיוס ארגוני',
      desc: 'כלי תפעולי שמתעדכן פעמיים בחודש: כמה משרות פתוחות, מה נפתח ונסגר, ולאיזו לתעדף.',
      tags: ['אפיון מול מערכת "אדם"', 'Power Query: איחוד תיקיות', 'Drill-down', 'מגמות שנתיות'],
    },
    {
      id: 'hogwarts', accent: '#059eb1',
      theme: 'בעולם של: הוגוורטס',
      title: 'היעדרויות סגל: פרופיל בית',
      original: 'דשבורד היעדרויות: פרופיל מחלקתי',
      desc: 'כל מחלקה רואה איפה היא עומדת מול הארגון, עם RLS שמציג לכל מנהל רק את שלו. (ספוילר: סלית\'רין.)',
      tags: ['RLS: הרשאות ברמת שורה', 'ערכי סף וחריגים', 'השוואה אשתקד', 'גרף⇄טבלה ב-Bookmarks'],
    },
    {
      id: 'claude', accent: '#b66100',
      theme: 'בעולם של: Anthropic, מנויי Claude',
      title: 'המרוץ למיליון נרשמים',
      original: 'סטטוס הרשמה: השוואה תקופתית',
      desc: 'דוח שהוכן ידנית ארבע שעות בשבוע הפך לאוטומציה מלאה, שממשיכה לרוץ קדימה לבד.',
      tags: ['אוטומציה מקצה לקצה', 'איחוד נתוני עבר', 'ציר זמן מנורמל', 'השוואת מחזורים'],
    },
    {
      id: 'nasa', accent: '#17a478',
      theme: 'בעולם של: נאס"א',
      title: 'הרכב הסוכנות: מסלולים, דרגות ותקנים',
      original: 'פילוח ארגוני: סגל בכיר',
      desc: 'עץ ארגוני חי: איפה יש תקנים, איפה חסרים, ולאן זורם התקציב לאורך השנים.',
      tags: ['60+ מדדי DAX', 'Custom Visual', '3 שכבות Bookmarks', 'טבלת גישור'],
    },
    {
      id: 'olympic', accent: '#d15d4d',
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
    { key: 'interact', label: 'Drill-down' },
  ];
  const grid = document.getElementById('projects-grid');
  let capFilter = null;

  function cardHTML(p) {
    return `
    <a class="proj-card" style="--accent:${p.accent}" href="#/${p.id}" aria-label="פתיחת דשבורד ${p.title}">
      <div class="head">
        <div><div class="theme">${p.theme}</div><h3>${p.title}</h3></div>
      </div>
      <div class="orig">שחזור של: ${p.original}</div>
      <p class="desc">${p.desc}</p>
      <div class="tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      <span class="open">כניסה לדשבורד האינטראקטיבי <span class="arr">←</span></span>
    </a>`;
  }

  function renderProjects() {
    const shown = PROJECTS.filter(p => !capFilter || CAPS[p.id].includes(capFilter));
    grid.innerHTML = shown.map(cardHTML).join('');

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

  // תצוגה מקדימה בעמוד הבית: שלושה פרויקטים מגוונים, בלי סלייסר - הרשימה המלאה עברה לעמוד הפרויקטים
  const TEASER_IDS = ['recruit', 'claude', 'olympic'];
  const teaserGrid = document.getElementById('projects-teaser-grid');
  if (teaserGrid) {
    teaserGrid.innerHTML = TEASER_IDS.map(id => PROJECTS.find(p => p.id === id)).map(cardHTML).join('');
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
    const [rawPage, anchor] = h.split('#');
    // תמיכה בקישור עמוק לטאב ספציפי בתוך דשבורד: #/recruit:age
    const [page, tabKey] = rawPage.split(':');
    const STATIC_PAGES = ['projects', 'about']; // עמודי תוכן סטטיים, לא דשבורדים אינטראקטיביים
    const isDash = !!DASHBOARDS[page];
    const isStatic = STATIC_PAGES.includes(page);
    const target = isDash || isStatic ? page : 'home';

    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.removeAttribute('role'); });
    const pageEl = document.getElementById('page-' + target);
    pageEl.classList.add('active');
    pageEl.setAttribute('role', 'main');

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
      onHome = false;
      window.scrollTo({ top: 0 });
      if (isDash) {
        active = target;
        if (tabKey) Shell.setPendingTab(tabKey);
        DASHBOARDS[target]();
      } else {
        active = null; // עמוד סטטי - אין צורך ברינדור מחדש בשינוי גודל
        // דף "אודות" מכיל קרוסלה. carousel.js מאתחל אותה פעם אחת בטעינת הסקריפט,
        // לפני ש-route() בכלל רץ - אם הדף מוסתר באותו רגע (display:none), הרוחב
        // הנמדד יוצא שגוי. מאתחלים מחדש בכל כניסה לעמוד, כשהוא כבר גלוי בוודאות.
        if (target === 'about' && window.Carousel) {
          const el = document.querySelector('#page-about [data-carousel]');
          if (el) requestAnimationFrame(() => Carousel.init(el));
        }
      }
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
        // קליק עם מקש מצב (Ctrl/Cmd/Shift) או עכבר אמצעי מבקש התנהגות דפדפן רגילה
        // (פתיחה בלשונית/חלון חדשים) - לא חוסמים אותו, כדי שלא לשלול שליטה ממי שמבקש
        // את זה בפירוש. רק קליק רגיל מקבל את חוויית ה-Gmail המהירה.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        // קודם מעתיקים את הכתובת ללוח (בזמן שיש עדיין פוקוס), כגיבוי
        copy(EMAIL).then(
          () => showToast('פתחתי חלון כתיבה במייל. הכתובת גם הועתקה: ' + EMAIL),
          () => showToast('המייל שלי: ' + EMAIL),
        );
        // פותחים חלון כתיבה של Gmail בלשונית חדשה, עם טיוטה מוכנה ומותאמת
        const win = window.open(gmailUrl(), '_blank', 'noopener');
        // אם חוסם חלונות מנע את הפתיחה - נופלים חזרה ל-mailto (תוכנת המייל של המכשיר)
        if (!win) window.location.href = mailtoUrl();
      });
    });

    document.querySelectorAll('[data-copy-phone]').forEach(btn => {
      btn.addEventListener('click', () => {
        copy(PHONE).then(
          () => showToast('מספר הטלפון הועתק: ' + PHONE),
          () => showToast('הטלפון שלי: ' + PHONE),
        );
      });
    });

  })();

  /* ---------- רינדור מחדש בשינוי גודל ---------- */
  let rzT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { if (active) DASHBOARDS[active](); }, 180);
  });
})();
