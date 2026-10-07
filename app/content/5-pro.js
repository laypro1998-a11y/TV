APP_UNITS.push({
  title: "Уровень профи",
  desc: "ООП, типы, сохранения и архитектура больших проектов",
  color: "#ff4b4b",
  shade: "#ea2b2b",
  lessons: [
    {
      id: "oop",
      title: "Метатаблицы и ООП",
      icon: "🏗️",
      slides: [
        {
          t: "info",
          title: "Метатаблица и __index",
          text: "`__index` говорит: «если ключа нет в таблице, поищи его вот здесь».",
          code: L`local defaults = {health = 100, speed = 16}
local stats = setmetatable({health = 75}, {__index = defaults})

print(stats.health) --> 75 (есть в самой таблице)
print(stats.speed)  --> 16 (взяли из defaults)`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local defaults = {speed = 16}
local stats = setmetatable({}, {__index = defaults})
print(stats.speed)`,
          a: ["16"]
        },
        {
          t: "info",
          title: "Класс в Luau",
          text: "Методы лежат в таблице-классе, а данные — у каждого объекта свои.",
          code: L`local Weapon = {}
Weapon.__index = Weapon

function Weapon.new(name, damage)
	local self = setmetatable({}, Weapon)
	self.name = name
	self.damage = damage
	return self
end`,
          where: "ReplicatedStorage > ModuleScript «Weapon»"
        },
        {
          t: "order",
          q: "Собери конструктор класса",
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
          title: "Методы и self",
          text: "Метод объявляют через двоеточие. Внутри него `self` — сам объект.",
          code: L`function Weapon:upgrade()
	self.damage += 5
end

local sword = Weapon.new("Меч", 10)
sword:upgrade()
print(sword.damage) --> 15`
        },
        {
          t: "choice",
          q: "Метод объявлен как `function Weapon:attack()`. Как его вызвать?",
          opts: ["`sword:attack()`", "`sword.attack()`", "`Weapon.attack()`"],
          a: 0,
          why: "С точкой `self` окажется nil, и будет ошибка."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`local sword = Weapon.new("Меч", 10)
local axe = Weapon.new("Топор", 40)
sword:upgrade()
print(axe.damage)`,
          opts: ["40", "45", "15", "10"],
          a: 0,
          why: "У каждого объекта свои данные. Улучшили только меч."
        },
        {
          t: "info",
          title: "Наследование",
          code: L`local MagicWeapon = setmetatable({}, {__index = Weapon})
MagicWeapon.__index = MagicWeapon`,
          after: "Метод ищется по цепочке: объект → MagicWeapon → Weapon."
        },
        {
          t: "match",
          q: "Соедини понятие и смысл",
          pairs: [
            ["`__index`", "Где искать ключ"],
            ["`self`", "Сам объект"],
            ["`.new()`", "Конструктор"],
            ["`setmetatable`", "Задать метатаблицу"]
          ]
        },
        {
          t: "choice",
          q: "Зачем классу ловушки метод `destroy` с `Disconnect`?",
          opts: ["Чтобы подписки не работали после удаления объекта", "Для красоты", "Чтобы объект можно было клонировать"],
          a: 0,
          why: "Подписка на Heartbeat живёт, пока её не отключат. Иначе — утечка памяти."
        }
      ]
    },
    {
      id: "types",
      title: "Типизация",
      icon: "🏷️",
      slides: [
        {
          t: "info",
          title: "Типы находят ошибки до запуска",
          text: "Строка `--!strict` в начале включает строгую проверку. Ошибки подчёркиваются прямо в редакторе.",
          code: L`--!strict
local coins: number = 100

local function add(a: number, b: number): number
	return a + b
end

add(coins, "50") -- ⚠ Studio подчеркнёт: строка вместо числа`
        },
        {
          t: "fill",
          q: "Подпиши типы параметра и результата",
          code: L`local function double(n___ number)___ number
	return n * 2
end`,
          bank: [":", ":", "::", "->", "="],
          a: [":", ":"]
        },
        {
          t: "info",
          title: "Опциональный тип: ?",
          text: "`string?` — строка **или nil**. Строгий режим заставит проверить на nil, и это спасает от ошибок.",
          code: L`local function findTool(player: Player): Tool?
	return player.Backpack:FindFirstChildOfClass("Tool")
end`
        },
        {
          t: "choice",
          q: "Что означает тип `Player?`",
          opts: ["Player или nil", "Любой игрок", "Массив игроков"],
          a: 0
        },
        {
          t: "info",
          title: "Свои типы",
          code: L`export type ItemData = {
	name: string,
	price: number,
	rarity: "Common" | "Rare",
}`,
          after: "`export` делает тип доступным в других скриптах."
        },
        {
          t: "match",
          q: "Соедини тип и описание",
          pairs: [
            ["`{number}`", "Массив чисел"],
            ["`{[string]: number}`", "Словарь"],
            ["`string?`", "Строка или nil"],
            ["`\"A\" | \"B\"`", "Одно из двух"]
          ]
        },
        {
          t: "choice",
          q: "В `--!strict` есть ошибка типов. Запустится ли игра?",
          opts: ["Да: это подсказки редактора", "Нет", "Studio сама исправит код"],
          a: 0
        },
        {
          t: "info",
          title: "Приведение: ::",
          code: L`local door = workspace:WaitForChild("Door") :: BasePart`,
          after: "`::` говорит анализатору «поверь мне». Во время игры ничего не проверяется."
        },
        {
          t: "choice",
          q: "Что делает `workspace.Door :: BasePart`?",
          opts: ["Говорит анализатору считать объект деталью", "Превращает объект в деталь", "Проверяет и падает, если это не деталь"],
          a: 0
        },
        {
          t: "choice",
          q: "Как включить строгий режим проверки типов?",
          opts: ["`--!strict`", "`--!nonstrict`", "`--!nocheck`", "`--strict`"],
          a: 0
        }
      ]
    },
    {
      id: "datastores",
      title: "Сохранения",
      icon: "💾",
      slides: [
        {
          t: "info",
          title: "DataStore — облачное хранилище",
          text: [
            "Работает **только на сервере**. Игру нужно опубликовать и включить **Game Settings → Security → Enable Studio Access to API Services**."
          ],
          code: L`local store = DataStoreService:GetDataStore("PlayerData_v1")
store:SetAsync("Player_123", {coins = 100})
local data = store:GetAsync("Player_123")`,
          where: "ServerScriptService > Script"
        },
        {
          t: "match",
          q: "Соедини метод и действие",
          pairs: [
            ["GetAsync", "Загрузить"],
            ["SetAsync", "Перезаписать"],
            ["UpdateAsync", "Безопасно изменить"],
            ["pcall", "Поймать ошибку"]
          ]
        },
        {
          t: "info",
          title: "pcall — защита от сбоев",
          text: "Запрос к DataStore может не пройти. `pcall` перехватит ошибку, и скрипт не упадёт:",
          code: L`local success, data = pcall(function()
	return store:GetAsync(key)
end)
if not success then
	warn("Не загрузилось:", data)
end`
        },
        {
          t: "fill",
          q: "Загрузи данные безопасно",
          code: L`local success, data = ___(function()
	return store:___(key)
end)`,
          bank: ["pcall", "GetAsync", "print", "Load", "SetAsync"],
          a: ["pcall", "GetAsync"]
        },
        {
          t: "choice",
          q: "Что можно сохранить в DataStore?",
          opts: ["`{coins = 10, items = {\"Sword\"}}`", "`Vector3.new(1, 2, 3)`", "`workspace.Sword`"],
          a: 0,
          why: "Только числа, строки, boolean и таблицы из них. Vector3 переводят в {x, y, z}."
        },
        {
          t: "info",
          title: "Не потеряй прогресс игрока",
          text: [
            "Если загрузка не удалась, **кикни** игрока с просьбой перезайти.",
            "Иначе он поиграет «с нуля», выйдет, и пустые данные **затрут** его настоящий прогресс."
          ]
        },
        {
          t: "choice",
          q: "Загрузка данных не удалась. Что делать?",
          opts: ["Кикнуть с просьбой перезайти и не сохранять", "Дать стартовые данные и сохранить их", "Удалить запись"],
          a: 0
        },
        {
          t: "info",
          title: "Когда сохранять",
          text: [
            "**PlayerRemoving** — игрок вышел.",
            "**BindToClose** — сервер выключается, есть до 30 секунд на сохранение.",
            "**Автосохранение** раз в пару минут — на случай краша."
          ]
        },
        {
          t: "choice",
          q: "Зачем `game:BindToClose`?",
          opts: ["Успеть сохранить данные при выключении сервера", "Закрыть DataStore", "Запретить игрокам выходить"],
          a: 0
        },
        {
          t: "order",
          q: "Собери сохранение при выходе",
          lines: [
            "Players.PlayerRemoving:Connect(function(player)",
            "\tlocal ok, err = pcall(function()",
            "\t\tstore:SetAsync(\"Player_\" .. player.UserId, data[player])",
            "\tend)",
            "\tif not ok then warn(err) end",
            "end)"
          ]
        }
      ]
    },
    {
      id: "architecture",
      title: "Архитектура и отладка",
      icon: "🏛️",
      slides: [
        {
          t: "info",
          title: "Мало скриптов, много модулей",
          text: [
            "Один **Script** и один **LocalScript** — точки входа. Они подключают модули.",
            "**Сервисы** на сервере (данные, бой, магазин) и **контроллеры** на клиенте (ввод, интерфейс, камера)."
          ]
        },
        {
          t: "info",
          title: "Теги вместо сотни скриптов",
          text: "Повесь тег `Lava` на 300 деталей, и один скрипт обработает их все:",
          code: L`for _, part in CollectionService:GetTagged("Lava") do
	setupLava(part)
end
CollectionService:GetInstanceAddedSignal("Lava"):Connect(setupLava)`
        },
        {
          t: "fill",
          q: "Обработай все детали с тегом Lava, включая новые",
          code: L`for _, part in CollectionService:___("Lava") do
	setupLava(part)
end
CollectionService:GetInstanceAddedSignal("Lava"):Connect(___)`,
          bank: ["GetTagged", "setupLava", "GetChildren", "setupLava()", "FindTag"],
          a: ["GetTagged", "setupLava"]
        },
        {
          t: "choice",
          q: "В игре 200 одинаковых ловушек. Как лучше?",
          opts: ["Тег на ловушки и один скрипт", "Скрипт в каждой ловушке", "LocalScript на клиенте"],
          a: 0
        },
        {
          t: "choice",
          q: "RemoteEvent `SetProperty(object, property, value)` — это...",
          opts: ["Дыра: читер изменит что угодно", "Удобно и безопасно", "Просто быстро"],
          a: 0
        },
        {
          t: "info",
          title: "Быстро и без утечек",
          text: [
            "Реагируй на события, а не проверяй в цикле: `coins.Changed`, а не `while true`.",
            "Эффекты рисуй на клиенте. Чисти таблицы в `PlayerRemoving`. Удаляй через `Destroy()`."
          ]
        },
        {
          t: "match",
          q: "Соедини инструмент и его смысл",
          pairs: [
            ["Утечка памяти", "Мусор копится"],
            ["F9", "Консоль разработчика"],
            ["Breakpoint", "Пауза на строке"],
            ["`assert`", "Ошибка, если ложь"]
          ]
        },
        {
          t: "choice",
          q: "Скрипт молчит, ошибок нет. Что проверить первым?",
          opts: ["Запускается ли он: `print(\"старт\")` первой строкой", "Переписать всё заново", "Переустановить Studio"],
          a: 0,
          why: "Если «старт» не появился, скрипт лежит не там или это не тот тип скрипта."
        },
        {
          t: "choice",
          q: "Как правильно обновлять надпись с монетами?",
          opts: ["`coins.Changed:Connect(update)`", "`while true do update() task.wait() end`", "Сервер меняет текст каждую секунду"],
          a: 0
        }
      ]
    }
  ]
});
