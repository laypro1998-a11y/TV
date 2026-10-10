BRANCHES.push({
  id: "games",
  title: "Делаем игры",
  icon: "🎮",
  color: "#ff6f3c",
  shade: "#d9531f",
  level: "Практика",
  desc: "Собираем по шагам три игры: обби, симулятор с магазином и PvP-бластер",
  lessons: [
    {
      id: "gm-obby1",
      title: "Обби: ловушки",
      sub: "Лава, исчезающие платформы и движущиеся препятствия",
      icon: "🟥",
      slides: [
        {
          t: "info",
          title: "Что такое обби",
          text: [
            "**Обби** (obstacle course) — полоса препятствий: прыгаешь по платформам, избегаешь лавы, доходишь до финиша.",
            "За 3 урока соберём своё обби: ловушки → чекпоинты → финиш с таймером."
          ]
        },
        {
          t: "info",
          title: "Шаг 1. Лава на тегах",
          text: "Вешаем тег `Lava` на все опасные блоки и пишем **один** скрипт:",
          code: L`local CollectionService = game:GetService("CollectionService")

local function setupLava(part)
	part.Touched:Connect(function(hit)
		local h = hit.Parent:FindFirstChildOfClass("Humanoid")
		if h then h.Health = 0 end
	end)
end

for _, part in CollectionService:GetTagged("Lava") do
	setupLava(part)
end
CollectionService:GetInstanceAddedSignal("Lava"):Connect(setupLava)`,
          where: "ServerScriptService > Script «Obby»"
        },
        {
          t: "choice",
          q: "Почему лава сделана через тег, а не скриптом в каждом блоке?",
          opts: ["Один скрипт легко менять, сколько бы ни было блоков", "Теги работают быстрее физики", "Так требует Roblox"],
          a: 0
        },
        {
          t: "info",
          title: "Шаг 2. Исчезающая платформа",
          code: L`local platform = script.Parent
local busy = false

platform.Touched:Connect(function(hit)
	if busy then return end
	if not hit.Parent:FindFirstChildOfClass("Humanoid") then return end
	busy = true
	task.wait(0.5)
	platform.Transparency = 0.8
	platform.CanCollide = false
	task.wait(3)
	platform.Transparency = 0
	platform.CanCollide = true
	busy = false
end)`,
          where: "Workspace > FadePlatform > Script"
        },
        {
          t: "fill",
          q: "Сделай платформу проходимой и почти невидимой",
          code: L`platform.___ = 0.8
platform.___ = false`,
          bank: ["Transparency", "CanCollide", "Anchored", "Visible"],
          a: ["Transparency", "CanCollide"]
        },
        {
          t: "choice",
          q: "Зачем в исчезающей платформе флажок `busy`?",
          opts: ["Чтобы она не «мигала» от каждого касания", "Чтобы она упала", "Без него нельзя менять Transparency"],
          a: 0
        },
        {
          t: "info",
          title: "Шаг 3. Движущееся препятствие",
          code: L`local TweenService = game:GetService("TweenService")
local wall = script.Parent
local info = TweenInfo.new(2, Enum.EasingStyle.Sine,
	Enum.EasingDirection.InOut, -1, true)
TweenService:Create(wall, info, {
	Position = wall.Position + Vector3.new(0, 0, 20)
}):Play()`,
          where: "Workspace > MovingWall > Script",
          tip: "Стена должна быть Anchored, иначе она упадёт."
        },
        {
          t: "order",
          q: "Собери функцию лавы",
          lines: [
            "local function setupLava(part)",
            "\tpart.Touched:Connect(function(hit)",
            "\t\tlocal h = hit.Parent:FindFirstChildOfClass(\"Humanoid\")",
            "\t\tif h then h.Health = 0 end",
            "\tend)",
            "end"
          ]
        },
        {
          t: "studio",
          title: "Построй первую часть обби",
          steps: [
            "Расставь 6–8 платформ с промежутками, чтобы через них надо было прыгать.",
            "Сделай 3 красных блока лавы и повесь на них тег `Lava`. Добавь скрипт «Obby».",
            "Сделай одну исчезающую платформу и одну движущуюся стену."
          ],
          result: "короткая полоса препятствий, на которой можно проиграть."
        }
      ]
    },
    {
      id: "gm-obby2",
      title: "Обби: чекпоинты",
      sub: "Игрок возрождается на последнем пройденном этапе",
      icon: "🚩",
      slides: [
        {
          t: "info",
          title: "Как устроены чекпоинты",
          text: "Сделаем папку `Checkpoints` с деталями, названными **числами**: 1, 2, 3... Номер детали — номер этапа.",
          tree: L`⚙️ Workspace
  📁 **Checkpoints**
    🧱 1 — старт
    🧱 2
    🧱 3`,
          tip: "Чекпоинты — обычные Anchored-детали. Покрась их в зелёный, чтобы было видно."
        },
        {
          t: "info",
          title: "Этап в таблице очков",
          code: L`local Players = game:GetService("Players")
local checkpoints = workspace:WaitForChild("Checkpoints")

Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local stage = Instance.new("IntValue")
	stage.Name = "Stage"
	stage.Value = 1
	stage.Parent = stats
	stats.Parent = player
end)`,
          where: "ServerScriptService > Script «Checkpoints»"
        },
        {
          t: "info",
          title: "Касание чекпоинта",
          text: "Касаешься чекпоинта с бо́льшим номером — этап растёт. Назад не откатывает.",
          code: L`for _, cp in checkpoints:GetChildren() do
	cp.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end
		local stage = player.leaderstats.Stage
		local number = tonumber(cp.Name)
		if number and number > stage.Value then
			stage.Value = number
		end
	end)
end`
        },
        {
          t: "choice",
          q: "Зачем `tonumber(cp.Name)`?",
          opts: ["Имя детали — текст «2», а сравнивать нужно числа", "Чтобы переименовать деталь", "Чтобы удалить чекпоинт"],
          a: 0
        },
        {
          t: "choice",
          q: "Игрок на этапе 5 коснулся чекпоинта 3. Что будет?",
          opts: ["Ничего: 3 не больше 5", "Этап станет 3", "Ошибка"],
          a: 0
        },
        {
          t: "info",
          title: "Возрождаем на своём этапе",
          text: "Когда появляется персонаж, переносим его на чекпоинт с номером его этапа:",
          code: L`player.CharacterAdded:Connect(function(character)
	character:WaitForChild("HumanoidRootPart")
	task.wait(0.1)
	local cp = checkpoints:FindFirstChild(tostring(stage.Value))
	if cp then
		character:PivotTo(cp.CFrame + Vector3.new(0, 4, 0))
	end
end)`,
          after: "Этот код вставляется внутрь PlayerAdded, сразу после создания `stage`."
        },
        {
          t: "fill",
          q: "Найди чекпоинт по номеру этапа",
          code: L`local cp = checkpoints:FindFirstChild(___(stage.Value))`,
          bank: ["tostring", "tonumber", "print"],
          a: ["tostring"],
          why: "Имена объектов — текст, поэтому число этапа превращаем в текст."
        },
        {
          t: "input",
          q: "Игрок коснулся чекпоинтов по очереди: 2, 4, 3. Какой у него этап?",
          a: ["4"],
          why: "Этап растёт только вперёд: 3 меньше 4, и он не засчитывается."
        },
        {
          t: "studio",
          title: "Добавь чекпоинты",
          steps: [
            "Создай папку `Checkpoints` в Workspace и 3–4 зелёные детали с именами 1, 2, 3...",
            "Поставь деталь «1» на старте, остальные — по ходу обби.",
            "Собери скрипт «Checkpoints» из кусочков урока.",
            "Дойди до чекпоинта 2 и прыгни в лаву."
          ],
          result: "после смерти ты появляешься на чекпоинте 2, а в таблице Stage = 2."
        }
      ]
    },
    {
      id: "gm-obby3",
      title: "Обби: финиш и таймер",
      sub: "Считаем время прохождения и победы",
      icon: "🏁",
      slides: [
        {
          t: "info",
          title: "Засекаем время",
          text: "`os.clock()` — сколько секунд прошло с какого-то момента. Запомним его при входе, а на финише вычтем:",
          code: L`local startTime = os.clock()
-- ... прошло время ...
local seconds = os.clock() - startTime`
        },
        {
          t: "input",
          q: "Старт был на 100-й секунде, финиш на 145-й. Сколько секунд шёл игрок?",
          a: ["45"]
        },
        {
          t: "info",
          title: "Скрипт финиша",
          code: L`local Players = game:GetService("Players")
local finish = workspace:WaitForChild("Finish")
local startTimes = {}
local finished = {}

Players.PlayerAdded:Connect(function(player)
	startTimes[player] = os.clock()
end)
Players.PlayerRemoving:Connect(function(player)
	startTimes[player] = nil
	finished[player] = nil
end)

finish.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or finished[player] then return end
	finished[player] = true
	local seconds = math.floor(os.clock() - startTimes[player])
	print(player.Name .. " прошёл обби за " .. seconds .. " сек!")
end)`,
          where: "ServerScriptService > Script «Finish»"
        },
        {
          t: "choice",
          q: "Зачем таблица `finished`?",
          opts: ["Чтобы финиш засчитался один раз, а не при каждом шаге", "Чтобы сохранить время навсегда", "Чтобы игрок не мог выйти"],
          a: 0
        },
        {
          t: "choice",
          q: "Зачем очищать таблицы в PlayerRemoving?",
          opts: ["Чтобы данные вышедших игроков не копились", "Чтобы сохранить время", "Без этого финиш не сработает"],
          a: 0
        },
        {
          t: "order",
          q: "Собери начало обработчика финиша",
          given: L`finish.Touched:Connect(function(hit)`,
          lines: [
            "\tlocal player = Players:GetPlayerFromCharacter(hit.Parent)",
            "\tif not player or finished[player] then return end",
            "\tfinished[player] = true",
            "end)"
          ]
        },
        {
          t: "studio",
          title: "Финиш и победы",
          steps: [
            "Сделай в конце обби золотую деталь `Finish`.",
            "Добавь скрипт «Finish».",
            "Бонус: добавь в leaderstats `Wins` и прибавляй 1 на финише."
          ],
          result: "на финише в Output появляется твоё время."
        }
      ]
    },
    {
      id: "gm-sim1",
      title: "Симулятор: монеты за клик",
      sub: "Кнопка на экране и честный подсчёт на сервере",
      icon: "🪙",
      ref: "project-simulator",
      slides: [
        {
          t: "info",
          title: "План симулятора",
          text: [
            "1️⃣ Кнопка «Клик» даёт монеты (этот урок).",
            "2️⃣ Магазин множителей.",
            "3️⃣ Сохранение прогресса."
          ],
          tree: L`⚙️ ReplicatedStorage
  📡 **ClickEvent** — RemoteEvent
⚙️ ServerScriptService
  📜 **SimServer**
⚙️ StarterGui
  🖼️ SimGui
    🔘 ClickButton
    🖥️ **SimClient**`
        },
        {
          t: "info",
          title: "Клиент: только просит",
          code: L`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local clickEvent = ReplicatedStorage:WaitForChild("ClickEvent")
local button = script.Parent:WaitForChild("ClickButton")

button.Activated:Connect(function()
	clickEvent:FireServer()
end)`,
          where: "StarterGui > SimGui > LocalScript «SimClient»"
        },
        {
          t: "info",
          title: "Сервер: считает и защищает",
          code: L`local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local clickEvent = ReplicatedStorage.ClickEvent
local lastClick = {}

Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
	stats.Parent = player
end)

clickEvent.OnServerEvent:Connect(function(player)
	local now = os.clock()
	if lastClick[player] and now - lastClick[player] < 0.1 then
		return -- больше 10 кликов в секунду — автокликер
	end
	lastClick[player] = now
	local mult = player:GetAttribute("Multiplier") or 1
	player.leaderstats.Coins.Value += mult
end)`,
          where: "ServerScriptService > Script «SimServer»"
        },
        {
          t: "choice",
          q: "Почему клиент шлёт «я кликнул», а не «дай мне 100 монет»?",
          opts: ["Иначе читер пришлёт миллион", "Так меньше кода", "RemoteEvent не передаёт числа"],
          a: 0
        },
        {
          t: "choice",
          q: "Что делает проверка `now - lastClick[player] < 0.1`?",
          opts: ["Не засчитывает клики чаще 10 раз в секунду", "Ускоряет клики", "Сохраняет монеты"],
          a: 0
        },
        {
          t: "fill",
          q: "Отправь клик на сервер",
          code: L`button.___:Connect(function()
	clickEvent:___()
end)`,
          bank: ["Activated", "FireServer", "Touched", "OnServerEvent"],
          a: ["Activated", "FireServer"]
        },
        {
          t: "input",
          q: "Множитель игрока 3. Он кликнул 5 раз. Сколько монет получит?",
          a: ["15"]
        },
        {
          t: "studio",
          title: "Собери кликер",
          steps: [
            "В ReplicatedStorage создай RemoteEvent `ClickEvent`.",
            "Сделай ScreenGui `SimGui` с большой кнопкой `ClickButton` и LocalScript «SimClient».",
            "В ServerScriptService добавь Script «SimServer».",
            "Запусти и покликай."
          ],
          result: "каждый клик добавляет монету в таблице справа вверху."
        }
      ]
    },
    {
      id: "gm-sim2",
      title: "Симулятор: магазин",
      sub: "Улучшения-множители с проверкой на сервере",
      icon: "🛒",
      ref: "project-simulator",
      slides: [
        {
          t: "info",
          title: "Цены — в модуле",
          code: L`local Config = {}
Config.Upgrades = {
	Gloves = {price = 50, mult = 2},
	Robot = {price = 500, mult = 5},
}
return Config`,
          where: "ReplicatedStorage > ModuleScript «Config»",
          after: "Модуль видят и клиент (покажет цены), и сервер (проверит покупку)."
        },
        {
          t: "info",
          title: "Сервер продаёт",
          code: L`local Config = require(ReplicatedStorage.Config)
local buy = ReplicatedStorage.BuyUpgrade -- RemoteFunction

buy.OnServerInvoke = function(player, name)
	if typeof(name) ~= "string" then return false, "Ошибка" end
	local upgrade = Config.Upgrades[name]
	if not upgrade then return false, "Нет такого" end
	if player:GetAttribute(name) then return false, "Уже куплено" end
	local coins = player.leaderstats.Coins
	if coins.Value < upgrade.price then return false, "Мало монет" end

	coins.Value -= upgrade.price
	player:SetAttribute(name, true)
	local mult = player:GetAttribute("Multiplier") or 1
	player:SetAttribute("Multiplier", mult * upgrade.mult)
	return true, "Куплено!"
end`,
          where: "ServerScriptService > Script «SimServer» (дописать)"
        },
        {
          t: "choice",
          q: "Читер вызывает покупку «Robot», имея 10 монет. Что будет?",
          opts: ["Ответ «Мало монет»", "Купит робота", "Монеты уйдут в минус"],
          a: 0
        },
        {
          t: "order",
          q: "Расставь проверки покупки по порядку",
          given: L`buy.OnServerInvoke = function(player, name)`,
          lines: [
            "\tlocal upgrade = Config.Upgrades[name]",
            "\tif not upgrade then return false end",
            "\tif coins.Value < upgrade.price then return false end",
            "\tcoins.Value -= upgrade.price",
            "end"
          ]
        },
        {
          t: "info",
          title: "Клиент покупает",
          code: L`local buy = ReplicatedStorage:WaitForChild("BuyUpgrade")

gui.GlovesButton.Activated:Connect(function()
	local ok, message = buy:InvokeServer("Gloves")
	gui.MessageLabel.Text = message
end)`,
          where: "StarterGui > SimGui > LocalScript «SimClient» (дописать)"
        },
        {
          t: "choice",
          q: "Почему покупка через RemoteFunction, а не RemoteEvent?",
          opts: ["Клиент получает ответ и показывает сообщение", "RemoteEvent не работает с кнопками", "Так быстрее"],
          a: 0
        },
        {
          t: "choice",
          q: "Куплены Gloves (×2) и Robot (×5). Какой множитель?",
          opts: ["10", "7", "5"],
          a: 0,
          why: "Множители перемножаются: 1 × 2 × 5 = 10."
        },
        {
          t: "studio",
          title: "Добавь магазин",
          steps: [
            "В ReplicatedStorage создай ModuleScript «Config» и **RemoteFunction** `BuyUpgrade`.",
            "Допиши серверную часть в SimServer.",
            "Добавь в SimGui кнопку `GlovesButton` и надпись `MessageLabel`, допиши SimClient."
          ],
          result: "за 50 монет покупаются перчатки, и клик даёт уже по 2."
        }
      ]
    },
    {
      id: "gm-sim3",
      title: "Симулятор: сохранение",
      sub: "Монеты и покупки остаются после выхода",
      icon: "💾",
      ref: "project-simulator",
      slides: [
        {
          t: "info",
          title: "Что сохраняем",
          code: L`local data = {
	coins = 1200,
	owned = {"Gloves"}, -- названия купленного
}`,
          after: "Множитель не сохраняем: его легко пересчитать по купленным улучшениям."
        },
        {
          t: "info",
          title: "Сохранение при выходе",
          code: L`local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("SimData")

local function save(player)
	local owned = {}
	for name in Config.Upgrades do
		if player:GetAttribute(name) then
			table.insert(owned, name)
		end
	end
	local data = {coins = player.leaderstats.Coins.Value, owned = owned}
	pcall(function()
		store:SetAsync("Player_" .. player.UserId, data)
	end)
end

Players.PlayerRemoving:Connect(save)`,
          where: "ServerScriptService > Script «SimServer» (дописать)"
        },
        {
          t: "choice",
          q: "Почему сохраняем названия улучшений, а не множитель?",
          opts: ["Из названий множитель всегда можно пересчитать", "Множитель нельзя сохранить", "Так меньше весит"],
          a: 0
        },
        {
          t: "info",
          title: "Загрузка при входе",
          code: L`local ok, saved = pcall(function()
	return store:GetAsync("Player_" .. player.UserId)
end)
if not ok then
	player:Kick("Не удалось загрузить. Перезайди.")
	return
end
if saved then
	coins.Value = saved.coins
	local mult = 1
	for _, name in saved.owned do
		player:SetAttribute(name, true)
		mult *= Config.Upgrades[name].mult
	end
	player:SetAttribute("Multiplier", mult)
end`,
          where: "ServerScriptService > SimServer, внутри PlayerAdded после leaderstats"
        },
        {
          t: "choice",
          q: "Зачем кик, если загрузка не удалась?",
          opts: ["Чтобы пустые данные не затёрли настоящий прогресс", "Чтобы наказать игрока", "Так требует DataStore"],
          a: 0
        },
        {
          t: "fill",
          q: "Сохраняй при выходе и при закрытии сервера",
          code: L`Players.___:Connect(save)
game:___(function()
	for _, p in Players:GetPlayers() do
		save(p)
	end
end)`,
          bank: ["PlayerRemoving", "BindToClose", "PlayerAdded", "OnClose"],
          a: ["PlayerRemoving", "BindToClose"]
        },
        {
          t: "choice",
          q: "Что делаем с Multiplier при загрузке?",
          opts: ["Пересчитываем по купленным улучшениям", "Загружаем из DataStore отдельно", "Ставим 1 навсегда"],
          a: 0
        },
        {
          t: "studio",
          title: "Проверь сохранение",
          steps: [
            "Включи API Services (ветка «Сохранения», урок 1).",
            "Допиши save и загрузку в SimServer.",
            "Накликай монет, купи перчатки, останови игру и запусти снова."
          ],
          result: "монеты и купленные перчатки на месте."
        }
      ]
    },
    {
      id: "gm-pvp1",
      title: "PvP: оружие",
      sub: "Tool в руках и выстрел по клику",
      icon: "🔫",
      ref: "project-pvp",
      slides: [
        {
          t: "info",
          title: "Tool — предмет в руках",
          text: [
            "**Tool** — предмет, который игрок берёт в руку: меч, бластер, фонарик.",
            "Кладём его в **StarterPack** — тогда он появится в рюкзаке после каждого возрождения."
          ],
          tree: L`⚙️ StarterPack
  🔧 **Blaster** — Tool
    🧱 Handle — деталь, за которую держат
    🖥️ BlasterClient — LocalScript
⚙️ ReplicatedStorage
  📡 FireEvent — RemoteEvent`
        },
        {
          t: "choice",
          q: "Как должна называться деталь, за которую держат Tool?",
          opts: ["Handle", "Grip", "Main"],
          a: 0
        },
        {
          t: "info",
          title: "Клиент: куда целимся",
          code: L`local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local tool = script.Parent
local fireEvent = ReplicatedStorage:WaitForChild("FireEvent")
local mouse = Players.LocalPlayer:GetMouse()

tool.Activated:Connect(function()
	fireEvent:FireServer(mouse.Hit.Position)
end)`,
          where: "StarterPack > Blaster > LocalScript «BlasterClient»",
          after: "`mouse.Hit.Position` — точка в мире под курсором. `Activated` — игрок кликнул с оружием в руке."
        },
        {
          t: "choice",
          q: "Почему LocalScript внутри Tool работает?",
          opts: ["Tool лежит в рюкзаке или в руках игрока — это его место", "Tool — особый скрипт", "Он не работает"],
          a: 0
        },
        {
          t: "fill",
          q: "Отправь точку прицела на сервер",
          code: L`tool.___:Connect(function()
	fireEvent:FireServer(mouse.Hit.___)
end)`,
          bank: ["Activated", "Position", "Touched", "Size"],
          a: ["Activated", "Position"]
        },
        {
          t: "choice",
          q: "Что клиент **не** должен присылать серверу?",
          opts: ["Кого он ранил и сколько урона", "Точку, куда целится"],
          a: 0,
          why: "Урон и попадание считает сервер, иначе читер «попадёт» в кого угодно."
        },
        {
          t: "studio",
          title: "Сделай бластер",
          steps: [
            "В StarterPack создай **Tool** `Blaster` и деталь `Handle` внутри (1×1×3, CanCollide выкл).",
            "В ReplicatedStorage создай RemoteEvent `FireEvent`.",
            "Добавь в Tool LocalScript «BlasterClient»."
          ],
          result: "бластер в руке (клавиша 1). Урона пока нет — его сделаем в следующем уроке."
        }
      ]
    },
    {
      id: "gm-pvp2",
      title: "PvP: выстрел и урон",
      sub: "Сервер проверяет выстрел и пускает луч",
      icon: "🎯",
      ref: "project-pvp",
      slides: [
        {
          t: "info",
          title: "Луч: Raycast",
          text: "Сервер пускает невидимый луч от оружия к цели. Если луч во что-то попал, мы узнаем, во что:",
          code: L`local result = workspace:Raycast(origin, direction, params)
if result then
	print("Попали в", result.Instance.Name)
end`
        },
        {
          t: "info",
          title: "Не попасть в себя",
          code: L`local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = {character}`
        },
        {
          t: "fill",
          q: "Исключи стрелка из луча",
          code: L`params.FilterType = Enum.RaycastFilterType.___
params.FilterDescendantsInstances = {___}`,
          bank: ["Exclude", "character", "Include", "workspace"],
          a: ["Exclude", "character"]
        },
        {
          t: "info",
          title: "Серверный скрипт выстрела",
          code: L`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local fireEvent = ReplicatedStorage.FireEvent
local lastShot = {}

fireEvent.OnServerEvent:Connect(function(player, target)
	if typeof(target) ~= "Vector3" then return end
	local character = player.Character
	local tool = character and character:FindFirstChild("Blaster")
	if not tool then return end -- оружие не в руках

	local now = os.clock()
	if lastShot[player] and now - lastShot[player] < 0.4 then return end
	lastShot[player] = now

	local origin = tool.Handle.Position -- откуда стреляем, решает сервер
	if (target - origin).Magnitude < 1 then return end
	local direction = (target - origin).Unit * 300

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = {character}
	local result = workspace:Raycast(origin, direction, params)
	if not result then return end

	local model = result.Instance:FindFirstAncestorOfClass("Model")
	local humanoid = model and model:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid:TakeDamage(20)
	end
end)`,
          where: "ServerScriptService > Script «Combat»"
        },
        {
          t: "match",
          q: "Соедини проверку и от чего она защищает",
          pairs: [
            ["`typeof(target)`", "Мусор вместо точки"],
            ["Поиск Blaster", "Стрельба без оружия"],
            ["`lastShot`", "Пулемёт-чит"],
            ["`origin` с сервера", "Выстрел сквозь стену"]
          ]
        },
        {
          t: "choice",
          q: "Откуда летит пуля?",
          opts: ["Из Handle оружия — это считает сервер", "Оттуда, откуда скажет клиент"],
          a: 0
        },
        {
          t: "order",
          q: "Собери начало обработчика выстрела",
          given: L`fireEvent.OnServerEvent:Connect(function(player, target)`,
          lines: [
            "\tlocal tool = player.Character:FindFirstChild(\"Blaster\")",
            "\tif not tool then return end",
            "\tlocal origin = tool.Handle.Position",
            "\tlocal direction = (target - origin).Unit * 300",
            "end)"
          ]
        },
        {
          t: "studio",
          title: "Проверь урон",
          steps: [
            "Добавь Script «Combat» в ServerScriptService.",
            "Test → Clients and Servers → 2 игрока.",
            "Одним игроком выстрели в другого."
          ],
          result: "у цели уменьшается здоровье, через 5 попаданий она погибает."
        }
      ]
    },
    {
      id: "gm-pvp3",
      title: "PvP: убийства и эффекты",
      sub: "Счёт убийств и трассеры, которые видят все",
      icon: "💥",
      ref: "project-pvp",
      slides: [
        {
          t: "info",
          title: "Кто убил: метка creator",
          text: "Перед уроном вешаем на жертву метку с именем стрелка. При смерти смотрим, чья метка.",
          code: L`local tag = Instance.new("ObjectValue")
tag.Name = "creator"
tag.Value = player
tag.Parent = humanoid
game:GetService("Debris"):AddItem(tag, 5)
humanoid:TakeDamage(20)`,
          where: "Script «Combat», вместо строки с TakeDamage"
        },
        {
          t: "info",
          title: "Счёт убийств",
          code: L`Players.PlayerAdded:Connect(function(player)
	-- leaderstats с Kills
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			local tag = humanoid:FindFirstChild("creator")
			local killer = tag and tag.Value
			if killer and killer ~= player then
				killer.leaderstats.Kills.Value += 1
			end
		end)
	end)
end)`,
          where: "ServerScriptService > Script «Combat» (дописать)"
        },
        {
          t: "choice",
          q: "Зачем метка исчезает через 5 секунд (Debris)?",
          opts: ["Если игрок умрёт позже от лавы, убийство не засчитается стрелку", "Чтобы не тормозило", "Так требует ObjectValue"],
          a: 0
        },
        {
          t: "choice",
          q: "Зачем проверка `killer ~= player`?",
          opts: ["Не давать очко за самоубийство", "Чтобы убийца не умер", "Она не нужна"],
          a: 0
        },
        {
          t: "info",
          title: "Трассер у всех",
          text: "Сервер говорит всем: «был выстрел отсюда туда». А рисует луч каждый игрок у себя:",
          code: L`-- сервер (в Combat, после Raycast)
local hitPos = result and result.Position or origin + direction
shotEvent:FireAllClients(origin, hitPos)

-- клиент
shotEvent.OnClientEvent:Connect(function(from, to)
	local beam = Instance.new("Part")
	beam.Anchored = true
	beam.CanCollide = false
	beam.Material = Enum.Material.Neon
	local length = (to - from).Magnitude
	beam.Size = Vector3.new(0.2, 0.2, length)
	beam.CFrame = CFrame.lookAt(from, to) * CFrame.new(0, 0, -length / 2)
	beam.Parent = workspace
	game:GetService("Debris"):AddItem(beam, 0.15)
end)`
        },
        {
          t: "choice",
          q: "Почему трассер рисует клиент, а не сервер?",
          opts: ["Эффекты плавнее и дешевле на клиентах", "Сервер не умеет создавать детали", "Так безопаснее"],
          a: 0
        },
        {
          t: "fill",
          q: "Расскажи всем игрокам о выстреле",
          code: L`shotEvent:___(origin, hitPos)`,
          bank: ["FireAllClients", "FireServer", "FireClient"],
          a: ["FireAllClients"]
        },
        {
          t: "info",
          title: "🎓 Ты собрал три игры!",
          text: [
            "Обби, симулятор и PvP — это основа большинства игр на Roblox.",
            "Дальше — **твоя идея**. Начни с маленькой игры и доведи её до конца. Удачи!"
          ]
        }
      ]
    }
  ]
});
