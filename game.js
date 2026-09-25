'use strict';

/* =========================================================
   Frituur Baas — run je eigen snackbar
   ========================================================= */

/* ---------- Data ---------- */
// cook: seconden tot goudbruin · cost: inkoop · price: verkoopprijs · max: max aantal per bestelregel
const SNACKS = {
  patat:        { name: 'Patat',        cook: 3,   cost: 0.40, price: 2.50, max: 2, raw: '#f7eab0', gold: '#eab448', gold2: '#cf8a26' },
  frikandel:    { name: 'Frikandel',    cook: 4,   cost: 0.50, price: 2.20, max: 3, raw: '#dba594', gold: '#8e4827', gold2: '#6d3219' },
  kroket:       { name: 'Kroket',       cook: 5,   cost: 0.60, price: 2.40, max: 3, raw: '#ecd6a4', gold: '#c77c2d', gold2: '#a5601d' },
  kaassouffle:  { name: 'Kaassoufflé',  cook: 4.5, cost: 0.60, price: 2.50, max: 2, raw: '#f4e3b8', gold: '#de9d3b', gold2: '#bd7824' },
  bitterballen: { name: 'Bitterballen', cook: 3.5, cost: 1.00, price: 4.50, max: 1, raw: '#e8cd98', gold: '#b56c27', gold2: '#955218' },
};
const SNACK_ORDER = ['patat', 'frikandel', 'kroket', 'kaassouffle', 'bitterballen'];
const BURNT = '#24150b';
const BURN_FADE = 1.5;          // seconden van "net verbrand" tot pikzwart
const COLD_AT = 0.25;           // temperatuur (0..1) waaronder een snack te koud is
const HOLDING_CAP = 12;
const DAY_LENGTH = 120;         // seconden dat de zaak open is

const NAMES = ['Henk', 'Ingrid', 'Kees', 'Fatima', 'Joop', 'Sanne', 'Mohammed', 'Truus', 'Bram', 'Lotte',
  'Gerrit', 'Anouk', 'Dirk', 'Yara', 'Piet', 'Mila', 'Sjaak', 'Noor', 'Ruud', 'Esmee', 'Wim', 'Daan'];
const FACES = ['🧔', '👩', '👴', '👵', '👨‍🦰', '👩‍🦱', '🧑‍🎓', '👷', '👮', '👨‍🦳', '👩‍🦰', '🧑', '👱‍♀️', '🧓', '👨‍🔧', '👩‍🍳'];
const HAPPY_LINES = ['Heerlijk! 😋', 'Top, dank je!', 'Lekker knapperig!', 'Precies goed!', 'Toppie! 👍'];
const UPGRADES = [
  { id: 'lamp',    icon: '💡', name: 'Warmhoudlamp',       price: 15, desc: 'Snacks in de uitlekbak blijven veel langer warm.' },
  { id: 'big',     icon: '🧺', name: 'Grote mandjes',      price: 12, desc: 'Er passen 6 snacks in een mandje in plaats van 4.' },
  { id: 'radio',   icon: '📻', name: 'Gezellige radio',    price: 20, desc: 'Klanten hebben 25% meer geduld.' },
  { id: 'basket4', icon: '🍳', name: 'Vierde frituurmand', price: 30, desc: 'Een extra mandje in de friteuse.' },
];

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const round05 = v => Math.round(v * 20) / 20;
const euro = v => (v < 0 ? '-€ ' : '€ ') + Math.abs(v).toFixed(2).replace('.', ',');
const win = s => Math.max(2, s.cook * 0.6);   // lengte van het perfecte venster
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- Kleuren ---------- */
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function mix(a, b, t) {
  t = clamp01(t);
  const A = hexRgb(a), B = hexRgb(b);
  return A.map((v, i) => Math.round(v + (B[i] - v) * t));
}
// Kleur van een snack na t seconden in het vet: bleek → goudbruin → zwart
function snackColor(type, t) {
  const s = SNACKS[type], w = win(s);
  if (t <= s.cook) return mix(s.raw, s.gold, t / s.cook);
  if (t <= s.cook + w) return mix(s.gold, s.gold2, (t - s.cook) / w);
  return mix(s.gold2, BURNT, (t - s.cook - w) / BURN_FADE);
}
function paint(node, rgb) {
  node.style.setProperty('--c', `rgb(${rgb.join(',')})`);
  node.style.setProperty('--d', `rgb(${rgb.map(v => Math.round(v * 0.55)).join(',')})`);
}
function quality(type, t) {
  const s = SNACKS[type];
  if (t < s.cook) return 'raw';
  if (t < s.cook + win(s)) return 'perfect';
  return 'burnt';
}

