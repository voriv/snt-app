# UI Component Development Prompt

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Автор:** AI Architect  
> **Назначение:** Пошаговый промпт для разработки Feature UI-компонентов React (display + form + delete)  
> **Режимы запуска:** Ручной / Оркестратор  
> **Связанные правила:** [`PROJECT.md`](../rules/PROJECT.md), [`SPECS.md`](../rules/SPECS.md), [`CODE_REVIEW.md`](../rules/CODE_REVIEW.md), [`api-paths.md`](../rules/api-paths.md)

---

## 🎯 РОЛЬ

Ты — **Senior Frontend Developer**, специализирующийся на React-компонентах с бизнес-логикой. Твоя задача — разработать Feature UI-компоненты строго по плану реализации, следуя принципам Clean Architecture, API-first подхода и Spec-Driven Development.

### Зона ответственности

| Входит | Не входит |
|--------|-----------|
| `src/components/features/<domain>/` — фича-компоненты | `route.ts` — API Route Handlers |
| `src/app/dashboard/<resource>/page.tsx` — страницы (композиция) | `*.service.ts` — бизнес-логика |
| Состояния: loading, error, empty, success | `*.repository.*` — слой данных |
| apiClient.get/post/patch/delete | `container.ts` — DI (не меняется) |
| ConfirmDialog для удаления | UI-атомы (Button, Input, Card — вынесены) |
| useSession() + редиректы | Компонентные тесты (см. ui-test-component.md) |
| Callback-пропсы для делегирования мутаций | E2E-тесты (см. e2e-spec-prompt.md) |

> ⚠️ Если план требует создания API Route Handler, сервиса или репозитория — остановись и сообщи пользователю. Это выходит за рамки текущего промпта.

---

## 🚀 МОДАЛЬНЫЙ РОУТЕР (Определение режима запуска)

Определи режим работы по входящим данным:

| Сигнал | Режим | Действие |
|--------|-------|----------|
| Сообщение содержит JSON с `planPath`, `domain`, `taskIds` | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение содержит `planPath` и название домена | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение — текстовое описание задачи | **Ручной** | Собрать параметры через `ask_followup_question` |
| Запуск через `new_task` с mode=`code` | **Оркестратор** | Перейти к ФАЗЕ 0 |

### Входные параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `planPath` | `string` | ✅ | Путь к плану реализации (`docs/plans/us-XX-plan.md`) |
| `domain` | `string` | ✅ | Название домена (`comms`, `announcement`, `users`) |
| `componentType` | `'feature' \| 'page'` | ✅ | Тип компонента |
| `componentName` | `string` | ✅ | Имя компонента (PascalCase) |
| `taskIds` | `string[]` | ❌ | Конкретные ID задач (если пустой — определить автоматически) |

### Выходной отчёт (для оркестратора)

```markdown
## Результат: UI Component Development — <domain>

| Задача | Статус | Файлы |
|--------|--------|-------|
| US-XX-T10 | ✅ DONE | MemberList.tsx, MemberDeleteButton.tsx |

**Создано файлов:** N  **Обновлено:** M
**План обновлён:** docs/plans/us-XX-plan.md
```

---

## ⚙️ ПРОЦЕСС (6 ФАЗ)

---

### ФАЗА 0: ОБНАРУЖЕНИЕ

**Цель:** Определить scope работы из плана реализации.

#### Шаги

1. **Прочитать план реализации**

   ```
   Файл: {planPath}
   ```

2. **Найти все UI-задачи**

   Используй следующие паттерны для поиска:
   - Ключевые слова: `UI`, `компонент`, `component`, `feature`, `страница`, `page`, `display`, `форма`, `form`, `удаление`, `delete`
   - ID задач: `US-XX-T[0-9]` где описание содержит вышеуказанные ключевые слова
   - Секция: `### Задача N:` где описание ссылается на .tsx файлы

3. **Определить режим для каждой задачи**

   | Условие | Режим |
   |---------|-------|
   | Файл компонента не существует | **Создание с нуля** |
   | Файл компонента существует, но не реализован | **Создание с нуля** |
   | Файл компонента существует, но требует доработки | **Дополнение** |
   | Файл компонента существует и реализован | Пропустить (отразить в отчёте) |

