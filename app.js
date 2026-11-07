'use strict';

const VERSION = '0.1';
const STORAGE_KEY = 'miturno.v1';

// ---------- Estado guardado en el teléfono ----------

// Primer arranque: el idioma del teléfono, si la app lo tiene
function detectLanguage() {
  const wanted = (navigator.languages || [navigator.language || '']).map((l) => String(l).slice(0, 2).toLowerCase());
  return wanted.find((l) => LANGUAGES.includes(l)) || FALLBACK_LANGUAGE;
}

function freshState() {
  return { lang: detectLanguage(), name: '', requests: [], damages: [], taken: [] };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Object.assign(freshState(), JSON.parse(raw)) : freshState();
  } catch (e) {
    return freshState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Sin almacenamiento (modo privado): la app sigue funcionando, pero no recuerda nada
  }
}

let state = loadState();
if (!LANGUAGES.includes(state.lang)) state.lang = FALLBACK_LANGUAGE;

// ---------- Textos ----------

function fill(s, vars) {
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

function t(key, vars) {
  const table = STRINGS[state.lang];
  const s = key in table ? table[key] : key in STRINGS[FALLBACK_LANGUAGE] ? STRINGS[FALLBACK_LANGUAGE][key] : key;
  return typeof s === 'string' ? fill(s, vars) : s;
}

// Plurales según las reglas de cada idioma: el polaco, el rumano o el árabe tienen más de dos formas
function tCount(key, n) {
  const forms = t(key);
  const form = forms[new Intl.PluralRules(locale()).select(n)] || forms.other;
  return fill(form, { n });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---------- Fechas y números ----------

let TODAY = atNoon(new Date());

function atNoon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function pad(n) { return String(n).padStart(2, '0'); }
function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function weekdayIndex(d) { return (d.getDay() + 6) % 7; } // 0 = lunes
function weekStart(d) { return addDays(d, -weekdayIndex(d)); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - yearStart) / 86400000 + 1) / 7);
}

function locale() { return t('meta.locale'); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtDayMonth(d) {
  return fill(t('format.dayMonth'), { dd: pad(d.getDate()), mm: pad(d.getMonth() + 1), d: d.getDate(), m: d.getMonth() + 1 });
}
function fmtLongDate(d) { return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long' }).format(d); }
function fmtMonthYearInline(d) { return new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(d); }
function fmtMonthYear(d) { return capitalize(fmtMonthYearInline(d)); }
function fmtEuro(v) { return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(v); }
function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }

function fmtMinutes(m) {
  const sign = m < 0 ? '−' : '';
  m = Math.abs(m);
  return sign + pad(Math.floor(m / 60)) + ':' + pad(m % 60);
}

function relDay(daysAgo) {
  if (daysAgo === 0) return t('common.today');
  if (daysAgo === 1) return t('common.yesterday');
  return fmtLongDate(addDays(TODAY, -daysAgo));
}

function dayLabel(d) { return t('format.dayLabel', { wd: t('days.short')[weekdayIndex(d)], date: fmtDayMonth(d) }); }

// Mantiene el orden de signos y números dentro de un texto en árabe
function ltr(s) { return `<span dir="ltr">${s}</span>`; }

// ---------- Cuadrante de ejemplo ----------

// Semana de vacaciones de ejemplo: seis semanas antes de la actual
const VACATION_WEEK_OFFSET = -6;

function planFor(d) {
  const wd = weekdayIndex(d);
  const weeksFromNow = Math.round(daysBetween(weekStart(TODAY), weekStart(d)) / 7);
  if (weeksFromNow === VACATION_WEEK_OFFSET && wd < 5) return { kind: 'vacation' };
  if (wd === 5) return { kind: 'free' };
  if (wd === 6) return isoWeek(d) % 2 === 0 ? SERVICES.s7702 : { kind: 'free' };
  if (wd === 2) return SERVICES.s1028mi;
  if (wd === 4) return SERVICES.s1032;
  return SERVICES.s1028;
}

// Horas retribuidas: duración del servicio menos una hora de pausa
function paidMinutes(p) { return toMin(p.end) - toMin(p.start) - 60; }

// ---------- Iconos ----------

const ICONS = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  swap: 'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z',
  doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  chat: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  board: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
  bus: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
  send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.11-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  left: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  camera: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
};

