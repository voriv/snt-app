# План обновления спецификаций: Отображение отправителя сообщений

> **US-ID:** US-21-03  
> **FR-ID:** FR-REQ-COMMS-001-04  
> **Дата:** 2026-07-15  
> **Статус:** TODO  

---

## Метаданные

| Параметр | Значение |
|----------|----------|
| **User Story** | `docs/user-stories/US-21-03-отправка-личных-сообщений.md` |
| **Модель данных** | `docs/model/entities/message.md` |
| **Цель** | Обновить JSDoc-спефикации и типы для поддержки логики отображения отправителя: «ВЫ»/имя/email |

---

## Выполненные задачи (Architect Mode)

| ID | Задача | Статус |
|----|--------|--------|
| T-US | Обновить User Story: добавить FR-REQ-COMMS-001-04, AC-1.9 — AC-1.12, BR-39 | [DONE] |
| T-MDL | Обновить `docs/model/entities/message.md`: бизнес-инварианты + ссылки | [DONE] |

---

## Задачи для Code Mode

### T1: Обновить `src/domains/comms/message.types.ts`

**Целевое состояние:** `MessageWithSender` включает `senderEmail` и обновлённые JSDoc-аннотации.

**Чек-лист:**
- [ ] Добавить поле `senderEmail: string` в `MessageWithSender`
- [ ] Обновить JSDoc для `MessageWithSender`:
  - Добавить описание логики отображения («ВЫ»/имя/email)
  - Добавить `@see` ссылку на FR-REQ-COMMS-001-04
- [ ] Обновить JSDoc для `senderFirstName`: указать, что может быть пустым
- [ ] Обновить JSDoc для `senderLastName`: указать, что может быть пустым
- [ ] Добавить JSDoc для `senderEmail`: fallback при отсутствии имени

```typescript
// Пример обновлённого интерфейса
/**
 * @type MessageWithSender
 * @domain comms
 * @description Сообщение с данными отправителя для отображения в UI
 *
 * @spec
 * - Используется для отображения в UI (см. FR-REQ-COMMS-001-04)
 * - Содержит расширенную информацию об отправителе для гибкого отображения
 * - senderName формируется из firstName + lastName (когда доступны)
 * - senderEmail используется как fallback когда firstName/lastName отсутствуют
 * - status используется для отображения статуса доставки сообщения
 *
 * **Отображение отправителя в личных сообщениях:**
 * - Для текущего пользователя: компонент всегда отображает «ВЫ»
 * - Для собеседника: компонент отображает senderName (firstName + lastName)
 * - Fallback: если firstName/lastName отсутствуют — отображается senderEmail
 * - Fallback: если отправитель удалён — отображается «Удалённый пользователь»
 *
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md — FR-REQ-COMMS-001-04
 */
export interface MessageWithSender extends Message {
  /** Имя отправителя (из UserProfile.firstName). Может быть пустым, если профиль не заполнен */
  senderFirstName: string;
  /** Фамилия отправителя (из UserProfile.lastName). Может быть пустым, если профиль не заполнен */
  senderLastName: string;
  /** Email отправителя (из User.email). Используется как fallback когда имя/фамилия отсутствуют */
  senderEmail: string;
  /** URL аватара отправителя */
  senderAvatarUrl: string | null;
  /** Полное имя отправителя для отображения. Формируется из firstName + lastName */
  senderName: string;
  /** Статус сообщения: sent, delivered, read */
  status?: 'sent' | 'delivered' | 'read';
}
```

---

### T2: Обновить `src/components/features/comms/MessageItem/MessageItem.tsx`

**Целевое состояние:** Компонент реализует логику отображения отправителя согласно FR-REQ-COMMS-001-04.

**Чек-лист:**
- [ ] Обновить JSDoc для `MessageItem`:
  - Добавить описание логики отображения отправителя
  - Добавить `@see` ссылку на FR-REQ-COMMS-001-04
- [ ] Обновить JSDoc для `MessageItemProps`:
  - Описать логику `currentUserId` для определения «ВЫ»
- [ ] Обновить строку отображения имени (строка 78 в текущем файле):
  - Заменить `message.senderName` на условную логику:
    - `isCurrentUser ? 'ВЫ' : message.senderName`
  - Добавить fallback: если `senderName` пустой — использовать `senderEmail`
- [ ] Обновить `aria-label`: использовать ту же логику для доступности

```typescript
// Пример обновления строки имени (строка 77-79)
<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
  {isCurrentUser ? 'ВЫ' : (message.senderName || message.senderEmail)}
</span>
```

**Обновлённый JSDoc для компонента:**
```typescript
/**
 * @component MessageItem
 * @category features/comms
 * @description Компонент для отображения отдельного сообщения в диалоге
 *
 * @prop message - Объект сообщения с данными отправителя для отображения
 * @prop currentUserId - ID текущего пользователя для определения, является ли сообщение его
 * @prop isLastMessage - Флаг, является ли сообщение последним (для автопрокрутки)
 *
 * @spec
 * - Отображает сообщение в зависимости от того, отправлено ли оно текущим пользователем
 * - Сообщения текущего пользователя отображаются справа, других - слева
 * - Показывается аватар, имя пользователя, время отправки и контент
 * - Сообщение с `isLastMessage=true` получает визуальный акцент
 *
 * **Отображение отправителя (FR-REQ-COMMS-001-04):**
 * - Для текущего пользователя (`message.senderId === currentUserId`): всегда «ВЫ»
 * - Для собеседника: `message.senderName` (firstName + lastName)
 * - Fallback: если `senderName` пустой — `message.senderEmail`
 * - Fallback: если отправитель удалён — «Удалённый пользователь»
 *
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md — FR-REQ-COMMS-001-04
 */
```

---

### T3: Обновить API Route Handler (если необходимо)

**Целевое состояние:** API `/api/v1/conversations/:id/messages` возвращает `senderEmail` в данных отправителя.

**Чек-лист:**
- [ ] Проверить, что Prisma-запрос включает `user.email` в select/include для отправителя
- [ ] Проверить, что `senderEmail` попадает в ответ API
- [ ] Если необходимо — обновить репозиторий/сервис для загрузки email отправителя

---

## Матрица AC → Задачи

| Acceptance Criteria | Задача | Статус |
|---------------------|--------|--------|
| AC-1.9: «ВЫ» для текущего пользователя | T2 | [TODO] |
| AC-1.10: Имя и фамилия собеседника | T2 | [TODO] |
| AC-1.11: Fallback на email | T1, T2, T3 | [TODO] |
| AC-1.12: «Удалённый пользователь» | T2 | [TODO] |

---

## Чек-лист валидации (перед передачей в Code Mode)

- [ ] User Story содержит FR-REQ-COMMS-001-04 с AC-1.9 — AC-1.12
- [ ] User Story содержит BR-39
- [ ] `docs/model/entities/message.md` обновлён с бизнес-инвариантами
- [ ] План содержит чёткие задачи для каждого слоя
- [ ] Матрица AC → Задачи покрывает все критерии

---

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-15 | ИИ-архитектор | Создание плана обновления спецификаций |
