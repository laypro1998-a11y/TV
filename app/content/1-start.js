APP_UNITS.push({
  title: "Старт",
  desc: "Roblox Studio, первый скрипт и главное: какие бывают скрипты и куда их класть",
  color: "#58cc02",
  shade: "#58a700",
  lessons: [
    {
      id: "intro",
      title: "Первый скрипт",
      icon: "🚀",
      slides: [
        {
          t: "info",
          title: "Привет! Это Luau 👋",
          text: [
            "**Luau** — язык программирования Roblox. На нём написаны все игры: от обби до огромных RPG.",
            "Код живёт в **скриптах**. Скрипт — такой же объект в игре, как деталь или папка."
          ]
        },
        {
          t: "info",
          title: "Три главных окна Studio",
          text: [
            "**Explorer** — дерево всех объектов игры. Здесь создают скрипты.",
            "**Properties** — свойства выбранного объекта: цвет, размер, прозрачность.",
            "**Output** — окно вывода. Сюда приходят сообщения и **ошибки**."
          ],
          after: "Если окна не видно, включи его на вкладке **View**."
        },
        {
          t: "match",
          q: "Соедини окно и его назначение",
          pairs: [
            ["Explorer", "Дерево объектов"],
            ["Properties", "Свойства объекта"],
            ["Output", "Сообщения и ошибки"],
            ["Play (F5)", "Запуск игры"]
          ]
        },
        {
          t: "info",
          title: "print — выводим текст",
          text: "Создай в **ServerScriptService** объект **Script** и напиши:",
          code: L`print("Привет, Roblox!")`,
          where: "ServerScriptService > Script",
          out: "Привет, Roblox!",
          after: "Нажми **Play**, и текст появится в Output."
        },
        {
          t: "choice",
          q: "Что выведет этот код?",
          code: L`print("2 + 2 =", 2 + 2)`,
          opts: ["2 + 2 = 4", "2 + 2 = 2 + 2", "4", "Ошибку"],
          a: 0,
          why: "Через запятую `print` выводит несколько значений через пробел, а `2 + 2` вычисляется."
        },
        {
          t: "info",
          title: "Комментарии",
          text: "Всё после двух минусов `--` Luau игнорирует. Так пишут пояснения в коде.",
          code: L`-- это комментарий, он не выполняется
print("А это код") -- комментарий можно писать и в конце строки`
        },
        {
          t: "choice",
          q: "Как написать комментарий в Luau?",
          opts: ["`-- текст`", "`// текст`", "`# текст`", "`/* текст */`"],
          a: 0
        },
        {
          t: "info",
          title: "Код меняет игру",
          text: "Точка значит «внутри». `workspace.Baseplate` — пол внутри Workspace. А дальше меняем его **свойство**:",
          code: L`workspace.Baseplate.Transparency = 0.5
workspace.Baseplate.BrickColor = BrickColor.new("Bright green")`,
          where: "ServerScriptService > Script",
          after: "Названия свойств пишутся точно как в окне Properties. Регистр букв важен!"
        },
        {
          t: "fill",
          q: "Сделай пол прозрачным наполовину",
          code: L`workspace.___.Transparency = ___`,
          bank: ["Baseplate", "0.5", "baseplate", "50", "Floor"],
          a: ["Baseplate", "0.5"],
          why: "Имя объекта пишется точно как в Explorer, а прозрачность задаётся числом от 0 до 1."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`print(10 - 3)`,
          a: ["7"]
        },
        {
          t: "choice",
          q: "Ты поменял деталь во время Play и нажал Stop. Что будет?",
          opts: ["Изменение пропадёт", "Изменение сохранится", "Деталь удалится"],
          a: 0,
          why: "Всё, что меняли во время игры, после Stop откатывается. Меняй скрипты и детали, когда игра остановлена."
        },
        {
          t: "choice",
          q: "Где появятся красные ошибки скрипта?",
          opts: ["В Output", "В Explorer", "В Properties", "В Toolbox"],
          a: 0,
          why: "В ошибке написано, что не так, в каком скрипте и на какой строке."
        }
      ]
    },
    {
      id: "script-types",
      title: "Script, LocalScript, ModuleScript",
      icon: "📜",
      slides: [
        {
          t: "info",
          title: "Сервер и клиенты",
          text: [
            "**Сервер** — один компьютер Roblox на всех игроков. Он решает правила: деньги, урон, победы.",
            "**Клиент** — устройство каждого игрока: рисует картинку, ловит нажатия, показывает интерфейс.",
            "Сервер — судья, клиенты — игроки. Гол засчитывает только судья."
          ]
        },
        {
          t: "info",
          title: "Три типа скриптов",
          text: [
            "📜 **Script** — работает на **сервере**. Правила игры.",
            "🖥️ **LocalScript** — работает на **клиенте**, у каждого игрока своя копия. Клавиши, камера, интерфейс.",
            "📦 **ModuleScript** — сам не запускается. Его подключают другие скрипты через `require`."
          ]
        },
        {
          t: "match",
          q: "Соедини скрипт и где он работает",
          pairs: [
            ["Script", "На сервере"],
            ["LocalScript", "У игрока на клиенте"],
            ["ModuleScript", "Через require"],
            ["ServerScriptService", "Дом для Script"]
          ]
        },
        {
          t: "info",
          title: "Куда класть скрипты 📍",
          text: [
            "⚙️ **ServerScriptService** → Script",
            "⚙️ **StarterPlayerScripts** → LocalScript, запускается один раз при входе",
            "⚙️ **StarterCharacterScripts** → копируется в персонажа при каждом появлении",
            "⚙️ **StarterGui** → LocalScript для интерфейса",
            "⚙️ **ReplicatedStorage** → модули и RemoteEvent, видят все"
          ]
        },
        {
          t: "choice",
          q: "Куда положить Script, который начисляет монеты?",
          opts: ["⚙️ ServerScriptService", "⚙️ StarterGui", "⚙️ StarterPlayerScripts", "⚙️ ReplicatedStorage"],
          a: 0,
          why: "Деньги — честная информация, ими занимается сервер."
        },
        {
          t: "choice",
          q: "LocalScript лежит в ServerScriptService. Что будет?",
          opts: ["Он просто не запустится", "Он запустится на сервере", "Он запустится у всех игроков"],
          a: 0,
          why: "Ошибка №1 у новичков: LocalScript в неправильном месте молчит, даже без ошибки."
        },
        {
          t: "choice",
          q: "Нужно узнать, какую клавишу нажал игрок. Какой скрипт?",
          opts: ["LocalScript", "Script", "ModuleScript"],
          a: 0,
          why: "Клавиатура есть только у клиента."
        },
        {
          t: "info",
          title: "Клиент меняет мир только для себя",
          text: "Изменения из LocalScript видит **только этот игрок**:",
          code: L`local door = workspace:WaitForChild("Door")
door.Transparency = 1
door.CanCollide = false -- дверь «открыта», но только у тебя`,
          where: "StarterPlayerScripts > LocalScript",
          after: "У других игроков и на сервере дверь закрыта."
        },
        {
          t: "choice",
          q: "LocalScript покрасил стену в красный. Кто это увидит?",
          opts: ["Только этот игрок", "Все игроки", "Только сервер"],
          a: 0
        },
        {
          t: "choice",
          q: "Скрипт даёт ауру при каждом возрождении. Куда его положить?",
          opts: ["StarterCharacterScripts", "StarterPlayerScripts", "ServerStorage"],
          a: 0,
          why: "Содержимое StarterCharacterScripts копируется в каждого нового персонажа."
        },
        {
          t: "match",
          q: "Соедини место и что там хранят",
          pairs: [
            ["StarterGui", "Интерфейс игрока"],
            ["ReplicatedStorage", "Общее для всех"],
            ["ServerStorage", "Только для сервера"],
            ["Workspace", "3D-мир"]
          ]
        },
        {
          t: "choice",
          q: "Где хранить модуль с ценами, который нужен и магазину, и серверу?",
          opts: ["ReplicatedStorage", "ServerScriptService", "StarterGui"],
          a: 0,
          why: "Клиент покажет цены, сервер проверит покупку. ReplicatedStorage видят обе стороны."
        }
      ]
    }
  ]
});
