BRANCHES.push({
  id: "start",
  title: "Первые шаги",
  icon: "🚀",
  color: "#58cc02",
  shade: "#58a700",
  level: "Новичок",
  desc: "Roblox Studio, первый скрипт, сервер и клиент, и самое важное: куда класть код",
  lessons: [
    {
      id: "s-studio",
      title: "Знакомство с Roblox Studio",
      sub: "Какие окна нужны и где всё находится",
      icon: "🖥️",
      ref: "intro",
      slides: [
        {
          t: "info",
          title: "Что такое Roblox Studio",
          text: [
            "**Roblox Studio** — бесплатная программа, в которой делают игры для Roblox.",
            "В ней строят мир из деталей и пишут код на языке **Luau**. Код оживляет игру: открывает двери, даёт монеты, считает очки."
          ],
          tip: "Скачать Studio можно на сайте create.roblox.com."
        },
        {
          t: "info",
          title: "Три окна, без которых никак",
          text: [
            "**Explorer** — список всех объектов игры. Похож на папки на компьютере.",
            "**Properties** — настройки выбранного объекта: цвет, размер, прозрачность.",
            "**Output** — сюда игра пишет сообщения и **ошибки**."
          ],
          tip: "Если какого-то окна не видно, включи его на вкладке View."
        },
        {
          t: "match",
          q: "Соедини окно и его работу",
          pairs: [
            ["Explorer", "Все объекты игры"],
            ["Properties", "Настройки объекта"],
            ["Output", "Сообщения и ошибки"]
          ]
        },
        {
          t: "info",
          title: "Explorer — дерево игры",
          text: "Сверху в Explorer лежат большие папки — **сервисы**. У каждого своя работа:",
          tree: L`⚙️ **Workspace** — 3D-мир: пол, стены, детали
⚙️ Players — игроки на сервере
⚙️ ServerScriptService — серверный код
⚙️ StarterGui — интерфейс на экране
⚙️ ReplicatedStorage — общее хранилище`,
          after: "Названия запоминать сразу не нужно. Мы будем повторять их в каждом уроке."
        },
        {
          t: "choice",
          q: "В каком окне видно все объекты игры?",
          opts: ["Explorer", "Properties", "Output"],
          a: 0
        },
        {
          t: "choice",
          q: "Где лежит всё, что видно в 3D-мире: пол, стены, деревья?",
          opts: ["Workspace", "StarterGui", "Players"],
          a: 0
        },
        {
          t: "studio",
          title: "Открой Studio и найди окна",
          steps: [
            "Открой Roblox Studio и войди в аккаунт.",
            "Нажми **New** и выбери шаблон **Baseplate**.",
            "Открой вкладку **View** и включи **Explorer**, **Properties** и **Output**.",
            "Нажми на серый пол. В Properties появятся его настройки."
          ],
          result: "серый пол и три открытых окна."
        },
        {
          t: "choice",
          q: "Окна Output не видно. Как его открыть?",
          opts: ["Вкладка View → Output", "Нажать F5", "Удалить пол"],
          a: 0
        },
        {
          t: "choice",
          q: "Где смотреть, если что-то сломалось?",
          opts: ["В окне Output", "В окне Properties", "В меню File"],
          a: 0,
          why: "Все ошибки скриптов появляются красным текстом в Output."
        }
      ]
    },
    {
      id: "s-print",
      title: "Первый скрипт",
      sub: "Пишем код и запускаем игру",
      icon: "✍️",
      ref: "intro",
      slides: [
        {
          t: "info",
          title: "Где создать скрипт",
          text: "Наведи мышку на **ServerScriptService**, нажми **⊕** и выбери **Script**. Появится новый скрипт:",
          tree: L`⚙️ ServerScriptService
  📜 **Script**`
        },
        {
          t: "info",
          title: "Команда print",
          text: "`print` выводит текст в окно Output. Текст пишут в кавычках.",
          code: L`print("Привет, Roblox!")`,
          where: "ServerScriptService > Script",
          out: "Привет, Roblox!"
        },
        {
          t: "choice",
          q: "Что появится в Output?",
          code: L`print("Я делаю игру")`,
          opts: ["Я делаю игру", "print(\"Я делаю игру\")", "Ничего"],
          a: 0
        },
        {
          t: "fill",
          q: "Выведи слово «Привет!» в Output",
          code: L`___("Привет!")`,
          bank: ["print", "say", "write", "show"],
          a: ["print"]
        },
        {
          t: "info",
          title: "Запуск: Play и Stop",
          text: [
            "**Play** (клавиша F5) запускает игру. Код начинает работать.",
            "**Stop** останавливает игру."
          ],
          warn: "После Stop всё, что изменилось во время игры, возвращается обратно. Меняй игру, когда она остановлена."
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`print(2 + 3)`,
          a: ["5"],
          why: "Без кавычек `2 + 3` — это пример, и print выводит ответ."
        },
        {
          t: "info",
          title: "Комментарии",
          text: "Всё после двух минусов `--` Luau пропускает. Так пишут заметки для себя.",
          code: L`-- это заметка, она не выполняется
print("А это код")`
        },
        {
          t: "choice",
          q: "Как написать комментарий?",
          opts: ["`-- заметка`", "`// заметка`", "`# заметка`"],
          a: 0
        },
        {
          t: "order",
          q: "Сделай так, чтобы вывелось «Раз», потом «Два», потом «Три»",
          lines: ["print(\"Раз\")", "print(\"Два\")", "print(\"Три\")"],
          why: "Скрипт выполняется сверху вниз, строка за строкой."
        },
        {
          t: "studio",
          title: "Твой первый скрипт",
          steps: [
            "В ServerScriptService создай **Script**.",
            "Сотри то, что там написано, и вставь код ниже.",
            "Нажми **Play** и посмотри в Output."
          ],
          code: L`print("Меня зовут ...")
print("Я делаю свою игру!")`,
          where: "ServerScriptService > Script",
          result: "две строки текста в Output."
        }
      ]
    },
    {
      id: "s-errors",
      title: "Ошибки — это нормально",
      sub: "Как читать красный текст и чинить код",
      icon: "🐞",
      ref: "intro",
      slides: [
        {
          t: "info",
          title: "Ошибаются все",
          text: [
            "Даже опытные программисты делают ошибки каждый день. Главное — уметь их **читать**.",
            "Когда код ломается, в Output появляется **красный текст**."
          ],
          code: L`workspace.Baseplat.Transparency = 1`,
          out: "Baseplat is not a valid member of Workspace\nScript 'ServerScriptService.Script', Line 1"
        },
        {
          t: "info",
          title: "Как читать ошибку",
          text: [
            "1️⃣ **Что не так**: «Baseplat is not a valid member» — объекта Baseplat нет.",
            "2️⃣ **Где**: в каком скрипте (ServerScriptService.Script).",
            "3️⃣ **Строка**: Line 1. Клик по ошибке откроет нужную строку."
          ],
          after: "Здесь просто опечатка: правильно `Baseplate`."
        },
        {
          t: "choice",
          q: "В ошибке написано «Line 7». Что это значит?",
          opts: ["Ошибка на 7-й строке скрипта", "Это 7-я ошибка", "Нужно подождать 7 секунд"],
          a: 0
        },
        {
          t: "info",
          title: "Частые ошибки новичков",
          text: [
            "🔤 **Опечатка в имени**: `Baseplat` вместо `Baseplate`.",
            "🔠 **Большие и маленькие буквы**: `baseplate` и `Baseplate` для Luau — разные слова.",
            "🔚 **Забыли `end`** или закрывающую скобку."
          ]
        },
        {
          t: "choice",
          q: "Почему не работает `workspace.baseplate`?",
          opts: ["Имя пишется с большой буквы: Baseplate", "Нужно писать WORKSPACE", "Пол нельзя менять кодом"],
          a: 0
        },
        {
          t: "match",
          q: "Соедини ошибку и её смысл",
          pairs: [
            ["is not a valid member", "Такого объекта нет"],
            ["Expected 'end'", "Забыли end"],
            ["attempt to index nil", "Обратились к пустоте"]
          ]
        },
        {
          t: "info",
          title: "warn — жёлтое предупреждение",
          text: "`warn` работает как print, но пишет **жёлтым**. Удобно для важных сообщений.",
          code: L`print("Обычное сообщение")
warn("Внимание! Это жёлтое")`
        },
        {
          t: "choice",
          q: "Чем `warn` отличается от `print`?",
          opts: ["Пишет жёлтым цветом", "Останавливает игру", "Пишет в чат"],
          a: 0
        },
        {
          t: "studio",
          title: "Сломай и почини",
          steps: [
            "Напиши в скрипте `workspace.Baseplat.Transparency = 0.5` (с ошибкой).",
            "Нажми Play и прочитай красную ошибку в Output.",
            "Кликни по ошибке, исправь имя на `Baseplate` и запусти снова."
          ],
          result: "ошибка пропала, пол стал полупрозрачным."
        }
      ]
    },
    {
      id: "s-server-client",
      title: "Сервер и клиент",
      sub: "Почему игра работает в двух местах сразу",
      icon: "🌐",
      ref: "script-types",
      slides: [
        {
          t: "info",
          title: "Игра работает в двух местах",
          text: [
            "🖥️ **Сервер** — большой компьютер Roblox. Он **один** на всех игроков.",
            "📱 **Клиент** — телефон или компьютер **каждого** игрока."
          ],
          after: "Если в игре 5 человек, то сервер один, а клиентов пять."
        },
        {
          t: "info",
          title: "Как в футболе ⚽",
          text: [
            "**Сервер — судья.** Он решает, засчитан ли гол, у кого сколько очков, кто победил.",
            "**Клиенты — игроки.** Каждый видит поле своими глазами и сам нажимает кнопки.",
            "Игрок может крикнуть «гол!», но засчитывает его только судья."
          ]
        },
        {
          t: "match",
          q: "Кто за что отвечает?",
          pairs: [
            ["Сервер", "Один на всех"],
            ["Клиент", "У каждого игрока свой"],
            ["Монеты и победы", "Решает сервер"],
            ["Нажатые клавиши", "Знает клиент"]
          ]
        },
        {
          t: "choice",
          q: "Кто должен решать, сколько у игрока монет?",
          opts: ["Сервер", "Клиент игрока", "Любой"],
          a: 0
        },
        {
          t: "choice",
          q: "Кто узнаёт, что игрок нажал пробел?",
          opts: ["Клиент", "Сервер", "Никто"],
          a: 0,
          why: "Клавиатура подключена к устройству игрока, то есть к клиенту."
        },
        {
          t: "info",
          title: "Почему клиенту не доверяют",
          text: [
            "Клиент — это устройство игрока. **Читер может поменять на нём что угодно**: написать себе миллион монет или бессмертие.",
            "Поэтому всё важное делает и проверяет **сервер**."
          ]
        },
        {
          t: "choice",
          q: "В игре 8 игроков. Сколько клиентов?",
          opts: ["8", "1", "9"],
          a: 0
        },
        {
          t: "choice",
          q: "Где честнее считать, кто победил в раунде?",
          opts: ["На сервере", "На клиенте каждого игрока"],
          a: 0
        }
      ]
    },
    {
      id: "s-script-types",
      title: "Три вида скриптов",
      sub: "Script, LocalScript и ModuleScript",
      icon: "📜",
      ref: "script-types",
      slides: [
        {
          t: "info",
          title: "Скрипты бывают трёх видов",
          text: [
            "📜 **Script** — работает на **сервере**.",
            "🖥️ **LocalScript** — работает на **клиенте**, у каждого игрока свой.",
            "📦 **ModuleScript** — сам **не запускается**. Это «книга рецептов» для других скриптов."
          ]
        },
        {
          t: "info",
          title: "📜 Script — для правил игры",
          text: "Всё, что должно быть честным и одинаковым для всех: монеты, урон, победы, сохранения.",
          tree: L`⚙️ ServerScriptService
  📜 **Script**`,
          code: L`print("Я работаю на сервере")`,
          where: "ServerScriptService > Script"
        },
        {
          t: "info",
          title: "🖥️ LocalScript — для игрока",
          text: "Всё, что касается одного игрока: клавиши, камера, кнопки на экране.",
          tree: L`⚙️ StarterPlayer
  📁 StarterPlayerScripts
    🖥️ **LocalScript**`,
          code: L`local player = game.Players.LocalPlayer
print("Привет,", player.Name)`,
          where: "StarterPlayer > StarterPlayerScripts > LocalScript"
        },
        {
          t: "info",
          title: "📦 ModuleScript — общий код",
          text: [
            "Если один и тот же код нужен в нескольких скриптах, его кладут в модуль.",
            "Другие скрипты подключают модуль командой `require`. Подробно разберём позже."
          ]
        },
        {
          t: "match",
          q: "Соедини скрипт и где он работает",
          pairs: [
            ["Script", "На сервере"],
            ["LocalScript", "У игрока"],
            ["ModuleScript", "Через require"]
          ]
        },
        {
          t: "choice",
          q: "Нужно узнать, какую клавишу нажал игрок. Какой скрипт?",
          opts: ["LocalScript", "Script", "ModuleScript"],
          a: 0
        },
        {
          t: "choice",
          q: "Нужно давать монеты за победу. Какой скрипт?",
          opts: ["Script", "LocalScript", "ModuleScript"],
          a: 0
        },
        {
          t: "choice",
          q: "Какой скрипт сам по себе **не** запускается?",
          opts: ["ModuleScript", "Script", "LocalScript"],
          a: 0
        },
        {
          t: "studio",
          title: "Посмотри, кто где работает",
          steps: [
            "Создай **Script** в ServerScriptService с кодом `print(\"Сервер\")`.",
            "Создай **LocalScript** в StarterPlayer → StarterPlayerScripts с кодом `print(\"Клиент\")`.",
            "Нажми Play. В Output рядом с каждой строкой написано, откуда она: Server или Client."
          ],
          result: "«Сервер» с пометкой Server и «Клиент» с пометкой Client."
        }
      ]
    },
    {
      id: "s-places",
      title: "Куда класть скрипты",
      sub: "Главная карта: место решает, будет ли код работать",
      icon: "📍",
      ref: "script-types",
      slides: [
        {
          t: "info",
          title: "Место решает всё",
          text: [
            "Скрипт работает, **только если лежит в правильном месте**.",
            "В неправильном месте он просто молчит: ни результата, ни ошибки. Это самая частая беда новичков."
          ]
        },
        {
          t: "info",
          title: "Карта: куда что класть",
          text: "Так это выглядит в Explorer. **Выделено** то, что кладут в каждое место:",
          tree: L`⚙️ ServerScriptService
  📜 **Script** — правила игры
⚙️ StarterPlayer
  📁 StarterPlayerScripts
    🖥️ **LocalScript** — один раз при входе
  📁 StarterCharacterScripts
    🖥️ **LocalScript** — в каждого персонажа
⚙️ StarterGui
  🖼️ ScreenGui
    🖥️ **LocalScript** — кнопки на экране
⚙️ ReplicatedStorage
  📦 **ModuleScript** — общее, видят все
⚙️ ServerStorage
  🧩 **шаблоны** — видит только сервер`,
          tip: "Эта карта есть в «Шпаргалке» на главной странице."
        },
        {
          t: "choice",
          q: "Куда положить Script, который выдаёт монеты?",
          opts: ["ServerScriptService", "StarterGui", "StarterPlayerScripts"],
          a: 0
        },
        {
          t: "choice",
          q: "LocalScript положили в ServerScriptService. Что будет?",
          opts: ["Он не запустится", "Запустится на сервере", "Запустится у всех игроков"],
          a: 0,
          why: "LocalScript работает только в местах, которые принадлежат игроку."
        },
        {
          t: "info",
          title: "Два места для LocalScript игрока",
          text: [
            "📁 **StarterPlayerScripts** — скрипт запускается **один раз**, когда игрок зашёл. Для камеры, музыки, общих систем.",
            "📁 **StarterCharacterScripts** — скрипт копируется в персонажа **после каждого возрождения**. Для бега, прыжков, эффектов на теле."
          ]
        },
        {
          t: "choice",
          q: "Скрипт бега на Shift должен работать и после смерти. Куда его?",
          opts: ["StarterCharacterScripts", "StarterPlayerScripts", "ServerStorage"],
          a: 0
        },
        {
          t: "choice",
          q: "Куда класть LocalScript для кнопок на экране?",
          opts: ["StarterGui, внутрь ScreenGui", "Workspace", "ServerScriptService"],
          a: 0
        },
        {
          t: "info",
          title: "Кто что видит",
          text: [
            "👀 **ReplicatedStorage** видят и сервер, и игроки. Сюда кладут общее.",
            "🔒 **ServerScriptService** и **ServerStorage** игрок не видит совсем. Сюда кладут секретное."
          ]
        },
        {
          t: "match",
          q: "Соедини место и что там лежит",
          pairs: [
            ["ServerScriptService", "Серверные скрипты"],
            ["StarterGui", "Интерфейс"],
            ["ReplicatedStorage", "Общее для всех"],
            ["ServerStorage", "Шаблоны для сервера"]
          ]
        },
        {
          t: "choice",
          q: "Где хранить модуль с ценами, нужный и магазину, и серверу?",
          opts: ["ReplicatedStorage", "ServerStorage", "StarterGui"],
          a: 0,
          why: "Его должны видеть обе стороны: клиент покажет цены, сервер проверит покупку."
        }
      ]
    },
    {
      id: "s-review",
      title: "Повторение: первые шаги",
      sub: "Проверь себя перед следующей веткой",
      icon: "🏁",
      slides: [
        {
          t: "info",
          title: "Время повторить!",
          text: "Сейчас будут вопросы по всей ветке. Если ошибёшься — не страшно: вопрос повторится в конце."
        },
        {
          t: "match",
          q: "Соедини понятия",
          pairs: [
            ["Explorer", "Дерево объектов"],
            ["Output", "Ошибки и print"],
            ["Сервер", "Судья игры"],
            ["Клиент", "Устройство игрока"]
          ]
        },
        {
          t: "input",
          q: "Что выведет этот код?",
          code: L`print(10 - 4)`,
          a: ["6"]
        },
        {
          t: "choice",
          q: "Какой скрипт нужен для камеры игрока?",
          opts: ["LocalScript", "Script"],
          a: 0
        },
        {
          t: "choice",
          q: "Где обычно лежит серверный Script?",
          opts: ["ServerScriptService", "ReplicatedStorage", "StarterGui"],
          a: 0
        },
        {
          t: "fill",
          q: "Выведи обычное белое сообщение в Output",
          code: L`___("Игра началась!")`,
          bank: ["print", "warn", "show"],
          a: ["print"],
          why: "`warn` тоже пишет в Output, но жёлтым — для предупреждений."
        },
        {
          t: "choice",
          q: "Ты поменял игру во время Play и нажал Stop. Что будет?",
          opts: ["Изменения пропадут", "Изменения сохранятся"],
          a: 0
        },
        {
          t: "choice",
          q: "Что игрок **не** может увидеть?",
          opts: ["Содержимое ServerStorage", "Содержимое ReplicatedStorage", "Детали в Workspace"],
          a: 0
        }
      ]
    }
  ]
});