/* ---------- Snack-tekeningen (SVG) ---------- */
function snackSVG(type) {
  const g = 'fill="var(--c)" stroke="var(--d)" stroke-width="1.4"';
  switch (type) {
    case 'patat':
      return `<svg class="snack" viewBox="0 0 60 60"><g ${g}>
        <rect x="16" y="7" width="5" height="26" rx="1.5" transform="rotate(-14 18 20)"/>
        <rect x="21" y="4" width="5" height="28" rx="1.5" transform="rotate(-4 23 18)"/>
        <rect x="28" y="2" width="5" height="30" rx="1.5"/>
        <rect x="34" y="5" width="5" height="27" rx="1.5" transform="rotate(8 36 18)"/>
        <rect x="39" y="9" width="5" height="24" rx="1.5" transform="rotate(16 41 20)"/></g>
        <path d="M12 26 L48 26 L42 57 L18 57 Z" fill="#d62828" stroke="#8d1616" stroke-width="1.4"/>
        <path d="M14 33 L46 33 L45 38 L15 38 Z" fill="#fff"/>
        <path d="M24 45 q6 5 12 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
    case 'frikandel':
      return `<svg class="snack" viewBox="0 0 60 60"><g transform="rotate(-28 30 30)">
        <rect x="4" y="23" width="52" height="14" rx="7" ${g}/>
        <path d="M11 27 H48" stroke="rgba(255,255,255,.35)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M18 33 v2 M26 33 v2 M34 33 v2 M42 33 v2" stroke="var(--d)" stroke-width="1.2" opacity=".6"/></g></svg>`;
    case 'kroket':
      return `<svg class="snack" viewBox="0 0 60 60"><g transform="rotate(-12 30 30)">
        <rect x="8" y="18" width="44" height="24" rx="12" ${g}/>
        <g fill="var(--d)" opacity=".55"><circle cx="17" cy="25" r="1.3"/><circle cx="24" cy="33" r="1.3"/>
        <circle cx="31" cy="24" r="1.3"/><circle cx="38" cy="34" r="1.3"/><circle cx="44" cy="26" r="1.3"/>
        <circle cx="20" cy="37" r="1.1"/><circle cx="35" cy="29" r="1.1"/><circle cx="28" cy="38" r="1.1"/></g>
        <path d="M16 22 H40" stroke="rgba(255,255,255,.35)" stroke-width="2.5" stroke-linecap="round"/></g></svg>`;
    case 'kaassouffle':
      return `<svg class="snack" viewBox="0 0 60 60">
        <rect x="8" y="15" width="44" height="30" rx="5" ${g}/>
        <rect x="12" y="19" width="36" height="22" rx="3" fill="none" stroke="var(--d)" stroke-width="1.3" stroke-dasharray="2.5 2.5" opacity=".7"/>
        <path d="M20 45 q2 6 5 0" fill="#ffd84a" stroke="#d9a400" stroke-width="1"/>
        <path d="M15 23 H34" stroke="rgba(255,255,255,.35)" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    case 'bitterballen':
      return `<svg class="snack" viewBox="0 0 60 60"><g ${g}>
        <circle cx="19" cy="38" r="11"/><circle cx="41" cy="38" r="11"/><circle cx="30" cy="20" r="11"/></g>
        <g fill="var(--d)" opacity=".5"><circle cx="16" cy="36" r="1.2"/><circle cx="22" cy="42" r="1.2"/>
        <circle cx="39" cy="35" r="1.2"/><circle cx="44" cy="41" r="1.2"/><circle cx="28" cy="18" r="1.2"/><circle cx="33" cy="23" r="1.2"/></g>
        <g fill="rgba(255,255,255,.4)"><circle cx="15" cy="33" r="2.5"/><circle cx="37" cy="33" r="2.5"/><circle cx="26" cy="15" r="2.5"/></g></svg>`;
  }
  return '';
}

/* ---------- Geluid (Web Audio, geen bestanden nodig) ---------- */
const Sound = {
  ctx: null, muted: false, sizzle: null,
  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    try {
      const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.02 ? 1 : 0.35);
      this.noise = buf;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 0.6;
      const gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(bp).connect(gain).connect(ctx.destination); src.start();
      this.sizzle = gain;
    } catch (e) { this.ctx = null; }
  },
  setSizzle(n) {
    if (!this.sizzle) return;
    const target = this.muted ? 0 : Math.min(0.14, n * 0.05);
    this.sizzle.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  },
  tone(freq, dur, type = 'sine', vol = 0.15, delay = 0, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  burst(dur = 0.35, vol = 0.25) {
    if (!this.ctx || this.muted) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
    const g = this.ctx.createGain(), t0 = this.ctx.currentTime;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f).connect(g).connect(this.ctx.destination); s.start(t0); s.stop(t0 + dur);
  },
  plop()  { this.tone(420, 0.12, 'sine', 0.18, 0, 1.8); },
  splash(){ this.burst(0.5, 0.3); },
  ding()  { this.tone(1318, 0.5, 'sine', 0.16); this.tone(1760, 0.6, 'sine', 0.12, 0.12); },
  bell()  { this.tone(988, 0.25, 'triangle', 0.12); this.tone(784, 0.35, 'triangle', 0.12, 0.15); },
  cash()  { this.tone(1046, 0.08, 'square', 0.06); this.tone(1568, 0.3, 'square', 0.06, 0.08); this.burst(0.08, 0.12); },
  bad()   { this.tone(196, 0.35, 'sawtooth', 0.1, 0, 0.7); },
  lift()  { this.tone(300, 0.15, 'triangle', 0.12, 0, 2); },
};

/* ---------- Spelstatus ---------- */
const G = { running: false, paused: false, upg: {}, selected: null };

