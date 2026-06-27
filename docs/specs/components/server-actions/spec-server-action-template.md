# Server Action: {{action-name}}

## Статус: {{статус}}

## 1. Описание

### 1.1 Назначение

{{Краткое описание назначения Server Action. Какие операции выполняет и какие данные обрабатывает.}}

### 1.2 Границы ответственности

{{Описание границ ответственности Server Action. Что входит и что НЕ входит в ответственность.}}

| Входит | НЕ входит |
|--------|-----------|
| {{Operation 1}} | {{External concern 1}} |
| {{Operation 2}} | {{External concern 2}} |

### 1.3 Связанные компоненты

| Компонент | Тип | Ссылка |
|-----------|-----|--------|
| {{component-name}} | {{component-type}} | [Ссылка](../path/to/component.md) |

---

## 2. Определение Server Action

### 2.1 Сигнатура функции

```typescript
'use server';

import { z } from 'zod';

export const {{action-name}}Schema = z.object({
  // поля входных данных
});

export type {{action-name}}Input = z.infer<typeof {{action-name}}Schema>;
export type {{action-name}}Result = {
  success: boolean;
  data?: {{result-type}};
  error?: {
    code: string;
    message: string;
    fieldErrors?: FieldError[];
  };
};

/**
 * {{description}}
 *
 * @param input - Входные данные
 * @param context - Контекст (session, userId и т.д.)
 * @returns Результат выполнения
 *
 * @example
 * ```tsx
 * const result = await {{action-name}}({ field: 'value' });
 * if (result.success) {
 *   // обработка успешного результата
 * }
 * ```
 */
export async function {{action-name}}(
  input: {{action-name}}Input,
  context?: {{context-type}}
): Promise<{{action-name}}Result>
```

### 2.2 Входные данные

#### {{action-name}}Input

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| {{field}} | {{type}} | да/нет | {{description}} |

#### {{action-name}}Context

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| {{field}} | {{type}} | да/нет | {{description}} |

### 2.3 Результаты выполнения

#### {{action-name}}Result

| Поле | Тип | Описание |
|------|-----|----------|
| success | boolean | Статус выполнения |
| data? | {{result-type}} | Результат при успехе |
| error? | ActionError | Ошибка при ошибке |

#### ActionError

| Поле | Тип | Описание |
|------|-----|----------|
| code | string | Код ошибки |
| message | string | Сообщение об ошибке |
| fieldErrors? | FieldError[] | Ошибки полей (валидация) |

---

## 3. Бизнес-правила

### 3.1 Правила валидации

| ID | Правило | Описание | Ошибка |
|----|---------|----------|--------|
| VR-001 | {{rule-name}} | {{description}} | {{error-type}} |

### 3.2 Правила бизнес-логики

| ID | Правило | Описание | Исключение |
|----|---------|----------|------------|
| BL-001 | {{rule-name}} | {{description}} | {{exception-type}} |

---

## 4. Авторизация и аутентификация

### 4.1 Требования доступа

| Требование | Значение |
|------------|----------|
| Аутентификация | {{required/optional}} |
| Роль | {{role}} |
| Владение ресурсом | {{required/optional}} |

### 4.2 Проверка авторизации

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function {{action-name}}(
  input: {{action-name}}Input,
  context?: {{context-type}}
): Promise<{{action-name}}Result> {
  // Проверка авторизации
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
      },
    };
  }

  // Проверка роли (если требуется)
  if (session.user.role !== 'ADMIN') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Недостаточно прав',
      },
    };
  }

  // Основная логика...
}
```

---

## 5. Обработка ошибок

### 5.1 Типы ошибок

| Ошибка | Когда выбрасывается | Код | HTTP статус |
|--------|---------------------|-----|-------------|
| ValidationError | Ошибка валидации входных данных | VALIDATION_ERROR | 400 |
| NotFoundError | Ресурс не найден | NOT_FOUND | 404 |
| ConflictError | Конфликт данных | CONFLICT | 409 |
| UnauthorizedError | Неавторизован | UNAUTHORIZED | 401 |
| ForbiddenError | Нет доступа | FORBIDDEN | 403 |
| InternalError | Внутренняя ошибка | INTERNAL_ERROR | 500 |

### 5.2 Пример обработки ошибок

```typescript
try {
  // Валидация
  const parsed = {{action-name}}Schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Неверные входные данные',
        fieldErrors: parsed.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    };
  }

  // Бизнес-логика
  const result = await performAction(parsed.data);

  return { success: true, data: result };
} catch (error) {
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: 'NOT_FOUND', message: error.message } };
  }
  return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } };
}
```

---

## 6. Зависимости

### 6.1 Service зависимости

| Service | Методы | Назначение |
|---------|--------|------------|
| {{service}} | {{methods}} | {{purpose}} |

### 6.2 Repository зависимости

| Repository | Методы | Назначение |
|------------|--------|------------|
| {{repository}} | {{methods}} | {{purpose}} |

---

## 7. Примеры использования

### 7.1 В React компоненте

```tsx
'use client';

import { useState } from 'react';
import { {{action-name}} } from '@/actions/{{action-name}}';

export function {{component-name}}() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{{action-name}}Result | null>(null);

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await {{action-name}}(
        { field: data.get('field') as string },
        { userId: session.user.id }
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? 'Загрузка...' : 'Отправить'}
      </button>
    </form>
  );
}
```

### 7.2 С useFormStatus

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Обработка...' : 'Сохранить'}
    </button>
  );
}
```

---

## 8. Тестирование

### 8.1 Unit тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

### 8.2 Integration тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

---

## 9. Структура файлов

| Файл | Назначение |
|------|------------|
| `src/actions/{{action-name}}.ts` | Основной файл Server Action |
| `src/actions/{{action-name}}.test.ts` | Unit тесты |
| `src/components/{{action-name}}-form.tsx` | Форма использования |

---

## 10. Чек-лист качества

- [ ] Server Action имеет 'use server' директиву
- [ ] Входные данные валидируются через Zod схему
- [ ] Реализована проверка авторизации
- [ ] Все ошибки явно типизированы
- [ ] Возвращается единый формат результата (success + data/error)
- [ ] Есть JSDoc документация с @example
- [ ] Нет использования `any` в типизации
- [ ] Service层 вызывается вместо прямого доступа к БД
- [ ] Написаны unit тесты
- [ ] Покрытие тестами ≥ 80%

---

## 11. История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | {{YYYY-MM-DD}} | Начальная версия | {{автор}} |
