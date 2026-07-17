# План обновления: Отображение отправителя в личных сообщениях

> **Назначение:** Обновление логики отображения имени отправителя в карточке сообщения согласно FR-REQ-COMMS-001-04

---

## 📋 Метаданные

| Параметр | Значение |
|----------|----------|
| **US-ID** | US-21-03 |
| **FR-ID** | FR-REQ-COMMS-001-04 |
| **Версия** | v1.0 |
| **Дата** | 2026-07-15 |
| **Статус** | TODO |

---

## 📎 Ссылки

| Ресурс | Путь |
|--------|------|
| User Story | [`docs/user-stories/US-21-03-отправка-личных-сообщений.md`](../../docs/user-stories/US-21-03-отправка-личных-сообщений.md) |
| Модель Message | [`docs/model/entities/message.md`](../../docs/model/entities/message.md) |
| Типы | [`src/domains/comms/message.types.ts`](../../src/domains/comms/message.types.ts) |
| Репозиторий | [`src/domains/comms/message.repository.prisma.ts`](../../src/domains/comms/message.repository.prisma.ts) |
| Компонент | [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../src/components/features/comms/MessageItem/MessageItem.tsx) |

---

## 🎯 Целевое состояние

Пользователь видит в карточке сообщения:
- **"ВЫ"** — для своих сообщений
- **"Имя Фамилия"** — для сообщений собеседника (из UserProfile)
- **email** — fallback, если имя/фамилия отсутствуют
- **"Удалённый пользователь"** — если отправитель удалён из системы

---

## 📁 Дерево файлов

### Требуется модифицировать:

| Файл | Слой | Изменение |
|------|------|----------|
| `src/domains/comms/message.types.ts` | Types | Добавить `senderEmail` в `MessageWithSender` |
| `src/domains/comms/message.repository.prisma.ts` | Repository | Добавить `senderEmail` в `mapToMessageWithSender` |
| `src/components/features/comms/MessageItem/MessageItem.tsx` | UI | Реализовать логику отображения "ВЫ" / имя / email |

---

## 📝 Задачи по слоям

### T1: Types — Добавить `senderEmail` в `MessageWithSender` [ ]

**Целевое состояние:** Интерфейс `MessageWithSender` содержит поле `senderEmail: string`

**Чек-лист:**
- [ ] Добавить поле `senderEmail: string` в интерфейс `MessageWithSender`
- [ ] Обновить JSDoc для `MessageWithSender`:
  - Добавить `@display-logic` с правилами отображения
  - Добавить `@see` ссылку на FR-REQ-COMMS-001-04
  - Обновить описание `senderName` — уточнить формат

**Изменение:**
```typescript
// ДО:
export interface MessageWithSender extends Message {
  senderFirstName: string;
  senderLastName: string;
  senderAvatarUrl: string | null;
  senderName: string;
  status?: 'sent' | 'delivered' | 'read';
}

// ПОСЛЕ:
export interface MessageWithSender extends Message {
  senderFirstName: string;
  senderLastName: string;
  senderEmail: string;           // ← НОВОЕ
  senderAvatarUrl: string | null;
  senderName: string;
  status?: 'sent' | 'delivered' | 'read';
}
```

---

### T2: Repository — Добавить `senderEmail` в маппинг [ ]

**Целевое состояние:** Метод `mapToMessageWithSender()` возвращает `senderEmail` из `sender.email`

**Чек-лист:**
- [ ] Добавить `senderEmail: sender?.email || ''` в `mapToMessageWithSender()`
- [ ] Проверить, что Prisma-запрос включает `sender` с полем `email` (текущий include уже покрывает)

