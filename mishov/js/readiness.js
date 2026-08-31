/* =====================================================================
   מדד המוכנות האישי — התמורה שהסטודנט מקבל על שלוש הדקות.
   מחושב מהערכה עצמית, מושווה לממוצע המחזור, ומתורגם לפער מול השוק.
   ===================================================================== */
window.Readiness = (function () {
  var C = window.CFG;

  function pct(avg) { return Math.round((avg - 1) / 4 * 100); }

  function ring(score) {
    var r = 52, circ = 2 * Math.PI * r;
    var off = circ * (1 - score / 100);
    return '<div class="score-ring">' +
      '<svg viewBox="0 0 118 118" width="118" height="118" aria-hidden="true">' +
        '<circle cx="59" cy="59" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="10"/>' +
        '<circle cx="59" cy="59" r="' + r + '" fill="none" stroke="var(--teal-brt)" stroke-width="10" ' +
          'stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" ' +
          'stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg>' +
      '<div class="val">' + score + '</div></div>';
  }

  function verdict(score, cohort) {
    var target = cohort === 'year3' ? 'לסטאז\'' : 'לתפקיד הראשון';
    if (score >= 70) return 'את/ה בקבוצה החזקה של המחזור. הפערים שנשארו נסגרים בשבועות, לא בחודשים.';
    if (score >= 45) return 'בסיס סביר עם שניים־שלושה חורים ברורים. הרשימה למטה מסודרת לפי מה שישפיע הכי מהר בדרך ' + target + '.';
    return 'הפער מול מה שהשוק מבקש משמעותי — וזה בדיוק מה שהמשוב הזה נועד להראות למבקר. בינתיים, הרשימה למטה היא סדר העדיפויות שלך.';
  }

  function render(answers, quoteBody, isReturning) {
    var host = document.getElementById('result');
    host.classList.add('on');

    var vals = C.SKILLS.map(function (s) { return Number(answers[s.key]) || 0; }).filter(Boolean);
    var myAvg = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : 0;
    var score = vals.length ? pct(myAvg) : 0;
    var cohort = answers.cohort || 'year4';
    var isY3 = cohort === 'year3';

    host.innerHTML =
      '<div class="section-head" style="margin-top:8px">' +
        '<h2>' + (isReturning ? 'מדד המוכנות שלך' : 'נשלח. הנה מה שיצא לך.') + '</h2>' +
        '<p>' + (isReturning
          ? 'כבר מילאת את המשוב מהמכשיר הזה. זו התוצאה שנשמרה.'
          : (quoteBody
              ? 'המשפט שלך נשמר ויעלה לקיר אחרי בדיקה קצרה. הדירוגים שלך כבר נספרים בדוח.'
              : 'הדירוגים שלך כבר נספרים בדוח.')) +
        '</p></div>' +

      '<div class="score-hero">' + ring(score) +
        '<div class="score-copy">' +
          '<h3>' + score + ' מתוך 100 · מוכנות לתעשייה</h3>' +
          '<p>' + verdict(score, cohort) + '</p>' +
        '</div></div>' +

      '<div class="tiles" style="margin-bottom:26px">' +
        '<div class="tile col-12">' +
          '<div class="t-head">את/ה מול המחזור</div>' +
          '<div class="t-sub" id="cmpSub">טוען השוואה…</div>' +
          '<div class="chart-box" id="cmpChart"></div>' +
        '</div></div>' +

      '<div class="section-head" style="margin-bottom:18px">' +
        '<h3 style="font-size:21px" id="gapTitle"></h3><p id="gapIntro"></p>' +
      '</div>' +
      '<div class="gap-list" id="gapList"></div>' +

      '<div class="step-nav" style="margin-top:30px">' +
        '<a class="btn primary" id="shareWa" href="#">שיתוף בוואטסאפ</a>' +
        '<a class="btn ghost" href="#dash">לתמונה המצטברת</a>' +
        '<span class="spacer"></span>' +
        '<a class="btn ghost" href="#wall">לקיר המשפטים</a>' +
      '</div>' +
      '<p class="data-note">' +
        'המדד מבוסס על הערכה עצמית ולכן הוא לא ציון — הוא מראה. הערך שלו הוא בהשוואה: ' +
        'איפה את/ה יחסית למחזור, ואיפה כולנו יחסית למה שהשוק מבקש.</p>';

    // שיתוף — קבוצות המחזור הן איך שזה מתפשט בפועל
    var msg = 'מילאתי את המשוב למבקר האוניברסיטה על המחלקה. לוקח 3 דקות, אנונימי לגמרי, ובסוף מקבלים מדד מוכנות לתעשייה. ' + location.origin + location.pathname;
    document.getElementById('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(msg);

    renderComparison(answers, cohort);
    renderGaps(answers, cohort, isY3);
  }

  function renderComparison(answers, cohort) {
    window.DB.stats().then(function (st) {
      var box = document.getElementById('cmpChart');
      var sub = document.getElementById('cmpSub');
      if (!box) return;

      var mine = C.SKILLS.map(function (s) { return Number(answers[s.key]) || 0; });
      var series = [{ name: 'את/ה', values: mine, color: '#3ECBDA' }];

      var byC = st && st.skills_by_cohort && st.skills_by_cohort[cohort];
      // דלי המחזור נפתח רק מעל הסף. מתחתיו נופלים לממוצע כלל המשיבים,
      // ואז גם הכיתוב חייב לדבר על כלל המשיבים ולא על המחזור.
      var useCohort = !!(byC && byC.sql != null);
      var pool = useCohort ? byC : (st && !st.gated ? st.skills : null);

      if (pool) {
        series.push({
          name: useCohort ? 'ממוצע המחזור שלך' : 'ממוצע כלל המשיבים',
          values: C.SKILLS.map(function (s) { return Number(pool[s.key]) || 0; }),
          color: '#7E98A6'
        });
        sub.textContent = 'סולם 1 עד 5, הערכה עצמית · ' +
          (useCohort
            ? byC.n + ' משיבים במחזור שלך'
            : st.total + ' משיבים בסך הכל · במחזור שלך עוד אין ' + C.MIN_N + ' תשובות להשוואה נפרדת');
      } else {
        sub.textContent = 'עוד אין מספיק תשובות במחזור שלך כדי להציג ממוצע להשוואה. ' +
          'הסף הוא ' + C.MIN_N + ' משיבים, כדי שאי אפשר יהיה לזהות אף אחד.';
      }

      window.Charts.columns(box, {
        categories: C.SKILLS.map(function (s) { return s.short || s.label; }),
        series: series, height: 280, valueFmt: window.Charts.fmt1, rotateLabels: true
      });
    });
  }

  function renderGaps(answers, cohort, isY3) {
    var host = document.getElementById('gapList');
    var items = C.SKILLS.map(function (s) {
      return { key: s.key, label: s.label, v: Number(answers[s.key]) || 0 };
    }).sort(function (a, b) { return a.v - b.v; });

    // 3 ומטה = פער אמיתי. מי שדירג את עצמו גבוה בכל דבר לא מקבל
    // כותרת "הפערים שלך" עם פריטים שדירג 5 — זה סותר את עצמו.
    var weak = items.filter(function (it) { return it.v <= 3; });
    var hasGaps = weak.length > 0;
    var show = hasGaps ? weak.slice(0, 4) : items.slice(0, 3);

    document.getElementById('gapTitle').textContent = hasGaps
      ? (isY3 ? 'מה להשלים לפני שאת/ה מגיש/ה לסטאז\'' : 'הפערים שלך מול מה שמשרות מבקשות')
      : 'החלשים היחסיים שלך';

    document.getElementById('gapIntro').textContent = hasGaps
      ? (isY3
          ? 'יש לך עוד שנה. זה בדיוק הזמן שבו הפערים האלה עדיין זולים לסגירה.'
          : 'מסודר לפי מה שיחזיר לך הכי הרבה על שעת עבודה, מהחלש ביותר ומעלה.')
      : 'לא סימנת אף מיומנות מתחת ל-4, ולכן אין כאן פערים ממשיים. אלה שלוש המיומנויות ' +
        'שדירגת בהן הכי נמוך יחסית לעצמך, ומה שהשוק מבקש בהן.';

    host.innerHTML = show.map(function (it) {
      var g = window.GAPS[it.key] || {};
      var isWeak = it.v <= 3;
      return '<div class="gap' + (isWeak ? '' : ' ok') + '">' +
        '<div class="gap-head"><h4>' + it.label + '</h4>' +
          '<span class="gap-delta ' + (isWeak ? 'low' : 'high') + '">דירגת ' + it.v + ' מתוך 5</span></div>' +
        '<p>' + (g.demand || '') + '</p>' +
        '<div class="next"><b>הצעד הבא:</b> ' + ((isY3 ? g.next3 : g.next4) || '') + '</div>' +
      '</div>';
    }).join('');
  }

  return { render: render };
})();
