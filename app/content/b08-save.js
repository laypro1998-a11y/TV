BRANCHES.push({
  id: "save",
  title: "Сохранения",
  icon: "💾",
  color: "#2b70c9",
  shade: "#1f57a3",
  level: "Опытный",
  desc: "DataStore: чтобы монеты и прогресс не пропадали после выхода",
  lessons: [
    {
      id: "d-intro",
      title: "Что такое DataStore",
      sub: "Облачная память игры",
      icon: "💾",
      ref: "datastores",
      slides: [
        {
          t: "info",
          title: "Без сохранений всё пропадает",
          text: [
            "Игрок собрал 1000 монет, вышел — и всё. В следующий раз начинает с нуля.",
            "**DataStore** — облачное хранилище Roblox. Данные в нём живут между играми и на всех серверах."
          ]
        },
        {
          t: "info",
          title: "Как устроено",
          text: [
            "🗄️ **Хранилище** — как шкаф с названием, например `PlayerData`.",
            "🔑 **Ключ** — подпись на ящике, например `Player_156`.",
            "📦 **Значение** — что лежит в ящике: число, текст или таблица."
          ],
          code: L`local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("PlayerData")

store:SetAsync("Player_156", 1000)     -- положить
local coins = store:GetAsync("Player_156") -- достать`
        },
        {
          t: "match",
          q: "Соедини команду и действие",
          pairs: [
            ["GetDataStore", "Открыть хранилище"],
            ["SetAsync", "Сохранить"],
            ["GetAsync", "Загрузить"]
          ]
        },
        {
          t: "info",
          title: "Только на сервере",
          text: "DataStore работает **только в Script на сервере**. Иначе читеры записывали бы себе что угодно.",
          tree: L`⚙️ ServerScriptService
  📜 **DataManager** — Script`
        },
        {
          t: "choice",
          q: "Где можно работать с DataStore?",
          opts: ["В Script на сервере", "В LocalScript", "В обоих"],
          a: 0
        },
        {
          t: "choice",
          q: "Какой ключ лучше для данных игрока?",
          opts: ["`\"Player_\" .. player.UserId`", "`player.Name`", "`\"data\"`"],
          a: 0,
          why: "UserId никогда не меняется. Ник можно сменить, и тогда прогресс «потеряется»."
        },
        {
          t: "studio",
          title: "Включи DataStore в Studio",
          steps: [
            "Опубликуй игру: **File → Publish to Roblox**.",
            "Открой **Home → Game Settings → Security**.",
            "Включи **Enable Studio Access to API Services** и сохрани."
          ],
          warn: "Без этого DataStore в Studio выдаёт ошибку.",
          result: "в Studio можно проверять сохранения."
        },
        {
          t: "choice",
          q: "DataStore в Studio выдаёт ошибку доступа. Что сделать?",
          opts: ["Опубликовать игру и включить API Services", "Переименовать скрипт", "Сделать LocalScript"],
          a: 0
        }
      ]
    },
    {
      id: "d-pcall",
      title: "pcall: если что-то сломалось",
      sub: "Защищаем код от сбоев сети",
      icon: "🧯",
      ref: "datastores",
      slides: [
        {
          t: "info",
          title: "Интернет иногда подводит",
          text: [
            "DataStore — запрос через интернет к серверам Roblox. Иногда он **не проходит**.",
            "Если запрос упадёт, весь скрипт остановится с ошибкой. Чтобы этого не было, есть **pcall**."
          ]
        },
        {
          t: "info",
          title: "pcall — безопасный вызов",
          code: L`local success, result = pcall(function()
	return store:GetAsync(key)
end)

if success then
	print("Загрузили:", result)
else
	warn("Ошибка:", result)
end`,
          after: "pcall возвращает **два** значения: получилось ли (`true`/`false`) и результат или текст ошибки."
        },
        {
          t: "fill",
          q: "Загрузи данные безопасно",
          code: L`local success, data = ___(function()
	return store:___(key)
end)`,
          bank: ["pcall", "GetAsync", "SetAsync", "try"],
          a: ["pcall", "GetAsync"]
        },
        {
          t: "choice",
          q: "Что будет в `success`, если запрос не прошёл?",
          opts: ["false", "true", "nil"],
          a: 0
        },
        {
          t: "choice",
          q: "Зачем оборачивать DataStore в pcall?",
          opts: ["Чтобы сбой сети не сломал весь скрипт", "Чтобы сохранять быстрее", "Так требует Roblox"],
          a: 0
        },
        {
          t: "info",
          title: "Пробуем несколько раз",
          code: L`for attempt = 1, 3 do
	local ok, data = pcall(function()
		return store:GetAsync(key)
	end)
	if ok then
		return data
	end
	task.wait(2) -- подождать и попробовать ещё
end`
        },
        {
          t: "input",
          q: "Сколько попыток загрузки сделает код выше, если сеть совсем не работает?",
          a: ["3"]
        }
      ]
    },
    {
      id: "d-load",
      title: "Загрузка при входе",
      sub: "Достаём прогресс, когда игрок зашёл",
      icon: "📥",
      ref: "datastores",
      slides: [
        {
          t: "info",
          title: "План",
          text: [
            "1️⃣ Игрок зашёл → создаём leaderstats.",
            "2️⃣ Загружаем из DataStore его монеты.",
            "3️⃣ Если данных нет — это новичок, даём стартовые."
          ]
        },
        {
          t: "info",
          title: "Код загрузки",
          code: L`Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
	stats.Parent = player

	local ok, saved = pcall(function()
		return store:GetAsync("Player_" .. player.UserId)
	end)
	if ok then
		coins.Value = saved or 0
	end
end)`,
          where: "ServerScriptService > Script «DataManager»"
        },
        {
          t: "choice",
          q: "Что вернёт GetAsync для игрока, который зашёл впервые?",
          opts: ["nil", "0", "Ошибку"],
          a: 0,
          why: "Записи ещё нет. Поэтому пишем `saved or 0`: если пусто, берём 0."
        },
        {
          t: "fill",
          q: "Новичку дай 0 монет",
          code: L`coins.Value = saved ___ 0`,
          bank: ["or", "and", "+", "not"],
          a: ["or"]
        },
        {
          t: "info",
          title: "Если загрузка не удалась",
          warn: "Не давай игроку «пустые» данные! Он поиграет с нуля, выйдет, и пустота **затрёт** его настоящий прогресс. Лучше кикнуть с просьбой перезайти.",
          code: L`if not ok then
	player:Kick("Не удалось загрузить данные. Перезайди, пожалуйста.")
	return
end`
        },
        {
          t: "choice",
          q: "Загрузка данных не удалась. Что делать?",
          opts: ["Кикнуть с просьбой перезайти и ничего не сохранять", "Дать 0 монет и сохранить при выходе", "Удалить запись"],
          a: 0
        },
        {
          t: "order",
          q: "Собери загрузку",
          given: L`Players.PlayerAdded:Connect(function(player)`,
          lines: [
            "\tlocal key = \"Player_\" .. player.UserId",
            "\tlocal ok, saved = pcall(function()",
            "\t\treturn store:GetAsync(key)",
            "\tend)",
            "end)"
          ]
        }
      ]
    },
    {
      id: "d-save",
      title: "Сохранение при выходе",
      sub: "PlayerRemoving, BindToClose и автосохранение",
      icon: "📤",
      ref: "datastores",
      slides: [
        {
          t: "info",
          title: "Игрок вышел — сохраняем",
          code: L`Players.PlayerRemoving:Connect(function(player)
	local coins = player.leaderstats.Coins.Value
	local ok, err = pcall(function()
		store:SetAsync("Player_" .. player.UserId, coins)
	end)
	if not ok then
		warn("Не сохранилось:", err)
	end
end)`,
          where: "ServerScriptService > Script «DataManager»"
        },
        {
          t: "fill",
          q: "Сохрани монеты, когда игрок выходит",
          code: L`Players.___:Connect(function(player)
	pcall(function()
		store:___(key, coins)
	end)
end)`,
          bank: ["PlayerRemoving", "SetAsync", "PlayerAdded", "GetAsync"],
          a: ["PlayerRemoving", "SetAsync"]
        },
        {
          t: "info",
          title: "Сервер выключается",
          text: [
            "Когда последний игрок уходит или игру обновляют, сервер закрывается. PlayerRemoving может **не успеть**.",
            "`game:BindToClose` даёт до 30 секунд, чтобы сохранить всех."
          ],
          code: L`game:BindToClose(function()
	for _, player in Players:GetPlayers() do
		save(player)
	end
end)`
        },
        {
          t: "choice",
          q: "Зачем нужен `game:BindToClose`?",
          opts: ["Успеть сохранить, когда сервер выключается", "Запретить выход из игры", "Закрыть DataStore"],
          a: 0
        },
        {
          t: "info",
          title: "Автосохранение",
          text: "Сервер может упасть неожиданно. Поэтому сохраняют ещё и раз в несколько минут:",
          code: L`while true do
	task.wait(120)
	for _, player in Players:GetPlayers() do
		save(player)
	end
end`
        },
        {
          t: "match",
          q: "Соедини момент и способ",
          pairs: [
            ["Игрок вышел", "PlayerRemoving"],
            ["Сервер закрывается", "BindToClose"],
            ["На всякий случай", "Автосохранение"]
          ]
        },
        {
          t: "choice",
          q: "SetAsync или UpdateAsync — что надёжнее для прогресса?",
          opts: ["UpdateAsync: он учитывает текущее значение", "SetAsync всегда лучше", "Без разницы"],
          a: 0,
          why: "UpdateAsync читает то, что лежит сейчас, и даёт его изменить. Так два сервера не затрут данные друг друга."
        }
      ]
    },
    {
      id: "d-what",
      title: "Что можно сохранять",
      sub: "Таблицы, инвентарь, позиции",
      icon: "📦",
      ref: "datastores",
      slides: [
        {
          t: "info",
          title: "Сохраняем таблицей",
          text: "Обычно сохраняют всё сразу одной таблицей:",
          code: L`local data = {
	coins = 500,
	level = 7,
	inventory = {"Sword", "Shield"},
}
store:SetAsync(key, data)`
        },
        {
          t: "info",
          title: "Что нельзя",
          text: [
            "✅ Можно: числа, текст, true/false и таблицы из них.",
            "❌ Нельзя: объекты игры (детали, мечи), `Vector3`, `Color3`, `CFrame`."
          ],
          tip: "Инвентарь храни **названиями** предметов, а не самими предметами."
        },
        {
          t: "choice",
          q: "Что можно сохранить в DataStore?",
          opts: ["`{coins = 10, items = {\"Sword\"}}`", "`workspace.Sword`", "`Vector3.new(1, 2, 3)`"],
          a: 0
        },
        {
          t: "info",
          title: "Позиция — по частям",
          code: L`-- сохранить
local p = root.Position
data.pos = {x = p.X, y = p.Y, z = p.Z}

-- загрузить
local pos = Vector3.new(data.pos.x, data.pos.y, data.pos.z)`
        },
        {
          t: "fill",
          q: "Разбери позицию на числа",
          code: L`data.pos = {x = p.___, y = p.___, z = p.Z}`,
          bank: ["X", "Y", "x", "W"],
          a: ["X", "Y"]
        },
        {
          t: "info",
          title: "Новые поля для старых игроков",
          text: "Добавил в игру алмазы? У старых игроков в сохранении их нет. Делай таблицу «по умолчанию» и дополняй ей загруженные данные:",
          code: L`local data = {coins = 0, gems = 0}
for k, v in saved or {} do
	data[k] = v
end`
        },
        {
          t: "choice",
          q: "Как хранить инвентарь с мечом и щитом?",
          opts: ["Список названий: `{\"Sword\", \"Shield\"}`", "Сами объекты из Backpack", "Одной строкой без разделителей"],
          a: 0
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`local data = {pos = {x = 1, y = 5, z = 3}}
print(data.pos.y)`,
          a: ["5"]
        }
      ]
    }
  ]
});
