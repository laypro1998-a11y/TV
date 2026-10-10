BRANCHES.push({
  id: "pro",
  title: "Уровень профи",
  icon: "🏆",
  color: "#e0457b",
  shade: "#b8325f",
  level: "Профи",
  desc: "Классы, типы, теги, структура больших проектов и поиск багов",
  lessons: [
    {
      id: "pr-meta",
      title: "Метатаблицы",
      sub: "Таблица, у которой есть «запасной план»",
      icon: "🧬",
      ref: "oop",
      slides: [
        {
          t: "info",
          title: "Запасная таблица",
          text: "Метатаблица говорит таблице: «если чего-то у тебя нет — поищи **вот здесь**». За это отвечает поле `__index`.",
          code: L`local defaults = {health = 100, speed = 16}
local stats = setmetatable({health = 75}, {__index = defaults})

print(stats.health) --> 75 (своё)
print(stats.speed)  --> 16 (взяли из defaults)`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local base = {damage = 10}
local sword = setmetatable({}, {__index = base})
print(sword.damage)`,
          a: ["10"]
        },
        {
          t: "choice",
          q: "Что выведет `print(stats.health)` из примера, где у stats своё health = 75?",
          opts: ["75", "100", "nil"],
          a: 0,
          why: "Своё значение важнее: в запасную таблицу заглядывают, только если своего нет."
        },
        {
          t: "fill",
          q: "Подключи запасную таблицу",
          code: L`local t = ___({}, {___ = defaults})`,
          bank: ["setmetatable", "__index", "table.clone", "__add"],
          a: ["setmetatable", "__index"]
        },
        {
          t: "info",
          title: "Другие «магические» поля",
          text: [
            "`__tostring` — что показывать в print.",
            "`__add` — что делать при `+`.",
            "`__eq` — как сравнивать через `==`."
          ]
        },
        {
          t: "match",
          q: "Соедини поле и что оно меняет",
          pairs: [
            ["`__index`", "Поиск чего нет"],
            ["`__tostring`", "Вывод в print"],
            ["`__add`", "Сложение"]
          ]
        }
      ]
    },
    {
      id: "pr-class",
      title: "Классы",
      sub: "Чертёж, по которому делают много объектов",
      icon: "🏗️",
      ref: "oop",
      slides: [
        {
          t: "info",
          title: "Чертёж и копии",
          text: [
            "В игре 20 видов оружия. У всех есть урон, перезарядка, улучшение.",
            "**Класс** — чертёж: описываем один раз, а потом создаём сколько угодно объектов."
          ]
        },
        {
          t: "info",
          title: "Класс в Luau",
          code: L`local Weapon = {}
Weapon.__index = Weapon

function Weapon.new(name, damage)
	local self = setmetatable({}, Weapon)
	self.name = name
	self.damage = damage
	return self
end

function Weapon:upgrade()
	self.damage += 5
end

return Weapon`,
          where: "ReplicatedStorage > ModuleScript «Weapon»",
          after: "`new` — конструктор, создаёт объект. `self` — сам объект внутри методов."
        },
        {
          t: "order",
          q: "Собери конструктор",
          given: L`local Weapon = {}
Weapon.__index = Weapon`,
          lines: [
            "function Weapon.new(damage)",
            "\tlocal self = setmetatable({}, Weapon)",
            "\tself.damage = damage",
            "\treturn self",
            "end"
          ]
        },
        {
          t: "info",
          title: "Используем класс",
          code: L`local Weapon = require(ReplicatedStorage.Weapon)
local sword = Weapon.new("Меч", 10)
local axe = Weapon.new("Топор", 40)

sword:upgrade()
print(sword.damage) --> 15
print(axe.damage)   --> 40`
        },
        {
          t: "choice",
          q: "Метод написан как `function Weapon:upgrade()`. Как вызвать?",
          opts: ["`sword:upgrade()`", "`sword.upgrade()`", "`Weapon.upgrade()`"],
          a: 0,
          why: "Двоеточие передаёт сам объект как `self`."
        },
        {
          t: "choice",
          q: "Улучшили меч. Изменился ли урон топора?",
          opts: ["Нет: у каждого объекта свои данные", "Да: класс общий"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини слово и смысл",
          pairs: [
            ["Класс", "Чертёж"],
            ["`.new()`", "Создать объект"],
            ["`self`", "Сам объект"],
            ["Метод", "Функция объекта"]
          ]
        }
      ]
    },
    {
      id: "pr-types",
      title: "Типы Luau",
      sub: "Ловим ошибки ещё до запуска игры",
      icon: "🏷️",
      ref: "types",
      slides: [
        {
          t: "info",
          title: "Подсказки для редактора",
          text: "Строка `--!strict` в начале скрипта включает строгую проверку. Studio подчеркнёт ошибки прямо в коде.",
          code: L`--!strict
local coins: number = 100

local function add(a: number, b: number): number
	return a + b
end

add(coins, "50") -- ⚠ подчеркнёт: текст вместо числа`
        },
        {
          t: "fill",
          q: "Подпиши типы",
          code: L`local function double(n___ number)___ number
	return n * 2
end`,
          bank: [":", ":", "=", "->"],
          a: [":", ":"]
        },
        {
          t: "info",
          title: "Может быть пусто: ?",
          code: L`local function findTool(player: Player): Tool?
	return player.Backpack:FindFirstChildOfClass("Tool")
end`,
          after: "`Tool?` — «Tool или nil». Studio напомнит проверить на nil."
        },
        {
          t: "choice",
          q: "Что значит тип `string?`",
          opts: ["Текст или nil", "Любой текст", "Список текстов"],
          a: 0
        },
        {
          t: "info",
          title: "Свои типы",
          code: L`type Item = {
	name: string,
	price: number,
}`
        },
        {
          t: "match",
          q: "Соедини тип и смысл",
          pairs: [
            ["`number`", "Число"],
            ["`{string}`", "Список текстов"],
            ["`boolean?`", "Да/нет или nil"]
          ]
        },
        {
          t: "choice",
          q: "В `--!strict` есть ошибка типов. Запустится ли игра?",
          opts: ["Да: это подсказки редактора", "Нет"],
          a: 0
        }
      ]
    },
    {
      id: "pr-tags",
      title: "Теги: один скрипт на всё",
      sub: "CollectionService вместо сотни копий",
      icon: "🔖",
      ref: "architecture",
      slides: [
        {
          t: "info",
          title: "Проблема ста скриптов",
          text: [
            "В обби 100 блоков лавы, и в каждом свой скрипт. Нужно поменять урон — правишь 100 раз.",
            "Решение: повесить на все блоки **тег** `Lava`, а код написать **один раз**."
          ]
        },
        {
          t: "info",
          title: "Как поставить тег",
          text: "Выдели детали → в Properties внизу раздел **Tags** → **+** → введи `Lava`."
        },
        {
          t: "info",
          title: "Один скрипт на все",
          code: L`local CollectionService = game:GetService("CollectionService")

local function setupLava(part)
	part.Touched:Connect(function(hit)
		local h = hit.Parent:FindFirstChildOfClass("Humanoid")
		if h then h.Health = 0 end
	end)
end

for _, part in CollectionService:GetTagged("Lava") do
	setupLava(part)
end`,
          where: "ServerScriptService > Script «Hazards»"
        },
        {
          t: "fill",
          q: "Найди все детали с тегом Lava",
          code: L`for _, part in CollectionService:___("Lava") do
	setupLava(part)
end`,
          bank: ["GetTagged", "GetChildren", "FindTag"],
          a: ["GetTagged"]
        },
        {
          t: "info",
          title: "И новые тоже",
          code: L`CollectionService:GetInstanceAddedSignal("Lava"):Connect(setupLava)`,
          after: "Так заработают даже блоки, которые появятся во время игры."
        },
        {
          t: "choice",
          q: "200 одинаковых ловушек. Как лучше?",
          opts: ["Тег на ловушки и один скрипт", "Скрипт в каждой ловушке", "LocalScript у игрока"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини инструмент и смысл",
          pairs: [
            ["GetTagged", "Все объекты с тегом"],
            ["GetInstanceAddedSignal", "Новый объект с тегом"],
            ["Tags в Properties", "Поставить тег без кода"]
          ]
        },
        {
          t: "choice",
          q: "Во время игры появилась новая лава с тегом. Будет ли она убивать?",
          opts: ["Да, если подписаться на GetInstanceAddedSignal", "Нет, никогда", "Только после перезапуска Studio"],
          a: 0
        },
        {
          t: "studio",
          title: "Лава на тегах",
          steps: [
            "Сделай 3 красные детали и повесь на каждую тег `Lava`.",
            "В ServerScriptService создай Script с кодом выше.",
            "Добавь четвёртую деталь с тегом прямо во время игры (в режиме сервера)."
          ],
          result: "все детали с тегом убивают, хотя скрипт всего один."
        }
      ]
    },
    {
      id: "pr-arch",
      title: "Как устроен большой проект",
      sub: "Мало скриптов, много модулей",
      icon: "🏛️",
      ref: "architecture",
      slides: [
        {
          t: "info",
          title: "Структура профи",
          tree: L`⚙️ ReplicatedStorage
  📁 Shared — общие модули, Config
  📁 Remotes — все RemoteEvent
⚙️ ServerScriptService
  📜 **Main** — один Script
  📁 Services — модули сервера
⚙️ StarterPlayerScripts
  🖥️ **Client** — один LocalScript
  📁 Controllers — модули клиента`,
          after: "Один Script и один LocalScript только подключают модули. Вся работа — в модулях."
        },
        {
          t: "info",
          title: "Сервисы и контроллеры",
          text: [
            "📦 **Сервис** (на сервере) — модуль одной системы: DataService, ShopService, CombatService.",
            "📦 **Контроллер** (на клиенте) — то же для игрока: InputController, UIController."
          ]
        },
        {
          t: "match",
          q: "Соедини модуль и его работу",
          pairs: [
            ["DataService", "Сохранения"],
            ["ShopService", "Покупки"],
            ["UIController", "Интерфейс"],
            ["Config", "Цены и настройки"]
          ]
        },
        {
          t: "choice",
          q: "Где лежит UIController?",
          opts: ["На клиенте: StarterPlayerScripts", "На сервере: ServerScriptService"],
          a: 0
        },
        {
          t: "info",
          title: "Не тормозить и не течь",
          text: [
            "⚡ Реагируй на события, а не проверяй в цикле каждую секунду.",
            "🎨 Эффекты рисуй на клиенте.",
            "🧹 Убирай данные вышедших игроков: `PlayerRemoving` → `data[player] = nil`."
          ]
        },
        {
          t: "choice",
          q: "Как правильно обновлять надпись с монетами?",
          opts: ["`coins.Changed:Connect(update)`", "`while true do update() task.wait() end`"],
          a: 0
        },
        {
          t: "choice",
          q: "Зачем удалять данные игрока из таблицы, когда он вышел?",
          opts: ["Иначе память забивается мусором и сервер тормозит", "Так требует DataStore", "Чтобы он не вернулся"],
          a: 0
        }
      ]
    },
    {
      id: "pr-debug",
      title: "Поиск багов",
      sub: "Как найти, почему не работает",
      icon: "🐞",
      ref: "architecture",
      slides: [
        {
          t: "info",
          title: "Алгоритм поиска бага",
          text: [
            "1️⃣ Посмотри **Output**. Есть красная ошибка? Прочитай её целиком.",
            "2️⃣ Нет ошибки? Проверь, **запускается ли скрипт**: первой строкой `print(\"старт\")`.",
            "3️⃣ Запускается, но не так? Поставь `print` с переменными на каждом шаге.",
            "4️⃣ Проверь, где работает код: сервер или клиент."
          ]
        },
        {
          t: "choice",
          q: "Скрипт молчит, ошибок нет. Первый шаг?",
          opts: ["Поставить `print(\"старт\")` и проверить, запускается ли он", "Переписать всё", "Переустановить Studio"],
          a: 0,
          why: "Если «старт» не появился — скрипт лежит не там или это не тот тип скрипта."
        },
        {
          t: "info",
          title: "Точка останова",
          text: "Кликни слева от номера строки — появится красная точка. Игра **замрёт** на этой строке, и можно навести мышку на переменные и посмотреть их значения."
        },
        {
          t: "info",
          title: "Консоль F9",
          text: "В запущенной игре нажми **F9**. Там ошибки и клиента, и сервера. Работает даже в опубликованной игре."
        },
        {
          t: "match",
          q: "Соедини инструмент и смысл",
          pairs: [
            ["print", "Показать значение"],
            ["Точка останова", "Пауза на строке"],
            ["F9", "Консоль в игре"],
            ["`assert`", "Ошибка, если условие ложно"]
          ]
        },
        {
          t: "choice",
          q: "LocalScript не работает и ничего не пишет. Он лежит в Workspace. В чём дело?",
          opts: ["LocalScript в Workspace не запускается", "Нужно больше print", "Сломан Studio"],
          a: 0
        },
        {
          t: "choice",
          q: "Ошибка «attempt to index nil with 'Health'». Что это значит?",
          opts: ["Обратились к Health у того, чего нет (nil)", "У Humanoid нет здоровья", "Health нужно писать с маленькой буквы"],
          a: 0
        }
      ]
    }
  ]
});
