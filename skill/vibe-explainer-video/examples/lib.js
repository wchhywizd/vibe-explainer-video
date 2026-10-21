// 普通人的决策工具箱 · 公共渲染库（抽自第 06 期）· 75 BPM · 每期定义 window.EP 后加载
const W = 1920, H = 1080;
const BPM = 75, BEAT = 60 / BPM, BAR = 4 * BEAT;
const TOTAL_BEATS = EP.BEATS, TOTAL = TOTAL_BEATS * BEAT;
const EP_NO = EP.NO;
const SERIES = '普通人的决策工具箱';
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');

const C = {
  bg0: '#06061A', bg1: '#141331',
  ink: '#F2EDE3', ink2: 'rgba(242,237,227,0.66)', ink3: 'rgba(242,237,227,0.38)',
  gold: '#C9A96A', goldHi: '#F3DBA4', goldDim: '#8E7542',
  seal: '#B53A2F', red: '#D2543F', redHi: '#F08A72',
  paper: '#EDE4D3', paperOld: '#CDBB98', pInk: '#2B2723', pInk2: 'rgba(43,39,35,0.55)', pInk3: 'rgba(43,39,35,0.22)',
  string: '#B53A2F', blue: '#7FA6E0', warm: '#E8A87C', sewer: '#8A5A2B'
};
const SERIF = '"Noto Serif CJK SC","Noto Serif SC","Songti SC",serif';
const SANS = '"Noto Sans CJK SC","Noto Sans SC",sans-serif';
const LATIN = '"Liberation Serif","Times New Roman",serif';
const MONO = '"DejaVu Sans Mono","Liberation Mono",monospace';
const GOLD_RGB = '232,190,120';

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eob = x => { x = clamp(x); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const B = n => n * BEAT;                         // beat → seconds
function win(t, a, b, fi = .5, fo = .45) {
  if (t < a || t > b) return 0;
  return Math.min(fi > 0 ? eo((t - a) / fi) : 1, fo > 0 ? eo((b - t) / fo) : 1);
}
function winB(t, a, b, fi, fo) { return win(t, B(a), B(b), fi, fo); }
function segB(t, a, b) { return seg(t, B(a), B(b)); }
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let r = Math.imul(s ^ s >>> 15, 1 | s); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
const R = Math.round;

// ---------- text ----------
function txt(s, x, y, o = {}) {
  const size = o.size || 40, a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= .003) return 0;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.font || SANS}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'alphabetic';
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  if (o.blur && o.blur > .4) ctx.filter = `blur(${o.blur.toFixed(1)}px)`;
  if (o.metal) {
    const g = ctx.createLinearGradient(0, y - size * .95, 0, y + size * .15);
    g.addColorStop(0, '#FFF6DE'); g.addColorStop(.28, '#F1D497'); g.addColorStop(.58, '#FFFBEA');
    g.addColorStop(.8, '#DDB46A'); g.addColorStop(1, '#F6E3B0');
    ctx.fillStyle = g;
  } else ctx.fillStyle = o.color || C.ink;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur || 26; }
  ctx.fillText(s, R(x), R(y + (o.rise || 0)));
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}
function txtIn(s, x, y, k, o = {}) {
  if (k <= 0) return;
  txt(s, x, y, Object.assign({}, o, { alpha: (o.alpha === undefined ? 1 : o.alpha) * k, rise: (1 - k) * 18, blur: (1 - k) * 6 }));
}
function measure(s, size, weight = 400, font = SANS, ls = 0) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; if (ls) ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(s).width; ctx.restore(); return w;
}