// Iconos con dirección: en árabe se ven en espejo
const MIRRORED_ICONS = ['back', 'left', 'right', 'send', 'logout'];

function icon(name) {
  const cls = MIRRORED_ICONS.includes(name) ? 'ic mirror' : 'ic';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

// ---------- Utilidades de pantalla ----------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}


// ---------- Cuadrante ----------

function dayCard(d, p) {
  const isToday = dayKey(d) === dayKey(TODAY);
  const cls = 'day-card' + (isToday ? ' is-today' : '');
  if (p.kind !== 'service') {
    const label = p.kind === 'vacation' ? t('roster.vacation') : t('roster.free');
    return `<article class="${cls}" id="day-${dayKey(d)}">
      <span class="badge ${p.kind}">${t('letter.' + p.kind)}</span>
      <div class="lines"><span class="when">${dayLabel(d)}</span><span class="what strong">${label}</span></div>
    </article>`;
  }
  return `<article class="${cls}" id="day-${dayKey(d)}">
    <span class="badge service">${t('letter.service')}</span>
    <div class="lines">
      <span class="when">${dayLabel(d)}</span><span class="what strong">${t('roster.service', { n: p.id })}</span>
      <span class="when"></span><span class="what">${esc(t('route.' + p.route))}</span>
      <span class="when">${p.start}</span><span class="what">${esc(t('place.' + p.from))}</span>
      <span class="when">${p.end}</span><span class="what">${esc(t('place.' + p.to))}</span>
    </div>
  </article>`;
}

function renderRoster() {
  let html = '';
  let lastWeek = null;
  for (let i = 0; i < 35; i++) {
    const d = addDays(TODAY, i);
    const w = isoWeek(d);
    if (w !== lastWeek) {
      html += `<div class="week-chip">${t('roster.week', { n: w })}</div>`;
      lastWeek = w;
    }
    html += dayCard(d, planFor(d));
  }
  return `<div class="stack">${html}</div>`;
}

// ---------- Calendario ----------

let calOffset = 0;
let calSelected = null;

function renderCalendar() {
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth() + calOffset, 1, 12);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const start = addDays(first, -weekdayIndex(first));
  const end = addDays(last, 6 - weekdayIndex(last));
  const selected = calSelected || dayKey(TODAY);

  let cells = '';
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const key = dayKey(d);
    const p = planFor(d);
    const cls = ['cal-day'];
    if (d.getMonth() !== first.getMonth()) cls.push('out');
    if (key === dayKey(TODAY)) cls.push('today');
    if (key === selected) cls.push('selected');
    const kindName = p.kind === 'service' ? t('calendar.service') : t('roster.' + p.kind);
    cells += `<button type="button" class="${cls.join(' ')}" data-day="${key}" aria-label="${fmtLongDate(d)}, ${kindName}" aria-pressed="${key === selected}">
      <span class="num">${d.getDate()}</span><span class="bar ${p.kind}"></span>
    </button>`;
  }

  const head = t('days.head').map((n) => `<span>${n}</span>`).join('');
  const sel = fromKey(selected);

  return `<div class="cal">
    <div class="cal-top">
      <button type="button" class="icon-btn" id="cal-prev" aria-label="${t('calendar.prev')}">${icon('left')}</button>
      <h2 class="cal-month">${fmtMonthYear(first)}</h2>
      <button type="button" class="icon-btn" id="cal-next" aria-label="${t('calendar.next')}">${icon('right')}</button>
    </div>
    <div class="cal-head">${head}</div>
    <div class="cal-grid">${cells}</div>
    <div class="legend">
      <span><i class="bar service"></i>${t('calendar.service')}</span>
      <span><i class="bar free"></i>${t('roster.free')}</span>
      <span><i class="bar vacation"></i>${t('roster.vacation')}</span>
    </div>
  </div>
  <div class="stack cal-detail">${dayCard(sel, planFor(sel))}</div>`;
}

