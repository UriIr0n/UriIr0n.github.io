/* =====================================================================
   hero.js - ענן נקודות שמתארגן לגרף עמודות (גולמי ← דוח)
   Canvas 2D עם הטלה פרספקטיבית, בלי ספריות. רץ רק כשעמוד הבית גלוי.
   ===================================================================== */
(() => {
  const c = document.getElementById('hero-canvas');
  if (!c) return;
  const g = c.getContext('2d');
  const phaseEl = document.getElementById('hero-phase');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DOT = '#d6e7de', ACC = '#f0c14b';

  // מחולל דטרמיניסטי: אותו ענן בכל טעינה
  let seed = 20261118;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;

  const N = 1500, BARS = [0.45, 0.7, 0.38, 0.95, 0.6, 1.25, 0.82], P = [];
  for (let i = 0; i < N; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = Math.cbrt(rnd()) * 1.15, s = Math.sqrt(1 - u * u);
    const bi = i % BARS.length, bw = 0.22, bx = (bi - (BARS.length - 1) / 2) * 0.32;
    P.push({
      a: [r * s * Math.cos(th), r * u, r * s * Math.sin(th)],
      b: [bx + (rnd() - 0.5) * bw, -0.9 + rnd() * BARS[bi] * 1.5, (rnd() - 0.5) * bw],
      top: bi === 5,
    });
  }

  let mx = 0;
  c.closest('.hero2').addEventListener('pointermove', e => {
    const b = c.getBoundingClientRect();
    mx = (e.clientX - b.left) / b.width - 0.5;
  });

  const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let last = '';
  const pts = new Array(N);

  function frame(t) {
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const T = t * 0.001, k = T % 10;
    let m = k < 2.5 ? 0 : k < 4.3 ? ease((k - 2.5) / 1.8) : k < 8.2 ? 1 : 1 - ease((k - 8.2) / 1.8);
    if (reduce) m = 1;
    const label = m < 0.05 ? 'מצב: נתונים גולמיים' : m > 0.95 ? 'מצב: דוח מוכן' : 'מצב: מעבד...';
    if (label !== last && phaseEl) { phaseEl.textContent = label; last = label; }

    const ang = (reduce ? 0.5 : T * 0.22) + mx * 0.8, ca = Math.cos(ang), sa = Math.sin(ang);
    const sc = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2 + 10;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      const x = p.a[0] + (p.b[0] - p.a[0]) * m, y = p.a[1] + (p.b[1] - p.a[1]) * m, z = p.a[2] + (p.b[2] - p.a[2]) * m;
      const rx = x * ca - z * sa, rz = x * sa + z * ca, f = 3.2 / (3.2 + rz);
      pts[i] = [cx + rx * sc * f, cy - y * sc * f, f, p.top && m > 0.5];
    }
    pts.sort((A, B) => A[2] - B[2]);
    for (const q of pts) {
      const s = 1.1 + q[2] * 1.4;
      g.globalAlpha = Math.min(1, 0.25 + (q[2] - 0.7) * 1.4);
      g.fillStyle = q[3] ? ACC : DOT;
      g.fillRect(q[0], q[1], s, s);
    }
    g.globalAlpha = 1;
  }

  const home = document.getElementById('page-home');
  function loop(t) {
    // לא מציירים כשעמוד הבית מוסתר (דשבורד פתוח) או כשהלשונית ברקע
    if (home.classList.contains('active') && !document.hidden) frame(t);
    requestAnimationFrame(loop);
  }
  if (reduce) {
    frame(0);
    window.addEventListener('hashchange', () => requestAnimationFrame(() => frame(0)));
    window.addEventListener('resize', () => frame(0));
  } else {
    requestAnimationFrame(loop);
  }
})();