function loadBest() {
  try { return JSON.parse(localStorage.getItem('frituurbaas-best')) || null; } catch (e) { return null; }
}
function saveBest() {
  try {
    const best = loadBest() || { day: 0, money: 0 };
    if (G.day > best.day || (G.day === best.day && G.money > best.money)) {
      localStorage.setItem('frituurbaas-best', JSON.stringify({ day: G.day, money: G.money }));
    }
  } catch (e) { /* opslag niet beschikbaar */ }
}

function newGame() {
  Object.assign(G, { day: 1, money: 20, rep: 100, upg: {}, nextId: 1, totalServed: 0 });
  startDay();
}

function startDay() {
  const nb = G.upg.basket4 ? 4 : 3;
  Object.assign(G, {
    t: 0, open: true, nextSpawn: 1.5, customers: [null, null, null],
    baskets: Array.from({ length: nb }, () => ({ type: null, count: 0, state: 'empty', t: 0, alerted: 0 })),
    holding: [], selected: null, running: true, paused: false,
    stats: { revenue: 0, tips: 0, costs: 0, served: 0, lost: 0, refused: 0, burnt: 0, perfect: 0, wasted: 0 },
  });
  hideOverlay();
  renderAll();
  toast(`☀️ Dag ${G.day} — de deuren gaan open!`, 'good');
  Sound.bell();
}

const basketCap = () => (G.upg.big ? 6 : 4);
const spawnInterval = () => Math.max(5, 13 - (G.day - 1) * 1.5);

/* ---------- Game loop ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (G.running && !G.paused) update(dt);
  requestAnimationFrame(loop);
}

function update(dt) {
  G.t += dt;

  // Sluitingstijd
  if (G.open && G.t >= DAY_LENGTH) {
    G.open = false;
    toast('🔒 Sluitingstijd! Help de laatste klanten nog.', '');
    renderSlots();
  }

  // Nieuwe klanten
  if (G.open && G.t >= G.nextSpawn) {
    const free = [0, 1, 2].filter(i => !G.customers[i]);
    if (free.length) {
      spawnCustomer(pick(free));
      G.nextSpawn = G.t + spawnInterval() * (0.75 + Math.random() * 0.5);
    }
  }

  // Frituurmanden
  let frying = 0;
  G.baskets.forEach((b, i) => {
    if (b.state !== 'frying') return;
    frying++;
    b.t += dt;
    const s = SNACKS[b.type];
    if (b.alerted < 1 && b.t >= s.cook) { b.alerted = 1; Sound.ding(); }
    if (b.alerted < 2 && b.t >= s.cook + win(s)) {
      b.alerted = 2; Sound.bad();
      toast(`🔥 Mandje ${i + 1} verbrandt!`, 'bad');
    }
  });
  Sound.setSizzle(frying);

  // Snacks in de uitlekbak koelen af
  const rate = G.upg.lamp ? 1 / 38 : 1 / 22;
  for (const h of G.holding) h.temp = Math.max(0, h.temp - dt * rate);

  // Klanten
  G.customers.forEach((c, i) => {
    if (!c) return;
    if (c.sayT > 0) { c.sayT -= dt; if (c.sayT <= 0) c.refs.speech.classList.add('hidden'); }
    if (c.state === 'waiting') {
      c.patience -= dt;
      if (c.patience <= 0) { c.patience = 0; customerLeaves(i, false); }
    } else if (c.state === 'leaving') {
      c.leaveT -= dt;
      if (c.leaveT <= 0) { G.customers[i] = null; renderSlot(i); }
    }
  });

  if (G.rep <= 0) return gameOver();
  if (!G.open && G.customers.every(c => !c)) return endDay();

  updateVisuals();
}

/* ---------- Klanten ---------- */
function spawnCustomer(slot) {
  const maxLines = Math.min(4, 1 + Math.floor((G.day + 1) / 2));
  const n = 1 + rand(maxLines);
  const types = shuffle(SNACK_ORDER.slice()).slice(0, n).sort((a, b) => SNACK_ORDER.indexOf(a) - SNACK_ORDER.indexOf(b));
  const order = types.map(type => {
    const max = G.day === 1 ? Math.min(2, SNACKS[type].max) : SNACKS[type].max;
    return { type, qty: 1 + rand(max), got: 0 };
  });
  const items = order.reduce((a, l) => a + l.qty, 0);
  const patience = (Math.max(24, 50 - (G.day - 1) * 4) + items * 5) * (G.upg.radio ? 1.25 : 1);
  G.customers[slot] = {
    id: G.nextId++, name: pick(NAMES), face: pick(FACES), order,
    patience, max: patience, state: 'waiting', sayT: 0, leaveT: 0, warmth: 0, items,
  };
  renderSlot(slot);
  Sound.bell();
}

function say(c, text, bad) {
  c.refs.speech.textContent = text;
  c.refs.speech.className = 'speech' + (bad ? ' bad' : '');
  c.sayT = 2.2;
}

function customerLeaves(i, happy) {
  const c = G.customers[i];
  c.state = 'leaving';
  c.leaveT = happy ? 1.4 : 1.8;
  if (!happy) {
    G.rep -= 15;
    G.stats.lost++;
    say(c, pick(['Ik ga wel naar de concurrent! 😤', 'Dit duurt veel te lang!', 'Laat maar zitten! 😠']), true);
    Sound.bad();
    toast(`😠 ${c.name} is boos weggelopen (−15 reputatie)`, 'bad');
  }
  setTimeout(() => c.refs.root.classList.add('leaving'), happy ? 700 : 1000);
}

