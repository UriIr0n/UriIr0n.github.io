/* =====================================================================
   שכבת נתונים — fetch דק מעל PostgREST, בלי SDK ובלי תלות חיצונית.
   כל קריאה נופלת בחן: אם השרת לא זמין ה-UI מציג "—" ולא נשבר.
   ===================================================================== */
window.DB = (function () {
  var C = window.CFG;

  /* ------------------------------------------------------------------
     מזהה מכשיר: UUID אקראי ב-localStorage.
     הוא לא מזהה אדם. תפקידו היחיד למנוע חיזוק כפול מאותו דפדפן.
     ------------------------------------------------------------------ */
  function deviceId() {
    var id;
    try { id = localStorage.getItem(C.STORE.device); } catch (e) { /* מצב פרטי */ }
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
           'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
             var r = Math.random() * 16 | 0;
             return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
           });
      try { localStorage.setItem(C.STORE.device, id); } catch (e) {}
    }
    return id;
  }

  function ls(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  var token = null;   // JWT של מודרטור, אם יש
  function authToken() { return token || C.SUPABASE_ANON_KEY; }

  function rest(path, opts) {
    opts = opts || {};
    return fetch(C.SUPABASE_URL + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: Object.assign({
        'apikey': C.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + authToken(),
        'Content-Type': 'application/json'
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + ' ' + t); });
      return r.status === 204 ? null : r.json();
    });
  }

  /* ================================ נתוני דמה ================================
     משמשים רק במצב MOCK, לעיצוב בלי תשתית. הם לעולם לא מוצגים כמשובים
     אמיתיים: כשאין עדיין משפטים מאושרים הקיר מציג מצב ריק, לא ממלא בדמה.
     ========================================================================= */
  var MOCK_QUOTES = [
    { id: 1,  theme: 'courses',     cohort: 'year4', endorsements: 23, body: 'בקורס הדטרמיניסטיים לימדו אותנו לעבוד עם לינדו, כשהמרצה עצמו אמר בפירוש שלא משתמשים בזה בתעשייה.' },
    { id: 2,  theme: 'project',     cohort: 'year4', endorsements: 31, body: 'פרויקט הגמר היה תחושה של "רק תגישו משהו". אין ערב הצגה, אין במה, אין סגירה. בכל מכללה קטנה יש לפחות ערב פרויקטים.' },
    { id: 3,  theme: 'courses',     cohort: 'year4', endorsements: 19, body: 'בכרייה וניתוח נתונים בפייתון הקוד של המרצה לא עבד שנה אחרי. שיעור שלם ירד על לתקן סביבה במקום ללמוד.' },
    { id: 4,  theme: 'courses',     cohort: 'year3', endorsements: 27, body: 'למדנו SQL בצורה כל כך מינימלית שלא פתחנו את התוכנה בכיתה אפילו פעם אחת. בראיון הראשון שלי זו הייתה השאלה הראשונה.' },
    { id: 5,  theme: 'industry',    cohort: 'year4', endorsements: 34, body: 'ארבע שנים בלי הרצאה חיצונית אחת ובלי סיור אחד בחברה. יצאתי עם תואר ובלי מושג איך נראה מפעל מבפנים.' },
    { id: 6,  theme: 'attitude',    cohort: 'year4', endorsements: 21, body: 'כשהעלינו בעיות במהלך הסמסטר קיבלנו יחס מזלזל, גם ברמת המרצים וגם ברמת ראש המחלקה.' },
    { id: 7,  theme: 'regulations', cohort: 'year4', endorsements: 18, body: 'באמצע שנה ב שינו את הנהלים והודיעו שצריך ממוצע להתמחות. תכננו שלוש שנים קדימה לפי כללים אחרים.' },
    { id: 8,  theme: 'miluim',     cohort: 'year4', endorsements: 29, body: 'עושים ממוצע משותף למשרתי מילואים ולסטודנטים רגילים. במוסדות אחרים מפרידים לשני ממוצעים, וזה פוגע בשני הצדדים.' },
    { id: 9,  theme: 'teaching',    cohort: 'year3', endorsements: 25, body: 'מנסים להעלות את הרמה האקדמית בלי להעלות את רמת ההוראה. התוצאה היא שהפער נופל עלינו.' },
    { id: 10, theme: 'project',     cohort: 'year4', endorsements: 16, body: 'המנחה שקיבלתי לא היה מהתחום של הפרויקט. כל פגישה הייתה אני מסביר לו את הנושא במקום ההפך.' },
    { id: 11, theme: 'courses',     cohort: 'year4', endorsements: 22, body: 'קורס הסימולציה מבוסס על כלי שלא ראיתי מוזכר באף מודעת דרושים שקראתי בשנה האחרונה.' },
    { id: 12, theme: 'industry',    cohort: 'year3', endorsements: 20, body: 'אין שום ליווי לקראת חיפוש עבודה. לא סדנת קורות חיים, לא הכנה לראיונות, לא קשר למעסיקים.' },
    { id: 13, theme: 'teaching',    cohort: 'year4', endorsements: 14, body: 'יש מרצים שברור שרוצים שנצליח, ויש כאלה שהתחושה היא שהם מתאמצים להכשיל. ההבדל בין שני הסוגים הוא כל התואר.' },
    { id: 14, theme: 'courses',     cohort: 'year3', endorsements: 17, body: 'מערכי השיעור לא עברו רענון שנים. אותן מצגות, אותן דוגמאות, אותם תרגילים עם שנתונים ישנים.' }
  ];

  var MOCK_STATS = {
    total: 47, gated: false, min_n: 5,
    cohorts: { year4: 26, year3: 17, alumni: 4 },
    themes:  { courses: 4.4, project: 4.6, attitude: 3.9, industry: 4.7, teaching: 3.8, regulations: 3.5, miluim: 4.1 },
    skills:  { sql: 2.1, python: 2.6, simulation: 2.2, deterministic: 2.4, excel: 3.4, projects: 3.1, stats: 3.3, interviews: 1.9 },
    skills_by_cohort: {
      year4: { n: 26, sql: 2.3, python: 2.7, simulation: 2.3, deterministic: 2.5, excel: 3.6, projects: 3.3, stats: 3.4, interviews: 2.1 },
      year3: { n: 17, sql: 1.8, python: 2.4, simulation: 2.0, deterministic: 2.2, excel: 3.1, projects: 2.8, stats: 3.1, interviews: 1.6 },
      alumni:{ n: 4 }
    },
    ready_dist: { '1': 9, '2': 15, '3': 14, '4': 7, '5': 2 },
    ready_avg: 2.5,
    quotes_approved: 14,
    endorsements: 316
  };

  function delay(v, ms) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms || 260); }); }

  /* ================================ API ציבורי ================================ */

  function stats() {
    if (C.MOCK) return delay(JSON.parse(JSON.stringify(MOCK_STATS)));
    return rest('rpc/public_stats', { method: 'POST', body: {} }).catch(function () { return null; });
  }

  function approvedQuotes() {
    if (C.MOCK) return delay(MOCK_QUOTES.slice());
    return rest('quotes?status=eq.approved&select=id,body,theme,cohort,endorsements&order=endorsements.desc&limit=200')
      .catch(function () { return []; });
  }

  // שני הכתיבות מכוונות להיות בלתי מקושרות: אין מזהה משותף ביניהן.
  function submit(answers, quote) {
    if (C.MOCK) return delay({ ok: true, code: 'ok' });
    return rest('submissions', {
      method: 'POST', body: answers, headers: { 'Prefer': 'return=minimal' }
    }).then(function () {
      if (!quote || !quote.body) return { ok: true, code: 'ok' };
      // המשפט נשלח בנפרד. אם הוא נכשל, השאלון כבר נשמר.
      return rest('quotes', {
        method: 'POST', body: quote, headers: { 'Prefer': 'return=minimal' }
      }).then(function () { return { ok: true, code: 'ok' }; })
        .catch(function () { return { ok: true, code: 'quote_failed' }; });
    }).catch(function (e) {
      return { ok: false, code: 'error', message: String(e.message || e) };
    });
  }

  function endorsedSet() {
    try { return new Set(JSON.parse(ls(C.STORE.endorsed) || '[]')); } catch (e) { return new Set(); }
  }
  function markEndorsed(id) {
    var s = endorsedSet(); s.add(id);
    ls(C.STORE.endorsed, JSON.stringify(Array.from(s)));
  }

  function endorse(quoteId) {
    markEndorsed(quoteId);   // אופטימי: ה-UI מתעדכן מיד
    if (C.MOCK) return delay({ ok: true });
    return rest('quote_endorsements', {
      method: 'POST',
      body: { quote_id: quoteId, device_id: deviceId() },
      headers: { 'Prefer': 'return=minimal' }
    }).then(function () { return { ok: true }; })
      .catch(function () { return { ok: false }; });   // כפילות מהשרת = כבר נספר
  }

  /* ================================ מודרציה ================================ */

  function readSessionFromUrl() {
    var h = new URLSearchParams(location.hash.replace(/^#/, ''));
    var t = h.get('access_token');
    if (t) {
      token = t;
      try { sessionStorage.setItem('mishov_token', t); } catch (e) {}
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      try { token = sessionStorage.getItem('mishov_token'); } catch (e) {}
    }
    return token;
  }

  function signIn(email) {
    return fetch(C.SUPABASE_URL + '/auth/v1/otp', {
      method: 'POST',
      headers: { 'apikey': C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, options: { email_redirect_to: location.href.split('#')[0] } })
    }).then(function (r) { return r.ok; });
  }

  function signOut() {
    token = null;
    try { sessionStorage.removeItem('mishov_token'); } catch (e) {}
  }

  function allQuotes(status) {
    var f = status ? '&status=eq.' + status : '';
    return rest('quotes?select=id,body,theme,cohort,endorsements,status,created_on' + f + '&order=id.desc&limit=500');
  }

  function moderate(id, status, note) {
    return rest('quotes?id=eq.' + id, {
      method: 'PATCH',
      body: { status: status, moderated_at: new Date().toISOString(), moderator_note: note || null },
      headers: { 'Prefer': 'return=minimal' }
    });
  }

  return {
    deviceId: deviceId, ls: ls,
    stats: stats, approvedQuotes: approvedQuotes, submit: submit,
    endorse: endorse, endorsedSet: endorsedSet,
    readSessionFromUrl: readSessionFromUrl, signIn: signIn, signOut: signOut,
    hasToken: function () { return !!token; },
    allQuotes: allQuotes, moderate: moderate
  };
})();
