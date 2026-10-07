APP_UNITS.push({
  title: "Основы Luau",
  desc: "Переменные, условия, циклы, функции и таблицы на примерах из игр",
  color: "#1cb0f6",
  shade: "#1899d6",
  lessons: [
    {
      id: "variables",
      title: "Переменные и типы",
      icon: "📦",
      slides: [
        {
          t: "info",
          title: "Переменная — коробка с подписью",
          text: "Слово `local` создаёт переменную, а `=` кладёт в неё значение.",
          code: L`local coins = 100
local name = "Alex"
print(name, coins)`,
          out: "Alex 100"
        },
        {
          t: "fill",
          q: "Создай числовую переменную `health` со значением 100",
          code: L`___ health = ___`,
          bank: ["local", "var", "let", "100", "health"],
          a: ["local", "100"],
          why: "В Luau переменные создают словом `local`. `var` и `let` — из других языков."
        },
        {
          t: "info",
          title: "Меняем значение",
          text: "`local` пишется только при создании. Дальше просто обращаемся по имени.",
          code: L`local coins = 100
coins = coins + 50 -- стало 150
coins += 25        -- короткая запись: стало 175`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local x = 10
x += 5
x = x * 2
print(x)`,
          a: ["30"],
          why: "10 + 5 = 15, потом 15 × 2 = 30."
        },
        {
          t: "info",
          title: "Типы данных",
          text: [
            "**number** — число: `10`, `-3`, `0.5`",
            "**string** — текст в кавычках: `\"Привет\"`",
            "**boolean** — да или нет: `true`, `false`",
            "**nil** — «ничего», значения нет"
          ]
        },
        {
          t: "match",
          q: "Соедини значение и его тип",
          pairs: [
            ["`42`", "number"],
            ["`\"привет\"`", "string"],
            ["`true`", "boolean"],
            ["`nil`", "пустота"]
          ]
        },
        {
          t: "choice",
          q: "Какое имя переменной **нельзя** использовать?",
          opts: ["`2player`", "`player2`", "`_temp`", "`maxHealth`"],
          a: 0,
          why: "Имя не может начинаться с цифры."
        },
        {
          t: "info",
          title: "typeof — узнать тип",
          code: L`print(typeof(42))        --> number
print(typeof("42"))      --> string
print(typeof(workspace)) --> Instance`,
          after: "Instance — это любой объект игры: деталь, скрипт, игрок."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local a = 10
local b = "10"
print(a == b)`,
          opts: ["false", "true", "10", "Ошибку"],
          a: 0,
          why: "Число 10 и строка \"10\" — разные значения."
        },
        {
          t: "info",
          title: "Перевод между типами",
          code: L`print(tonumber("15") + 5)  --> 20
print(tostring(7) .. "!")  --> 7!
print(tonumber("abc"))     --> nil`
        },
        {
          t: "choice",
          q: "Что вернёт `tonumber(\"abc\")`?",
          opts: ["nil", "0", "\"abc\"", "Ошибку"],
          a: 0
        },
        {
          t: "choice",
          q: "Почему переменные всегда создают через `local`?",
          opts: [
            "Так быстрее, и переменная не мешает другим частям кода",
            "Без local код не запустится",
            "local делает переменную видимой во всех скриптах"
          ],
          a: 0
        }
      ]
    },
    {
      id: "operators-strings",
      title: "Математика и строки",
      icon: "🔢",
      slides: [
        {
          t: "info",
          title: "Арифметика",
          code: L`print(10 + 3)  --> 13
print(10 / 4)  --> 2.5
print(10 // 3) --> 3  деление нацело
print(10 % 3)  --> 1  остаток
print(2 ^ 3)   --> 8  степень`,
          after: "`%` удобен для таймеров: 135 секунд — это `135 // 60` минут и `135 % 60` секунд."
        },
        {
          t: "match",
          q: "Соедини выражение и результат",
          pairs: [
            ["`10 // 3`", "3"],
            ["`10 % 3`", "1"],
            ["`2 ^ 3`", "8"],
            ["`10 / 4`", "2.5"]
          ]
        },
        {
          t: "info",
          title: "Сравнение",
          text: [
            "`==` равно, `~=` **не равно**, `<` `>` `<=` `>=`.",
            "Результат сравнения — `true` или `false`."
          ]
        },
        {
          t: "choice",
          q: "Как написать «не равно» в Luau?",
          opts: ["`~=`", "`!=`", "`<>`", "`=/=`"],
          a: 0
        },
        {
          t: "info",
          title: "Склеиваем строки",
          text: "Две точки `..` склеивают строки. А в обратных кавычках можно вставлять значения в `{}`:",
          code: L`local name = "Alex"
local coins = 250
print("Игрок " .. name .. " собрал " .. coins)
print(\`Игрок {name} собрал {coins}\`)`,
          out: "Игрок Alex собрал 250\nИгрок Alex собрал 250"
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local name = "Mia"
print("Привет, " .. name .. "!")`,
          a: ["Привет, Mia!"]
        },
        {
          t: "fill",
          q: "Вставь переменную в строку",
          code: L`local coins = 50
print(\`Монет: ___coins___\`)`,
          bank: ["{", "}", "(", ")", "[", "]"],
          a: ["{", "}"],
          why: "В строке с обратными кавычками значения вставляют в фигурных скобках."
        },
        {
          t: "info",
          title: "Библиотека math",
          code: L`print(math.floor(3.7))         --> 3
print(math.random(1, 6))       --> случайное от 1 до 6
print(math.max(5, 12, 8))      --> 12
print(math.clamp(150, 0, 100)) --> 100`,
          after: "`math.clamp` не даёт значению выйти за границы: здоровье не больше максимума."
        },
        {
          t: "choice",
          q: "Что вернёт `math.clamp(-20, 0, 100)`?",
          opts: ["0", "-20", "100", "80"],
          a: 0
        },
        {
          t: "choice",
          q: "Что вернёт `#\"Roblox\"`?",
          opts: ["6", "5", "7", "\"Roblox\""],
          a: 0,
          why: "`#` — длина строки. Для латиницы это количество букв."
        },
        {
          t: "input",
          q: "Чему равно `17 % 5`?",
          a: ["2"],
          why: "17 = 5 × 3 + 2. Остаток — 2."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`print("5" .. 5)`,
          opts: ["55", "10", "Ошибку", "5 5"],
          a: 0,
          why: "`..` склеивает: число превращается в текст и приклеивается."
        }
      ]
    },
    {
      id: "conditions",
      title: "Условия",
      icon: "🔀",
      slides: [
        {
          t: "info",
          title: "if — если",
          text: "«**Если** условие верно, **то** выполни код до **end**».",
          code: L`local coins = 120
local price = 100

if coins >= price then
	coins -= price
	print("Куплено!")
end`
        },
        {
          t: "fill",
          q: "Допиши проверку смерти",
          code: L`if health ___ 0 ___
	print("Игрок погиб")
___`,
          bank: ["<=", "then", "end", "do", "=", "}"],
          a: ["<=", "then", "end"],
          why: "После условия пишется `then`, а блок закрывается `end`. Одиночное `=` — это присваивание, не сравнение."
        },
        {
          t: "info",
          title: "elseif и else",
          text: "Условия проверяются **сверху вниз**. Срабатывает **первое** подходящее, остальные пропускаются.",
          code: L`if health <= 0 then
	print("Погиб")
elseif health < 30 then
	print("Критическое здоровье!")
else
	print("Всё нормально")
end`
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local x = 7
if x > 5 then
	print("A")
elseif x > 3 then
	print("B")
else
	print("C")
end`,
          opts: ["A", "B", "A и B", "C"],
          a: 0,
          why: "7 > 5, поэтому сработает первая ветка, и дальше проверки не идут."
        },
        {
          t: "info",
          title: "and, or, not",
          code: L`if level >= 10 and hasKey then
	print("Подземелье открыто")
end

if isVip or isAdmin then
	print("Вход в VIP-комнату")
end

if not isAlive then
	print("Ты погиб")
end`
        },
        {
          t: "match",
          q: "Соедини оператор и смысл",
          pairs: [
            ["`and`", "Оба условия верны"],
            ["`or`", "Хотя бы одно верно"],
            ["`not`", "Наоборот"],
            ["`~=`", "Не равно"]
          ]
        },
        {
          t: "info",
          title: "Что считается ложью",
          text: [
            "Ложь — только `false` и `nil`. **Всё остальное правда**, даже `0` и пустая строка.",
            "Поэтому так проверяют, существует ли объект:"
          ],
          code: L`local boss = workspace:FindFirstChild("Boss")
if boss then
	print("Босс на карте")
end`
        },
        {
          t: "choice",
          q: "Какое значение считается ложью?",
          opts: ["`nil`", "`0`", "`\"\"`", "`\"false\"`"],
          a: 0,
          why: "`\"false\"` в кавычках — просто текст, а значит, правда."
        },
        {
          t: "choice",
          q: "Что вернёт `nil or \"Гость\"`?",
          opts: ["\"Гость\"", "nil", "true", "false"],
          a: 0,
          why: "`or` возвращает первое «правдивое» значение. Так задают значения по умолчанию."
        },
        {
          t: "order",
          q: "Собери проверку покупки",
          lines: ["local price = 100", "if coins >= price then", "\tcoins -= price", "end"],
          why: "Сначала создаём `price`, потом используем её в условии."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local status = if 15 > 20 then "OK" else "Опасно"
print(status)`,
          opts: ["Опасно", "OK", "nil", "Ошибку"],
          a: 0,
          why: "Это if-выражение: выбирает одно из двух значений в одной строке."
        }
      ]
    },
    {
      id: "loops",
      title: "Циклы",
      icon: "🔁",
      slides: [
        {
          t: "info",
          title: "for — повтори N раз",
          code: L`for i = 1, 5 do
	print("Шаг", i)
end`,
          out: "Шаг 1\nШаг 2\nШаг 3\nШаг 4\nШаг 5",
          after: "Третье число — шаг: `for i = 10, 1, -1 do` считает назад."
        },
        {
          t: "choice",
          q: "Сколько раз выполнится `for i = 2, 10, 2 do`?",
          opts: ["5", "4", "10", "9"],
          a: 0,
          why: "2, 4, 6, 8, 10 — пять раз."
        },
        {
          t: "fill",
          q: "Сделай обратный отсчёт с паузой в секунду",
          code: L`for i = 10, 1, ___ do
	print(i)
	task.___(1)
end`,
          bank: ["-1", "1", "wait", "sleep", "0"],
          a: ["-1", "wait"]
        },
        {
          t: "info",
          title: "while true — бесконечный цикл",
          text: "Так устроены игровые циклы: лобби → раунд → итоги → снова.",
          code: L`while true do
	print("Новый раунд!")
	task.wait(30)
end`,
          after: "⚠️ В бесконечном цикле **обязательно** нужна пауза `task.wait`, иначе игра зависнет."
        },
        {
          t: "choice",
          q: "Что произойдёт?",
          code: L`while true do
	print("hi")
end`,
          opts: ["Игра зависнет: нет паузы", "hi будет выводиться раз в секунду", "hi выведется один раз"],
          a: 0
        },
        {
          t: "info",
          title: "break и continue",
          code: L`for i = 1, 10 do
	if i % 2 == 0 then
		continue -- пропустить чётные
	end
	if i > 7 then
		break    -- выйти из цикла
	end
	print(i)    --> 1, 3, 5, 7
end`
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
          t: "order",
          q: "Собери цикл, который создаёт 10 деталей",
          lines: ["for i = 1, 10 do", "\tlocal part = Instance.new(\"Part\")", "\tpart.Parent = workspace", "end"]
        },
        {
          t: "choice",
          q: "Чем `repeat ... until` отличается от `while`?",
          opts: ["Тело выполнится хотя бы один раз", "Он работает быстрее", "Он не бывает бесконечным"],
          a: 0,
          why: "В repeat условие проверяется в конце."
        },
        {
          t: "match",
          q: "Соедини команду и что она делает",
          pairs: [
            ["`break`", "Выйти из цикла"],
            ["`continue`", "Следующий шаг"],
            ["`task.wait(1)`", "Пауза 1 сек"],
            ["`while true do`", "Бесконечный цикл"]
          ]
        },
        {
          t: "choice",
          q: "Какую устаревшую функцию паузы заменяет `task.wait`?",
          opts: ["`wait`", "`sleep`", "`pause`", "`delay`"],
          a: 0
        }
      ]
    },
    {
      id: "functions",
      title: "Функции",
      icon: "🛠️",
      slides: [
        {
          t: "info",
          title: "Функция — рецепт",
          text: "Объявляем один раз, вызываем сколько угодно.",
          code: L`local function sayHello()
	print("Привет!")
end

sayHello() -- вызов: имя и скобки
sayHello()`
        },
        {
          t: "info",
          title: "Параметры и return",
          code: L`local function calculateDamage(base, isCritical)
	if isCritical then
		return base * 2
	end
	return base
end

print(calculateDamage(25, true)) --> 50`,
          after: "`return` завершает функцию и отдаёт результат туда, где её вызвали."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local function double(n)
	return n * 2
end
print(double(21))`,
          a: ["42"]
        },
        {
          t: "fill",
          q: "Допиши функцию сложения",
          code: L`local ___ add(a, b)
	___ a + b
end`,
          bank: ["function", "return", "print", "def", "end"],
          a: ["function", "return"]
        },
        {
          t: "info",
          title: "Область видимости",
          text: "Переменная, созданная через `local` внутри функции, видна **только внутри** неё.",
          code: L`local score = 0 -- видна везде в скрипте

local function addPoints()
	local bonus = 5 -- видна только здесь
	score += 10 + bonus
end`
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local function f()
	local secret = 5
end
f()
print(secret)`,
          opts: ["nil", "5", "Ошибку синтаксиса"],
          a: 0,
          why: "Снаружи функции переменной `secret` не существует."
        },
        {
          t: "info",
          title: "Функцию можно передать",
          text: "Так работают события: отдаём функцию, и Roblox вызовет её сам. **Без скобок!**",
          code: L`local function onTouched(hit)
	print("Коснулся:", hit.Name)
end

workspace.Baseplate.Touched:Connect(onTouched)`
        },
        {
          t: "choice",
          q: "Как правильно подключить функцию `onHit` к событию?",
          opts: ["`part.Touched:Connect(onHit)`", "`part.Touched:Connect(onHit())`", "`part.Touched = onHit`"],
          a: 0,
          why: "Со скобками функция вызовется сразу, и в Connect попадёт её результат."
        },
        {
          t: "info",
          title: "Точка или двоеточие?",
          text: [
            "`.` — свойство или дочерний объект: `part.Transparency`, `workspace.Baseplate`.",
            "`:` — вызов **метода** объекта: `part:Destroy()`, `part:Clone()`."
          ]
        },
        {
          t: "match",
          q: "Соедини запись и что это",
          pairs: [
            ["`part.Transparency`", "Свойство"],
            ["`part:Destroy()`", "Метод"],
            ["`workspace.Baseplate`", "Дочерний объект"],
            ["`return`", "Вернуть результат"]
          ]
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local function info()
	return 2, 10
end
local m, s = info()
print(s)`,
          opts: ["10", "2", "2 10", "nil"],
          a: 0,
          why: "Функция может вернуть несколько значений. `s` получает второе."
        },
        {
          t: "order",
          q: "Собери функцию и её вызов",
          lines: ["local function heal(humanoid)", "\thumanoid.Health = humanoid.MaxHealth", "end", "heal(workspace.Dummy.Humanoid)"],
          why: "Функцию нужно объявить выше места вызова."
        }
      ]
    },
    {
      id: "tables",
      title: "Таблицы",
      icon: "🗂️",
      slides: [
        {
          t: "info",
          title: "Массив — список",
          code: L`local inventory = {"Меч", "Щит", "Зелье"}
print(inventory[1]) --> Меч
print(#inventory)   --> 3`,
          after: "⚠️ Нумерация в Luau начинается с **1**, а не с 0."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local t = {"a", "b", "c"}
print(t[1])`,
          opts: ["a", "b", "nil"],
          a: 0
        },
        {
          t: "info",
          title: "Добавить, найти, удалить",
          code: L`table.insert(inventory, "Лук")       -- в конец
local i = table.find(inventory, "Щит") -- номер элемента
table.remove(inventory, i)             -- удалить по номеру`
        },
        {
          t: "fill",
          q: "Добавь лук в конец инвентаря",
          code: L`table.___(inventory, "Лук")`,
          bank: ["insert", "remove", "find", "add", "push"],
          a: ["insert"]
        },
        {
          t: "info",
          title: "Словарь — ключ и значение",
          code: L`local sword = {
	name = "Огненный меч",
	damage = 35,
}
print(sword.name)      --> Огненный меч
print(sword["damage"]) --> 35
sword.damage += 10`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local sword = {name = "Меч", damage = 30}
sword.damage += 10
print(sword.damage)`,
          a: ["40"]
        },
        {
          t: "info",
          title: "Перебор: for ... in",
          text: "`GetChildren()` возвращает массив объектов. Самый частый цикл в Roblox:",
          code: L`for _, lamp in workspace.Lamps:GetChildren() do
	lamp.Material = Enum.Material.Neon
end`,
          after: "`_` — так называют переменную, которая не нужна (здесь — номер)."
        },
        {
          t: "order",
          q: "Включи все лампы в папке",
          lines: ["local folder = workspace.Lamps", "for _, lamp in folder:GetChildren() do", "\tlamp.Material = Enum.Material.Neon", "end"]
        },
        {
          t: "choice",
          q: "Что вернёт `folder:GetChildren()`?",
          opts: ["Массив прямых детей папки", "Количество объектов", "Все вложенные объекты на любой глубине", "Первый объект"],
          a: 0,
          why: "Все вложенные на любую глубину возвращает `GetDescendants()`."
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
          why: "`b = a` не копирует таблицу: это одна и та же таблица. Копия — `table.clone(a)`."
        },
        {
          t: "match",
          q: "Соедини функцию и действие",
          pairs: [
            ["`#t`", "Длина"],
            ["`table.insert`", "Добавить"],
            ["`table.find`", "Найти номер"],
            ["`table.clone`", "Копия"]
          ]
        }
      ]
    }
  ]
});