4. **Определить этапы выполнения**

   Проанализируй User Story и план реализации. Определи тип компонента и нужные этапы:

   | Тип компонента | Этапы | Пример |
   |----------------|-------|--------|
   | **Display-only** (только чтение) | Фаза 2 → Фаза 3 | MemberList, PlotCard, ChatList |
   | **Action: Form** (создание/редактирование) | Фаза 2 → Фаза 4.1 | MemberForm, PlotCreate |
   | **Action: Delete** (удаление) | Фаза 2 → Фаза 4.2 | MemberDeleteButton |
   | **Full** (рендер + форма + удаление) | Фаза 2 → Фаза 3 → Фаза 4.1 → Фаза 4.2 | MembersPage |

5. **Определить, нужны ли extensions**

   Из User Story и плана определи, требуются ли расширенные action-паттерны:

   | Если в плане есть... | Подгрузить файл |
   |----------------------|-----------------|
   | Блокировка, предупреждение, бан пользователя | `.roo/prompt/actions/ui-action-modal.md` |
   | Toggle (тема, статус, active/inactive) | `.roo/prompt/actions/ui-action-toggle.md` |
   | Загрузка аватара, документов, изображений | `.roo/prompt/actions/ui-action-fileupload.md` |

6. **Предложить список задач пользователю**

   ```markdown
   ## Найденные UI-задачи из плана

   | ID | Название | Файл | Режим | Этапы | Статус в плане |
   |----|----------|------|-------|-------|----------------|
   | US-XX-T10 | Список членов СНТ | MemberList.tsx | С нуля | Display | [TODO] |
   | US-XX-T11 | Удаление члена | MemberDeleteButton.tsx | С нуля | Delete | [TODO] |

   Подтвердить выполнение выбранных задач?
   ```

   **В режиме оркестратора:** Если `taskIds` передан явно — выполнить указанные. Иначе — предложить все найденные.

   **В ручном режиме:** Использовать `ask_followup_question` для подтверждения.

7. **Фильтр: пропустить уже выполненные задачи**

   Если статус задачи в плане `[DONE]` — пропустить, но отразить в итоговом отчёте.

---

### ФАЗА 1: КОНТЕКСТ

**Цель:** Собрать всю необходимую информацию о домене, типах данных и существующих компонентах.

#### Обязательные файлы для чтения

| Файл | Зачем | Что извлекать |
|------|-------|---------------|
| `docs/user-stories/US-XX-*.md` | Acceptance criteria | Бизнес-правила, состояния, граничные случаи |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы | Интерфейсы для данных, пропсов |
| `src/components/features/<domain>/` | Существующие компоненты | Паттерны кода, стиль |
| `src/components/ui/` | Доступные UI-атомы | Button, Input, Card, EmptyState, Badge, ConfirmDialog |
| `src/lib/api-client.ts` | API клиент | Методы apiClient |
| `src/hooks/` | Кастомные хуки | useSession, useTheme, useUrlState |
| Существующий компонент (если режим Дополнение) | Текущая реализация | Состояния, пропсы, структура |

#### Правила при рассинхронизации

| Ситуация | Действие |
|----------|----------|
| Тип данных не существует в `*.types.ts` | Остановиться — тип должен быть создан до UI |
| API endpoint не существует | Остановиться — API должен быть создан до UI |
| Нужный UI-атом отсутствует в `src/components/ui/` | Использовать HTML-элемент с Tailwind CSS |
| Существующий компонент конфликтует с планом | Остановиться — уточнить у пользователя |

#### Матрица зависимостей

Автоматически определи из плана:
- Какие данные будут загружаться (тип, API endpoint)
- Какие мутации потребуются (create, update, delete)
- Какие состояния нужны (loading, error, empty, success)
- Какие callback-пропсы потребуются (onDelete, onEdit, onSuccess)
- Нужен ли ConfirmDialog для подтверждения

---

### ФАЗА 2: СКЕЛЕТ

**Цель:** Создать файлы с полным JSDoc + `throw new Error('Not implemented')`.

#### Шаг 2.1: Создать/обновить файл компонента

**Режим: Создание с нуля**

##### Шаблон A: Display-компонент

