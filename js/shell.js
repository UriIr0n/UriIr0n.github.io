/* =====================================================================
   shell.js - שלד אחיד לעמוד דשבורד: כותרת, "על הפרויקט", טאבים, סיפור
   ===================================================================== */
const Shell = (() => {

  // טאב מבוקש מ-URL עמוק (main.js#route ממלא לפני קריאה ל-render() הראשונה
  // של הדשבורד). build() קורא וצורך אותו פעם אחת בבנייה הראשונית.
  let pendingTab = null;

  const ICONS = {
    back: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    spark: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  };

  function build(root, cfg) {
    const requested = pendingTab;
    pendingTab = null;
    const initialKey = (requested && cfg.tabs.some(t => t.key === requested)) ? requested : cfg.tabs[0].key;

    root.innerHTML = `
      <div class="dash-wrap">
        <div class="dash-head">
          <a class="back-btn" href="#/">${ICONS.back} חזרה</a>
          <div class="title-box">
            <h1>${cfg.title}</h1>
            <div class="sub">שחזור של הפרויקט המקורי: <b>${cfg.original}</b></div>
          </div>
          <span class="badge">${ICONS.lock} נתונים בדיוניים להדגמה</span>
        </div>

        <h2 class="sr-only">תוכן הדשבורד: ${cfg.title}</h2>

        <details class="about-proj">
          <summary>${ICONS.spark} <span class="label">על הפרויקט המקורי: מה בניתי ולמה</span> <span class="tw">▾</span></summary>
          <div class="body">
            <div class="col"><h3>האתגר העסקי</h3><p>${cfg.about.problem}</p></div>
            <div class="col"><h3>מה בניתי</h3><ul>${cfg.about.built.map(x => `<li>${x}</li>`).join('')}</ul></div>
            <div class="col"><h3>טכניקות Power BI</h3><ul>${cfg.about.tech.map(x => `<li>${x}</li>`).join('')}</ul></div>
            ${cfg.about.impact ? `<div class="impact">${cfg.about.impact}</div>` : ''}
          </div>
        </details>

        ${cfg.tabs.length > 1 ? `<div class="dash-tabs" role="tablist">
          ${cfg.tabs.map(t => `<button role="tab" data-tab="${t.key}" class="${t.key === initialKey ? 'active' : ''}">${t.label}</button>`).join('')}
        </div>` : ''}

        <div class="dash-hint" data-dash-hint hidden>
          
          <span class="tx">הדשבורד הזה חי: לחצו על עמודה, פלח או שורה בטבלה והכל מסתנן יחד.</span>
          <button type="button" class="hint-close" data-hint-close aria-label="הבנתי, סגירת ההסבר">✕</button>
        </div>

        <div class="story-card" id="story-${cfg.key}"></div>

        ${cfg.tabs.map(t => `<div class="dash-view ${t.key === initialKey ? 'active' : ''}" data-view="${t.key}"></div>`).join('')}
      </div>`;

    // רמז אינטראקטיביות: בלי זה רוב המבקרים לא מנחשים שאפשר ללחוץ על הגרפים,
    // וזה בדיוק ההבדל בין "יש לו גרפים" ל"הוא בנה כלי עבודה". מוצג פעם אחת
    // למכשיר, ונעלם ברגע שהמבקר באמת סינן משהו.
    const HINT_KEY = 'uriiron_dash_hint_seen';
    const hint = root.querySelector('[data-dash-hint]');
    if (hint) {
      let seen = false;
      try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (e) {}
      if (!seen) {
        hint.hidden = false;
        const dismiss = () => {
          if (hint.hidden) return;
          hint.hidden = true;
          try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
        };
        root.querySelector('[data-hint-close]').addEventListener('click', dismiss);
        // כל סינון אמיתי סוגר את הרמז: לחיצה על מוט/פלח, על סלייסר או על טאב
        root.addEventListener('click', ev => {
          if (ev.target.closest('.bar-hit, .seg button, .slicer select, [data-tab]')) dismiss();
        }, true);
      }
    }

    const views = {};
    cfg.tabs.forEach(t => views[t.key] = root.querySelector(`[data-view="${t.key}"]`));
    const storyEl = root.querySelector(`#story-${cfg.key}`);
    let activeTab = initialKey;
    let tabCb = null;

    root.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
        root.querySelectorAll('.dash-view').forEach(v => v.classList.toggle('active', v.dataset.view === activeTab));
        // מעדכנים את ה-URL בלי לעורר hashchange, כדי שאפשר יהיה לשתף/לסמן קישור לטאב הנוכחי
        history.replaceState(null, '', `#/${cfg.key}:${activeTab}`);
        if (tabCb) tabCb(activeTab);
      });
    });

    return {
      views,
      get activeTab() { return activeTab; },
      onTab(cb) { tabCb = cb; },
      setStory(html) {
        storyEl.innerHTML = html ? `<div>${html}</div>` : '';
        storyEl.style.display = html ? 'flex' : 'none';
      },
    };
  }

  return { build, ICONS, setPendingTab(key) { pendingTab = key; } };
})();