// ---------- shapes ----------
function rrect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function line(x1, y1, x2, y2, col, lw = 2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function circle(x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function glow(x, y, r, rgb, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.35, `rgba(${rgb},.3)`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}

// ---------- paper texture (made once) ----------
function makePaper(base, seed, speck) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const p = c.getContext('2d'); p.fillStyle = base; p.fillRect(0, 0, 512, 512);
  const r = rng(seed);
  for (let i = 0; i < 2600; i++) { p.fillStyle = `rgba(${speck},${(r() * .07).toFixed(3)})`; p.fillRect(r() * 512, r() * 512, 1 + r() * 1.6, 1 + r() * 1.6); }
  for (let i = 0; i < 70; i++) {                 // fibres
    p.strokeStyle = `rgba(${speck},${(.03 + r() * .04).toFixed(3)})`; p.lineWidth = .8;
    const x = r() * 512, y = r() * 512, a = r() * 6.28, l = 8 + r() * 22;
    p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a) * l * .6 + 3, y + Math.sin(a) * l * .6, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
  }
  for (let i = 0; i < 6; i++) {                  // stains
    const x = r() * 512, y = r() * 512, rr = 30 + r() * 80;
    const g = p.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(${speck},.035)`); g.addColorStop(1, `rgba(${speck},0)`);
    p.fillStyle = g; p.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  return c;
}
const PAPER = makePaper(C.paper, 3, '96,70,34');
const PAPER_OLD = makePaper(C.paperOld, 9, '70,48,20');
let PAT = null, PAT_OLD = null;
function pats() { if (!PAT) { PAT = ctx.createPattern(PAPER, 'repeat'); PAT_OLD = ctx.createPattern(PAPER_OLD, 'repeat'); } }

// paper card: (x,y) top-left, contents drawn in local coords
function paperCard(x, y, w, h, rot, a, fn, o = {}) {
  if (a <= 0) return;
  pats();
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot || 0); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = o.shadow === undefined ? 44 : o.shadow; ctx.shadowOffsetY = 18;
  ctx.fillStyle = o.old ? PAT_OLD : PAT;
  if (o.round) { rrect(0, 0, w, h, o.round); ctx.fill(); } else ctx.fillRect(0, 0, w, h);
  ctx.shadowColor = 'transparent';
  // edge darkening for a printed-paper feel
  const eg = ctx.createLinearGradient(0, 0, 0, h); eg.addColorStop(0, 'rgba(90,60,20,0.06)'); eg.addColorStop(.12, 'rgba(90,60,20,0)'); eg.addColorStop(.88, 'rgba(90,60,20,0)'); eg.addColorStop(1, 'rgba(90,60,20,0.1)');
  ctx.fillStyle = eg; if (o.round) { rrect(0, 0, w, h, o.round); ctx.fill(); } else ctx.fillRect(0, 0, w, h);
  if (fn) fn(w, h);
  ctx.restore();
}
function pText(s, x, y, size, o = {}) {
  ctx.save();
  ctx.fillStyle = o.color || C.pInk; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.font || LATIN}`;
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore(); return w;
}
function pLines(x, y, w, n, seed = 5, gap = 22, a = 1) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const lw = w * (i === n - 1 ? .5 : .8 + r() * .2); ctx.fillStyle = `rgba(43,39,35,${(.15 * a).toFixed(3)})`; ctx.fillRect(x, y + i * gap, lw, 7); }
}

