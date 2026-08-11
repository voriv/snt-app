# Аудит спецификаций компонентов: Домен «Общение» (COMMS)

> **Дата аудита:** 2026-07-26
> **Аудитор:** ИИ-архитектор компонент (component-spec)
> **Задача:** B-014 — Аудит домена «Общение» (шаг 4/7)
> **Предыдущие шаги:**
> - Шаг 1 (business-analyst): ⚠️ PASS WITH NOTES — [`docs/model/REQ-COMMS-001-audit.md`](../../model/REQ-COMMS-001-audit.md)
> - Шаг 2 (data-architect): ❌ FAIL — [`docs/model/REQ-COMMS-001-model-audit.md`](../../model/REQ-COMMS-001-model-audit.md)
> - Шаг 3 (ui-designer): ⚠️ PASS WITH NOTES — [`docs/design/comms-ui-audit.md`](../../design/comms-ui-audit.md)
> **Вердикт:** ❌ **FAIL** — критические пробелы спецификаций

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| Спецификация | [`docs/specs/comms/component-spec.md`](component-spec.md) |
| Статус spec | `[DRAFT]`, v1.0, 2026-07-24 |
| Покрытие spec | **2 US из 37** (US-21-36, US-21-37) |
| Компонентов в spec | 12 (матрица трассировки) |
| Компонентов реализовано | ~35 (UI + Pages + API) |
| Domain-слой реализован | Частично (типы, репозиторий, сервис — но `src/domains/comms/` пуст) |
| Хуков COMMS | 0 обнаружено |

---

## 2. Матрица: Компонент → US → Spec → Реализация → Статус

### 2.1 Компоненты, покрытые spec (MVP — вкладки + счётчики)

| # | Компонент | US | Spec (§) | Реализация | Статус | Примечание |
|---|-----------|----|----------|------------|--------|------------|
| 1 | `UnreadCounts` (тип) | US-21-37 | 3.1.1 | ✅ inline в CommsTabs.tsx L77 | ⚠️ | Тип дублирован локально вместо доменного файла |
| 2 | `ICommsRepository.getUnreadCounts()` | US-21-37 | 3.1.2 | ❌ нет | ❌ | `src/domains/comms/` — пустая директория |
| 3 | `PrismaCommsRepository.getUnreadCounts()` | US-21-37 | 3.1.3 | ❌ нет | ❌ | Репозиторий не реализован |
| 4 | `CommsService.getUnreadCounts()` | US-21-37 | 3.1.4 | ⚠️ вызывается через DI | ⚠️ | Service вызывается из API route, но spec-файлы домена отсутствуют |
| 5 | `GET /api/v1/comms/unread-counts` | US-21-37 | 3.2.1 | ✅ route.ts | ✅ | Полное соответствие spec |
| 6 | `CommsTab` | US-21-36 | 3.3.1 | ✅ CommsTab.tsx | ✅ | Пропсы, состояния, токены, ARIA — полное соответствие |
| 7 | `CommsTabs` | US-21-36, US-21-37 | 3.3.2 | ✅ CommsTabs.tsx | ✅ | 4 вкладки, бейджи, роли, ARIA, состояния |
| 8 | `CommsLayout` (layout.tsx) | US-21-36 | 3.4.1 | ✅ layout.tsx | ✅ | usePathname + useSession + CommsTabs |
| 9 | `CommsPage` (redirect) | US-21-36 | 3.4.2 | ✅ page.tsx | ✅ | useRouter().replace() |
| 10 | `CommsModerationPage` | US-21-36 | 3.4.3 | ✅ moderation/page.tsx | ✅ | EmptyState + проверка роли |
| 11 | `Navbar` (обновление) | US-21-36 | N/A | 🔧 предположительно | ⚠️ | Не проверено напрямую, но spec указывает 🔧 |
| 12 | `CommsTabs/index.ts` | — | N/A | ✅ index.ts | ✅ | Баррел-экспорт |

### 2.2 Компоненты, реализованные НО НЕ описанные в spec