function bindCalendar() {
  $('#cal-prev').addEventListener('click', () => { calOffset--; renderView(); });
  $('#cal-next').addEventListener('click', () => { calOffset++; renderView(); });
  $$('.cal-day').forEach((b) => b.addEventListener('click', () => {
    calSelected = b.dataset.day;
    renderView();
  }));
}

// ---------- Ausencias ----------

function renderAbsence() {
  const types = ['vacation', 'free', 'comp'].map((k) => `<option value="${k}">${t('absence.type.' + k)}</option>`).join('');
  const mine = state.requests.slice().reverse().map((r) => {
    const s = fromKey(r.start);
    const e = fromKey(r.end);
    const n = daysBetween(s, e) + 1;
    const range = r.start === r.end ? fmtDayMonth(s) : `${fmtDayMonth(s)} – ${fmtDayMonth(e)}`;
    return `<li class="item">
      <div class="item-main">
        <span class="item-title">${t('absence.type.' + r.type)}</span>
        <span class="item-sub">${range} · ${tCount('absence.days', n)}</span>
        ${r.note ? `<span class="item-note">${esc(r.note)}</span>` : ''}
      </div>
      <span class="status">${t('absence.pending')}</span>
    </li>`;
  }).join('');

  return `<form class="card form" id="absence-form" novalidate>
      <h2 class="card-title">${t('absence.form')}</h2>
      <label class="field"><span>${t('absence.type')}</span>
        <select id="abs-type">${types}</select>
      </label>
      <div class="field-row">
        <label class="field"><span>${t('absence.start')}</span><input type="date" id="abs-start"></label>
        <label class="field"><span>${t('absence.end')}</span><input type="date" id="abs-end"></label>
      </div>
      <label class="field"><span>${t('absence.note')}</span>
        <textarea id="abs-note" rows="3" placeholder="${t('absence.notePh')}"></textarea>
      </label>
      <p class="form-error" id="abs-error" role="alert" hidden></p>
      <button class="btn primary" type="submit">${icon('send')}<span>${t('absence.send')}</span></button>
    </form>
    <section class="section">
      <h2 class="section-title">${t('absence.mine')}</h2>
      ${mine ? `<ul class="list">${mine}</ul>` : `<p class="empty">${t('absence.none')}</p>`}
    </section>`;
}

function bindAbsence() {
  const start = $('#abs-start');
  const end = $('#abs-end');
  const err = $('#abs-error');
  start.min = dayKey(TODAY);
  end.min = dayKey(TODAY);
  start.addEventListener('change', () => {
    end.min = start.value || dayKey(TODAY);
    if (!end.value || end.value < start.value) end.value = start.value;
  });
  $('#absence-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    err.hidden = true;
    if (!start.value || !end.value) { err.textContent = t('absence.errMissing'); err.hidden = false; return; }
    if (end.value < start.value) { err.textContent = t('absence.errOrder'); err.hidden = false; return; }
    state.requests.push({
      id: Date.now(),
      type: $('#abs-type').value,
      start: start.value,
      end: end.value,
      note: $('#abs-note').value.trim(),
    });
    saveState();
    toast(t('absence.sent'));
    renderView();
  });
}

// ---------- Bolsa de servicios ----------

