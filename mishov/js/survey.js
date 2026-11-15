/* =====================================================================
   הטופס. שישה מסכים, קבוצת שאלות בכל אחד.
   בחרנו לקבץ 3-4 שאלות דירוג למסך ולא אחת: חמש־עשרה לחיצות "הבא"
   נוטשות יותר ממה שגלילה קצרה עושה.
   ===================================================================== */
window.Survey = (function () {
  var C = window.CFG;
  var answers = {};
  var step = 0;
  var started = Date.now();
  var STEPS = [];

  function el(id) { return document.getElementById(id); }

  /* ---------- בוני שדות ---------- */

  function scaleField(key, label, sub, lo, hi) {
    return '<div class="field" data-key="' + key + '">' +
      '<span class="q">' + label + '</span>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') +
      '<div class="scale" role="group" aria-label="' + label + '">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" data-v="' + n + '" aria-pressed="false">' + n + '</button>';
        }).join('') +
      '</div>' +
      '<div class="scale-ends"><span>1 · ' + lo + '</span><span>5 · ' + hi + '</span></div>' +
    '</div>';
  }

  function optsField(key, label, sub, options) {
    return '<div class="field" data-key="' + key + '">' +
      '<span class="q">' + label + '</span>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') +
      '<div class="opts" role="group" aria-label="' + label + '">' +
        options.map(function (o) {
          return '<button type="button" data-v="' + o.key + '" aria-pressed="false">' + o.label + '</button>';
        }).join('') +
      '</div></div>';
  }

  /* ---------- הגדרת המסכים ---------- */

  function buildSteps() {
    var th = C.THEMES, sk = C.SKILLS;

    STEPS = [
      { title: 'קודם כל, מי את/ה', hint: 'שלוש שאלות, בלי שום פרט מזהה.',
        required: ['cohort'],
        html:
          optsField('cohort', 'באיזה שלב את/ה במחלקה?', '', C.COHORTS) +
          optsField('track', 'מסלול', 'אפשר לדלג', C.TRACKS) +
          optsField('miluim', 'שירתת במילואים במהלך התואר?', 'אפשר לדלג',
            [{ key: 'yes', label: 'כן' }, { key: 'no', label: 'לא' }])
      },

      { title: 'התואר עצמו', hint: '1 = לא בעיה, 5 = בעיה חמורה.',
        required: th.slice(0, 4).map(function (t) { return t.key; }),
        html: th.slice(0, 4).map(function (t) {
          return scaleField(t.key, t.label, t.q, t.lo, t.hi);
        }).join('')
      },

      { title: 'המחלקה וההתנהלות', hint: 'אותו סולם.',
        required: th.slice(4).map(function (t) { return t.key; }).concat(['overall_ready']),
        html: th.slice(4).map(function (t) {
          return scaleField(t.key, t.label, t.q, t.lo, t.hi);
        }).join('') +
        scaleField('overall_ready', 'השאלה של המבקר',
          'עד כמה את/ה מרגיש/ה שהתואר הכין אותך לעולם העבודה?',
          'בכלל לא', 'לגמרי')
      },

      { title: 'מדד המוכנות · חלק א', hint: 'הערכה עצמית. 1 = לא נגעתי בזה, 5 = שולט/ת ובטוח/ה בראיון.',
        required: sk.slice(0, 4).map(function (s) { return s.key; }),
        html: sk.slice(0, 4).map(function (s) {
          return scaleField(s.key, s.label, '', 'לא נגעתי', 'שולט/ת');
        }).join('')
      },

      { title: 'מדד המוכנות · חלק ב', hint: 'עוד ארבע, וסיימנו את הדירוגים.',
        required: sk.slice(4).map(function (s) { return s.key; }),
        html: sk.slice(4).map(function (s) {
          return scaleField(s.key, s.label, '', 'לא נגעתי', 'שולט/ת');
        }).join('')
      },

      { title: 'ובמילים שלך', hint: 'זה החלק שנקרא. משפט אחד ברור עובד טוב יותר מפסקה.',
        required: [],
        html:
          '<div class="field">' +
            '<label for="qBody">משפט אחד שהיית רוצה שהמבקר יקרא</label>' +
            '<div class="sub">אופציונלי, אבל זה מה שעולה לקיר. 15 עד 400 תווים.</div>' +
            '<textarea id="qBody" rows="4" maxlength="400" ' +
              'placeholder="לדוגמה: יצאתי עם תואר בהנדסת תעשייה וניהול בלי לפתוח פעם אחת את התוכנה שבה עובדים בפועל."></textarea>' +
            '<div class="counter" id="qCount">0 / 400</div>' +
          '</div>' +
          optsField('qtheme', 'לאיזה נושא זה שייך?', 'עוזר למיין את הדוח',
            C.THEMES.map(function (t) { return { key: t.key, label: t.label }; })
              .concat([{ key: 'other', label: 'אחר' }])) +
          scaleField('would_recommend', 'היית ממליץ/ה לחבר/ה ללמוד במחלקה?', '', 'בשום אופן', 'בהחלט') +
          '<p class="sub" style="margin-top:18px">' +
            'לפני השליחה: אל תכתוב/י שמות של מרצים או סגל. משפט שמזהה אדם ספציפי לא יאושר לפרסום, ' +
            'והדוח למבקר חזק יותר כשהוא מתאר תופעה ולא אדם.</p>'
      }
    ];
  }

  /* ---------- רינדור ---------- */

  function render() {
    var host = el('steps');
    host.innerHTML = STEPS.map(function (s, i) {
      return '<section class="step' + (i === step ? ' on' : '') + '" data-i="' + i + '">' +
        '<h3>' + s.title + '</h3><p class="hint">' + s.hint + '</p>' + s.html + '</section>';
    }).join('');

    bind();
    sync();
  }

  function bind() {
    var host = el('steps');

    host.querySelectorAll('.scale button, .opts button').forEach(function (b) {
      b.addEventListener('click', function () {
        var field = b.closest('.field');
        var key = field.dataset.key;
        var v = b.dataset.v;
        field.querySelectorAll('button').forEach(function (x) {
          x.classList.remove('on'); x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
        answers[key] = /^\d+$/.test(v) ? Number(v) : v;
        clearError();
      });
    });

    var ta = el('qBody');
    if (ta) {
      ta.addEventListener('input', function () {
        var n = ta.value.trim().length;
        var c = el('qCount');
        c.textContent = n + ' / 400';
        c.classList.toggle('over', n > 0 && n < 15);
        if (n > 0 && n < 15) c.textContent = n + ' / 400 · צריך לפחות 15 תווים';
      });
    }
  }

  function sync() {
    el('steps').querySelectorAll('.step').forEach(function (s) {
      s.classList.toggle('on', Number(s.dataset.i) === step);
    });
    el('progBar').style.width = ((step) / STEPS.length * 100) + '%';
    el('stepLabel').textContent = 'שלב ' + (step + 1) + ' מתוך ' + STEPS.length;
    el('btnBack').style.visibility = step === 0 ? 'hidden' : 'visible';
    el('btnNext').textContent = step === STEPS.length - 1 ? 'שליחה' : 'הבא';
  }

  function showError(msg) { el('formError').innerHTML = '<div class="form-error">' + msg + '</div>'; }
  function clearError() { el('formError').innerHTML = ''; }

  function validate() {
    var s = STEPS[step];
    var missing = s.required.filter(function (k) { return answers[k] === undefined; });
    if (missing.length) {
      showError('נשארו ' + missing.length + ' שאלות בלי תשובה במסך הזה.');
      var f = el('steps').querySelector('.step.on .field[data-key="' + missing[0] + '"]');
      if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    var ta = el('qBody');
    if (ta && ta.value.trim().length > 0 && ta.value.trim().length < 15) {
      showError('המשפט קצר מדי. או שתרחיב/י ל־15 תווים לפחות, או שתמחק/י ותשלח/י בלי משפט.');
      return false;
    }
    clearError();
    return true;
  }

  /* ---------- שליחה ---------- */

  function buildPayload() {
    var a = { cohort: answers.cohort, miluim: answers.miluim === 'yes' };
    if (answers.track) a.track = answers.track;

    C.THEMES.forEach(function (t) { if (answers[t.key] != null) a[t.col] = answers[t.key]; });
    C.SKILLS.forEach(function (s) { if (answers[s.key] != null) a[s.col] = answers[s.key]; });
    if (answers.overall_ready)   a.overall_ready   = answers.overall_ready;
    if (answers.would_recommend) a.would_recommend = answers.would_recommend;
    return a;
  }

  function submit() {
    var hp = el('hpField');
    if (hp && hp.value) {
      // בוט. מציגים הצלחה ולא כותבים כלום, כדי לא ללמד אותו מה נתפס.
      finish(null);
      return;
    }
    if ((Date.now() - started) / 1000 < C.MIN_SECONDS) {
      showError('קצת מהר מדי. קח/י רגע לעבור על התשובות ואז שלח/י.');
      return;
    }

    var btn = el('btnNext');
    btn.disabled = true; btn.textContent = 'שולח...';

    var ta = el('qBody');
    var body = ta ? ta.value.trim() : '';
    var quote = body.length >= 15
      ? { body: body, theme: answers.qtheme || 'other', cohort: answers.cohort }
      : null;

    window.DB.submit(buildPayload(), quote).then(function (res) {
      btn.disabled = false; btn.textContent = 'שליחה';
      if (!res.ok) {
        showError('השליחה נכשלה. בדוק/י חיבור אינטרנט ונסה/י שוב. התשובות שלך נשמרו בדף.');
        return;
      }
      finish(quote ? quote.body : null);
    });
  }

  function finish(quoteBody) {
    window.DB.ls(C.STORE.submitted, '1');
    window.DB.ls(C.STORE.answers, JSON.stringify(answers));

    el('surveyForm').style.display = 'none';
    if (quoteBody) window.Wall.addPending(quoteBody);

    window.Readiness.render(answers, quoteBody);
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.Dashboard.load();   // רענון הדשבורד כדי שהמונה יזוז
    window.App.refreshCounters();
    window.App.hideDock();
  }

  /* ---------- ניווט ---------- */

  function next() {
    if (!validate()) return;
    if (step === STEPS.length - 1) { submit(); return; }
    step++; sync();
    document.getElementById('survey').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function back() {
    if (step === 0) return;
    step--; clearError(); sync();
    document.getElementById('survey').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    buildSteps();
    render();
    el('btnNext').addEventListener('click', next);
    el('btnBack').addEventListener('click', back);

    // מי שכבר מילא רואה קודם את התוצאה שלו, בלי למלא שוב
    if (window.DB.ls(C.STORE.submitted)) {
      var prev = null;
      try { prev = JSON.parse(window.DB.ls(C.STORE.answers) || 'null'); } catch (e) {}
      if (prev && prev.cohort) {
        el('surveyForm').style.display = 'none';
        window.Readiness.render(prev, null, true);
      }
    }
  }

  return { init: init, reopen: function () {
    el('surveyForm').style.display = '';
    document.getElementById('result').classList.remove('on');
    step = 0; started = Date.now(); sync();
  } };
})();