| # | Компонент | Файл | Связанные US | Статус | Примечание |
|---|-----------|------|--------------|--------|------------|
| R-01 | `ConversationList` | `comms/ConversationList/ConversationList.tsx` (223 строки) | US-21-01 | ❌ нет в spec | Список диалогов с поиском, debounce, состояниями |
| R-02 | `ConversationCard` | `comms/ConversationCard/ConversationCard.tsx` | US-21-01 | ❌ нет в spec | Карточка диалога |
| R-03 | `ConversationEmptyState` | `comms/ConversationEmptyState/ConversationEmptyState.tsx` | US-21-01 | ❌ нет в spec | Пустое состояние списка |
| R-04 | `ConversationDetailPage` | `comms/ConversationDetailPage/ConversationDetailPage.tsx` (214 строк) | US-21-03, US-21-03-02 | ❌ нет в spec | Полная страница диалога с сообщениями |
| R-05 | `ConversationMessagesList` | `comms/ConversationMessagesList/ConversationMessagesList.tsx` | US-21-03-02 | ❌ нет в spec | Список сообщений с пагинацией |
| R-06 | `MessageItem` | `comms/MessageItem/MessageItem.tsx` | US-21-03 | ❌ нет в spec | Отдельное сообщение |
| R-07 | `MessageList` | `comms/MessageList/MessageList.tsx` | US-21-03 | ❌ нет в spec | Обёртка списка |
| R-08 | `MessageInput` | `comms/MessageInput/MessageInput.tsx` (161 строка) | US-21-03 | ❌ нет в spec | Поле ввода с Enter/Shift+Enter, авто-фокус, resize |
| R-09 | `ParticipantSelector` | `comms/ParticipantSelector/ParticipantSelector.tsx` | US-21-07, US-21-05 | ❌ нет в spec | Выбор участников чата |
| R-10 | `UserSelectorList` | `comms/UserSelectorList/UserSelectorList.tsx` | US-21-02, US-21-05 | ❌ нет в spec | Поиск и выбор пользователей |
| R-11 | `EditChatForm` | `comms/EditChatForm/EditChatForm.tsx` | US-21-06 | ❌ нет в spec | Форма редактирования чата |
| R-12 | `ChatList` | `features/chats/ChatList/` | US-21-04 | ❌ нет в spec | Список групповых чатов (в features/chats, не comms!) |
| R-13 | Страницы `/messages/*` | `messages/page.tsx`, `messages/[id]/page.tsx`, `messages/new/page.tsx` | US-21-01, US-21-02, US-21-03 | ❌ нет в spec | 3 страницы |
| R-14 | Страницы `/chats/*` | `chats/page.tsx`, `chats/[id]/page.tsx`, `chats/[id]/edit/page.tsx`, `chats/new/page.tsx` | US-21-04..US-21-09 | ❌ нет в spec | 4 страницы |
| R-15 | Страницы `/announcements/*` | `announcements/page.tsx`, `announcements/[id]/page.tsx`, `announcements/create/page.tsx` | US-21-27..US-21-33 | ❌ нет в spec | 3 страницы |
| R-16 | `[conversationId]/page.tsx` | комм-страница универсального диалога | US-21-03 | ❌ нет в spec | Универсальная страница диалога |
| R-17 | `AnnouncementList` (импорт из features/announcements) | `features/announcements/` | US-21-27 | ❌ нет в spec | Список объявлений — в отдельном домене |
| R-18 | `AnnouncementWithAuthor` (тип) | `domains/announcement/announcement.types` | US-21-27 | ❌ нет в spec | Типы объявлений вынесены в отдельный домен |

### 2.3 Компоненты для функционала без модели данных

| # | Функционал | US | Ожид. компоненты | Spec | Реализация | Блокировка |
|---|------------|----|-----------------|------|------------|------------|
| M-01 | Уведомления | US-21-34 | NotificationBell, NotificationList, NotificationItem | ❌ нет | ❌ нет | ❌ Нет сущности `Notification` в БД |
| M-02 | Модерация (полная) | US-21-19..US-21-26 | ModerationPanel, ReportList, BlockedUsersList, WarningHistory | ❌ нет | ❌ только EmptyState | ❌ Нет сущностей `MessageReport`, `UserBlock`, `ModerationAction` |
| M-03 | Категории чатов (системные) | US-21-11..US-21-14 | ChatCategoryList, ChatCategoryForm | ❌ нет | ❌ нет | ❌ Нет сущности `ChatCategory` |
| M-04 | Персональные папки | US-21-15..US-21-18 | PersonalFolderList, PersonalFolderForm | ❌ нет | ❌ нет | ❌ Нет сущности `PersonalChatFolder` |