// ---------- seals and stamps ----------
function seal(x, y, s, k, chars, rot = -.12) {
  if (k <= 0) return;
  const sc = 1 + (1 - eo(k)) * .7;
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.7) * .9;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  rrect(-s / 2, -s / 2, s, s, 6); ctx.strokeStyle = C.seal; ctx.lineWidth = s * .05; ctx.stroke();
  rrect(-s / 2 + s * .08, -s / 2 + s * .08, s * .84, s * .84, 3); ctx.lineWidth = s * .018; ctx.stroke();
  ctx.fillStyle = C.seal; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const n = chars.length;
  if (n === 1) { ctx.font = `900 ${s * .6}px ${SERIF}`; ctx.fillText(chars, 0, s * .02); }
  else if (n === 2) { ctx.font = `900 ${s * .36}px ${SERIF}`; ctx.fillText(chars[0], 0, -s * .18); ctx.fillText(chars[1], 0, s * .2); }
  else {
    ctx.font = `900 ${s * .3}px ${SERIF}`;
    ctx.fillText(chars[0], s * .18, -s * .17); ctx.fillText(chars[1], s * .18, s * .19);
    ctx.fillText(chars[2], -s * .18, -s * .17); ctx.fillText(chars[3], -s * .18, s * .19);
  }
  // worn ink: knock out a few specks
  ctx.globalCompositeOperation = 'destination-out';
  const r = rng(chars.charCodeAt(0));
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(0,0,0,${(r() * .6).toFixed(2)})`; ctx.fillRect(-s / 2 + r() * s, -s / 2 + r() * s, 2 + r() * 3, 2 + r() * 3); }
  ctx.restore();
}
function rectStamp(x, y, text, k, size = 44, rot = -.08) {
  if (k <= 0) return;
  const sc = 1 + (1 - eo(k)) * .7;
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.7) * .92;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.font = `900 ${size}px ${SERIF}`; ctx.letterSpacing = size * .18 + 'px';
  const w = ctx.measureText(text).width + size * .9, h = size * 1.6;
  rrect(-w / 2, -h / 2, w, h, 6); ctx.strokeStyle = C.seal; ctx.lineWidth = size * .09; ctx.stroke();
  ctx.fillStyle = C.seal; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, size * .09, size * .04);
  ctx.restore();
}

// ---------- the rat (ink drawing, facing right) ----------
function rat(x, y, s, o = {}) {
  const col = o.color || C.pInk, a = o.alpha === undefined ? 1 : o.alpha, ph = o.phase || 0;
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // tail
  if (o.tail !== false) {
    ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(-50, 4);
    const w = Math.sin(ph * 1.3) * 10;
    ctx.bezierCurveTo(-82, 2 + w, -104, 30 - w, -138, 18 + w * .6); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-130, 20 + w * .6); ctx.lineTo(-150, 12 + w * .4); ctx.stroke();
  } else {
    ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(-50, 4); ctx.lineTo(-60, 6); ctx.stroke();   // stub
    if (o.cut) { ctx.strokeStyle = C.seal; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-63, -4); ctx.lineTo(-63, 16); ctx.stroke(); ctx.strokeStyle = col; }
  }
  // legs
  ctx.lineWidth = 4.4;
  const l1 = Math.sin(ph) * 7, l2 = Math.sin(ph + Math.PI) * 7;
  ctx.beginPath(); ctx.moveTo(-26, 18); ctx.lineTo(-30 + l1, 32); ctx.moveTo(-14, 18); ctx.lineTo(-10 + l2, 32);
  ctx.moveTo(18, 16); ctx.lineTo(16 + l2, 32); ctx.moveTo(28, 14); ctx.lineTo(32 + l1, 31); ctx.stroke();
  // body
  ctx.beginPath(); ctx.ellipse(-8, 0, 46, 24, -.05, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.beginPath(); ctx.moveTo(22, -16); ctx.quadraticCurveTo(48, -16, 66, 2); ctx.quadraticCurveTo(46, 14, 22, 16); ctx.closePath(); ctx.fill();
  // ear
  ctx.beginPath(); ctx.ellipse(26, -20, 10, 12, -.3, 0, Math.PI * 2); ctx.fill();
  if (o.paper) { ctx.fillStyle = o.paper; ctx.beginPath(); ctx.ellipse(26, -19, 5, 7, -.3, 0, Math.PI * 2); ctx.fill(); }
  // eye + whiskers
  ctx.fillStyle = o.paper || '#EDE4D3'; ctx.beginPath(); ctx.arc(44, -4, 2.6, 0, 6.283); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.1; ctx.globalAlpha *= .7;
  ctx.beginPath(); ctx.moveTo(62, 2); ctx.lineTo(80, -4); ctx.moveTo(62, 3); ctx.lineTo(80, 6); ctx.stroke();
  ctx.restore();
}
function tailStroke(x, y, s, rot, col = C.pInk) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 4.2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-32, -2, -54, 26, -88, 14); ctx.stroke();
  ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-80, 16); ctx.lineTo(-100, 8); ctx.stroke();
  ctx.restore();
}

// ---------- clothesline + hanging cards ----------
function stringY(x, x0, x1, y0, sag) { const u = (x - x0) / (x1 - x0); return y0 + sag * 4 * u * (1 - u); }
function drawString(x0, x1, y0, sag, k, col = C.string, lw = 3.4) {
  if (k <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath();
  const xe = x0 + (x1 - x0) * k;
  for (let x = x0; x <= xe; x += 8) { const y = stringY(x, x0, x1, y0, sag); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.globalAlpha = .35; ctx.strokeStyle = '#F5A090'; ctx.lineWidth = 1;   // highlight
  ctx.beginPath(); for (let x = x0; x <= xe; x += 8) { const y = stringY(x, x0, x1, y0, sag) - 1; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  ctx.restore();
}
function clip(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#7E5F3B'; ctx.fillRect(-8, -22, 16, 40);
  ctx.fillStyle = 'rgba(255,240,210,0.22)'; ctx.fillRect(-8, -22, 5, 40);
  ctx.fillStyle = '#5E4428'; ctx.fillRect(-9, -4, 18, 4);
  ctx.restore();
}
// hanging card from a point on the string. flip: 0=back, 1=front
function hangCard(px, py, w, h, swing, flip, a, front, back, o = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(px, py); ctx.rotate(swing);
  const sx = Math.abs(Math.cos(Math.PI * flip)), isFront = flip > .5;
  if (o.glow) glow(0, h * .5 + 8, Math.max(w, h) * 1.2, GOLD_RGB, o.glow);
  ctx.save(); ctx.scale(Math.max(.02, sx), 1);
  paperCard(-w / 2, 8, w, h, 0, 1, (cw, ch) => {
    if (isFront) front && front(cw, ch); else back && back(cw, ch);
    // punched hole
    ctx.fillStyle = 'rgba(10,10,30,0.85)'; ctx.beginPath(); ctx.arc(cw / 2, 20, 6, 0, 6.283); ctx.fill();
  }, { old: o.old, shadow: 34 });
  // flip shading
  if (flip > 0 && flip < 1) { ctx.fillStyle = `rgba(0,0,0,${(.35 * (1 - sx)).toFixed(3)})`; ctx.fillRect(-w / 2, 8, w, h); }
  ctx.restore();
  clip(0, 0);
  ctx.restore();
}
const cardBack = (cw, ch) => { pText('?', cw / 2, ch * .62, ch * .38, { align: 'center', font: SERIF, weight: 600, color: 'rgba(43,39,35,0.3)' }); };
function ratFront(n, o = {}) {
  return (cw, ch) => {
    rat(cw * .5, ch * .5, cw / 158, { tail: false, cut: true, phase: o.phase || 0 });
    pText(`No.${String(n).padStart(2, '0')}`, 16, ch - 16, 18, { font: MONO, color: C.pInk2 });
    pText('1902', cw - 16, ch - 16, 18, { font: MONO, color: C.pInk2, align: 'right' });
  };
}

// =====================================================================
// background · three depth layers · light sweep · grain
// =====================================================================
const far = (() => { const r = rng(7); return Array.from({ length: 110 }, () => ({ x: r() * W, y: r() * H, s: .5 + r() * 1.5, v: 3 + r() * 7, p: r() * 6.28 })); })();
const bokeh = (() => { const r = rng(17); return Array.from({ length: 14 }, () => ({ x: r() * W, y: r() * H, rr: 40 + r() * 90, v: 10 + r() * 16, p: r() * 6.28, a: .05 + r() * .07 })); })();
function background(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg0); g.addColorStop(1, '#0B0A22');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const br = .5 + .5 * Math.sin(t * 2 * Math.PI / 36);
  const rg = ctx.createRadialGradient(W * .5, H * .42, 40, W * .5, H * .42, W * .66);
  rg.addColorStop(0, `rgba(52,44,96,${(.5 + .14 * br).toFixed(3)})`); rg.addColorStop(.55, 'rgba(20,19,52,0.3)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (const d of far) {                      // far layer: slow parallax dust
    const y = ((d.y - t * d.v) % H + H) % H, x = d.x + Math.sin(t * .22 + d.p) * 14;
    ctx.fillStyle = `rgba(248,221,156,${(.06 + .08 * (.5 + .5 * Math.sin(t * .6 + d.p))).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, d.s, 0, 6.283); ctx.fill();
  }
}
function lightSweep(t) {
  const x = W * (.18 + .64 * (.5 + .5 * Math.sin(t * 2 * Math.PI / 14 - 1.2))), y = H * (.36 + .06 * Math.sin(t * .31));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, 760);
  g.addColorStop(0, 'rgba(255,214,150,0.075)'); g.addColorStop(.5, 'rgba(255,200,130,0.025)'); g.addColorStop(1, 'rgba(255,200,130,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function foreground(t) {                      // near layer: soft out-of-focus motes, faster parallax
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of bokeh) {
    const x = ((b.x + t * b.v * 1.6) % (W + 300)) - 150, y = b.y + Math.sin(t * .4 + b.p) * 30;
    const g = ctx.createRadialGradient(x, y, b.rr * .35, x, y, b.rr);
    const a = b.a * (.7 + .3 * Math.sin(t * .8 + b.p));
    g.addColorStop(0, `rgba(255,220,170,${a.toFixed(3)})`); g.addColorStop(.7, `rgba(255,220,170,${(a * .5).toFixed(3)})`); g.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = g; ctx.fillRect(x - b.rr, y - b.rr, 2 * b.rr, 2 * b.rr);
  }
  ctx.restore();
}
const NOISE = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const n = c.getContext('2d'), d = n.createImageData(256, 256), r = rng(11); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } n.putImageData(d, 0, 0); return c; })();
let NOISE_PAT = null;
function grain(t) {
  if (!NOISE_PAT) NOISE_PAT = ctx.createPattern(NOISE, 'repeat');
  const f = Math.floor(t * 30), r = rng(f * 7 + 3);
  ctx.save(); ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay';
  ctx.translate(-R(r() * 256), -R(r() * 256)); ctx.fillStyle = NOISE_PAT; ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
}
function vignette() {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,0.74)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
// camera push for a scene: scale 1 → 1+amt across [a,b] (beats)
function push(t, a, b, amt = .04, cx = W / 2, cy = H * .45) {
  const k = eio(segB(t, a, b)), s = 1 + amt * k;
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// =====================================================================
// overlays: watermark, top label, notes, subtitles
// =====================================================================
function toolboxGlyph(x, y, s, col, lw = 1.6) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = lw / s; ctx.lineJoin = 'round';
  rrect(-13, -5, 26, 16, 2.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-5, -9); ctx.lineTo(5, -9); ctx.lineTo(5, -5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-13, 2); ctx.lineTo(13, 2); ctx.stroke(); ctx.restore();
}
function watermark(t) {
  const a = .62 * win(t, 1.4, TOTAL - 1.2, .8, 1);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; toolboxGlyph(82, 58, 1, C.gold);
  txt(`${SERIES} · ${EP_NO}`, 106, 66, { size: 22, align: 'left', color: C.ink2, weight: 500, ls: 3 }); ctx.restore();
}
const TOPLABELS = EP.TOPLABELS || [];
function topLabel(t) {
  for (const [a, b, s] of TOPLABELS) {
    const k = winB(t, a, b, .7, .5);
    if (k <= 0) continue;
    const w = measure(s, 22, 500, SERIF, 5);
    const lw = 80 * eo(k);
    ctx.save(); ctx.globalAlpha = k * .7;
    line(W / 2 - w / 2 - 28 - lw, 64, W / 2 - w / 2 - 28, 64, C.goldDim, 1);
    line(W / 2 + w / 2 + 28, 64, W / 2 + w / 2 + 28 + lw, 64, C.goldDim, 1);
    ctx.restore();
    txt(s, W / 2, 72, { size: 22, color: C.gold, alpha: k * .92, weight: 500, ls: 5, font: SERIF });
  }
}
const NOTES = EP.NOTES || [];
function notes(t) {
  for (const [a, b, s] of NOTES) { const k = winB(t, a, b, .6, .45); txt(s, W / 2, 852, { size: 21, color: C.ink3, alpha: k, ls: 1 }); }
}
// subtitles in beats: [start, end, zh, en]
const SUBS = EP.SUBS || [];
function subtitles(t) {
  // soft band so subtitles read over any scene
  const band = ctx.createLinearGradient(0, 860, 0, H);
  band.addColorStop(0, 'rgba(4,4,16,0)'); band.addColorStop(.5, 'rgba(4,4,16,0.42)'); band.addColorStop(1, 'rgba(4,4,16,0.55)');
  ctx.fillStyle = band; ctx.fillRect(0, 860, W, H - 860);
  for (const [a, b, zh, en] of SUBS) {
    const k = winB(t, a, b, .35, .3);
    if (k <= 0) continue;
    txtIn(zh, W / 2, 944, k, { size: 46, weight: 700, ls: 2, color: C.ink });
    txtIn(en, W / 2, 990, k, { size: 27, italic: true, font: LATIN, color: C.ink2 });
  }
}

