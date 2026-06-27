# Домены модели данных

> 📌 Документ описывает домены предметной области, их сущности, связи и индексы.
> Для общих правил см. [`data-model-rules.md`](data-model-rules.md).

---

## Содержание

- [1. Domain: Core](#1-domain-core)
- [2. Domain: Accounting](#2-domain-accounting)
- [3. Domain: Documents](#3-domain-documents)
- [4. Domain: Voting](#4-domain-voting)
- [5. Domain: Social](#5-domain-social)
- [6. Междоменные связи](#6-междоменные-связи)
- [7. Индексы по доменам](#7-индексы-по-доменам)

---

## 1. Domain: Core

**Назначение:** Базовые сущности пользователей, участников и участков.

| Файл | Описание |
|------|----------|
| [`core.dbml`](core.dbml) | DBML спецификация |
| [`core.md`](core.md) | Описание сущностей |

### Сущности

| Модель | Таблица | Описание |
|--------|---------|----------|
| `User` | `users` | Пользователь системы |
| `Member` | `members` | Профиль садовода |
| `Plot` | `plots` | Садовый участок |
| `PlotMembership` | `plot_memberships` | Связь участника с участком |

### Ключевые связи

- `User` 1:1 `Member` — каждый пользователь должен иметь профиль участника
- `Member` 1:N `PlotMembership` — участник может иметь несколько участков
- `Plot` 1:N `PlotMembership` — участок может иметь несколько владельцев

---

## 2. Domain: Accounting

**Назначение:** Финансовые операции, начисления и платежи.

| Файл | Описание |
|------|----------|
| [`accounting.dbml`](accounting.dbml) | DBML спецификация |
| [`accounting.md`](accounting.md) | Описание сущностей |

### Сущности

| Модель | Таблица | Описание |
|--------|---------|----------|
| `Charge` | `charges` | Начисление |
| `Payment` | `payments` | Платёж |

### Ключевые связи

- `Plot` 1:N `Charge` — на участке могут быть начисления
- `Member` 1:N `Payment` — участник может платить
- `Charge` 1:N `Payment` — начисление может быть частично оплачено

---

## 3. Domain: Documents

**Назначение:** Хранение и управление документами.

| Файл | Описание |
|------|----------|
| [`documents.dbml`](documents.dbml) | DBML спецификация |
| [`documents.md`](documents.md) | Описание сущностей |

### Сущности

| Модель | Таблица | Описание |
|--------|---------|----------|
| `File` | `files` | Бинарный файл |
| `Document` | `documents` | Документ с метаданными |
| `InfoPage` | `info_pages` | Статическая информационная страница |

### Ключевые связи

- `File` 1:N `Document` — файл может быть связан с документами
- `User` 1:N `Document` — пользователь загружает документы

---

## 4. Domain: Voting

**Назначение:** Проведение голосований и учёт результатов.

| Файл | Описание |
|------|----------|
| [`voting.dbml`](voting.dbml) | DBML спецификация |
| [`voting.md`](voting.md) | Описание сущностей |

### Сущности

| Модель | Таблица | Описание |
|--------|---------|----------|
| `Vote` | `votes` | Голосование |
| `VoteOption` | `vote_options` | Вариант ответа |
| `VoteResponse` | `vote_responses` | Ответ пользователя |

### Ключевые связи

- `Vote` 1:N `VoteOption` — голосование имеет варианты ответов
- `VoteOption` 1:N `VoteResponse` — вариант может получить ответы
- `User` 1:N `VoteResponse` — пользователь голосует

---

## 5. Domain: Social

**Назначение:** Общение, форум, чаты и уведомления.

| Файл | Описание |
|------|----------|
| [`social.dbml`](social.dbml) | DBML спецификация |
| [`social.md`](social.md) | Описание сущностей |

### Сущности

| Модель | Таблица | Описание |
|--------|---------|----------|
| `ForumTopic` | `forum_topics` | Тема форума |
| `ForumPost` | `forum_posts` | Сообщение в теме |
| `Chat` | `chats` | Чат |
| `ChatParticipant` | `chat_participants` | Участник чата |
| `ChatMessage` | `chat_messages` | Сообщение в чате |
| `Notification` | `notifications` | Уведомление |
| `Announcement` | `announcements` | Объявление |

### Ключевые связи

- `ForumTopic` 1:N `ForumPost` — тема содержит посты
- `Chat` 1:N `ChatMessage` — чат содержит сообщения
- `Chat` N:M `User` через `ChatParticipant` — участники чата
- `User` 1:N `Notification` — пользователь получает уведомления

---

## 6. Междоменные связи

| Модель A | Домен A | Связь | Модель B | Домен B | Тип |
|----------|---------|-------|----------|---------|-----|
| `User` | Core | 1:1 | `Member` | Core | Внутренняя связь |
| `Member` | Core | 1:N | `Payment` | Accounting | Прямая ссылка |
| `Plot` | Core | 1:N | `Charge` | Accounting | Прямая ссылка |
| `User` | Core | 1:N | `Document` | Documents | Прямая ссылка |
| `User` | Core | 1:N | `VoteResponse` | Voting | Прямая ссылка |
| `User` | Core | 1:N | `ForumPost` | Social | Прямая ссылка |
| `User` | Core | 1:N | `ChatMessage` | Social | Прямая ссылка |
| `User` | Core | 1:N | `Notification` | Social | Прямая ссылка |

---

## 7. Индексы по доменам

### 7.1 Core индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `plots` | `[number]` (unique) | Уникальный номер участка |
| `members` | `[user_id]` (unique) | Связь с пользователем |
| `plot_memberships` | `[plot_id, member_id, since]` (unique) | Уникальность членства |

### 7.2 Accounting индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `charges` | `[plot_id, period]` | Поиск начислений по участку и периоду |
| `charges` | `[status]` | Фильтрация по статусу |
| `payments` | `[member_id]` | Платежи конкретного садовода |
| `payments` | `[charge_id]` | Платежи по начислению |

### 7.3 Documents индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `documents` | `[category]` | Фильтр по категории документа |
| `documents` | `[is_public]` | Публичные документы |
| `files` | `[mime_type]` | Фильтрация по типу файла |

### 7.4 Voting индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `votes` | `[status]` | Фильтрация по статусу голосования |
| `vote_options` | `[vote_id]` | Варианты голосования |
| `vote_responses` | `[user_id, vote_id]` | Проверка голосования |
| `vote_responses` | `[vote_id]` | Подсчёт результатов |

### 7.5 Social индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `forum_topics` | `[is_pinned]` | Закреплённые темы |
| `forum_posts` | `[topic_id]` | Посты в теме |
| `chat_participants` | `[chat_id, user_id]` (unique) | Уникальность участника |
| `chat_messages` | `[chat_id, created_at]` | Сообщения по чату с сортировкой |
| `notifications` | `[user_id, is_read]` | Непрочитанные уведомления |
| `notifications` | `[user_id, created_at]` | История уведомлений |
| `announcements` | `[is_pinned]` | Закреплённые объявления |
| `announcements` | `[is_public]` | Публичные объявления |
| `info_pages` | `[slug]` (unique) | Уникальный slug страницы |

---

## История версий

| Версия | Дата | Автор | Изменение |
|--------|------|-------|----------|
| 1.0.0 | 2026-06-25 | Architect | Первоначальная версия |
| 1.1.0 | 2026-06-25 | Architect | Добавлены индексы по доменам |