function renderExchange() {
  const cards = OFFERS.map((o) => {
    const d = addDays(TODAY, o.inDays);
    const taken = state.taken.includes(o.id);
    return `<li class="item offer">
      <div class="item-main">
        <span class="item-title">${dayLabel(d)} · ${t('roster.service', { n: o.service })}</span>
        <span class="item-sub tabular">${o.start} – ${o.end}</span>
        <span class="item-note">${t('exchange.offeredBy', { name: esc(o.from) })}</span>
      </div>
      <button type="button" class="btn small ${taken ? 'done' : 'primary'}" data-offer="${o.id}" aria-pressed="${taken}">
        ${taken ? icon('check') : ''}<span>${taken ? t('exchange.taken') : t('exchange.take')}</span>
      </button>
    </li>`;
  }).join('');
  return `<p class="intro">${t('exchange.intro')}</p><ul class="list">${cards}</ul>`;
}

function bindExchange() {
  $$('[data-offer]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.offer;
    if (state.taken.includes(id)) {
      state.taken = state.taken.filter((x) => x !== id);
      toast(t('exchange.cancelToast'));
    } else {
      state.taken.push(id);
      toast(t('exchange.takenToast'));
    }
    saveState();
    renderView();
  }));
}

// ---------- Partes de actividad ----------

function renderReports() {
  const items = [1, 2, 3].map((i) => {
    const m = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1, 12);
    const key = m.getFullYear() + '-' + pad(m.getMonth() + 1);
    return `<li><a class="item link" href="#parte-${key}">
      ${icon('doc')}
      <span class="item-main"><span class="item-title">${t('reports.item', { month: fmtMonthYearInline(m) })}</span></span>
      ${icon('right')}
    </a></li>`;
  }).join('');
  return `<p class="intro">${t('reports.intro')}</p><ul class="list">${items}</ul>`;
}

function monthReport(year, month) {
  const rows = [];
  const sum = { paid: 0, diets: 0, sunday: 0, target: 0, vacationDays: 0 };
  for (let d = new Date(year, month, 1, 12); d.getMonth() === month; d = addDays(d, 1)) {
    const p = planFor(d);
    const wd = weekdayIndex(d);
    const row = { d, kind: p.kind, duty: '', time: '', paid: 0, diet: 0, sunday: 0 };
    if (wd < 5) sum.target += 8 * 60;
    if (p.kind === 'service') {
      row.duty = p.id;
      row.time = `${p.start}–${p.end}`;
      row.paid = paidMinutes(p);
      row.diet = DIET_PER_SERVICE;
      if (wd === 6) row.sunday = row.paid;
    } else if (p.kind === 'vacation') {
      row.duty = t('roster.vacation');
      row.paid = 8 * 60;
      sum.vacationDays++;
    } else {
      row.duty = t('roster.free');
    }
    sum.paid += row.paid;
    sum.diets += row.diet;
    sum.sunday += row.sunday;
    rows.push(row);
  }
  return { rows, sum };
}

function parseMonthParam(param) {
  const m = /^(\d{4})-(\d{2})$/.exec(param || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1, 12) : new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1, 12);
}

function renderReport(param) {
  const m = parseMonthParam(param);
  const { rows, sum } = monthReport(m.getFullYear(), m.getMonth());
  const body = rows.map((r) => `<tr class="${r.kind}">
      <td class="day-cell">${dayLabel(r.d)}</td>
      <td class="duty">${esc(r.duty)}${r.time ? `<span class="duty-time">${r.time}</span>` : ''}</td>
      <td class="num">${r.paid ? fmtMinutes(r.paid) : ''}</td>
      <td class="num">${r.diet ? fmtEuro(r.diet) : ''}</td>
    </tr>`).join('');
  const diff = sum.paid - sum.target;

  return `<article class="card report">
    <p class="report-center">${t('report.center')}</p>
    <h2 class="card-title left">${t('reports.item', { month: fmtMonthYearInline(m) })}</h2>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>${t('report.col.day')}</th><th>${t('report.col.duty')}</th>
          <th class="num">${t('report.col.paid')}</th><th class="num">${t('report.col.diet')}</th>
        </tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr>
          <th colspan="2">${t('report.total')}</th>
          <th class="num">${fmtMinutes(sum.paid)}</th><th class="num">${fmtEuro(sum.diets)}</th>
        </tr></tfoot>
      </table>
    </div>
    <h3 class="section-title">${t('report.summary')}</h3>
    <dl class="summary">
      <dt>${t('report.target')}</dt><dd>${fmtMinutes(sum.target)}</dd>
      <dt>${t('report.paid')}</dt><dd>${fmtMinutes(sum.paid)}</dd>
      <dt class="strong">${t('report.diff')}</dt><dd class="strong">${ltr((diff > 0 ? '+' : '') + fmtMinutes(diff))}</dd>
      <dt>${t('report.sunday')}</dt><dd>${fmtMinutes(sum.sunday)}</dd>
      <dt>${t('report.diets')}</dt><dd>${fmtEuro(sum.diets)}</dd>
      <dt>${t('report.vacationDays')}</dt><dd>${sum.vacationDays}</dd>
    </dl>
    <p class="fine">${t('report.note')}</p>
  </article>`;
}