// a moving specular band across a metal word (additive, clipped to a box)
function shine(t, a, b, text, cx, cy, size, font = SERIF, weight = 900, ls = 0) {
  const k = seg(t, a, b); if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; if (ls) ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(text).width;
  const x = cx - w / 2 - 160 + (w + 320) * eio(k);
  const g = ctx.createLinearGradient(x - 110, 0, x + 110, 0);
  g.addColorStop(0, 'rgba(255,244,214,0)'); g.addColorStop(.5, 'rgba(255,244,214,0.55)'); g.addColorStop(1, 'rgba(255,244,214,0)');
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, R(cx), R(cy)); ctx.restore();
}

// ---------- generic title card ----------
function titleCard(t, a, b, title, sub, en, sealChars) {
  const A = winB(t, a, b, .7, .6);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  push(t, a, b, .03, W / 2, 440);
  const s = B(a);
  const k1 = eo(seg(t, s + .1, s + 1.0)), k2 = eo(seg(t, s + .4, s + 1.5)), k3 = eo(seg(t, s + 1.2, s + 2.3)), k4 = eo(seg(t, s + 1.7, s + 2.8));
  ctx.save(); ctx.globalAlpha *= k1; toolboxGlyph(W / 2, 286, 1.3, C.goldDim, 1.6); ctx.restore();
  txtIn(`${SERIES}  ·  第 ${EP_NO} 期`, W / 2, 342, k1, { size: 28, color: C.goldDim, weight: 500, ls: 5 });
  const lw = 300 * k2;
  line(W / 2 - lw, 372, W / 2 + lw, 372, 'rgba(201,169,106,0.5)', 1);
  const size = title.length > 8 ? 92 : 104;
  txtIn(`《${title}》`, W / 2, 500, k2, { size, weight: 900, font: SERIF, metal: true, glow: 'rgba(232,184,92,0.28)', glowBlur: 30 });
  shine(t, s + 1.1, s + 2.6, `《${title}》`, W / 2, 500, size);
  line(W / 2 - lw, 548, W / 2 + lw, 548, 'rgba(201,169,106,0.5)', 1);
  txtIn(sub, W / 2, 626, k3, { size: 42, weight: 500 });
  txtIn(en, W / 2, 682, k4, { size: 34, color: C.ink2, font: LATIN, italic: true });
  if (sealChars) seal(1520, 470, 96, eo(seg(t, s + 2.2, s + 2.7)), sealChars);
  ctx.restore();
}
// left-aligned live cover, drawn over frame 0 and dissolved by ~1.65s
function coverText(t, l1, l2, sub, small, o = {}) {
  const a = 1 - eio(seg(t, .8, 1.65));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const s = ctx.createLinearGradient(0, 0, o.scrimW || 1100, 0); s.addColorStop(0, 'rgba(6,6,26,0.9)'); s.addColorStop(.75, 'rgba(6,6,26,0.62)'); s.addColorStop(1, 'rgba(6,6,26,0)');
  ctx.fillStyle = s; ctx.fillRect(0, 0, o.scrimW || 1100, H);
  const dx = -18 * seg(t, .8, 1.65), x = 130 + dx;
  const band = `${SERIES}　·　第 ${EP_NO} 期`;
  toolboxGlyph(x + 16, 278, 1.4, C.gold, 2);
  txt(band, x + 52, 288, { size: 28, weight: 600, color: C.gold, ls: 5, align: 'left' });
  txt(l1, x - 6, 470, { size: o.s1 || 124, weight: 900, font: SERIF, color: C.ink, align: 'left', ls: 4 });
  txt(l2, x - 6, 640, { size: o.s2 || 160, weight: 900, font: SERIF, metal: !o.l2color, color: o.l2color, glow: o.l2glow || 'rgba(232,184,92,0.35)', glowBlur: 40, align: 'left', ls: 6 });
  txt(sub, x, 750, { size: 44, weight: 500, color: C.ink, align: 'left', ls: 2 });
  txt(small, x + 2, 818, { size: 28, weight: 500, color: C.ink2, align: 'left', ls: 6, font: SERIF });
  ctx.restore();
}
// big digit roller helpers
function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }

