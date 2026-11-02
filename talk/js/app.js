/* Болталка — интерфейс. */
(function () {
  'use strict';

  const BT = window.BT;
  const { store, esc, icon } = BT;
  const $ = (id) => document.getElementById(id);
  const app = $('app');

  const S = {
    profile: store.get('profile', null),
    rooms: store.get('rooms', []),
    active: store.get('active', null),
    prefs: Object.assign({ sounds: true, micId: '', muted: false, deaf: false, vol: {}, membersHidden: false }, store.get('prefs', {})),
    room: null,
    view: 'chat',
    unread: 0,
    inVoice: false,
    joining: false,
    mic: null,
    video: null,
    videoKind: null,
  };
  if (!S.prefs.vol || typeof S.prefs.vol !== 'object') S.prefs.vol = {};
  BT.soundsOn = !!S.prefs.sounds;

  const savePrefs = () => store.set('prefs', S.prefs);
  const saveRooms = () => store.set('rooms', S.rooms);
  const roomRec = () => (S.room ? S.rooms.find((r) => r.code === S.room.code) : null);
  const me = () => ({ uid: S.profile.uid, name: S.profile.name, color: S.profile.color });
  const members = () => (S.room ? S.room.members() : []);
  const safeColor = (c) => (BT.isColor(c) ? c : '#7c6cff');
  const isNarrow = () => window.matchMedia('(max-width: 760px)').matches;

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
    }, kind === 'error' ? 5000 : 3200);
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

  /**
   * actions: [{ label, kind: 'primary'|'ghost'|'danger', onClick(modalEl) → false, чтобы не закрывать }]
   */
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
    // Enter в однострочном поле = главная кнопка
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
    const focusable = box.querySelector('input:not([type=checkbox]), textarea, select, .btn.primary');
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
    let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
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

  /* =====================================================================
   * Профиль, комнаты, приглашения
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

  function profileModal(invite) {
    return new Promise((resolve) => {
      let color = BT.COLORS[Math.floor(Math.random() * BT.COLORS.length)];
      modal({
        title: 'Привет! Как тебя зовут?',
        sub: invite
          ? `Тебя позвали в комнату «${esc(invite.name || 'Комната')}». Введи имя — его увидят друзья. Регистрация не нужна.`
          : 'Это имя увидят друзья. Регистрация не нужна — всё хранится в этом браузере.',
        dismissable: false,
        body: `
          <div class="preview-row">
            <div class="avatar lg" id="pfAvatar" style="--c:${color}">?</div>
            <label class="field grow"><span>Имя</span><input id="pfName" maxlength="32" placeholder="Например, Саша" autocomplete="nickname"></label>
          </div>
          <div class="field"><span>Цвет</span>${swatchesHtml(color)}</div>`,
        actions: [
          {
            label: 'Продолжить',
            kind: 'primary',
            onClick: (box) => {
              const input = box.querySelector('#pfName');
              const name = input.value.trim().slice(0, 32);
              if (!name) {
                input.classList.add('bad');
                input.focus();
                return false;
              }
              S.profile = { uid: BT.uid(), name, color };
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
          setTimeout(() => input.focus(), 50);
        },
      });
    });
  }

  function validServer(u) {
    try {
      const x = new URL(u);
      return x.protocol === 'https:' || x.protocol === 'http:';
    } catch (e) {
      return false;
    }
  }

  function parseInvite(input) {
    const s = String(input || '').trim();
    if (!s) return null;
    if (BT.CODE_RE.test(s.toLowerCase())) return { code: s.toLowerCase(), name: '', server: '' };
    const i = s.indexOf('#');
    if (i < 0) return null;
    const p = new URLSearchParams(s.slice(i + 1));
    const code = (p.get('join') || '').toLowerCase();
    if (!BT.CODE_RE.test(code)) return null;
    const server = p.get('s') || '';
    return { code, name: (p.get('name') || '').trim().slice(0, 40), server: validServer(server) ? server : '' };
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
      sub: 'Комната — это ваш общий уголок: текстовый чат и голосовой канал. После создания получишь ссылку для друга.',
      body: `
        <label class="field"><span>Название</span><input id="crName" maxlength="40" value="Наша комната" placeholder="Например, Мы с Сашей"></label>
        <details class="advanced">
          <summary>Дополнительно</summary>
          <label class="field"><span>Свой сервер связи PeerJS (необязательно)</span>
          <input id="crServer" placeholder="https://my-peer-server.example.com/" inputmode="url"></label>
          <p class="hint">По умолчанию используется бесплатный сервер 0.peerjs.com. Адрес попадёт в ссылку-приглашение, так что у друга будет тот же.</p>
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
      onMount: (box) => {
        const input = box.querySelector('#crName');
        setTimeout(() => input.select(), 40);
      },
    });
  }

  function joinModal() {
    modal({
      title: 'Войти по ссылке',
      sub: 'Вставь ссылку-приглашение, которую прислал друг (или код комнаты).',
      body: '<label class="field"><span>Ссылка или код</span><input id="jnLink" placeholder="https://…#join=…" autocomplete="off"></label><p class="hint error" id="jnErr" hidden>Не похоже на приглашение. Попроси друга скопировать ссылку ещё раз.</p>',
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Войти',
          kind: 'primary',
          onClick: (box) => {
            const inv = parseInvite(box.querySelector('#jnLink').value);
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
    const canShare = !!navigator.share;
    modal({
      title: fresh ? 'Комната готова! Позови друга' : 'Пригласить друга',
      sub: 'Отправь эту ссылку другу в любой мессенджер. Кто откроет ссылку — попадёт в комнату. Не публикуй её в открытом доступе.',
      body: `
        <div class="invite">
          <input id="invLink" readonly value="${esc(link)}" aria-label="Ссылка-приглашение">
          <button type="button" class="btn primary" id="invCopy">${icon('copy')} Копировать</button>
        </div>
        ${canShare ? `<button type="button" class="btn ghost full" id="invShare">${icon('share')} Поделиться…</button>` : ''}
        <p class="hint">Код комнаты: <code>${esc(rec.code)}</code>${rec.server ? ` · сервер связи: <code>${esc(rec.server)}</code>` : ''}</p>`,
      actions: [{ label: 'Готово', kind: 'primary' }],
      onMount: (box) => {
        const input = box.querySelector('#invLink');
        input.addEventListener('focus', () => input.select());
        box.querySelector('#invCopy').addEventListener('click', async () => {
          const ok = await copyText(link);
          toast(ok ? 'Ссылка скопирована — отправь её другу' : 'Не получилось скопировать, выдели ссылку вручную', ok ? '' : 'error');
          if (!ok) input.select();
        });
        const sh = box.querySelector('#invShare');
        if (sh)
          sh.addEventListener('click', () => {
            navigator.share({ title: 'Болталка', text: `Залетай поболтать в «${rec.name}»`, url: link }).catch(() => {});
          });
      },
    });
  }

  function renameRoomModal() {
    const rec = roomRec();
    if (!rec) return;
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
    if (!rec) return;
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
    const next = S.rooms[S.rooms.length - 1];
    S.active = null;
    if (next) selectRoom(next.code);
    else {
      store.del('active');
      renderAll();
    }
  }

  function addRoomMenu(anchor) {
    popover(
      anchor,
      `<div class="menu">
        <button data-act="create">${icon('plus')} Создать комнату</button>
        <button data-act="join">${icon('link')} Войти по ссылке</button>
      </div>`,
      (pop) => {
        pop.querySelector('[data-act=create]').onclick = () => {
          closePopover();
          createRoomModal();
        };
        pop.querySelector('[data-act=join]').onclick = () => {
          closePopover();
          joinModal();
        };
      }
    );
  }

  function roomMenu(anchor) {
    popover(
      anchor,
      `<div class="menu">
        <button data-act="invite">${icon('link')} Пригласить друга</button>
        <button data-act="rename">${icon('pencil')} Переименовать</button>
        <div class="menu-sep"></div>
        <button data-act="leave" class="danger">${icon('door')} Покинуть комнату</button>
      </div>`,
      (pop) => {
        pop.querySelector('[data-act=invite]').onclick = () => {
          closePopover();
          inviteModal(roomRec());
        };
        pop.querySelector('[data-act=rename]').onclick = () => {
          closePopover();
          renameRoomModal();
        };
        pop.querySelector('[data-act=leave]').onclick = () => {
          closePopover();
          leaveRoom();
        };
      }
    );
  }

  /* =====================================================================
   * Настройки
   * ===================================================================== */
  async function settingsModal() {
    let color = S.profile.color;
    let mics = [];
    try {
      mics = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
    } catch (e) {}
    const micOptions = [`<option value="">По умолчанию</option>`]
      .concat(
        mics
          .filter((d) => d.deviceId && d.deviceId !== 'default')
          .map((d, i) => `<option value="${esc(d.deviceId)}"${d.deviceId === S.prefs.micId ? ' selected' : ''}>${esc(d.label || 'Микрофон ' + (i + 1))}</option>`)
      )
      .join('');
    modal({
      title: 'Настройки',
      wide: true,
      body: `
        <div class="preview-row">
          <div class="avatar lg" id="stAvatar" style="--c:${safeColor(color)}">${esc(BT.initials(S.profile.name))}</div>
          <label class="field grow"><span>Твоё имя</span><input id="stName" maxlength="32" value="${esc(S.profile.name)}"></label>
        </div>
        <div class="field"><span>Цвет</span>${swatchesHtml(color)}</div>
        <label class="field"><span>Микрофон</span><select id="stMic">${micOptions}</select></label>
        ${mics.length && !mics.some((d) => d.label) ? '<p class="hint">Названия микрофонов появятся после первого входа в голосовой канал.</p>' : ''}
        <label class="check"><input type="checkbox" id="stSounds"${S.prefs.sounds ? ' checked' : ''}> Звуки: новые сообщения, вход и выход из голосового</label>
        <details class="advanced">
          <summary>Как это работает</summary>
          <p class="hint">Болталка не хранит ничего на сервере. Звук, видео и сообщения идут напрямую между браузерами (WebRTC). Сервер связи PeerJS только помогает вам найти друг друга. Если напрямую не выходит, звук идёт через TURN-сервер PeerJS.</p>
          <p class="hint">История чата хранится в браузере у каждого участника. Если отправить сообщение, когда в комнате никого нет, оно уйдёт другу, когда вы оба окажетесь онлайн.</p>
          <p class="hint">Горячие клавиши: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> — микрофон, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> — звук.</p>
        </details>
        ${S.room ? '<button type="button" class="btn danger-ghost full" id="stClear">Очистить историю чата в этой комнате</button>' : ''}`,
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
            if (changed && S.room) S.room.setUser(me());
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
        const clear = box.querySelector('#stClear');
        if (clear)
          clear.addEventListener('click', async () => {
            const ok = await confirmBox('Очистить историю?', 'Сообщения удалятся только у тебя. У друга они останутся и могут вернуться при следующей встрече.', 'Очистить', true);
            if (ok && S.room) {
              S.room.clearHistory();
              toast('История очищена');
            }
          });
      },
    });
  }

  /* =====================================================================
   * Выбор комнаты и события сети
   * ===================================================================== */
  let saveTimer = null;
  function saveMessagesSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveMessagesNow, 400);
  }
  function saveMessagesNow() {
    clearTimeout(saveTimer);
    if (S.room) store.set('msgs.' + S.room.code, S.room.messages);
  }

  function remember(info, seen) {
    if (!S.room || !info || info.uid === S.profile.uid) return;
    const key = 'members.' + S.room.code;
    const known = store.get(key, {});
    known[info.uid] = { name: info.name, color: info.color, seen: seen || Date.now() };
    store.set(key, known);
  }

  function selectRoom(code, focusChat) {
    if (S.room && S.room.code === code) {
      if (focusChat) setView('chat');
      return;
    }
    const rec = S.rooms.find((r) => r.code === code);
    if (S.inVoice) leaveVoice(true);
    if (S.room) {
      saveMessagesNow();
      S.room.stop();
      S.room = null;
    }
    syncAudio();
    S.active = rec ? rec.code : null;
    S.unread = 0;
    S.view = 'chat';
    if (!rec) {
      store.del('active');
      renderAll();
      return;
    }
    store.set('active', rec.code);
    const room = new BT.Room({ code: rec.code, server: rec.server, me: me(), messages: store.get('msgs.' + rec.code, []) });
    S.room = room;
    room.local.muted = S.prefs.muted;
    room.local.deaf = S.prefs.deaf;

    room.on('status', () => {
      renderSideHead();
      renderBanner();
      renderMeBar();
      renderMembers();
    });
    room.on('peers', () => {
      for (const l of room.members()) remember(l.info);
      renderVoiceParts();
      renderMembers();
      renderSideHead();
      renderMessagesIfEmpty();
      syncAudio();
    });
    const startedAt = Date.now();
    room.on('peer-joined', (link) => {
      if (Date.now() - startedAt < 6000) return; // те, кто уже был в комнате, когда мы вошли
      toast(`${link.info.name} в сети`);
      BT.sound('online');
    });
    room.on('peer-left', (link) => {
      remember(link.info);
      toast(`${link.info.name} не в сети`);
      if (S.inVoice && link.state.voice) BT.sound('leave');
    });
    room.on('peer-state', ({ link, before }) => {
      if (S.inVoice && before.voice !== link.state.voice) BT.sound(link.state.voice ? 'join' : 'leave');
    });
    room.on('messages', (ev) => {
      saveMessagesSoon();
      renderMessages(ev.own);
      if (ev.cleared || !ev.added || !ev.added.length) return;
      const foreign = ev.added.filter((m) => m.uid !== S.profile.uid);
      if (!foreign.length) return;
      const seeing = !document.hidden && S.view === 'chat';
      if (!seeing) {
        S.unread += foreign.length;
        updateTitle();
        renderChannels();
      }
      if (!seeing || document.hidden) BT.sound('message');
    });
    room.on('typing', renderTyping);
    room.on('media', () => {
      renderTiles();
      syncAudio();
    });

    room.start();
    renderAll();
    if (focusChat && !isNarrow()) $('input').focus();
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
    if (S.inVoice || S.joining || !S.room) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Голосовой чат работает только на сайте с https:// (или на localhost).', 'error');
      return;
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
      return;
    }
    S.joining = false;
    if (S.room !== room) {
      stream.getTracks().forEach((t) => t.stop());
      return;
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
  }

  function leaveVoice(silent) {
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
    renderVoiceParts();
    syncAudio();
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
      // как в Discord: включить микрофон, когда звук выключен, — значит включить и звук
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
    if (S.room) S.room.setLocal({ muted: S.prefs.muted, deaf: S.prefs.deaf });
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
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });
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
    const cur = meters.get(key);
    if (cur && cur.trackId === track.id) return;
    if (cur) unwatchLevel(key);
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
   * Отрисовка
   * ===================================================================== */
  function avatarHtml(name, color, extra, speakKey) {
    return `<div class="avatar${extra ? ' ' + extra : ''}" style="--c:${safeColor(color)}"${speakKey ? ` data-speak="${esc(speakKey)}"` : ''}>${esc(BT.initials(name))}</div>`;
  }

  function renderRail() {
    const rooms = S.rooms
      .map((r) => {
        const active = S.room && S.room.code === r.code;
        return `<button class="rail-room${active ? ' active' : ''}" data-code="${esc(r.code)}" style="--c:${BT.colorFor(r.code)}" title="${esc(r.name)}" aria-label="Комната ${esc(r.name)}">
          <span>${esc(BT.initials(r.name))}</span>
        </button>`;
      })
      .join('');
    $('rail').innerHTML = `
      <div class="rail-logo" title="Болталка" aria-hidden="true"><svg viewBox="12 10 40 42"><path d="M18 22a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H31l-8 7v-7h-1a4 4 0 0 1-4-4z" fill="currentColor"/></svg></div>
      <div class="rail-sep"></div>
      ${rooms}
      <button class="rail-add" id="railAdd" title="Создать комнату или войти по ссылке" aria-label="Добавить комнату">${icon('plus')}</button>`;
    $('rail').querySelectorAll('.rail-room').forEach((b) =>
      b.addEventListener('click', () => {
        selectRoom(b.dataset.code, true);
        closeDrawer();
      })
    );
    $('railAdd').addEventListener('click', (e) => addRoomMenu(e.currentTarget));
  }

  function statusLine() {
    const room = S.room;
    if (!room) return { cls: 'off', text: '' };
    const n = room.members().length;
    switch (room.status) {
      case 'online':
        return n ? { cls: 'ok', text: `В сети: ${n + 1}` } : { cls: 'ok', text: 'Ты тут один — позови друга' };
      case 'reconnecting':
        return { cls: 'warn', text: 'Связь пропала, переподключаемся…' };
      case 'offline':
        return { cls: 'bad', text: 'Нет связи с сервером' };
      case 'full':
        return { cls: 'bad', text: 'Комната заполнена' };
      default:
        return { cls: 'warn', text: 'Подключаемся…' };
    }
  }

  function renderSideHead() {
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
    if (st.video === 'screen') s += `<span class="tag live" title="Показывает экран">В ЭФИРЕ</span>`;
    else if (st.video === 'camera') s += `<span class="st" title="Камера включена">${icon('camera')}</span>`;
    if (st.deaf) s += `<span class="st off" title="Звук выключен">${icon('headphonesOff')}</span>`;
    else if (st.muted) s += `<span class="st off" title="Микрофон выключен">${icon('micOff')}</span>`;
    return s;
  }

  function renderChannels() {
    if (!S.room) {
      $('channels').innerHTML = '';
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
    if (!peers.length) return { cls: 'ok', text: 'Подключено' };
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
      <div class="vb-info">
        <div class="vb-status ${h.cls}">${icon('signal')}<span>${esc(h.text)}</span></div>
        <div class="vb-sub">Голосовой / ${esc(rec ? rec.name : '')}</div>
      </div>
      <div class="vb-btns">
        <button class="icon-btn${S.videoKind === 'camera' ? ' on' : ''}" id="vbCam" title="${S.videoKind === 'camera' ? 'Выключить камеру' : 'Включить камеру'}" aria-label="Камера"${S.inVoice ? '' : ' disabled'}>${icon('camera')}</button>
        ${canShareScreen() ? `<button class="icon-btn${S.videoKind === 'screen' ? ' on' : ''}" id="vbScreen" title="${S.videoKind === 'screen' ? 'Перестать показывать экран' : 'Показать экран'}" aria-label="Экран"${S.inVoice ? '' : ' disabled'}>${icon('screen')}</button>` : ''}
        <button class="icon-btn hang" id="vbLeave" title="Отключиться" aria-label="Отключиться"${S.inVoice ? '' : ' disabled'}>${icon('hangup')}</button>
      </div>`;
    $('vbCam').addEventListener('click', toggleCamera);
    if ($('vbScreen')) $('vbScreen').addEventListener('click', toggleScreen);
    $('vbLeave').addEventListener('click', () => leaveVoice());
  }

  function renderMeBar() {
    if (!S.profile) return;
    const st = S.room ? (S.room.status === 'online' ? (S.inVoice ? 'В голосовом' : 'В сети') : 'Не в сети') : 'Не в комнате';
    const micOff = S.prefs.muted || S.prefs.deaf;
    $('meBar').innerHTML = `
      <button class="me-info" id="meInfo" title="Настройки профиля">
        <div class="avatar-wrap">${avatarHtml(S.profile.name, S.profile.color, 'sm', 'me')}<span class="presence ${S.room && S.room.status === 'online' ? 'on' : ''}"></span></div>
        <div class="me-text"><div class="me-name">${esc(S.profile.name)}</div><div class="me-sub">${esc(st)}</div></div>
      </button>
      <button class="icon-btn${micOff ? ' danger' : ''}" id="meMic" title="${micOff ? 'Включить микрофон' : 'Выключить микрофон'} (Ctrl+Shift+M)" aria-label="Микрофон" aria-pressed="${micOff}">${icon(micOff ? 'micOff' : 'mic')}</button>
      <button class="icon-btn${S.prefs.deaf ? ' danger' : ''}" id="meDeaf" title="${S.prefs.deaf ? 'Включить звук' : 'Выключить звук'} (Ctrl+Shift+D)" aria-label="Звук" aria-pressed="${S.prefs.deaf}">${icon(S.prefs.deaf ? 'headphonesOff' : 'headphones')}</button>
      <button class="icon-btn" id="meSettings" title="Настройки" aria-label="Настройки">${icon('settings')}</button>`;
    $('meMic').addEventListener('click', toggleMute);
    $('meDeaf').addEventListener('click', toggleDeaf);
    $('meSettings').addEventListener('click', settingsModal);
    $('meInfo').addEventListener('click', settingsModal);
    paintSpeaking();
  }

  function renderMainHead() {
    const head = $('mainHead');
    if (!S.room) {
      head.innerHTML = `<button class="icon-btn menu-btn" id="menuBtn" aria-label="Меню">${icon('menu')}</button><div class="mh-title">Болталка</div>`;
    } else {
      const chat = S.view === 'chat';
      head.innerHTML = `
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="Каналы">${icon('menu')}${S.unread && !chat ? '<span class="dot-badge"></span>' : ''}</button>
        <div class="mh-title">${icon(chat ? 'hash' : 'speaker', 'mh-ic')}<span>${chat ? 'чат' : 'Голосовой'}</span></div>
        <div class="mh-topic">${chat ? 'Сообщения идут напрямую друзьям' : S.inVoice ? 'Ты в голосовом канале' : 'Нажми «Присоединиться», чтобы говорить'}</div>
        <div class="mh-actions">
          ${chat ? `<button class="icon-btn mh-voice" id="mhVoice" title="${S.inVoice ? 'Открыть голосовой' : 'Войти в голосовой канал'}" aria-label="Голосовой канал">${icon('speaker')}</button>` : `<button class="icon-btn mh-chat" id="mhChat" title="Открыть чат" aria-label="Чат">${icon('hash')}${S.unread ? '<span class="dot-badge"></span>' : ''}</button>`}
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
    $('menuBtn').addEventListener('click', openDrawer);
  }

  function renderBanner() {
    const b = $('banner');
    let html = '';
    if (!window.isSecureContext) {
      html = 'Открой Болталку по адресу с <b>https://</b> — иначе браузер не даст микрофон.';
    } else if (S.room && S.room.status === 'offline') {
      html = 'Нет связи с сервером связи. Проверь интернет — мы пробуем подключиться снова…';
    } else if (S.room && S.room.status === 'full') {
      html = `В комнате уже ${BT.MAX_SLOTS} участников — это максимум. Пробуем снова…`;
    } else if (!window.RTCPeerConnection) {
      html = 'Этот браузер не поддерживает WebRTC. Открой Болталку в Chrome, Firefox, Edge или Safari.';
    }
    b.hidden = !html;
    b.innerHTML = html;
  }

  function introHtml() {
    const rec = roomRec();
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
    if (renderedEmpty) renderMessages(false);
  }

  function renderMessages(forceBottom) {
    const box = $('messages');
    if (!S.room) {
      box.innerHTML = '';
      return;
    }
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    const msgs = S.room.messages;
    renderedEmpty = !msgs.length;
    let html = introHtml();
    let prev = null;
    const lastPendingIdx = msgs.length && msgs[msgs.length - 1].pending ? msgs.length - 1 : -1;
    msgs.forEach((m, i) => {
      if (!prev || !BT.sameDay(prev.ts, m.ts)) html += `<div class="day"><span>${esc(BT.dayLabel(m.ts))}</span></div>`;
      const grouped = prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 60000 && BT.sameDay(prev.ts, m.ts);
      const body = `<div class="text${BT.isEmojiOnly(m.text) ? ' big' : ''}">${BT.linkify(m.text)}${m.pending ? `<span class="pend-ic" title="Ещё не доставлено">${icon('clock')}</span>` : ''}</div>`;
      const note = i === lastPendingIdx ? '<div class="pend-note">Сейчас в комнате никого нет — сообщение доставится, когда друг зайдёт.</div>' : '';
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
    if (forceBottom || nearBottom) box.scrollTop = box.scrollHeight;
  }

  function renderTyping() {
    const names = S.room ? S.room.typingNames() : [];
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
    let empty = box.querySelector('.tiles-empty');
    if (!parts.length) {
      if (!empty) {
        box.insertAdjacentHTML(
          'beforeend',
          `<div class="tiles-empty">${icon('speaker', 'big-ic')}<h2>В голосовом канале пока никого</h2><p>Зайди первым — друг увидит тебя в списке и присоединится.</p></div>`
        );
      }
    } else if (empty) empty.remove();

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
      dock.innerHTML = `<button class="btn join" id="dockJoin"${S.joining ? ' disabled' : ''}>${icon('speaker')} ${S.joining ? 'Подключаемся…' : 'Присоединиться к голосовому'}</button>`;
      $('dockJoin').addEventListener('click', joinVoice);
      return;
    }
    const micOff = S.prefs.muted || S.prefs.deaf;
    dock.innerHTML = `
      <button class="round${micOff ? ' danger' : ''}" id="dkMic" title="${micOff ? 'Включить микрофон' : 'Выключить микрофон'}" aria-label="Микрофон">${icon(micOff ? 'micOff' : 'mic')}</button>
      <button class="round${S.prefs.deaf ? ' danger' : ''}" id="dkDeaf" title="${S.prefs.deaf ? 'Включить звук' : 'Выключить звук'}" aria-label="Звук">${icon(S.prefs.deaf ? 'headphonesOff' : 'headphones')}</button>
      <button class="round${S.videoKind === 'camera' ? ' on' : ''}" id="dkCam" title="Камера" aria-label="Камера">${icon(S.videoKind === 'camera' ? 'camera' : 'cameraOff')}</button>
      ${canShareScreen() ? `<button class="round${S.videoKind === 'screen' ? ' on' : ''}" id="dkScreen" title="Показать экран" aria-label="Показать экран">${icon('screen')}</button>` : ''}
      <button class="round hang" id="dkLeave" title="Отключиться" aria-label="Отключиться">${icon('hangup')}</button>`;
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
  }

  /* ---------- участники ---------- */
  function membersVisible() {
    return isWide() ? !S.prefs.membersHidden : app.classList.contains('members-open');
  }
  const isWide = () => window.matchMedia('(min-width: 1101px)').matches;

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
    if (!S.room) {
      box.innerHTML = '';
      return;
    }
    const online = members();
    const onlineUids = new Set(online.map((l) => l.info.uid));
    onlineUids.add(S.profile.uid);
    const known = store.get('members.' + S.room.code, {});
    // авторы сообщений тоже участники комнаты
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

  /* ---------- приветствие, когда комнат нет ---------- */
  function renderWelcome() {
    $('welcome').innerHTML = `
      <div class="welcome-card">
        <div class="welcome-logo"><svg viewBox="12 10 40 42"><path d="M18 22a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H31l-8 7v-7h-1a4 4 0 0 1-4-4z" fill="currentColor"/></svg></div>
        <h1>Болталка</h1>
        <p class="lead">Голосовой и текстовый чат для тебя и друзей. Без регистрации и без своего сервера — звук идёт напрямую между вами.</p>
        <div class="welcome-actions">
          <button class="btn primary big" id="wCreate">${icon('plus')} Создать комнату</button>
          <button class="btn ghost big" id="wJoin">${icon('link')} У меня есть ссылка</button>
        </div>
        <ol class="steps">
          <li><b>Создай комнату</b><span>Это займёт секунду.</span></li>
          <li><b>Отправь другу ссылку</b><span>В любой мессенджер.</span></li>
          <li><b>Болтайте</b><span>Голосом, в чате, с камерой или показом экрана.</span></li>
        </ol>
      </div>`;
    $('wCreate').addEventListener('click', createRoomModal);
    $('wJoin').addEventListener('click', joinModal);
  }

  function updateTitle() {
    const rec = roomRec();
    document.title = (S.unread ? `(${S.unread}) ` : '') + (rec ? `${rec.name} — Болталка` : 'Болталка');
  }

  function setView(view) {
    S.view = view;
    if (view === 'chat' && !document.hidden) S.unread = 0;
    $('chatView').hidden = view !== 'chat' || !S.room;
    $('voiceView').hidden = view !== 'voice' || !S.room;
    renderVoiceParts();
    updateTitle();
    if (view === 'chat') {
      const box = $('messages');
      box.scrollTop = box.scrollHeight;
    }
  }

  function renderAll() {
    const hasRoom = !!S.room;
    app.classList.toggle('no-room', !hasRoom);
    app.classList.toggle('members-hidden', !!S.prefs.membersHidden);
    $('welcome').hidden = hasRoom;
    $('chatView').hidden = !hasRoom || S.view !== 'chat';
    $('voiceView').hidden = !hasRoom || S.view !== 'voice';
    if (!hasRoom) renderWelcome();
    renderRail();
    renderSideHead();
    renderVoiceParts();
    renderMembers();
    renderBanner();
    renderMessages(true);
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
      if (!S.room) return;
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
  function takeInviteFromHash() {
    if (!location.hash) return null;
    const inv = parseInvite(location.href);
    if (inv) history.replaceState(null, '', location.pathname + location.search);
    return inv;
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
      if (mod && e.shiftKey && (e.code === 'KeyM' || e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'ь')) {
        e.preventDefault();
        toggleMute();
      }
      if (mod && e.shiftKey && (e.code === 'KeyD' || e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'в')) {
        e.preventDefault();
        toggleDeaf();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (S.view === 'chat' && S.unread) {
        S.unread = 0;
        updateTitle();
        renderChannels();
        renderMainHead();
      }
      if (S.room) S.room.kick();
    });
    window.addEventListener('online', () => S.room && S.room.kick());
    window.addEventListener('hashchange', () => {
      const inv = takeInviteFromHash();
      if (inv && S.profile) acceptInvite(inv);
    });
    window.addEventListener('pagehide', () => {
      saveMessagesNow();
      if (S.room) S.room.stop(); // освобождаем место в комнате сразу, а не по таймауту
    });
    window.addEventListener('pageshow', (e) => {
      if (e.persisted && S.room) {
        const code = S.room.code;
        S.room = null;
        S.inVoice = false;
        selectRoom(code);
      }
    });
    window.addEventListener('resize', () => {
      closePopover();
      if (isWide()) app.classList.remove('members-open');
      if (!isNarrow()) app.classList.remove('drawer-open');
    });
    // относительное время «был(а) 5 минут назад» и подписи дней
    setInterval(() => {
      if (S.room) renderMembers();
    }, 60000);
  }

  async function boot() {
    initComposer();
    initGlobalEvents();
    if (!window.Peer) toast('Не загрузилась библиотека связи. Обнови страницу.', 'error');
    const invite = takeInviteFromHash();
    if (!S.profile || !S.profile.uid || !S.profile.name) {
      renderAll();
      await profileModal(invite);
    }
    if (!BT.isColor(S.profile.color)) S.profile.color = BT.colorFor(S.profile.uid);
    if (invite) acceptInvite(invite);
    else if (S.active && S.rooms.some((r) => r.code === S.active)) selectRoom(S.active);
    else if (S.rooms.length) selectRoom(S.rooms[0].code);
    else renderAll();
  }

  // для отладки и автотестов
  window.__boltalka = { S, joinVoice, leaveVoice, toggleMute, toggleDeaf, toggleCamera, toggleScreen };

  boot();
})();