// ---------- Parte de daños ----------

let damageVehicle = null;
let damageQuery = '';
let damagePhotoUrl = null;

function vehicleList() {
  const q = damageQuery.replace(/\s|-/g, '').toLowerCase();
  const found = VEHICLES.filter((v) => v.plate.replace(/\s|-/g, '').toLowerCase().includes(q));
  if (!found.length) return `<p class="empty">${t('damage.noResults', { q: esc(damageQuery) })}</p>`;
  return `<ul class="list">${found.map((v) => `<li><button type="button" class="item link" data-vehicle="${v.fleet}">
      ${icon('bus')}
      <span class="item-main"><span class="item-title plate">${v.plate}</span><span class="item-sub">${t('damage.fleet', { n: v.fleet })}</span></span>
      ${icon('right')}
    </button></li>`).join('')}</ul>`;
}

function bindVehicleButtons() {
  $$('[data-vehicle]').forEach((b) => b.addEventListener('click', () => {
    damageVehicle = VEHICLES.find((v) => v.fleet === b.dataset.vehicle);
    renderView(true);
  }));
}

function renderDamage() {
  const sent = state.damages.slice().reverse().map((r) => `<li class="item">
      <div class="item-main">
        <span class="item-title plate">${esc(r.plate)}</span>
        <span class="item-sub">${t('damage.zone.' + r.zone)}${r.photo ? ' · ' + t('damage.withPhoto') : ''}</span>
        <span class="item-note">${esc(r.desc)}</span>
      </div>
      <span class="status">${t('absence.pending')}</span>
    </li>`).join('');
  const sentBlock = sent ? `<section class="section"><h2 class="section-title">${t('damage.mine')}</h2><ul class="list">${sent}</ul></section>` : '';

  if (!damageVehicle) {
    return `<h2 class="section-title">${t('damage.pick')}</h2>
      <label class="search-field">${icon('search')}
        <input type="search" id="veh-q" placeholder="${t('damage.search')}" value="${esc(damageQuery)}" autocomplete="off" aria-label="${t('damage.search')}">
      </label>
      <div id="veh-list">${vehicleList()}</div>
      ${sentBlock}`;
  }

  const zones = ['front', 'rear', 'right', 'left', 'inside'].map((z) => `<label class="chip">
      <input type="radio" name="zone" value="${z}"><span>${t('damage.zone.' + z)}</span>
    </label>`).join('');

  return `<form class="card form" id="damage-form" novalidate>
      <div class="vehicle-row">
        ${icon('bus')}
        <span class="item-main"><span class="item-title plate">${damageVehicle.plate}</span><span class="item-sub">${t('damage.fleet', { n: damageVehicle.fleet })}</span></span>
        <button type="button" class="btn small ghost" id="veh-change">${t('damage.change')}</button>
      </div>
      <fieldset class="field">
        <legend>${t('damage.zone')}</legend>
        <div class="chips">${zones}</div>
      </fieldset>
      <label class="field"><span>${t('damage.desc')}</span>
        <textarea id="dmg-desc" rows="3" placeholder="${t('damage.descPh')}"></textarea>
      </label>
      <label class="photo-btn">
        <input type="file" id="dmg-photo" accept="image/*">
        ${icon('camera')}<span id="dmg-photo-label">${t('damage.photo')}</span>
      </label>
      <img id="dmg-preview" class="preview" alt="" hidden>
      <p class="form-error" id="dmg-error" role="alert" hidden></p>
      <button class="btn primary" type="submit">${icon('send')}<span>${t('damage.send')}</span></button>
    </form>
    ${sentBlock}`;
}

