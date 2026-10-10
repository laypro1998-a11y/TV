BRANCHES.push({
  id: "basics",
  title: "Основы языка",
  icon: "🧱",
  color: "#1cb0f6",
  shade: "#1899d6",
  level: "Новичок",
  desc: "Переменные, числа, текст, условия, циклы, функции и таблицы — азбука Luau",
  lessons: [
    {
      id: "b-vars",
      title: "Переменные",
      sub: "Коробки, в которых хранятся данные",
      icon: "📦",
      ref: "variables",
      slides: [
        {
          t: "info",
          title: "Переменная — коробка с наклейкой",
          text: [
            "Представь коробку. На наклейке написано **имя**, а внутри лежит **значение**.",
            "Так игра запоминает монеты, здоровье, имя игрока."
          ],
          code: L`local coins = 100
print(coins)`,
          out: "100"
        },
        {
          t: "info",
          title: "local и знак =",
          text: [
            "`local` — «создай новую коробку».",
            "`=` — «положи в неё значение». Это не «равно» из математики, а **положить**."
          ],
          code: L`local playerName = "Alex"
local health = 100`
        },
        {
          t: "fill",
          q: "Создай переменную `health` со значением 100",
          code: L`___ health ___ 100`,
          bank: ["local", "=", "var", "==", "let"],
          a: ["local", "="],
          why: "Переменную создаёт `local`, а значение кладёт `=`. Двойное `==` — для сравнения."
        },
        {
          t: "info",
          title: "Меняем значение",
          text: "`local` пишется только один раз, при создании. Потом просто пишем имя.",
          code: L`local coins = 100
coins = coins + 50 -- теперь 150
coins += 25        -- короче, теперь 175`,
          tip: "`+=` значит «прибавь к тому, что уже лежит»."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local x = 10
x += 5
print(x)`,
          a: ["15"]
        },
        {
          t: "info",
          title: "Как называть переменные",
          text: [
            "✅ Латинские буквы, цифры и `_`: `coins`, `player2`, `max_hp`.",
            "❌ Нельзя начинать с цифры: `2player`.",
            "🔠 Большие и маленькие буквы различаются: `Coins` и `coins` — разные переменные."
          ],
          tip: "Называй понятно: `walkSpeed` лучше, чем `a`."
        },
        {
          t: "choice",
          q: "Какое имя **нельзя** использовать?",
          opts: ["`2player`", "`player2`", "`max_hp`", "`walkSpeed`"],
          a: 0
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local Coins = 5
print(coins)`,
          opts: ["nil", "5", "Coins"],
          a: 0,
          why: "Переменной `coins` с маленькой буквы не существует. Пустота в Luau называется `nil`."
        },
        {
          t: "order",
          q: "Собери код, который выведет 15",
          lines: ["local coins = 10", "coins += 5", "print(coins)"]
        }
      ]
    },
    {
      id: "b-types",
      title: "Типы данных",
      sub: "Число, текст, да/нет и пустота",
      icon: "🔤",
      ref: "variables",
      slides: [
        {
          t: "info",
          title: "Что можно положить в коробку",
          text: [
            "🔢 **number** — число: `10`, `-3`, `0.5`",
            "💬 **string** — текст в кавычках: `\"Привет\"`",
            "✅ **boolean** — да или нет: `true` или `false`",
            "⬜ **nil** — пусто, ничего нет"
          ]
        },
        {
          t: "match",
          q: "Соедини значение и тип",
          pairs: [
            ["`42`", "number"],
            ["`\"Меч\"`", "string"],
            ["`false`", "boolean"],
            ["`nil`", "пусто"]
          ]
        },
        {
          t: "info",
          title: "Кавычки меняют всё",
          text: "`10` — число, с ним можно считать. `\"10\"` — текст, просто символы.",
          code: L`print(10 == 10)   --> true
print(10 == "10") --> false`
        },
        {
          t: "choice",
          q: "Какой тип у значения `\"true\"` (в кавычках)?",
          opts: ["string", "boolean", "number"],
          a: 0,
          why: "Всё в кавычках — это текст, даже слово true."
        },
        {
          t: "info",
          title: "typeof — узнать тип",
          code: L`print(typeof(5))         --> number
print(typeof("5"))       --> string
print(typeof(workspace)) --> Instance`,
          after: "**Instance** — так называется любой объект игры: деталь, скрипт, игрок."
        },
        {
          t: "input",
          q: "Что выведет `print(typeof(true))`?",
          a: ["boolean"]
        },
        {
          t: "info",
          title: "Перевод из одного типа в другой",
          code: L`print(tonumber("15") + 5) --> 20
print(tostring(7) .. "!") --> 7!
print(tonumber("abc"))    --> nil`,
          after: "Если текст нельзя превратить в число, `tonumber` вернёт `nil`."
        },
        {
          t: "choice",
          q: "Что вернёт `tonumber(\"abc\")`?",
          opts: ["nil", "0", "abc"],
          a: 0
        },
        {
          t: "choice",
          q: "Где хранить, жив ли игрок?",
          opts: ["boolean: `true` или `false`", "string: `\"жив\"`", "number: `1`"],
          a: 0,
          why: "Для «да/нет» придуман boolean. Так понятнее и надёжнее."
        }
      ]
    },
    {
      id: "b-math",
      title: "Числа и математика",
      sub: "Считаем урон, опыт и таймеры",
      icon: "➗",
      ref: "operators-strings",
      slides: [
        {
          t: "info",
          title: "Обычная математика",
          code: L`print(10 + 3) --> 13
print(10 - 3) --> 7
print(10 * 3) --> 30
print(10 / 4) --> 2.5`,
          tip: "Умножение — звёздочка `*`, деление — косая черта `/`."
        },
        {
          t: "input",
          q: "Что выведет `print(7 * 6)`?",
          a: ["42"]
        },
        {
          t: "info",
          title: "Деление нацело и остаток",
          text: "`//` — сколько раз число влезает целиком. `%` — что осталось.",
          code: L`print(135 // 60) --> 2  (минуты)
print(135 % 60)  --> 15 (секунды)`,
          after: "135 секунд — это 2 минуты 15 секунд. Так делают таймеры."
        },
        {
          t: "match",
          q: "Соедини пример и ответ",
          pairs: [
            ["`10 // 3`", "3"],
            ["`10 % 3`", "1"],
            ["`2 * 5`", "10"],
            ["`9 / 2`", "4.5"]
          ]
        },
        {
          t: "input",
          q: "Чему равно `17 % 5`?",
          a: ["2"],
          why: "17 = 5 × 3 + **2**. Остаток — 2."
        },
        {
          t: "info",
          title: "Помощник math",
          code: L`math.random(1, 6)       -- случайное: кубик
math.floor(3.7)         -- 3, округлить вниз
math.max(5, 12, 8)      -- 12, самое большое
math.clamp(150, 0, 100) -- 100, не выше 100`,
          tip: "`math.clamp` не даёт числу выйти за границы. Например, здоровье не больше максимума."
        },
        {
          t: "fill",
          q: "Брось кубик: случайное число от 1 до 6",
          code: L`local roll = math.___(1, 6)`,
          bank: ["random", "floor", "max", "clamp"],
          a: ["random"]
        },
        {
          t: "choice",
          q: "Что вернёт `math.clamp(-20, 0, 100)`?",
          opts: ["0", "-20", "100"],
          a: 0
        },
        {
          t: "choice",
          q: "Сколько будет `2 + 3 * 4`?",
          opts: ["14", "20", "24"],
          a: 0,
          why: "Как в математике: сначала умножение, потом сложение."
        }
      ]
    },
    {
      id: "b-strings",
      title: "Строки: работа с текстом",
      sub: "Склеиваем текст и вставляем в него числа",
      icon: "💬",
      ref: "operators-strings",
      slides: [
        {
          t: "info",
          title: "Склеивание: две точки",
          text: "`..` приклеивает один текст к другому.",
          code: L`local name = "Alex"
print("Привет, " .. name .. "!")`,
          out: "Привет, Alex!",
          tip: "Не забывай пробелы внутри кавычек, иначе слова слипнутся."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local pet = "Кот"
print("Мой " .. pet)`,
          a: ["Мой Кот"]
        },
        {
          t: "info",
          title: "Удобный способ: обратные кавычки",
          text: "Пиши текст в **обратных кавычках** (клавиша Ё в английской раскладке), а значения вставляй в фигурные скобки `{}`:",
          code: L`local name = "Alex"
local coins = 250
print(\`{name} собрал {coins} монет\`)`,
          out: "Alex собрал 250 монет"
        },
        {
          t: "fill",
          q: "Вставь переменную в текст",
          code: L`local coins = 50
print(\`Монет: ___coins___\`)`,
          bank: ["{", "}", "(", ")", "[", "]"],
          a: ["{", "}"]
        },
        {
          t: "info",
          title: "Полезные штуки для текста",
          code: L`local text = "Roblox"
print(#text)        --> 6, длина
print(text:upper()) --> ROBLOX
print(text:lower()) --> roblox`
        },
        {
          t: "choice",
          q: "Что вернёт `#\"Hello\"`?",
          opts: ["5", "4", "Hello"],
          a: 0
        },
        {
          t: "choice",
          q: "Что выведет `print(\"5\" .. 5)`?",
          opts: ["55", "10", "Ошибку"],
          a: 0,
          why: "`..` склеивает: число 5 превращается в текст и приклеивается."
        },
        {
          t: "choice",
          q: "Что будет?",
          code: L`local bonus = nil
print("Бонус: " .. bonus)`,
          opts: ["Ошибка: склеить с nil нельзя", "Бонус: nil", "Бонус: "],
          a: 0,
          why: "Пустоту приклеить нельзя. Сначала проверь, что значение есть, или используй обратные кавычки."
        }
      ]
    },
    {
      id: "b-bool",
      title: "Да и нет: сравнения",
      sub: "true, false и как сравнивать значения",
      icon: "⚖️",
      ref: "conditions",
      slides: [
        {
          t: "info",
          title: "Ответ на вопрос: да или нет",
          text: "Сравнение — это вопрос. Ответ всегда `true` (да) или `false` (нет).",
          code: L`print(5 > 3)  --> true
print(2 > 10) --> false`
        },
        {
          t: "match",
          q: "Соедини знак и смысл",
          pairs: [
            ["`==`", "Равно"],
            ["`~=`", "Не равно"],
            ["`>=`", "Больше или равно"],
            ["`<`", "Меньше"]
          ]
        },
        {
          t: "choice",
          q: "Как в Luau написать «не равно»?",
          opts: ["`~=`", "`!=`", "`<>`"],
          a: 0,
          why: "Во многих языках пишут `!=`, но в Luau — именно `~=`."
        },
        {
          t: "input",
          q: "Что выведет `print(10 == 10)`?",
          a: ["true"]
        },
        {
          t: "info",
          title: "Не путай = и ==",
          text: [
            "`=` — **положить** значение в переменную: `coins = 5`.",
            "`==` — **спросить**, равны ли значения: `coins == 5`."
          ]
        },
        {
          t: "choice",
          q: "Где ошибка?",
          code: L`if coins = 100 then
	print("Сто монет!")
end`,
          opts: ["Нужно `==`, а не `=`", "Нужно `then` убрать", "Ошибки нет"],
          a: 0
        },
        {
          t: "info",
          title: "not — наоборот",
          code: L`print(not true)  --> false
print(not false) --> true`
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local isAlive = true
print(not isAlive)`,
          opts: ["false", "true", "nil"],
          a: 0
        }
      ]
    },
    {
      id: "b-if",
      title: "Условие if",
      sub: "Игра принимает решения",
      icon: "🔀",
      ref: "conditions",
      slides: [
        {
          t: "info",
          title: "Если... то...",
          text: "Как в жизни: «**если** идёт дождь, **то** возьми зонт». В Luau:",
          code: L`if coins >= 100 then
	print("Можно купить меч!")
end`,
          after: "Код между `then` и `end` выполнится, только если условие верно."
        },
        {
          t: "fill",
          q: "Допиши условие",
          code: L`if health <= 0 ___
	print("Игрок погиб")
___`,
          bank: ["then", "end", "do", "}"],
          a: ["then", "end"]
        },
        {
          t: "info",
          title: "else — иначе",
          code: L`if coins >= 50 then
	print("Покупка!")
else
	print("Не хватает монет")
end`,
          after: "Сработает **только одна** из двух веток."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local coins = 30
if coins >= 50 then
	print("Покупка!")
else
	print("Мало монет")
end`,
          opts: ["Мало монет", "Покупка!", "Оба текста"],
          a: 0
        },
        {
          t: "order",
          q: "Собери покупку: если хватает монет — списать цену",
          lines: ["local price = 100", "if coins >= price then", "\tcoins -= price", "end"]
        },
        {
          t: "info",
          title: "Отступы",
          text: "Код внутри `if` сдвигают клавишей **Tab**. Luau это не требует, но так сразу видно, что к чему относится.",
          tip: "Studio сам ставит отступ, когда нажимаешь Enter после `then`."
        },
        {
          t: "choice",
          q: "Чем обязательно заканчивается блок `if`?",
          opts: ["`end`", "`stop`", "`}`"],
          a: 0
        },
        {
          t: "studio",
          title: "Проверь здоровье",
          steps: [
            "Создай Script в ServerScriptService.",
            "Вставь код ниже и запусти.",
            "Поменяй 30 на 80 и запусти снова."
          ],
          code: L`local health = 30
if health < 50 then
	warn("Мало здоровья!")
else
	print("Всё хорошо")
end`,
          where: "ServerScriptService > Script",
          result: "при 30 — жёлтое предупреждение, при 80 — «Всё хорошо»."
        }
      ]
    },
    {
      id: "b-elseif",
      title: "elseif: много вариантов",
      sub: "Когда вариантов больше двух",
      icon: "🪜",
      ref: "conditions",
      slides: [
        {
          t: "info",
          title: "Лесенка условий",
          text: "`elseif` значит «а если нет, то проверь вот это».",
          code: L`if health <= 0 then
	print("Погиб")
elseif health < 30 then
	print("Опасно!")
else
	print("Нормально")
end`
        },
        {
          t: "info",
          title: "Работает только первое подходящее",
          text: [
            "Условия проверяются **сверху вниз**.",
            "Как только одно подошло, остальные **даже не проверяются**."
          ]
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local x = 7
if x > 5 then
	print("A")
elseif x > 3 then
	print("B")
end`,
          opts: ["A", "B", "A и B"],
          a: 0,
          why: "7 > 5 подошло сразу, до проверки `x > 3` дело не дошло."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local score = 75
if score >= 90 then
	print("S")
elseif score >= 70 then
	print("A")
else
	print("B")
end`,
          a: ["A"]
        },
        {
          t: "fill",
          q: "Добавь второе условие",
          code: L`if health <= 0 then
	print("Погиб")
___ health < 30 then
	print("Опасно!")
end`,
          bank: ["elseif", "else", "if", "then"],
          a: ["elseif"]
        },
        {
          t: "choice",
          q: "Почему для 95 очков выводится «B», а не «S»?",
          code: L`if score >= 50 then
	print("B")
elseif score >= 90 then
	print("S")
end`,
          opts: [
            "Первое условие уже подошло, до второго очередь не дошла",
            "elseif не работает с числами",
            "Нужно писать `else if`"
          ],
          a: 0,
          why: "Самое строгое условие нужно ставить первым: сначала `>= 90`, потом `>= 50`."
        }
      ]
    },
    {
      id: "b-logic",
      title: "and, or, not",
      sub: "Несколько условий сразу",
      icon: "🔗",
      ref: "conditions",
      slides: [
        {
          t: "info",
          title: "И, ИЛИ, НЕ",
          code: L`if level >= 10 and hasKey then
	print("Подземелье открыто")
end

if isVip or isAdmin then
	print("Добро пожаловать!")
end`,
          after: "`and` — нужны **оба** условия. `or` — хватит **одного**."
        },
        {
          t: "match",
          q: "Соедини слово и смысл",
          pairs: [
            ["`and`", "Оба верны"],
            ["`or`", "Хотя бы одно верно"],
            ["`not`", "Наоборот"]
          ]
        },
        {
          t: "choice",
          q: "Откроется ли дверь?",
          code: L`local level = 12
local hasKey = false
if level >= 10 and hasKey then
	print("Открыто")
end`,
          opts: ["Нет: ключа нет", "Да: уровень больше 10"],
          a: 0
        },
        {
          t: "info",
          title: "Что считается «нет»",
          text: [
            "В условии «нет» — это только `false` и `nil`. **Всё остальное — «да»**, даже `0`.",
            "Поэтому так проверяют, есть ли объект:"
          ],
          code: L`local boss = workspace:FindFirstChild("Boss")
if boss then
	print("Босс на карте!")
end`
        },
        {
          t: "choice",
          q: "Какое значение в условии считается «нет»?",
          opts: ["`nil`", "`0`", "`\"нет\"`"],
          a: 0
        },
        {
          t: "choice",
          q: "Что вернёт `nil or \"Гость\"`?",
          opts: ["\"Гость\"", "nil", "true"],
          a: 0,
          why: "`or` берёт первое «да». Так задают значение по умолчанию."
        },
        {
          t: "info",
          title: "Ранний выход: return",
          text: "Вместо лесенки из if проверяй плохие случаи сразу и выходи:",
          code: L`if not isAlive then return end
if coins < price then return end
print("Покупка прошла!")`
        },
        {
          t: "choice",
          q: "Что делает строка `if not isAlive then return end`?",
          opts: ["Если игрок мёртв — дальше код не выполняется", "Оживляет игрока", "Повторяет проверку"],
          a: 0
        }
      ]
    },
    {
      id: "b-for",
      title: "Цикл for",
      sub: "Повторить действие много раз",
      icon: "🔁",
      ref: "loops",
      slides: [
        {
          t: "info",
          title: "Повтори 5 раз",
          code: L`for i = 1, 5 do
	print("Шаг", i)
end`,
          out: "Шаг 1\nШаг 2\nШаг 3\nШаг 4\nШаг 5",
          after: "`i` — счётчик. Он сам растёт от 1 до 5."
        },
        {
          t: "input",
          q: "Сколько раз выведется «Привет»?",
          code: L`for i = 1, 4 do
	print("Привет")
end`,
          a: ["4"]
        },
        {
          t: "info",
          title: "Шаг и обратный отсчёт",
          text: "Третье число — шаг. С минусом цикл идёт назад:",
          code: L`for i = 3, 1, -1 do
	print(i)
	task.wait(1) -- пауза 1 секунда
end
print("Старт!")`,
          out: "3\n2\n1\nСтарт!"
        },
        {
          t: "choice",
          q: "Сколько раз выполнится `for i = 2, 10, 2 do`?",
          opts: ["5", "4", "10"],
          a: 0,
          why: "2, 4, 6, 8, 10 — пять раз."
        },
        {
          t: "fill",
          q: "Сделай обратный отсчёт с паузой",
          code: L`for i = 10, 1, ___ do
	print(i)
	task.___(1)
end`,
          bank: ["-1", "1", "wait", "sleep"],
          a: ["-1", "wait"]
        },
        {
          t: "info",
          title: "Циклы строят мир",
          text: "Одна строка цикла — и в игре 10 деталей:",
          code: L`for i = 1, 10 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Position = Vector3.new(0, i, i * 3)
	part.Parent = workspace
end`,
          where: "ServerScriptService > Script",
          after: "Получится лестница! Позже подробно разберём `Instance.new`."
        },
        {
          t: "order",
          q: "Собери цикл, который создаёт 10 деталей",
          lines: ["for i = 1, 10 do", "\tlocal part = Instance.new(\"Part\")", "\tpart.Parent = workspace", "end"]
        },
        {
          t: "studio",
          title: "Построй лестницу",
          steps: [
            "Создай Script в ServerScriptService.",
            "Вставь код лестницы со слайда выше.",
            "Нажми Play и попробуй забраться наверх. Поменяй 10 на 30."
          ],
          result: "лестница из деталей, которая уходит вверх."
        }
      ]
    },
    {
      id: "b-while",
      title: "while и паузы",
      sub: "Повторять, пока что-то верно",
      icon: "⏳",
      ref: "loops",
      slides: [
        {
          t: "info",
          title: "Пока... делай",
          text: "`while` повторяет код, **пока** условие верно.",
          code: L`local n = 1
while n < 100 do
	n = n * 2
end
print(n)`,
          out: "128"
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local n = 1
while n < 20 do
	n = n * 2
end
print(n)`,
          a: ["32"],
          why: "1 → 2 → 4 → 8 → 16 → 32. На 32 условие `n < 20` стало ложным."
        },
        {
          t: "info",
          title: "Вечный цикл игры",
          text: "Многие игры крутятся по кругу: лобби → раунд → итоги → снова.",
          code: L`while true do
	print("Новый раунд!")
	task.wait(60)
end`,
          warn: "В вечном цикле **обязательно** нужна пауза `task.wait`. Без неё игра зависнет."
        },
        {
          t: "choice",
          q: "Что случится с этим кодом?",
          code: L`while true do
	print("hi")
end`,
          opts: ["Игра зависнет: нет паузы", "hi раз в секунду", "hi один раз"],
          a: 0
        },
        {
          t: "info",
          title: "break и continue",
          code: L`for i = 1, 10 do
	if i == 4 then
		break    -- выйти из цикла
	end
	print(i) --> 1, 2, 3
end`,
          after: "`continue` — пропустить этот шаг и сразу перейти к следующему."
        },
        {
          t: "input",
          q: "Какое последнее число выведет этот код?",
          code: L`for i = 1, 10 do
	if i > 3 then
		break
	end
	print(i)
end`,
          a: ["3"]
        },
        {
          t: "match",
          q: "Соедини команду и что она делает",
          pairs: [
            ["`while true do`", "Вечный цикл"],
            ["`task.wait(1)`", "Пауза 1 секунда"],
            ["`break`", "Выйти из цикла"],
            ["`continue`", "Следующий шаг"]
          ]
        }
      ]
    },
    {
      id: "b-func",
      title: "Функции",
      sub: "Свои команды, которые можно вызывать",
      icon: "🛠️",
      ref: "functions",
      slides: [
        {
          t: "info",
          title: "Функция — как рецепт",
          text: [
            "Рецепт записывают один раз, а готовят по нему сколько угодно.",
            "Функция — это свой кусок кода с именем. Пишем один раз, вызываем много."
          ],
          code: L`local function sayHello()
	print("Привет!")
end

sayHello() -- вызов
sayHello() -- ещё раз`
        },
        {
          t: "choice",
          q: "Когда выполняется код внутри функции?",
          opts: ["Когда её вызвали по имени со скобками", "Сразу при запуске игры", "Никогда"],
          a: 0
        },
        {
          t: "fill",
          q: "Допиши функцию",
          code: L`local ___ greet()
	print("Добро пожаловать!")
___

greet()`,
          bank: ["function", "end", "then", "do"],
          a: ["function", "end"]
        },
        {
          t: "info",
          title: "Сначала объяви, потом вызывай",
          text: "Скрипт читается сверху вниз. Функцию нужно написать **выше** того места, где её вызывают.",
          warn: "Если вызвать функцию раньше, чем она написана, будет ошибка."
        },
        {
          t: "order",
          q: "Собери функцию и её вызов",
          lines: ["local function jump()", "\tprint(\"Прыг!\")", "end", "jump()"]
        },
        {
          t: "input",
          q: "Сколько раз выведется «Ура»?",
          code: L`local function cheer()
	print("Ура")
end
cheer()
cheer()
cheer()`,
          a: ["3"]
        },
        {
          t: "studio",
          title: "Твоя функция",
          steps: [
            "В Script напиши функцию `celebrate`, которая выводит «🎉 Победа!».",
            "Вызови её два раза.",
            "Запусти игру."
          ],
          code: L`local function celebrate()
	print("🎉 Победа!")
end

celebrate()
celebrate()`,
          where: "ServerScriptService > Script",
          result: "два раза «🎉 Победа!» в Output."
        }
      ]
    },
    {
      id: "b-params",
      title: "Параметры и return",
      sub: "Передаём данные в функцию и получаем ответ",
      icon: "🎁",
      ref: "functions",
      slides: [
        {
          t: "info",
          title: "Параметры — что передать",
          text: "В скобках пишут, что функция получает. Это как ингредиенты для рецепта.",
          code: L`local function greet(name)
	print("Привет, " .. name)
end

greet("Mia")
greet("Alex")`,
          out: "Привет, Mia\nПривет, Alex"
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local function hi(name)
	print("Хай, " .. name)
end
hi("Bob")`,
          a: ["Хай, Bob"]
        },
        {
          t: "info",
          title: "return — вернуть ответ",
          text: "Функция может посчитать что-то и **отдать результат** обратно:",
          code: L`local function double(n)
	return n * 2
end

local result = double(21)
print(result) --> 42`
        },
        {
          t: "fill",
          q: "Пусть функция вернёт сумму",
          code: L`local function add(a, b)
	___ a + b
end`,
          bank: ["return", "print", "give", "end"],
          a: ["return"]
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local function damage(base)
	return base * 3
end
print(damage(10))`,
          a: ["30"]
        },
        {
          t: "info",
          title: "Переменные внутри функции",
          text: "Переменная, созданная внутри функции через `local`, живёт **только внутри неё**.",
          code: L`local function test()
	local secret = 5
end
test()
print(secret) --> nil`
        },
        {
          t: "choice",
          q: "Почему `print(secret)` выводит nil?",
          opts: ["`secret` существует только внутри функции", "Функцию не вызвали", "5 нельзя вывести"],
          a: 0
        }
      ]
    },
    {
      id: "b-lists",
      title: "Списки",
      sub: "Много значений в одной переменной",
      icon: "📋",
      ref: "tables",
      slides: [
        {
          t: "info",
          title: "Список — это таблица",
          text: "В фигурных скобках через запятую. Каждый элемент имеет номер.",
          code: L`local inventory = {"Меч", "Щит", "Зелье"}
print(inventory[1]) --> Меч
print(inventory[3]) --> Зелье`,
          warn: "Нумерация начинается с **1**, а не с 0."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local colors = {"Красный", "Синий", "Зелёный"}
print(colors[2])`,
          opts: ["Синий", "Красный", "Зелёный"],
          a: 0
        },
        {
          t: "info",
          title: "Длина, добавить, найти, удалить",
          code: L`print(#inventory)                     -- сколько всего
table.insert(inventory, "Лук")        -- добавить в конец
local i = table.find(inventory, "Щит") -- номер элемента
table.remove(inventory, i)            -- удалить по номеру`
        },
        {
          t: "fill",
          q: "Добавь «Лук» в конец инвентаря",
          code: L`table.___(inventory, "Лук")`,
          bank: ["insert", "remove", "find", "add"],
          a: ["insert"]
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local items = {"Меч", "Щит"}
table.insert(items, "Лук")
print(#items)`,
          a: ["3"]
        },
        {
          t: "choice",
          q: "Что выведет `print(items[0])` для `{\"Меч\", \"Щит\"}`?",
          opts: ["nil", "Меч", "Ошибку"],
          a: 0,
          why: "Элемента с номером 0 нет, ведь счёт начинается с 1."
        },
        {
          t: "match",
          q: "Соедини команду и действие",
          pairs: [
            ["`#list`", "Сколько элементов"],
            ["`table.insert`", "Добавить"],
            ["`table.find`", "Найти номер"],
            ["`table.remove`", "Удалить"]
          ]
        }
      ]
    },
    {
      id: "b-dicts",
      title: "Словари",
      sub: "Таблицы с подписями вместо номеров",
      icon: "🗂️",
      ref: "tables",
      slides: [
        {
          t: "info",
          title: "Словарь: имя → значение",
          text: "Иногда удобнее подписывать, а не нумеровать. Это **словарь**:",
          code: L`local sword = {
	name = "Огненный меч",
	damage = 35,
	price = 300,
}
print(sword.name)   --> Огненный меч
print(sword.damage) --> 35`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local sword = {damage = 30}
sword.damage += 10
print(sword.damage)`,
          a: ["40"]
        },
        {
          t: "fill",
          q: "Создай питомца с именем",
          code: L`local pet = {name ___ "Барсик", age ___ 2}`,
          bank: ["=", "=", ":", "=="],
          a: ["=", "="],
          why: "В таблицах Luau подписи и значения разделяет `=`."
        },
        {
          t: "info",
          title: "Добавить и удалить подпись",
          code: L`sword.element = "Огонь" -- добавить
sword.price = nil        -- удалить`,
          tip: "`sword[\"damage\"]` — то же самое, что `sword.damage`. Квадратные скобки нужны, когда имя лежит в переменной."
        },
        {
          t: "choice",
          q: "Как удалить из словаря поле `price`?",
          opts: ["`sword.price = nil`", "`sword.price = 0`", "`delete sword.price`"],
          a: 0
        },
        {
          t: "order",
          q: "Создай питомца, добавь возраст и выведи всё",
          lines: ["local pet = {name = \"Барсик\"}", "pet.age = 2", "print(pet.name, pet.age)"]
        },
        {
          t: "choice",
          q: "Когда лучше словарь, а не список?",
          opts: ["Когда у каждого значения есть смысловое имя", "Когда значения идут по порядку", "Никогда"],
          a: 0,
          why: "Список — инвентарь по порядку. Словарь — характеристики меча: урон, цена, имя."
        }
      ]
    },
    {
      id: "b-loop-tables",
      title: "Перебор таблиц",
      sub: "Пройтись по всем элементам по очереди",
      icon: "🔄",
      ref: "tables",
      slides: [
        {
          t: "info",
          title: "for ... in",
          text: "Такой цикл проходит по таблице и даёт номер и значение каждого элемента:",
          code: L`local inventory = {"Меч", "Щит", "Зелье"}
for i, item in inventory do
	print(i, item)
end`,
          out: "1 Меч\n2 Щит\n3 Зелье"
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local sum = 0
for _, n in {1, 2, 3} do
	sum += n
end
print(sum)`,
          a: ["6"]
        },
        {
          t: "info",
          title: "Что за `_`",
          text: "Если номер не нужен, вместо него пишут `_`. Это значит «мне не важно»."
        },
        {
          t: "info",
          title: "Перебор объектов игры",
          text: "`GetChildren()` даёт список всех объектов внутри папки. Самый частый цикл в Roblox:",
          tree: L`⚙️ Workspace
  📁 **Lamps**
    🧱 Lamp
    🧱 Lamp
    🧱 Lamp`,
          code: L`for _, lamp in workspace.Lamps:GetChildren() do
	lamp.Material = Enum.Material.Neon
end`
        },
        {
          t: "order",
          q: "Включи все лампы в папке",
          lines: ["local folder = workspace.Lamps", "for _, lamp in folder:GetChildren() do", "\tlamp.Material = Enum.Material.Neon", "end"]
        },
        {
          t: "choice",
          q: "Что вернёт `folder:GetChildren()`?",
          opts: ["Список объектов прямо внутри папки", "Количество объектов", "Только первый объект"],
          a: 0
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local a = {1, 2}
local b = a
b[1] = 99
print(a[1])`,
          opts: ["99", "1", "nil"],
          a: 0,
          why: "`b = a` не делает копию. a и b — одна и та же таблица. Копию делает `table.clone(a)`."
        }
      ]
    }
  ]
});
