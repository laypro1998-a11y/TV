BRANCHES.push({
  id: "events",
  title: "События и взаимодействие",
  icon: "⚡",
  color: "#ff9600",
  shade: "#d97e00",
  level: "Средний",
  desc: "Касания, клики, «Нажми E», плавная анимация, звуки и таймеры",
  lessons: [
    {
      id: "e-connect",
      title: "Что такое событие",
      sub: "Код, который ждёт, пока что-то случится",
      icon: "⚡",
      ref: "events",
      slides: [
        {
          t: "info",
          title: "Как дверной звонок 🔔",
          text: [
            "Ты не стоишь весь день у двери. Ты занимаешься делами, а когда **звонят** — идёшь открывать.",
            "Событие — такой же «звонок». Мы говорим игре: «когда это случится, выполни мою функцию»."
          ]
        },
        {
          t: "info",
          title: "Connect — подписаться",
          code: L`local part = script.Parent

part.Touched:Connect(function(hit)
	print(hit.Name, "коснулся меня")
end)`,
          where: "Workspace > Part > Script",
          after: "`Touched` — событие «кто-то коснулся». Функция внутри будет вызываться **при каждом касании**."
        },
        {
          t: "choice",
          q: "Когда выполнится функция внутри `Connect`?",
          opts: ["Каждый раз, когда случится событие", "Один раз при запуске", "Никогда"],
          a: 0
        },
        {
          t: "fill",
          q: "Подпишись на касание детали",
          code: L`part.___:___(function(hit)
	print("Касание!")
end)`,
          bank: ["Touched", "Connect", "Clicked", "Run"],
          a: ["Touched", "Connect"]
        },
        {
          t: "info",
          title: "Отписаться и подождать",
          code: L`local c = part.Touched:Connect(onTouch)
c:Disconnect()          -- больше не слушать

part.Touched:Once(onTouch) -- только один раз
part.Touched:Wait()        -- остановиться и ждать`
        },
        {
          t: "match",
          q: "Соедини метод и смысл",
          pairs: [
            ["`:Connect`", "Каждый раз"],
            ["`:Once`", "Только один раз"],
            ["`:Disconnect`", "Отписаться"],
            ["`:Wait`", "Ждать события"]
          ]
        },
        {
          t: "choice",
          q: "Что не так в этой строке?",
          code: L`part.Touched:Connect(onTouch())`,
          opts: ["Лишние скобки: функция вызовется сразу", "Нужна точка вместо двоеточия", "Всё правильно"],
          a: 0,
          why: "Передаём саму функцию: `Connect(onTouch)`, без скобок."
        },
        {
          t: "studio",
          title: "Детектор касаний",
          steps: [
            "Создай деталь, поставь Anchored.",
            "Положи в неё Script с кодом со слайда про Connect.",
            "Запусти игру и наступи на деталь."
          ],
          result: "в Output появляются имена частей тела: LeftFoot, RightFoot..."
        }
      ]
    },
    {
      id: "e-touched",
      title: "Лава: касание игрока",
      sub: "Отличаем персонажа от простой детали",
      icon: "🌋",
      ref: "events",
      slides: [
        {
          t: "info",
          title: "Кто коснулся?",
          text: "Touched срабатывает от **любой** детали: ноги, упавшего кубика, пули. Как понять, что это игрок?",
          tree: L`⚙️ Workspace
  🧩 **Player1** — персонаж
    🔹 Humanoid
    🧱 Head
    🧱 LeftFoot ← коснулась`,
          after: "Нога лежит внутри персонажа. Значит, `hit.Parent` — это персонаж. А у персонажа есть **Humanoid**."
        },
        {
          t: "info",
          title: "Проверка на Humanoid",
          code: L`local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
if humanoid then
	print("Это персонаж!")
end`
        },
        {
          t: "order",
          q: "Собери лаву, которая убивает игрока",
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
          t: "choice",
          q: "На лаву упал обычный кубик. Что будет?",
          opts: ["Ничего: у кубика нет Humanoid", "Кубик исчезнет", "Ошибка"],
          a: 0
        },
        {
          t: "info",
          title: "А какой это игрок?",
          code: L`local Players = game:GetService("Players")
local player = Players:GetPlayerFromCharacter(hit.Parent)
if player then
	print(player.Name, "наступил на лаву")
end`,
          after: "Вернёт игрока или nil, если это NPC или просто деталь."
        },
        {
          t: "choice",
          q: "Что значит `hit.Parent` в обработчике Touched?",
          opts: ["Объект, внутри которого лежит коснувшаяся деталь", "Сама лава", "Игрок"],
          a: 0
        },
        {
          t: "fill",
          q: "Найди Humanoid у того, кто коснулся",
          code: L`local humanoid = hit.Parent:___("Humanoid")`,
          bank: ["FindFirstChildOfClass", "GetChildren", "Destroy"],
          a: ["FindFirstChildOfClass"]
        },
        {
          t: "studio",
          title: "Сделай лаву",
          steps: [
            "Создай деталь `Lava`: красная, материал Neon, Anchored.",
            "Положи в неё Script и собери код из упражнения выше.",
            "Запусти игру и наступи на лаву."
          ],
          tree: L`⚙️ Workspace
  🧱 Lava
    📜 **Script**`,
          result: "персонаж погибает и возрождается на спавне."
        }
      ]
    },
    {
      id: "e-debounce",
      title: "Debounce: защита от спама",
      sub: "Чтобы событие не срабатывало 100 раз",
      icon: "🛑",
      ref: "events",
      slides: [
        {
          t: "info",
          title: "Проблема",
          text: [
            "Сделаем кнопку, которая даёт +10 очков при касании.",
            "Нажимаем — а она срабатывает **20 раз подряд**! Touched вызывается от каждой части тела и при каждом шаге."
          ]
        },
        {
          t: "info",
          title: "Решение: флажок «занято»",
          code: L`local busy = false

part.Touched:Connect(function(hit)
	if busy then return end -- занято — выходим
	busy = true
	print("Нажато один раз!")
	task.wait(2)
	busy = false            -- снова можно
end)`
        },
        {
          t: "fill",
          q: "Допиши защиту от спама",
          code: L`local busy = false
part.Touched:Connect(function(hit)
	if ___ then return end
	busy = ___
	print("Сработало!")
	task.wait(2)
	busy = ___
end)`,
          bank: ["busy", "true", "false", "hit"],
          a: ["busy", "true", "false"]
        },
        {
          t: "input",
          q: "Через сколько секунд кнопка из примера снова сработает?",
          a: ["2"]
        },
        {
          t: "choice",
          q: "Что будет без debounce на кнопке «+10 очков»?",
          opts: ["Очки начислятся много раз за одно касание", "Кнопка не сработает", "Игра остановится"],
          a: 0
        },
        {
          t: "info",
          title: "Свой кулдаун для каждого игрока",
          text: "Один флажок блокирует кнопку **для всех**. Если нужно, чтобы каждый игрок ждал сам за себя, храним флажки в таблице:",
          code: L`local Players = game:GetService("Players")
local used = {} -- [игрок] = true

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or used[player] then return end
	used[player] = true
	print(player.Name, "взял бонус")
	task.wait(5)
	used[player] = nil
end)`
        },
        {
          t: "choice",
          q: "Зачем таблица `used[player]` вместо одного флажка?",
          opts: ["Чтобы у каждого игрока был свой кулдаун", "Чтобы бонус сохранился", "Так быстрее"],
          a: 0
        },
        {
          t: "studio",
          title: "Кнопка с перезарядкой",
          steps: [
            "Создай зелёную деталь `Button`, положи в неё Script.",
            "Вставь код ниже и запусти."
          ],
          code: L`local button = script.Parent
local busy = false
button.Touched:Connect(function(hit)
	if busy then return end
	busy = true
	button.BrickColor = BrickColor.new("Really red")
	print("Нажата!")
	task.wait(3)
	button.BrickColor = BrickColor.new("Lime green")
	busy = false
end)`,
          where: "Workspace > Button > Script",
          result: "кнопка краснеет на 3 секунды, и «Нажата!» пишется один раз."
        }
      ]
    },
    {
      id: "e-click",
      title: "Клик по детали",
      sub: "ClickDetector: кнопки в 3D-мире",
      icon: "🖱️",
      ref: "interaction",
      slides: [
        {
          t: "info",
          title: "ClickDetector",
          text: "Вставь в деталь объект **ClickDetector**. Курсор над деталью станет рукой, а по клику сработает событие.",
          tree: L`⚙️ Workspace
  🧱 Button
    🔹 **ClickDetector**
    📜 Script`
        },
        {
          t: "info",
          title: "MouseClick",
          code: L`local click = script.Parent.ClickDetector

click.MouseClick:Connect(function(player)
	print(player.Name, "нажал на кнопку")
end)`,
          where: "Workspace > Button > Script",
          after: "В функцию сразу приходит **игрок**, который кликнул."
        },
        {
          t: "fill",
          q: "Отреагируй на клик",
          code: L`click.___:Connect(function(player)
	print("Клик от", player.Name)
end)`,
          bank: ["MouseClick", "Touched", "Clicked", "Triggered"],
          a: ["MouseClick"]
        },
        {
          t: "choice",
          q: "Что приходит в функцию MouseClick?",
          opts: ["Игрок, который кликнул", "Позиция мыши", "Сама деталь"],
          a: 0
        },
        {
          t: "info",
          title: "Полезные настройки",
          text: [
            "`MaxActivationDistance` — с какого расстояния можно кликнуть.",
            "`MouseHoverEnter` и `MouseHoverLeave` — курсор навели и убрали. Удобно для подсветки."
          ]
        },
        {
          t: "choice",
          q: "Клик должен менять цвет лампы **для всех**. Какой скрипт?",
          opts: ["Script", "LocalScript"],
          a: 0,
          why: "Изменения, сделанные сервером, видят все игроки."
        },
        {
          t: "match",
          q: "Соедини слово и смысл",
          pairs: [
            ["ClickDetector", "Клик по детали"],
            ["MouseClick", "Событие клика"],
            ["MaxActivationDistance", "Дальность клика"]
          ]
        },
        {
          t: "studio",
          title: "Выключатель света",
          steps: [
            "Сделай деталь `Lamp` и положи в неё **PointLight**.",
            "Сделай деталь `Switch` с **ClickDetector** и Script внутри.",
            "Вставь код и кликай по выключателю."
          ],
          code: L`local lamp = workspace.Lamp
local light = lamp.PointLight
script.Parent.ClickDetector.MouseClick:Connect(function()
	light.Enabled = not light.Enabled
end)`,
          where: "Workspace > Switch > Script",
          result: "свет включается и выключается по клику."
        }
      ]
    },
    {
      id: "e-prompt",
      title: "«Нажми E»",
      sub: "ProximityPrompt: работает на ПК и телефоне",
      icon: "🅴",
      ref: "interaction",
      slides: [
        {
          t: "info",
          title: "ProximityPrompt",
          text: [
            "Подойди к объекту — и появится подсказка «**E** Открыть». Это ProximityPrompt.",
            "На телефоне вместо клавиши будет кнопка на экране."
          ],
          tree: L`⚙️ Workspace
  🧱 Chest
    🔹 **ProximityPrompt**
    📜 Script`
        },
        {
          t: "info",
          title: "Triggered",
          code: L`local prompt = script.Parent.ProximityPrompt

prompt.Triggered:Connect(function(player)
	print(player.Name, "открыл сундук!")
end)`,
          where: "Workspace > Chest > Script"
        },
        {
          t: "fill",
          q: "Отреагируй на «Нажми E»",
          code: L`prompt.___:Connect(function(player)
	print("Открыто!")
end)`,
          bank: ["Triggered", "MouseClick", "Touched", "Pressed"],
          a: ["Triggered"]
        },
        {
          t: "info",
          title: "Настройки подсказки",
          code: L`prompt.ActionText = "Открыть"  -- что сделать
prompt.ObjectText = "Сундук"   -- что это
prompt.HoldDuration = 1        -- держать 1 секунду
prompt.MaxActivationDistance = 8`
        },
        {
          t: "match",
          q: "Соедини настройку и смысл",
          pairs: [
            ["ActionText", "Текст действия"],
            ["ObjectText", "Название объекта"],
            ["HoldDuration", "Сколько держать"],
            ["Enabled", "Включена ли"]
          ]
        },
        {
          t: "choice",
          q: "Что сделает `prompt.Enabled = false`?",
          opts: ["Подсказка пропадёт", "Сундук удалится", "Подсказка станет больше"],
          a: 0
        },
        {
          t: "choice",
          q: "Чем ProximityPrompt лучше ClickDetector для игры на телефоне?",
          opts: ["Сам показывает кнопку на экране", "Работает быстрее", "Ничем"],
          a: 0
        },
        {
          t: "studio",
          title: "Сундук «Нажми E»",
          steps: [
            "Сделай деталь `Chest`, вставь в неё ProximityPrompt.",
            "Положи в Chest Script с кодом ниже.",
            "Подойди к сундуку и нажми E."
          ],
          code: L`local chest = script.Parent
local prompt = chest.ProximityPrompt
prompt.ActionText = "Открыть"
prompt.Triggered:Connect(function(player)
	chest.BrickColor = BrickColor.new("Bright yellow")
	prompt.Enabled = false
end)`,
          where: "Workspace > Chest > Script",
          result: "сундук желтеет, подсказка исчезает."
        }
      ]
    },
    {
      id: "e-tween",
      title: "Плавное движение",
      sub: "TweenService: двери, лифты, анимации",
      icon: "🎢",
      ref: "interaction",
      slides: [
        {
          t: "info",
          title: "Tween — из А в Б плавно",
          text: [
            "Если просто поменять Position, деталь **телепортируется**.",
            "Tween (твин) плавно меняет свойства за заданное время: дверь отъезжает, лифт едет."
          ]
        },
        {
          t: "info",
          title: "Три шага твина",
          code: L`local TweenService = game:GetService("TweenService")

local info = TweenInfo.new(2) -- 1. сколько секунд
local goal = {Position = door.Position + Vector3.new(0, 10, 0)} -- 2. куда
local tween = TweenService:Create(door, info, goal) -- 3. создать
tween:Play()                                          -- и запустить`
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
          t: "info",
          title: "Характер движения",
          code: L`TweenInfo.new(
	2,                         -- время
	Enum.EasingStyle.Bounce,   -- подпрыгнуть в конце
	Enum.EasingDirection.Out,
	-1,                        -- повторять бесконечно
	true                       -- и возвращаться обратно
)`,
          tip: "Попробуй стили Sine, Back, Bounce, Elastic — они ощущаются по-разному."
        },
        {
          t: "choice",
          q: "Как сделать платформу, которая вечно ездит туда-обратно?",
          opts: ["Повторы `-1` и возврат `true` в TweenInfo", "Вызывать Play каждую секунду", "Это невозможно"],
          a: 0
        },
        {
          t: "choice",
          q: "Какие детали лучше двигать твином?",
          opts: ["Закреплённые (Anchored)", "Любые", "Только невидимые"],
          a: 0,
          why: "У незакреплённых деталей физика будет мешать анимации."
        },
        {
          t: "fill",
          q: "Дождись конца анимации",
          code: L`tween:Play()
tween.___:Wait()
print("Дверь открыта")`,
          bank: ["Completed", "Finished", "Done"],
          a: ["Completed"]
        },
        {
          t: "studio",
          title: "Парящая платформа",
          steps: [
            "Создай Anchored-деталь `Platform`, положи в неё Script.",
            "Вставь код и запусти. Попробуй прокатиться."
          ],
          code: L`local TweenService = game:GetService("TweenService")
local p = script.Parent
local info = TweenInfo.new(3, Enum.EasingStyle.Sine,
	Enum.EasingDirection.InOut, -1, true)
TweenService:Create(p, info, {
	Position = p.Position + Vector3.new(0, 0, 30)
}):Play()`,
          where: "Workspace > Platform > Script",
          result: "платформа плавно ездит туда-обратно."
        }
      ]
    },
    {
      id: "e-sound",
      title: "Звуки",
      sub: "Музыка, эффекты и где их размещать",
      icon: "🔊",
      slides: [
        {
          t: "info",
          title: "Объект Sound",
          code: L`local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://123456" -- замени на ID своего звука
sound.Volume = 0.5
sound.Parent = workspace.Button
sound:Play()`,
          tip: "ID звука берут в Toolbox → вкладка Audio. Правый клик по звуку → Copy Asset ID."
        },
        {
          t: "fill",
          q: "Включи звук",
          code: L`local sound = workspace.Bell.Sound
sound:___()`,
          bank: ["Play", "Start", "Run", "Stop"],
          a: ["Play"]
        },
        {
          t: "match",
          q: "Соедини настройку и смысл",
          pairs: [
            ["Volume", "Громкость"],
            ["Looped", "Повторять по кругу"],
            ["`:Play()`", "Включить"],
            ["`:Stop()`", "Выключить"]
          ]
        },
        {
          t: "info",
          title: "Где лежит звук — важно",
          text: [
            "🧱 **Внутри детали** — звук идёт из неё. Вблизи громко, вдали тихо.",
            "⚙️ **В SoundService или Workspace** — слышно одинаково везде. Так ставят музыку."
          ]
        },
        {
          t: "choice",
          q: "Куда положить фоновую музыку, чтобы её было слышно везде?",
          opts: ["В SoundService, и включить Looped", "Внутрь далёкой детали", "В ServerStorage"],
          a: 0,
          why: "Из ServerStorage звук не играет: игроки его даже не видят."
        },
        {
          t: "choice",
          q: "Звук запустили из LocalScript. Кто его услышит?",
          opts: ["Только этот игрок", "Все игроки"],
          a: 0
        },
        {
          t: "studio",
          title: "Кнопка со звуком",
          steps: [
            "В деталь с ClickDetector добавь **Sound** и вставь в SoundId любой звук из Toolbox.",
            "В скрипт клика добавь строку `script.Parent.Sound:Play()`.",
            "Кликни по кнопке."
          ],
          result: "при каждом клике играет звук."
        }
      ]
    },
    {
      id: "e-time",
      title: "Таймеры",
      sub: "task.wait, task.delay, task.spawn и каждый кадр",
      icon: "⏱️",
      ref: "services-task",
      slides: [
        {
          t: "info",
          title: "task.wait — пауза",
          code: L`print("Раз")
task.wait(2) -- ждём 2 секунды
print("Два")`,
          tip: "В старых уроках пишут просто `wait()`. Он устарел, используй `task.wait`."
        },
        {
          t: "info",
          title: "task.delay — сделать потом",
          text: "Код продолжает работать сразу, а функция выполнится позже:",
          code: L`task.delay(3, function()
	print("Прошло 3 секунды")
end)
print("Я не жду!")`
        },
        {
          t: "choice",
          q: "В каком порядке появятся буквы?",
          code: L`task.delay(3, function()
	print("B")
end)
print("A")`,
          opts: ["A, а через 3 секунды B", "B, потом A", "Только A"],
          a: 0
        },
        {
          t: "info",
          title: "task.spawn — запустить параллельно",
          text: "Два вечных цикла в одном скрипте не уживутся: второй никогда не начнётся. Первый нужно запустить через spawn:",
          code: L`task.spawn(function()
	while true do
		print("Цикл 1")
		task.wait(1)
	end
end)

while true do
	print("Цикл 2")
	task.wait(1)
end`
        },
        {
          t: "choice",
          q: "Зачем первый цикл обёрнут в `task.spawn`?",
          opts: ["Чтобы скрипт не застрял в нём и запустил второй", "Чтобы цикл работал быстрее", "Без этого будет ошибка"],
          a: 0
        },
        {
          t: "info",
          title: "Каждый кадр: Heartbeat",
          text: "Для плавного движения есть событие, которое срабатывает **каждый кадр** (около 60 раз в секунду):",
          code: L`local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function(dt)
	part.CFrame *= CFrame.Angles(0, math.rad(90 * dt), 0)
end)`,
          after: "`dt` — сколько секунд прошло с прошлого кадра. `90 * dt` = 90° в секунду на любом устройстве."
        },
        {
          t: "fill",
          q: "Вращай деталь каждый кадр",
          code: L`RunService.___:Connect(function(dt)
	part.CFrame *= CFrame.Angles(0, math.rad(90 * ___), 0)
end)`,
          bank: ["Heartbeat", "dt", "Touched", "1"],
          a: ["Heartbeat", "dt"]
        },
        {
          t: "match",
          q: "Соедини команду и смысл",
          pairs: [
            ["`task.wait`", "Пауза"],
            ["`task.delay`", "Сделать позже"],
            ["`task.spawn`", "Запустить параллельно"],
            ["`Heartbeat`", "Каждый кадр"]
          ]
        }
      ]
    }
  ]
});