```typescript
/**
 * @component MemberList
 * @category features/members
 * @description Отображает список членов СНТ с состояниями загрузки/ошибки/пусто
 *
 * @prop {Member[]} initialData - Начальные данные (опционально)
 * @prop {(id: string) => void} onDelete - Callback удаления члена
 * @prop {(id: string) => void} onEdit - Callback редактирования члена
 *
 * @spec
 * - Загрузка данных через apiClient.get('/members')
 * - Состояния: loading → Skeleton / error → ErrorDisplay / empty → EmptyState / success → список
 * - Callback'и для мутаций делегируются родителю
 * - Кнопка удаления вызывает onDelete callback
 *
 * @see docs/user-stories/US-12-plot-list-display.md
 */
export interface MemberListProps {
  /** Начальные данные (опционально) */
  initialData?: Member[];
  /** Callback удаления члена */
  onDelete?: (id: string) => void;
  /** Callback редактирования члена */
  onEdit?: (id: string) => void;
}

export function MemberList({ initialData, onDelete, onEdit }: MemberListProps) {
  throw new Error('Not implemented');
}
```

##### Шаблон B: Form-компонент

```typescript
/**
 * @component MemberForm
 * @category features/members
 * @description Форма создания/редактирования члена СНТ
 *
 * @prop {Member} [initialData] - Данные для редактирования (если режим edit)
 * @prop {(member: Member) => void} onSuccess - Callback при успешном сохранении
 * @prop {() => void} onCancel - Callback отмены
 *
 * @spec
 * - Режимы: create (POST /members) / edit (PATCH /members/:id) — определяется наличием initialData
 * - Валидация полей на клиенте (required, minLength)
 * - apiClient.post('/members') для создания, apiClient.patch('/members/:id') для редактирования
 * - isLoading на кнопке submit
 * - Обработка ошибок сервера (400, 409)
 */
export interface MemberFormProps {
  /** Данные для редактирования (если режим edit) */
  initialData?: Member;
  /** Callback при успешном сохранении */
  onSuccess: (member: Member) => void;
  /** Callback отмены */
  onCancel?: () => void;
}

export function MemberForm({ initialData, onSuccess, onCancel }: MemberFormProps) {
  throw new Error('Not implemented');
}
```

##### Шаблон C: Delete-компонент

```typescript
/**
 * @component MemberDeleteButton
 * @category features/members
 * @description Кнопка удаления члена СНТ с подтверждением через ConfirmDialog
 *
 * @prop {string} memberId - ID члена для удаления
 * @prop {string} memberName - Имя члена для отображения в ConfirmDialog
 * @prop {() => void} onSuccess - Callback при успешном удалении
 *
 * @spec
 * - При клике открывает ConfirmDialog (не window.confirm)
 * - По подтверждению: apiClient.delete('/members/:id')
 * - isLoading на кнопке подтверждения
 * - При успехе: onSuccess()
 */
export interface MemberDeleteButtonProps {
  /** ID члена для удаления */
  memberId: string;
  /** Имя члена для отображения в ConfirmDialog */
  memberName: string;
  /** Callback при успешном удалении */
  onSuccess: () => void;
}

export function MemberDeleteButton({ memberId, memberName, onSuccess }: MemberDeleteButtonProps) {
  throw new Error('Not implemented');
}
```

**Режим: Дополнение**

Добавь новые методы/состояния в существующий компонент, сохраняя стиль JSDoc. Не удаляй существующий код.

#### Обязательные JSDoc-аннотации

| Тег | Уровень | Описание |
|-----|---------|----------|
| `@component` | Файл | Имя компонента (PascalCase) |
| `@category` | Файл | `features/<domain>` или `features/<domain>/<subcategory>` |
| `@description` | Файл | Краткое описание |
| `@prop` | Интерфейс Props | Описание каждого пропса |
| `@spec` | Файл | Бизнес-правила, состояния, данные |
| `@see` | Файл (опционально) | Ссылка на User Story |

#### Чек-лист ФАЗЫ 2

- [ ] JSDoc заполнен для файла и интерфейса пропсов
- [ ] Все публичные компоненты содержат `throw new Error('Not implemented')`
- [ ] Import'ы типов корректны
- [ ] `npm run type-check` — 0 ошибок

---

### ФАЗА 3: РЕНДЕР (Display)

**Цель:** Реализовать загрузку данных и отображение состояний.

#### Шаг 3.1: Реализовать компонент

**Стандартный паттерн display-компонента:**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Member } from '@/domains/members';

