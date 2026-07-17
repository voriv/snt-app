# 🎨 ПРАВИЛА РАЗРАБОТКИ UI-КОМПОНЕНТОВ

> **Версия:** v1.0
> **Дата:** 2026-07-16
> **Назначение:** Системный промпт — правила и контракты для Feature UI-компонентов React
> **Связанные файлы:** [`PROJECT.md`](PROJECT.md), [`SPECS.md`](SPECS.md), [`CODE_REVIEW.md`](CODE_REVIEW.md), [`api-paths.md`](api-paths.md)
> **Детальная инструкция:** [`ui-component-prompt.md`](../prompt/ui-component-prompt.md)

---

## 1. Философия

UI-компонент — это слой представления приложения, который отображает данные, собирает ввод пользователя и делегирует мутации через `apiClient`.

```
Page → UI Component → apiClient → API Route Handler → Service → Repository → DB
       (представление)   (HTTP)      (HTTP-слой)      (логика)    (данные)
```

### Принципы

| Принцип | Описание |
|---------|----------|
| **Три типа компонентов** | Display (только чтение), Form (сбор данных), Delete (удаление с подтверждением) |
| **API-first подход** | Все мутации через `apiClient`, не `fetch()` напрямую |
| **Явное управление состоянием** | Все состояния (loading, error, data) через `useState` |
| **Callbacks, не мутации** | Child-компонент вызывает callback в props, не выполняет мутацию сам |
| **ConfirmDialog вместо window.confirm** | Всегда использовать модальный диалог для подтверждений |
| **useCallback для всех handlers** | Предотвращает дублирование ререндеров |
| **EmptyState для пустых данных** | Использовать переиспользуемый компонент из `src/components/ui/` |

---

## 2. Стратегия: Создание vs Дополнение

Определи режим работы по состоянию файлов:

| Условие | Режим | Действие |
|---------|-------|----------|
| Компонент не существует | **Создание с нуля** | Создать файл + JSDoc + реализацию |
| Компонент существует | **Дополнение** | Добавить новые props/методы/состояния |

### Определение типа компонента

| Признак в плане/User Story | Тип | Шаблон |
|---------------------------|-----|--------|
| "Отображает список/карточку/детали" | **Display** | Display-шаблон |
| "Создаёт/редактирует/обновляет" | **Form** | Form-шаблон |
| "Удаляет с подтверждением" | **Delete** | Delete-шаблон |
| "Переключает между вариантами" | **Toggle** | Extension: ToggleAction |
| "Загружает файл" | **FileUpload** | Extension: FileUpload |
| "Блокирует/предупреждает/банит" | **Modal** | Extension: ModalAction |

### Определение домена

| Источник | Что извлекать |
|----------|---------------|
| План реализации (`docs/plans/us-XX-plan.md`) | ID задач, описание компонента |
| User Story (`docs/user-stories/US-XX-*.md`) | API-контракты, HTTP-статусы, FR |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы для props |
| `src/components/features/<domain>/` | Существующие компоненты домена |

> ⚠️ Если DTO-типы не существуют, а компонент требует их — остановись и сообщи пользователю.

---

## 3. JSDoc-аннотации

### Обязательные JSDoc-теги

| Тег | Уровень | Обязательность |
|-----|---------|----------------|
| `@component` | Файл | ✅ |
| `@category` | Файл | ✅ |
| `@description` | Файл | ✅ |
| `@spec` | Файл | ✅ |
| `@prop` | Каждый prop | ✅ |
| `@example` | Файл | ✅ (для нетривиальных) |
| `@see` | Файл | ✅ (если есть связи) |

### Шаблон JSDoc для компонента

```typescript
/**
 * @component MemberCard
 * @category features/members
 * @description Карточка участника СНТ с отображением профиля и действий
 *
 * @prop member - Объект участника для отображения
 * @prop isAdmin - Флаг администратора для отображения кнопок управления
 * @prop onEdit - Callback для редактирования участника
 * @prop onDelete - Callback для удаления участника
 *
 * @spec
 * - Состояния: loading, error, data
 * - Кнопки управления отображаются только при isAdmin === true
 * - onDelete вызывает ConfirmDialog перед удалением
 * - Не выполняет мутацию напрямую — делегирует через callback
 *
 * @example
 * ```tsx
 * <MemberCard
 *   member={member}
 *   isAdmin={session?.user.role === 'ADMIN'}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
