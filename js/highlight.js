// Подсветка синтаксиса Luau. Общая для текстового курса и приложения.
(function () {
  "use strict";

  function toSet(s) {
    var o = {};
    s.split(/\s+/).forEach(function (w) { o[w] = true; });
    return o;
  }

  var KEYWORDS = toSet("and break continue do else elseif end false for function if in local nil not or repeat return then true until while export type typeof");
  var BUILTINS = toSet(
    "game workspace script print warn error assert pcall xpcall require tostring tonumber type select next pairs ipairs unpack " +
    "setmetatable getmetatable rawget rawset rawequal math string table task os coroutine utf8 bit32 debug buffer " +
    "Instance Vector3 Vector2 CFrame Color3 BrickColor UDim UDim2 TweenInfo Enum Ray RaycastParams Random NumberRange " +
    "NumberSequence ColorSequence Region3 OverlapParams DateTime self _G shared"
  );

  var TOKEN_RE = new RegExp(
    [
      "(--\\[(=*)\\[[\\s\\S]*?\\]\\2\\]|--[^\\n]*)",                         // 1,2 комментарий
      "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`|\\[(=*)\\[[\\s\\S]*?\\]\\4\\])", // 3,4 строка
      "(\\b0x[0-9a-fA-F_]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)", // 5 число
      "([A-Za-z_][A-Za-z0-9_]*)"                                            // 6 имя
    ].join("|"),
    "g"
  );

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(src) {
    var out = "";
    var last = 0;
    var m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src))) {
      out += esc(src.slice(last, m.index));
      var t = m[0];
      if (m[1] !== undefined) out += '<span class="tok-com">' + esc(t) + "</span>";
      else if (m[3] !== undefined) out += '<span class="tok-str">' + esc(t) + "</span>";
      else if (m[5] !== undefined) out += '<span class="tok-num">' + esc(t) + "</span>";
      else {
        var before = src.charAt(m.index - 1);
        var after = src.slice(m.index + t.length).match(/^\s*(.)/);
        var nextCh = after ? after[1] : "";
        if (KEYWORDS[t] && before !== "." && before !== ":") out += '<span class="tok-kw">' + t + "</span>";
        else if (BUILTINS[t] && before !== "." && before !== ":") out += '<span class="tok-bi">' + t + "</span>";
        else if (nextCh === "(" || (before === ":" && (nextCh === "\"" || nextCh === "{"))) out += '<span class="tok-fn">' + t + "</span>";
        else if (/^[A-Z]/.test(t) && before === ":") out += '<span class="tok-fn">' + t + "</span>";
        else out += t;
      }
      last = m.index + t.length;
    }
    out += esc(src.slice(last));
    return out;
  }

  window.LuauHighlight = { highlight: highlight, esc: esc };
})();
