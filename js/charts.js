/* =====================================================================
   charts.js - מנוע תרשימי SVG קליל, ללא תלויות
   בר אופקי RTL, עמודות, דונאט, קווים/שטח, 100% נערם, טבלה, KPI, סלייסרים
   ===================================================================== */
const Charts = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = { p: '#ffffff', s: '#c3c2b7', m: '#898781', grid: '#2c2c2a', axis: '#383835', surface: '#1a1a19' };

  const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '-' :
    Number(n).toLocaleString('he-IL', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const fmt1 = n => fmt(n, 1);
  const pctF = (n, d = 0) => fmt(n, d) + '%';

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs = {}) {
    const t = el('text', { x, y, fill: INK.s, 'font-size': 11, ...attrs }, parent);
    t.textContent = s;
    return t;
  }

  /* ---------- Tooltip יחיד ---------- */
  let tipEl = null;
  function tip() {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'viz-tip'; document.body.appendChild(tipEl); }
    return tipEl;
  }
  function showTip(html, ev) {
    const t = tip(); t.innerHTML = html; t.style.opacity = 1;
    const r = t.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY - r.height - 12;
    if (x + r.width > innerWidth - 10) x = ev.clientX - r.width - 14;
    if (x < 8) x = 8;
    if (y < 8) y = ev.clientY + 18;
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.opacity = 0; }
  const tipRow = (color, label, val) =>
    `<div class="row"><span class="sw" style="background:${color}"></span>${label}: <b>${val}</b></div>`;

  /* ---------- עזרים ---------- */
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (v <= m * p) return m * p;
    return 10 * p;
  }
  function measure(box) {
    const w = box.clientWidth || box.parentElement.clientWidth || 560;
    return Math.max(260, w);
  }
  function svgIn(box, w, h) {
    box.classList.add('chart-box');
    const s = el('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h });
    s.style.width = '100%'; s.style.height = 'auto';
    box.appendChild(s);
    return s;
  }
  // מלבן עם פינות מעוגלות רק בקצה-הנתון
  function barPath(x, y, w, h, r, dir) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (dir === 'up')    return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
    if (dir === 'left')  return `M${x + w},${y} L${x + r},${y} Q${x},${y} ${x},${y + r} L${x},${y + h - r} Q${x},${y + h} ${x + r},${y + h} L${x + w},${y + h} Z`;
    /* right */          return `M${x},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} Z`;
  }
  function legendHTML(items) {
    const d = document.createElement('div');
    d.className = 'legend';
    d.innerHTML = items.map(i =>
      `<span class="lg"><span class="sw" style="background:${i.color}"></span>${i.label}${i.extra ? ` <span style="color:var(--ink-3)">· ${i.extra}</span>` : ''}</span>`
    ).join('');
    return d;
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* =====================================================
     KPI
     ===================================================== */
  function kpi(box, { label, value, sub = '', accent = false }) {
    box.innerHTML = `<div class="kpi${accent ? ' accented' : ''}">
      <div class="k-label">${label}</div>
      <div class="k-value">${value}</div>
      ${sub ? `<div class="k-sub">${sub}</div>` : ''}</div>`;
  }

  /* =====================================================
     בר אופקי RTL - תוויות מימין, מוטות גדלים שמאלה
     items: [{label, value, color, key, extraTip}]
     ===================================================== */
  function hbars(box, opts) {
    const { items, onClick, selectedKey, valueFmt = fmt, labelWidth = 118, rowH = 30, legend } = opts;
    if (!items.length) { box.innerHTML = '<div class="chart-empty">אין נתונים לתצוגה בחיתוך הנוכחי</div>'; return; }
    const W = measure(box);
    const top = 6, bottom = 6;
    const H = top + items.length * rowH + bottom;
    const plotL = 10, plotR = W - labelWidth - 10;
    const plotW = plotR - plotL;
    const max = opts.max || niceMax(Math.max(...items.map(i => i.value)) || 1);
    box.innerHTML = '';
    if (legend) box.appendChild(legendHTML(legend));
    const svg = svgIn(box, W, H);

    // קווי רשת אנכיים
    for (let g = 1; g <= 4; g++) {
      const gx = plotR - (plotW * g) / 4;
      el('line', { x1: gx, y1: top, x2: gx, y2: H - bottom, stroke: INK.grid, 'stroke-width': 1 }, svg);
    }
    el('line', { x1: plotR, y1: top, x2: plotR, y2: H - bottom, stroke: INK.axis, 'stroke-width': 1.5 }, svg);

    items.forEach((it, i) => {
      const y = top + i * rowH + 5;
      const bh = rowH - 10;
      const bw = Math.max(2, (it.value / max) * plotW);
      const x = plotR - bw;
      const dim = selectedKey != null && it.key !== selectedKey;
      const g = el('g', { class: onClick ? 'bar-hit' : '' }, svg);
      g.style.opacity = dim ? 0.3 : 1;
      el('path', { d: barPath(x, y, bw, bh, 4, 'left'), fill: it.color }, g);
      // תווית קטגוריה מימין
      txt(g, plotR + 8, y + bh / 2 + 4, truncate(it.label, 17), { fill: INK.s, 'font-size': 11.5 });
      // ערך בקצה המוט
      txt(g, x - 6, y + bh / 2 + 4, valueFmt(it.value), { fill: INK.p, 'font-size': 11, 'text-anchor': 'end', 'font-weight': 600 });
      // אזור hover מלא-שורה
      const hit = el('rect', { x: 0, y: top + i * rowH, width: W, height: rowH, fill: 'transparent' }, g);
      hit.addEventListener('mousemove', ev => showTip(`<b>${it.label}</b>${tipRow(it.color, opts.valueLabel || 'ערך', valueFmt(it.value))}${it.extraTip || ''}`, ev));
      hit.addEventListener('mouseleave', hideTip);
      if (onClick) hit.addEventListener('click', () => { hideTip(); onClick(it); });
    });
  }

  /* =====================================================
     עמודות אנכיות (מקובצות) - סדר קטגוריות RTL
     categories:[], series:[{name,color,values:[]}]
     ===================================================== */
  function columns(box, opts) {
    const { categories, series, height = 250, valueFmt = fmt, showValues = false, onClick, selectedKey, rotateLabels = false } = opts;
    if (!categories.length || !series.length) { box.innerHTML = '<div class="chart-empty">אין נתונים לתצוגה</div>'; return; }
    const W = measure(box);
    const top = 14, bottom = rotateLabels ? 44 : 26, left = 8, right = 40;
    const H = height;
    const plotW = W - left - right, plotH = H - top - bottom;
    const allVals = series.flatMap(s => s.values);
    const max = opts.max || niceMax(Math.max(...allVals, 0) || 1);
    box.innerHTML = '';
    if (series.length > 1) box.appendChild(legendHTML(series.map(s => ({ label: s.name, color: s.color }))));
    const svg = svgIn(box, W, H);

    // רשת + ציר ערכים מימין
    for (let g = 0; g <= 4; g++) {
      const gy = top + plotH - (plotH * g) / 4;
      el('line', { x1: left, y1: gy, x2: left + plotW, y2: gy, stroke: g === 0 ? INK.axis : INK.grid, 'stroke-width': 1 }, svg);
      if (g > 0) txt(svg, W - 4, gy + 4, valueFmt((max * g) / 4), { fill: INK.m, 'font-size': 10, 'text-anchor': 'end' });
    }

    const n = categories.length, band = plotW / n;
    const inner = Math.min(band * 0.62, 64);
    const gap = 2;
    const bw = (inner - gap * (series.length - 1)) / series.length;

    categories.forEach((cat, ci) => {
      // RTL: קטגוריה ראשונה מימין
      const bandX = left + plotW - (ci + 1) * band;
      const x0 = bandX + (band - inner) / 2;
      const key = opts.keys ? opts.keys[ci] : cat;
      const dim = selectedKey != null && key !== selectedKey;
      const g = el('g', { class: onClick ? 'bar-hit' : '' }, svg);
      g.style.opacity = dim ? 0.3 : 1;

      series.forEach((s, si) => {
        const v = s.values[ci] || 0;
        const bh = Math.max(v > 0 ? 2 : 0, (v / max) * plotH);
        const x = x0 + si * (bw + gap);
        const y = top + plotH - bh;
        el('path', { d: barPath(x, y, bw, bh, Math.min(4, bw / 2), 'up'), fill: s.color }, g);
        if (showValues && v > 0)
          txt(g, x + bw / 2, y - 4, valueFmt(v), { fill: INK.s, 'font-size': 10, 'text-anchor': 'middle' });
      });

      // תווית קטגוריה
      const lx = bandX + band / 2;
      if (rotateLabels) {
        txt(svg, lx, H - bottom + 14, truncate(cat, 14), { fill: INK.m, 'font-size': 10.5, 'text-anchor': 'end', transform: `rotate(-32 ${lx} ${H - bottom + 14})` });
      } else {
        txt(svg, lx, H - bottom + 17, truncate(cat, Math.max(4, Math.floor(band / 7))), { fill: INK.m, 'font-size': 10.5, 'text-anchor': 'middle' });
      }

      const hit = el('rect', { x: bandX, y: top, width: band, height: plotH, fill: 'transparent' }, g);
      hit.addEventListener('mousemove', ev => {
        const rows = series.map(s => tipRow(s.color, s.name, valueFmt(s.values[ci] || 0))).join('');
        showTip(`<b>${cat}</b>${rows}`, ev);
      });
      hit.addEventListener('mouseleave', hideTip);
      if (onClick) hit.addEventListener('click', () => { hideTip(); onClick({ key, label: cat, index: ci }); });
    });
  }

  /* =====================================================
     דונאט + מקרא HTML
     items: [{label, value, color, key}]
     ===================================================== */
  function donut(box, opts) {
    const { items, centerTitle = '', onClick, selectedKey, valueFmt = fmt, size = 190 } = opts;
    const total = items.reduce((a, b) => a + b.value, 0);
    if (!total) { box.innerHTML = '<div class="chart-empty">אין נתונים לתצוגה</div>'; return; }
    box.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center';
    box.appendChild(wrap);

    const svgBox = document.createElement('div');
    svgBox.style.cssText = `flex:0 0 ${size}px;max-width:${size}px`;
    wrap.appendChild(svgBox);
    const svg = svgIn(svgBox, size, size);
    const cx = size / 2, cy = size / 2, R = size / 2 - 6, r = R * 0.63;

    let a0 = -Math.PI / 2;
    items.forEach(it => {
      const frac = it.value / total;
      const a1 = a0 + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const p1 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)];
      const p2 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
      const p3 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const p4 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
      const d = `M${p1} A${R},${R} 0 ${large} 1 ${p2} L${p3} A${r},${r} 0 ${large} 0 ${p4} Z`;
      const dim = selectedKey != null && it.key !== selectedKey;
      const seg = el('path', { d, fill: it.color, stroke: INK.surface, 'stroke-width': 2, class: onClick ? 'bar-hit' : '' }, svg);
      seg.style.opacity = dim ? 0.3 : 1;
      seg.style.transition = 'opacity .15s';
      seg.addEventListener('mousemove', ev =>
        showTip(`<b>${it.label}</b>${tipRow(it.color, opts.valueLabel || 'כמות', valueFmt(it.value))}${tipRow(it.color, 'אחוז', pctF(it.value / total * 100, 1))}`, ev));
      seg.addEventListener('mouseleave', hideTip);
      if (onClick) seg.addEventListener('click', () => { hideTip(); onClick(it); });
      a0 = a1;
    });
    txt(svg, cx, cy - 4, valueFmt(opts.centerValue != null ? opts.centerValue : total), { fill: INK.p, 'font-size': 24, 'font-weight': 800, 'text-anchor': 'middle' });
    if (centerTitle) txt(svg, cx, cy + 16, centerTitle, { fill: INK.m, 'font-size': 10.5, 'text-anchor': 'middle' });

    const lg = document.createElement('div');
    lg.style.cssText = 'display:flex;flex-direction:column;gap:7px;min-width:130px;flex:1';
    lg.innerHTML = items.map(it => {
      const dim = selectedKey != null && it.key !== selectedKey;
      return `<div class="lg" data-k="${it.key ?? it.label}" style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-2);${onClick ? 'cursor:pointer;' : ''}opacity:${dim ? 0.4 : 1}">
        <span class="sw" style="width:10px;height:10px;border-radius:3px;background:${it.color};flex:0 0 10px"></span>
        <span style="flex:1">${it.label}</span>
        <b style="color:var(--ink)">${valueFmt(it.value)}</b>
        <span style="color:var(--ink-3);font-size:11px;min-width:38px;text-align:left">${pctF(it.value / total * 100, 1)}</span>
      </div>`;
    }).join('');
    if (onClick) lg.querySelectorAll('[data-k]').forEach((row, i) => row.addEventListener('click', () => onClick(items[i])));
    wrap.appendChild(lg);
  }

  /* =====================================================
     קווים / שטח - ציר זמן LTR, קרוסהייר + טולטיפ
     x: [], series: [{name, color, values, dash?}]
     ===================================================== */
  function lines(box, opts) {
    const { x, series, height = 260, area = false, valueFmt = fmt, xTickEvery } = opts;
    if (!x.length) { box.innerHTML = '<div class="chart-empty">אין נתונים לתצוגה</div>'; return; }
    const W = measure(box);
    const top = 12, bottom = 26, left = 42, right = 14;
    const H = height, plotW = W - left - right, plotH = H - top - bottom;
    const allVals = series.flatMap(s => s.values).filter(v => v != null);
    const max = opts.max || niceMax(Math.max(...allVals, 0) || 1);

    box.innerHTML = '';
    if (series.length > 1) box.appendChild(legendHTML(series.map(s => ({ label: s.name, color: s.color }))));
    const svg = svgIn(box, W, H);

    for (let g = 0; g <= 4; g++) {
      const gy = top + plotH - (plotH * g) / 4;
      el('line', { x1: left, y1: gy, x2: left + plotW, y2: gy, stroke: g === 0 ? INK.axis : INK.grid, 'stroke-width': 1 }, svg);
      txt(svg, left - 6, gy + 4, valueFmt((max * g) / 4), { fill: INK.m, 'font-size': 10, 'text-anchor': 'end' });
    }
    const px = i => x.length === 1 ? left + plotW / 2 : left + (i / (x.length - 1)) * plotW;
    const py = v => top + plotH - (v / max) * plotH;

    const every = xTickEvery || Math.ceil(x.length / Math.max(3, Math.floor(plotW / 70)));
    x.forEach((lb, i) => {
      if (i % every === 0 || i === x.length - 1)
        txt(svg, px(i), H - bottom + 17, lb, { fill: INK.m, 'font-size': 10, 'text-anchor': 'middle' });
    });

    series.forEach(s => {
      const pts = s.values.map((v, i) => v == null ? null : [px(i), py(v)]);
      const segs = [];
      let cur = [];
      pts.forEach(p => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
      if (cur.length) segs.push(cur);
      segs.forEach(sg => {
        const d = sg.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
        if (area) {
          const ad = d + ` L${sg[sg.length - 1][0]},${top + plotH} L${sg[0][0]},${top + plotH} Z`;
          el('path', { d: ad, fill: s.color, opacity: 0.14 }, svg);
        }
        el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || 'none' }, svg);
      });
    });

    // שכבת hover: קרוסהייר + נקודות
    const cross = el('line', { x1: 0, y1: top, x2: 0, y2: top + plotH, stroke: INK.m, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    const dots = series.map(s => el('circle', { r: 4.5, fill: s.color, stroke: INK.surface, 'stroke-width': 2, opacity: 0 }, svg));
    const overlay = el('rect', { x: left, y: top, width: plotW, height: plotH, fill: 'transparent' }, svg);
    overlay.addEventListener('mousemove', ev => {
      const rect = svg.getBoundingClientRect();
      const sx = (ev.clientX - rect.left) * (W / rect.width);
      const i = Math.round(((sx - left) / plotW) * (x.length - 1));
      const ci = Math.max(0, Math.min(x.length - 1, i));
      const cxp = px(ci);
      cross.setAttribute('x1', cxp); cross.setAttribute('x2', cxp); cross.setAttribute('opacity', 1);
      let rows = '';
      series.forEach((s, si) => {
        const v = s.values[ci];
        if (v == null) { dots[si].setAttribute('opacity', 0); return; }
        dots[si].setAttribute('cx', cxp); dots[si].setAttribute('cy', py(v)); dots[si].setAttribute('opacity', 1);
        rows += tipRow(s.color, s.name, valueFmt(v));
      });
      showTip(`<b>${x[ci]}</b>${rows}`, ev);
    });
    overlay.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); dots.forEach(d => d.setAttribute('opacity', 0)); hideTip(); });
  }

  /* =====================================================
     100% נערם אופקי
     rows: [{label, parts:{key:value}}], keys:[{key,label,color}]
     ===================================================== */
  function stack100(box, opts) {
    const { rows, keys, rowH = 34, labelWidth = 118, valueFmt = fmt } = opts;
    if (!rows.length) { box.innerHTML = '<div class="chart-empty">אין נתונים לתצוגה</div>'; return; }
    const W = measure(box);
    const top = 4, bottom = 4;
    const H = top + rows.length * rowH + bottom;
    const plotL = 10, plotR = W - labelWidth - 10, plotW = plotR - plotL;
    box.innerHTML = '';
    box.appendChild(legendHTML(keys.map(k => ({ label: k.label, color: k.color }))));
    const svg = svgIn(box, W, H);

    rows.forEach((row, ri) => {
      const total = keys.reduce((a, k) => a + (row.parts[k.key] || 0), 0);
      const y = top + ri * rowH + 6, bh = rowH - 12;
      txt(svg, plotR + 8, y + bh / 2 + 4, truncate(row.label, 16), { fill: INK.s, 'font-size': 11.5 });
      if (!total) return;
      let xEnd = plotR; // RTL: מתחילים מימין
      keys.forEach(k => {
        const v = row.parts[k.key] || 0;
        if (!v) return;
        const w = (v / total) * plotW - 2;
        if (w <= 0) return;
        const x = xEnd - w;
        const seg = el('rect', { x, y, width: w, height: bh, rx: 3, fill: k.color }, svg);
        const p = v / total * 100;
        if (w > 40) txt(svg, x + w / 2, y + bh / 2 + 4, pctF(p, 0), { fill: '#0d0d0d', 'font-size': 10.5, 'font-weight': 700, 'text-anchor': 'middle' });
        seg.addEventListener('mousemove', ev => showTip(`<b>${row.label} · ${k.label}</b>${tipRow(k.color, 'כמות', valueFmt(v))}${tipRow(k.color, 'אחוז', pctF(p, 1))}`, ev));
        seg.addEventListener('mouseleave', hideTip);
        xEnd = x - 2;
      });
    });
  }

  /* =====================================================
     טבלה ממוינת
     columns: [{key, label, num?, fmt?, html?}]
     ===================================================== */
  function table(box, opts) {
    const { columns: cols, rows, maxHeight = 340 } = opts;
    let sortKey = opts.sortKey || null, sortDir = -1;
    function render() {
      const sorted = [...rows];
      if (sortKey) {
        sorted.sort((a, b) => {
          const va = a[sortKey], vb = b[sortKey];
          if (typeof va === 'number') return (va - vb) * sortDir;
          return String(va).localeCompare(String(vb), 'he') * sortDir;
        });
      }
      box.innerHTML = `<div class="viz-table-wrap" style="max-height:${maxHeight}px"><table class="viz-table">
        <thead><tr>${cols.map(c => `<th data-k="${c.key}">${c.label}${sortKey === c.key ? ` <span class="si">${sortDir < 0 ? '▼' : '▲'}</span>` : ''}</th>`).join('')}</tr></thead>
        <tbody>${sorted.map(r => `<tr>${cols.map(c => {
          const v = r[c.key];
          if (c.html) return `<td>${c.html(v, r)}</td>`;
          return `<td class="${c.num ? 'num' : ''}">${c.fmt ? c.fmt(v, r) : v}</td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>`;
      box.querySelectorAll('th').forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.k;
        if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = -1; }
        render();
      }));
    }
    render();
  }

  /* =====================================================
     סלייסרים
     ===================================================== */
  function seg(box, { options, value, onChange, allLabel = null }) {
    const d = document.createElement('div');
    d.className = 'seg';
    const mk = (key, label) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.className = (value === key) ? 'on' : '';
      b.addEventListener('click', () => onChange(key));
      return b;
    };
    if (allLabel) d.appendChild(mk(null, allLabel));
    options.forEach(o => d.appendChild(mk(o.key ?? o, o.label ?? o)));
    box.innerHTML = ''; box.appendChild(d);
  }
  function select(box, { options, value, onChange, allLabel = 'הכל' }) {
    const s = document.createElement('select');
    s.innerHTML = `<option value="">${allLabel}</option>` +
      options.map(o => `<option value="${o.key ?? o}" ${String(value) === String(o.key ?? o) ? 'selected' : ''}>${o.label ?? o}</option>`).join('');
    s.addEventListener('change', () => onChange(s.value || null));
    box.innerHTML = ''; box.appendChild(s);
  }

  return { fmt, fmt1, pctF, kpi, hbars, columns, donut, lines, stack100, table, seg, select, legendHTML };
})();
