/* Болталка — аккаунт и друзья.
 *
 *  • Аккаунт без сервера: при регистрации создаётся секретный «ключ входа».
 *    Из него вычисляется публичный «код друга» (как номер телефона) и id.
 *    С тем же ключом можно войти в другом браузере.
 *  • У каждого есть «почтовый ящик» — тема на MQTT-брокерах, вычисленная из
 *    кода друга. Туда приходят заявки в друзья.
 *  • Личный чат и звонки с другом идут через комнату на двоих, код которой
 *    вычисляется из кодов обоих друзей.
 */
(function () {
  'use strict';

  const BT = (window.BT = window.BT || {});
  const NET = BT.net;
  const ABC = 'abcdefghjkmnpqrstuvwxyz23456789'; // без похожих i/l/1, o/0

  const ident = {
    newSecret() {
      return Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => ABC[b % ABC.length]).join('');
    },
    async derive(secret) {
      const h = await NET.sha256('boltalka-id:' + secret);
      const code = Array.from(h.slice(0, 10), (b) => ABC[b % ABC.length]).join('');
      return { code, uid: 'u' + code };
    },
    fmtCode(code) {
      const c = String(code || '').toUpperCase();
      return c.slice(0, 5) + '-' + c.slice(5);
    },
    parseCode(input) {
      const s = String(input || '')
        .toLowerCase()
        .replace(/[\s\-_.]/g, '');
      return new RegExp(`^[${ABC}]{10}$`).test(s) ? s : null;
    },
    fmtKey(secret) {
      return String(secret || '')
        .toUpperCase()
        .replace(/(.{4})(?=.)/g, '$1-');
    },
    parseKey(input) {
      const s = String(input || '')
        .toLowerCase()
        .replace(/[\s\-_.]/g, '');
      return new RegExp(`^[${ABC}]{20}$`).test(s) ? s : null;
    },
    async dmCode(a, b) {
      return 'dm' + NET.hex(await NET.sha256('boltalka-dm:' + [a, b].sort().join(':'))).slice(0, 24);
    },
  };

  async function inboxOf(code) {
    return {
      topic: 'boltalka/v2/u/' + NET.hex(await NET.sha256('boltalka-inbox:' + code)).slice(0, 32),
      key: await NET.keyFrom('boltalka-inbox-key:' + code),
    };
  }

  /** Почтовый ящик: заявки в друзья. */
  class Hub {
    constructor(code) {
      this.code = code;
      this.handlers = {};
      this.seen = new Set();
      this.cache = new Map();
      this.chain = Promise.resolve();
      this.brokers = [];
      this.onTopic = (bytes) => this.onInbox(bytes);
      this.onBroker = (b) => {
        if (b.ready) this.emit('ready');
      };
    }
    on(type, fn) {
      (this.handlers[type] = this.handlers[type] || []).push(fn);
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
    get ready() {
      return this.brokers.some((b) => b.ready);
    }

    async start() {
      this.box = await inboxOf(this.code);
      this.brokers = NET.BROKERS.map(NET.broker);
      for (const b of this.brokers) {
        b.subscribe(this.box.topic, this.onTopic);
        b.onState(this.onBroker);
      }
      if (this.ready) setTimeout(() => this.emit('ready'), 300);
    }

    stop() {
      for (const b of this.brokers) {
        b.unsubscribe(this.box.topic, this.onTopic);
        b.offState(this.onBroker);
      }
      this.brokers = [];
    }

    async sendTo(code, obj) {
      let box = this.cache.get(code);
      if (!box) {
        box = await inboxOf(code);
        this.cache.set(code, box);
      }
      const bytes = await NET.seal(box.key, Object.assign({}, obj, { from: this.code, m: NET.randId() }));
      for (const b of NET.BROKERS.map(NET.broker)) b.publish(box.topic, bytes);
    }

    onInbox(bytes) {
      this.chain = this.chain
        .then(async () => {
          const obj = await NET.open(this.box.key, bytes);
          if (!obj || typeof obj.m !== 'string' || this.seen.has(obj.m)) return;
          this.seen.add(obj.m);
          const from = ident.parseCode(obj.from);
          if (!from || from === this.code) return;
          if (obj.t === 'req') {
            this.emit('request', {
              code: from,
              name: String(obj.name || '').slice(0, 32).trim() || 'Без имени',
              color: BT.isColor(obj.color) ? obj.color : BT.colorFor(from),
            });
          }
        })
        .catch(() => {});
    }
  }

  BT.ident = ident;
  BT.Hub = Hub;
})();
