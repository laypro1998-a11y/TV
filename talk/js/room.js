/* Болталка — сеть.
 *
 * Как это работает:
 *  • Комната = случайный код. Чтобы найти друг друга, участники обмениваются
 *    короткими служебными сообщениями через публичные MQTT-брокеры (сразу
 *    через несколько — если один недоступен, работают остальные). Сообщения
 *    шифруются AES-GCM ключом из кода комнаты, а тема (topic) — хеш кода,
 *    так что посторонние их не прочитают.
 *  • Между каждой парой участников — один RTCPeerConnection: канал данных
 *    (чат, статусы, синхронизация истории) плюс звук и видео. Предлагает
 *    соединение участник с меньшим id — так не бывает столкновений.
 *  • Микрофон, камера и экран подменяются через replaceTrack, без
 *    пересогласования.
 */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});

  // Публичные бесплатные MQTT-брокеры (MQTT поверх WebSocket).
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt',
  ];

  // STUN + публичный TURN PeerJS (TURN нужен, если напрямую соединиться нельзя).
  // Свой TURN можно добавить сюда.
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    {
      urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
      username: 'peerjs',
      credential: 'peerjsp',
    },
  ];

  const MAX_PEERS = 6; // участников в комнате, включая тебя
  const TICK_MS = 3000;
  const DEAD_MS = 12000; // нет вестей столько — связь пропала
  const CONNECT_TIMEOUT = 20000; // соединение так и не открылось
  const HISTORY_SYNC = 300;
  const HIST_CHUNK = 30;
  const MAX_STORE = 1000;
  const MAX_TEXT = 2000;

  const str = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '');
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const randId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');

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

  /* =====================================================================
   * Крошечный MQTT 3.1.1 клиент поверх WebSocket (QoS 0, одна тема)
   * ===================================================================== */
  function mqttStr(s) {
    const b = enc.encode(s);
    return [b.length >> 8, b.length & 255, ...b];
  }
  function mqttPacket(type, body) {
    const len = [];
    let n = body.length;
    do {
      let d = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) d |= 128;
      len.push(d);
    } while (n > 0);
    const out = new Uint8Array(1 + len.length + body.length);
    out[0] = type;
    out.set(len, 1);
    out.set(body, 1 + len.length);
    return out;
  }

  class Broker {
    constructor(url, topic, onMessage, onState) {
      this.url = url;
      this.topic = topic;
      this.onMessage = onMessage;
      this.onState = onState;
      this.ready = false;
      this.closed = false;
      this.delay = 2000;
      this.buf = new Uint8Array(0);
    }

    connect() {
      if (this.closed) return;
      let ws;
      try {
        ws = new WebSocket(this.url, ['mqtt']);
      } catch (e) {
        this.retry();
        return;
      }
      this.ws = ws;
      ws.binaryType = 'arraybuffer';
      this.buf = new Uint8Array(0);
      ws.onopen = () => {
        const clientId = 'bt' + randId();
        // CONNECT: «MQTT», уровень 4, clean session, keepalive 40 с
        ws.send(mqttPacket(0x10, [...mqttStr('MQTT'), 4, 0x02, 0, 40, ...mqttStr(clientId)]));
      };
      ws.onmessage = (e) => this.feed(new Uint8Array(e.data));
      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        clearInterval(this.pinger);
        if (this.ready) {
          this.ready = false;
          this.onState(this);
        }
        this.retry();
      };
      ws.onerror = () => {};
    }

    retry() {
      if (this.closed) return;
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.connect(), this.delay);
      this.delay = Math.min(30000, this.delay * 2);
    }

    /** Переподключиться сейчас, если связи нет. */
    wake() {
      if (this.closed || this.ws) return;
      clearTimeout(this.retryTimer);
      this.delay = 2000;
      this.connect();
    }

    feed(chunk) {
      const merged = new Uint8Array(this.buf.length + chunk.length);
      merged.set(this.buf);
      merged.set(chunk, this.buf.length);
      let b = merged;
      for (;;) {
        if (b.length < 2) break;
        let len = 0;
        let mult = 1;
        let i = 1;
        let complete = false;
        for (; i < 5 && i < b.length; i++) {
          len += (b[i] & 127) * mult;
          mult *= 128;
          if (!(b[i] & 128)) {
            complete = true;
            break;
          }
        }
        if (!complete) break;
        const start = i + 1;
        if (b.length < start + len) break;
        this.handle(b[0], b.subarray(start, start + len));
        b = b.subarray(start + len);
      }
      this.buf = b.slice();
    }

    handle(first, body) {
      const type = first >> 4;
      if (type === 2) {
        // CONNACK
        if (body[1] !== 0) {
          if (this.ws) this.ws.close();
          return;
        }
        // SUBSCRIBE на нашу тему, QoS 0
        this.ws.send(mqttPacket(0x82, [0, 1, ...mqttStr(this.topic), 0]));
      } else if (type === 9) {
        // SUBACK
        this.delay = 2000;
        this.ready = true;
        clearInterval(this.pinger);
        this.pinger = setInterval(() => {
          if (this.ws && this.ws.readyState === 1) this.ws.send(new Uint8Array([0xc0, 0]));
        }, 25000);
        this.onState(this);
      } else if (type === 3) {
        // PUBLISH
        const qos = (first >> 1) & 3;
        const tlen = (body[0] << 8) | body[1];
        let p = 2 + tlen;
        if (qos > 0) p += 2;
        this.onMessage(body.slice(p));
      }
    }

    publish(bytes) {
      if (!this.ready || !this.ws || this.ws.readyState !== 1) return;
      const head = mqttStr(this.topic);
      const body = new Uint8Array(head.length + bytes.length);
      body.set(head);
      body.set(bytes, head.length);
      try {
        this.ws.send(mqttPacket(0x30, body));
      } catch (e) {}
    }

    close() {
      if (this.closed) return;
      this.closed = true;
      this.ready = false;
      clearTimeout(this.retryTimer);
      clearInterval(this.pinger);
      const ws = this.ws;
      this.ws = null;
      if (ws) {
        try {
          if (ws.readyState === 1) ws.send(new Uint8Array([0xe0, 0])); // DISCONNECT
          ws.close();
        } catch (e) {}
      }
    }
  }

  /* =====================================================================
   * Комната
   * ===================================================================== */
  class Room {
    constructor({ code, server, me, messages }) {
      this.code = code;
      this.server = /^wss?:\/\//i.test(server || '') ? server : '';
      this.me = me;
      this.local = cleanState({});
      this.tracks = { audio: null, video: null };
      this.links = new Map(); // id собеседника → связь
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
      this.id = randId(); // id этой вкладки в комнате
      this.startedAt = Date.now();
      this.setStatus('connecting');
      const h = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
      const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      this.topic = 'boltalka/v2/' + hex(await h('boltalka-topic:' + this.code)).slice(0, 32);
      this.key = await crypto.subtle.importKey('raw', await h('boltalka-key:' + this.code), 'AES-GCM', false, ['encrypt', 'decrypt']);
      if (this.stopped) return;
      const urls = this.server ? [this.server] : BROKERS;
      this.brokers = urls.map(
        (u) =>
          new Broker(
            u,
            this.topic,
            (bytes) => this.onSignalBytes(bytes),
            (b) => this.onBrokerState(b)
          )
      );
      this.brokers.forEach((b) => b.connect());
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }

    onBrokerState(broker) {
      if (this.stopped) return;
      if (broker.ready) {
        this.setStatus('online');
        this.announce(); // новые знакомые могут быть на этом брокере
      } else if (!this.brokers.some((b) => b.ready)) {
        this.setStatus('reconnecting');
      }
    }

    stop() {
      if (!this.stopped && this.key) this.signal({ t: 'bye' });
      this.stopped = true;
      clearInterval(this.timer);
      for (const link of [...this.links.values()]) this.dropLink(link, true);
      // даём «bye» уйти, потом закрываем брокеров
      const brokers = this.brokers;
      this.brokers = [];
      const closeAll = () => brokers.forEach((b) => b.close());
      this.sendChain.then(closeAll);
      setTimeout(closeAll, 300);
      this.emit('peers');
      this.setStatus('idle');
    }

    /** Разбудить (вкладку открыли, сеть вернулась). */
    kick() {
      if (this.stopped) return;
      this.brokers.forEach((b) => b.wake());
      this.announce();
    }

    /* ---------- служебные сообщения через брокеров ---------- */
    signal(obj) {
      obj.from = this.id;
      obj.m = randId();
      const brokers = this.brokers;
      this.sendChain = this.sendChain
        .then(async () => {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, enc.encode(JSON.stringify(obj))));
          const out = new Uint8Array(12 + ct.length);
          out.set(iv);
          out.set(ct, 12);
          brokers.forEach((b) => b.publish(out));
        })
        .catch(() => {});
    }

    onSignalBytes(bytes) {
      if (bytes.length < 29) return;
      this.recvChain = this.recvChain
        .then(async () => {
          if (this.stopped) return;
          let obj;
          try {
            const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, this.key, bytes.subarray(12));
            obj = JSON.parse(dec.decode(plain));
          } catch (e) {
            return; // чужое или битое
          }
          if (!obj || typeof obj !== 'object' || typeof obj.from !== 'string' || obj.from === this.id) return;
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
      this.signal({ t: 'hi' });
    }

    async onSignal(obj) {
      const from = obj.from.slice(0, 40);
      const link = this.links.get(from);
      switch (obj.t) {
        case 'hi': {
          if (link) return; // уже знакомы или соединяемся
          if (this.links.size >= MAX_PEERS - 1) return;
          if (this.id < from) this.connectTo(from);
          else if (!obj.to) this.signal({ t: 'hi', to: from }); // пусть предложит тот, у кого id меньше
          break;
        }
        case 'sdp': {
          const sdp = obj.sdp;
          if (!sdp || typeof sdp.sdp !== 'string') return;
          if (sdp.type === 'offer') {
            if (from > this.id) return; // предлагать должен меньший id
            if (link) this.dropLink(link, true); // собеседник начал заново
            if (this.links.size >= MAX_PEERS - 1) return;
            const l = this.createLink(from, false);
            await this.queueRtc(l, async () => {
              await l.pc.setRemoteDescription({ type: 'offer', sdp: sdp.sdp });
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
              await this.flushIce(link);
            });
          }
          break;
        }
        case 'ice': {
          if (!link || !obj.ice || typeof obj.ice.candidate !== 'string') return;
          await this.queueRtc(link, async () => {
            if (link.pc.remoteDescription) await link.pc.addIceCandidate(obj.ice).catch(() => {});
            else if (link.iceQueue.length < 200) link.iceQueue.push(obj.ice);
          });
          break;
        }
        case 'bye':
          if (link) this.dropLink(link);
          break;
        default:
          break;
      }
    }

    queueRtc(link, fn) {
      link.rtcQueue = link.rtcQueue.then(fn).catch((e) => console.warn('[rtc]', e));
      return link.rtcQueue;
    }

    async flushIce(link) {
      for (const c of link.iceQueue.splice(0)) await link.pc.addIceCandidate(c).catch(() => {});
    }

    /* ---------- соединения с собеседниками ---------- */
    createLink(id, outgoing) {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const dc = pc.createDataChannel('bt', { negotiated: true, id: 0, ordered: true });
      const link = {
        id,
        outgoing,
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
      };
      this.links.set(id, link);
      dc.onopen = () => {
        if (this.links.get(id) !== link) return;
        link.open = true;
        link.lastSeen = Date.now();
        this.lastChange = Date.now();
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
        if (e.candidate && e.candidate.candidate) this.signal({ t: 'ice', to: id, ice: e.candidate.toJSON() });
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
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.dropLink(link);
        else this.emit('peers');
      };
      if (outgoing) {
        link.tx.audio = pc.addTransceiver('audio', { direction: 'sendrecv' });
        link.tx.video = pc.addTransceiver('video', { direction: 'sendrecv' });
      }
      return link;
    }

    connectTo(id) {
      const link = this.createLink(id, true);
      this.applySenders(link);
      this.queueRtc(link, async () => {
        await link.pc.setLocalDescription(await link.pc.createOffer());
        this.signal({ t: 'sdp', to: id, sdp: { type: 'offer', sdp: link.pc.localDescription.sdp } });
      });
    }

    dropLink(link, silent) {
      if (this.links.get(link.id) !== link) return;
      this.links.delete(link.id);
      const wasOpen = link.open;
      link.open = false;
      try {
        link.dc.close();
      } catch (e) {}
      try {
        link.pc.close();
      } catch (e) {}
      this.lastChange = Date.now();
      if (silent) return;
      if (wasOpen && link.info) this.emit('peer-left', link);
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
          this.dropLink(link, true);
        }
      }
      const anyUp = this.brokers.some((b) => b.ready);
      if (!anyUp) {
        if (now - this.startedAt > 15000) this.setStatus('offline');
      } else {
        const alone = !this.members().length;
        const every = alone ? (now - this.lastChange < 60000 ? 5000 : 15000) : 30000;
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

    send(link, msg) {
      if (!link.open || link.dc.readyState !== 'open') return false;
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

    sendHello(link) {
      this.send(link, { t: 'hello', v: 2, user: this.me, state: this.local });
      const msgs = this.messages.slice(-HISTORY_SYNC).map(wire);
      for (let i = 0; i < msgs.length; i += HIST_CHUNK) this.send(link, { t: 'hist', msgs: msgs.slice(i, i + HIST_CHUNK) });
      let changed = false;
      for (const m of this.messages) {
        if (m.pending) {
          delete m.pending;
          changed = true;
        }
      }
      if (changed) this.emit('messages', { added: [], delivered: true });
    }

    onData(link, data) {
      if (this.links.get(link.id) !== link || !data || typeof data !== 'object') return;
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
      for (const link of this.members()) if (this.send(link, { t: 'msg', m: wire(m) })) sent++;
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
      return [...this.links.values()].filter((l) => l.open && l.info);
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