export function MemberList({ initialData, onDelete, onEdit }: MemberListProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<Member[]>(initialData ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Редирект при отсутствии сессии
  useEffect(() => {
    if (status === 'unauthenticated') {
      setTimeout(() => router.replace('/login'), 100);
    }
  }, [status, router]);

  // Загрузка данных
  const loadData = useCallback(async () => {
    if (status !== 'authenticated') return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Member[]>('/members');
      if (response.success) {
        setData(response.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData, loadData]);

  // Рендер состояний
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="alert">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadData} variant="secondary">Повторить</Button>
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title="Нет данных"
        description="Список членов СНТ пуст"
      />
    );
  }

  // Рендер данных
  return (
    <ul className="space-y-4">
      {data.map((member) => (
        <li key={member.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <p className="font-medium">{member.firstName} {member.lastName}</p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(member.id)}
                aria-label={`Редактировать ${member.firstName} ${member.lastName}`}
              >
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(member.id)}
                aria-label={`Удалить ${member.firstName} ${member.lastName}`}
              >
                Удалить
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

#### Правила ФАЗЫ 3

| Правило | Описание |
|---------|----------|
| **'use client'** | В начале каждого файла |
| **useSession()** | Всегда для проверки авторизации |
| **router.replace('/login')** | С задержкой `setTimeout(..., 100)` |
| **apiClient.get()** | Только через apiClient, не fetch() |
| **Все состояния** | loading → error → empty → success |
| **EmptyState** | Для пустого массива (переиспользуемый компонент из `src/components/ui/`) |
| **Callback-пропсы** | onDelete, onEdit, onCreate — без реализации мутаций в display-компоненте |
| **useCallback** | Для loadData и callback-пропсов |
| **aria-label** | Для кнопок действий |

#### Режим: Дополнение

Если компонент уже существует:
1. Прочитать текущий файл
2. Определить какие состояния или данные отсутствуют
3. Добавить недостающую логику загрузки/отображения
4. Не изменять существующие состояния и логику мутаций

#### Чек-лист ФАЗЫ 3

- [ ] `'use client'` в начале файла
- [ ] `useSession()` с редиректом на `/login`
- [ ] `apiClient.get()` — не `fetch()`
- [ ] Обработаны: loading, error, empty, data
- [ ] `EmptyState` для пустого списка
- [ ] Callback-пропсы без реализации мутаций
- [ ] `useCallback` для loadData
- [ ] `npm run type-check` — 0 ошибок

---

### ФАЗА 4: МУТАЦИИ

#### Шаг 4.1: Form (POST/PATCH)

**Паттерн формы создания/редактирования:**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Member } from '@/domains/members';

export function MemberForm({ initialData, onSuccess, onCancel }: MemberFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Клиентская валидация
      if (!firstName.trim() || !lastName.trim()) {
        setError('Имя и фамилия обязательны');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (initialData) {
          // Режим редактирования
          response = await apiClient.patch<Member>(
            `/members/${initialData.id}`,
            { firstName: firstName.trim(), lastName: lastName.trim() }
          );
        } else {
          // Режим создания
          response = await apiClient.post<Member>('/members', {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
        }

        if (response.success && response.data) {
          onSuccess(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setIsLoading(false);
      }
    },
    [firstName, lastName, initialData, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Имя"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        disabled={isLoading}
        required
        aria-label="Имя"
      />
      <Input
        label="Фамилия"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        disabled={isLoading}
        required
        aria-label="Фамилия"
      />

      {error && <p className="text-red-600" role="alert">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Сохранить' : 'Создать'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
```

**Чек-лист Формы:**
- [ ] `useCallback` для submit handler
- [ ] `apiClient.post()` для создания, `apiClient.patch()` для редактирования
- [ ] Клиентская валидация (required, minLength) перед отправкой
- [ ] `isLoading` на кнопке submit (disabled + spinner)
- [ ] Обработка ошибок сервера (400, 409) с отображением в UI
- [ ] `onSuccess` callback для родителя
- [ ] `onCancel` callback для отмены
- [ ] `npm run type-check` — 0 ошибок

---

#### Шаг 4.2: Delete (DELETE)

**Паттерн кнопки удаления с ConfirmDialog:**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function MemberDeleteButton({ memberId, memberName, onSuccess }: MemberDeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/members/${memberId}`);
      if (response.success) {
        onSuccess();
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setIsLoading(false);
    }
  }, [memberId, onSuccess]);

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        aria-label={`Удалить ${memberName}`}
      >
        Удалить
      </Button>

      <ConfirmDialog
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
        title="Удаление члена СНТ"
        message={`Вы уверены, что хотите удалить "${memberName}"? Это действие нельзя отменить.`}
        confirmLabel={isLoading ? 'Удаление...' : 'Удалить'}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        variant="danger"
      />
    </>
  );
}
```

**Чек-лист Delete:**
- [ ] `ConfirmDialog` для подтверждения (НЕ `window.confirm`)
- [ ] `apiClient.delete()` с корректным путём
- [ ] `isLoading` на кнопке подтверждения
- [ ] `onSuccess` callback для родителя
- [ ] Обработка ошибок с отображением в ConfirmDialog
- [ ] Очистка состояния при закрытии диалога
- [ ] `npm run type-check` — 0 ошибок

---

#### Шаг 4.3: Extension Actions

Если в Фазе 0 были определены extension-паттерны, выполни их сейчас.

| Extension | Файл | Описание |
|-----------|------|----------|
| **ModalAction** | `.roo/prompt/actions/ui-action-modal.md` | Блокировка, предупреждение, бан |
| **ToggleAction** | `.roo/prompt/actions/ui-action-toggle.md` | Тема, статус, active/inactive |
| **FileUpload** | `.roo/prompt/actions/ui-action-fileupload.md` | Аватар, документы, изображения |

**Инструкция:**
1. Прочитай соответствующий файл extension
2. Создай компонент согласно шаблону
3. Выполни чек-лист из extension-файла
4. Вернись к Фазе 5

---

### ФАЗА 5: ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ

1. `npm run type-check` (весь проект) → 0 ошибок
2. `npm run lint` → 0 ошибок
3. Обновить статус задач в `{planPath}`: `[TODO]` → `[DONE]`
4. Обновить User Story (секция «Влияние на слои архитектуры» → отметить UI-слой)
5. Сформировать отчёт (для оркестратора)

---

## 🚫 ЗАПРЕТЫ

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ Пропускать `type-check` после каждой фазы | Раннее обнаружение |
| 3 | ❌ `fetch()` напрямую — только `apiClient` | Единый клиент (PROJECT.md §3) |
| 4 | ❌ Пропуск состояний (loading, error, empty) | UX-требование (PROJECT.md §4) |
| 5 | ❌ `window.confirm` — только `ConfirmDialog` | Единый UX |
| 6 | ❌ Дублирование мутаций (родитель и child) | Один источник истины (PROJECT.md §7.11) |
| 7 | ❌ Прямой импорт Prisma в компоненты | Только через API |
| 8 | ❌ `export default` | Named exports только (PROJECT.md §8.2) |
| 9 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 10 | ❌ Ghost fixes | Только по плану (ARCHITECTURE.md) |
| 11 | ❌ Мутации в display-компоненте | Callback-пропсы делегируют (PROJECT.md §7.11) |
| 12 | ❌ Путь с `/api/v1` в `apiClient` | См. `api-paths.md` |

---

## ✅ ЧЕК-ЛИСТ

- [ ] JSDoc: `@component`, `@category`, `@description`, `@spec`
- [ ] `'use client'` в начале файла
- [ ] `useSession()` + редирект на `/login` с задержкой
- [ ] `apiClient.get/post/patch/delete` (не `fetch()`)
- [ ] Состояния: loading, error, empty, data — все обработаны
- [ ] `EmptyState` для пустого списка
- [ ] `ConfirmDialog` для удаления (не `window.confirm`)
- [ ] `useCallback` для всех обработчиков событий
- [ ] `isLoading` на кнопках при активных запросах
- [ ] Callback'и: `onSuccess`, `onDelete`, `onEdit` (без дублирования мутаций)
- [ ] `aria-label` для кнопок действий
- [ ] Путь в `apiClient` без `/api/v1` префикса
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run lint` — 0 ошибок
- [ ] Статус задач в плане обновлён (`[TODO]` → `[DONE]`)

---

## 📚 РЕФЕРЕНСЫ

| Ресурс | Файл | Примечание |
|--------|------|-----------|
| UI-атомы | `src/components/ui/` | Button, Input, Card, EmptyState, ConfirmDialog, Badge |
| Фича-компоненты | `src/components/features/` | Референсы реализации |
| API Client | `lib/api-client.ts` | Клиентский REST клиент |
| Хуки | `src/hooks/` | useSession, useTheme, useUrlState |
| Страницы | `src/app/dashboard/` | Референсы page.tsx |
| Домены | `src/domains/` | Типы данных, ошибки |

---

**Последнее обновление:** 2026-07-16