function bindDamage() {
  if (!damageVehicle) {
    const q = $('#veh-q');
    q.addEventListener('input', () => {
      damageQuery = q.value;
      $('#veh-list').innerHTML = vehicleList();
      bindVehicleButtons();
    });
    bindVehicleButtons();
    return;
  }

  $('#veh-change').addEventListener('click', () => { damageVehicle = null; renderView(true); });

  const photo = $('#dmg-photo');
  photo.addEventListener('change', () => {
    if (damagePhotoUrl) URL.revokeObjectURL(damagePhotoUrl);
    damagePhotoUrl = photo.files[0] ? URL.createObjectURL(photo.files[0]) : null;
    const img = $('#dmg-preview');
    img.hidden = !damagePhotoUrl;
    if (damagePhotoUrl) img.src = damagePhotoUrl;
    $('#dmg-photo-label').textContent = damagePhotoUrl ? t('damage.photoChange') : t('damage.photo');
  });

  $('#damage-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const err = $('#dmg-error');
    const zone = $('input[name="zone"]:checked');
    const desc = $('#dmg-desc').value.trim();
    err.hidden = true;
    if (!zone) { err.textContent = t('damage.errZone'); err.hidden = false; return; }
    if (!desc) { err.textContent = t('damage.errDesc'); err.hidden = false; return; }
    // La foto no se guarda en el prototipo: solo se apunta que el parte la lleva
    state.damages.push({ id: Date.now(), plate: damageVehicle.plate, zone: zone.value, desc, photo: !!damagePhotoUrl });
    saveState();
    if (damagePhotoUrl) URL.revokeObjectURL(damagePhotoUrl);
    damagePhotoUrl = null;
    damageVehicle = null;
    damageQuery = '';
    toast(t('damage.sent'));
    renderView(true);
  });
}

// ---------- Mensajes y tablón ----------

function renderMessages() {
  return `<ul class="list">${MESSAGES.map((m) => `<li><details class="item msg">
      <summary>
        <span class="item-main">
          <span class="item-sub">${esc(t('msg.' + m.id + '.from'))} · ${relDay(m.daysAgo)}</span>
          <span class="item-title">${esc(t('msg.' + m.id + '.title'))}</span>
        </span>
      </summary>
      <p>${esc(t('msg.' + m.id + '.body'))}</p>
    </details></li>`).join('')}</ul>`;
}

function renderBoard() {
  return `<ul class="list">${BOARD.map((b) => `<li class="item post">
      <span class="item-sub">${relDay(b.daysAgo)}</span>
      <span class="item-title">${esc(t('post.' + b.id + '.title'))}</span>
      <p>${esc(t('post.' + b.id + '.body'))}</p>
    </li>`).join('')}</ul>`;
}

// ---------- Ajustes y ayuda ----------

let resetArmed = false;