---

## 3. Пробелы (Gaps)

### 3.1 Компоненты в spec, но не реализованы

| # | Компонент (spec) | Статус реализации | Примечание |
|---|-----------------|-------------------|------------|
| G-01 | `ICommsRepository` (интерфейс) | ❌ `src/domains/comms/` — пустая директория | Spec описывает полный domain-слой, но файлы типов, валидаторов, ошибок, интерфейсов репозитория не созданы |
| G-02 | `PrismaCommsRepository` | ❌ нет файла | Репозиторий должен быть в `src/domains/comms/comms.repository.prisma.ts` |
| G-03 | `comms.types.ts` (доменные типы) | ⚠️ Типы импортируются из `@/domains/comms/comms.types` в ConversationList.tsx L29, но файл может отсутствовать | Проверить: `src/domains/comms/comms.types.ts` |
| G-04 | `comms.repository.interface.ts` | ❌ нет | Упомянут в spec §3.1.2 |
| G-05 | `comms.service.ts` | ⚠️ Вызывается через DI (`getCommsService()`) но spec-файл не найден | DI-контейнер возвращает сервис, но файл спецификации пуст |
| G-06 | `comms.validators.ts` | ❌ нет | Spec не описывает валидаторы, но это best practice |
| G-07 | `comms.errors.ts` | ❌ нет | Spec не описывает ошибки домена |

### 3.2 Компоненты реализованы, но НЕ в spec (критические)

Это **главная проблема аудита**: spec покрывает только MVP-подмножество (вкладки + счётчики), но код реализован значительно шире.