```

---

## 4. Display-компонент

### Назначение

Отображение данных без редактирования. Только чтение.

### Паттерн

```typescript
'use client';

import { useCallback } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface MemberCardProps {
  member: Member;
  onEdit?: (member: Member) => void;
}

/** @component MemberCard */
export function MemberCard({ member, onEdit }: MemberCardProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(member);
  }, [member, onEdit]);

  return (
    <Card>
      {/* Данные участника */}
      {onEdit && <Button onClick={handleEdit}>Редактировать</Button>}
    </Card>
  );
}
```

### Правила

| Правило | Описание |
|---------|----------|
| **useCallback** | Все обработчики событий через `useCallback` |
| **EmptyState** | Если список пуст — использовать `EmptyState`, не inline-разметку |
| **forwardRef** | Для child-компонентов, если родитель нуждается в refetch |
| **Callbacks в props** | Мутация делегируется через callback, не выполняется напрямую |
| **Без apiClient** | Display-компонент не вызывает `apiClient` напрямую (только Form/Delete) |

---

## 5. Form-компонент

### Назначение

Сбор и валидация данных от пользователя. Создание/обновление через `apiClient`.

### Паттерн

```typescript
'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface CreateMemberFormProps {
  onSuccess?: (member: Member) => void;
  onCancel?: () => void;
}