function renderSettings() {
  // Cada idioma aparece con su propio nombre y escritura, para que cualquiera encuentre el suyo
  const langs = LANGUAGES.map((k) => `<button type="button" class="lang-btn" data-lang="${k}" lang="${k}" dir="${STRINGS[k]['meta.dir']}" aria-pressed="${state.lang === k}">${STRINGS[k]['meta.name']}</button>`).join('');
  return `<section class="card form">
      <div class="field"><span id="lang-label">${t('settings.language')}</span>
        <div class="lang-grid" role="group" aria-labelledby="lang-label">${langs}</div>
      </div>
      <label class="field"><span>${t('settings.name')}</span>
        <input type="text" id="set-name" value="${esc(state.name)}" placeholder="${t('settings.namePh')}" autocomplete="given-name">
      </label>
    </section>
    <section class="section">
      <h2 class="section-title">${t('settings.data')}</h2>
      <p class="intro">${t('settings.dataInfo')}</p>
      <button type="button" class="btn danger" id="set-reset">${resetArmed ? t('settings.resetConfirm') : t('settings.reset')}</button>
    </section>`;
}

function bindSettings() {
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    saveState();
    render();
  }));
  $('#set-name').addEventListener('input', (ev) => {
    state.name = ev.target.value;
    saveState();
  });
  $('#set-reset').addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      renderView(true);
      return;
    }
    resetArmed = false;
    state = Object.assign(freshState(), { lang: state.lang });
    saveState();
    toast(t('settings.resetDone'));
    renderView(true);
  });
}

function renderHelp() {
  const steps = t('help.install').map((s) => `<li>${s}</li>`).join('');
  const sections = [
    ['nav.roster', 'help.text.roster'],
    ['menu.absence', 'help.text.absence'],
    ['menu.exchange', 'help.text.exchange'],
    ['menu.reports', 'help.text.reports'],
    ['menu.damage', 'help.text.damage'],
  ].map(([title, text]) => `<dt>${t(title)}</dt><dd>${t(text)}</dd>`).join('');
  return `<section class="card prose">
      <h2 class="section-title">${t('help.installTitle')}</h2>
      <ol>${steps}</ol>
    </section>
    <section class="card prose">
      <h2 class="section-title">${t('help.sectionsTitle')}</h2>
      <dl class="defs">${sections}</dl>
    </section>
    <section class="card prose">
      <h2 class="section-title">${t('help.aboutTitle')}</h2>
      <p>${t('help.about')}</p>
    </section>`;
}

// ---------- Navegación ----------

const ROUTES = {
  cuadrante: { title: () => t('nav.roster'), tab: true, actions: ['calendar', 'refresh'], view: renderRoster },
  mensajes: { title: () => t('nav.messages'), tab: true, view: renderMessages },
  tablon: { title: () => t('board.title'), tab: true, view: renderBoard },
  calendario: { title: () => t('action.calendar'), parent: 'cuadrante', view: renderCalendar, bind: bindCalendar },
  ausencias: { title: () => t('absence.title'), view: renderAbsence, bind: bindAbsence },
  bolsa: { title: () => t('menu.exchange'), view: renderExchange, bind: bindExchange },
  partes: { title: () => t('menu.reports'), view: renderReports },
  parte: { title: () => t('menu.reports'), parent: 'partes', view: renderReport },
  danos: { title: () => t('menu.damage'), view: renderDamage, bind: bindDamage },
  ajustes: { title: () => t('menu.settings'), view: renderSettings, bind: bindSettings },
  ayuda: { title: () => t('menu.help'), view: renderHelp },
};

const TABS = [
  ['cuadrante', 'person', 'nav.roster'],
  ['mensajes', 'chat', 'nav.messages'],
  ['tablon', 'board', 'nav.board'],
];

const MENU = [
  ['cuadrante', 'home', 'nav.roster'],
  ['ausencias', 'clock', 'menu.absence'],
  ['bolsa', 'swap', 'menu.exchange'],
  ['partes', 'doc', 'menu.reports'],
  ['danos', 'warning', 'menu.damage'],
  ['ajustes', 'settings', 'menu.settings'],
  ['ayuda', 'help', 'menu.help'],
];

function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const i = h.indexOf('-');
  const name = i === -1 ? h : h.slice(0, i);
  const param = i === -1 ? '' : h.slice(i + 1);
  return ROUTES[name] ? { name, param } : { name: 'cuadrante', param: '' };
}