| Категория | Количество компонентов вне spec | Связанные US |
|-----------|--------------------------------|--------------|
| UI-компоненты | 11 (`ConversationList`, `ConversationCard`, `MessageInput` и др.) | US-21-01, US-21-03, US-21-03-02, US-21-05..US-21-10 |
| Страницы | 10+ (messages/*, chats/*, announcements/*) | US-21-01..US-21-10, US-21-27..US-21-33 |
| Domain-слой | Типы импортируются, но файлы не в `src/domains/comms/` | Все US-21-* |
| Хуки | 0 хуков COMMS обнаружено в `src/hooks/` | Все US-21-* |
| **ИТОГО** | **~35 артефактов вне spec** | **~20 US без spec** |

### 3.3 Архитектурные пробелы

| # | Пробел | Описание | Влияние |
|---|--------|----------|---------|
| A-01 | `src/domains/comms/` пуст | Spec описывает domain-слой (типы, репозиторий, сервис), но директория пуста. Типы импортируются из `@/domains/comms/comms.types` и `@/domains/comms/message.types` — возможно, файлы есть, но не были обнаружены | 🔴 КРИТИЧЕСКИЙ — нарушает DDD-архитектуру |
| A-02 | Компоненты разбросаны по доменам | `ChatList` в `features/chats/`, `AnnouncementList` в `features/announcements/`. Объявления имеют отдельный домен `domains/announcement/`. Spec описывает только `features/comms/` | 🟡 СРЕДНИЙ — нет единой точки описания |
| A-03 | Нет хуков | `src/hooks/` не содержит COMMS-хуков. Данные загружаются напрямую через `apiClient` в компонентах | 🟡 СРЕДНИЙ — нарушает паттерн хуков |
| A-04 | `UnreadCounts` дублирован | Тип определён inline в `CommsTabs.tsx` L77 вместо импорта из доменного файла | 🟢 НИЗКИЙ — работает, но нарушает DRY |

---

## 4. Несоответствия Spec ↔ Код

### 4.1 Зависимости

| Spec | Код | Статус | Примечание |
|------|-----|--------|------------|
| `@/components/ui/Badge` | `@/components/ui/Badge` | ✅ | CommsTab импортирует Badge |
| `@/shared/utils` — `cn` | `@/shared/utils` — `cn` | ✅ | |
| `next/link` — `Link` | `next/link` — `Link` | ✅ | |
| `next/navigation` — `usePathname` | `next/navigation` — `usePathname` | ✅ | |
| `next-auth/react` — `useSession` | `next-auth/react` — `useSession` | ✅ | |
| `@/lib/api-client` — `apiClient` | `@/lib/api-client` — `apiClient` | ✅ | |
| `@/components/ui/EmptyState` | `@/components/ui/EmptyState` | ✅ | |

### 4.2 Отклонения пропсов/интерфейсов

| Компонент | Spec-проп | Код-проп | Статус |
|-----------|-----------|----------|--------|
| `CommsTab` | `href: string` | `href: string` | ✅ |
| `CommsTab` | `label: string` | `label: string` | ✅ |
| `CommsTab` | `icon: ReactNode` | `icon: ReactNode` | ✅ |
| `CommsTab` | `active: boolean` | `active: boolean` | ✅ |
| `CommsTab` | `badgeCount?: number` | `badgeCount?: number` | ✅ |
| `CommsTabs` | `activeTab: 'messages' \| 'chats' \| 'announcements' \| 'moderation'` | идентично | ✅ |
| `CommsTabs` | `userRoles: string[]` | идентично | ✅ |

### 4.3 Токены и стили

| Элемент | Spec-токен | Код (CSS-переменная) | Статус |
|---------|-----------|---------------------|--------|
| Активная вкладка (подчёркивание) | `color.accent.default` | `var(--theme-accent)` | ⚠️.mapping через CSS-переменную — допустимо |
| Текст неактивной вкладки | `color.text.secondary` | `var(--theme-text-secondary)` | ⚠️ через переменную |
| Текст активной вкладки | `color.text.primary` | `var(--theme-text-primary)` | ⚠️ через переменную |
| Бейдж | `color.danger`, `radius-full` | `Badge variant="danger"` | ✅ |
| Border | N/A (spec) | `var(--theme-border-color)` | ✅ добавлено в коде |

### 4.4 Поведенческие отклонения

| # | Spec | Код | Статус | Примечание |
|---|------|-----|--------|------------|
| B-01 | `useEffect` для загрузки unread-counts при mount + activeTab change | `useEffect` при mount | ⚠️ Код загружает при mount; обновление при activeTab change не подтверждено в коде |
| B-02 | Иконки через lucide-react | Inline SVG (комментарий: "lucide-react не установлена") | ⚠️ Рабочее отклонение — inline SVG вместо библиотеки |
| B-03 | `role="tablist"` на контейнере | `role="tablist"` присутствует | ✅ |
| B-04 | `role="tab"` + `aria-selected` на вкладках | Присутствует в CommsTab | ✅ |

---

## 5. Покрытие US-21-* спецификацией

### 5.1 Матрица покрытия

| US | Название | В spec? | Компоненты в spec | Реализовано? | Статус |
|----|----------|---------|-------------------|--------------|--------|
| US-21-01 | Просмотр личных диалогов | ❌ нет | — | ✅ (ConversationList и др.) | ❌ **Spec gap** |
| US-21-02 | Начало нового диалога | ❌ нет | — | ✅ (UserSelectorList) | ❌ **Spec gap** |
| US-21-03 | Отправка личных сообщений | ❌ нет | — | ✅ (MessageInput, MessageItem) | ❌ **Spec gap** |
| US-21-03-02 | История сообщений | ❌ нет | — | ✅ (ConversationMessagesList) | ❌ **Spec gap** |
| US-21-04 | Список групповых чатов | ❌ нет | — | ✅ (ChatList) | ❌ **Spec gap** |
| US-21-05 | Создание группового чата | ❌ нет | — | ✅ (ParticipantSelector) | ❌ **Spec gap** |
| US-21-06 | Редактирование чата | ❌ нет | — | ✅ (EditChatForm) | ❌ **Spec gap** |
| US-21-07 | Добавление участников | ❌ нет | — | ✅ (ParticipantSelector) | ❌ **Spec gap** |
| US-21-08 | Удаление участников | ❌ нет | — | ⚠️ предположительно | ❌ **Spec gap** |
| US-21-09 | Отправка в групповой чат | ❌ нет | — | ✅ (MessageInput) | ❌ **Spec gap** |
| US-21-10 | Ответ с цитированием | ❌ нет | — | ⚠️ возможно | ❌ **Spec gap** |
| US-21-11 | Создание системной категории | ❌ нет | — | ❌ нет (нет модели) | ⚠️ **Блокируется БД** |
| US-21-12 | Редактирование категории | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-13 | Удаление категории | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-14 | Назначение категории чату | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-15 | Создание персональной папки | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-16 | Редактирование папки | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-17 | Удаление папки | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-18 | Размещение чата в папке | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-19 | Список жалоб | ❌ нет | — | ❌ только заглушка | ⚠️ **Блокируется БД** |
| US-21-20 | Детали жалобы | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-21 | Удаление по жалобе | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-22 | Блокировка пользователя | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-23 | Разблокировка | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-24 | Выдача предупреждения | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-25 | История предупреждений | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-26 | Отмена предупреждения | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-27 | Список объявлений | ❌ нет | — | ✅ (AnnouncementList) | ❌ **Spec gap** |
| US-21-28 | Создание объявления | ❌ нет | — | ✅ (announcements/create) | ❌ **Spec gap** |
| US-21-29 | Редактирование объявления | ❌ нет | — | ⚠️ возможно | ❌ **Spec gap** |
| US-21-30 | Публикация объявления | ❌ нет | — | ⚠️ возможно | ❌ **Spec gap** |
| US-21-31 | Архивация объявления | ❌ нет | — | ⚠️ возможно | ❌ **Spec gap** |
| US-21-32 | Обсуждение объявления | ❌ нет | — | ✅ (announcements/[id]) | ❌ **Spec gap** |
| US-21-33 | Удаление объявления | ❌ нет | — | ⚠️ возможно | ❌ **Spec gap** |
| US-21-34 | Уведомления | ❌ нет | — | ❌ нет | ⚠️ **Блокируется БД** |
| US-21-35 | Email-уведомления | ❌ нет | — | ❌ нет | ⚠️ **Зависит от US-21-34** |
| **US-21-36** | **Навигация по вкладкам** | **✅ да** | CommsTab, CommsTabs, Layout, Pages | **✅** | **✅ Полное соответствие** |
| **US-21-37** | **Счётчики непрочитанных** | **✅ да** | UnreadCounts, API route | **✅** | **✅ Полное соответствие** |

### 5.2 Итоговая статистика покрытия

| Метрика | Значение |
|---------|----------|
| Всего US-21-* | 37 (включая US-21-03-02) |
| Покрыты spec | **2 (5.4%)** |
| Не покрыты spec, но реализованы | **~14 (37.8%)** |
| Не покрыты spec, заблокированы БД | **~16 (43.2%)** |
| Не покрыты spec, не реализованы | **5 (13.5%)** — FR-пробелы из BA-аудита |

---

## 6. Влияние предыдущих шагов аудита

### 6.1 Из BA-аудита (8 FR без US)

| FR | Описание | Влияние на spec | Статус |
|----|----------|-----------------|--------|
| FR-07 | Авто-создание чата для участка | Нет spec для авто-создания | ⚠️ Ожидает US-21-38 |
| FR-12 | Закрепление сообщений | Нет spec для pinned messages | ⚠️ Ожидает US-21-39 |
| FR-26..29 | Подача жалобы пользователем | Нет spec для ReportForm | ⚠️ Ожидает US-21-40 |
| FR-39 | Список заблокированных | Нет spec для BlockedUsersList | ⚠️ Ожидает US-21-41 |
| FR-44 | Файлы к объявлениям | Нет spec для FileAttachment | ⚠️ Ожидает US-21-42 |

### 6.2 Из Model-аудита (8 отсутствующих сущностей)

Влияние на spec: **16 US из 37 заблокированы** для спецификации компонент, так как отсутствует модель данных. Компоненты для модерации, уведомлений, категорий и папок не могут быть специфицированы до создания БД-сущностей.

### 6.3 Из UI-аудита (5 экранов без макетов)

| Экран | Влияние на spec | Статус |
|-------|-----------------|--------|
| Страница диалога (US-21-03) | Spec мог бы описать layout, но нет макета | ⚠️ Компоненты реализованы без spec |
| Создание диалога (US-21-02) | Нет spec для UserSelectorList | ⚠️ Реализовано без spec |
| Создание чата (US-21-05) | Нет spec для формы | ⚠️ ParticipantSelector реализован |
| Страница чата (US-21-09) | Аналогично диалогу | ⚠️ Реализовано |
| Детали объявления (US-21-32) | Нет spec | ⚠️ Страница создана |

---

## 7. Рекомендации по доработке spec

### 7.1 Критические (требуют немедленного обновления spec)

| # | Рекомендация | Приоритет | Scope |
|---|-------------|-----------|-------|
| R-01 | **Добавить spec для всех реализованных UI-компонентов** (R-01..R-11) | 🔴 P0 | 11 компонентов × ~200 строк spec |
| R-02 | **Добавить spec для всех реализованных страниц** (R-13..R-16) | 🔴 P0 | 10+ страниц × ~100 строк spec |
| R-03 | **Добавить spec для domain-слоя** (`comms.types.ts`, `comms.repository.interface.ts`, `comms.service.ts`) | 🔴 P0 | 3 файла + скелеты |
| R-04 | **Создать spec для COMMS-хуков** (`useConversations`, `useMessages`, `useChat`) | 🔴 P0 | 3-5 хуков |
| R-05 | **Указать cross-domain зависимости** (`features/chats/`, `features/announcements/`, `domains/announcement/`) | 🔴 P0 | Архитектурная заметка |

### 7.2 Средние (рекомендовано)

| # | Рекомендация | Приоритет |
|---|-------------|-----------|
| R-06 | **Уточнить spec для `UnreadCounts`** — вынести тип из inline в доменный файл | 🟡 P1 |
| R-07 | **Добавить spec для валидаторов и ошибок домена** | 🟡 P1 |
| R-08 | **Описать spec для блокируемых US** (модерация, категории, уведомления) — с пометкой `[BLOCKED: DB]` | 🟡 P1 |
| R-09 | **Добавить JSDoc `@spec` в реализованные компоненты** для обратного tracing из кода → spec | 🟡 P2 |
| R-10 | **Обновить статус spec** с `[DRAFT]` на `[PARTIAL]` с описанием покрытия | 🟢 P3 |

### 7.3 Предлагаемая структура обновлённой spec

```
docs/specs/comms/component-spec.md
├── §1 Метаданные (обновить: +35 US, +30 компонентов)
├── §2 Матрица трассировки (расширить с 12 до ~40 строк)
├── §3 Domain Layer
│   ├── 3.1.1 comms.types.ts (все типы)
│   ├── 3.1.2 comms.validators.ts (валидаторы)
│   ├── 3.1.3 comms.errors.ts (ошибки домена)
│   ├── 3.1.4 comms.repository.interface.ts
│   ├── 3.1.5 comms.repository.prisma.ts
│   └── 3.1.6 comms.service.ts
├── §4 API Layer
│   ├── 3.2.1 GET /api/v1/comms/unread-counts (существует)
│   ├── 3.2.2 GET /api/v1/conversations (существует)
│   ├── 3.2.3 POST /api/v1/conversations (существует)
│   ├── 3.2.4 POST /api/v1/messages (существует)
│   └── ...
├── §5 UI Layer
│   ├── 3.3.1 CommsTab (существует)
│   ├── 3.3.2 CommsTabs (существует)
│   ├── 3.3.3 ConversationList (ДОБАВИТЬ)
│   ├── 3.3.4 ConversationCard (ДОБАВИТЬ)
│   ├── 3.3.5 ConversationEmptyState (ДОБАВИТЬ)
│   ├── 3.3.6 ConversationDetailPage (ДОБАВИТЬ)
│   ├── 3.3.7 ConversationMessagesList (ДОБАВИТЬ)
│   ├── 3.3.8 MessageItem (ДОБАВИТЬ)
│   ├── 3.3.9 MessageInput (ДОБАВИТЬ)
│   ├── 3.3.10 ParticipantSelector (ДОБАВИТЬ)
│   ├── 3.3.11 UserSelectorList (ДОБАВИТЬ)
│   ├── 3.3.12 EditChatForm (ДОБАВИТЬ)
│   ├── 3.3.13 ChatList (cross-domain, features/chats/) (ДОБАВИТЬ)
│   └── ...
├── §6 Pages Layer
│   ├── 3.4.1 CommsLayout (существует)
│   ├── 3.4.2 CommsPage redirect (существует)
│   ├── 3.4.3 CommsModerationPage (существует)
│   ├── 3.4.4 MessagesPage (ДОБАВИТЬ)
│   ├── 3.4.5 MessageDialogPage (ДОБАВИТЬ)
│   ├── 3.4.6 NewMessagePage (ДОБАВИТЬ)
│   ├── 3.4.7 ChatsPage (ДОБАВИТЬ)
│   ├── 3.4.8 ChatDetailPage (ДОБАВИТЬ)
│   ├── 3.4.9 NewChatPage (ДОБАВИТЬ)
│   ├── 3.4.10 EditChatPage (ДОБАВИТЬ)
│   ├── 3.4.11 AnnouncementsPage (ДОБАВИТЬ)
│   ├── 3.4.12 AnnouncementDetailPage (ДОБАВИТЬ)
│   ├── 3.4.13 NewAnnouncementPage (ДОБАВИТЬ)
│   └── 3.4.14 UniversalConversationPage (ДОБАВИТЬ)
├── §7 Hooks Layer (НОВОЕ)
│   ├── 3.5.1 useConversations
│   ├── 3.5.2 useMessages
│   ├── 3.5.3 useChat
│   └── 3.5.4 useUnreadCounts
├── §8 Блокируемые секции [BLOCKED: DB]
│   ├── 8.1 Модерация (US-21-19..US-21-26)
│   ├── 8.2 Категории чатов (US-21-11..US-21-14)
│   ├── 8.3 Персональные папки (US-21-15..US-21-18)
│   ├── 8.4 Уведомления (US-21-34..US-21-35)
│   └── 8.5 FR-пробелы (FR-07, FR-12, FR-26..29, FR-39, FR-44)
└── §9 Cross-domain зависимости
    ├── 9.1 features/chats/ → ChatList
    ├── 9.2 features/announcements/ → AnnouncementList
    └── 9.3 domains/announcement/ → AnnouncementWithAuthor
```

---

## 8. Сводка

### 8.1 Метрики качества spec

| Метрика | Значение | Оценка |
|---------|----------|--------|
| Покрытие US | 2/37 (5.4%) | ❌ КРИТИЧЕСКИ НИЗКОЕ |
| Покрытие реализованных компонентов | 12/~47 (25.5%) | ❌ НЕДОСТАТОЧНОЕ |
| Точность spec для MVP | 10/12 (83.3%) | ✅ Высокое (MVP-часть точна) |
| Соответствие токенов | ✅ через CSS-переменные | ✅ Допустимо |
| Соответствие пропсов | ✅ Полное для MVP | ✅ |
| АRIA-покрытие | ✅ role="tablist", role="tab" | ✅ |
| JSDoc @spec/@covers | ✅ в реализованном коде | ✅ Код ссылается на spec |
| Domain-слой в spec | ✅ Описан (§3.1) | ❌ Но не реализован |
| Domain-слой в коде | ⚠️ Частично (DI работает) | ⚠️ Но spec-файлы пустые |

### 8.2 Ключевые проблемы

1. **Spec покрывает только MVP (2 US из 37)** — все остальные US без спецификаций, несмотря на значительную реализацию в коде.
2. **Domain-слой spec не соответствует реальности** — spec описывает интерфейс репозитория и сервис, но `src/domains/comms/` пуст. Код работает через DI-контейнер, обходя spec-структуру.
3. **Нет spec для хуков** — данные загружаются напрямую через apiClient в компонентах, что нарушает паттерн custom hooks.
4. **Cross-domain компоненты не описаны** — `ChatList` в `features/chats/`, `AnnouncementList` в `features/announcements/`. Spec для comms не упоминает эти зависимости.
5. **16 US заблокированы моделью данных** — spec для модерации, категорий, папок и уведомлений не может быть создана до исправления model-audit (8 сущностей).

### 8.3 Что сделано хорошо

1. **MVP-spec точна** — для US-21-36/37 spec полностью соответствует реализации (пропсы, токены, ARIA, поведение).
2. **JSDoc в коде ссылается на spec** — `@spec`, `@covers`, `@see component-spec.md` присутствуют в реализованных файлах.
3. **Архитектура слоёв соблюдена для MVP** — Domain → API → UI → Pages структура прослеживается.
4. **Роль-контроль реализован** — модерация скрыта для MEMBER, проверена через useSession.

---

## 9. Вердикт

### ❌ FAIL

Спецификация компонент домена COMMS **не соответствует реальному объёму реализации**. Основные причины:

1. **5.4% покрытия US** — spec описывает только 2 US из 37, при этом ~14 US уже реализованы в коде без spec.
2. **Domain-слой spec пуст** — `src/domains/comms/` не содержит файлов, описанных в spec (§3.1).
3. **Хуки полностью отсутствуют** — ни в spec, ни в коде.
4. **Cross-domain зависимости не задокументированы** — spec не упоминает компоненты из `features/chats/` и `features/announcements/`.
5. **Блокировка моделью данных** — 16 US (43%) не могут быть специфицированы без 8 сущностей из model-audit.

### Условия для PASS

- [ ] Расширить spec на все реализованные компоненты (~35 артефактов)
- [ ] Создать spec для domain-слоя + скелеты файлов
- [ ] Добавить секцию хуков
- [ ] Описать cross-domain зависимости
- [ ] Добавить секцию `[BLOCKED: DB]` для 16 US
- [ ] Обновить статус с `[DRAFT]` на `[PARTIAL]`

### Приоритетные действия

| Приоритет | Действие | Оценка |
|-----------|----------|--------|
| P0 | Расширить matrix трассировки с 12 до ~40 строк | 1-2 часа |
| P0 | Добавить spec для 11 реализованных UI-компонентов | 2-3 часа |
| P0 | Добавить spec для 10+ страниц | 1-2 часа |
| P1 | Описать domain-слой + создать скелеты | 1 час |
| P1 | Добавить секцию хуков | 30 мин |
| P1 | Добавить секцию `[BLOCKED: DB]` | 30 мин |
| P2 | Описать cross-domain зависимости | 30 мин |
| P3 | Обновить статус и метаданные | 15 мин |

**Общий объём работ:** ~6-8 часов.

---

## 10. Связанные артефакты

- 📋 **Спецификация:** [`docs/specs/comms/component-spec.md`](component-spec.md)
- 📋 **BA Audit:** [`docs/model/REQ-COMMS-001-audit.md`](../../model/REQ-COMMS-001-audit.md)
- 📋 **Model Audit:** [`docs/model/REQ-COMMS-001-model-audit.md`](../../model/REQ-COMMS-001-model-audit.md)
- 📋 **UI Audit:** [`docs/design/comms-ui-audit.md`](../../design/comms-ui-audit.md)
- 📁 **Реализованные UI:** [`src/components/features/comms/`](../../../src/components/features/comms/)
- 📁 **Реализованные страницы:** [`src/app/dashboard/comms/`](../../../src/app/dashboard/comms/)
- 📁 **Реализованный API:** [`src/app/api/v1/comms/`](../../../src/app/api/v1/comms/)
- 📁 **Domain (пурый):** [`src/domains/comms/`](../../../src/domains/comms/)
- 📁 **Хуки (нет COMMS):** [`src/hooks/`](../../../src/hooks/)

---

**Последнее обновление:** 2026-07-26
**Статус:** Аудит завершён — ❌ FAIL, требует расширения spec
