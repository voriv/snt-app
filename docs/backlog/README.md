# Система глобального беклога

> Единый источник истины для задач в проекте.  
> Любой Roo-агент и человек могут читать и обновлять беклог.

---

## 📁 Структура

```
docs/backlog/
├── README.md                       # Этот файл — документация системы
├── backlog.yaml                    # Основной файл с активными задачами
├── pipeline-state.md               # Текущее состояние пайплайна (кто чем занят)
├── tags.yaml                       # Справочник эпиков и тегов
├── archive/
│   └── completed-2026-07-27.yaml   # Архив завершённых задач (12 шт.)
└── .backlog.lock                   # Lock-файл (авто, не редактировать вручную)
```

---

## 🚀 Быстрый старт

### Для человека

Просмотр всех задач:
```bash
node scripts/backlog.js list
```

Посмотреть только активные:
```bash
node scripts/backlog.js list --status todo --priority high
```

Добавить новую задачу:
```bash
node scripts/backlog.js add --title "Новая фича" --priority high --epic COMMS
```

Сгенерировать Markdown-отчёт:
```bash
node scripts/backlog.js report
```

### Для Roo-агента

Получить следующую задачу:
```bash
node scripts/backlog.js next --format json
```

Обновить статус после завершения шага:
```bash
node scripts/backlog.js update B-NNN --phase code --status in_progress
```

Отметить задачу как выполненную:
```bash
node scripts/backlog.js done B-NNN
```

---

## 📋 Формат задачи в `backlog.yaml`

```yaml
- id: "B-NNN"
  title: "Название задачи"
  description: "Описание"
  priority: "critical"    # critical | high | medium | low | backlog
  status: "todo"          # todo | in_progress | review | done | blocked | cancelled
  phase: "req"            # idea | req | us | model | plan | design | spec | code | test | doc | done
  epic: "COMMS"           # AUTH | ROLES | PLOTS | PLOTUSER | PROFILE | USERS | COMMS | DOCS | PAYMENTS | NAV | INFRA
  labels: ["api", "ui"]   # security | breaking | ui | api | db | bug | tech-debt | docs | test | performance
  depends: ["B-001"]      # ID задач, которые должны быть выполнены перед этой
  blocker_reason: "..."   # Причина блокировки (только если status: blocked)
  artifacts:
    requirements: ["REQ-XXXX-001"]
    user_stories: ["US-NN"]
    model: ["entity-name"]
  created: "2026-07-25"
  updated: "2026-07-25"
  completed: "2026-07-25"  # Только если status: done
```

---

## 🔄 Жизненный цикл задачи

```
idea → req → us → model → plan → design → spec → code → test → doc → done
```

Каждой фазе соответствует режим, который её выполняет:

| Фаза | Режим | Что делает |
|------|-------|-----------|
| `idea` | — | Идея зафиксирована, не начата |
| `req` | `business-analyst` | Создаёт REQ |
| `us` | `product-owner` | Создаёт User Stories |
| `model` | `data-architect` | Проектирует модель данных |
| `plan` | `planner` | Создаёт план реализации |
| `design` | `ui-designer` | Создаёт макет UI |
| `spec` | `component-spec` | Создаёт спецификации и скелеты |
| `code` | `code-*` | Пишет код |
| `test` | `qa-engineer` | Пишет тесты |
| `doc` | `tech-writer` | Обновляет документацию |
| `done` | — | Задача выполнена |

---

## 📊 Статусы задач

| Статус | Иконка | Значение |
|--------|--------|----------|
| `todo` | ⏳ | Готова к работе |
| `in_progress` | 🔄 | Выполняется |
| `review` | 👁️ | Ожидает проверки |
| `done` | ✅ | Завершена |
| `blocked` | 🚫 | Заблокирована (см. `blocker_reason`) |
| `cancelled` | ❌ | Отменена |

---

## 🔗 Приоритеты

| Priority | Иконка | Описание |
|----------|--------|----------|
| `critical` | 🔴 | Блокирует другие задачи |
| `high` | 🟠 | Текущий спринт |
| `medium` | 🟡 | Следующий спринт |
| `low` | 🟢 | Можно отложить |
| `backlog` | ⚪ | Идея, не оценена |

---

## 🏷️ Эпики

| Эпик | Описание |
|------|----------|
| `AUTH` | Аутентификация и авторизация |
| `ROLES` | Роли и доступ (RBAC) |
| `PROFILE` | Профиль пользователя |
| `NAV` | Навигация и структура |
| `PLOTS` | Управление участками |
| `PLOTUSER` | Связи пользователей с участками |
| `COMMS` | Система общения |
| `USERS` | Пользователи (администрирование) |
| `DOCS` | Документы |
| `PAYMENTS` | Платежи и задолженность |
| `INFRA` | Инфраструктура |

---

## 🛠️ CLI-команды (`scripts/backlog.js`)

| Команда | Описание | Пример |
|---------|----------|--------|
| `list` | Список задач | `node scripts/backlog.js list --status todo` |
| `next` | Следующая задача | `node scripts/backlog.js next` |
| `update` | Обновить поля | `node scripts/backlog.js update B-010 --status in_progress` |
| `done` | Завершить задачу | `node scripts/backlog.js done B-010` |
| `add` | Добавить задачу | `node scripts/backlog.js add --title "..." --priority high` |
| `report` | Markdown-отчёт | `node scripts/backlog.js report` |
| `validate` | Проверить целостность | `node scripts/backlog.js validate` |

Полный help: `node scripts/backlog.js help`

---

## 📝 Как добавить задачу в беклог

### Способ 1: Через CLI
```bash
node scripts/backlog.js add \
  --title "Чат-бот для уведомлений" \
  --description "Telegram-бот для отправки уведомлений о задолженности" \
  --priority low \
  --epic COMMS \
  --labels "api"
```

### Способ 2: Вручную в `backlog.yaml`
Просто добавьте новый блок в секцию `tasks:` в формате, описанном выше.

---

## 🔒 Lock-файл

Файл `.backlog.lock` автоматически создаётся CLI при мутирующих операциях (update, done, add) для предотвращения конфликтов при параллельной записи. Lock живёт 30 секунд.

**Не редактируйте `.backlog.lock` вручную.** Если блокировка зависла — удалите файл.

---

## 🚨 Возможные проблемы

| Проблема | Решение |
|----------|---------|
| `backlog.js` пишет «Беклог пуст» | Добавьте задачу через `add` или вручную в `backlog.yaml` |
| `backlog.js` не находит задачу | Проверьте ID: `node scripts/backlog.js list` |
| Lock-файл блокирует запись | Удалите `docs/backlog/.backlog.lock` |
| YAML сломан после ручного редактирования | Выполните `node scripts/backlog.js validate` |
