// Luau с нуля — уроки по слайдам, разбитые на ветки.
// Контент лежит в app/content/*.js (window.BRANCHES), здесь только движок.
(function () {
  "use strict";

  var H = window.LuauHighlight;
  var esc = H.esc;
  var BRANCHES = window.BRANCHES || [];
  var STORE_KEY = "luauApp.v2";
  var DAILY_GOAL = 30;
  var PRACTICE_SIZE = 10;
  var app = document.getElementById("app");

  // ---------- Уроки ----------
  var LESSONS = [];
  var BY_ID = {};
  var BRANCH_BY_ID = {};
  BRANCHES.forEach(function (br, bi) {
    br.index = bi;
    BRANCH_BY_ID[br.id] = br;
    br.lessons.forEach(function (lesson, li) {
      lesson.branch = br;
      lesson.pos = li;
      LESSONS.push(lesson);
      BY_ID[lesson.id] = lesson;
    });
  });

  // ---------- Состояние ----------
  function defaults() {
    return {
      started: false, done: {}, xp: 0, streak: 0, lastDay: null,
      dayXp: { day: null, xp: 0 }, sound: true, unlockAll: false, lastBranch: null
    };
  }
  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function loadState() {
    var s = defaults();
    var raw = readJson(STORE_KEY);
    if (!raw) {
      // переносим опыт и серию из прошлой версии приложения
      var old = readJson("luauApp.v1");
      if (old) raw = { started: old.started, xp: old.xp, streak: old.streak, lastDay: old.lastDay, dayXp: old.dayXp, sound: old.sound };
    }
    if (raw && typeof raw === "object") {
      Object.keys(s).forEach(function (k) { if (raw[k] !== undefined && raw[k] !== null) s[k] = raw[k]; });
    }
    return s;
  }
  var state = loadState();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* без сохранения */ }
  }

  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function today() { return dayKey(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function liveStreak() { return state.lastDay === today() || state.lastDay === yesterday() ? state.streak : 0; }
  function todayXp() { return state.dayXp && state.dayXp.day === today() ? state.dayXp.xp : 0; }
  function doneCount() { return LESSONS.filter(isDone).length; }

  function isDone(lesson) { return !!state.done[lesson.id]; }
  function isUnlocked(lesson) {
    if (state.unlockAll || lesson.pos === 0 || isDone(lesson)) return true;
    return isDone(lesson.branch.lessons[lesson.pos - 1]);
  }
  function branchDone(br) { return br.lessons.filter(isDone).length; }
  function nextInBranch(br) {
    for (var i = 0; i < br.lessons.length; i++) if (!isDone(br.lessons[i])) return br.lessons[i];
    return null;
  }
  function continueLesson() {
    var br = BRANCH_BY_ID[state.lastBranch] || BRANCHES[0];
    var lesson = br && nextInBranch(br);
    if (lesson) return lesson;
    for (var i = 0; i < BRANCHES.length; i++) {
      lesson = nextInBranch(BRANCHES[i]);
      if (lesson) return lesson;
    }
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
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function shuffledIndices(n) {
    if (n < 2) return range(n);
    var out;
    do { out = shuffle(range(n)); } while (out.every(function (v, i) { return v === i; }));
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
    if (where) h += '<div class="code-where">📍 Куда: ' + whereHtml(where) + "</div>";
    h += "<pre>" + H.highlight(code) + "</pre></div>";
    if (out) h += '<div class="output"><span>Output (что выведется)</span><pre>' + esc(out) + "</pre></div>";
    return h;
  }
  function treeHtml(tree) {
    return '<div class="tree"><div class="tree-title">Explorer</div>' +
      tree.split("\n").map(function (line) {
        var m = line.match(/^( *)(.*)$/);
        return '<div class="tree-line" style="--d:' + Math.floor(m[1].length / 2) + '">' + md(m[2]) + "</div>";
      }).join("") + "</div>";
  }
  function tipHtml(s) {
    var h = "";
    if (s.tip) h += '<div class="tip">💡 ' + md(s.tip) + "</div>";
    if (s.warn) h += '<div class="tip warn">⚠️ ' + md(s.warn) + "</div>";
    return h;
  }
  function brStyle(br) { return "--c:" + br.color + ";--cd:" + br.shade; }

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
    return '<svg viewBox="0 0 120 124" aria-hidden="true">' +
      '<rect x="55" y="2" width="10" height="20" rx="4" fill="#58a700"/>' +
      '<circle cx="60" cy="8" r="8" fill="#ffc800"/>' +
      '<rect x="8" y="24" width="104" height="98" rx="26" fill="#58a700"/>' +
      '<rect x="8" y="18" width="104" height="96" rx="26" fill="#58cc02"/>' +
      '<rect x="24" y="34" width="32" height="34" rx="12" fill="#fff"/>' +
      '<rect x="64" y="34" width="32" height="34" rx="12" fill="#fff"/>' +
      pupils +
      '<circle cx="22" cy="80" r="7" fill="#ff9fb0" opacity=".7"/><circle cx="98" cy="80" r="7" fill="#ff9fb0" opacity=".7"/>' +
      mouth + "</svg>";
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
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1900);
  }
  function confetti() {
    var box = document.createElement("div");
    box.className = "confetti";
    var colors = ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#ce82ff", "#ff9600"];
    for (var i = 0; i < 80; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2.2 + Math.random() * 1.8) + "s";
      p.style.animationDelay = (Math.random() * 0.6) + "s";
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
  var run = null;  // текущий урок
  function route() {
    closeModal();
    run = null;
    window.scrollTo(0, 0);
    var hash = location.hash || "";
    var m;
    if ((m = hash.match(/^#\/learn\/([\w-]+)/))) {
      var lesson = BY_ID[m[1]];
      if (lesson && isUnlocked(lesson)) startLesson(lesson);
      else location.replace(lesson ? "#/b/" + lesson.branch.id : "#/");
    } else if ((m = hash.match(/^#\/b\/([\w-]+)/)) && BRANCH_BY_ID[m[1]]) {
      renderBranch(BRANCH_BY_ID[m[1]]);
    } else if ((m = hash.match(/^#\/notes\/([\w-]+)/)) && BY_ID[m[1]]) {
      renderNotes(BY_ID[m[1]]);
    } else if (hash === "#/practice") {
      startPractice();
    } else if (!state.started && !doneCount()) {
      renderWelcome();
    } else {
      renderHome();
    }
  }
  window.addEventListener("hashchange", route);

  // ---------- Приветствие ----------
  function renderWelcome() {
    document.title = "Luau с нуля — учись делать игры в Roblox";
    var total = LESSONS.length;
    app.innerHTML =
      '<div class="welcome">' +
      '<div class="hero-mascot">' + mascot("happy") + "</div>" +
      "<h1>Научись делать игры в Roblox</h1>" +
      "<p>С нуля, простыми словами. Уроки по 5 минут: читаешь, отвечаешь на вопросы, пробуешь в Roblox Studio.</p>" +
      '<div class="feat">' +
      "<div><span>🌳</span><div><b>" + BRANCHES.length + " веток, " + total + " уроков</b><br>От первой строчки кода до своей игры</div></div>" +
      "<div><span>📍</span><div><b>Куда вставлять код</b><br>В каждом примере видно, в какое место положить скрипт</div></div>" +
      "<div><span>🧩</span><div><b>Не скучно</b><br>Собирай код из блоков, ищи пары, отвечай на вопросы</div></div>" +
      "</div>" +
      '<div class="actions">' +
      '<button class="btn" id="go">Начать обучение</button>' +
      '<button class="btn ghost" id="skip">Я уже немного знаю</button>' +
      "</div></div>";
    document.getElementById("go").addEventListener("click", function () {
      state.started = true;
      save();
      location.hash = "#/learn/" + LESSONS[0].id;
    });
    document.getElementById("skip").addEventListener("click", function () {
      state.started = true;
      save();
      renderHome();
    });
  }

  // ---------- Верхняя панель ----------
  function topBar(back) {
    var streak = liveStreak();
    return '<header class="bar"><div class="bar-in">' +
      (back
        ? '<a class="icon-btn back" href="' + back + '" aria-label="Назад">←</a>'
        : '<a class="brand" href="#/">' + mascot("happy") + '<span class="txt">Luau с нуля</span></a>') +
      '<span class="spacer"></span>' +
      '<span class="stat streak' + (streak ? "" : " off") + '" title="Дней подряд">🔥 ' + streak + "</span>" +
      '<span class="stat xp" title="Опыт">⭐ ' + state.xp + "</span>" +
      '<button class="icon-btn" id="settings-btn" aria-label="Настройки">⚙️</button>' +
      "</div></header>";
  }
  function bindBar() {
    var b = document.getElementById("settings-btn");
    if (b) b.addEventListener("click", openSettings);
  }

  // ---------- Главная ----------
  function renderHome() {
    document.title = "Luau с нуля — учись делать игры в Roblox";
    var cont = continueLesson();
    var xpToday = todayXp();
    var goalPct = Math.min(100, Math.round(xpToday / DAILY_GOAL * 100));
    var html = topBar() + '<main class="home">';

    if (cont) {
      var br = cont.branch;
      var first = !doneCount();
      html += '<section class="hero-card" style="' + brStyle(br) + '">' +
        '<div class="hc-top"><span class="hc-icon">' + cont.icon + "</span>" +
        "<div><small>" + (first ? "Начни отсюда" : "Следующий урок") + " · " + esc(br.title) + "</small>" +
        "<h2>" + esc(cont.title) + "</h2><p>" + esc(cont.sub) + "</p></div></div>" +
        '<a class="btn white" href="#/learn/' + cont.id + '">' + (first ? "Начать" : "Продолжить") + "</a></section>";
    } else {
      html += '<section class="hero-card done" style="--c:#ffc800;--cd:#e5a800">' +
        '<div class="hc-top"><span class="hc-icon">🏆</span><div><small>Все уроки пройдены</small>' +
        "<h2>Ты прошёл весь курс!</h2><p>Тренируйся, чтобы не забыть, и делай свою игру.</p></div></div>" +
        '<a class="btn white" href="#/practice">Тренировка</a></section>';
    }

    html += '<div class="mini-row">' +
      '<div class="goal-chip"><div>🎯 Цель дня <b>' + xpToday + " / " + DAILY_GOAL + " ⭐</b></div>" +
      '<div class="goal-bar"><span style="width:' + goalPct + '%"></span></div></div>' +
      (doneCount() ? '<a class="btn ghost small" href="#/practice">🏋️ Тренировка</a>' : "") +
      "</div>";

    html += '<h2 class="sec-title">Ветки обучения</h2>' +
      '<p class="sec-sub">Начни с первых двух веток. Остальные открыты всегда: выбирай, что интереснее.</p>' +
      '<div class="branches">';
    BRANCHES.forEach(function (br, i) {
      var d = branchDone(br);
      var n = br.lessons.length;
      var badge = d === n ? '<span class="badge gold">✓ Пройдено</span>'
        : i === 0 && !doneCount() ? '<span class="badge">Начни здесь</span>'
          : '<span class="badge soft">' + esc(br.level) + "</span>";
      html += '<a class="branch-card" href="#/b/' + br.id + '" style="' + brStyle(br) + '">' +
        '<span class="bc-icon">' + br.icon + "</span>" +
        '<div class="bc-body"><div class="bc-top"><b>' + (i + 1) + ". " + esc(br.title) + "</b>" + badge + "</div>" +
        "<p>" + esc(br.desc) + "</p>" +
        '<div class="bc-prog"><span style="width:' + Math.round(d / n * 100) + '%"></span></div>' +
        "<small>" + d + " из " + n + " уроков</small></div></a>";
    });
    html += "</div>" +
      '<footer class="home-foot"><a href="cheatsheet.html">📍 Шпаргалка: куда класть скрипты</a>' +
      '<a href="course.html">📚 Справочник: длинные текстовые уроки</a></footer>' +
      "</main>";
    app.innerHTML = html;
    bindBar();
  }

  // ---------- Ветка ----------
  function renderBranch(br) {
    document.title = br.title + " — Luau с нуля";
    state.lastBranch = br.id;
    save();
    var d = branchDone(br);
    var next = nextInBranch(br);
    var html = topBar("#/") + '<main class="branch" style="' + brStyle(br) + '">' +
      '<section class="br-head"><span class="bc-icon">' + br.icon + "</span>" +
      "<div><small>Ветка " + (br.index + 1) + " · " + esc(br.level) + "</small><h1>" + esc(br.title) + "</h1>" +
      "<p>" + esc(br.desc) + "</p>" +
      '<div class="bc-prog light"><span style="width:' + Math.round(d / br.lessons.length * 100) + '%"></span></div>' +
      "<small>" + d + " из " + br.lessons.length + " уроков</small></div></section>" +
      '<ol class="timeline">';
    br.lessons.forEach(function (lesson, i) {
      var done = isDone(lesson);
      var open = isUnlocked(lesson);
      var current = next && next.id === lesson.id;
      var cls = done ? "done" : current ? "current" : open ? "open" : "locked";
      var actions = "";
      if (open && !done) actions = '<a class="btn small" href="#/learn/' + lesson.id + '">' + (current ? "Начать" : "Открыть") + "</a>";
      if (done) actions = '<a class="btn small ghost" href="#/learn/' + lesson.id + '">Повторить</a>';
      if (open) actions += '<a class="link-btn" href="#/notes/' + lesson.id + '">📖 Конспект</a>';
      html += '<li class="tl ' + cls + '" data-id="' + lesson.id + '">' +
        '<span class="tl-node">' + (done ? "✓" : open ? lesson.icon : "🔒") + "</span>" +
        '<div class="tl-body"><b>' + (i + 1) + ". " + esc(lesson.title) + "</b>" +
        "<span>" + esc(lesson.sub) + "</span>" +
        (actions ? '<div class="tl-actions">' + actions + "</div>" : "") +
        "</div></li>";
    });
    html += "</ol>";
    var nextBr = BRANCHES[br.index + 1];
    if (nextBr) {
      html += '<a class="next-branch" href="#/b/' + nextBr.id + '" style="' + brStyle(nextBr) + '"><span>' + nextBr.icon +
        "</span><div><small>Следующая ветка</small><b>" + esc(nextBr.title) + "</b></div><span>→</span></a>";
    }
    html += "</main>";
    app.innerHTML = html;
    bindBar();
    app.querySelectorAll(".tl.locked").forEach(function (li) {
      li.addEventListener("click", function () {
        var lesson = BY_ID[li.getAttribute("data-id")];
        toast("🔒 Сначала пройди урок «" + lesson.branch.lessons[lesson.pos - 1].title + "»");
      });
    });
    var cur = app.querySelector(".tl.current");
    if (cur && cur.getBoundingClientRect().top > window.innerHeight * 0.7) cur.scrollIntoView({ block: "center" });
  }

  // ---------- Конспект ----------
  function renderNotes(lesson) {
    var br = lesson.branch;
    document.title = "Конспект: " + lesson.title;
    var html = topBar("#/b/" + br.id) + '<main class="notes" style="' + brStyle(br) + '">' +
      '<div class="notes-head"><small>📖 Конспект · ' + esc(br.title) + "</small><h1>" + esc(lesson.title) + "</h1>" +
      "<p>" + esc(lesson.sub) + "</p></div>";
    lesson.slides.forEach(function (s) {
      if (s.t === "info") {
        html += '<section class="note-card"><h2>' + md(s.title) + "</h2>" + paras(s.text) +
          (s.tree ? treeHtml(s.tree) : "") + (s.code ? codeBlock(s.code, s.where, s.out) : "") +
          paras(s.after) + tipHtml(s) + "</section>";
      } else if (s.t === "studio") {
        html += '<section class="note-card studio"><h2>🛠️ ' + md(s.title) + "</h2>" + studioBody(s) + "</section>";
      }
    });
    html += '<div class="notes-actions"><a class="btn" href="#/learn/' + lesson.id + '">' + (isDone(lesson) ? "Пройти ещё раз" : "Пройти урок") + "</a>" +
      (lesson.ref ? '<a class="link-btn" href="lessons/' + lesson.ref + '.html">📚 Ещё подробнее в справочнике</a>' : "") +
      "</div></main>";
    app.innerHTML = html;
    bindBar();
  }

  // ---------- Настройки ----------
  function openSettings() {
    modal(
      "<h2>Настройки</h2>" +
      '<div class="set-row"><div>🔥 Дней подряд<small>Проходи хотя бы один урок в день</small></div><b>' + liveStreak() + "</b></div>" +
      '<div class="set-row"><div>✅ Пройдено уроков</div><b>' + doneCount() + " / " + LESSONS.length + "</b></div>" +
      '<div class="set-row"><div>🔊 Звуки</div><button class="switch' + (state.sound ? " on" : "") + '" data-k="sound" aria-label="Звуки"></button></div>' +
      '<div class="set-row"><div>🔓 Открыть все уроки<small>Если хочешь перепрыгнуть то, что уже знаешь</small></div><button class="switch' + (state.unlockAll ? " on" : "") + '" data-k="unlockAll" aria-label="Открыть все уроки"></button></div>' +
      '<div class="links"><a href="cheatsheet.html">📍 Шпаргалка: куда класть скрипты</a><a href="course.html">📚 Справочник: длинные текстовые уроки</a></div>' +
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
        m.querySelector("#close-set").addEventListener("click", function () { closeModal(); route(); });
        m.querySelector("#reset").addEventListener("click", function () {
          if (confirm("Точно сбросить весь прогресс? Это нельзя отменить.")) {
            var sound = state.sound;
            state = defaults();
            state.sound = sound;
            save();
            closeModal();
            if (location.hash === "#/") route(); else location.hash = "#/";
          }
        });
      }
    );
  }

  // ---------- Проигрыватель урока ----------
  var KICKERS = {
    info: ["Объяснение", "var(--blue)"],
    studio: ["Попробуй в Studio", "#ff9600"],
    choice: ["Выбери ответ", "var(--blue)"],
    fill: ["Заполни пропуски", "#ce82ff"],
    order: ["Собери код", "#ff9600"],
    match: ["Найди пары", "#ff4b4b"],
    input: ["Напиши ответ", "var(--green-d)"]
  };
  var PRAISE = ["Отлично!", "Верно!", "Супер!", "Так держать!", "Молодец!", "Правильно!"];
  var EXERCISES = { choice: 1, fill: 1, order: 1, match: 1, input: 1 };

  function startLesson(lesson) {
    state.lastBranch = lesson.branch.id;
    play({ lesson: lesson, slides: lesson.slides, title: lesson.title });
  }

  function startPractice() {
    var pool = [];
    LESSONS.filter(isDone).forEach(function (l) {
      l.slides.forEach(function (s) { if (EXERCISES[s.t]) pool.push(s); });
    });
    if (!pool.length) {
      location.replace("#/");
      toast("Сначала пройди хотя бы один урок");
      return;
    }
    play({ practice: true, slides: shuffle(pool).slice(0, PRACTICE_SIZE), title: "Тренировка" });
  }

  function play(opts) {
    document.title = opts.title + " — Luau с нуля";
    run = {
      lesson: opts.lesson || null,
      practice: !!opts.practice,
      slides: opts.slides,
      queue: range(opts.slides.length),
      pos: 0, done: 0, mistakes: 0, correct: 0, combo: 0,
      start: Date.now(),
      phase: "idle",   // idle | ok | bad
      ex: null
    };
    app.innerHTML =
      '<div class="lesson">' +
      '<header class="lbar"><button class="icon-btn" id="exit" aria-label="Выйти">✕</button>' +
      '<div class="lprog"><span></span></div>' +
      '<span class="lcount" id="lcount"></span></header>' +
      '<main class="stage"><div class="slide" id="slide"></div></main>' +
      '<footer class="foot" id="foot"><div class="foot-in"><div class="fb" id="fb"></div>' +
      '<button class="btn" id="main">Проверить</button></div></footer>' +
      "</div>";
    document.getElementById("exit").addEventListener("click", confirmExit);
    document.getElementById("main").addEventListener("click", onMain);
    showSlide();
  }

  function exitTarget() { return run && run.lesson ? "#/b/" + run.lesson.branch.id : "#/"; }

  function confirmExit() {
    if (!run) return;
    if (run.done === 0) { location.hash = exitTarget(); return; }
    modal(
      '<div class="mascot-sm">' + mascot("sad") + "</div>" +
      "<h2>Уже уходишь?</h2><p>Если выйдешь сейчас, прогресс этого урока не сохранится.</p>" +
      '<div class="actions"><button class="btn blue" id="stay">Остаться</button>' +
      '<button class="btn plain danger" id="leave">Выйти</button></div>',
      function (m) {
        m.querySelector("#stay").addEventListener("click", closeModal);
        m.querySelector("#leave").addEventListener("click", function () { var t = exitTarget(); closeModal(); location.hash = t; });
      }
    );
  }

  function setProgress() {
    var bar = app.querySelector(".lprog span");
    if (bar) bar.style.width = Math.round(run.done / run.slides.length * 100) + "%";
    var c = document.getElementById("lcount");
    if (c) c.textContent = Math.min(run.done + 1, run.slides.length) + "/" + run.slides.length;
  }
  function setMain(text, enabled) {
    var b = document.getElementById("main");
    b.textContent = text;
    b.disabled = !enabled;
  }
  // Под нижней панелью всегда есть место, чтобы докрутить задание
  function fitStage() {
    var foot = document.getElementById("foot");
    var stage = app.querySelector(".stage");
    if (foot && stage) stage.style.paddingBottom = (foot.offsetHeight + 24) + "px";
  }

  function showSlide() {
    var slide = run.slides[run.queue[run.pos]];
    var el = document.getElementById("slide");
    document.getElementById("foot").className = "foot";
    document.getElementById("fb").innerHTML = "";
    run.phase = "idle";
    el.className = "";
    void el.offsetWidth;  // перезапуск анимации появления
    el.className = "slide";
    window.scrollTo(0, 0);

    var kick = KICKERS[slide.t];
    var retry = run.pos >= run.slides.length ? '<span class="retry-tag">↺ повторяем ошибку</span>' : "";
    var head = '<div class="kicker" style="--kick:' + kick[1] + '">' + kick[0] + retry + "</div>";
    run.ex = RENDER[slide.t](slide, el, head, function (ready) {
      if (run.phase === "idle") setMain("Проверить", ready);
    }, function () {
      feedback(true, slide, null);
    });
    if (slide.t === "info") setMain("Понятно, дальше", true);
    else if (slide.t === "studio") setMain("Готово, дальше", true);
    else setMain("Проверить", false);
    setProgress();
    fitStage();
  }

  function onMain() {
    if (!run) return;
    if (document.getElementById("main").disabled) return;
    var slide = run.slides[run.queue[run.pos]];
    if (run.phase === "idle") {
      if (slide.t === "info" || slide.t === "studio") {
        run.done++;
        next();
        return;
      }
      var res = run.ex.check();
      feedback(res.ok, slide, res.answer);
      return;
    }
    next();
  }

  function feedback(ok, slide, answerHtml) {
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
      if (slide.why) body = '<div class="fb-why">' + md(slide.why) + "</div>";
      fb.innerHTML = '<div class="fb-title"><span class="badge">✅</span>' + PRAISE[Math.floor(Math.random() * PRAISE.length)] + "</div>" +
        (body ? '<div class="fb-body">' + body + "</div>" : "");
    } else {
      run.mistakes++;
      run.combo = 0;
      sfx.wrong();
      run.queue.push(run.queue[run.pos]);  // вопрос вернётся в конце урока
      if (answerHtml) body += '<div class="fb-label">Правильный ответ:</div>' + answerHtml;
      if (slide.why) body += '<div class="fb-why">' + md(slide.why) + "</div>";
      body += '<div class="fb-again">Не страшно! Этот вопрос повторится в конце урока.</div>';
      fb.innerHTML = '<div class="fb-title"><span class="badge">💡</span>Не совсем</div><div class="fb-body">' + body + "</div>";
    }
    setMain("Дальше", true);
    setProgress();
    fitStage();
  }

  function next() {
    run.pos++;
    if (run.pos >= run.queue.length) finish();
    else showSlide();
  }

  function finish() {
    var r = run;
    var lesson = r.lesson;
    var firstTime = lesson && !isDone(lesson);
    var perfect = r.mistakes === 0;
    var xp = (firstTime ? 10 : 5) + (perfect ? 5 : 0);
    var answers = r.correct + r.mistakes;
    var accuracy = answers ? Math.round(r.correct / answers * 100) : 100;
    var secs = Math.round((Date.now() - r.start) / 1000);
    var time = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
    var branchFinished = false;

    if (lesson) {
      state.done[lesson.id] = 1;
      branchFinished = firstTime && branchDone(lesson.branch) === lesson.branch.lessons.length;
    }
    state.xp += xp;
    if (state.lastDay !== today()) {
      state.streak = state.lastDay === yesterday() ? state.streak + 1 : 1;
      state.lastDay = today();
    }
    if (!state.dayXp || state.dayXp.day !== today()) state.dayXp = { day: today(), xp: 0 };
    state.dayXp.xp += xp;
    state.started = true;
    save();
    run = null;

    var nextLesson = lesson && lesson.branch.lessons[lesson.pos + 1];
    var title = branchFinished ? "Ветка пройдена! 🏆" : r.practice ? "Тренировка окончена!" : perfect ? "Идеально!" : "Урок пройден!";
    var subtitle = lesson ? esc(lesson.title) : "Ты повторил " + r.slides.length + " вопросов";
    if (liveStreak() > 1) subtitle += " · 🔥 " + liveStreak() + " дн. подряд";

    var actions = "";
    if (nextLesson) actions += '<a class="btn" href="#/learn/' + nextLesson.id + '">Следующий урок</a>';
    else if (lesson) {
      var nb = BRANCHES[lesson.branch.index + 1];
      if (nb) actions += '<a class="btn" href="#/b/' + nb.id + '">Следующая ветка: ' + esc(nb.title) + "</a>";
    } else actions += '<a class="btn" href="#/practice">Ещё тренировка</a>';
    actions += '<a class="btn ghost" href="' + (lesson ? "#/b/" + lesson.branch.id : "#/") + '">' + (lesson ? "К списку уроков" : "На главную") + "</a>";
    if (lesson) actions += '<a class="btn plain" href="#/notes/' + lesson.id + '">📖 Конспект урока</a>';

    sfx.finish();
    confetti();
    app.innerHTML =
      '<div class="result">' +
      '<div class="big-mascot">' + mascot("wow") + "</div>" +
      "<h1>" + title + "</h1><p>" + subtitle + "</p>" +
      '<div class="cards">' +
      '<div class="card" style="--c:#ffc800"><small>Опыт</small><b>+' + xp + "</b></div>" +
      '<div class="card" style="--c:#58cc02"><small>Точность</small><b>' + accuracy + "%</b></div>" +
      '<div class="card" style="--c:#1cb0f6"><small>Время</small><b>' + time + "</b></div>" +
      "</div>" +
      '<div class="actions">' + actions + "</div></div>";
  }

  // ---------- Типы слайдов ----------
  function studioBody(s) {
    return paras(s.text) +
      '<ol class="steps">' + s.steps.map(function (st) { return "<li><span>" + md(st) + "</span></li>"; }).join("") + "</ol>" +
      (s.tree ? treeHtml(s.tree) : "") +
      (s.code ? codeBlock(s.code, s.where, s.out) : "") +
      tipHtml(s) +
      (s.result ? '<div class="tip ok">✅ <b>Должно получиться:</b> ' + md(s.result) + "</div>" : "");
  }

  var RENDER = {
    info: function (s, el, head) {
      el.innerHTML = head +
        '<div class="tip-head">' + mascot("happy") + '<div class="bubble">' + md(s.title) + "</div></div>" +
        paras(s.text) +
        (s.tree ? treeHtml(s.tree) : "") +
        (s.code ? codeBlock(s.code, s.where, s.out) : "") +
        paras(s.after) + tipHtml(s);
      return {};
    },

    studio: function (s, el, head) {
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.title) + "</h1>" + studioBody(s) +
        '<p class="studio-note">Нет Studio под рукой? Ничего страшного, нажми «Готово» и попробуй позже.</p>';
      return {};
    },

    choice: function (s, el, head, ready) {
      var order = shuffle(range(s.opts.length));
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
      var slots = range(parts.length - 1).map(function () { return -1; });
      var order = shuffle(range(s.bank.length));
      var locked = false;
      var codeHtml = H.highlight(parts[0]);
      for (var p = 1; p < parts.length; p++) {
        codeHtml += '<button class="slot" data-s="' + (p - 1) + '"></button>' + H.highlight(parts[p]);
      }
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        '<div class="code">' + (s.where ? '<div class="code-where">📍 Куда: ' + whereHtml(s.where) + "</div>" : "") +
        "<pre>" + codeHtml + "</pre></div>" +
        '<p class="hint-line">Нажимай на плитки, чтобы вставить их в пропуски</p>' +
        '<div class="tiles">' + order.map(function (bi) {
          return '<button class="tile" data-b="' + bi + '">' + esc(s.bank[bi]) + "</button>";
        }).join("") + "</div>";
      var slotEls = Array.prototype.slice.call(el.querySelectorAll(".slot"));
      var tileEls = Array.prototype.slice.call(el.querySelectorAll(".tile"));
      function sync() {
        slotEls.forEach(function (se, i) {
          se.textContent = slots[i] < 0 ? "" : s.bank[slots[i]];
          se.classList.toggle("filled", slots[i] >= 0);
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
          return { ok: ok, answer: codeBlock(s.code.replace(/___/g, function () { return s.a[k++]; })) };
        }
      };
    },

    order: function (s, el, head, ready) {
      var all = s.lines.concat(s.extra || []);
      var pool = shuffledIndices(all.length);
      var picked = [];
      var locked = false;
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q) + "</h1>" +
        (s.given ? '<p class="hint-line left">Это уже написано:</p>' + codeBlock(s.given, s.where) : "") +
        '<div class="order-ans" id="ans"></div>' +
        '<p class="hint-line">Нажимай на строки по порядку. Нажми на строку сверху, чтобы убрать её.</p>' +
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
          var ok = picked.map(function (li) { return all[li]; }).join("\n") === s.lines.join("\n");
          ans.classList.add(ok ? "right" : "wrong");
          return { ok: ok, answer: codeBlock(s.lines.join("\n")) };
        }
      };
    },

    match: function (s, el, head, ready, complete) {
      var n = s.pairs.length;
      var left = shuffle(range(n));
      var right = shuffle(range(n));
      var selL = -1, selR = -1, matched = 0;
      el.innerHTML = head + '<h1 class="qtitle">' + md(s.q || "Соедини пары") + "</h1>" +
        '<p class="hint-line">Нажми слово слева, потом его пару справа</p>' +
        '<div class="match"><div class="match-col">' +
        left.map(function (pi) { return '<button class="opt" data-side="L" data-p="' + pi + '">' + md(s.pairs[pi][0]) + "</button>"; }).join("") +
        '</div><div class="match-col">' +
        right.map(function (pi) { return '<button class="opt" data-side="R" data-p="' + pi + '">' + md(s.pairs[pi][1]) + "</button>"; }).join("") +
        "</div></div>";
      var btns = Array.prototype.slice.call(el.querySelectorAll(".opt"));
      function btnFor(side, p) { return el.querySelector('.opt[data-side="' + side + '"][data-p="' + p + '"]'); }
      function paint() {
        btns.forEach(function (x) {
          var xp = +x.getAttribute("data-p");
          var xs = x.getAttribute("data-side");
          x.classList.toggle("sel", (xs === "L" && xp === selL) || (xs === "R" && xp === selR));
        });
      }
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.disabled) return;
          var p = +b.getAttribute("data-p");
          if (b.getAttribute("data-side") === "L") selL = selL === p ? -1 : p;
          else selR = selR === p ? -1 : p;
          paint();
          if (selL < 0 || selR < 0) { sfx.tap(); return; }
          var a = btnFor("L", selL), c = btnFor("R", selR);
          var good = selL === selR;
          selL = selR = -1;
          paint();
          if (good) {
            matched++;
            sfx.tap();
            [a, c].forEach(function (x) {
              x.disabled = true;
              x.classList.add("flash-ok");
              setTimeout(function () { x.classList.remove("flash-ok"); x.classList.add("done"); }, 350);
            });
            if (matched === n) setTimeout(complete, 380);
          } else {
            run.mistakes++;  // точность учитывает, но вопрос не повторяем
            run.combo = 0;
            sfx.wrong();
            [a, c].forEach(function (x) {
              x.classList.add("wrong");
              setTimeout(function () { x.classList.remove("wrong"); }, 400);
            });
          }
        });
      });
      return {};
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
    if (document.querySelector(".modal-back")) {
      if (e.key === "Escape") closeModal();
      return;
    }
    if (!run) return;
    if (e.key === "Escape") { confirmExit(); return; }
    if (e.key === "Enter") { e.preventDefault(); onMain(); return; }
    var typing = e.target && e.target.tagName === "INPUT";
    if (!typing && /^[1-9]$/.test(e.key) && run.phase === "idle" && run.ex && run.ex.key) run.ex.key(+e.key);
  });

  route();
})();