function serve(slot, item) {
  const c = G.customers[slot];
  if (!c || c.state !== 'waiting') { toast('Hier staat geen klant.', ''); return false; }
  const line = c.order.find(l => l.type === item.type && l.got < l.qty);
  if (!line) {
    say(c, c.order.some(l => l.type === item.type) ? 'Ik heb al genoeg daarvan!' : 'Dat heb ik niet besteld!', true);
    Sound.bad();
    return false;
  }
  if (item.quality === 'burnt') {
    removeItem(item); G.rep -= 6; G.stats.refused++;
    say(c, 'Getver, die is verbrand! 🤢', true); Sound.bad();
    return true;
  }
  if (item.quality === 'raw') {
    removeItem(item); G.rep -= 6; G.stats.refused++;
    say(c, 'Bah, dit is nog rauw! 🤮', true); Sound.bad();
    return true;
  }
  if (item.temp < COLD_AT) {
    removeItem(item); G.rep -= 4; G.stats.refused++;
    say(c, 'Dit is koud! Neem maar terug. 🥶', true); Sound.bad();
    return true;
  }
  // Goed!
  line.got++;
  c.warmth += item.temp;
  removeItem(item);
  Sound.plop();
  const tray = el('div', '', snackSVG(item.type));
  paint(tray.firstChild, item.color);
  c.refs.tray.appendChild(tray.firstChild);
  renderOrderLines(c);
  if (c.order.every(l => l.got >= l.qty)) completeOrder(slot);
  return true;
}

function completeOrder(slot) {
  const c = G.customers[slot];
  const base = c.order.reduce((a, l) => a + SNACKS[l.type].price * l.qty, 0);
  const speed = c.patience / c.max;
  const warm = c.warmth / c.items;
  const tip = round05(base * 0.6 * Math.pow(speed, 1.3) * (0.6 + 0.4 * warm));
  G.money += base + tip;
  G.stats.revenue += base;
  G.stats.tips += tip;
  G.stats.served++;
  G.totalServed++;
  G.rep = Math.min(100, G.rep + (speed > 0.6 ? 5 : 3));
  say(c, speed > 0.6 ? pick(HAPPY_LINES) : 'Eindelijk… maar wel lekker.');
  Sound.cash();
  const f = el('div', 'float-money', `+${euro(base + tip)}<small>${tip > 0 ? 'fooi ' + euro(tip) : 'geen fooi'}</small>`);
  c.refs.slot.appendChild(f);
  setTimeout(() => f.remove(), 1700);
  customerLeaves(slot, true);
}

/* ---------- Frituurmanden ---------- */
function addToBasket(i, type) {
  const b = G.baskets[i];
  if (!b) return false;
  if (b.state === 'frying') { toast('Dit mandje hangt al in het vet!', 'bad'); return false; }
  if (b.type && b.type !== type) { toast('Eén soort snack per mandje!', 'bad'); return false; }
  if (b.count >= basketCap()) { toast('Dit mandje is vol!', 'bad'); return false; }
  const s = SNACKS[type];
  G.money -= s.cost;
  G.stats.costs += s.cost;
  b.type = type; b.count++; b.state = 'loaded'; b.t = 0; b.alerted = 0;
  Sound.plop();
  renderBasket(i);
  return true;
}

function fryBasket(i) {
  const b = G.baskets[i];
  if (!b || b.state !== 'loaded') return;
  b.state = 'frying'; b.t = 0; b.alerted = 0;
  Sound.splash();
  renderBasket(i);
}

function emptyBasket(i) {
  const b = G.baskets[i];
  if (!b || b.state !== 'loaded') return;
  const refund = SNACKS[b.type].cost * b.count;
  G.money += refund; G.stats.costs -= refund;
  Object.assign(b, { type: null, count: 0, state: 'empty', t: 0 });
  renderBasket(i);
}

function liftBasket(i) {
  const b = G.baskets[i];
  if (!b || b.state !== 'frying') return;
  if (G.holding.length + b.count > HOLDING_CAP) {
    toast('De uitlekbak is vol! Serveer of gooi eerst iets weg.', 'bad');
    return;
  }
  const q = quality(b.type, b.t), color = snackColor(b.type, b.t);
  for (let k = 0; k < b.count; k++) {
    G.holding.push({ id: G.nextId++, type: b.type, quality: q, color, temp: 1 });
  }
  if (q === 'perfect') { G.stats.perfect += b.count; toast(`✨ Perfect goudbruin! (${b.count}× ${SNACKS[b.type].name})`, 'good'); }
  else if (q === 'raw') toast(`😬 Te vroeg! ${SNACKS[b.type].name} is nog rauw.`, 'bad');
  else { G.stats.burnt += b.count; toast(`💀 Verbrand… gooi het in de prullenbak.`, 'bad'); }
  Object.assign(b, { type: null, count: 0, state: 'empty', t: 0, alerted: 0 });
  Sound.lift();
  renderBasket(i);
  renderHolding();
}