**Изменение в `src/domains/comms/message.repository.prisma.ts`:**
```typescript
// ДО:
private mapToMessageWithSender(message: any): MessageWithSender {
  const { sender } = message;
  const profile = sender?.profile;
  const firstName = profile?.first_name || sender.name || '';
  const lastName = profile?.last_name || '';
  const senderName = `${firstName} ${lastName}`.trim();

  return {
    id: message.id,
    // ... другие поля
    senderFirstName: firstName,
    senderLastName: lastName,
    senderAvatarUrl: profile?.avatar || null,
    senderName,
  };
}

// ПОСЛЕ:
private mapToMessageWithSender(message: any): MessageWithSender {
  const { sender } = message;
  const profile = sender?.profile;
  const firstName = profile?.first_name || sender.name || '';
  const lastName = profile?.last_name || '';
  const senderName = `${firstName} ${lastName}`.trim();
  const senderEmail = sender?.email || '';  // ← НОВОЕ

  return {
    id: message.id,
    // ... другие поля
    senderFirstName: firstName,
    senderLastName: lastName,
    senderEmail,                           // ← НОВОЕ
    senderAvatarUrl: profile?.avatar || null,
    senderName,
  };
}
```

---

### T3: UI — Реализовать логику отображения отправителя в MessageItem [ ]

**Целевое состояние:** Компонент `MessageItem` отображает:
- "ВЫ" для сообщений текущего пользователя
- Имя/фамилию для собеседника
- Email как fallback

**Чек-лист:**
- [ ] Добавить вычисление `displayLabel` на основе `isCurrentUser`
- [ ] Заменить `{message.senderName}` на `{displayLabel}`
- [ ] Обновить JSDoc для `MessageItem` — добавить `@display-logic`
- [ ] Обновить `aria-label` — использовать `displayLabel`

**Логика отображения:**
```typescript
// В MessageItem.tsx
const isCurrentUser = message.senderId === currentUserId;

// Вычисление displayLabel
const displayLabel = isCurrentUser
  ? 'ВЫ'
  : (message.senderName || message.senderEmail || 'Удалённый пользователь');
```

**Изменение в шаблоне (строка 77-79):**
```tsx
// ДО:
<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
  {message.senderName}
</span>

// ПОСЛЕ:
<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
  {displayLabel}
</span>
```

**Изменение в avатар (строка 58-64):**
```tsx
// ДО:
{message.senderName ? (
  message.senderName.length > 2 ? (
    message.senderName.split(' ').map(name => name[0].toUpperCase()).join('')
  ) : (
    message.senderName.charAt(0).toUpperCase()
  )
) : 'U'}

// ПОСЛЕ:
{isCurrentUser ? (
  'ВЫ'
) : message.senderName ? (
  message.senderName.length > 2 ? (
    message.senderName.split(' ').map(name => name[0].toUpperCase()).join('')
  ) : (
    message.senderName.charAt(0).toUpperCase()
  )
) : 'U'}
```

---

## 📊 Матрица соответствия AC → Задачи

| Acceptance Criterion | Задача | Статус |
|---------------------|--------|--------|
| AC-1.9: Отображение "ВЫ" для текущего пользователя | T3 (UI) | [ ] |
| AC-1.10: Отображение имени и фамилии собеседника | T2 + T3 | [ ] |
| AC-1.11: Fallback на email при отсутствии имени | T1 + T2 + T3 | [ ] |
| AC-1.12: "Удалённый пользователь" при удалённом аккаунте | T3 (UI) | [ ] |
| AC-1.13: Отображение имени и фамилии в карточке сообщения | T3 (UI) | [ ] |

---

## ✅ Чек-лист валидации

### Код и типы
- [ ] `npm run type-check` — 0 ошибок типов
- [ ] `npm run lint` — 0 lint-ошибок

### Целостность
- [ ] `MessageWithSender` содержит `senderEmail`
- [ ] `mapToMessageWithSender` возвращает `senderEmail`
- [ ] `MessageItem` использует `displayLabel` для отображения имени
- [ ] Аватар текущего пользователя показывает "ВЫ"

### Тестирование
- [ ] Визуальная проверка: "ВЫ" отображается для своих сообщений
- [ ] Визуальная проверка: имя отображается для сообщений собеседника
- [ ] Визуальная проверка: email отображается как fallback

---

## 📝 История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-15 | ИИ-архитектор | Создание плана |
