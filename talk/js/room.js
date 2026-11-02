/* Болталка — сеть.
 *
 * Как это работает:
 *  • Комната = случайный код. Каждый участник занимает «место» в комнате —
 *    Peer ID вида boltalka-<код>-<номер> на сигнальном сервере PeerJS
 *    (по умолчанию бесплатный 0.peerjs.com).
 *  • Вошедший пробует места 0,1,2… и стучится ко всем остальным местам —
 *    так участники находят друг друга без своего сервера.
 *  • Между каждой парой — DataConnection (чат, статусы, синхронизация истории
 *    и служебные сообщения) и отдельный RTCPeerConnection для звука и видео,
 *    который договаривается через этот же канал. Дорожки (микрофон, камера,
 *    экран) подменяются через replaceTrack — без пересогласования.
 */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});

  // STUN + публичный TURN проекта PeerJS (те же, что PeerJS использует по умолчанию).
  // Свой TURN можно добавить сюда.
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    {
      urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
      username: 'peerjs',
      credential: 'peerjsp',
    },
  ];

  const PREFIX = 'boltalka';
  const MAX_SLOTS = 6; // максимум участников в комнате
  const TICK_MS = 3000; // пинг и служебный цикл
  const DEAD_MS = 12000; // нет вестей столько — считаем, что связь пропала
  const CONNECT_TIMEOUT = 9000;
  const HELLO_TIMEOUT = 8000; // соединились, но так и не поздоровались — пробуем заново
  const HISTORY_SYNC = 300; // сколько последних сообщений отдаём при встрече
  const HIST_CHUNK = 30;
  const MAX_STORE = 1000;
  const MAX_TEXT = 2000;

  const str = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '');

  function cleanUser(u) {
    if (!u || typeof u !== 'object') return null;
    const uid = str(u.uid, 64);
    if (!uid) return null;
    return {
      uid,
      name: str(u.name, 32).trim() || 'Без имени',
      color: BT.isColor(u.color) ? u.color : BT.colorFor(uid),
    };
  }

  function cleanState(s) {
    s = s && typeof s === 'object' ? s : {};
    return {
      voice: !!s.voice,
      muted: !!s.muted,
      deaf: !!s.deaf,
      video: s.video === 'camera' || s.video === 'screen' ? s.video : null,
    };
  }

  function cleanMsg(m) {
    if (!m || typeof m !== 'object') return null;
    const id = str(m.id, 64);
    const uid = str(m.uid, 64);
    const text = str(m.text, MAX_TEXT);
    const ts = Number(m.ts);
    if (!id || !uid || !text.trim() || !Number.isFinite(ts)) return null;
    return {
      id,
      uid,
      name: str(m.name, 32).trim() || 'Без имени',
      color: BT.isColor(m.color) ? m.color : BT.colorFor(uid),
      text,
      ts: Math.min(ts, Date.now()),
    };
  }

  const wire = (m) => ({ id: m.id, uid: m.uid, name: m.name, color: m.color, text: m.text, ts: m.ts });

  function peerOptions(server) {
    const opts = { debug: 0, pingInterval: 5000, config: { iceServers: ICE_SERVERS } };
    if (server) {
      const u = new URL(server);
      opts.secure = u.protocol === 'https:';
      opts.host = u.hostname;
      opts.port = Number(u.port) || (opts.secure ? 443 : 80);
      opts.path = u.pathname || '/';
      opts.key = u.searchParams.get('key') || 'peerjs';
    }
    return opts;
  }

  class Room {
    constructor({ code, server, me, messages }) {
      this.code = code;
      this.server = server || '';
      this.me = me;
      this.local = cleanState({});
      this.tracks = { audio: null, video: null };
      this.links = new Map(); // id собеседника → связь
      this.pending = new Map(); // id → { conn, at } — исходящие попытки
      this.messages = (messages || []).slice(-MAX_STORE);
      this.msgIds = new Set(this.messages.map((m) => m.id));
      this.handlers = {};
      this.status = 'idle';
      this.peer = null;
      this.slot = -1;
      this.stopped = true;
      this.timer = null;
      this.lastProbe = 0;
      this.probeRound = 0;
      this.lastChange = Date.now();
      this.reconnectDelay = 1000;
    }

    /* ---------- события ---------- */
    on(type, fn) {
      (this.handlers[type] = this.handlers[type] || []).push(fn);
      return this;
    }
    emit(type, data) {
      for (const fn of this.handlers[type] || []) {
        try {
          fn(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
    setStatus(status, detail) {
      if (this.status === status) return;
      this.status = status;
      this.emit('status', { status, detail });
    }

    peerId(slot) {
      return `${PREFIX}-${this.code}-${slot}`;
    }
    slotOf(id) {
      const m = /-(\d+)$/.exec(id);
      return m ? Number(m[1]) : -1;
    }
    isOurs(id) {
      return typeof id === 'string' && id.startsWith(`${PREFIX}-${this.code}-`);
    }

    /* ---------- вход в комнату ---------- */
    async start() {
      if (!window.Peer) {
        this.setStatus('offline', 'Не загрузилась библиотека PeerJS');
        return;
      }
      this.stopped = false;
      let attempt = 0;
      while (!this.stopped && !this.peer) {
        this.setStatus('connecting');
        try {
          await this.claimSlot();
        } catch (err) {
          if (this.stopped) return;
          const full = err && err.type === 'full';
          this.setStatus(full ? 'full' : 'offline', err && (err.message || err.type));
          await BT.sleep(Math.min(30000, 2000 * 2 ** attempt++));
        }
      }
    }

    async claimSlot() {
      for (let slot = 0; slot < MAX_SLOTS; slot++) {
        if (this.stopped) return;
        const peer = await this.openPeer(slot);
        if (!peer) continue; // место занято — пробуем следующее
        if (this.stopped) {
          peer.destroy();
          return;
        }
        this.attachPeer(peer, slot);
        return;
      }
      throw Object.assign(new Error('В комнате уже максимум участников'), { type: 'full' });
    }

    openPeer(slot) {
      return new Promise((resolve, reject) => {
        let peer;
        try {
          peer = new window.Peer(this.peerId(slot), peerOptions(this.server));
        } catch (e) {
          reject(e);
          return;
        }
        const done = () => {
          clearTimeout(timer);
          peer.off('open', onOpen);
          peer.off('error', onError);
        };
        const onOpen = () => {
          done();
          resolve(peer);
        };
        const onError = (err) => {
          done();
          peer.destroy();
          if (err && err.type === 'unavailable-id') resolve(null);
          else reject(err);
        };
        const timer = setTimeout(() => onError({ type: 'network', message: 'Сервер связи не отвечает' }), 15000);
        peer.on('open', onOpen);
        peer.on('error', onError);
      });
    }

    attachPeer(peer, slot) {
      this.peer = peer;
      this.slot = slot;
      this.lastChange = Date.now();
      this.reconnectDelay = 1000;
      this.setStatus('online');
      peer.on('connection', (conn) => {
        if (this.peer !== peer) return;
        if (!this.isOurs(conn.peer)) {
          conn.close();
          return;
        }
        this.wireConn(conn, false);
      });
      peer.on('open', () => {
        // после переподключения к сигнальному серверу
        if (this.peer !== peer) return;
        this.reconnectDelay = 1000;
        this.setStatus('online');
        this.scan(true);
      });
      peer.on('disconnected', () => this.onSignalLost(peer));
      peer.on('error', (err) => this.onPeerError(peer, err));
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), TICK_MS);
      this.scan(true);
    }

    onSignalLost(peer) {
      if (this.peer !== peer || this.stopped || peer.destroyed) return;
      this.setStatus('reconnecting');
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (this.peer !== peer || this.stopped || peer.destroyed) return;
        if (peer.disconnected) peer.reconnect();
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(30000, this.reconnectDelay * 2);
    }

    onPeerError(peer, err) {
      if (this.peer !== peer) return;
      const type = err && err.type;
      if (type === 'peer-unavailable') {
        const m = /peer (\S+)/.exec(String(err.message || ''));
        if (m) this.dropPending(m[1]);
        return;
      }
      if (type === 'unavailable-id') {
        // наше место заняли, пока мы были без связи — входим заново
        this.restart();
        return;
      }
      if (peer.destroyed) this.restart();
    }

    restart() {
      if (this.stopped) return;
      this.teardown();
      this.start();
    }

    teardown() {
      clearInterval(this.timer);
      clearTimeout(this.reconnectTimer);
      this.timer = null;
      for (const link of [...this.links.values()]) this.dropLink(link, true);
      for (const p of this.pending.values()) {
        try {
          p.conn.close();
        } catch (e) {}
      }
      this.pending.clear();
      const peer = this.peer;
      this.peer = null;
      this.slot = -1;
      if (peer) peer.destroy();
      this.emit('peers');
    }

    stop() {
      this.stopped = true;
      this.teardown();
      this.setStatus('idle');
    }

    /** Постучаться к другим местам: всем (all) или только к младшим. */
    scan(all) {
      const peer = this.peer;
      if (!peer || peer.disconnected || peer.destroyed) return;
      this.lastProbe = Date.now();
      for (let s = 0; s < MAX_SLOTS; s++) {
        if (s === this.slot || (!all && s > this.slot)) continue;
        const id = this.peerId(s);
        if (this.links.has(id) || this.pending.has(id)) continue;
        let conn;
        try {
          conn = peer.connect(id, { reliable: true });
        } catch (e) {
          conn = null;
        }
        if (!conn) continue;
        this.pending.set(id, { conn, at: Date.now() });
        this.wireConn(conn, true);
      }
    }

    /** Разбудить поиск друзей (вкладку открыли, сеть вернулась). */
    kick() {
      if (this.stopped) return;
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
        clearTimeout(this.reconnectTimer);
        this.reconnectDelay = 1000;
        this.peer.reconnect();
        return;
      }
      this.scan(true);
    }

    dropPending(id) {
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      try {
        p.conn.close();
      } catch (e) {}
    }

    probeEvery() {
      const quiet = Date.now() - this.lastChange;
      if (quiet < 30000) return 3000;
      if (quiet < 120000) return 10000;
      return 60000;
    }

    tick() {
      const now = Date.now();
      for (const link of [...this.links.values()]) {
        if (now - link.lastSeen > DEAD_MS || (!link.info && now - link.openedAt > HELLO_TIMEOUT)) {
          this.closeConn(link.conn);
          continue;
        }
        this.send(link, { t: 'ping' });
      }
      for (const [id, p] of this.pending) {
        if (now - p.at > CONNECT_TIMEOUT) this.dropPending(id);
      }
      // Обычно стучится младшему тот, у кого место старше; каждый третий раз —
      // ко всем, на случай если связь в одну сторону почему-то не заводится.
      if (now - this.lastProbe >= this.probeEvery()) this.scan(++this.probeRound % 3 === 0);
      let typingChanged = false;
      for (const link of this.links.values()) {
        if (link.typingUntil && link.typingUntil < now) {
          link.typingUntil = 0;
          typingChanged = true;
        }
      }
      if (typingChanged) this.emit('typing');
    }

    /* ---------- соединения с собеседниками ---------- */
    wireConn(conn, outgoing) {
      conn.on('open', () => this.onConnOpen(conn, outgoing));
      conn.on('data', (data) => this.onData(conn, data));
      conn.on('close', () => this.onConnClose(conn));
      conn.on('error', (err) => {
        if (err && err.type === 'message-too-big') return;
        this.closeConn(conn);
      });
    }

    closeConn(conn) {
      try {
        conn.close();
      } catch (e) {}
      this.onConnClose(conn);
    }

    onConnOpen(conn, outgoing) {
      const id = conn.peer;
      const p = this.pending.get(id);
      if (p && p.conn === conn) this.pending.delete(id);
      if (!this.peer || this.stopped) {
        conn.close();
        return;
      }
      const old = this.links.get(id);
      if (old && old.conn !== conn) {
        if (old.conn.open) {
          // Две связи с одним человеком (постучались одновременно).
          // Оставляем ту, что начал участник со старшим местом, — обе стороны решат одинаково.
          const starter = (out) => (out ? this.slot : this.slotOf(id));
          if (starter(outgoing) <= starter(old.outgoing)) {
            conn.close();
            return;
          }
        }
        this.dropLink(old, true);
        try {
          old.conn.close();
        } catch (e) {}
      }
      const link = {
        id,
        conn,
        outgoing,
        openedAt: Date.now(),
        // при замене связи помним, кто это, чтобы не показывать «вышел/зашёл»
        info: old ? old.info : null,
        state: old ? old.state : cleanState({}),
        lastSeen: Date.now(),
        typingUntil: 0,
        pc: null,
        mediaState: 'new',
        tx: { audio: null, video: null },
        streams: { audio: new MediaStream(), video: new MediaStream() },
        rtcQueue: Promise.resolve(),
        iceQueue: [],
      };
      this.links.set(id, link);
      this.lastChange = Date.now();
      this.sendHello(link);
      this.setupMedia(link);
    }

    onConnClose(conn) {
      const id = conn.peer;
      const p = this.pending.get(id);
      if (p && p.conn === conn) this.pending.delete(id);
      const link = this.links.get(id);
      if (link && link.conn === conn) this.dropLink(link);
    }

    dropLink(link, replacing) {
      if (this.links.get(link.id) === link) this.links.delete(link.id);
      if (link.pc) {
        try {
          link.pc.close();
        } catch (e) {}
        link.pc = null;
      }
      if (replacing) return;
      this.lastChange = Date.now();
      if (link.info) this.emit('peer-left', link);
      this.emit('peers');
    }

    send(link, msg) {
      if (!link.conn || !link.conn.open) return false;
      try {
        link.conn.send(msg);
        return true;
      } catch (e) {
        return false;
      }
    }

    broadcast(msg) {
      let n = 0;
      for (const link of this.links.values()) if (this.send(link, msg)) n++;
      return n;
    }

    sendHello(link) {
      this.send(link, { t: 'hello', v: 1, user: this.me, state: this.local });
      const msgs = this.messages.slice(-HISTORY_SYNC).map(wire);
      for (let i = 0; i < msgs.length; i += HIST_CHUNK) {
        this.send(link, { t: 'hist', msgs: msgs.slice(i, i + HIST_CHUNK) });
      }
      // всё, что ждало встречи, теперь доставлено
      let changed = false;
      for (const m of this.messages) {
        if (m.pending) {
          delete m.pending;
          changed = true;
        }
      }
      if (changed) this.emit('messages', { added: [], delivered: true });
    }

    onData(conn, data) {
      const link = this.links.get(conn.peer);
      if (!link || link.conn !== conn || !data || typeof data !== 'object') return;
      link.lastSeen = Date.now();
      switch (data.t) {
        case 'hello': {
          const user = cleanUser(data.user);
          if (!user) return;
          const first = !link.info;
          link.info = user;
          link.state = cleanState(data.state);
          this.applySenders(link);
          if (first) this.emit('peer-joined', link);
          this.emit('peers');
          break;
        }
        case 'state': {
          const before = link.state;
          link.state = cleanState(data.state);
          const user = cleanUser(data.user);
          if (user) link.info = user;
          this.applySenders(link);
          this.emit('peer-state', { link, before });
          this.emit('peers');
          break;
        }
        case 'hist':
          if (Array.isArray(data.msgs)) this.merge(data.msgs.slice(0, HIST_CHUNK * 2), false);
          break;
        case 'msg':
          link.typingUntil = 0;
          this.merge([data.m], true);
          this.emit('typing');
          break;
        case 'typing':
          link.typingUntil = Date.now() + 4500;
          this.emit('typing');
          break;
        case 'rtc':
          this.onRtc(link, data);
          break;
        default:
          break; // ping и всё незнакомое
      }
    }

    /* ---------- чат ---------- */
    merge(list, live) {
      const added = [];
      for (const raw of list) {
        const m = cleanMsg(raw);
        if (!m || this.msgIds.has(m.id)) continue;
        // часы у друзей могут расходиться — живые сообщения ставим по нашим часам
        if (live && Math.abs(Date.now() - Number(raw.ts)) > 120000) m.ts = Date.now();
        this.msgIds.add(m.id);
        added.push(m);
      }
      if (!added.length) return;
      this.messages.push(...added);
      this.messages.sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1));
      if (this.messages.length > MAX_STORE) {
        for (const m of this.messages.splice(0, this.messages.length - MAX_STORE)) this.msgIds.delete(m.id);
      }
      this.emit('messages', { added, live });
    }

    sendMessage(text) {
      text = String(text || '').trim().slice(0, MAX_TEXT);
      if (!text) return null;
      const m = { id: BT.uid(), uid: this.me.uid, name: this.me.name, color: this.me.color, text, ts: Date.now() };
      const ready = [...this.links.values()].filter((l) => l.info);
      let sent = 0;
      for (const link of ready) if (this.send(link, { t: 'msg', m: wire(m) })) sent++;
      if (!sent) m.pending = true;
      this.msgIds.add(m.id);
      this.messages.push(m);
      this.emit('messages', { added: [m], own: true });
      return m;
    }

    sendTyping() {
      this.broadcast({ t: 'typing' });
    }

    clearHistory() {
      this.messages = [];
      this.msgIds.clear();
      this.emit('messages', { added: [], cleared: true });
    }

    /* ---------- кто где ---------- */
    members() {
      return [...this.links.values()].filter((l) => l.info);
    }
    typingNames() {
      const now = Date.now();
      return this.members()
        .filter((l) => l.typingUntil > now)
        .map((l) => l.info.name);
    }

    setLocal(partial) {
      Object.assign(this.local, partial);
      this.local = cleanState(this.local);
      this.broadcast({ t: 'state', state: this.local, user: this.me });
      for (const link of this.links.values()) this.applySenders(link);
    }

    setUser(me) {
      this.me = me;
      this.broadcast({ t: 'state', state: this.local, user: this.me });
    }

    setTracks(partial) {
      Object.assign(this.tracks, partial);
      for (const link of this.links.values()) this.applySenders(link);
    }

    /* ---------- звук и видео ---------- */
    setupMedia(link) {
      let pc;
      try {
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      } catch (e) {
        console.warn('[rtc] нет RTCPeerConnection', e);
        return;
      }
      link.pc = pc;
      pc.onicecandidate = (e) => {
        if (e.candidate && e.candidate.candidate) this.send(link, { t: 'rtc', ice: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        const stream = e.track.kind === 'video' ? link.streams.video : link.streams.audio;
        for (const t of stream.getTracks()) if (t !== e.track) stream.removeTrack(t);
        if (!stream.getTracks().includes(e.track)) stream.addTrack(e.track);
        this.emit('media', link);
      };
      pc.onconnectionstatechange = () => {
        if (link.pc !== pc) return;
        link.mediaState = pc.connectionState;
        this.emit('peers');
        if (pc.connectionState === 'failed') {
          if (link.outgoing) pc.restartIce && pc.restartIce();
          else this.send(link, { t: 'rtc', restart: 1 });
        }
      };
      if (link.outgoing) {
        // Предлагает тот, кто начал соединение; второй только отвечает — без столкновений.
        link.tx.audio = pc.addTransceiver('audio', { direction: 'sendrecv' });
        link.tx.video = pc.addTransceiver('video', { direction: 'sendrecv' });
        pc.onnegotiationneeded = () =>
          this.queueRtc(link, async () => {
            if (link.pc !== pc || pc.signalingState !== 'stable') return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.send(link, { t: 'rtc', sdp: { type: 'offer', sdp: pc.localDescription.sdp } });
          });
      }
      this.applySenders(link);
    }

    queueRtc(link, fn) {
      link.rtcQueue = link.rtcQueue.then(fn).catch((e) => console.warn('[rtc]', e));
    }

    onRtc(link, data) {
      this.queueRtc(link, async () => {
        const pc = link.pc;
        if (!pc || pc.signalingState === 'closed') return;
        if (data.restart) {
          if (link.outgoing && pc.restartIce) pc.restartIce();
          return;
        }
        const sdp = data.sdp;
        if (sdp && typeof sdp.sdp === 'string') {
          if (sdp.type === 'offer' && !link.outgoing) {
            await pc.setRemoteDescription({ type: 'offer', sdp: sdp.sdp });
            for (const t of pc.getTransceivers()) {
              const kind = t.receiver.track && t.receiver.track.kind;
              if (kind && !link.tx[kind]) link.tx[kind] = t;
              if (t.direction !== 'sendrecv' && t.direction !== 'stopped') t.direction = 'sendrecv';
            }
            this.applySenders(link);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.send(link, { t: 'rtc', sdp: { type: 'answer', sdp: pc.localDescription.sdp } });
          } else if (sdp.type === 'answer' && link.outgoing && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription({ type: 'answer', sdp: sdp.sdp });
          }
          for (const c of link.iceQueue.splice(0)) await pc.addIceCandidate(c).catch(() => {});
        } else if (data.ice && typeof data.ice === 'object' && typeof data.ice.candidate === 'string') {
          if (pc.remoteDescription) await pc.addIceCandidate(data.ice).catch(() => {});
          else if (link.iceQueue.length < 100) link.iceQueue.push(data.ice);
        }
      });
    }

    applySenders(link) {
      if (!link.pc) return;
      const together = this.local.voice && link.state.voice;
      this.setSender(link.tx.audio, together ? this.tracks.audio : null);
      this.setSender(link.tx.video, together ? this.tracks.video : null);
    }

    setSender(tx, track) {
      if (!tx || !tx.sender || tx.currentDirection === 'stopped') return;
      if (tx.sender.track === track) return;
      tx.sender.replaceTrack(track).catch(() => {});
    }
  }

  BT.Room = Room;
  BT.MAX_SLOTS = MAX_SLOTS;
  BT.MAX_TEXT = MAX_TEXT;
})();
