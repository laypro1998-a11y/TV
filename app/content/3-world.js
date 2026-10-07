APP_UNITS.push({
  title: "Код и игровой мир",
  desc: "Детали, позиции, события, сервисы, игроки и интерактивные объекты",
  color: "#ce82ff",
  shade: "#a568cc",
  lessons: [
    {
      id: "instances",
      title: "Объекты игры",
      icon: "🧱",
      slides: [
        {
          t: "info",
          title: "Всё в игре — Instance",
          text: "Детали, скрипты, звуки, игроки — это объекты. У каждого есть **родитель** (`Parent`) и могут быть **дети**.",
          code: L`local door = workspace.House.Door
print(door.Parent.Name) --> House
print(door.ClassName)   --> Part`
        },
        {
          t: "match",
          q: "Соедини способ поиска и его поведение",
          pairs: [
            ["`.` (точка)", "Объект точно есть"],
            ["`FindFirstChild`", "Вернёт nil, если нет"],
            ["`WaitForChild`", "Подождёт появления"],
            ["`script.Parent`", "Объект вокруг скрипта"]
          ]
        },
        {
          t: "choice",
          q: "LocalScript: дверь ещё не успела загрузиться. Как её получить?",
          opts: ["`workspace:WaitForChild(\"Door\")`", "`workspace.Door`", "`workspace:FindFirstChild(\"Door\")`"],
          a: 0,
          why: "Клиенту объекты приходят по сети не сразу. В LocalScript почти всегда используют WaitForChild."
        },
        {
          t: "info",
          title: "Создаём объект",
          text: "Сначала настраиваем свойства, а `Parent` назначаем **последним**: объект появится в мире уже готовым.",
          code: L`local part = Instance.new("Part")
part.Size = Vector3.new(10, 1, 10)
part.Anchored = true
part.Parent = workspace`,
          where: "ServerScriptService > Script"
        },
        {
          t: "order",
          q: "Создай деталь (Parent — последним!)",
          lines: ["local part = Instance.new(\"Part\")", "part.Anchored = true", "part.Parent = workspace"]
        },
        {
          t: "info",
          title: "Clone и Destroy",
          text: "Сложные объекты собирают в Studio, кладут шаблоном в **ServerStorage** и клонируют:",
          code: L`local chest = ServerStorage.Chest:Clone()
chest.Parent = workspace

task.wait(10)
chest:Destroy() -- удалить навсегда`
        },
        {
          t: "choice",
          q: "Где хранить шаблон моба, которого клонирует сервер?",
          opts: ["ServerStorage", "StarterGui", "Workspace", "StarterPlayerScripts"],
          a: 0,
          why: "ServerStorage не виден клиентам и не появляется в мире."
        },
        {
          t: "fill",
          q: "Склонируй сундук и удали его через 10 секунд",
          code: L`local chest = template:___()
chest.Parent = workspace
task.wait(10)
chest:___()`,
          bank: ["Clone", "Destroy", "Copy", "Delete", "Remove"],
          a: ["Clone", "Destroy"]
        },
        {
          t: "info",
          title: "script.Parent и атрибуты",
          text: "`script.Parent` — объект, внутри которого лежит скрипт. А свои свойства объекту дают через **атрибуты**:",
          code: L`local door = script.Parent
door:SetAttribute("IsLocked", true)
print(door:GetAttribute("IsLocked")) --> true`,
          where: "Workspace > Door > Script"
        },
        {
          t: "choice",
          q: "Скрипт лежит внутри детали Lava. Что такое `script.Parent`?",
          opts: ["Деталь Lava", "Сам скрипт", "Workspace", "nil"],
          a: 0
        },
        {
          t: "choice",
          q: "Как дать двери своё свойство IsLocked?",
          opts: ["`door:SetAttribute(\"IsLocked\", true)`", "`door.IsLocked = true`", "`door:AddProperty(\"IsLocked\")`"],
          a: 0,
          why: "Свойства IsLocked у Part нет, и `door.IsLocked = true` вызовет ошибку."
        },
        {
          t: "choice",
          q: "Что вернёт `obj:IsA(\"BasePart\")`, если obj — MeshPart?",
          opts: ["true", "false"],
          a: 0,
          why: "IsA учитывает «родство» классов: MeshPart — разновидность BasePart."
        }
      ]
    },
    {
      id: "vectors-cframe",
      title: "Позиция и поворот",
      icon: "📐",
      slides: [
        {
          t: "info",
          title: "Координаты X, Y, Z",
          text: [
            "**Y** — вверх, **X** и **Z** — по полу. Единица длины — **stud**. Персонаж ростом примерно 5 студов.",
            "Точку в мире задаёт `Vector3`:"
          ],
          code: L`part.Position = Vector3.new(0, 10, 0) -- на 10 студов вверх`
        },
        {
          t: "match",
          q: "Соедини ось и направление",
          pairs: [
            ["X", "Влево-вправо"],
            ["Y", "Вверх-вниз"],
            ["Z", "Вперёд-назад"],
            ["stud", "Единица длины"]
          ]
        },
        {
          t: "info",
          title: "Расстояние между точками",
          code: L`local distance = (a - b).Magnitude
if distance < 10 then
	print("Игрок рядом с сундуком")
end`,
          after: "`Magnitude` — длина вектора. Пригодится постоянно."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local a = Vector3.new(0, 0, 0)
local b = Vector3.new(3, 4, 0)
print((b - a).Magnitude)`,
          a: ["5"],
          why: "Треугольник 3-4-5: √(3² + 4²) = 5."
        },
        {
          t: "info",
          title: "CFrame — позиция + поворот",
          text: "Углы задаются в **радианах**, перевести градусы помогает `math.rad`:",
          code: L`part.CFrame = CFrame.new(0, 10, 0) * CFrame.Angles(0, math.rad(45), 0)`
        },
        {
          t: "fill",
          q: "Поверни деталь на 90°",
          code: L`part.CFrame *= CFrame.Angles(0, math.___(90), 0)`,
          bank: ["rad", "deg", "pi", "abs"],
          a: ["rad"]
        },
        {
          t: "info",
          title: "Умножение = «относительно себя»",
          text: "Умножение CFrame сдвигает деталь относительно **её направления**. Вперёд в Roblox — это **минус Z**.",
          code: L`part.CFrame = part.CFrame * CFrame.new(0, 0, -5) -- 5 студов вперёд`
        },
        {
          t: "choice",
          q: "Что сделает `part.CFrame * CFrame.new(0, 0, -5)`?",
          opts: ["Сдвинет на 5 вперёд по направлению детали", "Сдвинет на 5 вверх", "Повернёт на 5°"],
          a: 0
        },
        {
          t: "info",
          title: "Цвета: Color3",
          code: L`part.Color = Color3.fromRGB(255, 85, 0)  -- 0..255
part.Color = Color3.fromHSV(0.5, 1, 1)   -- оттенок по кругу`,
          after: "`Color3.new` тоже есть, но принимает числа от 0 до 1."
        },
        {
          t: "choice",
          q: "Как получить ярко-красный цвет?",
          opts: ["`Color3.fromRGB(255, 0, 0)`", "`Color3.new(255, 0, 0)`", "`Color3.fromRGB(0, 0, 255)`"],
          a: 0
        },
        {
          t: "choice",
          q: "Как телепортировать персонажа целиком?",
          opts: ["`character:PivotTo(CFrame.new(0, 10, 0))`", "`character.Position = Vector3.new(0, 10, 0)`", "`character:Teleport(0, 10, 0)`"],
          a: 0,
          why: "Персонаж — модель, у неё нет Position. Модели двигают через PivotTo."
        },
        {
          t: "match",
          q: "Соедини тип и что он хранит",
          pairs: [
            ["Vector3", "Точка в 3D"],
            ["CFrame", "Позиция и поворот"],
            ["Color3", "Цвет"],
            ["UDim2", "Размер интерфейса"]
          ]
        }
      ]
    },
    {
      id: "events",
      title: "События и Touched",
      icon: "⚡",
      slides: [
        {
          t: "info",
          title: "Событие — «когда случится, сделай»",
          code: L`local part = script.Parent

part.Touched:Connect(function(otherPart)
	print(otherPart.Name, "коснулся меня")
end)`,
          where: "Workspace > Part > Script",
          after: "Функция внутри `Connect` будет вызываться **каждый раз**, когда что-то касается детали."
        },
        {
          t: "info",
          title: "Это игрок или просто деталь?",
          text: "Персонаж — модель, в которой есть **Humanoid**. Нога лежит внутри модели, значит `otherPart.Parent` — персонаж.",
          code: L`local humanoid = otherPart.Parent:FindFirstChildOfClass("Humanoid")
if humanoid then
	print("Это персонаж!")
end`
        },
        {
          t: "order",
          q: "Собери убивающую лаву",
          lines: [
            "local lava = script.Parent",
            "lava.Touched:Connect(function(hit)",
            "\tlocal humanoid = hit.Parent:FindFirstChildOfClass(\"Humanoid\")",
            "\tif humanoid then",
            "\t\thumanoid.Health = 0",
            "\tend",
            "end)"
          ]
        },
        {
          t: "info",
          title: "Debounce — защита от спама",
          text: "Touched срабатывает **десятки раз**: от каждой части тела и при каждом шаге. Нужен флаг «сейчас нельзя»:",
          code: L`local busy = false
part.Touched:Connect(function(hit)
	if busy then return end
	busy = true
	print("Сработало один раз")
	task.wait(2)
	busy = false
end)`
        },
        {
          t: "fill",
          q: "Допиши debounce",
          code: L`local busy = false
part.Touched:Connect(function(hit)
	if ___ then return end
	busy = ___
	print("Нажато!")
	task.wait(2)
	busy = ___
end)`,
          bank: ["busy", "true", "false", "not busy", "hit"],
          a: ["busy", "true", "false"]
        },
        {
          t: "choice",
          q: "Как получить игрока (Player) по персонажу?",
          opts: ["`Players:GetPlayerFromCharacter(character)`", "`character.Player`", "`Players.LocalPlayer`"],
          a: 0,
          why: "Вернёт игрока или nil, если это NPC или просто деталь."
        },
        {
          t: "info",
          title: "Отписка и ожидание",
          code: L`local connection = part.Touched:Connect(onTouch)
connection:Disconnect()      -- больше не слушаем

part.Touched:Once(onTouch)   -- сработает один раз
local hit = part.Touched:Wait() -- скрипт ждёт касания`
        },
        {
          t: "match",
          q: "Соедини метод и что он делает",
          pairs: [
            ["`:Connect(f)`", "Каждый раз"],
            ["`:Once(f)`", "Только один раз"],
            ["`:Disconnect()`", "Отписаться"],
            ["`:Wait()`", "Ждать события"]
          ]
        },
        {
          t: "choice",
          q: "Зачем хранить кулдауны в таблице `lastUsed[player]`?",
          opts: ["Чтобы у каждого игрока был свой кулдаун", "Чтобы сохранять данные навсегда", "Чтобы Touched работал быстрее"],
          a: 0,
          why: "Один общий флаг заблокировал бы бонус для всех игроков сразу."
        },
        {
          t: "choice",
          q: "Как обработать детали, которые добавят в папку позже?",
          opts: ["`folder.ChildAdded:Connect(setup)`", "Перезапустить скрипт", "`folder.Changed:Connect(setup)`"],
          a: 0
        },
        {
          t: "choice",
          q: "Что не так в этой строке?",
          code: L`part.Touched:Connect(onTouched())`,
          opts: ["Скобки: функция вызовется сразу, а в Connect попадёт nil", "Нужна точка вместо двоеточия", "Всё правильно"],
          a: 0
        }
      ]
    },
    {
      id: "services-task",
      title: "Сервисы и task",
      icon: "⏱️",
      slides: [
        {
          t: "info",
          title: "Сервисы",
          text: "Сервисы — встроенные системы Roblox. Получай их в начале скрипта:",
          code: L`local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")`
        },
        {
          t: "match",
          q: "Соедини сервис и его задачу",
          pairs: [
            ["Players", "Игроки"],
            ["TweenService", "Плавная анимация"],
            ["DataStoreService", "Сохранения"],
            ["UserInputService", "Клавиатура и мышь"]
          ]
        },
        {
          t: "info",
          title: "task: время и параллельность",
          code: L`task.wait(2)              -- пауза 2 секунды
task.spawn(function()     -- запустить параллельно
	while true do
		task.wait(1)
	end
end)
task.delay(5, function()  -- сделать через 5 секунд
	print("Прошло 5 секунд")
end)`
        },
        {
          t: "choice",
          q: "В скрипте два бесконечных цикла. Как запустить оба?",
          opts: ["Обернуть первый в `task.spawn`", "Просто написать их рядом", "Заменить на `repeat`"],
          a: 0,
          why: "Без spawn скрипт навсегда застрянет в первом цикле."
        },
        {
          t: "choice",
          q: "В каком порядке появятся буквы?",
          code: L`task.delay(3, function()
	print("B")
end)
print("A")`,
          opts: ["A, а через 3 секунды B", "B, потом A", "Только A"],
          a: 0,
          why: "`task.delay` не останавливает скрипт."
        },
        {
          t: "info",
          title: "Каждый кадр: Heartbeat",
          text: "`dt` — сколько секунд прошло с прошлого кадра. Умножаем скорость на dt, чтобы она не зависела от FPS.",
          code: L`RunService.Heartbeat:Connect(function(dt)
	part.CFrame *= CFrame.Angles(0, math.rad(90 * dt), 0) -- 90° в секунду
end)`
        },
        {
          t: "fill",
          q: "Вращай деталь каждый кадр",
          code: L`RunService.___:Connect(function(dt)
	part.CFrame *= CFrame.Angles(0, math.rad(90 * ___), 0)
end)`,
          bank: ["Heartbeat", "dt", "Touched", "1", "wait"],
          a: ["Heartbeat", "dt"]
        },
        {
          t: "choice",
          q: "Какое событие есть **только** на клиенте?",
          opts: ["RenderStepped", "Heartbeat", "Stepped"],
          a: 0,
          why: "Отрисовки на сервере нет."
        },
        {
          t: "info",
          title: "Удалить через время: Debris",
          code: L`local Debris = game:GetService("Debris")
Debris:AddItem(part, 5) -- удалится через 5 секунд`
        },
        {
          t: "input",
          q: "Как называется сервис, который удаляет объект через N секунд?",
          a: ["Debris"]
        }
      ]
    },
    {
      id: "players-characters",
      title: "Игроки и leaderstats",
      icon: "🧍",
      slides: [
        {
          t: "info",
          title: "Player и Character — разные вещи",
          text: [
            "**Player** — аккаунт игрока на сервере: ник, UserId, команда. Живёт всю сессию.",
            "**Character** — 3D-модель в мире. Пересоздаётся **после каждой смерти**."
          ]
        },
        {
          t: "match",
          q: "Соедини понятие и описание",
          pairs: [
            ["Player", "Аккаунт на сервере"],
            ["Character", "Модель в мире"],
            ["Humanoid", "Здоровье и скорость"],
            ["UserId", "Номер игрока навсегда"]
          ]
        },
        {
          t: "info",
          title: "Вход и появление",
          code: L`Players.PlayerAdded:Connect(function(player)
	print(player.Name, "зашёл")
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.WalkSpeed = 24
	end)
end)`,
          where: "ServerScriptService > Script"
        },
        {
          t: "order",
          q: "Собери обработчик появления персонажа",
          lines: [
            "Players.PlayerAdded:Connect(function(player)",
            "\tplayer.CharacterAdded:Connect(function(character)",
            "\t\tprint(character.Name, \"появился\")",
            "\tend)",
            "end)"
          ]
        },
        {
          t: "info",
          title: "leaderstats — таблица очков",
          text: "Папка с именем **ровно** `leaderstats` внутри Player — и Roblox сам покажет очки справа вверху:",
          code: L`local stats = Instance.new("Folder")
stats.Name = "leaderstats"
stats.Parent = player

local coins = Instance.new("IntValue")
coins.Name = "Coins"
coins.Parent = stats`
        },
        {
          t: "fill",
          q: "Создай таблицу очков",
          code: L`local stats = Instance.new("Folder")
stats.Name = "___"
stats.Parent = player
local coins = Instance.new("___")
coins.Name = "Coins"
coins.Parent = stats`,
          bank: ["leaderstats", "Leaderstats", "IntValue", "Part", "stats"],
          a: ["leaderstats", "IntValue"],
          why: "Имя строго `leaderstats` с маленькой буквы, а число хранит IntValue."
        },
        {
          t: "choice",
          q: "Где менять `Coins.Value`, чтобы изменение увидели все?",
          opts: ["В Script на сервере", "В LocalScript", "В модуле на клиенте"],
          a: 0
        },
        {
          t: "choice",
          q: "Что использовать как ключ для сохранения данных игрока?",
          opts: ["`player.UserId`", "`player.Name`", "`player.DisplayName`"],
          a: 0,
          why: "Ник можно поменять, а UserId — никогда."
        },
        {
          t: "match",
          q: "Соедини свойство Humanoid и смысл",
          pairs: [
            ["WalkSpeed", "Скорость ходьбы"],
            ["JumpPower", "Сила прыжка"],
            ["Health", "Здоровье"],
            ["Died", "Событие смерти"]
          ]
        },
        {
          t: "choice",
          q: "Какая обычная скорость ходьбы в Roblox?",
          opts: ["16", "50", "100", "10"],
          a: 0
        },
        {
          t: "choice",
          q: "Почему настройки персонажа задают в CharacterAdded, а не в PlayerAdded?",
          opts: ["После смерти появляется новый персонаж с настройками по умолчанию", "PlayerAdded не работает на сервере", "Так короче"],
          a: 0
        }
      ]
    },
    {
      id: "interaction",
      title: "Клик, «Нажми E» и анимация",
      icon: "🚪",
      slides: [
        {
          t: "info",
          title: "ClickDetector — клик по детали",
          code: L`local clickDetector = script.Parent.ClickDetector

clickDetector.MouseClick:Connect(function(player)
	print(player.Name, "нажал кнопку")
end)`,
          where: "Workspace > Button > Script"
        },
        {
          t: "info",
          title: "ProximityPrompt — «Нажми E»",
          text: "Работает на ПК, телефоне и консоли. Вставь в деталь **ProximityPrompt**:",
          code: L`local prompt = script.Parent.ProximityPrompt
prompt.ActionText = "Открыть"
prompt.HoldDuration = 1 -- держать секунду

prompt.Triggered:Connect(function(player)
	print(player.Name, "открыл сундук")
end)`
        },
        {
          t: "match",
          q: "Соедини объект и назначение",
          pairs: [
            ["ClickDetector", "Клик по детали"],
            ["ProximityPrompt", "«Нажми E»"],
            ["TweenService", "Плавное движение"],
            ["Sound", "Звук"]
          ]
        },
        {
          t: "fill",
          q: "Отреагируй на «Нажми E»",
          code: L`prompt.___:Connect(function(player)
	print(player.Name, "открыл сундук")
end)`,
          bank: ["Triggered", "MouseClick", "Touched", "Activated"],
          a: ["Triggered"]
        },
        {
          t: "info",
          title: "TweenService — плавная анимация",
          text: "Обычное присваивание телепортирует. Твин плавно меняет свойства за заданное время:",
          code: L`local info = TweenInfo.new(2)
local tween = TweenService:Create(door, info, {
	Position = door.Position + Vector3.new(0, 10, 0),
})
tween:Play()`
        },
        {
          t: "order",
          q: "Собери плавное исчезновение двери",
          lines: [
            "local info = TweenInfo.new(1)",
            "local tween = TweenService:Create(door, info, {Transparency = 1})",
            "tween:Play()"
          ]
        },
        {
          t: "choice",
          q: "Как сделать твин бесконечным туда-обратно?",
          opts: [
            "`TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)`",
            "`tween:Play(true)`",
            "`tween.Looped = true`"
          ],
          a: 0,
          why: "-1 — бесконечные повторы, true — возвращаться обратно."
        },
        {
          t: "choice",
          q: "Какие детали стоит анимировать твином?",
          opts: ["Закреплённые (Anchored)", "Любые", "Только невидимые"],
          a: 0,
          why: "У незакреплённых деталей физика будет спорить с анимацией."
        },
        {
          t: "choice",
          q: "Зачем двери флаг `isMoving`?",
          opts: ["Чтобы не запустить новую анимацию, пока идёт старая", "Чтобы играл звук", "Без него твин не работает"],
          a: 0
        },
        {
          t: "choice",
          q: "Что приходит в функцию `MouseClick` у ClickDetector?",
          opts: ["Игрок, который кликнул", "Сама деталь", "Позиция мыши"],
          a: 0
        }
      ]
    }
  ]
});
