APP_UNITS.push({
  title: "Проекты",
  desc: "Как устроены настоящие игровые системы: симулятор с магазином и PvP-оружие",
  color: "#7c5cff",
  shade: "#5f43d9",
  lessons: [
    {
      id: "project-simulator",
      title: "Симулятор с магазином",
      icon: "🪙",
      slides: [
        {
          t: "info",
          title: "План симулятора",
          text: [
            "Клик приносит монеты, в магазине продаются множители, прогресс сохраняется.",
            "📦 **Config** — цены и настройки, в ReplicatedStorage",
            "📦 **DataService** — сохранения, в ServerScriptService › Modules",
            "📜 **SimulatorServer** — клики и покупки",
            "🖥️ **SimulatorClient** — интерфейс, в StarterGui",
            "📡 **Click** и **BuyUpgrade** — Remote в ReplicatedStorage › Remotes"
          ]
        },
        {
          t: "match",
          q: "Соедини часть проекта и её место",
          pairs: [
            ["Config", "ReplicatedStorage"],
            ["DataService", "ServerScriptService"],
            ["SimulatorClient", "StarterGui"],
            ["Шаблоны предметов", "ServerStorage"]
          ]
        },
        {
          t: "info",
          title: "Клик: клиент просит, сервер считает",
          code: L`clickRemote.OnServerEvent:Connect(function(player)
	-- не больше 15 кликов в секунду: защита от автокликера
	if tooManyClicks(player) then return end
	local multiplier = player:GetAttribute("Multiplier") or 1
	DataService.addCoins(player, 1 * multiplier)
end)`,
          where: "ServerScriptService > Script «SimulatorServer»"
        },
        {
          t: "choice",
          q: "Почему клиент шлёт «я кликнул», а не «дай мне N монет»?",
          opts: ["Иначе читер прислал бы миллион", "Так меньше трафика", "RemoteEvent не умеет передавать числа"],
          a: 0
        },
        {
          t: "order",
          q: "Собери серверную проверку покупки",
          lines: [
            "buyRemote.OnServerInvoke = function(player, id)",
            "\tlocal upgrade = Config.getUpgrade(id)",
            "\tif not upgrade then return false end",
            "\tif data.coins < upgrade.price then return false end",
            "\tdata.coins -= upgrade.price",
            "\treturn true",
            "end"
          ],
          why: "Сначала проверяем, что улучшение существует, потом деньги, и только потом списываем."
        },
        {
          t: "info",
          title: "Атрибуты — сервер сообщает клиенту",
          text: "Атрибут, поставленный сервером на Player, сам приходит клиенту. Интерфейс узнаёт о покупке без лишних Remote:",
          code: L`-- сервер
player:SetAttribute("Multiplier", 6)

-- клиент
player:GetAttributeChangedSignal("Multiplier"):Connect(updateLabel)`
        },
        {
          t: "choice",
          q: "Как интерфейс узнаёт, что улучшение куплено?",
          opts: ["Из атрибута на Player, который поставил сервер", "Напрямую из DataStore", "Клиент запоминает покупку сам"],
          a: 0
        },
        {
          t: "choice",
          q: "Читер поменял у себя `Coins.Value` на миллион. Что будет?",
          opts: ["Изменится только у него на экране, сервер вернёт настоящее значение", "Монеты сохранятся", "Сервер упадёт"],
          a: 0,
          why: "Источник правды — данные на сервере, а leaderstats их только показывают."
        },
        {
          t: "choice",
          q: "Почему покупку делают через RemoteFunction?",
          opts: ["Клиент получает ответ и показывает понятное сообщение", "Это быстрее", "RemoteEvent не работает с интерфейсом"],
          a: 0
        },
        {
          t: "info",
          title: "Пора собрать проект в Studio! 🛠️",
          text: "Полный код всех скриптов, пошаговая сборка и задания (автокликер, перерождения) — в подробном уроке. Ссылка будет на экране после этого урока."
        }
      ]
    },
    {
      id: "project-pvp",
      title: "PvP-оружие",
      icon: "🎯",
      slides: [
        {
          t: "info",
          title: "Кто за что отвечает",
          text: [
            "🖥️ **Клиент**: узнаёт, куда смотрит курсор, шлёт «стреляю сюда», рисует трассеры.",
            "📜 **Сервер**: проверяет оружие и кулдаун, сам пускает луч, наносит урон, считает убийства."
          ]
        },
        {
          t: "match",
          q: "Соедини часть и её работу",
          pairs: [
            ["Клиент", "Шлёт точку прицела"],
            ["Сервер", "Наносит урон"],
            ["ShotEffect", "Трассер у всех"],
            ["HitMarker", "Знак попадания"]
          ]
        },
        {
          t: "info",
          title: "Tool — оружие в руках",
          text: [
            "**Tool** кладут в **StarterPack**, и он попадает в рюкзак при каждом появлении.",
            "Деталь, за которую его держат, должна называться **Handle**. LocalScript внутри Tool работает."
          ]
        },
        {
          t: "choice",
          q: "Как должна называться деталь, за которую персонаж держит Tool?",
          opts: ["Handle", "Grip", "Main", "Part"],
          a: 0
        },
        {
          t: "info",
          title: "Луч: Raycast",
          code: L`local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = {character} -- не попасть в себя

local result = workspace:Raycast(origin, direction, params)
if result then
	print("Попали в", result.Instance.Name)
end`
        },
        {
          t: "fill",
          q: "Настрой луч, чтобы он не попадал в стрелка",
          code: L`local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.___
params.FilterDescendantsInstances = {___}`,
          bank: ["Exclude", "character", "Include", "workspace", "player"],
          a: ["Exclude", "character"]
        },
        {
          t: "order",
          q: "Собери начало серверного обработчика выстрела",
          lines: [
            "fireRemote.OnServerEvent:Connect(function(player, aim)",
            "\tlocal tool = player.Character:FindFirstChild(\"Blaster\")",
            "\tif not tool then return end",
            "\tlocal origin = tool.Handle.Position",
            "\tlocal direction = (aim - origin).Unit * 300",
            "end)"
          ]
        },
        {
          t: "choice",
          q: "Откуда берётся точка, из которой летит пуля?",
          opts: ["Сервер берёт позицию Handle", "Её присылает клиент", "Выбирается случайно"],
          a: 0,
          why: "Иначе читер прислал бы точку вылета прямо за стеной рядом с врагом."
        },
        {
          t: "choice",
          q: "Как засчитать убийство тому, кто ударил?",
          opts: ["Метка `creator` на Humanoid жертвы, читаем её при смерти", "Клиент сообщает об убийстве", "Считаем трассеры"],
          a: 0
        },
        {
          t: "choice",
          q: "Почему трассеры рисует клиент?",
          opts: ["Визуал дешевле и плавнее на клиентах", "Сервер не умеет создавать детали", "Так безопаснее"],
          a: 0
        },
        {
          t: "info",
          title: "🎓 Ты дошёл до конца пути!",
          text: [
            "Ты знаешь, как устроены игры на Roblox: язык, объекты, события, клиент и сервер, Remote, модули, сохранения и защита от читов.",
            "Теперь главное — **сделай свою игру**. Маленькую, но законченную."
          ]
        }
      ]
    }
  ]
});
