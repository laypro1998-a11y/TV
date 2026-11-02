/* Болталка — общие помощники: хранилище, текст, время, иконки, звуки. */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});

  /* ---------- localStorage (может быть недоступен — тогда просто не сохраняем) ---------- */
  const PREFIX = 'boltalka.';
  BT.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (e) {
        /* переполнено или запрещено — не страшно */
      }
    },
    del(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (e) {}
    },
  };

  /* ---------- случайные идентификаторы ---------- */
  BT.uid = function () {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  };

  const CODE_ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
  BT.roomCode = function () {
    const b = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(b, (x) => CODE_ABC[x % CODE_ABC.length]).join('');
  };
  BT.CODE_RE = /^[a-z0-9]{6,32}$/;

  /* ---------- цвета аватарок ---------- */
  BT.COLORS = ['#7c6cff', '#2dd4a7', '#ff8a5b', '#f472b6', '#38bdf8', '#facc15', '#a3e635', '#fb7185'];
  BT.isColor = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  BT.colorFor = function (seed) {
    let h = 0;
    for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return BT.COLORS[h % BT.COLORS.length];
  };
  BT.initials = function (name) {
    const parts = String(name || '?').trim().split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w));
    const first = Array.from(parts[0] || '?')[0] || '?';
    const second = parts[1] ? Array.from(parts[1])[0] : '';
    return (first + second).toUpperCase();
  };

  /* ---------- текст ---------- */
  BT.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  };

  const URL_RE = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,:;!?)\]}»]/gi;
  BT.linkify = function (text) {
    let out = '';
    let last = 0;
    String(text).replace(URL_RE, (url, idx) => {
      out += BT.esc(text.slice(last, idx));
      out += `<a href="${BT.esc(url)}" target="_blank" rel="noopener noreferrer">${BT.esc(url)}</a>`;
      last = idx + url.length;
      return url;
    });
    return out + BT.esc(String(text).slice(last));
  };

  // «Только эмодзи» (до 6 штук) — показываем крупно, как в Discord.
  const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|\s)+$/u;
  BT.isEmojiOnly = function (text) {
    if (!text || text.length > 40 || !EMOJI_ONLY.test(text)) return false;
    const n = (text.match(/\p{Extended_Pictographic}|\p{Regional_Indicator}{2}/gu) || []).length;
    return n > 0 && n <= 6;
  };

  /* ---------- время ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  BT.time = (ts) => {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const dayStart = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  BT.sameDay = (a, b) => dayStart(a) === dayStart(b);
  BT.dayLabel = function (ts) {
    const today = dayStart(Date.now());
    const day = dayStart(ts);
    if (day === today) return 'Сегодня';
    if (today - day <= 86400000 + 3600000 && today - day >= 86400000 - 3600000) return 'Вчера';
    const d = new Date(ts);
    const opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('ru-RU', opts);
  };
  BT.stamp = function (ts) {
    if (BT.sameDay(ts, Date.now())) return 'сегодня в ' + BT.time(ts);
    const label = BT.dayLabel(ts);
    return (label === 'Вчера' ? 'вчера' : label) + ' в ' + BT.time(ts);
  };
  function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  BT.plural = plural;
  BT.ago = function (ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'только что';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} ${plural(m, 'минуту', 'минуты', 'минут')} назад`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} ${plural(h, 'час', 'часа', 'часов')} назад`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d} ${plural(d, 'день', 'дня', 'дней')} назад`;
    return BT.dayLabel(ts);
  };

  /* ---------- иконки (24×24, линии) ---------- */
  const P = {
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
    micOff: '<path d="M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5 11a7 7 0 0 0 11.4 5.4M19 11a7 7 0 0 1-.5 2.6M12 18v3M8.5 21h7M3 3l18 18"/>',
    headphones: '<path d="M3.5 15v-3a8.5 8.5 0 0 1 17 0v3"/><rect x="3" y="14" width="5" height="7" rx="1.6"/><rect x="16" y="14" width="5" height="7" rx="1.6"/>',
    headphonesOff: '<path d="M3.5 15v-3a8.4 8.4 0 0 1 2.1-5.6M8.5 4.2A8.5 8.5 0 0 1 20.5 12v3"/><rect x="3" y="14" width="5" height="7" rx="1.6"/><path d="M16 16v3.4c0 .9.7 1.6 1.6 1.6h1.8M3 3l18 18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    hangup: '<path d="M2.7 14.6c5-4.7 13.6-4.7 18.6 0 .5.5.5 1.2 0 1.7l-1.9 1.8c-.4.4-1 .4-1.5.1l-2.4-1.6a1 1 0 0 1-.4-.9l.2-2.3a11 11 0 0 0-6.6 0l.2 2.3a1 1 0 0 1-.4.9l-2.4 1.6c-.5.3-1.1.3-1.5-.1l-1.9-1.8c-.5-.5-.5-1.2 0-1.7z"/>',
    camera: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.2 21 7v10l-5.5-3.2z"/>',
    cameraOff: '<path d="M8 6h5a2.5 2.5 0 0 1 2.5 2.5v2.7L21 7v10M15.5 15.5V16a2 2 0 0 1-2 2H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 6M3 3l18 18"/>',
    screen: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4M9 11.5l3-3 3 3M12 8.5v5"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    speaker: '<path d="M11 5 6.5 9H3v6h3.5l4.5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.3-3.3a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.3 3.3a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="M4 12 20 4l-4 16-4-6.5z"/><path d="m12 13.5 8-9.5"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/>',
    door: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8M10 12h11M17 8l4 4-4 4"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    volume: '<path d="M11 5 6.5 9H3v6h3.5l4.5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    signal: '<path d="M5 18v-3M10 18v-6M15 18V9M20 18V5"/>',
    phone: '<path d="M5.2 3.5h3.3l1.7 4.3-2.2 1.5a11.5 11.5 0 0 0 6.7 6.7l1.5-2.2 4.3 1.7v3.3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.2 5.7a2 2 0 0 1 2-2.2z"/>',
    userPlus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    chat: '<path d="M5 4.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16.5 6.5l3 3M14 9l2 2"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  BT.icon = function (name, cls) {
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  };

  /* ---------- звук ---------- */
  let actx = null;
  BT.audioCtx = function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  };
  const SOUNDS = {
    join: [[523.25, 0], [783.99, 0.1]],
    leave: [[659.25, 0], [392.0, 0.1]],
    message: [[987.77, 0, 0.09, 0.05], [1318.5, 0.07, 0.12, 0.05]],
    online: [[659.25, 0, 0.1, 0.05], [880, 0.08, 0.14, 0.05]],
    mute: [[440, 0, 0.07]],
    unmute: [[660, 0, 0.07]],
    ring: [[784, 0, 0.16, 0.09], [988, 0.18, 0.16, 0.09], [784, 0.42, 0.16, 0.09], [988, 0.6, 0.16, 0.09]],
    ringback: [[425, 0, 1.0, 0.035]],
  };
  BT.soundsOn = true;
  BT.sound = function (name, force) {
    if (!BT.soundsOn && !force) return;
    const ctx = actx; // не создаём контекст без жеста пользователя
    if (!ctx || ctx.state !== 'running' || !SOUNDS[name]) return;
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, at, dur = 0.14, vol = 0.07] of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t0 + at);
      g.gain.linearRampToValueAtTime(vol, t0 + at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.02);
    }
  };

  BT.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
})();
