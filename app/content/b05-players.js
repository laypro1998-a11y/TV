BRANCHES.push({
  id: "players",
  title: "Игроки и персонажи",
  icon: "🧍",
  color: "#ff4b4b",
  shade: "#ea2b2b",
  level: "Средний",
  desc: "Вход в игру, здоровье, скорость, таблица очков, телепорты и команды",
  lessons: [
    {
      id: "p-player",
      title: "Player и Character",
      sub: "Игрок и его человечек — не одно и то же",
      icon: "🧍",
      ref: "players-characters",
      slides: [
        {
          t: "info",
          title: "Две разные вещи",
          text: [
            "👤 **Player** — аккаунт игрока на сервере: ник, номер, команда. Живёт, пока игрок в игре.",
            "🧍 **Character** — человечек в 3D-мире. **Пересоздаётся после каждой смерти.**"
          ],
          tree: L`⚙️ Players
  👤 **Player1** — Player
⚙️ Workspace
  🧩 **Player1** — Character
    🔹 Humanoid
    🧱 HumanoidRootPart`
        },
        {
          t: "match",
          q: "Соедини понятие и описание",
          pairs: [
            ["Player", "Аккаунт на сервере"],
            ["Character", "Человечек в мире"],
            ["Humanoid", "Здоровье и скорость"],
            ["HumanoidRootPart", "Главная деталь тела"]
          ]
        },
        {
          t: "choice",
          q: "Игрок умер и возродился. Что создалось заново?",
          opts: ["Character", "Player", "Оба"],
          a: 0
        },
        {
          t: "info",
          title: "Как связаны",
          code: L`local character = player.Character
local player = Players:GetPlayerFromCharacter(character)`
        },
        {
          t: "info",
          title: "LocalPlayer — только на клиенте",
          text: [
            "В **LocalScript** свой игрок всегда под рукой: `Players.LocalPlayer`.",
            "На **сервере** игроков много, поэтому LocalPlayer там нет. Игрока получают из событий: вход, клик, касание."
          ]
        },
        {
          t: "choice",
          q: "Что вернёт `Players.LocalPlayer` в серверном Script?",
          opts: ["nil", "Первого игрока", "Всех игроков"],
          a: 0
        },
        {
          t: "info",
          title: "UserId — номер навсегда",
          text: "Ник можно сменить за Robux, а **UserId** не меняется никогда. Для сохранений, банов и админов используй UserId.",
          code: L`print(player.Name)   --> Builderman
print(player.UserId) --> 156`
        },
        {
          t: "choice",
          q: "Что использовать, чтобы узнать игрока даже после смены ника?",
          opts: ["`player.UserId`", "`player.Name`", "`player.DisplayName`"],
          a: 0
        }
      ]
    },
    {
      id: "p-join",
      title: "Вход и выход игроков",
      sub: "PlayerAdded, PlayerRemoving и появление персонажа",
      icon: "👋",
      ref: "players-characters",
      slides: [
        {
          t: "info",
          title: "Игрок зашёл, игрок вышел",
          code: L`local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	print(player.Name, "зашёл в игру")
end)

Players.PlayerRemoving:Connect(function(player)
	print(player.Name, "вышел")
end)`,
          where: "ServerScriptService > Script"
        },
        {
          t: "fill",
          q: "Поприветствуй каждого нового игрока",
          code: L`Players.___:Connect(function(player)
	print("Привет,", player.Name)
end)`,
          bank: ["PlayerAdded", "PlayerRemoving", "Touched", "Joined"],
          a: ["PlayerAdded"]
        },
        {
          t: "info",
          title: "Появление персонажа",
          text: "Персонаж появляется после входа и **после каждой смерти**. Для этого есть CharacterAdded:",
          code: L`Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		print(character.Name, "появился в мире")
	end)
end)`
        },
        {
          t: "order",
          q: "Собери обработчик появления персонажа",
          lines: [
            "Players.PlayerAdded:Connect(function(player)",
            "\tplayer.CharacterAdded:Connect(function(character)",
            "\t\tprint(\"Появился!\")",
            "\tend)",
            "end)"
          ]
        },
        {
          t: "info",
          title: "Сколько игроков в игре",
          code: L`local list = Players:GetPlayers()
print("Игроков:", #list)`
        },
        {
          t: "input",
          q: "В игре 3 игрока. Что выведет `print(#Players:GetPlayers())`?",
          a: ["3"]
        },
        {
          t: "choice",
          q: "Где удобнее всего сохранять прогресс игрока?",
          opts: ["В PlayerRemoving, когда он выходит", "В PlayerAdded", "В CharacterAdded"],
          a: 0
        },
        {
          t: "studio",
          title: "Приветствие",
          steps: [
            "В ServerScriptService создай Script.",
            "Напиши PlayerAdded, который выводит «Добро пожаловать, <ник>!».",
            "Запусти игру."
          ],
          code: L`local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
	print(\`Добро пожаловать, {player.Name}!\`)
end)`,
          where: "ServerScriptService > Script",
          result: "приветствие с твоим ником в Output."
        }
      ]
    },
    {
      id: "p-humanoid",
      title: "Humanoid: здоровье и скорость",
      sub: "Делаем персонажа быстрее, выше и крепче",
      icon: "❤️",
      ref: "players-characters",
      slides: [
        {
          t: "info",
          title: "Humanoid — «мозг» персонажа",
          text: "Внутри каждого персонажа есть **Humanoid**. В нём здоровье, скорость, прыжок.",
          code: L`humanoid.Health = 50     -- здоровье
humanoid.MaxHealth = 150 -- максимум
humanoid.WalkSpeed = 30  -- скорость (обычная 16)
humanoid.JumpPower = 80  -- прыжок (обычный 50)`
        },
        {
          t: "match",
          q: "Соедини свойство и смысл",
          pairs: [
            ["Health", "Здоровье"],
            ["WalkSpeed", "Скорость ходьбы"],
            ["JumpPower", "Сила прыжка"],
            ["Died", "Событие смерти"]
          ]
        },
        {
          t: "choice",
          q: "Какая обычная скорость ходьбы в Roblox?",
          opts: ["16", "50", "100"],
          a: 0
        },
        {
          t: "info",
          title: "Настраиваем при каждом появлении",
          text: "Новый персонаж после смерти получает обычные настройки. Поэтому меняем их в CharacterAdded:",
          code: L`player.CharacterAdded:Connect(function(character)
	local humanoid = character:WaitForChild("Humanoid")
	humanoid.WalkSpeed = 30
end)`,
          where: "ServerScriptService > Script"
        },
        {
          t: "fill",
          q: "Найди Humanoid и ускорь персонажа",
          code: L`local humanoid = character:___("Humanoid")
humanoid.___ = 30`,
          bank: ["WaitForChild", "WalkSpeed", "Speed", "FindParent"],
          a: ["WaitForChild", "WalkSpeed"]
        },
        {
          t: "info",
          title: "Смерть",
          code: L`humanoid.Died:Connect(function()
	print("Персонаж погиб")
end)`
        },
        {
          t: "choice",
          q: "Почему скорость меняют в CharacterAdded, а не один раз в PlayerAdded?",
          opts: ["После смерти появится новый персонаж с обычной скоростью", "PlayerAdded не работает", "Так короче"],
          a: 0
        },
        {
          t: "studio",
          title: "Супер-скорость",
          steps: [
            "Создай Script в ServerScriptService.",
            "Напиши PlayerAdded → CharacterAdded, который ставит WalkSpeed 40 и JumpPower 100.",
            "Запусти игру и побегай."
          ],
          tip: "Если прыжок не меняется, найди в StarterPlayer свойство CharacterUseJumpPower и включи его.",
          result: "персонаж бегает и прыгает заметно быстрее."
        }
      ]
    },
    {
      id: "p-leaderstats",
      title: "Таблица очков",
      sub: "leaderstats: монеты и очки справа вверху",
      icon: "🏅",
      ref: "players-characters",
      slides: [
        {
          t: "info",
          title: "Волшебная папка leaderstats",
          text: "Если в игроке создать папку с именем **ровно** `leaderstats`, Roblox сам покажет её значения в таблице справа вверху.",
          tree: L`⚙️ Players
  👤 Player1
    📁 **leaderstats**
      🔢 Coins = 0
      🔢 Kills = 0`
        },
        {
          t: "info",
          title: "Код таблицы очков",
          code: L`Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	stats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
end)`,
          where: "ServerScriptService > Script «Leaderstats»"
        },
        {
          t: "fill",
          q: "Создай папку очков и числовое значение",
          code: L`local stats = Instance.new("Folder")
stats.Name = "___"
local coins = Instance.new("___")`,
          bank: ["leaderstats", "Leaderstats", "IntValue", "Part"],
          a: ["leaderstats", "IntValue"],
          why: "Имя строго `leaderstats` с маленькой буквы, а целое число хранит IntValue."
        },
        {
          t: "info",
          title: "Даём монеты",
          code: L`player.leaderstats.Coins.Value += 10`,
          warn: "Меняй очки **только на сервере** (в Script). Если поменять в LocalScript, изменится только у тебя на экране."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`coins.Value = 5
coins.Value += 10
print(coins.Value)`,
          a: ["15"]
        },
        {
          t: "choice",
          q: "Где менять Coins, чтобы все увидели?",
          opts: ["В Script на сервере", "В LocalScript"],
          a: 0
        },
        {
          t: "studio",
          title: "Монетка",
          steps: [
            "Сделай Script «Leaderstats» с кодом выше.",
            "Создай жёлтую деталь `Coin` и положи в неё Script ниже.",
            "Запусти игру и подбери монетку."
          ],
          code: L`local Players = game:GetService("Players")
local coin = script.Parent
coin.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if player then
		player.leaderstats.Coins.Value += 1
		coin:Destroy()
	end
end)`,
          where: "Workspace > Coin > Script",
          result: "монетка исчезает, а в таблице справа вверху Coins стало 1."
        },
        {
          t: "choice",
          q: "Почему после подбора монеты стоит `coin:Destroy()`?",
          opts: ["Чтобы монету нельзя было подобрать много раз", "Чтобы сохранить монету", "Без этого монеты не начислятся"],
          a: 0
        }
      ]
    },
    {
      id: "p-teleport",
      title: "Телепорт и чекпоинты",
      sub: "Перемещаем игрока и меняем точку возрождения",
      icon: "🌀",
      slides: [
        {
          t: "info",
          title: "Телепорт персонажа",
          text: "Персонаж — модель. Модель переносят через `PivotTo`:",
          code: L`character:PivotTo(CFrame.new(0, 50, 0))`,
          tip: "Добавь пару студов по Y, чтобы персонаж не застрял в полу."
        },
        {
          t: "info",
          title: "Телепорт-площадка",
          code: L`local pad = script.Parent
local target = workspace.TargetPad

pad.Touched:Connect(function(hit)
	local character = hit.Parent
	if character:FindFirstChildOfClass("Humanoid") then
		character:PivotTo(target.CFrame + Vector3.new(0, 4, 0))
	end
end)`,
          where: "Workspace > TeleportPad > Script"
        },
        {
          t: "fill",
          q: "Перенеси персонажа к цели",
          code: L`character:___(target.CFrame + Vector3.new(0, 4, 0))`,
          bank: ["PivotTo", "MoveTo", "Teleport", "Position"],
          a: ["PivotTo"]
        },
        {
          t: "info",
          title: "SpawnLocation и чекпоинты",
          text: [
            "**SpawnLocation** — деталь, на которой появляются игроки.",
            "Чтобы сделать чекпоинт, запоминаем, на каком спавне возрождать игрока: `player.RespawnLocation`."
          ],
          code: L`checkpoint.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if player then
		player.RespawnLocation = checkpoint
	end
end)`
        },
        {
          t: "choice",
          q: "Какое свойство игрока решает, где он возродится?",
          opts: ["`RespawnLocation`", "`SpawnPoint`", "`Position`"],
          a: 0,
          why: "Для чекпоинта сама деталь должна быть SpawnLocation."
        },
        {
          t: "choice",
          q: "Как телепортировать персонажа?",
          opts: ["`character:PivotTo(...)`", "`character.Position = ...`", "`player:Teleport()`"],
          a: 0
        },
        {
          t: "info",
          title: "Возродить сразу",
          code: L`player:LoadCharacter() -- новый персонаж прямо сейчас`,
          after: "Работает только на сервере."
        },
        {
          t: "input",
          q: "На сколько студов выше цели площадка ставит персонажа, чтобы он не застрял в полу?",
          a: ["4"]
        },
        {
          t: "studio",
          title: "Портал",
          steps: [
            "Создай две детали: `TeleportPad` и `TargetPad` в разных местах.",
            "В TeleportPad положи Script с кодом площадки.",
            "Наступи на площадку."
          ],
          result: "персонаж мгновенно переносится к TargetPad."
        }
      ]
    },
    {
      id: "p-damage",
      title: "Урон и лечение",
      sub: "TakeDamage, аптечки и кто кого победил",
      icon: "⚔️",
      ref: "players-characters",
      slides: [
        {
          t: "info",
          title: "Урон: TakeDamage",
          code: L`humanoid:TakeDamage(20)`,
          after: "Это лучше, чем `Health -= 20`: TakeDamage не наносит урон, если на игроке силовое поле (ForceField) после возрождения."
        },
        {
          t: "choice",
          q: "Почему урон наносят через `TakeDamage`?",
          opts: ["Он учитывает защитное поле после спавна", "Он наносит двойной урон", "Health менять нельзя"],
          a: 0
        },
        {
          t: "info",
          title: "Лечение без перебора",
          text: "Здоровье не должно быть больше максимума. Поможет `math.min`:",
          code: L`humanoid.Health = math.min(humanoid.Health + 30, humanoid.MaxHealth)`
        },
        {
          t: "input",
          q: "Здоровье 90 из 100, аптечка лечит 30. Сколько станет здоровья?",
          a: ["100"]
        },
        {
          t: "order",
          q: "Собери функцию лечения",
          lines: [
            "local function heal(humanoid, amount)",
            "\tlocal newHp = humanoid.Health + amount",
            "\thumanoid.Health = math.min(newHp, humanoid.MaxHealth)",
            "end"
          ]
        },
        {
          t: "info",
          title: "Кто нанёс удар",
          text: "Чтобы засчитать победу, оружие оставляет на жертве метку **creator** с атакующим игроком. При смерти её читают:",
          code: L`humanoid.Died:Connect(function()
	local tag = humanoid:FindFirstChild("creator")
	if tag and tag.Value then
		tag.Value.leaderstats.Kills.Value += 1
	end
end)`
        },
        {
          t: "choice",
          q: "Зачем метка `creator` на Humanoid?",
          opts: ["Узнать, кто последним ударил, и дать ему очко", "Чтобы восстановить здоровье", "Чтобы игрок не умер"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини код и смысл",
          pairs: [
            ["`TakeDamage(10)`", "Нанести урон"],
            ["`MaxHealth`", "Максимум здоровья"],
            ["`math.min`", "Меньшее из чисел"],
            ["`Died`", "Персонаж погиб"]
          ]
        }
      ]
    },
    {
      id: "p-teams",
      title: "Команды",
      sub: "Красные против синих",
      icon: "🚩",
      slides: [
        {
          t: "info",
          title: "Сервис Teams",
          text: "Команды — это объекты **Team** внутри сервиса Teams. У каждой своё имя и цвет.",
          tree: L`⚙️ Teams
  🚩 **Красные**
  🚩 **Синие**`
        },
        {
          t: "info",
          title: "Создаём команду",
          code: L`local Teams = game:GetService("Teams")
local red = Instance.new("Team")
red.Name = "Красные"
red.TeamColor = BrickColor.new("Really red")
red.AutoAssignable = true
red.Parent = Teams`,
          where: "ServerScriptService > Script",
          after: "`AutoAssignable` — сам раскидывать новых игроков по командам."
        },
        {
          t: "match",
          q: "Соедини свойство и смысл",
          pairs: [
            ["TeamColor", "Цвет команды"],
            ["AutoAssignable", "Сам добавлять игроков"],
            ["player.Team", "Команда игрока"]
          ]
        },
        {
          t: "fill",
          q: "Переведи игрока в синюю команду",
          code: L`local blue = Teams:FindFirstChild("Синие")
player.___ = blue`,
          bank: ["Team", "TeamColor", "Group"],
          a: ["Team"]
        },
        {
          t: "info",
          title: "Не бить своих",
          code: L`if attacker.Team == victim.Team then
	return -- союзник, урон не наносим
end`
        },
        {
          t: "choice",
          q: "Что делает эта проверка в оружии?",
          opts: ["Не даёт ранить игрока своей команды", "Меняет команду", "Лечит союзника"],
          a: 0
        },
        {
          t: "info",
          title: "Спавн для команды",
          text: "У SpawnLocation выключи **Neutral** и поставь **TeamColor** команды. Тогда на нём будут появляться только её игроки."
        },
        {
          t: "choice",
          q: "Как сделать спавн только для красных?",
          opts: ["Neutral = false и TeamColor = цвет красных", "Покрасить спавн в красный", "Назвать спавн «Красные»"],
          a: 0
        }
      ]
    }
  ]
});
