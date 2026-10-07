// Общая логика сайта: навигация, прогресс, подсветка кода, тесты, задания.
(function () {
  "use strict";

  var COURSE = window.COURSE || [];
  var body = document.body;
  var ROOT = body.getAttribute("data-root") || "..";
  var CURRENT = body.getAttribute("data-lesson") || "";
  var STORE_KEY = "luauCourse.v1";

  // ---------- Хранилище прогресса ----------
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var s = raw ? JSON.parse(raw) : null;
      if (s && typeof s === "object") {
        s.done = s.done || {};
        s.quiz = s.quiz || {};
        return s;
      }
    } catch (e) { /* хранилище недоступно — работаем без него */ }
    return { done: {}, quiz: {} };
  }
  var state = loadState();
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  // ---------- Тема ----------
  function getTheme() {
    try { return localStorage.getItem("luauCourse.theme"); } catch (e) { return null; }
  }
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(getTheme());
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // ---------- Список уроков ----------
  var flat = [];
  COURSE.forEach(function (mod, mi) {
    mod.lessons.forEach(function (l, li) {
      flat.push({ slug: l.slug, title: l.title, module: mod, moduleIndex: mi, lessonIndex: li, num: flat.length + 1 });
    });
  });
  function lessonUrl(slug) { return ROOT + "/lessons/" + slug + ".html"; }
  function countDone() {
    return flat.filter(function (l) { return state.done[l.slug]; }).length;
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- Каркас страницы ----------
  function buildShell() {
    var content = Array.prototype.slice.call(body.children).filter(function (n) {
      return n.tagName !== "SCRIPT";
    });

    var top = el("header", { "class": "topbar" });
    top.innerHTML =
      '<button class="icon-btn menu-btn" aria-label="Меню">☰</button>' +
      '<a class="logo" href="' + ROOT + '/index.html"><span class="mark">L</span><span class="txt">Luau с нуля</span></a>' +
      '<span class="spacer"></span>' +
      '<div class="progress-wrap"><span class="progress-label"></span><div class="progress"><span></span></div></div>' +
      '<button class="icon-btn theme-btn" aria-label="Сменить тему"></button>';

    var layout = el("div", { "class": "layout" });
    var side = el("nav", { "class": "sidebar", "aria-label": "Уроки" });
    var main = el("main");
    content.forEach(function (n) { main.appendChild(n); });
    layout.appendChild(side);
    layout.appendChild(main);

    var backdrop = el("div", { "class": "backdrop" });
    body.insertBefore(backdrop, body.firstChild);
    body.insertBefore(layout, body.firstChild);
    body.insertBefore(top, body.firstChild);

    top.querySelector(".menu-btn").addEventListener("click", function () {
      body.classList.toggle("nav-open");
    });
    backdrop.addEventListener("click", function () { body.classList.remove("nav-open"); });

    var themeBtn = top.querySelector(".theme-btn");
    function syncThemeBtn() { themeBtn.textContent = isDark() ? "☀️" : "🌙"; }
    syncThemeBtn();
    themeBtn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("luauCourse.theme", next); } catch (e) { /* ignore */ }
      syncThemeBtn();
    });

    buildSidebar(side);
    updateProgress();
    return main;
  }

  function buildSidebar(side) {
    var html = "";
    var n = 0;
    COURSE.forEach(function (mod) {
      html += '<div class="mod-title">' + mod.emoji + " " + esc(mod.title) + "</div>";
      mod.lessons.forEach(function (l) {
        n++;
        var cls = [];
        if (l.slug === CURRENT) cls.push("active");
        if (state.done[l.slug]) cls.push("done");
        html += '<a href="' + lessonUrl(l.slug) + '" data-slug="' + l.slug + '" class="' + cls.join(" ") + '">' +
          '<span class="num">' + (state.done[l.slug] ? "✓" : n) + "</span><span>" + esc(l.title) + "</span></a>";
      });
    });
    html += '<div class="extra">' +
      '<a href="' + ROOT + '/index.html"><span class="num">🎮</span><span>Учиться по слайдам</span></a>' +
      '<a href="' + ROOT + '/cheatsheet.html"' + (body.getAttribute("data-page") === "cheatsheet" ? ' class="active"' : "") +
      '><span class="num">📍</span><span>Шпаргалка: куда класть скрипты</span></a>' +
      '<a href="' + ROOT + '/course.html"' + (body.getAttribute("data-page") === "course" ? ' class="active"' : "") +
      '><span class="num">📚</span><span>Карта текстового курса</span></a></div>';
    side.innerHTML = html;
    var active = side.querySelector("a.active");
    if (active && active.scrollIntoView) {
      setTimeout(function () { active.scrollIntoView({ block: "center" }); }, 0);
    }
  }

  function updateProgress() {
    var done = countDone();
    var pct = flat.length ? Math.round(done / flat.length * 100) : 0;
    var bar = document.querySelector(".topbar .progress > span");
    var label = document.querySelector(".topbar .progress-label");
    if (bar) bar.style.width = pct + "%";
    if (label) label.textContent = "Пройдено " + done + " из " + flat.length;
    document.querySelectorAll(".sidebar a[data-slug]").forEach(function (a) {
      var slug = a.getAttribute("data-slug");
      var idx = flat.findIndex(function (l) { return l.slug === slug; });
      a.classList.toggle("done", !!state.done[slug]);
      a.querySelector(".num").textContent = state.done[slug] ? "✓" : String(idx + 1);
    });
    var map = document.getElementById("course-map");
    if (map) renderCourseMap(map);
  }

  // ---------- Подсветка Luau (js/highlight.js) ----------
  var highlight = window.LuauHighlight.highlight;

  function enhanceCode(root) {
    root.querySelectorAll("pre").forEach(function (pre) {
      if (pre.closest(".code")) return;
      var codeEl = pre.querySelector("code") || pre;
      var raw = codeEl.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      var isOutput = pre.classList.contains("output");
      var isPlain = pre.classList.contains("plain") || isOutput;
      codeEl.innerHTML = isPlain ? esc(raw) : highlight(raw);

      var wrap = el("div", { "class": "code" + (isOutput ? " output-block" : "") });
      var where = pre.getAttribute("data-where");
      var label = isOutput ? "🖨️ Output (окно вывода)" : where ? "📍 " + formatWhere(where) : "Luau";
      var head = el("div", { "class": "code-head" },
        '<span class="where">' + label + "</span>" + (isOutput ? "" : '<button class="copy-btn" type="button">Копировать</button>'));
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(head);
      wrap.appendChild(pre);

      var btn = head.querySelector(".copy-btn");
      if (btn) {
        btn.addEventListener("click", function () {
          copyText(raw).then(function () {
            btn.textContent = "Скопировано ✓";
            setTimeout(function () { btn.textContent = "Копировать"; }, 1500);
          }, function () {
            btn.textContent = "Не вышло :(";
          });
        });
      }
    });
  }
  function formatWhere(w) {
    // "ServerScriptService > Script «Coins»" -> последний сегмент жирным
    var parts = w.split(">").map(function (s) { return s.trim(); });
    return parts.map(function (p, i) {
      return i === parts.length - 1 ? "<b>" + esc(p) + "</b>" : esc(p);
    }).join(" › ");
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  // ---------- Задания: оборачиваем содержимое <details> ----------
  function enhanceDetails(root) {
    root.querySelectorAll("details").forEach(function (d) {
      if (d.querySelector(":scope > .inner")) return;
      var inner = el("div", { "class": "inner" });
      Array.prototype.slice.call(d.childNodes).forEach(function (n) {
        if (n.nodeType === 1 && n.tagName === "SUMMARY") return;
        inner.appendChild(n);
      });
      d.appendChild(inner);
    });
  }

  // ---------- Тесты ----------
  function enhanceQuiz(root) {
    var qs = Array.prototype.slice.call(root.querySelectorAll(".q"));
    if (!qs.length) return;
    var saved = state.quiz[CURRENT] || {};
    var scoreEl = el("p", { "class": "quiz-score" });
    var quizSection = root.querySelector(".quiz");
    if (quizSection) quizSection.appendChild(scoreEl);

    qs.forEach(function (q, qi) {
      var correct = parseInt(q.getAttribute("data-correct"), 10);
      var items = Array.prototype.slice.call(q.querySelectorAll("ol > li"));
      var buttons = items.map(function (li, i) {
        var b = el("button", { "class": "opt", type: "button" }, li.innerHTML);
        li.innerHTML = "";
        li.appendChild(b);
        b.addEventListener("click", function () { answer(i, true); });
        return b;
      });
      var explain = q.querySelector(".explain");
      var verdict = el("span", { "class": "verdict" });
      if (explain) explain.insertBefore(verdict, explain.firstChild);
      var retry = el("button", { "class": "retry", type: "button" }, "↺ Попробовать ещё раз");
      q.appendChild(retry);
      retry.addEventListener("click", function () {
        q.classList.remove("answered", "failed");
        buttons.forEach(function (b) { b.disabled = false; b.classList.remove("right", "wrong"); });
        delete saved[qi];
        persist();
      });

      function answer(i, user) {
        q.classList.add("answered");
        buttons.forEach(function (b) { b.disabled = true; });
        if (i === correct) {
          buttons[i].classList.add("right");
          verdict.textContent = "Верно! ";
          q.classList.remove("failed");
        } else {
          buttons[i].classList.add("wrong");
          verdict.textContent = "Не совсем. ";
          q.classList.add("failed");
        }
        if (user) { saved[qi] = i; persist(); }
      }
      if (saved[qi] != null) answer(saved[qi], false);
    });

    function persist() {
      state.quiz[CURRENT] = saved;
      var right = 0;
      var answered = 0;
      qs.forEach(function (q, qi) {
        if (saved[qi] == null) return;
        answered++;
        if (saved[qi] === parseInt(q.getAttribute("data-correct"), 10)) right++;
      });
      if (right === qs.length && !state.done[CURRENT]) {
        state.done[CURRENT] = true;
        syncDoneBtn();
      }
      saveState();
      renderScore(right, answered);
      updateProgress();
    }
    function renderScore(right, answered) {
      if (!answered) { scoreEl.style.display = "none"; return; }
      scoreEl.style.display = "";
      scoreEl.classList.toggle("perfect", right === qs.length);
      scoreEl.textContent = right === qs.length
        ? "🎉 Все ответы верные (" + right + "/" + qs.length + ") — урок отмечен как пройденный!"
        : "Правильных ответов: " + right + " из " + qs.length;
    }
    var r = 0, a = 0;
    qs.forEach(function (q, qi) {
      if (saved[qi] == null) return;
      a++;
      if (saved[qi] === parseInt(q.getAttribute("data-correct"), 10)) r++;
    });
    renderScore(r, a);
  }

  // ---------- Низ урока: кнопка «пройден» и навигация ----------
  var doneBtn = null;
  function syncDoneBtn() {
    if (!doneBtn) return;
    var d = !!state.done[CURRENT];
    doneBtn.classList.toggle("is-done", d);
    doneBtn.textContent = d ? "✅ Урок пройден" : "Отметить урок пройденным";
  }

  function buildLessonChrome(main) {
    var idx = flat.findIndex(function (l) { return l.slug === CURRENT; });
    if (idx < 0) return;
    var info = flat[idx];
    var article = main.querySelector(".lesson");
    var h1 = article && article.querySelector("h1");
    if (h1 && !article.querySelector(".crumb")) {
      var crumb = el("div", { "class": "crumb" },
        info.module.emoji + " Модуль " + (info.moduleIndex + 1) + " · " + esc(info.module.title) + " · Урок " + info.num);
      h1.parentNode.insertBefore(crumb, h1);
    }
    document.title = info.title + " — Luau с нуля";

    var footer = el("div", { "class": "lesson-footer" });
    doneBtn = el("button", { "class": "done-btn", type: "button" });
    doneBtn.addEventListener("click", function () {
      state.done[CURRENT] = !state.done[CURRENT];
      saveState();
      syncDoneBtn();
      updateProgress();
    });
    footer.appendChild(doneBtn);
    var pager = el("div", { "class": "pager" });
    var prev = flat[idx - 1];
    var next = flat[idx + 1];
    if (prev) pager.appendChild(el("a", { "class": "prev", href: lessonUrl(prev.slug) }, "<small>← Назад</small>" + esc(prev.title)));
    if (next) pager.appendChild(el("a", { "class": "next", href: lessonUrl(next.slug) }, "<small>Дальше →</small>" + esc(next.title)));
    else pager.appendChild(el("a", { "class": "next", href: ROOT + "/course.html" }, "<small>Курс завершён 🎉</small>К карте курса"));
    footer.appendChild(pager);
    main.appendChild(footer);
    syncDoneBtn();
  }

  // ---------- Карта курса на главной ----------
  function renderCourseMap(map) {
    var n = 0;
    var html = "";
    COURSE.forEach(function (mod, mi) {
      var doneInMod = mod.lessons.filter(function (l) { return state.done[l.slug]; }).length;
      html += '<div class="module-card"><h3>' + mod.emoji + " Модуль " + (mi + 1) + ". " + esc(mod.title) +
        ' <small style="color:var(--muted);font-weight:500">· ' + doneInMod + "/" + mod.lessons.length + "</small></h3>" +
        '<p class="mdesc">' + esc(mod.desc) + "</p><ol>";
      mod.lessons.forEach(function (l) {
        n++;
        var d = state.done[l.slug];
        html += '<li><a href="' + lessonUrl(l.slug) + '"' + (d ? ' class="done"' : "") + '><span class="st">' +
          (d ? "✅" : n + ".") + "</span>" + esc(l.title) + "</a></li>";
      });
      html += "</ol></div>";
    });
    map.innerHTML = html;
    var cont = document.getElementById("continue-btn");
    if (cont) {
      var firstUndone = flat.find(function (l) { return !state.done[l.slug]; });
      if (firstUndone) {
        cont.href = lessonUrl(firstUndone.slug);
        cont.textContent = countDone() ? "Продолжить: " + firstUndone.title + " →" : "Начать обучение →";
      } else {
        cont.href = lessonUrl(flat[flat.length - 1].slug);
        cont.textContent = "Курс пройден 🎉";
      }
    }
  }

  // ---------- Запуск ----------
  var main = buildShell();
  enhanceCode(main);
  enhanceDetails(main);
  if (CURRENT) {
    buildLessonChrome(main);
    enhanceQuiz(main);
  }
  updateProgress();
})();
