BRANCHES.push({
  id: "gui",
  title: "Интерфейс (GUI)",
  icon: "🖼️",
  color: "#00b8a9",
  shade: "#00968a",
  level: "Средний",
  desc: "Надписи, кнопки, окна и монеты на экране. Таблички над головой",
  lessons: [
    {
      id: "g-screen",
      title: "Экран и элементы",
      sub: "ScreenGui, Frame, TextLabel, TextButton",
      icon: "🖼️",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "Из чего состоит интерфейс",
          text: [
            "🖼️ **ScreenGui** — прозрачный «холст» поверх экрана. Всё остальное кладут в него.",
            "▭ **Frame** — панель, окно.",
            "🔤 **TextLabel** — надпись. 🔘 **TextButton** — кнопка."
          ],
          tree: L`⚙️ StarterGui
  🖼️ **ScreenGui**
    🔤 CoinsLabel — TextLabel
    🔘 ShopButton — TextButton
    ▭ ShopFrame — Frame
    🖥️ LocalScript`
        },
        {
          t: "match",
          q: "Соедини элемент и что это",
          pairs: [
            ["ScreenGui", "Холст на экране"],
            ["Frame", "Панель, окно"],
            ["TextLabel", "Надпись"],
            ["TextButton", "Кнопка"]
          ]
        },
        {
          t: "info",
          title: "StarterGui → PlayerGui",
          text: [
            "Интерфейс собирают в **StarterGui**.",
            "Когда игрок появляется, Roblox **копирует** всё оттуда к нему в **PlayerGui**. Он видит и нажимает именно копию."
          ]
        },
        {
          t: "choice",
          q: "Какой скрипт управляет кнопками на экране?",
          opts: ["LocalScript", "Script", "ModuleScript сам по себе"],
          a: 0,
          why: "Экран — это клиент игрока. Script в StarterGui не работает."
        },
        {
          t: "choice",
          q: "Куда обычно кладут LocalScript для интерфейса?",
          opts: ["Внутрь ScreenGui", "В ServerScriptService", "В Workspace"],
          a: 0
        },
        {
          t: "info",
          title: "ResetOnSpawn",
          text: "У ScreenGui есть галочка **ResetOnSpawn**. Если она включена, после смерти интерфейс создаётся заново, и открытые окна закрываются.",
          tip: "Для меню и магазинов ставь ResetOnSpawn = false."
        },
        {
          t: "choice",
          q: "Магазин закрывается каждый раз, когда игрок умирает. Что поменять?",
          opts: ["ResetOnSpawn = false у ScreenGui", "Перенести магазин в Workspace", "Сделать Script вместо LocalScript"],
          a: 0
        },
        {
          t: "studio",
          title: "Первая надпись",
          steps: [
            "В StarterGui нажми ⊕ → **ScreenGui**.",
            "Внутри ScreenGui нажми ⊕ → **TextLabel**.",
            "В Properties поменяй **Text** на «Привет!» и **TextScaled** включи.",
            "Запусти игру."
          ],
          result: "надпись «Привет!» в левом верхнем углу экрана."
        }
      ]
    },
    {
      id: "g-udim",
      title: "Размер и позиция",
      sub: "UDim2: чтобы на телефоне тоже было красиво",
      icon: "📐",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "UDim2 — четыре числа",
          code: L`UDim2.new(scaleX, offsetX, scaleY, offsetY)`,
          text: [
            "**Scale** — доля экрана, от 0 до 1. `0.5` — половина.",
            "**Offset** — точное число пикселей."
          ]
        },
        {
          t: "choice",
          q: "Что значит `UDim2.new(0.5, 0, 0, 100)` для размера?",
          opts: ["Половина ширины экрана, 100 пикселей высоты", "50 пикселей ширины, весь экран в высоту", "Центр экрана"],
          a: 0
        },
        {
          t: "info",
          title: "Короткие записи",
          code: L`UDim2.fromScale(0.3, 0.1) -- только доли
UDim2.fromOffset(200, 50) -- только пиксели`
        },
        {
          t: "choice",
          q: "Что займёт `UDim2.fromScale(1, 1)`?",
          opts: ["Весь экран", "1 пиксель", "Половину экрана"],
          a: 0
        },
        {
          t: "info",
          title: "Как поставить в центр",
          text: "**AnchorPoint** — точка, за которую элемент «держат». Поставь (0.5, 0.5) — это середина элемента. Потом позицию тоже в середину экрана:",
          code: L`frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.fromScale(0.5, 0.5)`
        },
        {
          t: "fill",
          q: "Поставь окно в центр экрана",
          code: L`frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.___(___, 0.5)`,
          bank: ["fromScale", "0.5", "fromOffset", "1"],
          a: ["fromScale", "0.5"]
        },
        {
          t: "choice",
          q: "Что лучше для размеров окон, чтобы они подходили под телефон?",
          opts: ["Scale", "Offset"],
          a: 0,
          why: "Scale подстраивается под любой экран, а 500 пикселей на телефоне могут не влезть."
        },
        {
          t: "match",
          q: "Соедини запись и смысл",
          pairs: [
            ["Scale", "Доля экрана"],
            ["Offset", "Пиксели"],
            ["AnchorPoint", "Точка опоры"]
          ]
        }
      ]
    },
    {
      id: "g-buttons",
      title: "Кнопки",
      sub: "Activated и открытие окон",
      icon: "🔘",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "Нажатие кнопки",
          code: L`local button = script.Parent.MyButton

button.Activated:Connect(function()
	print("Кнопку нажали!")
end)`,
          where: "StarterGui > ScreenGui > LocalScript",
          after: "`Activated` срабатывает и от мыши, и от пальца на телефоне."
        },
        {
          t: "fill",
          q: "Отреагируй на нажатие кнопки",
          code: L`button.___:Connect(function()
	print("Нажато!")
end)`,
          bank: ["Activated", "Touched", "Triggered", "MouseClick"],
          a: ["Activated"]
        },
        {
          t: "info",
          title: "Открыть и закрыть окно",
          text: "Свойство **Visible** прячет и показывает элемент. `not` переворачивает: было видно — спрячем, и наоборот.",
          code: L`shopButton.Activated:Connect(function()
	shopFrame.Visible = not shopFrame.Visible
end)`
        },
        {
          t: "order",
          q: "Собери кнопку, которая открывает и закрывает магазин",
          given: L`local shopButton = script.Parent.ShopButton
local shopFrame = script.Parent.ShopFrame`,
          lines: [
            "shopButton.Activated:Connect(function()",
            "\tshopFrame.Visible = not shopFrame.Visible",
            "end)"
          ]
        },
        {
          t: "info",
          title: "Счётчик кликов",
          code: L`local count = 0
button.Activated:Connect(function()
	count += 1
	label.Text = "Кликов: " .. count
end)`
        },
        {
          t: "input",
          q: "Игрок нажал кнопку-счётчик 3 раза. Что написано на надписи?",
          a: ["Кликов: 3"]
        },
        {
          t: "choice",
          q: "Окно открыто (`Visible = true`). Что будет после `frame.Visible = not frame.Visible`?",
          opts: ["Окно спрячется", "Окно останется", "Ошибка"],
          a: 0
        },
        {
          t: "studio",
          title: "Кнопка-счётчик",
          steps: [
            "В ScreenGui добавь **TextButton** (назови `MyButton`) и **TextLabel** (`CountLabel`).",
            "Добавь в ScreenGui **LocalScript** с кодом ниже.",
            "Запусти и пощёлкай."
          ],
          code: L`local gui = script.Parent
local button = gui.MyButton
local label = gui.CountLabel
local count = 0
button.Activated:Connect(function()
	count += 1
	label.Text = "Кликов: " .. count
end)`,
          where: "StarterGui > ScreenGui > LocalScript",
          result: "число на надписи растёт при каждом клике."
        }
      ]
    },
    {
      id: "g-coins",
      title: "Монеты на экране",
      sub: "Показываем данные, которые меняет сервер",
      icon: "💰",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "Кто меняет, кто показывает",
          text: [
            "📜 **Сервер** меняет монеты в leaderstats.",
            "🖥️ **Клиент** только **показывает** их на экране.",
            "Изменения сервера сами приходят к игроку, а мы ловим их событием **Changed**."
          ]
        },
        {
          t: "info",
          title: "Changed — значение поменялось",
          code: L`local player = game.Players.LocalPlayer
local coins = player:WaitForChild("leaderstats"):WaitForChild("Coins")
local label = script.Parent.CoinsLabel

local function update()
	label.Text = "💰 " .. coins.Value
end
update()                      -- показать сразу
coins.Changed:Connect(update) -- и при каждом изменении`,
          where: "StarterGui > ScreenGui > LocalScript"
        },
        {
          t: "fill",
          q: "Обновляй надпись, когда меняются монеты",
          code: L`coins.___:Connect(update)`,
          bank: ["Changed", "Touched", "Activated", "Updated"],
          a: ["Changed"]
        },
        {
          t: "order",
          q: "Собери обновление надписи",
          lines: [
            "local function update()",
            "\tlabel.Text = \"Монеты: \" .. coins.Value",
            "end",
            "coins.Changed:Connect(update)"
          ]
        },
        {
          t: "choice",
          q: "Почему лучше Changed, а не проверка в цикле каждую секунду?",
          opts: ["Changed срабатывает сразу и только когда нужно", "Цикл не работает в LocalScript", "Changed работает на сервере"],
          a: 0
        },
        {
          t: "choice",
          q: "Где нужно менять монеты, чтобы они не «пропали»?",
          opts: ["На сервере, в Script", "В LocalScript с надписью"],
          a: 0
        },
        {
          t: "info",
          title: "Красивые большие числа",
          code: L`local function short(n)
	if n >= 1000000 then
		return string.format("%.1fM", n / 1000000)
	elseif n >= 1000 then
		return string.format("%.1fK", n / 1000)
	end
	return tostring(n)
end
print(short(1500)) --> 1.5K`
        },
        {
          t: "input",
          q: "Что вернёт `short(2500)` из кода выше?",
          a: ["2.5K"]
        }
      ]
    },
    {
      id: "g-windows",
      title: "Окна и анимация",
      sub: "Красивые меню: углы, списки, плавное появление",
      icon: "🪟",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "Украшения для интерфейса",
          text: "Положи внутрь элемента специальные объекты, и он изменится без кода:",
          tree: L`▭ ShopFrame
  🔹 **UICorner** — скруглить углы
  🔹 **UIStroke** — обводка
  🔹 **UIListLayout** — выстроить в список
  🔹 **UIPadding** — отступы внутри`
        },
        {
          t: "match",
          q: "Соедини объект и что он делает",
          pairs: [
            ["UICorner", "Скруглённые углы"],
            ["UIStroke", "Обводка"],
            ["UIListLayout", "Список по порядку"],
            ["UIPadding", "Отступы"]
          ]
        },
        {
          t: "choice",
          q: "Кнопки в магазине налезают друг на друга. Что добавить в окно?",
          opts: ["UIListLayout", "UICorner", "PointLight"],
          a: 0
        },
        {
          t: "info",
          title: "Плавное появление окна",
          text: "Tween работает и с интерфейсом. Выдвигаем окно снизу:",
          code: L`local TweenService = game:GetService("TweenService")
frame.Position = UDim2.fromScale(0.5, 1.5) -- спрятано внизу
frame.Visible = true
TweenService:Create(frame, TweenInfo.new(0.4), {
	Position = UDim2.fromScale(0.5, 0.5)
}):Play()`
        },
        {
          t: "fill",
          q: "Плавно передвинь окно в центр",
          code: L`TweenService:Create(frame, TweenInfo.new(0.4), {
	___ = UDim2.fromScale(0.5, 0.5)
}):___()`,
          bank: ["Position", "Play", "Size", "Start"],
          a: ["Position", "Play"]
        },
        {
          t: "choice",
          q: "Чем окно с Tween лучше, чем просто `Visible = true`?",
          opts: ["Появляется плавно, игре приятнее", "Работает быстрее", "Видно другим игрокам"],
          a: 0
        },
        {
          t: "studio",
          title: "Красивое окно",
          steps: [
            "Создай Frame в ScreenGui и добавь в него **UICorner** и **UIStroke**.",
            "Положи внутрь 3 кнопки и **UIListLayout**.",
            "Посмотри, как кнопки сами выстроились."
          ],
          result: "окно со скруглёнными углами и аккуратным списком кнопок."
        }
      ]
    },
    {
      id: "g-billboard",
      title: "Надписи в мире",
      sub: "BillboardGui над головой и SurfaceGui на стене",
      icon: "🏷️",
      ref: "gui",
      slides: [
        {
          t: "info",
          title: "Интерфейс бывает и в 3D",
          text: [
            "🖼️ **ScreenGui** — на экране игрока.",
            "🏷️ **BillboardGui** — висит над деталью и всегда смотрит в камеру. Ники, здоровье врагов.",
            "🪧 **SurfaceGui** — нарисован на поверхности детали. Табло, экран, вывеска."
          ]
        },
        {
          t: "match",
          q: "Соедини вид интерфейса и где он",
          pairs: [
            ["ScreenGui", "На экране"],
            ["BillboardGui", "Над объектом"],
            ["SurfaceGui", "На стене детали"]
          ]
        },
        {
          t: "choice",
          q: "Надпись «Торговец» над головой NPC — это...",
          opts: ["BillboardGui", "ScreenGui", "SurfaceGui"],
          a: 0
        },
        {
          t: "info",
          title: "Надпись над головой",
          code: L`local board = Instance.new("BillboardGui")
board.Size = UDim2.fromOffset(200, 50)
board.StudsOffset = Vector3.new(0, 3, 0) -- на 3 студа выше
board.Parent = npc.Head

local label = Instance.new("TextLabel")
label.Size = UDim2.fromScale(1, 1)
label.BackgroundTransparency = 1
label.Text = "Торговец"
label.Parent = board`,
          where: "ServerScriptService > Script"
        },
        {
          t: "fill",
          q: "Подними надпись на 3 студа над головой",
          code: L`board.___ = Vector3.new(0, 3, 0)`,
          bank: ["StudsOffset", "Position", "Height"],
          a: ["StudsOffset"]
        },
        {
          t: "choice",
          q: "BillboardGui создал сервер. Кто его увидит?",
          opts: ["Все игроки", "Только один игрок"],
          a: 0
        },
        {
          t: "studio",
          title: "Табличка над NPC",
          steps: [
            "Добавь в игру персонажа-NPC (Avatar → Rig Builder).",
            "Вставь код из урока, поменяв `npc` на путь к твоему NPC.",
            "Запусти игру и подойди."
          ],
          result: "над головой NPC висит надпись «Торговец»."
        }
      ]
    }
  ]
});
