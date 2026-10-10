BRANCHES.push({
  id: "world",
  title: "Объекты и мир",
  icon: "🌍",
  color: "#ce82ff",
  shade: "#a568cc",
  level: "Новичок",
  desc: "Находим, создаём и меняем детали: позиция, поворот, цвет, клоны",
  lessons: [
    {
      id: "w-tree",
      title: "Дерево объектов",
      sub: "Родители, дети и путь к объекту",
      icon: "🌳",
      ref: "instances",
      slides: [
        {
          t: "info",
          title: "Всё в игре — объекты",
          text: [
            "Детали, скрипты, звуки, игроки, кнопки — всё это **объекты** (в Roblox их называют Instance).",
            "Объекты вложены друг в друга, как папки на компьютере."
          ],
          tree: L`⚙️ Workspace
  🧩 House
    🧱 Door
    🧱 Roof
    📁 Windows
      🧱 Window1`
        },
        {
          t: "info",
          title: "Родитель и дети",
          text: [
            "**Parent** (родитель) — объект, внутри которого ты лежишь. У Door родитель — House.",
            "**Children** (дети) — всё, что лежит внутри. У House дети — Door, Roof и Windows."
          ]
        },
        {
          t: "choice",
          q: "Кто родитель (Parent) у объекта Window1?",
          opts: ["Windows", "House", "Workspace"],
          a: 0
        },
        {
          t: "info",
          title: "Путь через точку",
          text: "Точка значит «внутри». Так мы находим объект в коде:",
          code: L`local door = workspace.House.Door
print(door.Name)        --> Door
print(door.Parent.Name) --> House`,
          tip: "`workspace` — готовое короткое имя для сервиса Workspace."
        },
        {
          t: "fill",
          q: "Найди дверь внутри дома",
          code: L`local door = workspace.___.___`,
          bank: ["House", "Door", "Roof", "game"],
          a: ["House", "Door"]
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`print(workspace.House.Roof.Parent.Name)`,
          a: ["House"]
        },
        {
          t: "match",
          q: "Соедини свойство и смысл",
          pairs: [
            ["Name", "Имя объекта"],
            ["Parent", "Где лежит"],
            ["ClassName", "Что это за объект"]
          ]
        },
        {
          t: "choice",
          q: "Что такое `game` в коде?",
          opts: ["Самый главный объект, корень всего дерева", "Название твоей игры", "Ошибка"],
          a: 0
        }
      ]
    },
    {
      id: "w-find",
      title: "Как найти объект",
      sub: "Точка, FindFirstChild и WaitForChild",
      icon: "🔎",
      ref: "instances",
      slides: [
        {
          t: "info",
          title: "Три способа найти объект",
          text: [
            "**Точка** `workspace.Door` — когда объект **точно есть**.",
            "**FindFirstChild** — когда объекта **может не быть**. Вернёт nil вместо ошибки.",
            "**WaitForChild** — **подождёт**, пока объект появится."
          ]
        },
        {
          t: "match",
          q: "Соедини способ и поведение",
          pairs: [
            ["`.Door`", "Ошибка, если нет"],
            ["`FindFirstChild`", "Вернёт nil, если нет"],
            ["`WaitForChild`", "Подождёт"]
          ]
        },
        {
          t: "info",
          title: "FindFirstChild + if",
          code: L`local boss = workspace:FindFirstChild("Boss")
if boss then
	print("Босс тут!")
else
	print("Босса нет")
end`,
          after: "Методы объектов вызывают через **двоеточие** `:`."
        },
        {
          t: "fill",
          q: "Найди ключ, которого может не быть",
          code: L`local key = workspace:___("Key")
if key ___
	print("Ключ найден!")
end`,
          bank: ["FindFirstChild", "then", "WaitForChild", "do"],
          a: ["FindFirstChild", "then"]
        },
        {
          t: "info",
          title: "WaitForChild — для LocalScript",
          text: "Игроку объекты приходят по интернету **не сразу**. Поэтому в LocalScript почти всегда пишут WaitForChild:",
          code: L`local door = workspace:WaitForChild("Door")`,
          where: "StarterPlayerScripts > LocalScript",
          warn: "Если имя неправильное, WaitForChild будет ждать вечно, и в Output появится «Infinite yield possible»."
        },
        {
          t: "choice",
          q: "В LocalScript дверь ещё не загрузилась. Как её получить?",
          opts: ["`workspace:WaitForChild(\"Door\")`", "`workspace.Door`", "`workspace:FindFirstChild(\"Door\")`"],
          a: 0
        },
        {
          t: "info",
          title: "script.Parent",
          text: "`script` — это сам скрипт. `script.Parent` — объект, внутри которого скрипт лежит.",
          tree: L`⚙️ Workspace
  🧱 **Lava**
    📜 Script`,
          code: L`local lava = script.Parent -- это деталь Lava`,
          where: "Workspace > Lava > Script"
        },
        {
          t: "choice",
          q: "Скрипт лежит внутри детали Coin. Что такое `script.Parent`?",
          opts: ["Деталь Coin", "Сам скрипт", "Workspace"],
          a: 0
        }
      ]
    },
    {
      id: "w-props",
      title: "Свойства деталей",
      sub: "Прозрачность, твёрдость, размер и материал",
      icon: "🎛️",
      ref: "intro",
      slides: [
        {
          t: "info",
          title: "Свойства — настройки объекта",
          text: "Всё, что ты видишь в окне Properties, можно менять кодом:",
          code: L`local part = workspace.MyPart
part.Transparency = 0.5 -- полупрозрачная
part.Anchored = true    -- не падает
part.CanCollide = false -- сквозь неё можно пройти`,
          tip: "Имена свойств пишутся точно как в Properties, без пробелов."
        },
        {
          t: "match",
          q: "Соедини свойство и что оно делает",
          pairs: [
            ["Transparency", "Прозрачность"],
            ["Anchored", "Закреплена в воздухе"],
            ["CanCollide", "Твёрдая или нет"],
            ["Size", "Размер"]
          ]
        },
        {
          t: "choice",
          q: "Деталь падает вниз, когда игра запускается. Что включить?",
          opts: ["`Anchored = true`", "`CanCollide = true`", "`Transparency = 0`"],
          a: 0
        },
        {
          t: "choice",
          q: "Как сделать стену, сквозь которую можно пройти?",
          opts: ["`CanCollide = false`", "`Anchored = false`", "`Transparency = 1`"],
          a: 0,
          why: "Transparency = 1 сделает стену невидимой, но она останется твёрдой."
        },
        {
          t: "info",
          title: "Материал",
          text: "Материалы выбирают из готового списка `Enum.Material`:",
          code: L`part.Material = Enum.Material.Neon  -- светится
part.Material = Enum.Material.Glass -- стекло
part.Material = Enum.Material.Wood  -- дерево`
        },
        {
          t: "fill",
          q: "Сделай деталь светящейся",
          code: L`part.___ = Enum.Material.___`,
          bank: ["Material", "Neon", "Color", "Light"],
          a: ["Material", "Neon"]
        },
        {
          t: "input",
          q: "Какое значение Transparency делает деталь полностью невидимой?",
          a: ["1"]
        },
        {
          t: "studio",
          title: "Стена-призрак",
          steps: [
            "Добавь деталь: вкладка Home → **Part**. Назови её `GhostWall`.",
            "В ServerScriptService создай Script с кодом ниже.",
            "Запусти игру и пройди сквозь стену."
          ],
          code: L`local wall = workspace.GhostWall
wall.Anchored = true
wall.Transparency = 0.6
wall.CanCollide = false
wall.Material = Enum.Material.Neon`,
          where: "ServerScriptService > Script",
          result: "светящаяся полупрозрачная стена, сквозь которую можно пройти."
        }
      ]
    },
    {
      id: "w-create",
      title: "Создаём детали кодом",
      sub: "Instance.new и правильный порядок",
      icon: "✨",
      ref: "instances",
      slides: [
        {
          t: "info",
          title: "Instance.new — создать объект",
          code: L`local part = Instance.new("Part")
part.Size = Vector3.new(10, 1, 10)
part.Anchored = true
part.Parent = workspace`,
          where: "ServerScriptService > Script",
          after: "Пока не задан `Parent`, деталь существует, но её нет в мире."
        },
        {
          t: "choice",
          q: "Что будет, если забыть строку `part.Parent = workspace`?",
          opts: ["Деталь не появится в мире", "Будет ошибка", "Деталь упадёт"],
          a: 0
        },
        {
          t: "info",
          title: "Parent — последним",
          text: "Сначала настрой все свойства, а `Parent` поставь **в конце**. Тогда деталь появится сразу готовой."
        },
        {
          t: "order",
          q: "Создай деталь (Parent — последним!)",
          lines: ["local part = Instance.new(\"Part\")", "part.Anchored = true", "part.Parent = workspace"]
        },
        {
          t: "fill",
          q: "Создай новую деталь",
          code: L`local part = ___.new("___")`,
          bank: ["Instance", "Part", "Object", "Block"],
          a: ["Instance", "Part"]
        },
        {
          t: "info",
          title: "Не только детали",
          text: "Так создают что угодно: огонь, свет, звук, папку.",
          code: L`local fire = Instance.new("Fire")
fire.Parent = workspace.Campfire

local light = Instance.new("PointLight")
light.Range = 20
light.Parent = workspace.Campfire`
        },
        {
          t: "choice",
          q: "Где появится огонь из кода выше?",
          opts: ["На детали Campfire", "В центре мира", "Нигде"],
          a: 0,
          why: "Огонь горит на той детали, которая стала его Parent."
        },
        {
          t: "studio",
          title: "Летающая платформа",
          steps: [
            "В ServerScriptService создай Script.",
            "Вставь код и запусти игру.",
            "Найди платформу в небе и попробуй на неё запрыгнуть."
          ],
          code: L`local p = Instance.new("Part")
p.Size = Vector3.new(12, 1, 12)
p.Position = Vector3.new(0, 8, 0)
p.Anchored = true
p.BrickColor = BrickColor.new("Cyan")
p.Parent = workspace`,
          where: "ServerScriptService > Script",
          result: "голубая платформа висит над полом."
        }
      ]
    },
    {
      id: "w-clone",
      title: "Клоны и удаление",
      sub: "Clone, Destroy и шаблоны в ServerStorage",
      icon: "📑",
      ref: "instances",
      slides: [
        {
          t: "info",
          title: "Шаблоны",
          text: "Сложные объекты (сундуки, мечи, мобов) собирают в Studio руками и кладут как **шаблон** в ServerStorage. А код делает копии:",
          tree: L`⚙️ ServerStorage
  🧩 **Chest** — шаблон
⚙️ ServerScriptService
  📜 Spawner`
        },
        {
          t: "info",
          title: "Clone — копия",
          code: L`local ServerStorage = game:GetService("ServerStorage")
local chest = ServerStorage.Chest:Clone()
chest.Parent = workspace`,
          where: "ServerScriptService > Script «Spawner»"
        },
        {
          t: "choice",
          q: "Где хранить шаблон моба, которого клонирует сервер?",
          opts: ["ServerStorage", "StarterGui", "StarterPlayerScripts"],
          a: 0,
          why: "Игроки не видят ServerStorage, и шаблон не стоит в мире."
        },
        {
          t: "info",
          title: "Destroy — удалить навсегда",
          code: L`chest:Destroy()`,
          after: "После Destroy объект исчезает вместе со всем, что внутри. Вернуть его нельзя."
        },
        {
          t: "fill",
          q: "Сделай копию и удали её через 10 секунд",
          code: L`local copy = template:___()
copy.Parent = workspace
task.wait(10)
copy:___()`,
          bank: ["Clone", "Destroy", "Copy", "Delete"],
          a: ["Clone", "Destroy"]
        },
        {
          t: "order",
          q: "Возьми шаблон, сделай копию и поставь в мир",
          lines: [
            "local template = ServerStorage.Chest",
            "local chest = template:Clone()",
            "chest.Parent = workspace"
          ]
        },
        {
          t: "info",
          title: "Удалить через время: Debris",
          code: L`local Debris = game:GetService("Debris")
Debris:AddItem(part, 5) -- удалится через 5 секунд`
        },
        {
          t: "choice",
          q: "Что делает `Debris:AddItem(coin, 3)`?",
          opts: ["Удалит coin через 3 секунды", "Сделает 3 копии coin", "Добавит 3 монеты"],
          a: 0
        }
      ]
    },
    {
      id: "w-vector",
      title: "Позиция: Vector3",
      sub: "Координаты X, Y, Z и расстояние",
      icon: "📍",
      ref: "vectors-cframe",
      slides: [
        {
          t: "info",
          title: "Три оси",
          text: [
            "**X** — влево-вправо, **Y** — вверх-вниз, **Z** — вперёд-назад.",
            "Единица длины — **stud** (стад). Персонаж ростом примерно 5 студов."
          ]
        },
        {
          t: "match",
          q: "Соедини ось и направление",
          pairs: [
            ["X", "Влево-вправо"],
            ["Y", "Вверх-вниз"],
            ["Z", "Вперёд-назад"]
          ]
        },
        {
          t: "info",
          title: "Vector3 — точка в мире",
          code: L`part.Position = Vector3.new(0, 10, 0) -- на 10 вверх
part.Position += Vector3.new(5, 0, 0) -- сдвинуть на 5 вправо`
        },
        {
          t: "choice",
          q: "Как поднять деталь на 10 студов вверх?",
          opts: ["`part.Position += Vector3.new(0, 10, 0)`", "`part.Position += Vector3.new(10, 0, 0)`", "`part.Size += 10`"],
          a: 0
        },
        {
          t: "info",
          title: "Расстояние",
          text: "Расстояние между двумя точками: вычесть одну из другой и взять `.Magnitude` (длину).",
          code: L`local distance = (a - b).Magnitude
if distance < 10 then
	print("Игрок рядом!")
end`
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local a = Vector3.new(0, 0, 0)
local b = Vector3.new(3, 4, 0)
print((b - a).Magnitude)`,
          a: ["5"]
        },
        {
          t: "choice",
          q: "Как проверить, что игрок ближе 10 студов к сундуку?",
          opts: ["`(player - chest).Magnitude < 10`", "`player.Position == 10`", "`chest.Size < 10`"],
          a: 0,
          why: "Здесь player и chest — позиции (Vector3) игрока и сундука."
        },
        {
          t: "studio",
          title: "Лифт без кнопки",
          steps: [
            "Создай деталь `Elevator` и поставь Anchored.",
            "Положи внутрь неё Script с кодом ниже.",
            "Запусти игру и смотри, как деталь поднимается."
          ],
          code: L`local part = script.Parent
for i = 1, 100 do
	part.Position += Vector3.new(0, 0.2, 0)
	task.wait(0.03)
end`,
          where: "Workspace > Elevator > Script",
          result: "деталь плавно поднимается на 20 студов."
        }
      ]
    },
    {
      id: "w-cframe",
      title: "Поворот: CFrame",
      sub: "Позиция вместе с поворотом",
      icon: "🔄",
      ref: "vectors-cframe",
      slides: [
        {
          t: "info",
          title: "CFrame = где + куда смотрит",
          text: "**Vector3** — только место. **CFrame** — место и поворот вместе.",
          code: L`part.CFrame = CFrame.new(0, 10, 0)`
        },
        {
          t: "info",
          title: "Повернуть деталь",
          text: "Углы в Roblox задают в **радианах**. Градусы в радианы переводит `math.rad`:",
          code: L`part.CFrame *= CFrame.Angles(0, math.rad(90), 0)`,
          after: "Средняя цифра — поворот вокруг вертикальной оси, как волчок."
        },
        {
          t: "fill",
          q: "Поверни деталь на 45°",
          code: L`part.CFrame *= CFrame.Angles(0, math.___(45), 0)`,
          bank: ["rad", "deg", "pi", "abs"],
          a: ["rad"]
        },
        {
          t: "info",
          title: "Вперёд относительно себя",
          text: "Умножение CFrame двигает деталь **по её направлению**. Вперёд в Roblox — это **минус Z**:",
          code: L`part.CFrame *= CFrame.new(0, 0, -5) -- 5 студов вперёд`
        },
        {
          t: "choice",
          q: "Что сделает `part.CFrame *= CFrame.new(0, 0, -5)`?",
          opts: ["Сдвинет на 5 вперёд туда, куда смотрит деталь", "Поднимет на 5", "Повернёт на 5°"],
          a: 0
        },
        {
          t: "info",
          title: "Двигаем модели целиком",
          text: "Модель (дом, персонаж) двигают через `PivotTo`:",
          code: L`character:PivotTo(CFrame.new(0, 20, 0))`
        },
        {
          t: "choice",
          q: "Как перенести персонажа в точку (0, 20, 0)?",
          opts: ["`character:PivotTo(CFrame.new(0, 20, 0))`", "`character.Position = Vector3.new(0, 20, 0)`"],
          a: 0,
          why: "У модели нет свойства Position, её двигают через PivotTo."
        },
        {
          t: "choice",
          q: "Как перевести 90 градусов в радианы?",
          opts: ["`math.rad(90)`", "`math.deg(90)`", "`90 * 2`"],
          a: 0
        },
        {
          t: "studio",
          title: "Крутилка",
          steps: [
            "Создай деталь `Spinner`, поставь Anchored.",
            "Положи в неё Script с кодом ниже и запусти."
          ],
          code: L`local part = script.Parent
while true do
	part.CFrame *= CFrame.Angles(0, math.rad(3), 0)
	task.wait()
end`,
          where: "Workspace > Spinner > Script",
          result: "деталь крутится как волчок."
        }
      ]
    },
    {
      id: "w-colors",
      title: "Цвета",
      sub: "Color3, BrickColor и радуга",
      icon: "🎨",
      ref: "vectors-cframe",
      slides: [
        {
          t: "info",
          title: "Color3.fromRGB",
          text: "Цвет смешивают из красного, зелёного и синего. Каждый от 0 до 255:",
          code: L`part.Color = Color3.fromRGB(255, 0, 0)   -- красный
part.Color = Color3.fromRGB(0, 255, 0)   -- зелёный
part.Color = Color3.fromRGB(255, 255, 0) -- жёлтый`
        },
        {
          t: "choice",
          q: "Какой цвет даст `Color3.fromRGB(0, 0, 255)`?",
          opts: ["Синий", "Красный", "Белый"],
          a: 0
        },
        {
          t: "fill",
          q: "Покрась деталь в зелёный",
          code: L`part.Color = Color3.___(0, 255, 0)`,
          bank: ["fromRGB", "new", "Green", "rgb"],
          a: ["fromRGB"]
        },
        {
          t: "info",
          title: "BrickColor — цвета по названию",
          code: L`part.BrickColor = BrickColor.new("Bright red")
part.BrickColor = BrickColor.random() -- случайный`
        },
        {
          t: "choice",
          q: "Чем `Color3.new` отличается от `Color3.fromRGB`?",
          opts: ["new принимает числа от 0 до 1", "Ничем", "new работает только для серого"],
          a: 0,
          why: "Красный: `Color3.new(1, 0, 0)` = `Color3.fromRGB(255, 0, 0)`."
        },
        {
          t: "match",
          q: "Соедини код и цвет",
          pairs: [
            ["`fromRGB(255, 0, 0)`", "Красный"],
            ["`fromRGB(255, 255, 255)`", "Белый"],
            ["`fromRGB(0, 0, 0)`", "Чёрный"]
          ]
        },
        {
          t: "studio",
          title: "Радужная деталь",
          steps: [
            "Положи Script в любую деталь.",
            "Вставь код и запусти игру."
          ],
          code: L`local part = script.Parent
local hue = 0
while true do
	hue = (hue + 0.01) % 1
	part.Color = Color3.fromHSV(hue, 1, 1)
	task.wait(0.03)
end`,
          where: "Workspace > Part > Script",
          result: "деталь плавно переливается всеми цветами."
        }
      ]
    },
    {
      id: "w-attrs",
      title: "Атрибуты",
      sub: "Свои настройки для любого объекта",
      icon: "🏷️",
      ref: "instances",
      slides: [
        {
          t: "info",
          title: "Своё свойство для объекта",
          text: [
            "У двери нет свойства «заперта». Но его можно добавить — это **атрибут**.",
            "Атрибуты видно внизу окна Properties, их можно менять без кода."
          ],
          code: L`door:SetAttribute("IsLocked", true)
print(door:GetAttribute("IsLocked")) --> true`
        },
        {
          t: "choice",
          q: "Что будет, если написать `door.IsLocked = true`?",
          opts: ["Ошибка: такого свойства у детали нет", "Дверь запрётся", "Создастся атрибут"],
          a: 0
        },
        {
          t: "fill",
          q: "Дай мечу урон 25 и прочитай его",
          code: L`sword:___("Damage", 25)
print(sword:___("Damage"))`,
          bank: ["SetAttribute", "GetAttribute", "SetProperty", "Get"],
          a: ["SetAttribute", "GetAttribute"]
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`door:SetAttribute("Hp", 50)
print(door:GetAttribute("Hp") * 2)`,
          a: ["100"]
        },
        {
          t: "info",
          title: "Реагируем на изменение",
          code: L`door:GetAttributeChangedSignal("IsLocked"):Connect(function()
	print("Замок теперь:", door:GetAttribute("IsLocked"))
end)`,
          after: "Про `Connect` подробно — в ветке «События»."
        },
        {
          t: "info",
          title: "IsA — что это за объект",
          code: L`if obj:IsA("BasePart") then
	obj.Transparency = 0.5
end`,
          after: "`BasePart` — любая деталь: Part, MeshPart, WedgePart и другие."
        },
        {
          t: "choice",
          q: "Что вернёт `obj:IsA(\"BasePart\")`, если obj — MeshPart?",
          opts: ["true", "false"],
          a: 0
        },
        {
          t: "studio",
          title: "Атрибут без кода",
          steps: [
            "Выбери любую деталь.",
            "Внизу Properties нажми **Add Attribute**.",
            "Назови его `Damage`, тип Number, значение 10."
          ],
          result: "у детали появилось своё свойство Damage, его можно читать через GetAttribute."
        }
      ]
    }
  ]
});