/* ---------- Uitlekbak ---------- */
function removeItem(item) {
  G.holding = G.holding.filter(h => h !== item);
  if (G.selected === 'item:' + item.id) setSelected(null);
  renderHolding();
}

function trashItem(item) {
  removeItem(item);
  G.stats.wasted++;
  Sound.burst(0.2, 0.15);
}

/* ---------- Rendering ---------- */
function renderAll() {
  renderStock();
  renderBaskets();
  renderHolding();
  renderSlots();
  updateVisuals();
  setSelected(null);
}

function renderStock() {
  const box = $('#stock');
  box.innerHTML = '';
  SNACK_ORDER.forEach((type, k) => {
    const s = SNACKS[type];
    const e = el('div', 'stock-item', `${snackSVG(type)}<div class="nm">${s.name}</div>
      <div class="meta"><kbd>${k + 1}</kbd>${s.cook}s · ${euro(s.cost)}</div>`);
    e.dataset.drag = 'stock:' + type;
    e.title = `${s.name}: ${s.cook} seconden frituren, inkoop ${euro(s.cost)}, verkoop ${euro(s.price)}`;
    paint(e, mix(s.raw, s.gold, 0.15));
    box.appendChild(e);
  });
}

function renderBaskets() {
  const box = $('#baskets');
  box.innerHTML = '';
  G.baskets.forEach((b, i) => {
    b.el = el('div', 'basket');
    box.appendChild(b.el);
    renderBasket(i);
  });
}

function renderBasket(i) {
  const b = G.baskets[i], root = b.el;
  root.dataset.drop = 'basket:' + i;
  root.className = 'basket state-' + b.state;
  let items = '';
  for (let k = 0; k < b.count; k++) items += snackSVG(b.type);
  let bar = '<div class="cookbar"></div>';
  if (b.type) {
    const s = SNACKS[b.type], w = win(s), total = s.cook + w + BURN_FADE;
    bar = `<div class="cookbar"><div class="z-raw" style="width:${s.cook / total * 100}%"></div>
      <div class="z-ok" style="width:${w / total * 100}%"></div><div class="z-burn" style="flex:1"></div>
      <div class="needle"></div></div>`;
  }
  let actions = '<div class="empty-hint">Sleep een snack hierheen</div>';
  if (b.state === 'loaded') {
    actions = `<button class="btn fry" data-act="fry:${i}">🔥 Start frituren</button>
      <button class="btn small" data-act="empty:${i}" title="Mandje leegmaken (geld terug)">✕</button>`;
  } else if (b.state === 'frying') {
    actions = `<button class="btn out" data-act="lift:${i}">⬆️ Eruit halen</button>`;
  }
  root.innerHTML = `<div class="bhead"><span>Mandje ${i + 1}</span><span class="bstatus"></span></div>
    <div class="vat"><div class="oil"><div class="bubbles"></div></div><div class="wire">${items}</div></div>
    ${bar}
    <div class="bmeta">${b.type ? `${SNACKS[b.type].name} × ${b.count} <span style="opacity:.6">(max ${basketCap()})</span>` : 'Leeg'}</div>
    <div class="bactions">${actions}</div>`;
  b.refs = { wire: root.querySelector('.wire'), needle: root.querySelector('.needle'), status: root.querySelector('.bstatus') };
  if (b.type) paint(b.refs.wire, snackColor(b.type, b.t));
  if (b.state === 'loaded') b.refs.status.textContent = 'Klaar om te bakken';
}

function renderHolding() {
  const box = $('#holding');
  box.innerHTML = '';
  if (!G.holding.length) box.innerHTML = '<div class="empty-hint">Gebakken snacks komen hier</div>';
  for (const h of G.holding) {
    const e = el('div', 'item', `${snackSVG(h.type)}<div class="temp"><div></div></div><div class="tag"></div>`);
    e.dataset.drag = 'item:' + h.id;
    e.title = SNACKS[h.type].name;
    paint(e, h.color);
    h.el = e;
    h.refs = { temp: e.querySelector('.temp > div'), tag: e.querySelector('.tag') };
    box.appendChild(e);
  }
  refreshSelected();
}

function renderSlots() { for (let i = 0; i < 3; i++) renderSlot(i); }

function renderSlot(i) {
  const box = $('#customers');
  let slot = box.children[i];
  if (!slot) { slot = el('div', 'cust-slot'); box.appendChild(slot); }
  slot.dataset.drop = 'tray:' + i;
  const c = G.customers[i];
  slot.className = 'cust-slot' + (c ? ' has-customer' : '');
  if (!c) {
    slot.innerHTML = `<div class="slot-empty">${G.open ? 'Wachten op een klant…' : 'Gesloten'}</div>
      <div class="tray"><div class="tray-label">Dienblad</div><div class="tray-items"></div></div>`;
    return;
  }
  slot.innerHTML = `<div class="customer">
      <div class="speech hidden"></div>
      <div class="thought"></div>
      <div class="person"><span class="face">${c.face}</span><span class="mood">😀</span></div>
      <div class="cname">${c.name}</div>
      <div class="patience"><div class="fill"></div></div>
    </div>
    <div class="tray"><div class="tray-label">Dienblad van ${c.name}</div><div class="tray-items"></div></div>`;
  c.refs = {
    slot, root: slot.querySelector('.customer'), speech: slot.querySelector('.speech'),
    thought: slot.querySelector('.thought'), mood: slot.querySelector('.mood'),
    fill: slot.querySelector('.patience .fill'), tray: slot.querySelector('.tray-items'),
  };
  renderOrderLines(c);
}

