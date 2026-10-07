// Контент уроков: каждый файл добавляет раздел в window.APP_UNITS.
//
// Типы слайдов:
//   { t: "info",   title, text, code?, where?, out?, after? }        — теория
//   { t: "choice", q, code?, where?, opts: [...], a: индекс, why? }    — выбор ответа
//   { t: "fill",   q, code: "с ___ пропусками", bank: [...], a: [...], why? }
//   { t: "order",  q, given?, lines: [правильный порядок], extra?: [лишние], why? }
//   { t: "match",  q?, pairs: [[слева, справа], ...] }
//   { t: "input",  q, code?, a: [допустимые ответы], why? }
//
// В тексте можно писать `код` и **жирный**. Код пишется через L`...`:
// это сырая строка, где обратная кавычка экранируется как \`.
window.APP_UNITS = window.APP_UNITS || [];
window.L = function (strings) {
  return strings.raw.join("").replace(/\\`/g, "`").replace(/^\n/, "").replace(/\s+$/, "");
};
