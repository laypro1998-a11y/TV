APP_UNITS.push({
  title: "Клиент, сервер и интерфейс",
  desc: "Кто что видит, клавиши и камера, GUI, RemoteEvent и модули",
  color: "#ff9600",
  shade: "#d97e00",
  lessons: [
    {
      id: "client-server",
      title: "Кто что видит",
      icon: "🌐",
      slides: [
        {
          t: "info",
          title: "Репликация — в одну сторону",
          text: [
            "📜 Сервер изменил объект → изменение **само** приходит всем игрокам.",
            "🖥️ Клиент изменил объект → изменение остаётся **только у него**."
          ]
        },
        {
          t: "choice",
          q: "Сервер покрасил деталь в Workspace. Кто это увидит?",
          opts: ["Все игроки", "Только сервер", "Никто без RemoteEvent"],
          a: 0
        },
        {
          t: "choice",
          q: "LocalScript удалил стену. Кто пройдёт сквозь неё?",
          opts: ["Только этот игрок", "Все игроки", "Никто"],
          a: 0,
          why: "У остальных и на сервере стена на месте. Так работают «noclip»-читы."
        },
        {
          t: "info",
          title: "Что клиенту не видно",
          text: [
            "Содержимое **ServerScriptService** и **ServerStorage** клиенту не отправляется вообще.",
            "Поэтому секретный код и ценные шаблоны храни там. Всё из ReplicatedStorage и Workspace читер может скопировать."
          ]
        },
        {
          t: "match",
          q: "Соедини ситуацию и результат",
          pairs: [
            ["Сервер изменил деталь", "Видят все"],
            ["Клиент изменил деталь", "Видит только он"],
            ["ServerStorage", "Клиенту недоступен"],
            ["Свой персонаж", "Физику считает клиент"]
          ]
        },
        {
          t: "info",
          title: "Исключение: свой персонаж",
          text: [
            "Чтобы движение не тормозило, Roblox доверяет клиенту **физику его персонажа**.",
            "Поэтому `WalkSpeed`, изменённый в LocalScript, реально работает. Отсюда читы на скорость, и сервер должен их проверять."
          ]
        },
        {
          t: "info",
          title: "Главное правило",
          text: [
            "🛑 **Никогда не доверяй клиенту.**",
            "Клиент может только **просить**. Решает всегда **сервер**."
          ]
        },
        {
          t: "choice",
          q: "Как правильно сделать покупку меча?",
          opts: [
            "Клиент шлёт название, сервер сам берёт цену и проверяет деньги",
            "Клиент шлёт цену, сервер её списывает",
            "Клиент сам уменьшает свои монеты"
          ],
          a: 0
        },
        {
          t: "choice",
          q: "Читер шлёт «я нанёс 9999 урона игроку X». Как защититься?",
          opts: [
            "Урон считает сервер, а клиент шлёт только «я выстрелил сюда»",
            "Проверить урон на клиенте",
            "Никак"
          ],
          a: 0
        },
        {
          t: "choice",
          q: "Где хранить код проверки промокодов?",
          opts: ["ServerScriptService", "ReplicatedStorage", "StarterGui"],
          a: 0
        }
      ]
    },
    {
      id: "local-scripts",
      title: "Клавиши и камера",
      icon: "⌨️",
      slides: [
        {
          t: "info",
          title: "Свой игрок на клиенте",
          code: L`local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()`,
          where: "StarterPlayerScripts > LocalScript",
          after: "«Возьми персонажа, а если его ещё нет — дождись». Стандартная строчка, запомни её."
        },
        {
          t: "fill",
          q: "Получи своего игрока и его персонажа",
          code: L`local player = Players.___
local character = player.Character ___ player.CharacterAdded:Wait()`,
          bank: ["LocalPlayer", "or", "and", "Player", "Me"],
          a: ["LocalPlayer", "or"]
        },
        {
          t: "info",
          title: "Нажатия клавиш",
          code: L`UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end -- игрок пишет в чат
	if input.KeyCode == Enum.KeyCode.E then
		print("Нажата E")
	end
end)`
        },
        {
          t: "order",
          q: "Собери обработчик клавиши E",
          lines: [
            "UserInputService.InputBegan:Connect(function(input, processed)",
            "\tif processed then return end",
            "\tif input.KeyCode == Enum.KeyCode.E then",
            "\t\tprint(\"Нажата E\")",
            "\tend",
            "end)"
          ]
        },
        {
          t: "choice",
          q: "Зачем проверять `processed` (gameProcessedEvent)?",
          opts: ["Чтобы не срабатывать, когда игрок пишет в чат", "Чтобы код работал на сервере", "Без этого событие не придёт"],
          a: 0,
          why: "Иначе игрок напишет «hello», и сработают способности на H, E, L и O."
        },
        {
          t: "info",
          title: "Куда класть клиентские скрипты",
          text: [
            "⚙️ **StarterPlayerScripts** — один раз при входе. Камера, общие системы.",
            "⚙️ **StarterCharacterScripts** — в каждого нового персонажа. Бег, двойной прыжок."
          ]
        },
        {
          t: "choice",
          q: "Куда положить скрипт бега на Shift?",
          opts: ["StarterCharacterScripts", "ServerScriptService", "ReplicatedStorage"],
          a: 0,
          why: "Скрипт будет работать с каждым новым персонажем без лишнего кода."
        },
        {
          t: "info",
          title: "Кнопка и на телефоне",
          text: "У игроков на телефоне нет клавиши E. `ContextActionService` создаст кнопку на экране:",
          code: L`ContextActionService:BindAction("Dash", dash, true, Enum.KeyCode.Q)`,
          after: "Третий аргумент `true` — создать тач-кнопку."
        },
        {
          t: "match",
          q: "Соедини инструмент и задачу",
          pairs: [
            ["UserInputService", "Клавиши и мышь"],
            ["ContextActionService", "Кнопка на телефоне"],
            ["CurrentCamera", "Камера игрока"],
            ["LocalPlayer", "Свой игрок"]
          ]
        },
        {
          t: "choice",
          q: "Где можно управлять камерой игрока?",
          opts: ["Только в LocalScript", "Только в Script", "В любом скрипте"],
          a: 0,
          why: "Камера у каждого игрока своя и живёт на клиенте."
        }
      ]
    },
    {
      id: "gui",
      title: "Интерфейс",
      icon: "🖼️",
      slides: [
        {
          t: "info",
          title: "Из чего состоит GUI",
          text: [
            "**ScreenGui** — холст на экране. Внутри: **Frame** (панель), **TextLabel** (текст), **TextButton** (кнопка).",
            "Собирают его в **StarterGui**, и при появлении Roblox копирует его игроку в **PlayerGui**."
          ]
        },
        {
          t: "match",
          q: "Соедини элемент и что это",
          pairs: [
            ["ScreenGui", "Холст на экране"],
            ["Frame", "Панель"],
            ["TextLabel", "Текст"],
            ["TextButton", "Кнопка"]
          ]
        },
        {
          t: "choice",
          q: "Какой скрипт управляет кнопками интерфейса?",
          opts: ["LocalScript", "Script", "ModuleScript сам по себе"],
          a: 0,
          why: "Script в StarterGui не работает: интерфейс живёт на клиенте."
        },
        {
          t: "info",
          title: "Размеры: UDim2",
          code: L`UDim2.new(scaleX, offsetX, scaleY, offsetY)
UDim2.new(0.5, 0, 0, 40) -- половина ширины, 40 пикселей высоты`,
          after: "**Scale** — доля экрана (от 0 до 1), **Offset** — пиксели. Scale подстраивается под телефон."
        },
        {
          t: "choice",
          q: "Что значит `UDim2.new(0.5, 0, 0, 100)`?",
          opts: ["Половина ширины, 100 пикселей высоты", "50 пикселей ширины и вся высота", "Центр экрана"],
          a: 0
        },
        {
          t: "info",
          title: "Кнопка открывает окно",
          code: L`shopButton.Activated:Connect(function()
	shopFrame.Visible = not shopFrame.Visible
end)`,
          where: "StarterGui > MainGui > LocalScript",
          after: "`Activated` срабатывает и на клик мышью, и на тап по экрану."
        },
        {
          t: "fill",
          q: "Открывай и закрывай магазин по кнопке",
          code: L`shopButton.___:Connect(function()
	shopFrame.Visible = ___ shopFrame.Visible
end)`,
          bank: ["Activated", "not", "Touched", "!", "Clicked"],
          a: ["Activated", "not"]
        },
        {
          t: "info",
          title: "Показываем монеты",
          text: "Сервер меняет монеты, а надпись обновляется по событию `Changed`:",
          code: L`local coins = player.leaderstats.Coins
local function update()
	label.Text = "Монеты: " .. coins.Value
end
update()
coins.Changed:Connect(update)`
        },
        {
          t: "order",
          q: "Собери обновление надписи",
          lines: [
            "local coins = player.leaderstats.Coins",
            "local function update()",
            "\tlabel.Text = \"Монеты: \" .. coins.Value",
            "end",
            "coins.Changed:Connect(update)"
          ]
        },
        {
          t: "choice",
          q: "У ScreenGui `ResetOnSpawn = true`. Что будет с ним после смерти?",
          opts: ["Пересоздастся из StarterGui", "Ничего", "Исчезнет навсегда"],
          a: 0
        },
        {
          t: "choice",
          q: "Надпись над головой NPC делают через...",
          opts: ["BillboardGui", "ScreenGui", "SurfaceGui"],
          a: 0,
          why: "BillboardGui висит над деталью и всегда повёрнут к камере."
        }
      ]
    },
    {
      id: "remotes",
      title: "RemoteEvent",
      icon: "📡",
      slides: [
        {
          t: "info",
          title: "Мост между клиентом и сервером",
          text: "**RemoteEvent** кладут в **ReplicatedStorage**: его должны видеть обе стороны.",
          code: L`-- клиент
remote:FireServer("Sword")

-- сервер
remote.OnServerEvent:Connect(function(player, itemName)
	print(player.Name, "хочет", itemName)
end)`
        },
        {
          t: "info",
          title: "Первый аргумент — всегда игрок",
          text: "На сервере `player` подставляет сам Roblox. Подделать его нельзя. Остальное — то, что прислал клиент."
        },
        {
          t: "order",
          q: "Собери серверный обработчик клика",
          lines: [
            "local remote = ReplicatedStorage.Remotes.Click",
            "remote.OnServerEvent:Connect(function(player)",
            "\tplayer.leaderstats.Coins.Value += 1",
            "end)"
          ]
        },
        {
          t: "choice",
          q: "Клиент вызвал `remote:FireServer(\"Sword\")`. Что получит функция на сервере?",
          opts: ["`(player, \"Sword\")`", "`(\"Sword\")`", "`(\"Sword\", player)`"],
          a: 0
        },
        {
          t: "info",
          title: "Сервер → клиенты",
          code: L`notify:FireClient(player, "Привет!") -- одному игроку
notify:FireAllClients("Раунд начался") -- всем

-- на клиенте:
notify.OnClientEvent:Connect(function(message)
	print(message)
end)`
        },
        {
          t: "match",
          q: "Соедини метод и направление",
          pairs: [
            ["FireServer", "Клиент → сервер"],
            ["FireClient", "Сервер → один"],
            ["FireAllClients", "Сервер → все"],
            ["InvokeServer", "Запрос с ответом"]
          ]
        },
        {
          t: "info",
          title: "RemoteFunction — спросить и получить ответ",
          code: L`-- сервер (присваивание, а не Connect!)
getCoins.OnServerInvoke = function(player)
	return player.leaderstats.Coins.Value
end

-- клиент
local coins = getCoins:InvokeServer()`,
          after: "Никогда не используй `InvokeClient`: читер может не ответить, и сервер зависнет."
        },
        {
          t: "fill",
          q: "Допиши серверную часть RemoteFunction",
          code: L`getData.___ = function(player)
	return player.leaderstats.Coins.Value
end`,
          bank: ["OnServerInvoke", "OnServerEvent", "Connect", "Invoke"],
          a: ["OnServerInvoke"]
        },
        {
          t: "info",
          title: "Проверяй всё 🛡️",
          text: [
            "Читер может вызвать FireServer с **любыми** аргументами и **сколько угодно** раз.",
            "Проверяй: тип данных, существует ли предмет, хватает ли денег, рядом ли игрок, не слишком ли часто."
          ]
        },
        {
          t: "choice",
          q: "Что не так с этим кодом?",
          code: L`buy.OnServerEvent:Connect(function(player, item, price)
	player.leaderstats.Coins.Value -= price
end)`,
          opts: ["Цену присылает клиент: читер пришлёт 0 или минус", "Нельзя три параметра", "Всё хорошо"],
          a: 0
        },
        {
          t: "choice",
          q: "Как проверить, что клиент прислал строку?",
          opts: ["`typeof(x) == \"string\"`", "`x == string`", "`x:IsA(\"string\")`"],
          a: 0
        }
      ]
    },
    {
      id: "modules",
      title: "ModuleScript",
      icon: "🧩",
      slides: [
        {
          t: "info",
          title: "Модуль — код, который можно подключить",
          code: L`local Utils = {}

function Utils.double(n)
	return n * 2
end

return Utils -- обязательно!`,
          where: "ReplicatedStorage > ModuleScript «Utils»"
        },
        {
          t: "fill",
          q: "Чего не хватает в конце модуля?",
          code: L`local Utils = {}

function Utils.double(n)
	return n * 2
end

___ Utils`,
          bank: ["return", "print", "export", "end"],
          a: ["return"]
        },
        {
          t: "info",
          title: "require — подключить",
          code: L`local Utils = require(ReplicatedStorage.Utils)
print(Utils.double(21)) --> 42`,
          after: [
            "Модуль выполняется **один раз**, повторный require вернёт ту же таблицу.",
            "Работает **там, откуда подключили**: из Script — на сервере, из LocalScript — на клиенте."
          ]
        },
        {
          t: "choice",
          q: "Два Script подключили один модуль. Сколько раз выполнится его код?",
          opts: ["Один раз, таблица общая", "Два раза", "Ни разу"],
          a: 0
        },
        {
          t: "choice",
          q: "LocalScript подключил модуль. Где модуль выполнится?",
          opts: ["На клиенте", "На сервере", "И там, и там"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини понятие и описание",
          pairs: [
            ["ReplicatedStorage", "Общие модули"],
            ["ServerScriptService", "Серверные модули"],
            ["`return`", "Обязателен в конце"],
            ["`require`", "Подключить модуль"]
          ]
        },
        {
          t: "info",
          title: "Модуль-конфиг",
          text: "Все цены и настройки в одном месте. Магазин на клиенте покажет цену, сервер проверит по тому же конфигу.",
          code: L`local Config = {
	StartCoins = 50,
	Prices = {Sword = 100, Shield = 150},
}
return Config`,
          where: "ReplicatedStorage > ModuleScript «Config»"
        },
        {
          t: "input",
          q: "Что выведет Script?",
          code: L`-- ModuleScript «Config»
local Config = {Price = 50}
return Config

-- Script
local Config = require(ReplicatedStorage.Config)
print(Config.Price * 2)`,
          a: ["100"]
        },
        {
          t: "choice",
          q: "Ошибка «Module code did not return exactly one value» значит...",
          opts: ["Забыли `return` в конце модуля", "Модуль лежит не там", "Нет интернета"],
          a: 0
        },
        {
          t: "choice",
          q: "Модуль A требует B, а B требует A. Что это?",
          opts: ["Циклический require — так нельзя", "Нормальная практика", "Ускорение загрузки"],
          a: 0
        }
      ]
    }
  ]
});