function renderOrderLines(c) {
  c.refs.thought.innerHTML = c.order.map(l => `<div class="oline${l.got >= l.qty ? ' done' : ''}">
      <span class="ic">${snackSVG(l.type)}</span><span class="q">${l.got}/${l.qty}</span><span class="nm">${SNACKS[l.type].name}</span></div>`).join('');
  c.refs.thought.querySelectorAll('.oline').forEach((row, k) => {
    const s = SNACKS[c.order[k].type];
    paint(row.querySelector('.ic'), hexRgb(s.gold));
  });
}

function updateVisuals() {
  // HUD
  $('#hud-day').textContent = G.day;
  const mins = 11 * 60 + Math.min(1, G.t / DAY_LENGTH) * 10 * 60;
  $('#hud-clock').textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.floor(mins % 60 / 15) * 15).padStart(2, '0')}`;
  const m = $('#hud-money');
  m.textContent = euro(G.money);
  m.classList.toggle('neg', G.money < 0);
  const rep = $('#hud-rep');
  rep.style.width = Math.max(0, G.rep) + '%';
  rep.style.background = G.rep > 60 ? 'var(--green)' : G.rep > 30 ? 'var(--yellow)' : 'var(--red)';
  const sign = $('#open-sign');
  sign.textContent = G.open ? 'OPEN' : 'GESLOTEN';
  sign.classList.toggle('closed', !G.open);

  // Manden
  for (const b of G.baskets) {
    if (b.state !== 'frying') continue;
    const s = SNACKS[b.type], w = win(s), total = s.cook + w + BURN_FADE;
    paint(b.refs.wire, snackColor(b.type, b.t));
    b.refs.needle.style.left = Math.min(100, b.t / total * 100) + '%';
    const q = quality(b.type, b.t);
    b.el.classList.toggle('is-perfect', q === 'perfect');
    b.el.classList.toggle('is-burnt', q === 'burnt');
    b.refs.status.textContent = q === 'raw' ? `Bakken… ${b.t.toFixed(1)}s`
      : q === 'perfect' ? '✨ PERFECT!' : '💀 VERBRAND';
  }

  // Uitlekbak
  for (const h of G.holding) {
    const cold = h.temp < COLD_AT;
    h.refs.temp.style.width = (h.temp * 100) + '%';
    h.refs.temp.style.background = `rgb(${mix('#3b82c4', '#e0452b', (h.temp - COLD_AT) / (1 - COLD_AT)).join(',')})`;
    h.el.classList.toggle('cold', cold);
    let tag = '', cls = 'tag';
    if (h.quality === 'raw') { tag = 'RAUW'; cls += ' raw'; }
    else if (h.quality === 'burnt') { tag = 'VERBRAND'; cls += ' burnt'; }
    else if (cold) { tag = 'KOUD'; cls += ' cold'; }
    else { tag = 'PERFECT'; cls += ' perfect'; }
    if (h.refs.tag.textContent !== tag) { h.refs.tag.textContent = tag; h.refs.tag.className = cls; }
  }

  // Klanten
  for (const c of G.customers) {
    if (!c) continue;
    const f = c.patience / c.max;
    c.refs.fill.style.width = (f * 100) + '%';
    c.refs.fill.style.background = f > 0.6 ? 'var(--green)' : f > 0.3 ? 'var(--yellow)' : 'var(--red)';
    const mood = c.state === 'leaving' ? (f > 0 ? '😋' : '😡') : f > 0.6 ? '😀' : f > 0.3 ? '😐' : '😠';
    if (c.refs.mood.textContent !== mood) c.refs.mood.textContent = mood;
  }
}

/* ---------- Selecteren & slepen ---------- */
function setSelected(payload) {
  G.selected = payload;
  refreshSelected();
}

function refreshSelected() {
  document.querySelectorAll('[data-drag].selected').forEach(n => n.classList.remove('selected'));
  const hint = $('#hint');
  if (!G.selected) { delete document.body.dataset.mode; hint.textContent = ''; return; }
  const src = document.querySelector(`[data-drag="${G.selected}"]`);
  if (!src) { G.selected = null; delete document.body.dataset.mode; hint.textContent = ''; return; }
  src.classList.add('selected');
  const [kind, val] = G.selected.split(':');
  document.body.dataset.mode = kind;
  hint.textContent = kind === 'stock'
    ? `${SNACKS[val].name} geselecteerd — klik op een mandje om toe te voegen (Esc = annuleren)`
    : 'Klik op het dienblad van een klant, of op de prullenbak (Esc = annuleren)';
}

function doDrop(payload, target) {
  const [kind, val] = payload.split(':');
  const [tk, ti] = target.split(':');
  if (kind === 'stock') {
    if (tk === 'basket') return addToBasket(+ti, val);
    if (tk !== 'holding') toast('Leg rauwe snacks eerst in een frituurmandje.', '');
    return false;
  }
  if (kind === 'item') {
    const item = G.holding.find(h => h.id === +val);
    if (!item) return false;
    if (tk === 'trash') { trashItem(item); return true; }
    if (tk === 'tray') return serve(+ti, item);
    if (tk === 'basket') toast('Deze snack is al gebakken.', '');
  }
  return false;
}

let P = null;
document.addEventListener('pointerdown', e => {
  if (e.button > 0 || !G.running || G.paused) return;
  const src = e.target.closest('[data-drag]');
  if (!src) return;
  e.preventDefault();
  Sound.init();
  P = { src, payload: src.dataset.drag, x: e.clientX, y: e.clientY, ghost: null, over: null };
});

document.addEventListener('pointermove', e => {
  if (!P) return;
  if (!P.ghost) {
    if (Math.hypot(e.clientX - P.x, e.clientY - P.y) < 6) return;
    const g = el('div', 'ghost', P.src.querySelector('.snack').outerHTML);
    g.style.setProperty('--c', P.src.style.getPropertyValue('--c'));
    g.style.setProperty('--d', P.src.style.getPropertyValue('--d'));
    document.body.appendChild(g);
    P.ghost = g;
    document.body.classList.add('dragging');
    document.body.dataset.mode = P.payload.split(':')[0];
  }
  P.ghost.style.left = e.clientX + 'px';
  P.ghost.style.top = e.clientY + 'px';
  const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]') || null;
  if (t !== P.over) {
    P.over?.classList.remove('over');
    P.over = t;
    t?.classList.add('over');
  }
});

function endPointer(e, cancelled) {
  if (!P) return;
  const p = P;
  P = null;
  if (p.ghost) {
    p.ghost.remove();
    p.over?.classList.remove('over');
    document.body.classList.remove('dragging');
    if (!cancelled && p.over) doDrop(p.payload, p.over.dataset.drop);
    // selectie/modus herstellen
    if (G.selected && !document.querySelector(`[data-drag="${G.selected}"]`)) G.selected = null;
    refreshSelected();
  } else if (!cancelled) {
    setSelected(G.selected === p.payload ? null : p.payload);
  }
}
document.addEventListener('pointerup', e => endPointer(e, false));
document.addEventListener('pointercancel', e => endPointer(e, true));

document.addEventListener('click', e => {
  const act = e.target.closest('[data-act]');
  if (act) { Sound.init(); handleAct(act.dataset.act); return; }
  if (!G.running || G.paused || e.target.closest('[data-drag]')) return;
  const tgt = e.target.closest('[data-drop]');
  if (tgt && G.selected) {
    const payload = G.selected;
    const ok = doDrop(payload, tgt.dataset.drop);
    // Voorraad blijft geselecteerd zodat je snel meerdere kunt toevoegen
    if (ok && payload.startsWith('item:')) setSelected(null);
  } else if (!tgt && G.selected && !e.target.closest('.panel')) {
    setSelected(null);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setSelected(null);
  if (e.key === 'p' || e.key === 'P') handleAct('pause');
  if (G.running && !G.paused && /^[1-5]$/.test(e.key)) {
    setSelected('stock:' + SNACK_ORDER[+e.key - 1]);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && G.running && !G.paused) pause(true);
});

/* ---------- Knoppen ---------- */
function handleAct(act) {
  const [name, arg] = act.split(':');
  switch (name) {
    case 'fry': return fryBasket(+arg);
    case 'lift': return liftBasket(+arg);
    case 'empty': return emptyBasket(+arg);
    case 'start': return newGame();
    case 'next': G.day++; return startDay();
    case 'restart': return newGame();
    case 'resume': return pause(false);
    case 'pause': if (G.running) pause(!G.paused); return;
    case 'mute':
      Sound.muted = !Sound.muted;
      $('#btn-mute').textContent = Sound.muted ? '🔇' : '🔊';
      Sound.setSizzle(Sound.muted ? 0 : G.baskets?.filter(b => b.state === 'frying').length || 0);
      return;
    case 'buy': return buy(arg);
  }
}

function pause(on) {
  G.paused = on;
  Sound.setSizzle(0);
  if (on) {
    showOverlay(`<div class="card"><h1>⏸ Pauze</h1><p class="lead">Even een frikandelletje tussendoor.</p>
      <button class="btn big" data-act="resume">▶ Verder spelen</button></div>`);
  } else {
    hideOverlay();
    last = performance.now();
  }
}

function buy(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!u || G.upg[id] || G.money < u.price) return;
  G.money -= u.price;
  G.upg[id] = true;
  Sound.cash();
  showDaySummary();
}

/* ---------- Overlays ---------- */
function showOverlay(html) {
  const o = $('#overlay');
  o.innerHTML = html;
  o.classList.add('show');
}
function hideOverlay() { $('#overlay').classList.remove('show'); }

function toast(text, kind) {
  const t = el('div', 'toast' + (kind ? ' ' + kind : ''), '');
  t.textContent = text;
  const box = $('#toasts');
  box.appendChild(t);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => t.remove(), 2700);
}

function bestLine() {
  const b = loadBest();
  return b ? `<p class="best">🏆 Record: dag ${b.day} gehaald met ${euro(b.money)} in de kassa</p>` : '';
}

function showStart() {
  showOverlay(`<div class="card">
    <h1>🍟 Frituur <span>Baas</span></h1>
    <p class="lead">Jij runt de drukste snackbar van het dorp. Bak alles precies goudbruin en help je klanten voordat hun geduld op is!</p>
    <div class="snackrow">${SNACK_ORDER.map(t => `<span data-paint="${t}">${snackSVG(t)}</span>`).join('')}</div>
    <ol>
      <li>Een klant komt binnen met een <b>denkwolkje</b> vol bestellingen.</li>
      <li><b>Sleep</b> snacks uit de vriezer naar een frituurmandje (of klik ze aan en klik op een mandje; toetsen <b>1–5</b> werken ook).</li>
      <li>Klik op <b>🔥 Start frituren</b>. Kijk hoe de snack van bleek naar goudbruin naar zwart kleurt.</li>
      <li>Haal het mandje eruit als de naald in de <b style="color:var(--green)">groene zone</b> staat.</li>
      <li>Sleep de snacks naar het <b>dienblad</b> van de klant voordat ze koud worden.</li>
    </ol>
    <p class="lead">Snel + perfect = flinke fooi. Rauw, verbrand of koud? Dan weigert de klant. Te lang wachten? Dan loopt de klant boos weg en daalt je reputatie. Reputatie op 0 = failliet!</p>
    <button class="btn big" data-act="start">Open de zaak! 🔑</button>
    ${bestLine()}
  </div>`);
  document.querySelectorAll('[data-paint]').forEach(n => paint(n, hexRgb(SNACKS[n.dataset.paint].gold)));
}

function endDay() {
  G.running = false;
  Sound.setSizzle(0);
  const leftovers = G.holding.length + G.baskets.reduce((a, b) => a + b.count, 0);
  G.stats.wasted += leftovers;
  saveBest();
  showDaySummary();
}

function showDaySummary() {
  const s = G.stats;
  const profit = s.revenue + s.tips - s.costs;
  const stars = G.rep > 85 ? '⭐⭐⭐' : G.rep > 55 ? '⭐⭐' : '⭐';
  const shop = UPGRADES.map(u => {
    const owned = !!G.upg[u.id];
    return `<div class="upg${owned ? ' owned' : ''}"><div class="ico">${u.icon}</div>
      <div><b>${u.name}</b><div class="d">${u.desc}</div></div>
      ${owned ? '<b>✔ Gekocht</b>' : `<button class="btn" data-act="buy:${u.id}" ${G.money < u.price ? 'disabled' : ''}>${euro(u.price)}</button>`}
    </div>`;
  }).join('');
  showOverlay(`<div class="card">
    <h1>Dag ${G.day} <span>zit erop!</span></h1>
    <p class="lead">${stars} Reputatie ${Math.round(G.rep)}/100 · Kassa ${euro(G.money)}</p>
    <div class="statgrid">
      <span>Klanten geholpen</span><span class="v">${s.served}</span>
      <span>Boos weggelopen</span><span class="v">${s.lost}</span>
      <span>Geweigerde snacks</span><span class="v">${s.refused}</span>
      <span>Perfect gebakken</span><span class="v">${s.perfect}</span>
      <span>Verbrand</span><span class="v">${s.burnt}</span>
      <span>Weggegooid / over</span><span class="v">${s.wasted}</span>
      <span>Omzet</span><span class="v">${euro(s.revenue)}</span>
      <span>Fooien</span><span class="v">${euro(s.tips)}</span>
      <span>Inkoop</span><span class="v">−${euro(s.costs)}</span>
      <span class="total">Winst vandaag</span><span class="v total">${euro(profit)}</span>
    </div>
    <h2 style="margin:0">🛒 Investeren in je zaak</h2>
    <div class="shop">${shop}</div>
    <button class="btn big" data-act="next">Start dag ${G.day + 1} ☀️</button>
    ${bestLine()}
  </div>`);
}

function gameOver() {
  G.running = false;
  Sound.setSizzle(0);
  saveBest();
  Sound.bad();
  showOverlay(`<div class="card">
    <h1>Failliet! <span>💸</span></h1>
    <p class="lead">Je reputatie is kapot — niemand wil nog een frikandel bij jou halen.</p>
    <div class="statgrid">
      <span>Dag bereikt</span><span class="v">${G.day}</span>
      <span>Klanten geholpen (totaal)</span><span class="v">${G.totalServed}</span>
      <span>Kassa</span><span class="v">${euro(G.money)}</span>
    </div>
    <button class="btn big" data-act="restart">Opnieuw beginnen 🔁</button>
    ${bestLine()}
  </div>`);
}

/* ---------- Start ---------- */
G.day = 1; G.money = 20; G.rep = 100; G.t = 0; G.open = true;
G.customers = [null, null, null]; G.holding = [];
G.baskets = [0, 1, 2].map(() => ({ type: null, count: 0, state: 'empty', t: 0, alerted: 0 }));
G.stats = {};
renderAll();
showStart();
requestAnimationFrame(loop);

// Voor tests/debuggen in de console
window.FrituurBaas = { G, SNACKS, doDrop, fryBasket, liftBasket, serve };