function render(t) {
  t = clamp(t, 0, TOTAL);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  (EP.background || background)(t);
  for (const s of EP.SCENES) { ctx.save(); s(t); ctx.restore(); }
  lightSweep(t);
  foreground(t);
  watermark(t); topLabel(t); notes(t); subtitles(t);
  if (EP.cover) EP.cover(t);
  vignette();
  grain(t);
  const fb = seg(t, TOTAL - .6, TOTAL);
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
}
window.render = render; window.TOTAL = TOTAL; window.BEAT = BEAT;
window.ready = (async () => {
  const faces = [`700 46px ${SANS}`, `500 40px ${SANS}`, `900 60px ${SANS}`, `400 40px ${SANS}`, `600 30px ${SANS}`,
    `900 80px ${SERIF}`, `700 40px ${SERIF}`, `600 30px ${SERIF}`, `500 22px ${SERIF}`, `italic 400 27px ${LATIN}`, `400 27px ${LATIN}`, `700 27px ${LATIN}`, `400 20px ${MONO}`, `700 20px ${MONO}`];
  try { await Promise.all(faces.map(f => document.fonts.load(f, '牌 Abc 123'))); } catch (e) { }
  return true;
})();
window.ready.then(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.has('t')) render(parseFloat(qs.get('t')));
  else if (!qs.has('static')) { const t0 = performance.now(); (function loop() { render(((performance.now() - t0) / 1000) % TOTAL); requestAnimationFrame(loop); })(); }
});

