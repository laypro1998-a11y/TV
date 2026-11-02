/* Болталка — комната.
 *
 *  • Комната = код. Участники находят друг друга через публичные MQTT-брокеры
 *    (см. net.js): тема — хеш кода, сообщения зашифрованы ключом из кода.
 *  • Между каждой парой — один RTCPeerConnection: канал данных (чат, статусы,
 *    история, звонки) плюс звук и видео. Предлагает соединение участник
 *    с меньшим id — так не бывает столкновений.
 *  • Если напрямую соединиться не получается (строгий NAT, нет TURN), чат и
 *    статус «в сети» идут запасным путём — через те же брокеры, зашифрованно.
 *    Звук без прямого соединения или TURN невозможен.
 *  • Личный чат с другом — такая же комната на двоих.
 */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});
  const NET = BT.net;

  const MAX_PEERS = 6; // участников в комнате, включая тебя
  const TICK_MS = 3000;
  const DEAD_MS = 12000; // нет вестей по прямому каналу столько — связь пропала
  const CONNECT_TIMEOUT = 25000; // прямое соединение так и не открылось
  const RELAY_TTL = 40000; // не слышно через брокеры столько — участник ушёл
  const RELAY_HIST_AFTER = 8000; // через сколько без прямой связи отдаём историю запасным путём
  const HISTORY_SYNC = 300;
  const HIST_CHUNK = 30;
  const RELAY_HIST = 40;
  const MAX_STORE = 1000;
  const MAX_TEXT = 2000;

  const str = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '');
  const candType = (c) => {
    const m = / typ (\w+)/.exec(String(c || ''));
    return m ? (m[1] === 'prflx' ? 'srflx' : m[1]) : '';
  };

  function cleanUser(u) {
    if (!u || typeof u !== 'object') return null;
    const uid = str(u.uid, 64);
    if (!uid) return null;
    return { uid, name: str(u.name, 32).trim() || 'Без имени', color: BT.isColor(u.color) ? u.color : BT.colorFor(uid) };
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

  class Room {
    constructor({ code, server, me, messages, maxPeers, dm }) {
      this.code = code;
      this.server = /^wss?:\/\//i.test(server || '') ? server : '';
      this.me = me;
      this.dm = dm || null;
      this.maxPeers = maxPeers || MAX_PEERS;
      this.local = cleanState({});
      this.tracks = { audio: null, video: null };
      this.links = new Map(); // id собеседника → прямое соединение
      this.relay = new Map(); // id → кого слышно через брокеры
      this.present = new Map(); // id → кто сейчас «в сети» (для событий вошёл/вышел)
      this.fails = new Map(); // id → { n, until } неудачные попытки соединиться
      this.lastFail = null;
      this.messages = (messages || []).slice(-MAX_STORE);
      this.msgIds = new Set(this.messages.map((m) => m.id));
      this.handlers = {};
      this.status = 'idle';
      this.stopped = true;
      this.brokers = [];
      this.seen = new Set();
      this.sendChain = Promise.resolve();
      this.recvChain = Promise.resolve();
      this.lastAnnounce = 0;
      this.lastChange = Date.now();
      this.onTopic = (bytes) => this.onSignalBytes(bytes);
      this.onBroker = (b) => this.onBrokerState(b);
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

    /* ---------- вход в комнату ---------- */
    async start() {
      if (!window.RTCPeerConnection || !window.WebSocket || !(window.crypto && crypto.subtle)) {
        this.setStatus('offline', 'Браузер не поддерживает WebRTC или шифрование (нужен https)');
        return;
      }
      this.stopped = false;
      this.id = NET.randId(); // id этой вкладки в комнате
      this.startedAt = Date.now();
      this.setStatus('connecting');
      this.topic = 'boltalka/v2/' + NET.hex(await NET.sha256('boltalka-topic:' + this.code)).slice(0, 32);
      this.key = await NET.keyFrom('boltalka-key:' + this.code);
      if (this.stopped) return;
      this.brokers = (this.server ? [this.server] : NET.BROKERS).map(NET.broker);
      for (const b of this.brokers) {
        b.subscribe(this.topic, this.onTopic);
        b.onState(this.onBroker);
      }
      if (this.brokers.some((b) => b.ready)) {
        this.setStatus('online');
        setTimeout(() => !this.stopped && this.announce(), 300); // даём подписке дойти до брокера
      }
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }

    onBrokerState(broker) {
      if (this.stopped) return;
      if (broker.ready) {
        this.setStatus('online');
        setTimeout(() => !this.stopped && this.announce(), 300);
      } else if (!this.brokers.some((b) => b.ready)) {
        this.setStatus('reconnecting');
      }
    }

    stop() {
      if (!this.stopped && this.key) this.signal({ t: 'bye' });
      this.stopped = true;
      clearInterval(this.timer);
      for (const link of [...this.links.values()]) this.dropLink(link, true);
      this.relay.clear();
      this.present.clear();
      const brokers = this.brokers;
      this.brokers = [];
      // «bye» успевает уйти, потом отписываемся
      this.sendChain.then(() => {
        for (const b of brokers) {
          b.unsubscribe(this.topic, this.onTopic);
          b.offState(this.onBroker);
        }
      });
      this.emit('peers');
      this.setStatus('idle');
    }

    /** Разбудить (вкладку открыли, сеть вернулась). */
    kick() {
      if (this.stopped) return;
      this.brokers.forEach((b) => b.wake());
      this.fails.clear();
      this.announce();
    }

    /** Начать попытки соединиться заново (например, после настройки TURN). */
    retryNow() {
      if (this.stopped) return;
      this.fails.clear();
      for (const link of [...this.links.values()]) if (!link.open) this.dropLink(link, true);
      this.emit('peers');
      this.announce();
    }

    /* ---------- служебные сообщения через брокеров ---------- */
    signal(obj) {
      obj.from = this.id;
      obj.m = NET.randId();
      const brokers = this.brokers;
      this.sendChain = this.sendChain
        .then(async () => {
          const bytes = await NET.seal(this.key, obj);
          brokers.forEach((b) => b.publish(this.topic, bytes));
        })
        .catch(() => {});
    }

    onSignalBytes(bytes) {
      this.recvChain = this.recvChain
        .then(async () => {
          if (this.stopped) return;
          const obj = await NET.open(this.key, bytes);
          if (!obj || typeof obj.from !== 'string' || obj.from === this.id) return;
          if (typeof obj.m === 'string') {
            if (this.seen.has(obj.m)) return; // то же сообщение через другой брокер
            this.seen.add(obj.m);
            if (this.seen.size > 2000) this.seen = new Set([...this.seen].slice(-1000));
          }
          if (obj.to && obj.to !== this.id) return;
          await this.onSignal(obj);
        })
        .catch((e) => console.warn('[signal]', e));
    }

    announce() {
      this.lastAnnounce = Date.now();
      this.signal({ t: 'hi', name: this.me.name, user: this.me });
    }

    /** Отметить, что участника слышно через брокеры. */
    noteRelay(id, user) {
      let r = this.relay.get(id);
      const u = cleanUser(user);
      if (!r) {
        if (!u) return;
        r = { id, firstSeen: Date.now(), histSent: false, pseudo: { id, relay: true, open: true, info: u, state: cleanState({}), streams: { audio: new MediaStream(), video: new MediaStream() }, mediaState: 'relay', typingUntil: 0 } };
        this.relay.set(id, r);
      }
      if (u) r.pseudo.info = u;
      r.lastSeen = Date.now();
      this.updatePresence();
    }

    async onSignal(obj) {
      const from = obj.from.slice(0, 40);
      if (obj.t !== 'bye') this.noteRelay(from, obj.user);
      const link = this.links.get(from);
      const name = str(obj.name, 32);
      switch (obj.t) {
        case 'hi': {
          if (link) return; // уже знакомы или соединяемся
          if (this.links.size >= this.maxPeers - 1) return;
          const f = this.fails.get(from);
          if (this.id < from) {
            if (!f || f.until <= Date.now()) this.connectTo(from, name);
          } else if (!obj.to) {
            this.signal({ t: 'hi', to: from, name: this.me.name, user: this.me }); // пусть предложит тот, у кого id меньше
          }
          break;
        }
        case 'sdp': {
          const sdp = obj.sdp;
          if (!sdp || typeof sdp.sdp !== 'string') return;
          if (sdp.type === 'offer') {
            if (from > this.id) return; // предлагать должен меньший id
            if (link) this.dropLink(link, true); // собеседник начал заново
            if (this.links.size >= this.maxPeers - 1) return;
            const l = this.createLink(from, false, name);
            await this.queueRtc(l, async () => {
              await l.pc.setRemoteDescription({ type: 'offer', sdp: sdp.sdp });
              this.noteRemoteSdp(l, sdp.sdp);
              for (const t of l.pc.getTransceivers()) {
                const kind = t.receiver.track && t.receiver.track.kind;
                if (kind && !l.tx[kind]) l.tx[kind] = t;
                if (t.direction !== 'sendrecv' && t.direction !== 'stopped') t.direction = 'sendrecv';
              }
              this.applySenders(l);
              await l.pc.setLocalDescription(await l.pc.createAnswer());
              this.signal({ t: 'sdp', to: from, sdp: { type: 'answer', sdp: l.pc.localDescription.sdp } });
              await this.flushIce(l);
            });
          } else if (sdp.type === 'answer' && link && link.outgoing) {
            await this.queueRtc(link, async () => {
              if (link.pc.signalingState !== 'have-local-offer') return;
              await link.pc.setRemoteDescription({ type: 'answer', sdp: sdp.sdp });
              this.noteRemoteSdp(link, sdp.sdp);
              await this.flushIce(link);
            });
          }
          break;
        }
        case 'ice': {
          if (!link || !obj.ice || typeof obj.ice.candidate !== 'string') return;
          const t = candType(obj.ice.candidate);
          if (t) link.diag.rc.add(t);
          await this.queueRtc(link, async () => {
            if (link.pc.remoteDescription) await link.pc.addIceCandidate(obj.ice).catch(() => {});
            else if (link.iceQueue.length < 200) link.iceQueue.push(obj.ice);
          });
          break;
        }
        case 'rmsg': // сообщение запасным путём
          if (obj.msg) this.merge([obj.msg], true);
          break;
        case 'rhist':
          if (Array.isArray(obj.msgs)) this.merge(obj.msgs.slice(0, RELAY_HIST * 2), false);
          break;
        case 'bye':
          this.relay.delete(from);
          if (link) this.dropLink(link);
          else {
            this.updatePresence();
            this.emit('peers');
          }
          break;
        default:
          break;
      }
    }

    noteRemoteSdp(link, sdp) {
      link.diag.sdp = true;
      for (const line of sdp.split(/\r?\n/)) if (line.startsWith('a=candidate')) link.diag.rc.add(candType(line));
    }

    queueRtc(link, fn) {
      link.rtcQueue = link.rtcQueue.then(fn).catch((e) => console.warn('[rtc]', e));
      return link.rtcQueue;
    }

    async flushIce(link) {
      for (const c of link.iceQueue.splice(0)) await link.pc.addIceCandidate(c).catch(() => {});
    }

    /* ---------- прямые соединения ---------- */
    createLink(id, outgoing, hint) {
      const pc = new RTCPeerConnection({ iceServers: NET.iceServers() });
      const dc = pc.createDataChannel('bt', { negotiated: true, id: 0, ordered: true });
      const link = {
        id,
        outgoing,
        hint: hint || '',
        pc,
        dc,
        open: false,
        info: null,
        state: cleanState({}),
        createdAt: Date.now(),
        lastSeen: Date.now(),
        typingUntil: 0,
        mediaState: 'new',
        tx: { audio: null, video: null },
        streams: { audio: new MediaStream(), video: new MediaStream() },
        rtcQueue: Promise.resolve(),
        iceQueue: [],
        diag: { sdp: false, lc: new Set(), rc: new Set() },
      };
      this.links.set(id, link);
      this.emit('peers');
      dc.onopen = () => {
        if (this.links.get(id) !== link) return;
        link.open = true;
        link.lastSeen = Date.now();
        this.lastChange = Date.now();
        this.fails.delete(id);
        this.sendHello(link);
      };
      dc.onmessage = (e) => {
        let data;
        try {
          data = JSON.parse(e.data);
        } catch (err) {
          return;
        }
        this.onData(link, data);
      };
      dc.onclose = () => this.dropLink(link);
      pc.onicecandidate = (e) => {
        if (!e.candidate || !e.candidate.candidate) return;
        const t = candType(e.candidate.candidate);
        if (t) link.diag.lc.add(t);
        this.signal({ t: 'ice', to: id, ice: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        const stream = e.track.kind === 'video' ? link.streams.video : link.streams.audio;
        for (const t of stream.getTracks()) if (t !== e.track) stream.removeTrack(t);
        if (!stream.getTracks().includes(e.track)) stream.addTrack(e.track);
        this.emit('media', link);
      };
      pc.onconnectionstatechange = () => {
        if (this.links.get(id) !== link) return;
        link.mediaState = pc.connectionState;
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          if (!link.open) this.linkFailed(link);
          this.dropLink(link);
        } else this.emit('peers');
      };
      if (outgoing) {
        link.tx.audio = pc.addTransceiver('audio', { direction: 'sendrecv' });
        link.tx.video = pc.addTransceiver('video', { direction: 'sendrecv' });
      }
      return link;
    }

    connectTo(id, hint) {
      const link = this.createLink(id, true, hint);
      this.applySenders(link);
      this.queueRtc(link, async () => {
        await link.pc.setLocalDescription(await link.pc.createOffer());
        this.signal({ t: 'sdp', to: id, name: this.me.name, user: this.me, sdp: { type: 'offer', sdp: link.pc.localDescription.sdp } });
      });
    }

    /** Прямое соединение не открылось: запоминаем почему и делаем паузу перед новой попыткой. */
    linkFailed(link) {
      const d = link.diag;
      let reason;
      if (!d.sdp) reason = 'nosdp'; // ответ друга не дошёл
      else if (!d.rc.size) reason = 'nocand'; // адреса друга не дошли
      else if (d.lc.has('relay') || d.rc.has('relay')) reason = 'relayfail'; // TURN был, но не помог
      else reason = 'noturn'; // напрямую нельзя, а TURN недоступен ни у кого
      const prev = this.fails.get(link.id);
      const n = (prev ? prev.n : 0) + 1;
      const wait = n < 3 ? 0 : Math.min(120000, 15000 * 2 ** (n - 3));
      this.fails.set(link.id, { n, until: Date.now() + wait });
      const info = (this.relay.get(link.id) || {}).pseudo;
      this.lastFail = {
        at: Date.now(),
        id: link.id,
        name: link.hint || (info && info.info.name) || '',
        reason,
        local: [...d.lc],
        remote: [...d.rc],
        attempts: n,
      };
      this.emit('link-failed', this.lastFail);
    }

    dropLink(link, silent) {
      if (this.links.get(link.id) !== link) return;
      this.links.delete(link.id);
      link.open = false;
      try {
        link.dc.close();
      } catch (e) {}
      try {
        link.pc.close();
      } catch (e) {}
      this.lastChange = Date.now();
      if (silent) return;
      this.updatePresence();
      this.emit('peers');
      // может, это был сбой — напоминаем о себе
      if (!this.stopped) setTimeout(() => !this.stopped && this.announce(), 1000 + Math.random() * 1000);
    }

    tick() {
      if (this.stopped) return;
      const now = Date.now();
      for (const link of [...this.links.values()]) {
        if (link.open) {
          if (now - link.lastSeen > DEAD_MS) {
            this.dropLink(link);
            continue;
          }
          this.send(link, { t: 'ping' });
        } else if (now - link.createdAt > CONNECT_TIMEOUT) {
          this.linkFailed(link);
          this.dropLink(link, true);
          this.emit('peers');
        }
      }
      // история запасным путём тем, с кем прямо так и не соединились
      for (const r of this.relay.values()) {
        const direct = this.links.get(r.id);
        if (!r.histSent && !(direct && direct.open) && now - r.firstSeen > RELAY_HIST_AFTER && now - r.lastSeen < RELAY_TTL) {
          r.histSent = true;
          this.signal({ t: 'rhist', msgs: this.messages.slice(-RELAY_HIST).map(wire) });
          this.markDelivered();
        }
      }
      this.updatePresence();
      const anyUp = this.brokers.some((b) => b.ready);
      if (!anyUp) {
        if (now - this.startedAt > 15000) this.setStatus('offline');
      } else {
        this.setStatus('online');
        const noDirect = ![...this.links.values()].some((l) => l.open);
        const every = noDirect ? (now - this.lastChange < 60000 ? 5000 : 12000) : 25000;
        if (now - this.lastAnnounce >= every) this.announce();
      }
      let typingChanged = false;
      for (const link of this.links.values()) {
        if (link.typingUntil && link.typingUntil < now) {
          link.typingUntil = 0;
          typingChanged = true;
        }
      }
      if (typingChanged) this.emit('typing');
    }

    /** Кто «в сети»: прямые соединения плюс те, кого слышно через брокеры. */
    presentMap() {
      const out = new Map();
      for (const l of this.links.values()) if (l.open && l.info) out.set(l.id, l);
      const now = Date.now();
      for (const [id, r] of this.relay) {
        if (now - r.lastSeen > RELAY_TTL) {
          this.relay.delete(id);
          continue;
        }
        if (!out.has(id)) out.set(id, r.pseudo);
      }
      return out;
    }

    updatePresence() {
      const now = this.presentMap();
      let changed = false;
      for (const [id, p] of now) {
        if (!this.present.has(id)) {
          this.present.set(id, p);
          changed = true;
          this.emit('peer-joined', p);
        } else this.present.set(id, p);
      }
      for (const [id, p] of [...this.present]) {
        if (now.has(id)) continue;
        this.present.delete(id);
        changed = true;
        this.emit('peer-left', p);
      }
      if (changed) this.emit('peers');
    }

    send(link, msg) {
      if (!link.open || !link.dc || link.dc.readyState !== 'open') return false;
      try {
        link.dc.send(JSON.stringify(msg));
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

    markDelivered() {
      let changed = false;
      for (const m of this.messages) {
        if (m.pending) {
          delete m.pending;
          changed = true;
        }
      }
      if (changed) this.emit('messages', { added: [], delivered: true });
    }

    sendHello(link) {
      this.send(link, { t: 'hello', v: 2, user: this.me, state: this.local });
      const msgs = this.messages.slice(-HISTORY_SYNC).map(wire);
      for (let i = 0; i < msgs.length; i += HIST_CHUNK) this.send(link, { t: 'hist', msgs: msgs.slice(i, i + HIST_CHUNK) });
      this.markDelivered();
    }

    onData(link, data) {
      if (this.links.get(link.id) !== link || !data || typeof data !== 'object') return;
      link.lastSeen = Date.now();
      switch (data.t) {
        case 'hello': {
          const user = cleanUser(data.user);
          if (!user) return;
          link.info = user;
          link.state = cleanState(data.state);
          this.applySenders(link);
          this.updatePresence();
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
        case 'call':
          if (link.info) this.emit('call', { link, data });
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
      let sent = 0;
      for (const link of this.links.values()) if (link.info && this.send(link, { t: 'msg', m: wire(m) })) sent++;
      if (this.members().some((p) => p.relay)) {
        this.signal({ t: 'rmsg', msg: wire(m) }); // кому-то — только запасным путём
        sent++;
      }
      if (!sent) m.pending = true;
      this.msgIds.add(m.id);
      this.messages.push(m);
      this.emit('messages', { added: [m], own: true });
      return m;
    }

    sendTyping() {
      this.broadcast({ t: 'typing' });
    }

    sendCall(data) {
      return this.broadcast(Object.assign({ t: 'call' }, data));
    }

    clearHistory() {
      this.messages = [];
      this.msgIds.clear();
      this.emit('messages', { added: [], cleared: true });
    }

    /* ---------- кто где ---------- */
    /** Участники в сети. У тех, с кем нет прямой связи, relay = true (только чат). */
    members() {
      return [...this.presentMap().values()];
    }
    /** Имена тех, с кем сейчас пытаемся соединиться напрямую. */
    connecting() {
      return [...this.links.values()].filter((l) => !l.open || !l.info).map((l) => l.hint || 'друг');
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
  BT.MAX_SLOTS = MAX_PEERS;
  BT.MAX_TEXT = MAX_TEXT;
})();