/** @component CreateMemberForm */
export function CreateMemberForm({ onSuccess, onCancel }: CreateMemberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (data: CreateMemberData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<Member>('/members', data);
      if (response.success && response.data) {
        onSuccess?.(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Поля формы */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Button type="submit" isLoading={isLoading} disabled={isLoading}>
        Сохранить
      </Button>
    </form>
  );
}
```

### Правила

| Правило | Описание |
|---------|----------|
| **isLoading** | Состояние загрузки формы. Блокирует кнопку при `true` |
| **error** | Состояние ошибки формы. Отображается над полями или под кнопкой |
| **apiClient вызов** | Все мутации через `apiClient`, не `fetch()` |
| **Кнопка блокируется** | `disabled={isLoading}` + `isLoading={isLoading}` prop |
| **onSuccess callback** | Уведомление родителя об успехе для рефетча |
| **onCancel callback** | Отмена формы без сохранения |

---

## 6. Delete-компонент

### Назначение

Удаление сущности с подтверждением через `ConfirmDialog`.

### Паттерн

```typescript
'use client';

import { useCallback, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiClient } from '@/lib/api-client';

export interface DeleteMemberButtonProps {
  member: Member;
  onSuccess?: (id: string) => void;
}

/** @component DeleteMemberButton */
export function DeleteMemberButton({ member, onSuccess }: DeleteMemberButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/members/${member.id}`);
      onSuccess?.(member.id);
      setIsOpen(false);
    } catch (err) {
      // Обработка ошибки
    } finally {
      setIsLoading(false);
    }
  }, [member.id, onSuccess]);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)} disabled={isLoading}>
        Удалить
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Удаление участника"
        description={`Вы действительно хотите удалить ${member.firstName} ${member.lastName}?`}
        confirmText="Удалить"
        isLoading={isLoading}
      />
    </>
  );
}
```

### Правила

| Правило | Описание |
|---------|----------|
| **ConfirmDialog** | Всегда использовать модальный диалог, не `window.confirm` |
| **isLoading** | Блокирует кнопку и ConfirmDialog при удалении |
| **onSuccess callback** | Уведомление родителя для обновления состояния (рефетч, optimistic update) |
| **onClose** | Закрытие ConfirmDialog без удаления |
| **onConfirm** | Вызов `apiClient.delete()` с обработкой ошибки |

---

## 7. Extension Actions

Для сложных действий используйте extension-файлы из `.roo/prompt/actions/`:

| Паттерн | Файл | Когда использовать |
|---------|------|-------------------|
| **ModalAction** | [`.roo/prompt/actions/ui-action-modal.md`](../prompt/actions/ui-action-modal.md) | Блокировка, предупреждение, бан пользователя — действия с вводом данных + подтверждением |
| **ToggleAction** | [`.roo/prompt/actions/ui-action-toggle.md`](../prompt/actions/ui-action-toggle.md) | Переключение между вариантами (тема, статус, active/inactive) |
| **FileUpload** | [`.roo/prompt/actions/ui-action-fileupload.md`](../prompt/actions/ui-action-fileupload.md) | Загрузка аватара, документов, изображений |

### Правила использования extension-файлов

1. Прочитай соответствующий файл из `.roo/prompt/actions/`
2. Используй props-интерфейс из extension-файла
3. Дополни его специфическими для домена props
4. Следи за паттерном из extension-файла

---

## 8. Обработка событий

### Принцип: один источник истины

```typescript
// ✅ Правильно: родитель управляет состоянием и мутацией
function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/members/${id}`);
      setMembers(prev => prev.filter(m => m.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <MemberRow member={member} onDelete={handleDelete} />
  );
}

// ❌ Неправильно: дублирование мутации в родителе и child
function MemberRow({ member, onDelete }: Props) {
  const handleDelete = useCallback(async () => {
    await apiClient.delete(`/members/${member.id}`); // ДУБЛИРОВАНИЕ!
    onDelete(member);
  }, [onDelete]);

  return <Button onClick={handleDelete}>Удалить</Button>;
}
```

### Правила

| Правило | Описание |
|---------|----------|
| **useCallback** | Все обработчики событий через `useCallback` |
| **Callbacks в props** | Child вызывает callback, не выполняет мутацию сам |
| **Родитель управляет состоянием** | isLoading, error, data — в родителе |
| **Child делегирует** | `<Button onClick={() => onDelete(id)}>` |
| **forwardRef для refetch** | Если родитель нуждается в refetch child-компонента |

---

## 9. Строгие запреты

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ `fetch()` напрямую в компоненте | Только `apiClient` |
| 3 | ❌ `window.confirm` для подтверждений | Использовать `ConfirmDialog` |
| 4 | ❌ Дублирование мутаций | Callbacks в props, не прямые API вызовы |
| 5 | ❌ Пропускать `useCallback` | Дублирование ререндеров |
| 6 | ❌ Inline-разметка для пустого состояния | Использовать `EmptyState` |
| 7 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 8 | ❌ `export default` | Named exports только |
| 9 | ❌ Бизнес-логика в компоненте | Только UI, мутация через apiClient |
| 10 | ❌ Глобальные переменные | Всё через `useState` |
| 11 | ❌ Неблокируемая кнопка при загрузке | `disabled={isLoading}` |
| 12 | ❌ Пропускать обработку ошибок | `catch` с `setError()` |
| 13 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |

---

## 10. Чек-лист

### Definition of Done

- [ ] JSDoc: `@component`, `@category`, `@description`, `@spec`
- [ ] Props-интерфейс с `@prop` для каждого prop
- [ ] `'use client'` наверху файла
- [ ] Обработаны состояния: `loading`, `error`, `empty`
- [ ] Используется `apiClient` для запросов (не `fetch()` напрямую)
- [ ] Кнопки блокируются при `isLoading`
- [ ] Пустое состояние через `EmptyState`
- [ ] `useCallback` для всех обработчиков событий
- [ ] Callbacks для мутаций, не прямые API вызовы
- [ ] `ConfirmDialog` вместо `window.confirm`
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run lint` — 0 ошибок

---

## 11. Референсы

| Ресурс | Файл | Примечание |
|--------|------|-----------|
| ThemeSelector | [`src/components/features/userProfile/ThemeSelector/ThemeSelector.tsx`](../../src/components/features/userProfile/ThemeSelector/ThemeSelector.tsx) | Toggle-паттерн |
| LogoutButton | [`src/components/features/auth/LogoutButton/LogoutButton.tsx`](../../src/components/features/auth/LogoutButton/LogoutButton.tsx) | ModalAction-паттерн |
| AvatarUploader | [`src/components/features/userProfile/AvatarUploader/AvatarUploader.tsx`](../../src/components/features/userProfile/AvatarUploader/AvatarUploader.tsx) | FileUpload-паттерн |
| EmptyState | [`src/components/ui/EmptyState/`](../../src/components/ui/EmptyState/) | Пустое состояние |
| ConfirmDialog | [`src/components/ui/ConfirmDialog/`](../../src/components/ui/ConfirmDialog/) | Диалог подтверждения |
| apiClient | [`src/lib/api-client.ts`](../../src/lib/api-client.ts) | Централизованный REST-клиент |

---

**Последнее обновление:** 2026-07-16