let currentRoute = null;

function renderView(keepScroll) {
  TODAY = atNoon(new Date());
  const { name, param } = parseHash();
  const route = ROUTES[name];
  const view = $('#view');
  view.innerHTML = route.view(param);
  if (route.bind) route.bind(param);
  if (!keepScroll && name !== currentRoute) window.scrollTo(0, 0);
  currentRoute = name;
}

function renderChrome() {
  const { name, param } = parseHash();
  const route = ROUTES[name];
  document.documentElement.lang = state.lang;
  document.documentElement.dir = t('meta.dir');
  document.title = 'MiTurno · ' + route.title(param);
  $('#title').textContent = route.title(param);

  const navBtn = $('#nav-btn');
  if (route.tab) {
    navBtn.innerHTML = icon('menu');
    navBtn.setAttribute('aria-label', t('action.menu'));
    navBtn.onclick = openDrawer;
  } else {
    navBtn.innerHTML = icon('back');
    navBtn.setAttribute('aria-label', t('action.back'));
    navBtn.onclick = () => { location.hash = '#' + (route.parent || 'cuadrante'); };
  }

  const actions = route.actions || [];
  $('#actions').innerHTML = actions.map((a) => `<button type="button" class="icon-btn" data-action="${a}" aria-label="${t('action.' + a)}">${icon(a)}</button>`).join('');
  $$('#actions [data-action]').forEach((b) => b.addEventListener('click', () => runAction(b.dataset.action, b)));

  const tabs = $('#tabs');
  document.body.classList.toggle('has-tabs', !!route.tab);
  tabs.hidden = !route.tab;
  tabs.innerHTML = TABS.map(([r, ic, key]) => `<a href="#${r}" class="tab${r === name ? ' active' : ''}"${r === name ? ' aria-current="page"' : ''}>
      <span class="tab-icon">${icon(ic)}</span><span class="tab-label">${t(key)}</span>
    </a>`).join('');

  renderDrawer(route.parent || name);
}

function render() {
  resetArmed = false;
  closeDrawer();
  renderChrome();
  renderView();
}

function runAction(action, btn) {
  if (action === 'calendar') {
    calOffset = 0;
    calSelected = null;
    location.hash = '#calendario';
  } else if (action === 'refresh') {
    btn.classList.add('spin');
    setTimeout(() => {
      btn.classList.remove('spin');
      renderView(true);
      toast(t('roster.updated'));
    }, 600);
  }
}

// ---------- Menú lateral ----------

function renderDrawer(active) {
  const hello = state.name.trim() ? t('menu.hello', { name: esc(state.name.trim()) }) : t('menu.helloAnon');
  const items = MENU.map(([r, ic, key]) => `<a href="#${r}" class="drawer-item${r === active ? ' active' : ''}">${icon(ic)}<span>${t(key)}</span></a>`).join('');
  $('#drawer').innerHTML = `<div class="brand">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">MiTurno</span>
      <span class="brand-badge">${t('app.badge')}</span>
    </div>
    <p class="hello">${hello}</p>
    <nav class="drawer-nav">${items}</nav>
    <button type="button" class="drawer-item" id="logout">${icon('logout')}<span>${t('menu.logout')}</span></button>
    <p class="drawer-foot">${t('menu.footer', { v: VERSION })}</p>`;
  $$('#drawer .drawer-item').forEach((a) => a.addEventListener('click', closeDrawer));
  $('#logout').addEventListener('click', () => toast(t('logout.toast')));
}

function openDrawer() {
  document.body.classList.add('drawer-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#drawer').removeAttribute('inert');
  const first = $('#drawer .drawer-item');
  if (first) first.focus();
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#drawer').setAttribute('inert', '');
}

$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeDrawer(); });
window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => {
  // Si la app se queda abierta de un día para otro, el cuadrante empieza en el día correcto
  if (!document.hidden && dayKey(atNoon(new Date())) !== dayKey(TODAY)) render();
});

render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
