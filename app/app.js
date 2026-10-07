// Luau с нуля — уроки по слайдам в стиле Duolingo.
// Контент лежит в app/content/*.js (window.APP_UNITS), здесь только движок.
(function () {
  "use strict";

  var H = window.LuauHighlight;
  var esc = H.esc;
  var UNITS = window.APP_UNITS || [];
  var STORE_KEY = "luauApp.v1";
  var MAX_HEARTS = 5;
  var DAILY_GOAL = 30;
  var app = document.getElementById("app");

  // ---------- Уроки ----------
  var LESSONS = [];
  UNITS.forEach(function (unit, ui) {
    unit.lessons.forEach(function (lesson) {
      lesson.unit = ui;
      lesson.index = LESSONS.length;
      LESSONS.push(lesson);
    });
  });
  function findLesson(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
    return null;
  }

  // ---------- Состояние ----------
  function defaults() {
    return { started: false, done: {}, xp: 0, streak: 0, lastDay: null, dayXp: { day: null, xp: 0 }, sound: true, unlockAll: false };
  }
  function loadState() {
    var s = defaults();
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (raw && typeof raw === "object") {
        Object.keys(s).forEach(function (k) { if (raw[k] !== undefined) s[k] = raw[k]; });
      }
    } catch (e) { /* хранилище недоступно — работаем без сохранения */ }
    return s;
  }
  var state = loadState();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function dayKey(d) {
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function today() { return dayKey(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function liveStreak() {
    return state.lastDay === today() || state.lastDay === yesterday() ? state.streak : 0;
  }
  function todayXp() { return state.dayXp && state.dayXp.day === today() ? state.dayXp.xp : 0; }

  function isDone(lesson) { return !!state.done[lesson.id]; }
  function isUnlocked(lesson) {
    if (state.unlockAll || lesson.index === 0 || isDone(lesson)) return true;
    return isDone(LESSONS[lesson.index - 1]);
  }
  function currentLesson() {
    for (var i = 0; i < LESSONS.length; i++) if (!isDone(LESSONS[i])) return LESSONS[i];
    return null;
  }

  // ---------- Утилиты ----------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function shuffledIndices(n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    if (n < 2) return idx;
    var out;
    do { out = shuffle(idx); } while (out.every(function (v, i) { return v === i; }));
    return out;
  }
  function md(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  }
  function paras(text) {
    if (!text) return "";
    var list = Array.isArray(text) ? text : [text];
    return list.map(function (p) { return "<p>" + md(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function whereHtml(w) {
    var parts = w.split(">").map(function (s) { return s.trim(); });
    return parts.map(function (p, i) { return i === parts.length - 1 ? "<b>" + esc(p) + "</b>" : esc(p); }).join(" › ");
  }
  function codeBlock(code, where, out) {
    var h = '<div class="code">';
    if (where) h += '<div class="code-where">📍 ' + whereHtml(where) + "</div>";
    h += "<pre>" + H.highlight(code) + "</pre></div>";
    if (out) h += '<div class="output"><span>Output</span><pre>' + esc(out) + "</pre></div>";
    return h;
  }
  function lessonGuideUrl(lesson) { return "lessons/" + lesson.id + ".html"; }

  // ---------- Маскот ----------
  function mascot(mood) {
    var pupils = mood === "sad"
      ? '<rect x="35" y="52" width="12" height="13" rx="5" fill="#3c3c3c"/><rect x="73" y="52" width="12" height="13" rx="5" fill="#3c3c3c"/>'
      : '<rect x="37" y="44" width="12" height="16" rx="5" fill="#3c3c3c"/><rect x="71" y="44" width="12" height="16" rx="5" fill="#3c3c3c"/>' +
        '<circle cx="45" cy="47" r="2.5" fill="#fff"/><circle cx="79" cy="47" r="2.5" fill="#fff"/>';
    var mouth = mood === "sad"
      ? '<path d="M45 90 Q60 78 75 90" fill="none" stroke="#3c3c3c" stroke-width="5" stroke-linecap="round"/>'
      : mood === "wow"
        ? '<ellipse cx="60" cy="85" rx="8" ry="9" fill="#3c3c3c"/>'
        : '<path d="M42 78 Q60 98 78 78 Z" fill="#3c3c3c"/><path d="M50 88 Q60 94 70 88" fill="#ff7b7b"/>';
    var brows = mood === "sad"
      ? '<path d="M28 34 L50 40" stroke="#3a7a00" stroke-width="5" stroke-linecap="round"/><path d="M92 34 L70 40" stroke="#3a7a00" stroke-width="5" stroke-linecap="round"/>'
      : "";
    return '<svg viewBox="0 0 120 124" aria-hidden="true">' +
      '<rect x="55" y="2" width="10" height="20" rx="4" fill="#58a700"/>' +
      '<circle cx="60" cy="8" r="8" fill="#ffc800"/>' +
      '<rect x="8" y="24" width="104" height="98" rx="26" fill="#58a700"/>' +
      '<rect x="8" y="18" width="104" height="96" rx="26" fill="#58cc02"/>' +
      '<rect x="24" y="34" width="32" height="34" rx="12" fill="#fff"/>' +
      '<rect x="64" y="34" width="32" height="34" rx="12" fill="#fff"/>' +
      pupils + brows +
      '<circle cx="22" cy="80" r="7" fill="#ff9fb0" opacity=".7"/><circle cx="98" cy="80" r="7" fill="#ff9fb0" opacity=".7"/>' +
      mouth +
      "</svg>";
  }

  // ---------- Звуки ----------
  var audioCtx = null;
  function playTones(freqs, step, type, volume) {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = audioCtx.currentTime;
      freqs.forEach(function (f, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = f;
        var start = t0 + i * step;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + step * 1.6);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + step * 1.7);
      });
    } catch (e) { /* без звука */ }
  }
  var sfx = {
    right: function () { playTones([660, 990], 0.09, "sine", 0.18); },
    wrong: function () { playTones([196, 147], 0.13, "triangle", 0.2); },
    tap: function () { playTones([880], 0.03, "sine", 0.05); },
    finish: function () { playTones([523, 659, 784, 1047], 0.11, "sine", 0.18); }
  };

  // ---------- Мелкие эффекты ----------
  function toast(text) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1700);
  }
  function confetti() {
    var box = document.createElement("div");
    box.className = "confetti";
    var colors = ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#ce82ff", "#ff9600"];
    for (var i = 0; i < 90; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2.2 + Math.random() * 1.8) + "s";
      p.style.animationDelay = (Math.random() * 0.6) + "s";
      p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 5000);
  }

  function modal(html, onMount) {
    closeModal();
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
    back.addEventListener("click", function (e) { if (e.target === back) closeModal(); });
    document.body.appendChild(back);
    if (onMount) onMount(back.querySelector(".modal"));
  }
  function closeModal() {
    var m = document.querySelector(".modal-back");
    if (m) m.remove();
  }

  // ---------- Роутинг ----------
  var lessonRun = null;  // активный урок
  function route() {
    closeModal();
    lessonRun = null;
    var hash = location.hash || "";
    var m = hash.match(/^#\/learn\/([\w-]+)/);
    if (m) {
      var lesson = findLesson(m[1]);
      if (lesson && isUnlocked(lesson)) { startLesson(lesson); return; }
      location.replace("#/");
      return;
    }
    if (!state.started && !Object.keys(state.done).length) renderWelcome();
    else renderPath();
  }
  window.addEventListener("hashchange", route);

  // ---------- Приветствие ----------
  function renderWelcome() {
    document.title = "Luau с нуля — учись делать игры в Roblox";
    app.innerHTML =
      '<div class="welcome">' +
      '<div class="hero-mascot">' + mascot("happy") + "</div>" +
      "<h1>Научись писать скрипты для Roblox</h1>" +
      "<p>Короткие уроки по шагам: немного теории, потом практика. По 5 минут в день.</p>" +
      '<div class="feat">' +
      "<div><span>🧩</span>Собирай код из блоков и вставляй пропущенные слова</div>" +
      "<div><span>📍</span>Узнай, куда класть каждый скрипт, чтобы всё работало</div>" +
      "<div><span>🎮</span>От первого print до магазина и PvP-оружия</div>" +
      "</div>" +
      '<div class="actions">' +
      '<button class="btn" id="go">Начать обучение</button>' +
      '<a class="btn ghost" href="course.html">Открыть текстовый курс</a>' +
      "</div></div>";
    document.getElementById("go").addEventListener("click", function () {
      state.started = true;
      save();
      location.hash = "#/learn/" + LESSONS[0].id;
    });
  }

  // ---------- Путь ----------
  function topBar() {
    var streak = liveStreak();
    return '<header class="bar"><div class="bar-in">' +
      '<a class="brand" href="#/">' + mascot("happy") + '<span class="txt">Luau с нуля</span></a>' +
      '<span class="stat streak' + (streak ? "" : " off") + '" title="Дней подряд">🔥 ' + streak + "</span>" +
      '<span class="stat xp" title="Опыт">⭐ ' + state.xp + "</span>" +
      '<button class="icon-btn" id="settings-btn" aria-label="Настройки">⚙️</button>' +
      "</div></header>";
  }

  function renderPath() {
    document.title = "Luau с нуля — путь обучения";
    var current = currentLesson();
    var html = topBar() + '<main class="path">';
    UNITS.forEach(function (unit, ui) {
      html += '<section class="unit" style="--u:' + unit.color + ";--ud:" + unit.shade + '">' +
        '<div class="unit-head"><div><small>Раздел ' + (ui + 1) + "</small><h2>" + esc(unit.title) + "</h2><p>" + esc(unit.desc) + "</p></div>" +
        '<a class="unit-guide" href="course.html" title="Текстовый курс">📖</a></div>' +
        '<div class="nodes">';
      var mid = Math.floor(unit.lessons.length / 2);
      unit.lessons.forEach(function (lesson, li) {
        var x = Math.round(Math.sin(li * 1.1) * 72);
        // маскот стоит рядом со средним уроком раздела, с противоположной стороны
        var side = li === mid ? '<div class="side-mascot ' + (x >= 0 ? "left" : "right") + '">' + mascot(ui % 3 === 2 ? "wow" : "happy") + "</div>" : "";
        var done = isDone(lesson);
        var unlocked = isUnlocked(lesson);
        var isCurrent = current && current.id === lesson.id;
        var cls = "node" + (unlocked ? "" : " locked") + (isCurrent ? " current" : "");
        html += '<div class="node-wrap" style="--x:' + x + 'px">' +
          (isCurrent ? '<div class="start-tip">' + (lesson.index === 0 && !done ? "Начать" : "Дальше") + "</div>" : "") +
          '<button class="' + cls + '" data-id="' + lesson.id + '" aria-label="' + esc(lesson.title) + '">' +
          '<span class="ic">' + (unlocked ? lesson.icon : "🔒") + "</span>" +
          (done ? '<span class="check">✓</span>' : "") +
          "</button>" + side + "</div>";
      });
      html += "</div></section>";
    });
    html += '<div class="path-end">Хочешь читать подробно? <a href="course.html">Текстовый курс</a> · <a href="cheatsheet.html">Шпаргалка</a></div>';
    html += "</main>";
    if (current) {
      html += '<div class="continue-dock"><a class="btn" href="#/learn/' + current.id + '">' +
        (Object.keys(state.done).length ? "Продолжить" : "Начать обучение") + "</a></div>";
    }
    app.innerHTML = html;

    app.querySelectorAll(".node").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        sfx.tap();
        openPop(btn);
      });
    });
    document.getElementById("settings-btn").addEventListener("click", openSettings);

    var cur = app.querySelector(".node.current");
    if (cur) cur.scrollIntoView({ block: "center" });
  }

  function closePop() {
    var old = app.querySelector(".pop");
    if (old) {
      old.parentNode.classList.remove("open-pop");
      old.remove();
    }
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".pop")) closePop();
  });

  function openPop(btn) {
    var wrap = btn.parentNode;
    var had = wrap.querySelector(".pop");
    closePop();
    if (had) return;
    var lesson = findLesson(btn.getAttribute("data-id"));
    var unit = UNITS[lesson.unit];
    var unlocked = isUnlocked(lesson);
    var done = isDone(lesson);
    var pop = document.createElement("div");
    pop.className = "pop" + (unlocked ? "" : " locked");
    var inUnit = unit.lessons.indexOf(lesson) + 1;
    pop.innerHTML = "<h3>" + esc(lesson.title) + "</h3>" +
      "<p>" + (unlocked ? "Урок " + inUnit + " из " + unit.lessons.length + (done ? " · пройден ✓" : "") : "Сначала пройди предыдущие уроки") + "</p>" +
      (unlocked
        ? '<a class="btn" href="#/learn/' + lesson.id + '">' + (done ? "Повторить +5 ⭐" : "Начать +10 ⭐") + "</a>"
        : "") +
      '<div class="pop-links"><a href="' + lessonGuideUrl(lesson) + '">📖 Подробная теория</a></div>';
    wrap.appendChild(pop);
    wrap.classList.add("open-pop");
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  // ---------- Настройки ----------
  function openSettings() {
    var goalPct = Math.min(100, Math.round(todayXp() / DAILY_GOAL * 100));
    modal(
      "<h2>Профиль и настройки</h2>" +
      '<div class="goal">🎯 Цель дня: ' + todayXp() + " / " + DAILY_GOAL + ' ⭐<div class="goal-bar"><span style="width:' + goalPct + '%"></span></div></div>' +
      '<div class="set-row"><div>🔥 Дней подряд<small>Проходи хотя бы один урок в день</small></div><b>' + liveStreak() + "</b></div>" +
      '<div class="set-row"><div>✅ Пройдено уроков</div><b>' + Object.keys(state.done).length + " / " + LESSONS.length + "</b></div>" +
      '<div class="set-row"><div>🔊 Звуки</div><button class="switch' + (state.sound ? " on" : "") + '" data-k="sound" aria-label="Звуки"></button></div>' +
      '<div class="set-row"><div>🔓 Открыть все уроки<small>Если ты уже что-то знаешь и хочешь перепрыгнуть</small></div><button class="switch' + (state.unlockAll ? " on" : "") + '" data-k="unlockAll" aria-label="Открыть все уроки"></button></div>' +
      '<div class="links"><a href="course.html">📚 Текстовый курс с подробными уроками</a><a href="cheatsheet.html">📍 Шпаргалка: куда класть скрипты</a></div>' +
      '<div class="actions"><button class="btn blue" id="close-set">Готово</button>' +
      '<button class="btn plain" id="reset">Сбросить прогресс</button></div>',
      function (m) {
        m.querySelectorAll(".switch").forEach(function (sw) {
          sw.addEventListener("click", function () {
            var k = sw.getAttribute("data-k");
            state[k] = !state[k];
            sw.classList.toggle("on", state[k]);
            save();
            if (k === "sound" && state.sound) sfx.right();
          });
        });
        m.querySelector("#close-set").addEventListener("click", function () { closeModal(); renderPath(); });
        m.querySelector("#reset").addEventListener("click", function () {
          if (confirm("Точно сбросить весь прогресс? Это нельзя отменить.")) {
            var sound = state.sound;
            state = defaults();
            state.sound = sound;
            save();
            closeModal();
            location.hash = "#/";
            route();
          }
        });
      }
    );
  }

  // ---------- Урок ----------
  var KICKERS = {
    info: ["Новое", "var(--blue)"],
    choice: ["Выбери ответ", "var(--blue)"],
    fill: ["Заполни пропуски", "#ce82ff"],
    order: ["Собери код", "#ff9600"],
    match: ["Найди пары", "#ff4b4b"],
    input: ["Напиши ответ", "var(--green-d)"]
  };
  var PRAISE = ["Отлично!", "Верно!", "Супер!", "Так держать!", "Молодец!", "Правильно!"];

  function startLesson(lesson) {
    document.title = lesson.title + " — Luau с нуля";
    var run = lessonRun = {
      lesson: lesson,
      queue: lesson.slides.map(function (_, i) { return i; }),
      pos: 0,
      done: 0,
      hearts: MAX_HEARTS,
      mistakes: 0,
      correct: 0,
      combo: 0,
      start: Date.now(),
      phase: "idle",   // idle | ok | bad
      ex: null
    };
    app.innerHTML =
      '<div class="lesson">' +
      '<header class="lbar"><button class="icon-btn" id="exit" aria-label="Выйти">✕</button>' +
      '<div class="lprog"><span></span></div>' +
      '<div class="hearts">❤️ <b id="hearts">' + run.hearts + "</b></div></header>" +
      '<main class="stage"><div class="slide" id="slide"></div></main>' +
      '<footer class="foot" id="foot"><div class="foot-in"><div class="fb" id="fb"></div>' +
      '<button class="btn" id="main">Проверить</button></div></footer>' +
      "</div>";
    document.getElementById("exit").addEventListener("click", confirmExit);
    document.getElementById("main").addEventListener("click", onMain);
    showSlide();
  }

  function confirmExit() {
    if (!lessonRun) return;
    modal(
      '<div class="mascot-sm">' + mascot("sad") + "</div>" +
      "<h2>Подожди, не уходи!</h2><p>Если выйдешь сейчас, прогресс этого урока пропадёт.</p>" +
      '<div class="actions"><button class="btn blue" id="stay">Продолжить урок</button>' +
      '<button class="btn plain" id="leave" style="color:var(--red)">Выйти</button></div>',
      function (m) {
        m.querySelector("#stay").addEventListener("click", closeModal);
        m.querySelector("#leave").addEventListener("click", function () { closeModal(); location.hash = "#/"; });
      }
    );
  }

  function setProgress() {
    var run = lessonRun;
    var bar = app.querySelector(".lprog span");
    if (bar) bar.style.width = Math.round(run.done / run.lesson.slides.length * 100) + "%";
  }

  function setMain(text, enabled) {
    var b = document.getElementById("main");
    b.textContent = text;
    b.disabled = !enabled;
  }

  function showSlide() {
    var run = lessonRun;
    var slide = run.lesson.slides[run.queue[run.pos]];
    var el = document.getElementById("slide");
    var foot = document.getElementById("foot");
    foot.className = "foot";
    document.getElementById("fb").innerHTML = "";
    run.phase = "idle";
    el.className = "";
    void el.offsetWidth;  // перезапуск анимации появления
    el.className = "slide";
    window.scrollTo(0, 0);

    var kick = KICKERS[slide.t] || KICKERS.info;
    var head = '<div class="kicker" style="--kick:' + kick[1] + '">' + kick[0] + "</div>";
    var renderer = RENDER[slide.t];
    run.ex = renderer(slide, el, head, function (ready) {
      if (run.phase === "idle") setMain("Проверить", ready);
    }, function (ok) {
      // упражнения без кнопки «Проверить» (пары) сообщают результат сами
      feedback(ok, slide, null);
    });
    setMain(slide.t === "info" ? "Продолжить" : "Проверить", slide.t === "info");
    setProgress();
    fitStage();
  }

  function onMain() {
    var run = lessonRun;
    if (!run) return;
    var btn = document.getElementById("main");
    if (btn.disabled) return;
    var slide = run.lesson.slides[run.queue[run.pos]];
    if (run.phase === "idle") {
      if (slide.t === "info") {
        run.done++;
        next();
        return;
      }
      var res = run.ex.check();
      feedback(res.ok, slide, res.answer);
      return;
    }
    if (run.phase === "bad" && run.hearts <= 0) {
      renderNoHearts(run.lesson);
      return;
    }
    next();
  }

  function feedback(ok, slide, answerHtml) {
    var run = lessonRun;
    run.phase = ok ? "ok" : "bad";
    var foot = document.getElementById("foot");
    var fb = document.getElementById("fb");
    foot.className = "foot " + (ok ? "ok" : "bad");
    var body = "";
    if (ok) {
      run.done++;
      run.correct++;
      run.combo++;
      sfx.right();
      if (run.combo === 3 || run.combo === 5 || run.combo === 8 || run.combo === 12) toast("🔥 " + run.combo + " подряд!");
      if (slide.why) body += '<div class="fb-why">' + md(slide.why) + "</div>";
      fb.innerHTML = '<div class="fb-title"><span class="badge">✅</span>' + PRAISE[Math.floor(Math.random() * PRAISE.length)] + "</div>" +
        (body ? '<div class="fb-body">' + body + "</div>" : "");
    } else {
      run.mistakes++;
      run.combo = 0;
      run.hearts--;
      sfx.wrong();
      var h = document.getElementById("hearts");
      h.textContent = Math.max(0, run.hearts);
      var hb = h.parentNode;
      hb.classList.remove("hit");
      void hb.offsetWidth;
      hb.classList.add("hit");
      run.queue.push(run.queue[run.pos]);  // ошибку повторим в конце урока
      if (answerHtml) body += "<div>Правильный ответ:</div>" + answerHtml;
      if (slide.why) body += '<div class="fb-why">' + md(slide.why) + "</div>";
      fb.innerHTML = '<div class="fb-title"><span class="badge">❌</span>' + (run.hearts > 0 ? "Неправильно" : "Сердца закончились") + "</div>" +
        '<div class="fb-body">' + body + "</div>";
    }
    setMain("Продолжить", true);
    setProgress();
    fitStage();
  }

  // Под нижней панелью всегда остаётся место, чтобы можно было докрутить задание
  function fitStage() {
    var foot = document.getElementById("foot");
    var stage = app.querySelector(".stage");
    if (foot && stage) stage.style.paddingBottom = (foot.offsetHeight + 24) + "px";
  }

  function next() {
    var run = lessonRun;
    run.pos++;
    if (run.pos >= run.queue.length) finishLesson();
    else showSlide();
  }

  function finishLesson() {
    var run = lessonRun;
    var lesson = run.lesson;
    var firstTime = !isDone(lesson);
    var perfect = run.mistakes === 0;
    var xp = (firstTime ? 10 : 5) + (perfect ? 5 : 0);
    var answers = run.correct + run.mistakes;
    var accuracy = answers ? Math.round(run.correct / answers * 100) : 100;
    var secs = Math.round((Date.now() - run.start) / 1000);
    var time = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");

    state.done[lesson.id] = { best: Math.max(accuracy, (state.done[lesson.id] && state.done[lesson.id].best) || 0) };
    state.xp += xp;
    if (state.lastDay !== today()) {
      state.streak = state.lastDay === yesterday() ? state.streak + 1 : 1;
      state.lastDay = today();
    }
    if (!state.dayXp || state.dayXp.day !== today()) state.dayXp = { day: today(), xp: 0 };
    state.dayXp.xp += xp;
    state.started = true;
    save();
    lessonRun = null;

    var nextLesson = LESSONS[lesson.index + 1];
    var isLast = !nextLesson;
    sfx.finish();
    confetti();
    app.innerHTML =
      '<div class="result">' +
      '<div class="big-mascot">' + mascot("wow") + "</div>" +
      "<h1>" + (isLast ? "Курс пройден! 🎓" : perfect ? "Идеально!" : "Урок пройден!") + "</h1>" +
      "<p>" + esc(lesson.title) + (liveStreak() > 1 ? " · 🔥 " + liveStreak() + " дн. подряд" : "") + "</p>" +
      '<div class="cards">' +
      '<div class="card" style="--c:var(--gold)"><small>Опыт</small><b>+' + xp + "</b></div>" +
      '<div class="card" style="--c:var(--green)"><small>Точность</small><b>' + accuracy + "%</b></div>" +
      '<div class="card" style="--c:var(--blue)"><small>Время</small><b>' + time + "</b></div>" +
      "</div>" +
      '<div class="actions">' +
      (nextLesson ? '<a class="btn" href="#/learn/' + nextLesson.id + '">Следующий урок</a>' : "") +
      '<a class="btn ' + (nextLesson ? "ghost" : "") + '" href="#/">К пути обучения</a>' +
      '<a class="btn plain" href="' + lessonGuideUrl(lesson) + '">📖 Подробная теория и задания для Studio</a>' +
      "</div></div>";
  }

  function renderNoHearts(lesson) {
    lessonRun = null;
    app.innerHTML =
      '<div class="result sad">' +
      '<div class="big-mascot">' + mascot("sad") + "</div>" +
      "<h1>Сердца закончились 💔</h1>" +
      "<p>Ничего страшного, ошибаться — часть обучения. Повтори теорию и попробуй ещё раз.</p>" +
      '<div class="actions">' +
      '<button class="btn" id="retry">Попробовать снова</button>' +
      '<a class="btn ghost" href="' + lessonGuideUrl(lesson) + '">📖 Повторить теорию</a>' +
      '<a class="btn plain" href="#/">На главную</a>' +
      "</div></div>";
    document.getElementById("retry").addEventListener("click", function () { startLesson(lesson); });
  }

  // ---------- Типы слайдов ----------
  var RENDER = {
    info: function (s, el, head) {
      el.innerHTML = head +
        '<div class="tip-head">' + mascot("happy") + '<div class="bubble">' + md(s.title) + "</div></div>" +
        paras(s.text) +
        (s.code ? codeBlock(s.code, s.where, s.out) : "") +
        paras(s.after);
      return {};
    },

    choice: function (s, el, head, ready) {
      var order = shuffle(s.opts.map(function (_, i) { return i; }));
      var sel = -1;
      var locked = false;
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        (s.code ? codeBlock(s.code, s.where) : "") +
        '<div class="opts">' + order.map(function (oi, k) {
          return '<button class="opt" data-k="' + k + '"><span class="num">' + (k + 1) + "</span><span>" + md(s.opts[oi]) + "</span></button>";
        }).join("") + "</div>";
      var btns = Array.prototype.slice.call(el.querySelectorAll(".opt"));
      function pick(k) {
        if (locked) return;
        sel = k;
        sfx.tap();
        btns.forEach(function (b, i) { b.classList.toggle("sel", i === k); });
        ready(true);
      }
      btns.forEach(function (b, k) { b.addEventListener("click", function () { pick(k); }); });
      return {
        key: function (n) { if (n >= 1 && n <= btns.length) pick(n - 1); },
        check: function () {
          locked = true;
          var ok = order[sel] === s.a;
          btns.forEach(function (b) { b.disabled = true; b.classList.remove("sel"); });
          btns[sel].classList.add(ok ? "right" : "wrong");
          if (!ok) btns[order.indexOf(s.a)].classList.add("right");
          return { ok: ok, answer: "<div>" + md(s.opts[s.a]) + "</div>" };
        }
      };
    },

    fill: function (s, el, head, ready) {
      var parts = s.code.split("___");
      var slots = [];
      for (var i = 1; i < parts.length; i++) slots.push(-1);
      var order = shuffle(s.bank.map(function (_, i) { return i; }));
      var locked = false;
      var codeHtml = H.highlight(parts[0]);
      for (var p = 1; p < parts.length; p++) {
        codeHtml += '<button class="slot" data-s="' + (p - 1) + '"></button>' + H.highlight(parts[p]);
      }
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        '<div class="code">' + (s.where ? '<div class="code-where">📍 ' + whereHtml(s.where) + "</div>" : "") +
        "<pre>" + codeHtml + "</pre></div>" +
        '<div class="tiles fill-bank">' + order.map(function (bi) {
          return '<button class="tile" data-b="' + bi + '">' + esc(s.bank[bi]) + "</button>";
        }).join("") + "</div>";
      var slotEls = Array.prototype.slice.call(el.querySelectorAll(".slot"));
      var tileEls = Array.prototype.slice.call(el.querySelectorAll(".tile"));
      function sync() {
        slotEls.forEach(function (se, i) {
          var b = slots[i];
          se.textContent = b < 0 ? "" : s.bank[b];
          se.classList.toggle("filled", b >= 0);
        });
        tileEls.forEach(function (te) {
          te.classList.toggle("used", slots.indexOf(+te.getAttribute("data-b")) >= 0);
        });
        ready(slots.every(function (b) { return b >= 0; }));
      }
      tileEls.forEach(function (te) {
        te.addEventListener("click", function () {
          if (locked || te.classList.contains("used")) return;
          var free = slots.indexOf(-1);
          if (free < 0) return;
          slots[free] = +te.getAttribute("data-b");
          sfx.tap();
          sync();
        });
      });
      slotEls.forEach(function (se, i) {
        se.addEventListener("click", function () {
          if (locked || slots[i] < 0) return;
          slots[i] = -1;
          sync();
        });
      });
      return {
        check: function () {
          locked = true;
          var ok = true;
          slotEls.forEach(function (se, i) {
            var good = s.bank[slots[i]] === s.a[i];
            if (!good) ok = false;
            se.classList.add(good ? "right" : "wrong");
          });
          var k = 0;
          var solved = s.code.replace(/___/g, function () { return s.a[k++]; });
          return { ok: ok, answer: codeBlock(solved) };
        }
      };
    },

    order: function (s, el, head, ready) {
      var all = s.lines.concat(s.extra || []);
      var pool = shuffledIndices(all.length);
      var picked = [];
      var locked = false;
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        (s.given ? '<div class="order-given">' + codeBlock(s.given, s.where) + "</div>" : "") +
        '<div class="order-ans" id="ans"></div>' +
        '<div class="order-pool">' + pool.map(function (li) {
          return '<button class="line" data-l="' + li + '">' + H.highlight(all[li]) + "</button>";
        }).join("") + "</div>";
      var ans = el.querySelector("#ans");
      var poolEls = Array.prototype.slice.call(el.querySelectorAll(".order-pool .line"));
      function sync() {
        ans.innerHTML = picked.map(function (li, pos) {
          return '<button class="line" data-p="' + pos + '">' + H.highlight(all[li]) + "</button>";
        }).join("");
        ans.querySelectorAll(".line").forEach(function (b) {
          b.addEventListener("click", function () {
            if (locked) return;
            picked.splice(+b.getAttribute("data-p"), 1);
            sync();
          });
        });
        poolEls.forEach(function (b) {
          b.classList.toggle("used", picked.indexOf(+b.getAttribute("data-l")) >= 0);
        });
        ready(picked.length === s.lines.length);
      }
      poolEls.forEach(function (b) {
        b.addEventListener("click", function () {
          var li = +b.getAttribute("data-l");
          if (locked || picked.indexOf(li) >= 0 || picked.length >= s.lines.length) return;
          picked.push(li);
          sfx.tap();
          sync();
        });
      });
      sync();
      return {
        check: function () {
          locked = true;
          var got = picked.map(function (li) { return all[li]; }).join("\n");
          var ok = got === s.lines.join("\n");
          ans.classList.add(ok ? "right" : "wrong");
          return { ok: ok, answer: codeBlock(s.lines.join("\n")) };
        }
      };
    },

    match: function (s, el, head, ready, complete) {
      var n = s.pairs.length;
      var left = shuffle(s.pairs.map(function (_, i) { return i; }));
      var right = shuffle(s.pairs.map(function (_, i) { return i; }));
      var selL = -1, selR = -1, matched = 0, misses = 0;
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q || "Соедини пары") + "</h1>" +
        '<div class="match"><div class="match-col">' +
        left.map(function (pi) { return '<button class="opt" data-side="L" data-p="' + pi + '">' + md(s.pairs[pi][0]) + "</button>"; }).join("") +
        '</div><div class="match-col">' +
        right.map(function (pi) { return '<button class="opt" data-side="R" data-p="' + pi + '">' + md(s.pairs[pi][1]) + "</button>"; }).join("") +
        "</div></div>";
      var btns = Array.prototype.slice.call(el.querySelectorAll(".opt"));
      function btnFor(side, p) {
        return el.querySelector('.opt[data-side="' + side + '"][data-p="' + p + '"]');
      }
      function clearSel() {
        btns.forEach(function (b) { b.classList.remove("sel"); });
        selL = selR = -1;
      }
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.disabled) return;
          var p = +b.getAttribute("data-p");
          var side = b.getAttribute("data-side");
          if (side === "L") selL = selL === p ? -1 : p;
          else selR = selR === p ? -1 : p;
          btns.forEach(function (x) {
            var xp = +x.getAttribute("data-p");
            var xs = x.getAttribute("data-side");
            x.classList.toggle("sel", (xs === "L" && xp === selL) || (xs === "R" && xp === selR));
          });
          if (selL < 0 || selR < 0) { sfx.tap(); return; }
          var a = btnFor("L", selL), c = btnFor("R", selR);
          if (selL === selR) {
            matched++;
            sfx.tap();
            [a, c].forEach(function (x) {
              x.disabled = true;
              x.classList.remove("sel");
              x.classList.add("flash-ok");
              setTimeout(function () { x.classList.remove("flash-ok"); x.classList.add("done"); }, 350);
            });
            clearSel();
            if (matched === n) setTimeout(function () { complete(true); }, 380);
          } else {
            misses++;
            lessonRun.mistakes++;  // сердце не отнимаем, но точность и «идеально» учитывают
            lessonRun.combo = 0;
            sfx.wrong();
            [a, c].forEach(function (x) {
              x.classList.remove("sel");
              x.classList.add("wrong");
              setTimeout(function () { x.classList.remove("wrong"); }, 400);
            });
            clearSel();
          }
        });
      });
      return { auto: true, misses: function () { return misses; } };
    },

    input: function (s, el, head, ready) {
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        (s.code ? codeBlock(s.code, s.where) : "") +
        '<input class="inp" id="inp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Твой ответ" enterkeyhint="done">';
      var inp = el.querySelector("#inp");
      inp.addEventListener("input", function () { ready(inp.value.trim().length > 0); });
      if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) setTimeout(function () { inp.focus(); }, 50);
      function norm(v) {
        return String(v).trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ");
      }
      return {
        check: function () {
          inp.disabled = true;
          var ok = s.a.some(function (a) { return norm(a) === norm(inp.value); });
          inp.classList.add(ok ? "right" : "wrong");
          return { ok: ok, answer: "<div><code>" + esc(s.a[0]) + "</code></div>" };
        }
      };
    }
  };

  // ---------- Клавиатура ----------
  document.addEventListener("keydown", function (e) {
    if (!lessonRun) return;
    if (document.querySelector(".modal-back")) {
      if (e.key === "Escape") closeModal();
      return;
    }
    if (e.key === "Escape") { confirmExit(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      onMain();
      return;
    }
    var typing = e.target && e.target.tagName === "INPUT";
    if (!typing && /^[1-9]$/.test(e.key) && lessonRun.phase === "idle" && lessonRun.ex && lessonRun.ex.key) {
      lessonRun.ex.key(+e.key);
    }
  });

  route();
})();
