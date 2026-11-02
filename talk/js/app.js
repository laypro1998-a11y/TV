/* Болталка — интерфейс. */
(function () {
  'use strict';

  const BT = window.BT;
  const { store, esc, icon, ident } = BT;
  const $ = (id) => document.getElementById(id);
  const app = $('app');

  const S = {
    profile: store.get('profile', null),
    rooms: store.get('rooms', []), // групповые комнаты
    friends: store.get('friends', []),
    requests: store.get('requests', []),
    declined: store.get('declined', []),
    dmUnread: store.get('dmUnread', {}),
    active: store.get('active', null),
    prefs: Object.assign({ sounds: true, micId: '', muted: false, deaf: false, vol: {}, membersHidden: false }, store.get('prefs', {})),
    room: null, // открытая комната (группа или личный чат)
    dm: new Map(), // код друга → комната личного чата (работают всегда, в фоне)
    hub: null,
    home: true,
    view: 'chat',
    unread: 0,
    inVoice: false,
    joining: false,
    mic: null,
    video: null,
    videoKind: null,
    call: null, // исходящий звонок
    incoming: null, // входящий звонок
    declinedCalls: new Set(),
  };
  if (!S.prefs.vol || typeof S.prefs.vol !== 'object') S.prefs.vol = {};
  if (!S.dmUnread || typeof S.dmUnread !== 'object') S.dmUnread = {};
  S.rooms.forEach((r) => {
    if (r.server && !/^wss?:\/\//i.test(r.server)) r.server = ''; // адреса старого PeerJS
  });
  BT.soundsOn = !!S.prefs.sounds;

  const savePrefs = () => store.set('prefs', S.prefs);
  const saveRooms = () => store.set('rooms', S.rooms);
  const saveFriends = () => store.set('friends', S.friends);
  const saveRequests = () => store.set('requests', S.requests);
  const saveDmUnread = () => store.set('dmUnread', S.dmUnread);
  const me = () => ({ uid: S.profile.uid, name: S.profile.name, color: S.profile.color });
  const members = () => (S.room ? S.room.members() : []);
  const safeColor = (c) => (BT.isColor(c) ? c : '#7c6cff');
  const isNarrow = () => window.matchMedia('(max-width: 760px)').matches;
  const fmtCode = (c) => ident.fmtCode(c);

  function recOf(code) {
    const g = S.rooms.find((r) => r.code === code);
    if (g) return g;
    const f = S.friends.find((x) => x.dm === code);
    return f ? { code, name: f.name, server: '', dm: f.code } : null;
  }
  const roomRec = () => (S.room ? recOf(S.room.code) : null);
  const friendByCode = (code) => S.friends.find((f) => f.code === code) || null;
  const friendOfRoom = (room) => (room && room.dm ? friendByCode(room.dm) : null);
  const curFriend = () => (S.home ? null : friendOfRoom(S.room));
  const friendLink = (f) => {
    const r = f && S.dm.get(f.code);
    return r ? r.members()[0] || null : null;
  };
  const friendOnline = (f) => !!friendLink(f);

  /* =====================================================================
   * Тосты, модалки, всплывашки
   * ===================================================================== */
  function toast(text, kind) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = text;
    $('toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, kind === 'error' ? 6000 : 3200);
  }

  function notify(title, body) {
    if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, { body, tag: 'boltalka-' + title });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {}
  }

  let modalOnClose = null;
  function closeModal() {
    const root = $('modalRoot');
    if (!root.firstChild) return;
    root.innerHTML = '';
    const fn = modalOnClose;
    modalOnClose = null;
    if (fn) fn();
  }

  /** actions: [{ label, kind: 'primary'|'ghost'|'danger', onClick(modalEl) → false, чтобы не закрывать }] */
  function modal({ title, sub, body, actions, dismissable = true, onMount, onClose, wide }) {
    closeModal();
    const root = $('modalRoot');
    root.innerHTML = `
      <div class="modal-back">
        <div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mTitle">
          ${dismissable ? `<button class="m-close icon-btn" aria-label="Закрыть">${icon('x')}</button>` : ''}
          <h2 id="mTitle">${title}</h2>
          ${sub ? `<p class="m-sub">${sub}</p>` : ''}
          <div class="m-body">${body || ''}</div>
          ${actions && actions.length ? '<div class="m-actions"></div>' : ''}
        </div>
      </div>`;
    const back = root.firstElementChild;
    const box = back.firstElementChild;
    modalOnClose = onClose || null;
    if (dismissable) {
      back.addEventListener('mousedown', (e) => {
        if (e.target === back) closeModal();
      });
      box.querySelector('.m-close').addEventListener('click', closeModal);
    }
    back.dataset.dismissable = dismissable ? '1' : '';
    const bar = box.querySelector('.m-actions');
    (actions || []).forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.kind || 'ghost');
      b.textContent = a.label;
      b.addEventListener('click', async () => {
        const res = a.onClick ? await a.onClick(box) : true;
        if (res !== false && root.contains(box)) closeModal();
      });
      bar.appendChild(b);
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
        const primary = bar && bar.querySelector('.btn.primary');
        if (primary) {
          e.preventDefault();
          primary.click();
        }
      }
    });
    if (onMount) onMount(box);
    const focusable = box.querySelector('input:not([type=checkbox]):not([readonly]), textarea, select, .btn.primary');
    if (focusable && !isNarrow()) setTimeout(() => focusable.focus(), 30);
    return box;
  }

  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      let answered = false;
      modal({
        title,
        sub: text,
        actions: [
          { label: 'Отмена', kind: 'ghost', onClick: () => { answered = true; resolve(false); } },
          { label: okLabel, kind: danger ? 'danger' : 'primary', onClick: () => { answered = true; resolve(true); } },
        ],
        onClose: () => {
          if (!answered) resolve(false);
        },
      });
    });
  }

  function closePopover() {
    const pop = $('popover');
    if (pop.hidden) return;
    pop.hidden = true;
    pop.innerHTML = '';
  }

  function popover(anchor, html, onMount) {
    const pop = $('popover');
    if (!pop.hidden && pop.dataset.anchor === anchor.dataset.popId) {
      closePopover();
      return null;
    }
    anchor.dataset.popId = anchor.dataset.popId || String(Math.random());
    pop.dataset.anchor = anchor.dataset.popId;
    pop.innerHTML = html;
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    if (onMount) onMount(pop);
    return pop;
  }

  document.addEventListener('mousedown', (e) => {
    const pop = $('popover');
    if (pop.hidden || pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest(`[data-pop-id="${pop.dataset.anchor}"]`)) return;
    closePopover();
  });

  function menu(anchor, items) {
    popover(
      anchor,
      `<div class="menu">${items
        .map((it, i) => (it === '-' ? '<div class="menu-sep"></div>' : `<button data-i="${i}"${it.danger ? ' class="danger"' : ''}>${icon(it.icon)} ${esc(it.label)}</button>`))
        .join('')}</div>`,
      (pop) =>
        pop.querySelectorAll('button[data-i]').forEach((b) =>
          b.addEventListener('click', () => {
            closePopover();
            items[Number(b.dataset.i)].onClick();
          })
        )
    );
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e2) {}
      ta.remove();
      return ok;
    }
  }
  async function copyWithToast(text, okText) {
    const ok = await copyText(text);
    toast(ok ? okText : 'Не получилось скопировать — выдели и скопируй вручную', ok ? '' : 'error');
  }

  /* =====================================================================
   * Аккаунт
   * ===================================================================== */
  function swatchesHtml(current) {
    return `<div class="swatches" role="radiogroup" aria-label="Цвет">${BT.COLORS.map(
      (c) => `<button type="button" class="swatch${c === current ? ' on' : ''}" data-color="${c}" style="--c:${c}" role="radio" aria-checked="${c === current}" aria-label="Цвет ${c}"></button>`
    ).join('')}</div>`;
  }
  function wireSwatches(box, onPick) {
    box.querySelectorAll('.swatch').forEach((b) =>
      b.addEventListener('click', () => {
        box.querySelectorAll('.swatch').forEach((x) => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-checked', String(x === b));
        });
        onPick(b.dataset.color);
      })
    );
  }

  async function makeProfile(secret, name, color) {
    const id = await ident.derive(secret);
    return { uid: id.uid, code: id.code, secret, name, color };
  }

  function accountModal(context) {
    return new Promise((resolve) => {
      let color = BT.COLORS[Math.floor(Math.random() * BT.COLORS.length)];
      let tab = 'new';
      modal({
        title: 'Добро пожаловать в Болталку!',
        sub: context || 'Создай аккаунт — это займёт секунду. Почта и пароль не нужны.',
        dismissable: false,
        body: `
          <div class="tabs" role="tablist">
            <button type="button" class="tab on" data-tab="new" role="tab">Новый аккаунт</button>
            <button type="button" class="tab" data-tab="login" role="tab">У меня есть ключ входа</button>
          </div>
          <div class="preview-row">
            <div class="avatar lg" id="pfAvatar" style="--c:${color}">?</div>
            <label class="field grow"><span>Имя</span><input id="pfName" maxlength="32" placeholder="Например, Саша" autocomplete="nickname"></label>
          </div>
          <div class="field"><span>Цвет</span>${swatchesHtml(color)}</div>
          <div id="pfLogin" hidden>
            <label class="field"><span>Ключ входа</span><input id="pfKey" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"></label>
            <p class="hint">Ключ входа есть в настройках Болталки на устройстве, где у тебя уже есть аккаунт. С ним у тебя будет тот же код друга.</p>
          </div>
          <p class="hint error" id="pfErr" hidden></p>`,
        actions: [
          {
            label: 'Продолжить',
            kind: 'primary',
            onClick: async (box) => {
              const input = box.querySelector('#pfName');
              const err = box.querySelector('#pfErr');
              const name = input.value.trim().slice(0, 32);
              if (!name) {
                input.classList.add('bad');
                input.focus();
                return false;
              }
              let secret = ident.newSecret();
              if (tab === 'login') {
                secret = ident.parseKey(box.querySelector('#pfKey').value);
                if (!secret) {
                  err.textContent = 'Ключ не похож на настоящий: должно быть 20 букв и цифр.';
                  err.hidden = false;
                  return false;
                }
              }
              S.profile = await makeProfile(secret, name, color);
              store.set('profile', S.profile);
              setTimeout(resolve, 0);
            },
          },
        ],
        onMount: (box) => {
          const av = box.querySelector('#pfAvatar');
          const input = box.querySelector('#pfName');
          input.addEventListener('input', () => {
            input.classList.remove('bad');
            av.textContent = input.value.trim() ? BT.initials(input.value) : '?';
          });
          wireSwatches(box, (c) => {
            color = c;
            av.style.setProperty('--c', c);
          });
          box.querySelectorAll('.tab').forEach((t) =>
            t.addEventListener('click', () => {
              tab = t.dataset.tab;
              box.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === t));
              box.querySelector('#pfLogin').hidden = tab !== 'login';
            })
          );
          setTimeout(() => input.focus(), 50);
        },
      });
    });
  }

  /** Старый профиль без ключа входа → выдаём ключ и код друга. */
  async function migrateProfile() {
    const p = S.profile;
    if (p.secret && p.code) return;
    const oldUid = p.uid;
    const np = await makeProfile(ident.newSecret(), p.name, p.color);
    S.profile = np;
    store.set('profile', np);
    for (const r of S.rooms) {
      const msgs = store.get('msgs.' + r.code, []);
      let changed = false;
      for (const m of msgs) {
        if (m.uid === oldUid) {
          m.uid = np.uid;
          changed = true;
        }
      }
      if (changed) store.set('msgs.' + r.code, msgs);
    }
  }

  async function logout() {
    const ok = await confirmBox(
      'Выйти из аккаунта?',
      `Из этого браузера удалятся аккаунт, друзья, комнаты и переписка. Чтобы вернуться, понадобится ключ входа: <code>${esc(ident.fmtKey(S.profile.secret))}</code> — сохрани его.`,
      'Выйти',
      true
    );
    if (!ok) return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('boltalka.'))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    location.hash = '';
    location.reload();
  }

  /* =====================================================================
   * Друзья
   * ===================================================================== */
  function friendInviteLink() {
    const base = location.href.split('#')[0];
    return base + '#' + new URLSearchParams({ friend: S.profile.code, name: S.profile.name }).toString();
  }

  function sendReq(f) {
    if (!S.hub || !f) return;
    f.reqAt = Date.now();
    S.hub.sendTo(f.code, { t: 'req', name: S.profile.name, color: S.profile.color }).catch(() => {});
  }

  function ensureDmRoom(f) {
    let room = S.dm.get(f.code);
    if (room) return room;
    room = new BT.Room({ code: f.dm, me: me(), messages: store.get('msgs.' + f.dm, []), maxPeers: 3, dm: f.code });
    room.local.muted = S.prefs.muted;
    room.local.deaf = S.prefs.deaf;
    S.dm.set(f.code, room);
    wireRoom(room);
    room.start();
    return room;
  }

  async function addFriend({ code, name, color }, quiet) {
    if (code === S.profile.code) {
      toast('Это твой собственный код 🙂');
      return null;
    }
    let f = friendByCode(code);
    if (f) {
      if (!quiet) toast(`${f.name} уже у тебя в друзьях`);
      return f;
    }
    f = {
      code,
      name: name || 'Друг ' + fmtCode(code),
      color: BT.isColor(color) ? color : BT.colorFor(code),
      added: Date.now(),
      confirmed: false,
      lastSeen: 0,
      dm: await ident.dmCode(S.profile.code, code),
    };
    S.friends.push(f);
    saveFriends();
    S.requests = S.requests.filter((r) => r.code !== code);
    saveRequests();
    S.declined = S.declined.filter((c) => c !== code);
    store.set('declined', S.declined);
    ensureDmRoom(f);
    sendReq(f);
    if (!quiet) toast(`${f.name} добавлен(а). Как только друг примет заявку и будет в сети — сможете общаться.`);
    renderAll();
    return f;
  }

  async function acceptRequest(code) {
    const r = S.requests.find((x) => x.code === code);
    if (!r) return;
    await addFriend(r, true);
    toast(`${r.name} теперь в друзьях`);
  }

  function declineRequest(code) {
    S.requests = S.requests.filter((x) => x.code !== code);
    saveRequests();
    if (!S.declined.includes(code)) S.declined.push(code);
    store.set('declined', S.declined);
    renderAll();
  }

  async function removeFriend(f) {
    const ok = await confirmBox('Удалить из друзей?', `${esc(f.name)} пропадёт из списка, переписка удалится из этого браузера.`, 'Удалить', true);
    if (!ok) return;
    const room = S.dm.get(f.code);
    if (S.room === room) {
      if (S.inVoice) leaveVoice(true);
      S.room = null;
      S.home = true;
    }
    if (room) room.stop();
    S.dm.delete(f.code);
    S.friends = S.friends.filter((x) => x.code !== f.code);
    saveFriends();
    store.del('msgs.' + f.dm);
    delete S.dmUnread[f.code];
    saveDmUnread();
    syncAudio();
    renderAll();
  }

  function onRequest(req) {
    if (friendByCode(req.code) || S.declined.includes(req.code)) return;
    const had = S.requests.find((r) => r.code === req.code);
    if (had) {
      had.name = req.name;
      had.color = req.color;
    } else {
      S.requests.push(Object.assign({ at: Date.now() }, req));
      toast(`${req.name} хочет добавить тебя в друзья`);
      BT.sound('online');
      notify('Заявка в друзья', `${req.name} хочет добавить тебя в друзья`);
    }
    saveRequests();
    renderAll();
  }

  function addFriendModal(prefill) {
    modal({
      title: 'Добавить друга',
      sub: 'Попроси у друга его код (он на странице «Друзья» в Болталке) или пусть пришлёт тебе ссылку.',
      body: `<label class="field"><span>Код друга или ссылка</span><input id="afCode" placeholder="ABCDE-FGHJK" autocomplete="off" spellcheck="false" value="${esc(prefill || '')}"></label>
             <p class="hint error" id="afErr" hidden>Код — это 10 букв и цифр, например ABCDE-FGHJK.</p>`,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Добавить',
          kind: 'primary',
          onClick: async (box) => {
            const raw = box.querySelector('#afCode').value;
            const h = parseHash(raw);
            const code = ident.parseCode(raw) || (h && h.friend);
            if (!code) {
              box.querySelector('#afErr').hidden = false;
              return false;
            }
            await addFriend({ code, name: h && h.friend === code ? h.name : '' });
          },
        },
      ],
    });
  }

  function myCodeModal() {
    const link = friendInviteLink();
    modal({
      title: 'Твой код друга',
      sub: 'Дай этот код другу или отправь ссылку. Друг добавит тебя, ты примешь заявку — и сможете переписываться и звонить.',
      body: `
        <div class="big-code center">${esc(fmtCode(S.profile.code))}</div>
        <div class="invite">
          <input readonly value="${esc(link)}" id="mcLink" aria-label="Ссылка для друга">
          <button type="button" class="btn primary" id="mcCopy">${icon('copy')} Ссылка</button>
        </div>
        <button type="button" class="btn ghost full" id="mcCode">${icon('copy')} Скопировать только код</button>
        ${navigator.share ? `<button type="button" class="btn ghost full" id="mcShare" style="margin-top:8px">${icon('share')} Поделиться…</button>` : ''}`,
      actions: [{ label: 'Готово', kind: 'primary' }],
      onMount: (box) => {
        box.querySelector('#mcCopy').onclick = () => copyWithToast(link, 'Ссылка скопирована — отправь её другу');
        box.querySelector('#mcCode').onclick = () => copyWithToast(fmtCode(S.profile.code), 'Код скопирован');
        const sh = box.querySelector('#mcShare');
        if (sh) sh.onclick = () => navigator.share({ title: 'Болталка', text: `Добавь меня в друзья в Болталке: ${fmtCode(S.profile.code)}`, url: link }).catch(() => {});
      },
    });
  }

  function confirmFriend(f, info) {
    if (!info || info.uid !== 'u' + f.code) return;
    let changed = !f.confirmed || f.name !== info.name || f.color !== info.color;
    f.confirmed = true;
    f.name = info.name;
    f.color = info.color;
    if (Date.now() - (f.lastSeen || 0) > 30000) changed = true;
    f.lastSeen = Date.now();
    if (changed) saveFriends();
  }

  /* =====================================================================
   * Комнаты (группы)
   * ===================================================================== */
  function validServer(u) {
    try {
      const x = new URL(u);
      return x.protocol === 'wss:' || x.protocol === 'ws:';
    } catch (e) {
      return false;
    }
  }

  /** Ссылки вида #join=… (комната) или #friend=… (друг). */
  function parseHash(input) {
    const s = String(input || '').trim();
    const i = s.indexOf('#');
    if (i < 0) return null;
    const p = new URLSearchParams(s.slice(i + 1));
    const friend = ident.parseCode(p.get('friend'));
    if (friend) return { friend, name: (p.get('name') || '').trim().slice(0, 32) };
    const code = (p.get('join') || '').toLowerCase();
    if (!BT.CODE_RE.test(code)) return null;
    const server = p.get('s') || '';
    return { code, name: (p.get('name') || '').trim().slice(0, 40), server: validServer(server) ? server : '' };
  }

  function parseInvite(input) {
    const s = String(input || '').trim();
    if (BT.CODE_RE.test(s.toLowerCase())) return { code: s.toLowerCase(), name: '', server: '' };
    const h = parseHash(s);
    return h && h.code ? h : null;
  }

  function inviteLink(rec) {
    const base = location.href.split('#')[0];
    const p = new URLSearchParams({ join: rec.code, name: rec.name });
    if (rec.server) p.set('s', rec.server);
    return base + '#' + p.toString();
  }

  function acceptInvite(inv) {
    let rec = S.rooms.find((r) => r.code === inv.code);
    if (!rec) {
      rec = { code: inv.code, name: inv.name || 'Комната', server: inv.server || '', added: Date.now() };
      S.rooms.push(rec);
      saveRooms();
      toast(`Ты в комнате «${rec.name}»`);
    }
    selectRoom(rec.code, true);
  }

  function createRoomModal() {
    modal({
      title: 'Новая комната',
      sub: 'Комната — общий текстовый чат и голосовой канал для нескольких друзей. После создания получишь ссылку-приглашение.',
      body: `
        <label class="field"><span>Название</span><input id="crName" maxlength="40" value="Наша комната" placeholder="Например, Мы с Сашей"></label>
        <details class="advanced">
          <summary>Дополнительно</summary>
          <label class="field"><span>Свой MQTT-брокер (необязательно)</span>
          <input id="crServer" placeholder="wss://my-broker.example.com:8084/mqtt" inputmode="url"></label>
          <p class="hint">По умолчанию друзья находят друг друга через несколько бесплатных публичных MQTT-брокеров. Адрес своего брокера попадёт в ссылку-приглашение.</p>
        </details>`,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Создать',
          kind: 'primary',
          onClick: (box) => {
            const name = box.querySelector('#crName').value.trim().slice(0, 40) || 'Наша комната';
            const serverInput = box.querySelector('#crServer');
            const server = serverInput.value.trim();
            if (server && !validServer(server)) {
              serverInput.classList.add('bad');
              box.querySelector('details').open = true;
              return false;
            }
            const rec = { code: BT.roomCode(), name, server, added: Date.now() };
            S.rooms.push(rec);
            saveRooms();
            selectRoom(rec.code, true);
            setTimeout(() => inviteModal(rec, true), 0);
          },
        },
      ],
      onMount: (box) => setTimeout(() => box.querySelector('#crName').select(), 40),
    });
  }

  function joinModal() {
    modal({
      title: 'Войти по ссылке',
      sub: 'Вставь ссылку-приглашение в комнату или ссылку друга.',
      body: '<label class="field"><span>Ссылка или код комнаты</span><input id="jnLink" placeholder="https://…#join=…" autocomplete="off"></label><p class="hint error" id="jnErr" hidden>Не похоже на приглашение. Попроси друга скопировать ссылку ещё раз.</p>',
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Войти',
          kind: 'primary',
          onClick: (box) => {
            const val = box.querySelector('#jnLink').value;
            const h = parseHash(val);
            if (h && h.friend) {
              setTimeout(() => friendLinkPrompt(h), 0);
              return;
            }
            const inv = parseInvite(val);
            if (!inv) {
              box.querySelector('#jnErr').hidden = false;
              return false;
            }
            acceptInvite(inv);
          },
        },
      ],
    });
  }

  function inviteModal(rec, fresh) {
    const link = inviteLink(rec);
    modal({
      title: fresh ? 'Комната готова! Позови друзей' : 'Пригласить в комнату',
      sub: 'Отправь ссылку другу в любой мессенджер. Пусть откроет её в обычном браузере (Chrome, Safari, Яндекс), а не внутри Telegram или VK.',
      body: `
        <div class="invite">
          <input id="invLink" readonly value="${esc(link)}" aria-label="Ссылка-приглашение">
          <button type="button" class="btn primary" id="invCopy">${icon('copy')} Копировать</button>
        </div>
        ${navigator.share ? `<button type="button" class="btn ghost full" id="invShare">${icon('share')} Поделиться…</button>` : ''}
        <p class="hint">Код комнаты: <code>${esc(rec.code)}</code>${rec.server ? ` · брокер: <code>${esc(rec.server)}</code>` : ''}</p>`,
      actions: [{ label: 'Готово', kind: 'primary' }],
      onMount: (box) => {
        const input = box.querySelector('#invLink');
        input.addEventListener('focus', () => input.select());
        box.querySelector('#invCopy').addEventListener('click', () => copyWithToast(link, 'Ссылка скопирована — отправь её другу'));
        const sh = box.querySelector('#invShare');
        if (sh) sh.addEventListener('click', () => navigator.share({ title: 'Болталка', text: `Залетай поболтать в «${rec.name}»`, url: link }).catch(() => {}));
      },
    });
  }

  function renameRoomModal() {
    const rec = roomRec();
    if (!rec || rec.dm) return;
    modal({
      title: 'Переименовать комнату',
      sub: 'Название видно только тебе (и попадёт в новые приглашения).',
      body: `<label class="field"><span>Название</span><input id="rnName" maxlength="40" value="${esc(rec.name)}"></label>`,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Сохранить',
          kind: 'primary',
          onClick: (box) => {
            const name = box.querySelector('#rnName').value.trim().slice(0, 40);
            if (!name) return false;
            rec.name = name;
            saveRooms();
            renderAll();
          },
        },
      ],
    });
  }

  async function leaveRoom() {
    const rec = roomRec();
    if (!rec || rec.dm) return;
    const ok = await confirmBox(
      'Покинуть комнату?',
      `Комната «${esc(rec.name)}» и история переписки исчезнут из этого браузера. Вернуться можно по ссылке-приглашению.`,
      'Покинуть',
      true
    );
    if (!ok) return;
    if (S.inVoice) leaveVoice(true);
    if (S.room) {
      S.room.stop();
      S.room = null;
    }
    S.rooms = S.rooms.filter((r) => r.code !== rec.code);
    saveRooms();
    store.del('msgs.' + rec.code);
    store.del('members.' + rec.code);
    syncAudio();
    goHome();
  }

  function addMenu(anchor) {
    menu(anchor, [
      { icon: 'userPlus', label: 'Добавить друга', onClick: () => addFriendModal() },
      { icon: 'plus', label: 'Создать комнату', onClick: createRoomModal },
      { icon: 'link', label: 'Войти по ссылке', onClick: joinModal },
    ]);
  }

  function roomMenu(anchor) {
    menu(anchor, [
      { icon: 'link', label: 'Пригласить друга', onClick: () => inviteModal(roomRec()) },
      { icon: 'pencil', label: 'Переименовать', onClick: renameRoomModal },
      { icon: 'signal', label: 'Проверка связи', onClick: diagModal },
      '-',
      { icon: 'door', label: 'Покинуть комнату', danger: true, onClick: leaveRoom },
    ]);
  }

  function friendMenu(anchor, f) {
    menu(anchor, [
      { icon: 'chat', label: 'Написать', onClick: () => openDM(f) },
      { icon: 'phone', label: 'Позвонить', onClick: () => startCall(f) },
      { icon: 'copy', label: 'Скопировать код друга', onClick: () => copyWithToast(fmtCode(f.code), 'Код скопирован') },
      { icon: 'signal', label: 'Проверка связи', onClick: diagModal },
      '-',
      { icon: 'x', label: 'Удалить из друзей', danger: true, onClick: () => removeFriend(f) },
    ]);
  }

  function friendLinkPrompt(h) {
    if (h.friend === S.profile.code) {
      toast('Это ссылка на тебя самого — отправь её другу 🙂');
      return;
    }
    const f = friendByCode(h.friend);
    if (f) {
      openDM(f);
      return;
    }
    const name = h.name || 'Друг ' + fmtCode(h.friend);
    modal({
      title: `Добавить ${esc(name)} в друзья?`,
      sub: 'После этого вы сможете переписываться и звонить друг другу.',
      body: `<div class="preview-row center">${avatarHtml(name, BT.colorFor(h.friend), 'lg')}<div><b>${esc(name)}</b><div class="hint">Код: ${esc(fmtCode(h.friend))}</div></div></div>`,
      actions: [
        { label: 'Не сейчас', kind: 'ghost' },
        {
          label: 'Добавить в друзья',
          kind: 'primary',
          onClick: async () => {
            const nf = await addFriend({ code: h.friend, name: h.name }, true);
            if (nf) {
              toast(`${nf.name} добавлен(а). Как только друг будет в сети — вы увидите друг друга.`);
              openDM(nf);
            }
          },
        },
      ],
    });
  }

  /* =====================================================================
   * Настройки и проверка связи
   * ===================================================================== */
  async function settingsModal() {
    let color = S.profile.color;
    let mics = [];
    try {
      mics = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
    } catch (e) {}
    const micOptions = ['<option value="">По умолчанию</option>']
      .concat(
        mics
          .filter((d) => d.deviceId && d.deviceId !== 'default')
          .map((d, i) => `<option value="${esc(d.deviceId)}"${d.deviceId === S.prefs.micId ? ' selected' : ''}>${esc(d.label || 'Микрофон ' + (i + 1))}</option>`)
      )
      .join('');
    const rec = roomRec();
    modal({
      title: 'Настройки',
      wide: true,
      body: `
        <div class="preview-row">
          <div class="avatar lg" id="stAvatar" style="--c:${safeColor(color)}">${esc(BT.initials(S.profile.name))}</div>
          <label class="field grow"><span>Твоё имя</span><input id="stName" maxlength="32" value="${esc(S.profile.name)}"></label>
        </div>
        <div class="field"><span>Цвет</span>${swatchesHtml(color)}</div>
        <div class="field"><span>Аккаунт</span>
          <div class="acc-row">${icon('users')}<div class="grow">Код друга<div class="mono">${esc(fmtCode(S.profile.code))}</div></div><button type="button" class="icon-btn" id="stCopyCode" title="Скопировать">${icon('copy')}</button></div>
          <div class="acc-row">${icon('key')}<div class="grow">Ключ входа <span class="hint">— как пароль, никому не показывай</span><div class="mono" id="stKey">••••-••••-••••-••••-••••</div></div><button type="button" class="icon-btn" id="stShowKey" title="Показать">${icon('eye')}</button><button type="button" class="icon-btn" id="stCopyKey" title="Скопировать">${icon('copy')}</button></div>
          <p class="hint">С ключом входа можно зайти в этот аккаунт в другом браузере или на телефоне.</p>
        </div>
        <label class="field"><span>Микрофон</span><select id="stMic">${micOptions}</select></label>
        <label class="check"><input type="checkbox" id="stSounds"${S.prefs.sounds ? ' checked' : ''}> Звуки: новые сообщения, вход и выход из голосового</label>
        <div class="btn-row">
          <button type="button" class="btn ghost" id="stDiag">${icon('signal')} Проверка связи</button>
          ${'Notification' in window && Notification.permission === 'default' ? `<button type="button" class="btn ghost" id="stNotif">${icon('bell')} Уведомления о звонках</button>` : ''}
        </div>
        <details class="advanced">
          <summary>Как это работает</summary>
          <p class="hint">Болталка не хранит ничего на сервере. Звук, видео и сообщения идут напрямую между браузерами (WebRTC). Публичные MQTT-брокеры только помогают найти друг друга, и эти служебные сообщения зашифрованы. Если напрямую соединиться не выходит, звук идёт через публичный TURN-сервер.</p>
          <p class="hint">Аккаунт, друзья и история хранятся в этом браузере. Сообщения, отправленные, пока друга нет в сети, уйдут, когда вы оба будете онлайн.</p>
          <p class="hint">Горячие клавиши: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> — микрофон, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> — звук.</p>
        </details>
        ${S.room && !S.home ? `<button type="button" class="btn danger-ghost full" id="stClear">Очистить историю чата ${rec && rec.dm ? 'с ' + esc(rec.name) : 'в этой комнате'}</button>` : ''}
        <button type="button" class="btn danger-ghost full" id="stLogout" style="margin-top:8px">${icon('door')} Выйти из аккаунта</button>`,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Сохранить',
          kind: 'primary',
          onClick: (box) => {
            const input = box.querySelector('#stName');
            const name = input.value.trim().slice(0, 32);
            if (!name) {
              input.classList.add('bad');
              return false;
            }
            const changed = name !== S.profile.name || color !== S.profile.color;
            S.profile.name = name;
            S.profile.color = color;
            store.set('profile', S.profile);
            if (changed) forEachRoom((r) => r.setUser(me()));
            S.prefs.sounds = box.querySelector('#stSounds').checked;
            BT.soundsOn = S.prefs.sounds;
            const micId = box.querySelector('#stMic').value;
            const micChanged = micId !== S.prefs.micId;
            S.prefs.micId = micId;
            savePrefs();
            if (micChanged) switchMic();
            renderAll();
          },
        },
      ],
      onMount: (box) => {
        const av = box.querySelector('#stAvatar');
        const input = box.querySelector('#stName');
        input.addEventListener('input', () => {
          input.classList.remove('bad');
          av.textContent = BT.initials(input.value || '?');
        });
        wireSwatches(box, (c) => {
          color = c;
          av.style.setProperty('--c', c);
        });
        box.querySelector('#stCopyCode').onclick = () => copyWithToast(fmtCode(S.profile.code), 'Код друга скопирован');
        box.querySelector('#stShowKey').onclick = () => {
          box.querySelector('#stKey').textContent = ident.fmtKey(S.profile.secret);
        };
        box.querySelector('#stCopyKey').onclick = () => copyWithToast(ident.fmtKey(S.profile.secret), 'Ключ входа скопирован — храни его в надёжном месте');
        box.querySelector('#stDiag').onclick = diagModal;
        const nb = box.querySelector('#stNotif');
        if (nb) nb.onclick = askNotifications;
        box.querySelector('#stLogout').onclick = logout;
        const clear = box.querySelector('#stClear');
        if (clear)
          clear.addEventListener('click', async () => {
            const ok = await confirmBox('Очистить историю?', 'Сообщения удалятся только у тебя. У собеседника они останутся и могут вернуться при следующей встрече.', 'Очистить', true);
            if (ok && S.room) {
              S.room.clearHistory();
              toast('История очищена');
            }
          });
      },
    });
  }

  function askNotifications() {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((p) => {
      toast(p === 'granted' ? 'Уведомления включены' : 'Уведомления не разрешены');
      renderAll();
    });
  }

  function inAppBrowser() {
    return /Telegram|VKAndroidApp|VKClient|com\.vkontakte|Instagram|FBAN|FBAV|Line\/|OKApp|MicroMessenger/i.test(navigator.userAgent);
  }

  async function diagModal() {
    const box = modal({
      title: 'Проверка связи',
      sub: 'Проверяем, может ли Болталка найти друзей и соединиться с ними. Это займёт до 10 секунд.',
      body: '<div class="diag" id="dgBody"><div class="diag-row">Проверяем…</div></div>',
      actions: [{ label: 'Готово', kind: 'primary' }],
    });
    const r = await BT.net.diagnose();
    const body = box.querySelector('#dgBody');
    if (!body || !document.body.contains(body)) return;
    const row = (ok, title, sub) =>
      `<div class="diag-row ${ok ? 'ok' : 'bad'}"><span class="diag-ic">${ok ? icon('check') : icon('x')}</span><div><b>${esc(title)}</b>${sub ? `<div class="hint">${esc(sub)}</div>` : ''}</div></div>`;
    let html = '<div class="diag-cat">Серверы знакомств (нужен хотя бы один)</div>';
    for (const b of r.brokers) html += row(b.ok, b.host, b.ok ? 'работает' : b.error || 'недоступен');
    html += '<div class="diag-cat">Соединение с другом</div>';
    html += row(r.ice.srflx > 0, 'Прямое соединение (STUN)', r.ice.srflx > 0 ? 'внешний адрес получен' : 'STUN недоступен — получится соединиться только в одной Wi-Fi сети');
    html += row(r.ice.relay > 0, 'Запасной путь (TURN)', r.ice.relay > 0 ? 'работает' : 'недоступен — при строгом мобильном интернете соединиться может не получиться');
    const brokersOk = r.brokers.some((b) => b.ok);
    let verdict;
    if (!brokersOk) verdict = 'Все серверы знакомств недоступны — Болталка не сможет найти друзей. Попробуй другую сеть (Wi-Fi вместо мобильного интернета) или VPN.';
    else if (!r.ice.srflx && !r.ice.relay) verdict = 'Друзей найти можно, но соединиться получится только в одной сети. Попробуй другую сеть или VPN.';
    else if (!r.ice.relay) verdict = 'В целом связь есть. Если с другом всё равно не соединяется — у кого-то из вас слишком строгая сеть: попробуйте Wi-Fi вместо мобильного интернета.';
    else verdict = 'Всё в порядке! Если с другом не соединяется — пусть он тоже откроет «Проверку связи» и пришлёт тебе результат.';
    html += `<p class="diag-verdict">${esc(verdict)}</p>`;
    if (inAppBrowser()) html += '<p class="diag-verdict warn">Болталка открыта внутри приложения (Telegram, VK и т. п.). Открой её в обычном браузере.</p>';
    body.innerHTML = html;
  }

  /* =====================================================================
   * Комнаты: выбор и события
   * ===================================================================== */
  const saveTimers = new Map();
  function saveMessagesSoon(room) {
    clearTimeout(saveTimers.get(room.code));
    saveTimers.set(room.code, setTimeout(() => saveMessagesNow(room), 400));
  }
  function saveMessagesNow(room) {
    if (!room) return;
    clearTimeout(saveTimers.get(room.code));
    store.set('msgs.' + room.code, room.messages);
  }
  function forEachRoom(fn) {
    const all = new Set(S.dm.values());
    if (S.room) all.add(S.room);
    all.forEach(fn);
  }

  function remember(room, info) {
    if (!room || room.dm || !info || info.uid === S.profile.uid) return;
    const key = 'members.' + room.code;
    const known = store.get(key, {});
    known[info.uid] = { name: info.name, color: info.color, seen: Date.now() };
    store.set(key, known);
  }

  const failToastAt = new Map();
  function wireRoom(room) {
    const startedAt = Date.now();
    const cur = () => S.room === room && !S.home;
    room.on('status', () => {
      if (S.room === room) {
        renderSideHead();
        renderBanner();
        renderMeBar();
        renderMembers();
      }
      if (room.dm) renderFriendsBits();
    });
    room.on('peers', () => {
      const f = friendOfRoom(room);
      for (const l of room.members()) {
        remember(room, l.info);
        if (f) confirmFriend(f, l.info);
      }
      if (S.room === room) {
        renderVoiceParts();
        renderMembers();
        renderSideHead();
        renderMessagesIfEmpty();
        syncAudio();
      }
      if (f) renderFriendsBits();
      checkCallProgress();
    });
    room.on('peer-joined', (link) => {
      if (Date.now() - startedAt < 6000) return; // кто уже был, когда мы вошли
      if (room.dm || S.room === room) {
        toast(`${link.info.name} в сети`);
        BT.sound('online');
      }
    });
    room.on('peer-left', (link) => {
      remember(room, link.info);
      const f = friendOfRoom(room);
      if (f) {
        f.lastSeen = Date.now();
        saveFriends();
      }
      if (S.room === room) {
        toast(`${link.info.name} не в сети`);
        if (S.inVoice && link.state.voice) BT.sound('leave');
      }
      if (S.incoming && S.incoming.room === room) missedCall();
      if (S.call && S.call.room === room) endCall(`${link.info.name} не в сети`, true);
    });
    room.on('peer-state', ({ link, before }) => {
      if (S.room === room && S.inVoice && before.voice !== link.state.voice) BT.sound(link.state.voice ? 'join' : 'leave');
      if (room.dm) renderFriendsBits();
      checkCallProgress();
    });
    room.on('messages', (ev) => {
      saveMessagesSoon(room);
      if (S.room === room && !S.home) renderMessages(ev.own);
      if (ev.cleared || !ev.added || !ev.added.length) return;
      const foreign = ev.added.filter((m) => m.uid !== S.profile.uid);
      if (!foreign.length) return;
      const seeing = cur() && !document.hidden && S.view === 'chat';
      if (seeing) return;
      const last = foreign[foreign.length - 1];
      const f = friendOfRoom(room);
      if (f) {
        S.dmUnread[f.code] = (S.dmUnread[f.code] || 0) + foreign.length;
        saveDmUnread();
        if (!cur()) toast(`${last.name}: ${last.text.slice(0, 80)}`);
      } else if (S.room === room) {
        S.unread += foreign.length;
      }
      notify(last.name, last.text.slice(0, 120));
      BT.sound('message');
      updateTitle();
      renderRail();
      renderChannels();
      renderMainHead();
      if (S.home) renderHome();
    });
    room.on('typing', () => {
      if (S.room === room) renderTyping();
    });
    room.on('media', () => {
      if (S.room === room) {
        renderTiles();
        syncAudio();
      }
    });
    room.on('call', ({ link, data }) => onCallSignal(room, link, data));
    room.on('link-failed', ({ name }) => {
      if (!(S.room === room || room.dm)) return;
      const last = failToastAt.get(room.code) || 0;
      if (Date.now() - last < 90000) return;
      failToastAt.set(room.code, Date.now());
      toast(`Нашли ${name || 'друга'}, но соединиться не получилось. Пробуем ещё… Если не выйдет — открой «Проверку связи».`, 'error');
    });
  }

  function selectRoom(code, focusChat) {
    S.home = false;
    if (S.room && S.room.code === code) {
      store.set('active', code);
      renderAll();
      if (focusChat && !isNarrow() && S.view === 'chat') $('input').focus();
      return;
    }
    const rec = recOf(code);
    if (S.inVoice) leaveVoice(true);
    const old = S.room;
    if (old) {
      saveMessagesNow(old);
      if (!old.dm) old.stop();
    }
    S.room = null;
    syncAudio();
    S.unread = 0;
    S.view = 'chat';
    if (!rec) {
      goHome();
      return;
    }
    store.set('active', rec.code);
    let room;
    if (rec.dm) {
      room = ensureDmRoom(friendByCode(rec.dm));
    } else {
      room = new BT.Room({ code: rec.code, server: rec.server, me: me(), messages: store.get('msgs.' + rec.code, []) });
      room.local.muted = S.prefs.muted;
      room.local.deaf = S.prefs.deaf;
      wireRoom(room);
      room.start();
    }
    S.room = room;
    renderAll();
    if (focusChat && !isNarrow()) $('input').focus();
  }

  function openDM(f) {
    if (!f) return;
    selectRoom(f.dm, true);
    closeDrawer();
  }

  function goHome() {
    S.home = true;
    store.set('active', 'home');
    renderAll();
    closeDrawer();
  }

  /* =====================================================================
   * Голос
   * ===================================================================== */
  function micConstraints(withDevice) {
    const c = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    if (withDevice && S.prefs.micId) c.deviceId = { exact: S.prefs.micId };
    return c;
  }

  function mediaErrorText(e, what) {
    const name = e && e.name;
    if (name === 'NotAllowedError' || name === 'SecurityError')
      return `Браузер не дал доступ к ${what}. Разреши его в настройках сайта (значок замка в адресной строке).`;
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return what === 'камере' ? 'Камера не найдена.' : 'Микрофон не найден.';
    if (name === 'NotReadableError') return `Не получается открыть ${what === 'камере' ? 'камеру' : 'микрофон'} — возможно, он занят другой программой.`;
    return `Ошибка доступа к ${what}: ${(e && e.message) || name || 'неизвестно'}`;
  }

  async function getMic() {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: micConstraints(true) });
    } catch (e) {
      if (S.prefs.micId && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        S.prefs.micId = '';
        savePrefs();
        return navigator.mediaDevices.getUserMedia({ audio: micConstraints(false) });
      }
      throw e;
    }
  }

  async function joinVoice() {
    if (S.inVoice) return true;
    if (S.joining || !S.room) return false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Голосовой чат работает только на сайте с https:// (или на localhost).', 'error');
      return false;
    }
    BT.audioCtx();
    S.joining = true;
    renderVoiceParts();
    const room = S.room;
    let stream;
    try {
      stream = await getMic();
    } catch (e) {
      S.joining = false;
      renderVoiceParts();
      toast(mediaErrorText(e, 'микрофону'), 'error');
      return false;
    }
    S.joining = false;
    if (S.room !== room) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    S.mic = stream;
    S.inVoice = true;
    applyMicEnabled();
    room.setTracks({ audio: stream.getAudioTracks()[0] });
    room.setLocal({ voice: true, muted: S.prefs.muted, deaf: S.prefs.deaf, video: null });
    watchLevel('me', stream);
    BT.sound('join');
    setView('voice');
    syncAudio();
    return true;
  }

  function leaveVoice(silent) {
    if (S.call) endCall();
    if (!S.inVoice) return;
    stopVideo(true);
    if (S.mic) S.mic.getTracks().forEach((t) => t.stop());
    S.mic = null;
    S.inVoice = false;
    unwatchLevel('me');
    if (S.room) {
      S.room.setTracks({ audio: null, video: null });
      S.room.setLocal({ voice: false, video: null });
    }
    if (!silent) BT.sound('leave');
    syncAudio();
    if (S.room && S.room.dm && S.view === 'voice') {
      // звонок закончился — возвращаемся к переписке
      S.view = 'chat';
      renderAll();
      return;
    }
    renderVoiceParts();
    renderFriendsBits();
  }

  async function switchMic() {
    if (!S.inVoice || !S.room) return;
    try {
      const stream = await getMic();
      if (!S.inVoice) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const old = S.mic;
      S.mic = stream;
      applyMicEnabled();
      S.room.setTracks({ audio: stream.getAudioTracks()[0] });
      watchLevel('me', stream);
      if (old) old.getTracks().forEach((t) => t.stop());
    } catch (e) {
      toast(mediaErrorText(e, 'микрофону'), 'error');
    }
  }

  function applyMicEnabled() {
    const t = S.mic && S.mic.getAudioTracks()[0];
    if (t) t.enabled = !S.prefs.muted && !S.prefs.deaf;
  }

  function toggleMute() {
    if (S.prefs.deaf) {
      S.prefs.deaf = false;
      S.prefs.muted = false;
    } else {
      S.prefs.muted = !S.prefs.muted;
    }
    afterAudioToggle(S.prefs.muted ? 'mute' : 'unmute');
  }

  function toggleDeaf() {
    S.prefs.deaf = !S.prefs.deaf;
    afterAudioToggle(S.prefs.deaf ? 'mute' : 'unmute');
  }

  function afterAudioToggle(sound) {
    savePrefs();
    applyMicEnabled();
    forEachRoom((r) => r.setLocal({ muted: S.prefs.muted, deaf: S.prefs.deaf }));
    BT.audioCtx();
    BT.sound(sound);
    renderMeBar();
    renderVoiceParts();
    syncAudio();
  }

  async function toggleCamera() {
    if (!S.inVoice) return;
    if (S.videoKind === 'camera') {
      stopVideo();
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } });
    } catch (e) {
      toast(mediaErrorText(e, 'камере'), 'error');
      return;
    }
    if (!S.inVoice) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    setVideo(stream, 'camera');
  }

  const canShareScreen = () => !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !isNarrow();

  async function toggleScreen() {
    if (!S.inVoice) return;
    if (S.videoKind === 'screen') {
      stopVideo();
      return;
    }
    if (!navigator.mediaDevices.getDisplayMedia) {
      toast('Этот браузер не умеет показывать экран.', 'error');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30 } }, audio: false });
    } catch (e) {
      if (e && e.name !== 'NotAllowedError' && e.name !== 'AbortError') toast('Не получилось показать экран: ' + (e.message || e.name), 'error');
      return;
    }
    if (!S.inVoice) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    setVideo(stream, 'screen');
  }

  function setVideo(stream, kind) {
    const old = S.video;
    const track = stream.getVideoTracks()[0];
    try {
      track.contentHint = kind === 'screen' ? 'detail' : 'motion';
    } catch (e) {}
    track.addEventListener('ended', () => {
      if (S.video === stream) stopVideo();
    });
    S.video = stream;
    S.videoKind = kind;
    S.room.setTracks({ video: track });
    S.room.setLocal({ video: kind });
    if (old) old.getTracks().forEach((t) => t.stop());
    renderVoiceParts();
  }

  function stopVideo(silent) {
    if (!S.video) return;
    const old = S.video;
    S.video = null;
    S.videoKind = null;
    old.getTracks().forEach((t) => t.stop());
    if (S.room && !silent) {
      S.room.setTracks({ video: null });
      S.room.setLocal({ video: null });
    }
    renderVoiceParts();
  }

  /* ---------- воспроизведение собеседников ---------- */
  const audioEls = new Map();
  const volFor = (uid) => {
    const v = Number(S.prefs.vol[uid]);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  };

  function syncAudio() {
    const alive = new Set();
    for (const l of members()) {
      alive.add(l.id);
      let el = audioEls.get(l.id);
      if (!el) {
        el = document.createElement('audio');
        el.autoplay = true;
        $('audioSink').appendChild(el);
        audioEls.set(l.id, el);
      }
      if (el.srcObject !== l.streams.audio) el.srcObject = l.streams.audio;
      const hear = S.inVoice && !S.prefs.deaf && l.state.voice;
      el.muted = !hear;
      el.volume = volFor(l.info.uid);
      if (hear && el.paused) el.play().catch(() => {});
      if (S.inVoice && l.state.voice) watchLevel(l.id, l.streams.audio);
      else unwatchLevel(l.id);
    }
    for (const [id, el] of audioEls) {
      if (alive.has(id)) continue;
      el.srcObject = null;
      el.remove();
      audioEls.delete(id);
      unwatchLevel(id);
    }
  }

  /* ---------- индикатор «говорит» ---------- */
  const meters = new Map();
  let meterTimer = null;

  function watchLevel(key, stream) {
    const track = stream && stream.getAudioTracks()[0];
    if (!track) return;
    const curM = meters.get(key);
    if (curM && curM.trackId === track.id) return;
    if (curM) unwatchLevel(key);
    const ctx = BT.audioCtx();
    if (!ctx) return;
    try {
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      meters.set(key, { src, an, buf: new Float32Array(an.fftSize), trackId: track.id, hold: 0 });
    } catch (e) {
      return;
    }
    if (!meterTimer) meterTimer = setInterval(meterTick, 90);
  }

  function unwatchLevel(key) {
    const m = meters.get(key);
    if (!m) return;
    try {
      m.src.disconnect();
    } catch (e) {}
    meters.delete(key);
  }

  function audible(key) {
    if (key === 'me') return S.inVoice && !S.prefs.muted && !S.prefs.deaf;
    const l = S.room && S.room.links.get(key);
    return !!(l && l.state.voice && !l.state.muted && !l.state.deaf);
  }

  const speaking = new Set();
  function meterTick() {
    const now = performance.now();
    speaking.clear();
    for (const [key, m] of meters) {
      m.an.getFloatTimeDomainData(m.buf);
      let sum = 0;
      for (let i = 0; i < m.buf.length; i++) sum += m.buf[i] * m.buf[i];
      const rms = Math.sqrt(sum / m.buf.length);
      if (rms > 0.012) m.hold = now + 260;
      if (m.hold > now && audible(key)) speaking.add(key);
    }
    paintSpeaking();
    if (!meters.size) {
      clearInterval(meterTimer);
      meterTimer = null;
    }
  }

  function paintSpeaking() {
    document.querySelectorAll('[data-speak]').forEach((el) => el.classList.toggle('speaking', speaking.has(el.dataset.speak)));
  }

  /* =====================================================================
   * Звонки другу
   * ===================================================================== */
  const CALL_TIMEOUT = 40000;

  async function startCall(f) {
    if (!f) return;
    const room = ensureDmRoom(f);
    const link = friendLink(f);
    if (!link) {
      toast(
        f.confirmed
          ? `${f.name} сейчас не в сети. Позвонить получится, когда друг откроет Болталку.`
          : `${f.name} ещё не принял(а) заявку в друзья или не в сети.`,
        'error'
      );
      return;
    }
    openDM(f);
    if (link.state.voice) {
      await joinVoice(); // друг уже в звонке — просто заходим
      return;
    }
    const ok = await joinVoice();
    if (!ok || S.room !== room) return;
    S.call = { id: BT.net.randId(), friend: f.code, room, startedAt: Date.now() };
    ringOnce();
    S.call.timer = setInterval(ringOnce, 3000);
    renderVoiceParts();
  }

  function ringOnce() {
    const c = S.call;
    if (!c) return;
    if (Date.now() - c.startedAt > CALL_TIMEOUT) {
      const f = friendByCode(c.friend);
      endCall(`${f ? f.name : 'Друг'} не отвечает`, true);
      return;
    }
    c.room.sendCall({ a: 'ring', id: c.id });
    BT.sound('ringback', true);
  }

  /** Закончить исходящий вызов, пока друг не взял трубку. */
  function endCall(reason, hangUp) {
    const c = S.call;
    if (!c) return;
    S.call = null;
    clearInterval(c.timer);
    c.room.sendCall({ a: 'cancel', id: c.id });
    if (reason) toast(reason);
    if (hangUp && S.inVoice && S.room === c.room) leaveVoice();
    renderVoiceParts();
  }

  function checkCallProgress() {
    const c = S.call;
    if (!c) return;
    const l = c.room.members()[0];
    if (l && l.state.voice) {
      S.call = null; // друг взял трубку
      clearInterval(c.timer);
      renderVoiceParts();
    }
  }

  function onCallSignal(room, link, data) {
    const f = friendOfRoom(room);
    if (!f || !data || typeof data.id !== 'string') return;
    const id = data.id.slice(0, 32);
    if (data.a === 'ring') {
      if (S.inVoice && S.room === room) {
        room.sendCall({ a: 'answer', id, ok: true });
        return;
      }
      if (S.incoming && S.incoming.id === id) {
        S.incoming.last = Date.now();
        return;
      }
      if (S.declinedCalls.has(id)) {
        room.sendCall({ a: 'answer', id, ok: false });
        return;
      }
      if (S.incoming) return; // уже кто-то звонит
      S.incoming = { id, friend: f.code, room, last: Date.now() };
      BT.audioCtx();
      ringTick();
      S.incoming.timer = setInterval(ringTick, 2600);
      notify('Звонок', `${f.name} звонит тебе в Болталке`);
      renderCallUI();
      updateTitle();
    } else if (data.a === 'cancel') {
      if (S.incoming && S.incoming.id === id) missedCall();
    } else if (data.a === 'answer') {
      if (S.call && S.call.id === id && !data.ok) endCall(`${f.name} не может ответить`, true);
    }
  }

  function ringTick() {
    const inc = S.incoming;
    if (!inc) return;
    if (Date.now() - inc.last > 9000) {
      missedCall();
      return;
    }
    BT.sound('ring', true);
  }

  function clearIncoming() {
    if (!S.incoming) return;
    clearInterval(S.incoming.timer);
    S.incoming = null;
    renderCallUI();
    updateTitle();
  }

  function missedCall() {
    const inc = S.incoming;
    if (!inc) return;
    const f = friendByCode(inc.friend);
    clearIncoming();
    toast(`Пропущенный звонок от ${f ? f.name : 'друга'}`);
  }

  async function acceptCall() {
    const inc = S.incoming;
    if (!inc) return;
    const f = friendByCode(inc.friend);
    clearIncoming();
    if (!f) return;
    openDM(f);
    const ok = await joinVoice();
    inc.room.sendCall({ a: 'answer', id: inc.id, ok: !!ok });
  }

  function declineCall() {
    const inc = S.incoming;
    if (!inc) return;
    S.declinedCalls.add(inc.id);
    inc.room.sendCall({ a: 'answer', id: inc.id, ok: false });
    clearIncoming();
  }

  function renderCallUI() {
    const ov = $('callOverlay');
    const inc = S.incoming;
    const incF = inc && friendByCode(inc.friend);
    if (!incF) {
      ov.hidden = true;
      ov.innerHTML = '';
    } else if (ov.dataset.id !== inc.id || ov.hidden) {
      ov.dataset.id = inc.id;
      ov.hidden = false;
      ov.innerHTML = `
        <div class="call-card" role="alertdialog" aria-label="Входящий звонок">
          <div class="call-ava">${avatarHtml(incF.name, incF.color, 'xl')}</div>
          <div class="call-name">${esc(incF.name)}</div>
          <div class="call-sub">звонит тебе…</div>
          <div class="call-btns">
            <button class="round hang" id="callDecline" title="Отклонить" aria-label="Отклонить">${icon('hangup')}</button>
            <button class="round accept" id="callAccept" title="Принять" aria-label="Принять">${icon('phone')}</button>
          </div>
        </div>`;
      $('callDecline').onclick = declineCall;
      $('callAccept').onclick = acceptCall;
    }
    const banner = $('callBanner');
    const c = S.call;
    const cf = c && friendByCode(c.friend);
    if (!cf || S.room !== c.room) {
      banner.hidden = true;
      banner.innerHTML = '';
    } else {
      banner.hidden = false;
      banner.innerHTML = `<div class="cb-ava">${avatarHtml(cf.name, cf.color, 'sm')}</div><div class="cb-text">Звоним <b>${esc(cf.name)}</b>…</div><button class="btn danger sm" id="cbCancel">${icon('hangup')} Отменить</button>`;
      $('cbCancel').onclick = () => endCall('', true);
    }
  }

  /* =====================================================================
   * Отрисовка
   * ===================================================================== */
  function avatarHtml(name, color, extra, speakKey) {
    return `<div class="avatar${extra ? ' ' + extra : ''}" style="--c:${safeColor(color)}"${speakKey ? ` data-speak="${esc(speakKey)}"` : ''}>${esc(BT.initials(name))}</div>`;
  }

  const totalDmUnread = () => Object.values(S.dmUnread).reduce((a, b) => a + (Number(b) || 0), 0);
  const homeSide = () => S.home || !S.room || !!S.room.dm;

  function renderRail() {
    const homeBadge = totalDmUnread() + S.requests.length;
    const rooms = S.rooms
      .map((r) => {
        const active = !S.home && S.room && S.room.code === r.code;
        const badge = S.room && S.room.code === r.code && S.unread && (S.home || S.view !== 'chat') ? `<span class="rail-badge">${S.unread > 99 ? '99+' : S.unread}</span>` : '';
        return `<button class="rail-room${active ? ' active' : ''}" data-code="${esc(r.code)}" style="--c:${BT.colorFor(r.code)}" title="${esc(r.name)}" aria-label="Комната ${esc(r.name)}">
          <span>${esc(BT.initials(r.name))}</span>${badge}
        </button>`;
      })
      .join('');
    $('rail').innerHTML = `
      <button class="rail-logo${homeSide() ? ' active' : ''}" id="railHome" title="Друзья и личные сообщения" aria-label="Друзья"><svg viewBox="12 10 40 42"><path d="M18 22a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H31l-8 7v-7h-1a4 4 0 0 1-4-4z" fill="currentColor"/></svg>${homeBadge ? `<span class="rail-badge">${homeBadge > 99 ? '99+' : homeBadge}</span>` : ''}</button>
      <div class="rail-sep"></div>
      ${rooms}
      <button class="rail-add" id="railAdd" title="Добавить друга или комнату" aria-label="Добавить">${icon('plus')}</button>`;
    $('railHome').addEventListener('click', goHome);
    $('rail').querySelectorAll('.rail-room').forEach((b) =>
      b.addEventListener('click', () => {
        selectRoom(b.dataset.code, true);
        closeDrawer();
      })
    );
    $('railAdd').addEventListener('click', (e) => addMenu(e.currentTarget));
  }

  function statusLine() {
    const room = S.room;
    if (!room) return { cls: 'off', text: '' };
    const n = room.members().length;
    const connecting = room.connecting();
    switch (room.status) {
      case 'online':
        if (n) return { cls: 'ok', text: `В сети: ${n + 1}` };
        if (connecting.length) return { cls: 'warn', text: `Нашли ${connecting[0]}, соединяемся…` };
        return { cls: 'ok', text: 'Ты тут один — позови друга' };
      case 'reconnecting':
        return { cls: 'warn', text: 'Связь пропала, переподключаемся…' };
      case 'offline':
        return { cls: 'bad', text: 'Нет связи с серверами знакомств' };
      default:
        return { cls: 'warn', text: 'Подключаемся…' };
    }
  }

  function friendStatus(f) {
    const room = S.dm.get(f.code);
    const link = friendLink(f);
    if (link) return { on: true, text: link.state.voice ? 'в звонке' : 'в сети' };
    if (room && room.connecting().length) return { on: false, text: 'соединяемся…' };
    if (!f.confirmed) return { on: false, text: 'ждём, когда друг примет заявку' };
    return { on: false, text: f.lastSeen ? 'был(а) ' + BT.ago(f.lastSeen) : 'не в сети' };
  }

  function sortedFriends() {
    return [...S.friends].sort(
      (a, b) => Number(friendOnline(b)) - Number(friendOnline(a)) || (b.lastSeen || 0) - (a.lastSeen || 0) || a.name.localeCompare(b.name)
    );
  }

  const bootAt = Date.now();
  function hubStatus() {
    if (S.hub && S.hub.ready) {
      const n = S.friends.filter(friendOnline).length;
      return { cls: 'ok', text: n ? `Друзей в сети: ${n}` : 'Ты в сети' };
    }
    return Date.now() - bootAt > 15000 ? { cls: 'bad', text: 'Нет связи с серверами знакомств' } : { cls: 'warn', text: 'Подключаемся…' };
  }

  function renderSideHead() {
    if (homeSide()) {
      const st = hubStatus();
      $('sideHead').innerHTML = `
        <button class="room-title" id="sideFind">${icon('userPlus')}<span class="rt-name">Добавить друга</span></button>
        <div class="room-status ${st.cls}"><span class="dot"></span>${esc(st.text)}</div>`;
      $('sideFind').addEventListener('click', () => addFriendModal());
      return;
    }
    const rec = roomRec();
    if (!rec) {
      $('sideHead').innerHTML = '';
      return;
    }
    const st = statusLine();
    $('sideHead').innerHTML = `
      <button class="room-title" id="roomMenuBtn" aria-haspopup="menu">
        <span class="rt-name">${esc(rec.name)}</span>${icon('chevron', 'rt-chev')}
      </button>
      <div class="room-status ${st.cls}"><span class="dot"></span>${esc(st.text)}</div>`;
    $('roomMenuBtn').addEventListener('click', (e) => roomMenu(e.currentTarget));
  }

  function voiceList() {
    const list = [];
    if (S.inVoice) list.push({ key: 'me', me: true, name: S.profile.name, color: S.profile.color, state: { voice: true, muted: S.prefs.muted, deaf: S.prefs.deaf, video: S.videoKind } });
    for (const l of members()) {
      if (l.state.voice) list.push({ key: l.id, link: l, name: l.info.name, color: l.info.color, state: l.state });
    }
    return list;
  }

  function stateIcons(st) {
    let s = '';
    if (st.video === 'screen') s += '<span class="tag live" title="Показывает экран">В ЭФИРЕ</span>';
    else if (st.video === 'camera') s += `<span class="st" title="Камера включена">${icon('camera')}</span>`;
    if (st.deaf) s += `<span class="st off" title="Звук выключен">${icon('headphonesOff')}</span>`;
    else if (st.muted) s += `<span class="st off" title="Микрофон выключен">${icon('micOff')}</span>`;
    return s;
  }

  function renderDmList() {
    const curF = curFriend();
    const friends = sortedFriends();
    $('channels').innerHTML = `
      <button class="chan${S.home ? ' active' : ''}" id="chanHome">${icon('users')}<span>Друзья</span>${S.requests.length ? `<span class="badge">${S.requests.length}</span>` : ''}</button>
      <div class="cat">Личные сообщения</div>
      ${
        friends.length
          ? friends
              .map((f) => {
                const st = friendStatus(f);
                const unread = S.dmUnread[f.code] || 0;
                return `<button class="dm-row${curF && curF.code === f.code ? ' active' : ''}${unread ? ' unread' : ''}" data-code="${esc(f.code)}">
                  <div class="avatar-wrap">${avatarHtml(f.name, f.color, 'sm')}<span class="presence ${st.on ? 'on' : ''}"></span></div>
                  <div class="dm-text"><div class="dm-name">${esc(f.name)}</div><div class="dm-sub">${esc(st.text)}</div></div>
                  ${unread ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : ''}
                </button>`;
              })
              .join('')
          : '<p class="side-empty">Здесь появятся друзья. Нажми «Добавить друга» вверху.</p>'
      }`;
    $('chanHome').addEventListener('click', goHome);
    $('channels').querySelectorAll('.dm-row').forEach((b) => b.addEventListener('click', () => openDM(friendByCode(b.dataset.code))));
  }

  function renderChannels() {
    if (homeSide()) {
      renderDmList();
      return;
    }
    const voice = voiceList();
    const badge = S.unread && S.view !== 'chat' ? `<span class="badge">${S.unread > 99 ? '99+' : S.unread}</span>` : '';
    $('channels').innerHTML = `
      <div class="cat">Текстовые каналы</div>
      <button class="chan${S.view === 'chat' ? ' active' : ''}${S.unread && S.view !== 'chat' ? ' unread' : ''}" data-view="chat">${icon('hash')}<span>чат</span>${badge}</button>
      <div class="cat">Голосовые каналы</div>
      <button class="chan${S.view === 'voice' ? ' active' : ''}" data-view="voice" title="${S.inVoice ? 'Открыть голосовой канал' : 'Войти в голосовой канал'}">${icon('speaker')}<span>Голосовой</span>${voice.length ? `<span class="count">${voice.length}</span>` : ''}</button>
      <div class="voice-users">
        ${voice
          .map(
            (p) => `<button class="vu" data-key="${esc(p.key)}"${p.me ? ' disabled' : ''}>
              ${avatarHtml(p.name, p.color, 'xs', p.key)}
              <span class="vu-name">${esc(p.name)}</span>
              <span class="vu-icons">${stateIcons(p.state)}</span>
            </button>`
          )
          .join('')}
      </div>`;
    $('channels').querySelectorAll('.chan').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.view === 'voice' && !S.inVoice) joinVoice();
        setView(b.dataset.view);
        closeDrawer();
      })
    );
    $('channels').querySelectorAll('.vu:not([disabled])').forEach((b) =>
      b.addEventListener('click', () => {
        const l = S.room && S.room.links.get(b.dataset.key);
        if (l) userPopover(b, l);
      })
    );
    paintSpeaking();
  }

  function userPopover(anchor, link) {
    const uid = link.info.uid;
    const v = Math.round(volFor(uid) * 100);
    popover(
      anchor,
      `<div class="user-pop">
        <div class="up-head">${avatarHtml(link.info.name, link.info.color, 'sm')}<b>${esc(link.info.name)}</b></div>
        <label class="field"><span>Громкость: <output id="upOut">${v}%</output></span>
        <input type="range" min="0" max="100" step="1" value="${v}" id="upVol"></label>
      </div>`,
      (pop) => {
        const range = pop.querySelector('#upVol');
        range.addEventListener('input', () => {
          S.prefs.vol[uid] = Number(range.value) / 100;
          pop.querySelector('#upOut').textContent = range.value + '%';
          syncAudio();
        });
        range.addEventListener('change', savePrefs);
      }
    );
  }

  function voiceHealth() {
    const peers = voiceList().filter((p) => p.link);
    if (!peers.length) return { cls: 'ok', text: S.call ? 'Звоним…' : 'Подключено' };
    const states = peers.map((p) => p.link.mediaState);
    if (states.every((s) => s === 'connected')) return { cls: 'ok', text: 'Подключено' };
    if (states.some((s) => s === 'failed')) return { cls: 'bad', text: 'Нет соединения' };
    return { cls: 'warn', text: 'Соединение…' };
  }

  function renderVoiceBar() {
    const bar = $('voiceBar');
    if (!S.inVoice && !S.joining) {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    bar.hidden = false;
    const h = S.joining ? { cls: 'warn', text: 'Подключение…' } : voiceHealth();
    const rec = roomRec();
    bar.innerHTML = `
      <button class="vb-info" id="vbOpen" title="Открыть">
        <div class="vb-status ${h.cls}">${icon('signal')}<span>${esc(h.text)}</span></div>
        <div class="vb-sub">${rec && rec.dm ? 'Звонок' : 'Голосовой'} / ${esc(rec ? rec.name : '')}</div>
      </button>
      <div class="vb-btns">
        <button class="icon-btn${S.videoKind === 'camera' ? ' on' : ''}" id="vbCam" title="${S.videoKind === 'camera' ? 'Выключить камеру' : 'Включить камеру'}" aria-label="Камера"${S.inVoice ? '' : ' disabled'}>${icon('camera')}</button>
        ${canShareScreen() ? `<button class="icon-btn${S.videoKind === 'screen' ? ' on' : ''}" id="vbScreen" title="${S.videoKind === 'screen' ? 'Перестать показывать экран' : 'Показать экран'}" aria-label="Экран"${S.inVoice ? '' : ' disabled'}>${icon('screen')}</button>` : ''}
        <button class="icon-btn hang" id="vbLeave" title="Отключиться" aria-label="Отключиться"${S.inVoice ? '' : ' disabled'}>${icon('hangup')}</button>
      </div>`;
    $('vbOpen').addEventListener('click', () => {
      if (!S.room) return;
      S.home = false;
      S.view = 'voice';
      renderAll();
      closeDrawer();
    });
    $('vbCam').addEventListener('click', toggleCamera);
    if ($('vbScreen')) $('vbScreen').addEventListener('click', toggleScreen);
    $('vbLeave').addEventListener('click', () => leaveVoice());
  }

  function renderMeBar() {
    if (!S.profile || !S.profile.code) return;
    const online = !!(S.hub && S.hub.ready);
    const st = S.inVoice ? 'В звонке' : online ? 'В сети' : 'Не в сети';
    const micOff = S.prefs.muted || S.prefs.deaf;
    $('meBar').innerHTML = `
      <button class="me-info" id="meInfo" title="Твой код друга">
        <div class="avatar-wrap">${avatarHtml(S.profile.name, S.profile.color, 'sm', 'me')}<span class="presence ${online ? 'on' : ''}"></span></div>
        <div class="me-text"><div class="me-name">${esc(S.profile.name)}</div><div class="me-sub">${esc(st)} · ${esc(fmtCode(S.profile.code))}</div></div>
      </button>
      <button class="icon-btn${micOff ? ' danger' : ''}" id="meMic" title="${micOff ? 'Включить микрофон' : 'Выключить микрофон'} (Ctrl+Shift+M)" aria-label="Микрофон" aria-pressed="${micOff}">${icon(micOff ? 'micOff' : 'mic')}</button>
      <button class="icon-btn${S.prefs.deaf ? ' danger' : ''}" id="meDeaf" title="${S.prefs.deaf ? 'Включить звук' : 'Выключить звук'} (Ctrl+Shift+D)" aria-label="Звук" aria-pressed="${S.prefs.deaf}">${icon(S.prefs.deaf ? 'headphonesOff' : 'headphones')}</button>
      <button class="icon-btn" id="meSettings" title="Настройки" aria-label="Настройки">${icon('settings')}</button>`;
    $('meMic').addEventListener('click', toggleMute);
    $('meDeaf').addEventListener('click', toggleDeaf);
    $('meSettings').addEventListener('click', settingsModal);
    $('meInfo').addEventListener('click', myCodeModal);
    paintSpeaking();
  }

  function renderMainHead() {
    const head = $('mainHead');
    const anyBadge = totalDmUnread() + S.requests.length + (S.unread && S.view !== 'chat' ? 1 : 0);
    const menuBtn = `<button class="icon-btn menu-btn" id="menuBtn" aria-label="Меню">${icon('menu')}${anyBadge ? '<span class="dot-badge"></span>' : ''}</button>`;
    if (S.home || !S.room) {
      head.innerHTML = `${menuBtn}<div class="mh-title">${icon('users', 'mh-ic')}<span>Друзья</span></div>
        <div class="mh-actions"><button class="btn primary sm" id="mhAddFriend">${icon('userPlus')} <span class="hide-xs">Добавить друга</span></button></div>`;
      $('mhAddFriend').addEventListener('click', () => addFriendModal());
    } else {
      const chat = S.view === 'chat';
      const f = curFriend();
      if (f) {
        const st = friendStatus(f);
        const inCall = S.inVoice;
        head.innerHTML = `
          ${menuBtn}
          <div class="mh-title"><div class="avatar-wrap">${avatarHtml(f.name, f.color, 'xs')}<span class="presence sm ${st.on ? 'on' : ''}"></span></div><span class="mh-name">${esc(f.name)}</span></div>
          <div class="mh-topic">${esc(st.text)}</div>
          <div class="mh-actions">
            ${
              inCall
                ? chat
                  ? `<button class="icon-btn" id="mhVoice" title="Открыть звонок" aria-label="Открыть звонок">${icon('speaker')}</button>`
                  : `<button class="icon-btn" id="mhChat" title="Открыть переписку" aria-label="Переписка">${icon('chat')}</button>`
                : `<button class="btn call-btn sm" id="mhCall" title="Позвонить">${icon('phone')} <span class="hide-xs">Позвонить</span></button>`
            }
            <button class="icon-btn" id="mhMore" title="Ещё" aria-label="Ещё">${icon('more')}</button>
          </div>`;
        if ($('mhCall')) $('mhCall').addEventListener('click', () => startCall(f));
        if ($('mhVoice')) $('mhVoice').addEventListener('click', () => setView('voice'));
        if ($('mhChat')) $('mhChat').addEventListener('click', () => setView('chat'));
        $('mhMore').addEventListener('click', (e) => friendMenu(e.currentTarget, f));
      } else {
        head.innerHTML = `
          ${menuBtn}
          <div class="mh-title">${icon(chat ? 'hash' : 'speaker', 'mh-ic')}<span>${chat ? 'чат' : 'Голосовой'}</span></div>
          <div class="mh-topic">${chat ? 'Сообщения идут напрямую друзьям' : S.inVoice ? 'Ты в голосовом канале' : 'Нажми «Присоединиться», чтобы говорить'}</div>
          <div class="mh-actions">
            ${chat ? `<button class="icon-btn" id="mhVoice" title="${S.inVoice ? 'Открыть голосовой' : 'Войти в голосовой канал'}" aria-label="Голосовой канал">${icon('speaker')}</button>` : `<button class="icon-btn" id="mhChat" title="Открыть чат" aria-label="Чат">${icon('hash')}${S.unread ? '<span class="dot-badge"></span>' : ''}</button>`}
            <button class="icon-btn" id="mhInvite" title="Пригласить друга" aria-label="Пригласить друга">${icon('link')}</button>
            <button class="icon-btn${membersVisible() ? ' on' : ''}" id="mhMembers" title="Участники" aria-label="Участники">${icon('users')}</button>
          </div>`;
        $('mhInvite').addEventListener('click', () => inviteModal(roomRec()));
        $('mhMembers').addEventListener('click', toggleMembers);
        if ($('mhVoice'))
          $('mhVoice').addEventListener('click', () => {
            if (!S.inVoice) joinVoice();
            setView('voice');
          });
        if ($('mhChat')) $('mhChat').addEventListener('click', () => setView('chat'));
      }
    }
    $('menuBtn').addEventListener('click', openDrawer);
  }

  function renderBanner() {
    const b = $('banner');
    let html = '';
    if (!window.isSecureContext) {
      html = 'Открой Болталку по адресу с <b>https://</b> — иначе браузер не даст микрофон.';
    } else if (inAppBrowser()) {
      html = 'Болталка открыта внутри приложения (Telegram, VK…). Открой ссылку в обычном браузере — Chrome, Safari или Яндекс, иначе связь и микрофон могут не работать.';
    } else if (!window.RTCPeerConnection) {
      html = 'Этот браузер не поддерживает звонки (WebRTC). Открой Болталку в Chrome, Firefox, Edge или Safari.';
    } else if ((S.room && !S.home && S.room.status === 'offline') || (homeSide() && hubStatus().cls === 'bad')) {
      html = 'Не получается подключиться к серверам знакомств. Проверь интернет — мы пробуем снова. <button class="link-btn" id="bnDiag">Проверка связи</button>';
    }
    b.hidden = !html;
    b.innerHTML = html;
    if ($('bnDiag')) $('bnDiag').addEventListener('click', diagModal);
  }

  function introHtml() {
    const rec = roomRec();
    const f = curFriend();
    if (f) {
      return `
        <div class="intro">
          ${avatarHtml(f.name, f.color, 'xl')}
          <h2>${esc(f.name)}</h2>
          <p>Это начало вашей переписки. Код друга: <code>${esc(fmtCode(f.code))}</code></p>
          <button class="btn call-btn" data-act="call">${icon('phone')} Позвонить</button>
        </div>`;
    }
    const alone = !members().length;
    return `
      <div class="intro">
        <div class="intro-ic">${icon('hash')}</div>
        <h2>Это начало комнаты «${esc(rec ? rec.name : '')}»</h2>
        <p>Пиши сообщения здесь, а чтобы поговорить голосом — заходи в <b>Голосовой</b> канал слева.</p>
        ${alone ? `<button class="btn primary" data-act="invite">${icon('link')} Пригласить друга</button>` : ''}
      </div>`;
  }

  let renderedEmpty = false;
  function renderMessagesIfEmpty() {
    if (renderedEmpty && !S.home) renderMessages(false);
  }

  function renderMessages(forceBottom) {
    const box = $('messages');
    if (!S.room || S.home) return;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    const msgs = S.room.messages;
    renderedEmpty = !msgs.length;
    let html = introHtml();
    let prev = null;
    const lastPendingIdx = msgs.length && msgs[msgs.length - 1].pending ? msgs.length - 1 : -1;
    const f = curFriend();
    msgs.forEach((m, i) => {
      if (!prev || !BT.sameDay(prev.ts, m.ts)) html += `<div class="day"><span>${esc(BT.dayLabel(m.ts))}</span></div>`;
      const grouped = prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 60000 && BT.sameDay(prev.ts, m.ts);
      const body = `<div class="text${BT.isEmojiOnly(m.text) ? ' big' : ''}">${BT.linkify(m.text)}${m.pending ? `<span class="pend-ic" title="Ещё не доставлено">${icon('clock')}</span>` : ''}</div>`;
      const note =
        i === lastPendingIdx
          ? `<div class="pend-note">${f ? `${esc(f.name)} сейчас не в сети — сообщение доставится, когда вы оба будете онлайн.` : 'Сейчас в комнате никого нет — сообщение доставится, когда друг зайдёт.'}</div>`
          : '';
      const full = new Date(m.ts).toLocaleString('ru-RU');
      if (grouped) {
        html += `<div class="msg cont${m.pending ? ' pending' : ''}"><time class="side-time" title="${esc(full)}">${BT.time(m.ts)}</time><div class="msg-body">${body}${note}</div></div>`;
      } else {
        html += `<div class="msg${m.pending ? ' pending' : ''}">
          ${avatarHtml(m.name, m.color)}
          <div class="msg-body">
            <div class="msg-head"><span class="name" style="color:${safeColor(m.color)}">${esc(m.name)}</span><time title="${esc(full)}">${esc(BT.stamp(m.ts))}</time></div>
            ${body}${note}
          </div>
        </div>`;
      }
      prev = m;
    });
    box.innerHTML = html;
    const inv = box.querySelector('[data-act=invite]');
    if (inv) inv.addEventListener('click', () => inviteModal(roomRec()));
    const call = box.querySelector('[data-act=call]');
    if (call) call.addEventListener('click', () => startCall(curFriend()));
    if (forceBottom || nearBottom) box.scrollTop = box.scrollHeight;
  }

  function renderTyping() {
    const names = S.room && !S.home ? S.room.typingNames() : [];
    const el = $('typing');
    if (!names.length) {
      el.innerHTML = '';
      return;
    }
    const who = names.length === 1 ? `<b>${esc(names[0])}</b> печатает` : names.length === 2 ? `<b>${esc(names[0])}</b> и <b>${esc(names[1])}</b> печатают` : 'Несколько человек печатают';
    el.innerHTML = `<span class="dots"><i></i><i></i><i></i></span>${who}…`;
  }

  /* ---------- голосовой экран ---------- */
  function renderTiles() {
    const box = $('tiles');
    if (!S.room) {
      box.innerHTML = '';
      return;
    }
    const parts = voiceList();
    const keep = new Set(parts.map((p) => p.key));
    box.querySelectorAll('.tile').forEach((t) => {
      if (!keep.has(t.dataset.key)) t.remove();
    });
    const f = curFriend();
    const emptyKey = f ? 'dm' : 'room';
    let empty = box.querySelector('.tiles-empty');
    if (empty && (parts.length || empty.dataset.kind !== emptyKey)) {
      empty.remove();
      empty = null;
    }
    if (!parts.length && !empty) {
      box.insertAdjacentHTML(
        'beforeend',
        f
          ? `<div class="tiles-empty" data-kind="dm">${icon('phone', 'big-ic')}<h2>Звонок с ${esc(f.name)}</h2><p>Нажми «Позвонить» — у друга зазвонит Болталка.</p></div>`
          : `<div class="tiles-empty" data-kind="room">${icon('speaker', 'big-ic')}<h2>В голосовом канале пока никого</h2><p>Зайди первым — друг увидит тебя в списке и присоединится.</p></div>`
      );
    }

    parts.forEach((p, idx) => {
      let tile = box.querySelector(`.tile[data-key="${CSS.escape(p.key)}"]`);
      if (!tile) {
        tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.key = p.key;
        tile.innerHTML = `
          <video playsinline autoplay muted></video>
          <div class="tile-center"><div class="avatar xl"></div></div>
          <div class="tile-label"><span class="tl-name"></span><span class="tl-icons"></span></div>
          <div class="tile-note"></div>
          <button class="tile-full icon-btn" title="Во весь экран" aria-label="Во весь экран">${icon('expand')}</button>`;
        tile.querySelector('.tile-full').addEventListener('click', (e) => {
          e.stopPropagation();
          goFullscreen(tile);
        });
        tile.addEventListener('dblclick', () => goFullscreen(tile));
        tile.addEventListener('click', () => {
          const l = S.room && S.room.links.get(tile.dataset.key);
          if (l && !tile.classList.contains('has-video')) userPopover(tile.querySelector('.tl-name'), l);
        });
        box.appendChild(tile);
      }
      if (box.children[idx] !== tile) box.insertBefore(tile, box.children[idx] || null);
      const av = tile.querySelector('.avatar');
      av.style.setProperty('--c', safeColor(p.color));
      av.textContent = BT.initials(p.name);
      av.dataset.speak = p.key;
      tile.dataset.speak = p.key;
      tile.querySelector('.tl-name').textContent = p.me ? `${p.name} (ты)` : p.name;
      tile.querySelector('.tl-icons').innerHTML = stateIcons(p.state);

      let stream = null;
      let kind = null;
      if (p.me && S.video) {
        stream = S.video;
        kind = S.videoKind;
      } else if (!p.me && S.inVoice && p.state.video) {
        stream = p.link.streams.video;
        kind = p.state.video;
      }
      const v = tile.querySelector('video');
      if (v.srcObject !== stream) v.srcObject = stream;
      if (stream && v.paused) v.play().catch(() => {});
      tile.classList.toggle('has-video', !!stream);
      tile.classList.toggle('screen', kind === 'screen');
      v.classList.toggle('mirror', !!p.me && kind === 'camera');

      let note = '';
      if (!p.me && S.inVoice) {
        const st = p.link.mediaState;
        if (st === 'failed') note = 'Не удаётся соединиться';
        else if (st !== 'connected') note = 'Соединение…';
      }
      const n = tile.querySelector('.tile-note');
      n.textContent = note;
      n.hidden = !note;
      tile.classList.toggle('dim', !S.inVoice && !p.me);
    });
    box.dataset.count = String(Math.min(parts.length, 6));
    paintSpeaking();
  }

  function goFullscreen(tile) {
    const v = tile.querySelector('video');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (tile.requestFullscreen) tile.requestFullscreen().catch(() => {});
    else if (v && v.webkitEnterFullscreen && tile.classList.contains('has-video')) v.webkitEnterFullscreen();
  }

  function renderDock() {
    const dock = $('voiceDock');
    if (!S.room) {
      dock.innerHTML = '';
      return;
    }
    if (!S.inVoice) {
      const f = curFriend();
      if (f) {
        const fl = friendLink(f);
        const label = fl && fl.state.voice ? 'Присоединиться к звонку' : 'Позвонить';
        dock.innerHTML = `<button class="btn join" id="dockJoin"${S.joining ? ' disabled' : ''}>${icon('phone')} ${S.joining ? 'Подключаемся…' : label}</button>`;
        $('dockJoin').addEventListener('click', () => startCall(f));
      } else {
        dock.innerHTML = `<button class="btn join" id="dockJoin"${S.joining ? ' disabled' : ''}>${icon('speaker')} ${S.joining ? 'Подключаемся…' : 'Присоединиться к голосовому'}</button>`;
        $('dockJoin').addEventListener('click', joinVoice);
      }
      return;
    }
    const micOff = S.prefs.muted || S.prefs.deaf;
    dock.innerHTML = `
      <button class="round${micOff ? ' danger' : ''}" id="dkMic" title="${micOff ? 'Включить микрофон' : 'Выключить микрофон'}" aria-label="Микрофон">${icon(micOff ? 'micOff' : 'mic')}</button>
      <button class="round${S.prefs.deaf ? ' danger' : ''}" id="dkDeaf" title="${S.prefs.deaf ? 'Включить звук' : 'Выключить звук'}" aria-label="Звук">${icon(S.prefs.deaf ? 'headphonesOff' : 'headphones')}</button>
      <button class="round${S.videoKind === 'camera' ? ' on' : ''}" id="dkCam" title="Камера" aria-label="Камера">${icon(S.videoKind === 'camera' ? 'camera' : 'cameraOff')}</button>
      ${canShareScreen() ? `<button class="round${S.videoKind === 'screen' ? ' on' : ''}" id="dkScreen" title="Показать экран" aria-label="Показать экран">${icon('screen')}</button>` : ''}
      <button class="round hang" id="dkLeave" title="${S.call ? 'Отменить звонок' : 'Отключиться'}" aria-label="Отключиться">${icon('hangup')}</button>`;
    $('dkMic').addEventListener('click', toggleMute);
    $('dkDeaf').addEventListener('click', toggleDeaf);
    $('dkCam').addEventListener('click', toggleCamera);
    if ($('dkScreen')) $('dkScreen').addEventListener('click', toggleScreen);
    $('dkLeave').addEventListener('click', () => leaveVoice());
  }

  /** всё, что зависит от голосового состояния */
  function renderVoiceParts() {
    renderChannels();
    renderVoiceBar();
    renderMeBar();
    renderTiles();
    renderDock();
    renderMainHead();
    renderCallUI();
  }

  /** всё, что зависит от того, кто из друзей в сети */
  function renderFriendsBits() {
    if (homeSide()) {
      renderDmList();
      renderSideHead();
    }
    if (S.home) renderHome();
    else if (curFriend()) {
      renderMainHead();
      renderDock();
    }
    renderMeBar();
  }

  /* ---------- участники (групповые комнаты) ---------- */
  const isWide = () => window.matchMedia('(min-width: 1101px)').matches;
  function membersVisible() {
    return isWide() ? !S.prefs.membersHidden : app.classList.contains('members-open');
  }

  function toggleMembers() {
    if (isWide()) {
      S.prefs.membersHidden = !S.prefs.membersHidden;
      savePrefs();
      app.classList.toggle('members-hidden', S.prefs.membersHidden);
    } else {
      app.classList.toggle('members-open');
      app.classList.remove('drawer-open');
    }
    renderMainHead();
  }

  function renderMembers() {
    const box = $('members');
    if (!S.room || S.room.dm || S.home) {
      box.innerHTML = '';
      return;
    }
    const online = members();
    const onlineUids = new Set(online.map((l) => l.info.uid));
    onlineUids.add(S.profile.uid);
    const known = store.get('members.' + S.room.code, {});
    for (const m of S.room.messages) {
      if (m.uid === S.profile.uid) continue;
      const k = known[m.uid];
      if (!k || k.seen < m.ts) known[m.uid] = { name: m.name, color: m.color, seen: Math.max(m.ts, (k && k.seen) || 0) };
    }
    const offline = Object.entries(known)
      .filter(([uid]) => !onlineUids.has(uid))
      .sort((a, b) => b[1].seen - a[1].seen);
    const seenUid = new Set();
    const row = (name, color, sub, speakKey, cls, label) => `
      <div class="mem${cls ? ' ' + cls : ''}">
        <div class="avatar-wrap">${avatarHtml(name, color, 'sm', speakKey)}<span class="presence ${cls === 'off' ? '' : 'on'}"></span></div>
        <div class="mem-text"><div class="mem-name">${esc(label || name)}</div>${sub ? `<div class="mem-sub">${sub}</div>` : ''}</div>
      </div>`;
    let html = `<div class="mem-cat">В сети — ${online.length + 1}</div>`;
    html += row(S.profile.name, S.profile.color, S.inVoice ? `${icon('speaker')} в голосовом` : '', S.inVoice ? 'me' : '', '', S.profile.name + ' (ты)');
    for (const l of online) {
      if (seenUid.has(l.info.uid)) continue;
      seenUid.add(l.info.uid);
      html += row(l.info.name, l.info.color, l.state.voice ? `${icon('speaker')} в голосовом` : '', l.state.voice ? l.id : '', '');
    }
    if (offline.length) {
      html += `<div class="mem-cat">Не в сети — ${offline.length}</div>`;
      for (const [, k] of offline) html += row(k.name, k.color, esc('был(а) ' + BT.ago(k.seen)), '', 'off');
    }
    if (!online.length) {
      html += `<div class="mem-invite"><p>Позови друга — пришли ссылку на комнату.</p><button class="btn primary full" id="memInvite">${icon('link')} Пригласить</button></div>`;
    }
    box.innerHTML = html;
    if ($('memInvite')) $('memInvite').addEventListener('click', () => inviteModal(roomRec()));
    paintSpeaking();
  }

  /* ---------- страница «Друзья» ---------- */
  function renderHome() {
    const view = $('homeView');
    if (!S.profile || !S.profile.code) return;
    const typed = $('hmAddCode') ? $('hmAddCode').value : '';
    const hadFocus = document.activeElement && document.activeElement.id === 'hmAddCode';
    const friends = sortedFriends();
    const reqs = S.requests;
    const friendRow = (f) => {
      const st = friendStatus(f);
      const unread = S.dmUnread[f.code] || 0;
      return `<div class="f-row" data-code="${esc(f.code)}">
        <button class="f-main" data-act="open">
          <div class="avatar-wrap">${avatarHtml(f.name, f.color)}<span class="presence ${st.on ? 'on' : ''}"></span></div>
          <div class="f-text"><div class="f-name">${esc(f.name)}${unread ? ` <span class="badge">${unread}</span>` : ''}</div><div class="f-sub${st.on ? ' on' : ''}">${esc(st.text)}</div></div>
        </button>
        <button class="icon-btn" data-act="chat" title="Написать" aria-label="Написать">${icon('chat')}</button>
        <button class="icon-btn call" data-act="call" title="Позвонить" aria-label="Позвонить">${icon('phone')}</button>
        <button class="icon-btn" data-act="more" title="Ещё" aria-label="Ещё">${icon('more')}</button>
      </div>`;
    };
    view.innerHTML = `
      <div class="home-wrap">
        <section class="card me-card">
          ${avatarHtml(S.profile.name, S.profile.color, 'lg')}
          <div class="me-card-text">
            <div class="hint">Твой код друга</div>
            <div class="big-code">${esc(fmtCode(S.profile.code))}</div>
            <div class="hint">Дай его другу или отправь ссылку — он добавит тебя, и вы сможете переписываться и звонить.</div>
          </div>
          <div class="me-card-btns">
            <button class="btn primary" id="hmLink">${icon('link')} Ссылка для друга</button>
            <button class="btn ghost" id="hmCode">${icon('copy')} Код</button>
          </div>
        </section>

        <section class="card">
          <h3>Добавить друга</h3>
          <form class="add-form" id="hmAdd" autocomplete="off">
            <input id="hmAddCode" placeholder="Код друга, например ABCDE-FGHJK" spellcheck="false" aria-label="Код друга">
            <button class="btn primary" type="submit">${icon('userPlus')} Добавить</button>
          </form>
        </section>

        ${
          reqs.length
            ? `<section class="card"><h3>Заявки в друзья — ${reqs.length}</h3>
              ${reqs
                .map(
                  (r) => `<div class="f-row req" data-req="${esc(r.code)}">
                    <div class="f-main static">${avatarHtml(r.name, r.color)}<div class="f-text"><div class="f-name">${esc(r.name)}</div><div class="f-sub">хочет добавить тебя в друзья · ${esc(fmtCode(r.code))}</div></div></div>
                    <div class="req-btns"><button class="btn primary sm" data-act="accept">${icon('check')} Принять</button>
                    <button class="btn ghost sm" data-act="decline">Отклонить</button></div>
                  </div>`
                )
                .join('')}</section>`
            : ''
        }

        <section class="card">
          <h3>Друзья — ${friends.length}</h3>
          ${friends.length ? friends.map(friendRow).join('') : '<p class="hint">Пока никого. Добавь друга по коду или отправь ему свою ссылку.</p>'}
        </section>

        <section class="card">
          <h3>Комнаты</h3>
          <p class="hint">Комната — общий чат и голосовой канал для нескольких друзей сразу. Вход по ссылке-приглашению.</p>
          <div class="btn-row">
            <button class="btn ghost" id="hmCreate">${icon('plus')} Создать комнату</button>
            <button class="btn ghost" id="hmJoin">${icon('link')} Войти по ссылке</button>
          </div>
        </section>

        <div class="btn-row center">
          <button class="btn ghost" id="hmDiag">${icon('signal')} Проверка связи</button>
          ${'Notification' in window && Notification.permission === 'default' ? `<button class="btn ghost" id="hmNotif">${icon('bell')} Уведомления о звонках</button>` : ''}
        </div>
      </div>`;
    const addInput = $('hmAddCode');
    addInput.value = typed;
    if (hadFocus) addInput.focus();
    $('hmLink').onclick = () => copyWithToast(friendInviteLink(), 'Ссылка скопирована — отправь её другу');
    $('hmCode').onclick = () => copyWithToast(fmtCode(S.profile.code), 'Код скопирован');
    $('hmAdd').onsubmit = async (e) => {
      e.preventDefault();
      const raw = addInput.value;
      const h = parseHash(raw);
      const code = ident.parseCode(raw) || (h && h.friend);
      if (!code) {
        toast('Код — это 10 букв и цифр, например ABCDE-FGHJK', 'error');
        return;
      }
      addInput.value = '';
      await addFriend({ code, name: h && h.friend === code ? h.name : '' });
    };
    $('hmCreate').onclick = createRoomModal;
    $('hmJoin').onclick = joinModal;
    $('hmDiag').onclick = diagModal;
    if ($('hmNotif')) $('hmNotif').onclick = askNotifications;
    view.querySelectorAll('[data-req]').forEach((row) => {
      const code = row.dataset.req;
      row.querySelector('[data-act=accept]').onclick = () => acceptRequest(code);
      row.querySelector('[data-act=decline]').onclick = () => declineRequest(code);
    });
    view.querySelectorAll('.f-row[data-code]').forEach((row) => {
      const f = friendByCode(row.dataset.code);
      row.querySelector('[data-act=open]').onclick = () => openDM(f);
      row.querySelector('[data-act=chat]').onclick = () => openDM(f);
      row.querySelector('[data-act=call]').onclick = () => startCall(f);
      row.querySelector('[data-act=more]').onclick = (e) => friendMenu(e.currentTarget, f);
    });
  }

  function updateTitle() {
    if (S.incoming) {
      const f = friendByCode(S.incoming.friend);
      document.title = `📞 ${f ? f.name : 'Друг'} звонит — Болталка`;
      return;
    }
    const n = S.unread + totalDmUnread() + S.requests.length;
    const rec = !S.home && roomRec();
    document.title = (n ? `(${n}) ` : '') + (rec ? `${rec.name} — Болталка` : 'Болталка');
  }

  function setView(view) {
    S.view = view;
    if (view === 'chat' && !document.hidden) {
      S.unread = 0;
      const f = curFriend();
      if (f && S.dmUnread[f.code]) {
        delete S.dmUnread[f.code];
        saveDmUnread();
      }
    }
    $('chatView').hidden = view !== 'chat' || !S.room || S.home;
    $('voiceView').hidden = view !== 'voice' || !S.room || S.home;
    renderVoiceParts();
    renderRail();
    updateTitle();
    if (view === 'chat') {
      const box = $('messages');
      box.scrollTop = box.scrollHeight;
    }
  }

  function renderAll() {
    if (!S.room) S.home = true;
    const home = S.home;
    const f = curFriend();
    if (!home && S.view === 'chat' && !document.hidden) {
      S.unread = 0;
      if (f && S.dmUnread[f.code]) {
        delete S.dmUnread[f.code];
        saveDmUnread();
      }
    }
    app.classList.toggle('no-members', home || !!(S.room && S.room.dm));
    app.classList.toggle('members-hidden', !!S.prefs.membersHidden);
    $('homeView').hidden = !home;
    $('chatView').hidden = home || S.view !== 'chat';
    $('voiceView').hidden = home || S.view !== 'voice';
    $('input').placeholder = f ? `Написать ${f.name}` : 'Написать в #чат';
    renderRail();
    renderSideHead();
    renderVoiceParts();
    renderMembers();
    renderBanner();
    if (home) renderHome();
    else renderMessages(true);
    renderTyping();
    updateTitle();
  }

  /* ---------- мобильное меню ---------- */
  function openDrawer() {
    app.classList.add('drawer-open');
    app.classList.remove('members-open');
  }
  function closeDrawer() {
    app.classList.remove('drawer-open');
  }

  /* =====================================================================
   * Поле ввода
   * ===================================================================== */
  function initComposer() {
    const input = $('input');
    $('sendBtn').innerHTML = icon('send');
    let lastTyping = 0;
    const autosize = () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, Math.round(window.innerHeight * 0.35)) + 'px';
    };
    const send = () => {
      if (!S.room || S.home) return;
      const text = input.value;
      if (!text.trim()) return;
      if (text.length > BT.MAX_TEXT) {
        toast(`Слишком длинное сообщение (максимум ${BT.MAX_TEXT} символов)`, 'error');
        return;
      }
      BT.audioCtx();
      S.room.sendMessage(text);
      input.value = '';
      lastTyping = 0;
      autosize();
    };
    $('composer').addEventListener('submit', (e) => {
      e.preventDefault();
      send();
      if (!isNarrow()) input.focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !isNarrow()) {
        e.preventDefault();
        send();
      }
    });
    input.addEventListener('input', () => {
      autosize();
      const now = Date.now();
      if (S.room && input.value.trim() && now - lastTyping > 2500) {
        lastTyping = now;
        S.room.sendTyping();
      }
    });
  }

  /* =====================================================================
   * Запуск
   * ===================================================================== */
  function takeHash() {
    if (!location.hash) return null;
    const h = parseHash(location.href);
    if (h) history.replaceState(null, '', location.pathname + location.search);
    return h;
  }

  function handleHash(h) {
    if (!h) return false;
    if (h.friend) friendLinkPrompt(h);
    else acceptInvite(h);
    return true;
  }

  function initGlobalEvents() {
    $('scrim').addEventListener('click', () => {
      app.classList.remove('drawer-open', 'members-open');
      renderMainHead();
    });
    const wake = () => BT.audioCtx();
    document.addEventListener('pointerdown', wake, { once: true, capture: true });
    document.addEventListener('keydown', wake, { once: true, capture: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const back = document.querySelector('.modal-back');
        if (!$('popover').hidden) closePopover();
        else if (back && back.dataset.dismissable) closeModal();
        else closeDrawer();
      }
      const mod = e.ctrlKey || e.metaKey;
      const k = (e.key || '').toLowerCase();
      if (mod && e.shiftKey && (e.code === 'KeyM' || k === 'm' || k === 'ь')) {
        e.preventDefault();
        toggleMute();
      }
      if (mod && e.shiftKey && (e.code === 'KeyD' || k === 'd' || k === 'в')) {
        e.preventDefault();
        toggleDeaf();
      }
    });

    const wakeNet = () => {
      forEachRoom((r) => r.kick());
      if (S.hub) S.hub.brokers.forEach((b) => b.wake());
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (S.room && !S.home && S.view === 'chat') renderAll();
      wakeNet();
    });
    window.addEventListener('online', wakeNet);
    window.addEventListener('hashchange', () => handleHash(takeHash()));
    window.addEventListener('pagehide', () => {
      forEachRoom((r) => {
        saveMessagesNow(r);
        r.stop(); // друзья сразу видят, что ты вышел(-ла)
      });
    });
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) location.reload();
    });
    window.addEventListener('resize', () => {
      closePopover();
      if (isWide()) app.classList.remove('members-open');
      if (!isNarrow()) app.classList.remove('drawer-open');
    });
    setInterval(() => {
      // Напоминаем о себе тем, кого не видно в сети: друг мог ещё не принять заявку
      // или зайти с нового устройства, где нас пока нет в друзьях.
      if (S.hub && S.hub.ready)
        for (const f of S.friends) if (!friendOnline(f) && Date.now() - (f.reqAt || 0) > (f.confirmed ? 300000 : 30000)) sendReq(f);
      for (const f of S.friends) if (friendOnline(f)) f.lastSeen = Date.now();
      renderFriendsBits();
      if (S.room && !S.room.dm && !S.home) renderMembers();
    }, 30000);
    setInterval(() => {
      if (homeSide()) {
        renderSideHead();
        renderBanner();
      }
    }, 5000);
  }

  /** Пустой экран под окном регистрации. */
  function renderBlank() {
    app.classList.add('no-members');
    $('homeView').hidden = false;
    $('chatView').hidden = true;
    $('voiceView').hidden = true;
  }

  async function boot() {
    initComposer();
    initGlobalEvents();
    const h = takeHash();
    if (!S.profile || !S.profile.uid || !S.profile.name) {
      renderBlank();
      const ctx =
        h && h.friend
          ? `${esc(h.name || 'Друг')} зовёт тебя в друзья. Создай аккаунт — это займёт секунду.`
          : h && h.code
            ? `Тебя позвали в комнату «${esc(h.name || 'Комната')}». Создай аккаунт — это займёт секунду.`
            : '';
      await accountModal(ctx);
    }
    await migrateProfile();
    if (!BT.isColor(S.profile.color)) S.profile.color = BT.colorFor(S.profile.uid);
    for (const f of S.friends) {
      if (!f.dm) f.dm = await ident.dmCode(S.profile.code, f.code);
      f.reqAt = 0;
    }
    saveFriends();

    S.hub = new BT.Hub(S.profile.code);
    S.hub.on('request', onRequest);
    S.hub.on('ready', () => {
      // напоминаем друзьям о себе (так дружба восстановится и на новом устройстве)
      for (const f of S.friends) if (!friendOnline(f) && Date.now() - (f.reqAt || 0) > 60000) sendReq(f);
      renderSideHead();
      renderMeBar();
      renderBanner();
    });
    await S.hub.start();
    for (const f of S.friends) ensureDmRoom(f);

    if (handleHash(h)) {
      if (!S.room) renderAll();
      return;
    }
    const active = S.active && S.active !== 'home' ? recOf(S.active) : null;
    if (active) selectRoom(active.code);
    else renderAll();
  }

  // для отладки и автотестов
  window.__boltalka = { S, joinVoice, leaveVoice, toggleMute, toggleDeaf, toggleCamera, toggleScreen, startCall, acceptCall, declineCall, addFriend, openDM };

  boot();
})();
