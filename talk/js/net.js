/* Болталка — общая сеть: MQTT-брокеры (одно соединение на брокер для всех
 * комнат и почтового ящика), шифрование служебных сообщений, проверка связи. */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  // Публичные бесплатные MQTT-брокеры (MQTT поверх WebSocket). Используются все сразу.
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];

  // STUN — узнать свой внешний адрес; TURN — пересылка звука, если напрямую нельзя.
  // Open Relay (Metered) — бесплатный публичный TURN; свой TURN задаётся в настройках.
  const STUN = { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] };
  const OPENRELAY = {
    urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  };
  const ice = { custom: null, rest: null, servers: [STUN, OPENRELAY] };
  function rebuildIce() {
    ice.servers = [STUN].concat(ice.custom ? [ice.custom] : [], ice.rest ? [ice.rest] : [], [OPENRELAY]);
  }
  // Временные пароли для «staticauth» Open Relay (TURN REST API: HMAC-SHA1 общего секрета).
  async function openRelayRest() {
    const username = Math.floor(Date.now() / 1000) + 7 * 86400 + ':boltalka';
    const key = await crypto.subtle.importKey('raw', enc.encode('openrelayprojectsecret'), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(username)));
    return {
      urls: [
        'turn:staticauth.openrelay.metered.ca:80',
        'turn:staticauth.openrelay.metered.ca:443',
        'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
        'turns:staticauth.openrelay.metered.ca:443?transport=tcp',
      ],
      username,
      credential: btoa(String.fromCharCode(...sig)),
    };
  }
  const ready = (async () => {
    try {
      ice.rest = await openRelayRest();
    } catch (e) {}
    rebuildIce();
  })();
  /** Свой TURN из настроек: { urls: 'turn:…, turns:…', username, credential } или null. */
  function setCustomTurn(cfg) {
    const urls = String((cfg && cfg.urls) || '')
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter((u) => /^turns?:/i.test(u));
    ice.custom = urls.length ? { urls, username: String(cfg.username || ''), credential: String(cfg.credential || '') } : null;
    rebuildIce();
  }

  const randId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  const sha256 = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  const keyFrom = async (s) => crypto.subtle.importKey('raw', await sha256(s), 'AES-GCM', false, ['encrypt', 'decrypt']);

  async function seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv);
    out.set(ct, 12);
    return out;
  }
  async function open(key, bytes) {
    if (!bytes || bytes.length < 29) return null;
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));
      const obj = JSON.parse(dec.decode(plain));
      return obj && typeof obj === 'object' ? obj : null;
    } catch (e) {
      return null;
    }
  }

  /* ---------- крошечный MQTT 3.1.1 клиент (QoS 0) ---------- */
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
    constructor(url) {
      this.url = url;
      this.topics = new Map(); // тема → обработчики
      this.stateFns = new Set();
      this.ready = false;
      this.ws = null;
      this.delay = 2000;
      this.buf = new Uint8Array(0);
      this.pid = 1;
      this.lastError = '';
      this.connect();
    }

    get host() {
      try {
        return new URL(this.url).hostname;
      } catch (e) {
        return this.url;
      }
    }

    connect() {
      let ws;
      try {
        ws = new WebSocket(this.url, ['mqtt']);
      } catch (e) {
        this.lastError = String(e.message || e);
        this.retry();
        return;
      }
      this.ws = ws;
      ws.binaryType = 'arraybuffer';
      this.buf = new Uint8Array(0);
      ws.onopen = () => ws.send(mqttPacket(0x10, [...mqttStr('MQTT'), 4, 0x02, 0, 40, ...mqttStr('bt' + randId())]));
      ws.onmessage = (e) => this.feed(new Uint8Array(e.data));
      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        clearInterval(this.pinger);
        if (this.ready) {
          this.ready = false;
          this.emitState();
        } else if (!this.lastError) this.lastError = 'не удалось подключиться';
        this.retry();
      };
      ws.onerror = () => {};
    }

    retry() {
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.connect(), this.delay);
      this.delay = Math.min(30000, this.delay * 2);
    }

    wake() {
      if (this.ws) return;
      clearTimeout(this.retryTimer);
      this.delay = 2000;
      this.connect();
    }

    emitState() {
      for (const fn of this.stateFns) {
        try {
          fn(this);
        } catch (e) {
          console.error(e);
        }
      }
    }
    onState(fn) {
      this.stateFns.add(fn);
    }
    offState(fn) {
      this.stateFns.delete(fn);
    }

    sendSubscribe(topics) {
      if (!this.ready || !topics.length) return;
      const body = [(this.pid >> 8) & 255, this.pid & 255];
      this.pid = (this.pid % 60000) + 1;
      for (const t of topics) body.push(...mqttStr(t), 0);
      this.ws.send(mqttPacket(0x82, body));
    }

    subscribe(topic, fn) {
      let set = this.topics.get(topic);
      if (!set) {
        set = new Set();
        this.topics.set(topic, set);
        this.sendSubscribe([topic]);
      }
      set.add(fn);
    }

    unsubscribe(topic, fn) {
      const set = this.topics.get(topic);
      if (!set) return;
      set.delete(fn);
      if (set.size) return;
      this.topics.delete(topic);
      if (this.ready && this.ws) {
        const body = [(this.pid >> 8) & 255, this.pid & 255, ...mqttStr(topic)];
        this.pid = (this.pid % 60000) + 1;
        try {
          this.ws.send(mqttPacket(0xa2, body));
        } catch (e) {}
      }
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
          this.lastError = 'брокер отказал (код ' + body[1] + ')';
          if (this.ws) this.ws.close();
          return;
        }
        this.ready = true;
        this.lastError = '';
        this.delay = 2000;
        clearInterval(this.pinger);
        this.pinger = setInterval(() => {
          if (this.ws && this.ws.readyState === 1) this.ws.send(new Uint8Array([0xc0, 0]));
        }, 25000);
        this.sendSubscribe([...this.topics.keys()]);
        this.emitState();
      } else if (type === 3) {
        // PUBLISH
        const qos = (first >> 1) & 3;
        const tlen = (body[0] << 8) | body[1];
        const topic = dec.decode(body.subarray(2, 2 + tlen));
        let p = 2 + tlen;
        if (qos > 0) p += 2;
        const payload = body.slice(p);
        const set = this.topics.get(topic);
        if (set) for (const fn of [...set]) fn(payload, this);
      }
    }

    publish(topic, bytes) {
      if (!this.ready || !this.ws || this.ws.readyState !== 1) return false;
      const head = mqttStr(topic);
      const body = new Uint8Array(head.length + bytes.length);
      body.set(head);
      body.set(bytes, head.length);
      try {
        this.ws.send(mqttPacket(0x30, body));
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  const pool = new Map();
  function broker(url) {
    let b = pool.get(url);
    if (!b) {
      b = new Broker(url);
      pool.set(url, b);
    }
    return b;
  }

  /** Проверка связи: брокеры и STUN/TURN. */
  async function diagnose() {
    for (const url of BROKERS) broker(url);
    await new Promise((r) => setTimeout(r, BROKERS.every((u) => pool.get(u).ready) ? 0 : 4000));
    const brokers = BROKERS.map((u) => {
      const b = pool.get(u);
      return { host: b.host, ok: b.ready, error: b.lastError };
    });
    const res = { host: 0, srflx: 0, relay: 0, relayFrom: [], custom: !!ice.custom, customOk: false, error: '' };
    try {
      const pc = new RTCPeerConnection({ iceServers: ice.servers });
      pc.createDataChannel('test');
      const done = new Promise((resolve) => {
        const t = setTimeout(resolve, 9000);
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            clearTimeout(t);
            resolve();
            return;
          }
          const m = / typ (\w+)/.exec(e.candidate.candidate || '');
          const typ = m ? m[1] : '';
          if (typ === 'host') res.host++;
          if (typ === 'srflx' || typ === 'prflx') res.srflx++;
          if (typ === 'relay') {
            res.relay++;
            let host = '';
            try {
              host = String(e.url || '').replace(/^turns?:/, '').split(/[:?]/)[0];
            } catch (err) {}
            if (host && !res.relayFrom.includes(host)) res.relayFrom.push(host);
            if (ice.custom && e.url && ice.custom.urls.some((u) => u === e.url)) res.customOk = true;
          }
        };
      });
      await pc.setLocalDescription(await pc.createOffer());
      await done;
      pc.close();
    } catch (e) {
      res.error = String(e.message || e);
    }
    return { brokers, ice: res };
  }

  BT.net = { BROKERS, iceServers: () => ice.servers, setCustomTurn, ready, broker, pool, randId, hex, sha256, keyFrom, seal, open, diagnose };
})();
