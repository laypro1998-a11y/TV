// Структура курса. Чтобы добавить урок: создай файл lessons/<slug>.html
// и допиши его сюда в нужный модуль.
window.COURSE = [
  {
    title: "Старт",
    emoji: "🚀",
    desc: "Знакомимся с Roblox Studio и разбираемся, какие бывают скрипты и куда их класть.",
    lessons: [
      { slug: "intro", title: "Roblox Studio и первый скрипт" },
      { slug: "script-types", title: "Script, LocalScript, ModuleScript: куда что класть" }
    ]
  },
  {
    title: "Основы Luau",
    emoji: "🧱",
    desc: "Сам язык: переменные, условия, циклы, функции и таблицы. Всё на примерах из игр.",
    lessons: [
      { slug: "variables", title: "Переменные и типы данных" },
      { slug: "operators-strings", title: "Операторы, математика и строки" },
      { slug: "conditions", title: "Условия: if, and, or, not" },
      { slug: "loops", title: "Циклы: for, while, repeat" },
      { slug: "functions", title: "Функции" },
      { slug: "tables", title: "Таблицы: массивы и словари" }
    ]
  },
  {
    title: "Код и игровой мир",
    emoji: "🌍",
    desc: "Управляем объектами в игре: детали, позиции, события, сервисы и игроки.",
    lessons: [
      { slug: "instances", title: "Объекты игры: Instance и иерархия" },
      { slug: "vectors-cframe", title: "Позиция и поворот: Vector3, CFrame, Color3" },
      { slug: "events", title: "События: Connect, Touched и debounce" },
      { slug: "services-task", title: "Сервисы, task и RunService" },
      { slug: "players-characters", title: "Игроки, персонажи и leaderstats" },
      { slug: "interaction", title: "ClickDetector, ProximityPrompt и TweenService" }
    ]
  },
  {
    title: "Клиент, сервер и интерфейс",
    emoji: "🖥️",
    desc: "Самое важное для настоящих игр: как клиент и сервер общаются и как делать интерфейс.",
    lessons: [
      { slug: "client-server", title: "Клиент и сервер: кто что видит" },
      { slug: "local-scripts", title: "LocalScript: клавиши, камера, локальный игрок" },
      { slug: "gui", title: "Интерфейс (GUI)" },
      { slug: "remotes", title: "RemoteEvent и RemoteFunction" },
      { slug: "modules", title: "ModuleScript и require" }
    ]
  },
  {
    title: "Уровень профи",
    emoji: "🏆",
    desc: "ООП, типизация, сохранение данных и архитектура проекта, как в больших играх.",
    lessons: [
      { slug: "oop", title: "Метатаблицы и ООП" },
      { slug: "types", title: "Типизация Luau" },
      { slug: "datastores", title: "DataStore: сохранение прогресса" },
      { slug: "architecture", title: "Архитектура, безопасность и отладка" }
    ]
  },
  {
    title: "Проекты",
    emoji: "🎮",
    desc: "Собираем всё вместе в двух полноценных игровых системах.",
    lessons: [
      { slug: "project-simulator", title: "Проект: симулятор с магазином" },
      { slug: "project-pvp", title: "Проект: PvP-оружие" }
    ]
  }
];