// =====================================================================
// shared segments (generalised from episode 06)
// =====================================================================
function choiceCard(x, y, k, col, rgb, L, big, sub, t, chosen) {
  if (k <= 0) return;
  const s = .88 + .12 * eo(k) + (chosen ? .04 * chosen : 0);
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 1.4); ctx.translate(x, y); ctx.scale(s, s);
  if (chosen) glow(0, 0, 320, rgb, .4 * chosen);
  rrect(-240, -150, 480, 300, 22); ctx.fillStyle = `rgba(${rgb},0.1)`; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.5 + 2 * (chosen || 0); ctx.stroke();
  const sw = ((t * .55) % 1);
  ctx.save(); rrect(-240, -150, 480, 300, 22); ctx.clip();
  const gx = -480 + sw * 1200, g = ctx.createLinearGradient(gx - 110, 0, gx + 110, 0);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.5, `rgba(${rgb},0.18)`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(-240, -150, 480, 300); ctx.restore();
  txt(L, 0, -40, { size: 96, italic: true, font: LATIN, color: col });
  txt(big, 0, 46, { size: big.length > 7 ? 40 : 50, weight: 900 });
  txt(sub, 0, 104, { size: 26, color: C.ink2 });
  ctx.restore();
}
// pause-and-predict: header at a0, 3-2-1 on beats a0+1..a0+3, held breath on a0+4, reveal glow from a0+5
function predict(t, a0, A_, B_, ans, o = {}) {
  const A = winB(t, a0, a0 + 6.4, .3, .5);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  const hk = eo(segB(t, a0, a0 + .6));
  txtIn(o.header || '先别划走 · 猜一个', W / 2, 330, hk, { size: 56, weight: 900, ls: 6 });
  txtIn(o.en || "Don't scroll. Make a guess.", W / 2, 380, hk, { size: 28, italic: true, font: LATIN, color: C.ink2 });
  const rv = eo(segB(t, a0 + 5, a0 + 5.5));
  choiceCard(640, 600, segB(t, a0 + .1, a0 + .7), '#7FA6E0', '127,166,224', 'A', A_[0], A_[1], t, ans === 0 ? rv : 0);
  choiceCard(1280, 600, segB(t, a0 + .3, a0 + .9), '#E8A87C', '232,168,124', 'B', B_[0], B_[1], t, ans === 1 ? rv : 0);
  txt('或', W / 2, 616, { size: 36, font: SERIF, color: C.ink3, alpha: segB(t, a0 + .6, a0 + 1.2) * (1 - rv) });
  if (rv > 0) rectStamp(ans === 0 ? 800 : 1440, 470, '答案', rv, 40, .12);
  const rk = winB(t, a0 + .8, a0 + 4.1, .2, .15);
  if (rk > 0) {
    const p = segB(t, a0 + 1, a0 + 4), n = t < B(a0 + 2) ? 3 : t < B(a0 + 3) ? 2 : 1, fr = ((t - B(a0 + 1)) / BEAT) % 1, pulse = t > B(a0 + 1) ? 1 + .07 * Math.exp(-fr * 6) : 1;
    ctx.save(); ctx.globalAlpha *= rk; ctx.translate(W / 2, 820); ctx.scale(pulse, pulse);
    ctx.strokeStyle = 'rgba(242,237,227,0.16)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 54, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 54, -Math.PI / 2, -Math.PI / 2 + 6.283 * (1 - p)); ctx.stroke();
    txt(String(n), 0, 22, { size: 60, font: MONO, weight: 500 }); ctx.restore();
  }
  const dk = winB(t, a0 + 3.9, a0 + 5.1, .4, .25);
  if (dk > 0) { ctx.fillStyle = `rgba(0,0,8,${(.35 * dk).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
// a recreated historical document on paper
function docCard(x, y, w, h, rot, k, d, t) {
  paperCard(x, y + (1 - eob(k)) * 560, w, h, rot + (1 - eob(k)) * .05, k > 0 ? 1 : 0, (cw, ch) => {
    let yy = 56;
    (d.top || []).forEach(s => { pText(s, cw / 2, yy, 17, { align: 'center', ls: 3, color: C.pInk2 }); yy += 26; });
    line(60, yy - 4, cw - 60, yy - 4, C.pInk3, 1.5); yy += 52;
    (d.title || []).forEach(s => { pText(s, cw / 2, yy, d.titleSize || 40, { align: 'center', weight: 700 }); yy += (d.titleSize || 40) + 10; });
    if (d.author) { pText(d.author, cw / 2, yy + 4, 21, { align: 'center', ls: 2, color: C.pInk2 }); yy += 44; }
    pLines(70, yy, cw - 140, 2, 8, 24); yy += 70;
    if (d.big) {
      const hk = d.hlK || 0; ctx.fillStyle = 'rgba(232,184,92,0.45)'; ctx.fillRect(cw / 2 - 160, yy - 10, 320 * hk, 120);
      pText(d.big, cw / 2, yy + 92, 110, { align: 'center', weight: 700 }); yy += 150;
    }
    if (d.quote) {
      const hk = d.hlK || 0;
      d.quote.forEach((s, i) => {
        ctx.fillStyle = 'rgba(232,184,92,0.45)'; ctx.fillRect(64, yy - 28 + i * 42, (cw - 128) * clamp(hk * d.quote.length - i), 36);
        pText(s, cw / 2, yy + i * 42, d.quoteSize || 25, { align: 'center', italic: true });
      });
      yy += d.quote.length * 42 + 10;
    }
    pLines(70, yy, cw - 140, 2, 12, 24);
    pText('文献再现·示意', cw - 36, ch - 22, 15, { font: SANS, align: 'right', color: C.pInk2 });
    if (d.seal) seal(cw - 90, ch * .42, 104, d.sealK || 0, d.seal, .1);
  });
}
function toolCard(t, a, b, name, en, rows, selfQ) {
  const A = winB(t, a, b, .6, .6);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  push(t, a, b, .03, W / 2, 470);
  const e = eob(segB(t, a, a + 1.4));
  const icons = [iconQ, iconPair, iconLens];
  paperCard(360, 110 + (1 - e) * 560, 1200, 760, -.008, 1, (w, h) => {
    toolboxGlyph(70, 72, 1.6, C.goldDim, 2);
    pText(`工具 ${EP_NO}`, 104, 84, 30, { font: SERIF, weight: 900, color: C.goldDim, ls: 4 });
    pText(name, 70, 168, 72, { font: SERIF, weight: 900, ls: 6 });
    pText(en, 74, 210, 26, { italic: true, color: C.pInk2 });
    line(70, 240, w - 70, 240, C.pInk3, 1.5);
    rows.forEach(([head, main, ren], i) => {
      const bb = a + 2 + i * 4, k = eo(segB(t, bb, bb + 1.2)), y = 330 + i * 130;
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
      icons[i](110, y - 10, 1);
      const mx = 170 + measure(head, 40, 900, SERIF) + 34;
      pText(head, 170, y + 2, 40, { font: SERIF, weight: 900, color: C.seal });
      pText(main, mx, y + 2, main.length > 15 ? 34 : 38, { font: SERIF, weight: 700 });
      pText(ren, mx + 2, y + 42, 22, { italic: true, color: C.pInk2 });
      ctx.restore();
    });
    const qk = eo(segB(t, a + 12, a + 13.4));
    if (qk > 0) {
      ctx.save(); ctx.globalAlpha *= qk;
      pText(selfQ, w / 2, h - 60, 40, { align: 'center', font: SERIF, weight: 900 });
      const qw = measure(selfQ, 40, 900, SERIF) / 2 + 20;
      ctx.fillStyle = 'rgba(181,58,47,0.75)'; ctx.fillRect(w / 2 - qw * qk, h - 42, 2 * qw * qk, 4);
      ctx.restore();
    }
  });
  ctx.restore();
}
function iconQ(x, y, k) { ctx.save(); ctx.globalAlpha *= k; circle(x, y, 30, null, C.gold, 3); pText('?', x, y + 14, 40, { align: 'center', color: C.goldDim, weight: 700 }); ctx.restore(); }
function iconPair(x, y, k) { ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(x - 34, y - 18, 28, 36); ctx.strokeRect(x + 6, y - 18, 28, 36); line(x - 6, y, x + 6, y, C.seal, 3); ctx.restore(); }
function iconLens(x, y, k) { ctx.save(); ctx.globalAlpha *= k; circle(x - 6, y - 6, 20, null, C.gold, 3.5); line(x + 8, y + 8, x + 26, y + 26, C.gold, 5); ctx.restore(); }
function goldenLine(t, a, b, l1, l2, l3, en) {
  const A = winB(t, a, b, .5, .5);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  const s = B(a), r = rng(77);
  for (let i = 0; i < 80; i++) {
    const an = r() * 6.283, d0 = 760 + r() * 320, u = eio(seg(t, s + r() * .5, s + 1.8));
    const d = lerp(d0, 60 + r() * 420, u);
    const x = W / 2 + Math.cos(an) * d * 1.45, y = 500 + Math.sin(an) * d * .48;
    glow(x, y, 9, GOLD_RGB, .35 + .4 * u); circle(x, y, 1.6, '#FFF4D6');
  }
  const k1 = eo(segB(t, a + .5, a + 1.5)), k2 = eo(segB(t, a + 2, a + 2.8)), k3 = eo(segB(t, a + 4, a + 5)), k4 = eo(segB(t, a + 4.6, a + 5.6));
  const pop = t > B(a + 2) ? 1 + .025 * Math.exp(-(t - B(a + 2)) * 6) : 1;
  const sz = Math.max(l1.length, l2.length) > 7 ? 100 : 112;
  ctx.save(); ctx.translate(W / 2, 520); ctx.scale(pop, pop); ctx.translate(-W / 2, -520);
  txtIn(l1, W / 2, 430, k1, { size: sz, weight: 900, font: SERIF, metal: true, glow: 'rgba(232,184,92,0.3)', glowBlur: 30 });
  txtIn(l2, W / 2, 570, k2, { size: sz, weight: 900, font: SERIF, metal: true, glow: 'rgba(232,184,92,0.35)', glowBlur: 36 });
  ctx.restore();
  shine(t, B(a + 2.3), B(a + 4), l2, W / 2, 570, sz);
  txtIn(l3, W / 2, 666, k3, { size: 46, weight: 700, color: C.ink });
  txtIn(en, W / 2, 724, k4, { size: 30, italic: true, font: LATIN, color: C.ink2 });
  ctx.restore();
}
function questionCards(t, a, b, q, en, opts) {
  const A = winB(t, a, b, .5, .5);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  push(t, a, b, .03, W / 2, 480);
  const hk = eo(segB(t, a + .2, a + 1));
  txtIn(q, W / 2, 220, hk, { size: 64, weight: 900, ls: 2 });
  txtIn(en, W / 2, 272, hk, { size: 28, italic: true, font: LATIN, color: C.ink2 });
  drawString(240, 1680, 350, 40, eo(segB(t, a + .4, a + 1.2)));
  opts.forEach(([zh, oen], i) => {
    const x = 450 + i * 340, py = stringY(x, 240, 1680, 350, 40), bb = a + 1 + i * .5;
    const en2 = eob(segB(t, bb - .5, bb)), fl = eo(segB(t, bb, bb + .45));
    hangCard(x, py, 250, 300, Math.sin(t * 1.6 + i * 1.3) * .05 + (1 - en2) * .4, fl, en2, (w, h) => {
      pText(String.fromCharCode(65 + i), w / 2, 110, 64, { align: 'center', italic: true, color: C.goldDim });
      pText(zh, w / 2, 200, zh.length > 3 ? 46 : 58, { align: 'center', font: SERIF, weight: 900 });
      pText(oen, w / 2, 244, 22, { align: 'center', italic: true, color: C.pInk2 });
    }, cardBack);
  });
  ctx.restore();
}
function endNote(t, a, lines) {
  const A = win(t, B(a), TOTAL, .5, .9);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  rrect(400, 320, 1120, 380, 14); ctx.strokeStyle = 'rgba(242,237,227,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  txt('说　明', W / 2, 392, { size: 34, weight: 700, color: C.gold, ls: 8, font: SERIF });
  lines.forEach((s, i) => txt(s, W / 2, 470 + i * 54, { size: i === lines.length - 1 ? 26 : 30, color: i === lines.length - 1 ? C.ink2 : C.ink }));
  ctx.restore();
}
// a number that pops in on its beat
function popTxt(s, x, y, t, beat, o = {}) {
  const k = eo(segB(t, beat, beat + .6));
  if (k <= 0) return;
  const pop = t > B(beat) ? 1 + .06 * Math.exp(-(t - B(beat)) * 7) : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
  txtIn(s, 0, 0, k * (o.alpha === undefined ? 1 : o.alpha), Object.assign({}, o, { alpha: 1 }));
  ctx.restore();
}
// a scene's alpha window + camera push, wrapping a draw function
function scene(t, a, b, fn, o = {}) {
  const A = winB(t, a, b, o.fi || .5, o.fo || .5);
  if (A <= 0) return;
  ctx.save(); ctx.globalAlpha = A;
  push(t, a, b, o.push === undefined ? .035 : o.push, o.cx || W / 2, o.cy || 470);
  fn(A);
  ctx.restore();
}
