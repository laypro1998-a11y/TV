// Контент уроков: каждый файл добавляет одну ветку в window.BRANCHES.
//
// Ветка: { id, title, icon, color, shade, level, desc, lessons: [...] }
// Урок:  { id, title, sub, icon, ref?, slides: [...] }
//        sub — одна строка «что узнаешь», ref — длинный урок из lessons/<ref>.html
//
// Типы слайдов:
//   { t: "info",   title, text?, tree?, code?, where?, out?, after?, tip?, warn? } — объяснение
//   { t: "studio", title, text?, steps: [...], tree?, code?, where?, result? }     — попробуй в Studio
//   { t: "choice", q, code?, where?, opts: [...], a: индекс, why? }               — выбор ответа
//   { t: "fill",   q, code: "с ___ пропусками", bank: [...], a: [...], why? }
//   { t: "order",  q, given?, lines: [правильный порядок], extra?: [лишние], why? }
//   { t: "match",  q?, pairs: [[слева, справа], ...] }
//   { t: "input",  q, code?, a: [допустимые ответы], why? }
//
// В тексте можно писать `код` и **жирный**. Код пишется через L`...`:
// это сырая строка, где обратная кавычка экранируется как \`.
// tree — дерево Explorer: по строке на объект, отступ 2 пробела на уровень,
// **жирным** выделяется главное.
window.BRANCHES = window.BRANCHES || [];
window.L = function (strings) {
  return strings.raw.join("").replace(/\\`/g, "`").replace(/^\n/, "").replace(/\s+$/, "");
};
