BRANCHES.push({
  id: "net",
  title: "Клиент и сервер",
  icon: "📡",
  color: "#7c5cff",
  shade: "#5f43d9",
  level: "Средний",
  desc: "Кто что видит, клавиши и камера, RemoteEvent, защита от читеров и модули",
  lessons: [
    {
      id: "n-replication",
      title: "Кто что видит",
      sub: "Почему изменения клиента не видны другим",
      icon: "👀",
      ref: "client-server",
      slides: [
        {
          t: "info",
          title: "Изменения идут в одну сторону",
          text: [
            "📜 Сервер что-то поменял → это **само** приходит всем игрокам.",
            "🖥️ Клиент что-то поменял → это остаётся **только у него**."
          ],
          after: "Это называется **репликация**: копирование изменений с сервера игрокам."
        },
        {
          t: "choice",
          q: "Script на сервере перекрасил стену. Кто увидит?",
          opts: ["Все игроки", "Только сервер", "Никто"],
          a: 0
        },
        {
          t: "choice",
          q: "LocalScript удалил стену. Кто пройдёт сквозь неё?",
          opts: ["Только этот игрок", "Все игроки"],
          a: 0,
          why: "У остальных и на сервере стена на месте. Так работают читы «сквозь стены»."
        },
        {
          t: "info",
          title: "Секретные места",
          text: [
            "🔒 **ServerScriptService** и **ServerStorage** игрок не получает вообще.",
            "👀 **ReplicatedStorage** и **Workspace** получает каждый игрок. Читер может их скопировать."
          ],
          tip: "Важный код и ценные вещи храни в ServerScriptService и ServerStorage."
        },
        {
          t: "match",
          q: "Соедини ситуацию и результат",
          pairs: [
            ["Сервер изменил деталь", "Видят все"],
            ["Клиент изменил деталь", "Видит только он"],
            ["ServerStorage", "Игроку недоступен"]
          ]
        },
        {
          t: "info",
          title: "Исключение: свой персонаж",
          text: [
            "Чтобы бег не тормозил, Roblox доверяет игроку **движение его персонажа**.",
            "Поэтому скорость, изменённая в LocalScript, реально работает. Отсюда и читы на скорость, и серверу приходится их проверять."
          ]
        },
        {
          t: "choice",
          q: "LocalScript поставил своему персонажу `WalkSpeed = 50`. Что будет?",
          opts: ["Персонаж правда побежит быстрее", "Ничего не изменится"],
          a: 0
        }
      ]
    },
    {
      id: "n-input",
      title: "Клавиши и мышь",
      sub: "UserInputService в LocalScript",
      icon: "⌨️",
      ref: "local-scripts",
      slides: [
        {
          t: "info",
          title: "Нажатие клавиши",
          code: L`local UserInputService = game:GetService("UserInputService")

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end -- игрок пишет в чат
	if input.KeyCode == Enum.KeyCode.E then
		print("Нажата E")
	end
end)`,
          where: "StarterPlayer > StarterPlayerScripts > LocalScript"
        },
        {
          t: "choice",
          q: "Зачем строка `if processed then return end`?",
          opts: ["Чтобы не срабатывать, когда игрок пишет в чат", "Чтобы работало на сервере", "Это обязательная формула"],
          a: 0,
          why: "Иначе игрок напишет «hello», и сработают способности на H, E, L и O."
        },
        {
          t: "fill",
          q: "Отреагируй на клавишу F",
          code: L`UserInputService.___:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.___ then
		print("F!")
	end
end)`,
          bank: ["InputBegan", "F", "Touched", "KeyF"],
          a: ["InputBegan", "F"]
        },
        {
          t: "info",
          title: "Бег на Shift",
          code: L`local UserInputService = game:GetService("UserInputService")
local humanoid = script.Parent:WaitForChild("Humanoid")

UserInputService.InputBegan:Connect(function(input, processed)
	if not processed and input.KeyCode == Enum.KeyCode.LeftShift then
		humanoid.WalkSpeed = 28
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if input.KeyCode == Enum.KeyCode.LeftShift then
		humanoid.WalkSpeed = 16
	end
end)`,
          where: "StarterPlayer > StarterCharacterScripts > LocalScript"
        },
        {
          t: "choice",
          q: "Почему скрипт бега лежит в StarterCharacterScripts?",
          opts: ["Он запускается в каждом новом персонаже и сразу знает свой Humanoid", "Там скрипты работают быстрее", "Так требует Shift"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини событие и момент",
          pairs: [
            ["InputBegan", "Клавишу нажали"],
            ["InputEnded", "Клавишу отпустили"],
            ["MouseButton1", "Левая кнопка мыши"]
          ]
        },
        {
          t: "studio",
          title: "Бег на Shift",
          steps: [
            "В StarterPlayer → StarterCharacterScripts создай **LocalScript**.",
            "Вставь код бега со слайда.",
            "Запусти игру и зажми Shift."
          ],
          result: "с Shift персонаж бежит быстрее, без Shift — обычно."
        }
      ]
    },
    {
      id: "n-camera",
      title: "Камера и телефон",
      sub: "Управляем камерой и делаем кнопки для мобильных",
      icon: "🎥",
      ref: "local-scripts",
      slides: [
        {
          t: "info",
          title: "Камера — только у игрока",
          text: "У каждого игрока своя камера. Значит, управлять ей можно **только из LocalScript**.",
          code: L`local camera = workspace.CurrentCamera
camera.FieldOfView = 90 -- шире угол обзора (обычно 70)`,
          where: "StarterPlayerScripts > LocalScript"
        },
        {
          t: "choice",
          q: "Где можно управлять камерой игрока?",
          opts: ["В LocalScript", "В Script на сервере", "В ModuleScript в ServerStorage"],
          a: 0
        },
        {
          t: "info",
          title: "Приблизить и отдалить",
          code: L`local player = game.Players.LocalPlayer
player.CameraMaxZoomDistance = 20 -- дальше не отдалить
player.CameraMinZoomDistance = 5`
        },
        {
          t: "info",
          title: "Кнопка для телефона",
          text: "На телефоне нет клавиш. `ContextActionService` привязывает действие к клавише **и сам рисует кнопку** на экране телефона:",
          code: L`local CAS = game:GetService("ContextActionService")

local function dash(name, state)
	if state == Enum.UserInputState.Begin then
		print("Рывок!")
	end
end

CAS:BindAction("Dash", dash, true, Enum.KeyCode.Q)`,
          after: "Третий аргумент `true` — создать кнопку на тач-экране."
        },
        {
          t: "choice",
          q: "Что значит `true` в `BindAction(\"Dash\", dash, true, Enum.KeyCode.Q)`?",
          opts: ["Создать кнопку на экране телефона", "Включить действие навсегда", "Сделать рывок двойным"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини инструмент и задачу",
          pairs: [
            ["CurrentCamera", "Камера игрока"],
            ["FieldOfView", "Угол обзора"],
            ["ContextActionService", "Кнопки для телефона"],
            ["UserInputService", "Клавиатура и мышь"]
          ]
        },
        {
          t: "fill",
          q: "Расширь обзор камеры",
          code: L`local camera = workspace.___
camera.___ = 90`,
          bank: ["CurrentCamera", "FieldOfView", "Camera", "Zoom"],
          a: ["CurrentCamera", "FieldOfView"]
        }
      ]
    },
    {
      id: "n-remote",
      title: "RemoteEvent: просьба к серверу",
      sub: "Клиент нажал кнопку — сервер что-то сделал",
      icon: "📡",
      ref: "remotes",
      slides: [
        {
          t: "info",
          title: "Зачем RemoteEvent",
          text: [
            "Кнопка «Купить» — на экране игрока (клиент). А монеты должен менять сервер.",
            "**RemoteEvent** — мост: клиент **просит**, сервер **делает**."
          ]
        },
        {
          t: "info",
          title: "Где лежит мост",
          text: "RemoteEvent должны видеть обе стороны, поэтому он лежит в **ReplicatedStorage**:",
          tree: L`⚙️ ReplicatedStorage
  📡 **ClickEvent** — RemoteEvent
⚙️ ServerScriptService
  📜 Script — слушает
⚙️ StarterGui
  🖼️ ScreenGui
    🖥️ LocalScript — отправляет`
        },
        {
          t: "info",
          title: "Клиент отправляет",
          code: L`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local clickEvent = ReplicatedStorage:WaitForChild("ClickEvent")

script.Parent.Button.Activated:Connect(function()
	clickEvent:FireServer()
end)`,
          where: "StarterGui > ScreenGui > LocalScript"
        },
        {
          t: "info",
          title: "Сервер слушает",
          code: L`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local clickEvent = ReplicatedStorage.ClickEvent

clickEvent.OnServerEvent:Connect(function(player)
	player.leaderstats.Coins.Value += 1
end)`,
          where: "ServerScriptService > Script",
          after: "Первым аргументом **всегда** приходит игрок. Его подставляет сам Roblox, подделать нельзя."
        },
        {
          t: "fill",
          q: "Допиши обе стороны",
          code: L`-- клиент
clickEvent:___()

-- сервер
clickEvent.___:Connect(function(player)
	print(player.Name, "кликнул")
end)`,
          bank: ["FireServer", "OnServerEvent", "OnClientEvent", "Fire"],
          a: ["FireServer", "OnServerEvent"]
        },
        {
          t: "choice",
          q: "Где должен лежать RemoteEvent?",
          opts: ["ReplicatedStorage", "ServerStorage", "StarterGui"],
          a: 0,
          why: "ServerStorage игрок не видит — LocalScript его не найдёт."
        },
        {
          t: "choice",
          q: "Клиент вызвал `event:FireServer(\"Sword\")`. Что придёт на сервер?",
          opts: ["`(player, \"Sword\")`", "`(\"Sword\")`", "`(\"Sword\", player)`"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини часть и её роль",
          pairs: [
            ["FireServer", "Клиент отправляет"],
            ["OnServerEvent", "Сервер получает"],
            ["ReplicatedStorage", "Где лежит мост"]
          ]
        },
        {
          t: "studio",
          title: "Кнопка, которая даёт монеты",
          steps: [
            "Сделай leaderstats с Coins (урок «Таблица очков»).",
            "В ReplicatedStorage создай **RemoteEvent** `ClickEvent`.",
            "Сделай ScreenGui с кнопкой `Button` и LocalScript клиента.",
            "Добавь Script сервера в ServerScriptService."
          ],
          result: "каждый клик по кнопке добавляет 1 монету в таблице очков."
        }
      ]
    },
    {
      id: "n-remote2",
      title: "Сервер говорит игрокам",
      sub: "FireClient и FireAllClients",
      icon: "📢",
      ref: "remotes",
      slides: [
        {
          t: "info",
          title: "Обратная дорога",
          code: L`-- сервер
notify:FireClient(player, "Ты нашёл сундук!") -- одному
notify:FireAllClients("Раунд начался!")       -- всем`,
          where: "ServerScriptService > Script"
        },
        {
          t: "info",
          title: "Клиент слушает",
          code: L`notify.OnClientEvent:Connect(function(message)
	print("Сервер говорит:", message)
end)`,
          where: "StarterPlayerScripts > LocalScript",
          after: "Здесь игрок первым аргументом **не** приходит: клиент и так знает, кто он."
        },
        {
          t: "match",
          q: "Соедини метод и направление",
          pairs: [
            ["FireServer", "Клиент → сервер"],
            ["FireClient", "Сервер → один игрок"],
            ["FireAllClients", "Сервер → все"]
          ]
        },
        {
          t: "fill",
          q: "Сообщи всем, что раунд начался",
          code: L`roundEvent:___("Раунд начался!")`,
          bank: ["FireAllClients", "FireServer", "FireClient", "SendAll"],
          a: ["FireAllClients"]
        },
        {
          t: "choice",
          q: "Нужно показать сообщение только одному игроку. Что использовать?",
          opts: ["`FireClient(player, ...)`", "`FireAllClients(...)`", "`FireServer(...)`"],
          a: 0
        },
        {
          t: "choice",
          q: "Какое событие ловит сообщения на клиенте?",
          opts: ["OnClientEvent", "OnServerEvent", "Changed"],
          a: 0
        }
      ]
    },
    {
      id: "n-function",
      title: "RemoteFunction: вопрос-ответ",
      sub: "Когда клиенту нужен ответ от сервера",
      icon: "❓",
      ref: "remotes",
      slides: [
        {
          t: "info",
          title: "Спросить и дождаться ответа",
          text: [
            "RemoteEvent — «крикнул и забыл».",
            "**RemoteFunction** — «спросил и **ждёшь ответ**». Например: «Получилось купить?» — «Нет, мало монет»."
          ]
        },
        {
          t: "info",
          title: "Как это пишется",
          code: L`-- сервер: присваиваем функцию (без Connect!)
buyFunc.OnServerInvoke = function(player, item)
	return false, "Не хватает монет"
end

-- клиент: ждёт ответа
local ok, message = buyFunc:InvokeServer("Sword")
print(message)`
        },
        {
          t: "fill",
          q: "Допиши серверную часть",
          code: L`getCoins.___ = function(player)
	return player.leaderstats.Coins.Value
end`,
          bank: ["OnServerInvoke", "OnServerEvent", "Connect"],
          a: ["OnServerInvoke"]
        },
        {
          t: "choice",
          q: "Чем RemoteFunction отличается от RemoteEvent?",
          opts: ["Тот, кто спросил, получает ответ (return)", "Работает быстрее", "Не нужен ReplicatedStorage"],
          a: 0
        },
        {
          t: "choice",
          q: "Как сервер подключает обработчик RemoteFunction?",
          opts: ["`OnServerInvoke = function(...)`", "`OnServerInvoke:Connect(...)`", "`Invoke:Listen(...)`"],
          a: 0
        },
        {
          t: "info",
          title: "Одно правило безопасности",
          warn: "Никогда не используй `InvokeClient` (сервер спрашивает клиента). Читер может не ответить никогда, и серверный скрипт зависнет."
        },
        {
          t: "choice",
          q: "Магазин: клиент хочет узнать, удалась ли покупка. Что выбрать?",
          opts: ["RemoteFunction", "RemoteEvent", "BindableEvent"],
          a: 0
        }
      ]
    },
    {
      id: "n-security",
      title: "Защита от читеров",
      sub: "Никогда не верь клиенту",
      icon: "🛡️",
      ref: "remotes",
      slides: [
        {
          t: "info",
          title: "Читер может всё на своей стороне",
          text: [
            "Читер может вызвать `FireServer` **с любыми данными** и **сколько угодно раз** в секунду.",
            "Поэтому каждый обработчик на сервере — как охранник: всё проверяет."
          ]
        },
        {
          t: "choice",
          q: "Что не так с этим кодом?",
          code: L`buy.OnServerEvent:Connect(function(player, item, price)
	player.leaderstats.Coins.Value -= price
end)`,
          opts: ["Цену присылает клиент: читер пришлёт 0", "Слишком много параметров", "Всё хорошо"],
          a: 0
        },
        {
          t: "info",
          title: "Правильно: клиент только просит",
          code: L`local PRICES = {Sword = 100, Shield = 150} -- цены знает сервер

buy.OnServerEvent:Connect(function(player, item)
	if typeof(item) ~= "string" then return end -- проверка типа
	local price = PRICES[item]
	if not price then return end                 -- есть ли товар
	local coins = player.leaderstats.Coins
	if coins.Value < price then return end       -- хватает ли
	coins.Value -= price
end)`,
          where: "ServerScriptService > Script"
        },
        {
          t: "order",
          q: "Расставь проверки покупки по порядку: товар → монеты → покупка",
          given: L`buy.OnServerEvent:Connect(function(player, item)`,
          lines: [
            "\tlocal price = PRICES[item]",
            "\tif not price then return end",
            "\tlocal coins = player.leaderstats.Coins",
            "\tif coins.Value < price then return end",
            "\tcoins.Value -= price",
            "end)"
          ]
        },
        {
          t: "choice",
          q: "Как проверить, что клиент прислал текст?",
          opts: ["`typeof(item) == \"string\"`", "`item == string`", "`item:IsA(\"string\")`"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини чит и защиту",
          pairs: [
            ["Прислал цену 0", "Цена на сервере"],
            ["Спам 1000 раз", "Кулдаун"],
            ["Открыл сундук издалека", "Проверка расстояния"],
            ["Прислал мусор", "Проверка типа"]
          ]
        },
        {
          t: "choice",
          q: "Клиент шлёт «я нанёс 9999 урона». Как правильно?",
          opts: ["Клиент шлёт «стреляю сюда», а урон считает сервер", "Поверить клиенту", "Ограничить урон до 9998"],
          a: 0
        }
      ]
    },
    {
      id: "n-modules",
      title: "Модули: общий код",
      sub: "ModuleScript, require и конфиг игры",
      icon: "🧩",
      ref: "modules",
      slides: [
        {
          t: "info",
          title: "Модуль — книга рецептов",
          text: "ModuleScript хранит функции и данные. Сам не запускается: его **подключают** другие скрипты.",
          code: L`local Config = {}

Config.StartCoins = 50
Config.Prices = {Sword = 100, Shield = 150}

return Config -- обязательно!`,
          where: "ReplicatedStorage > ModuleScript «Config»"
        },
        {
          t: "fill",
          q: "Чего не хватает в конце модуля?",
          code: L`local Utils = {}
function Utils.double(n)
	return n * 2
end
___ Utils`,
          bank: ["return", "print", "end", "export"],
          a: ["return"]
        },
        {
          t: "info",
          title: "require — подключить",
          code: L`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Config)
print(Config.Prices.Sword) --> 100`,
          after: "Если модуль подключил Script — модуль работает на сервере. Если LocalScript — на клиенте."
        },
        {
          t: "input",
          q: "Что выведет скрипт?",
          code: L`-- ModuleScript «Config»
local Config = {Price = 50}
return Config

-- Script
local Config = require(ReplicatedStorage.Config)
print(Config.Price * 2)`,
          a: ["100"]
        },
        {
          t: "info",
          title: "Где хранить модули",
          tree: L`⚙️ ReplicatedStorage
  📦 **Config** — цены, видят все
⚙️ ServerScriptService
  📦 **ShopLogic** — секретная логика`
        },
        {
          t: "choice",
          q: "Где хранить модуль с проверкой промокодов?",
          opts: ["ServerScriptService", "ReplicatedStorage"],
          a: 0,
          why: "Модули в ReplicatedStorage скачивает каждый игрок, и читер их прочитает."
        },
        {
          t: "choice",
          q: "Два скрипта подключили один модуль. Сколько раз выполнится его код?",
          opts: ["Один раз, оба получат одну таблицу", "Два раза", "Ни разу"],
          a: 0
        },
        {
          t: "choice",
          q: "Ошибка «Module code did not return exactly one value» значит...",
          opts: ["Забыли `return` в конце модуля", "Модуль слишком большой", "Нет интернета"],
          a: 0
        }
      ]
    }
  ]
});
