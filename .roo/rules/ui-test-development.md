# 🧪 ПРАВИЛА ТЕСТИРОВАНИЯ UI-КОМПОНЕНТОВ

> **Версия:** v1.0
> **Дата:** 2026-07-16
> **Назначение:** Системный промпт — правила и контракты для unit-тестов UI-компонентов
> **Связанные файлы:** [`PROJECT.md`](PROJECT.md), [`CODE_REVIEW.md`](CODE_REVIEW.md), [`ui-component-development.md`](ui-component-development.md)
> **Детальная инструкция:** [`ui-test-component.md`](../prompt/ui-test-component.md)

---

## 1. Философия

Тестирование UI-компонентов следует принципам @testing-library: тестируйте поведение, а не реализацию.

```
Component → render() → screen.getBy*() → fireEvent/updateFire → expect()
```

### Принципы

| Принцип | Описание |
|---------|----------|
| **Тестирование поведения** | Пользователь не знает, как компонент реализован — тесты тоже не должны |
| **screen.getBy* вместо контейнера** | Использовать query methods, не прямой доступ к DOM-дереву |
| **Моки внешних зависимостей** | `next/navigation`, `next-auth/react`, `@/lib/api-client` |
| **beforeEach/afterEach** | Очищать моки между тестами для изоляции |
| **waitFor для async** | Асинхронные действия требуют `await waitFor()` |
| **Покрытие состояний** | Тестировать loading, error, empty, success состояния |

---

## 2. Моки зависимостей

### Обязательные моки

| Зависимость | Что мокировать | Зачем |
|-------------|----------------|-------|
| `next/navigation` | `useRouter` | Навигация не должна работать в тестах |
| `next-auth/react` | `useSession` | Сессия не нужна в unit-тестах |
| `@/lib/api-client` | Методы `get`, `post`, `patch`, `delete` | Контроль ответов API |
| `@/components/ui/ConfirmDialog` | (опционально) | Если тест не требует UI диалога |

### Паттерн vi.mock()

```typescript
// Моки всегда в начале файла, перед импортами

// Mock Next.js Navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'test-user', role: 'ADMIN' } },
    status: 'authenticated',
  })),
}));

// Mock API Client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    postFormData: vi.fn(),
  },
}));
```

---

## 3. Матрица тестов

### Display-компонент

| Секция | Что тестировать |
|--------|----------------|
| **Рендеринг** | Базовые элементы отображаются (название, данные) |
| **Состояния** | loading — спиннер, error — сообщение, empty — EmptyState |
| **Callbacks** | onEdit/onDelete вызваны с корректными аргументами |

### Form-компонент

| Секция | Что тестировать |
|--------|----------------|
| **Рендеринг** | Форма с полями отображается |
| **Состояния** | loading — кнопка блокируется, error — сообщение об ошибке |
| **Валидация** | Пустая форма не отправляется, некорректные данные — ошибка |
| **События** | Submit вызывает onSuccess, Cancel вызывает onCancel |
| **API вызов** | apiClient.post/patch вызван с корректными данными |

### Delete-компонент

| Секция | Что тестировать |
|--------|----------------|
| **Рендеринг** | Кнопка удаления отображается |
| **Подтверждение** | ConfirmDialog открывается/закрывается |
| **События** | Удаление вызывает onSuccess, кнопка блокируется при загрузке |
| **API вызов** | apiClient.delete вызван с корректным ID |

---

## 4. Шаблон render helper

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

interface RenderOptions {
  props?: Partial<MemberCardProps>;
  session?: Session | null;
}

function renderMemberCard(options?: RenderOptions) {
  const { props, session } = options ?? {};

  // Настройка моков
  vi.mocked(useSession).mockReturnValue({
    data: session ? { user: session.user } : null,
    status: session ? 'authenticated' : 'unauthenticated',
  } as any);

  const defaultProps: MemberCardProps = {
    member: { id: '1', firstName: 'Test', lastName: 'User' },
    ...props,
  };

  return render(<MemberCard {...defaultProps} />);
}
```

### Правила render helper

| Правило | Описание |
|---------|----------|
| **Дефолтные props** | Всегда предоставлять дефолтные props для рендера |
| **Partial<> для опциональных** | Позволить переопределение отдельных props |
| **Session mock** | Поддержка тестов авторизации/неавторизации |
| **Возврат render result** | Для доступа к container/baseElement при необходимости |

---

## 5. Структура тестового файла

```typescript
describe('MemberCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('should render member name', () => { ... });
    it('should render member data', () => { ... });
  });

  describe('Состояния', () => {
    it('should show loading state', () => { ... });
    it('should show error state', () => { ... });
    it('should show empty state', () => { ... });
  });

  describe('События', () => {
    it('should call onEdit when edit button clicked', () => { ... });
    it('should call onDelete when delete button clicked', () => { ... });
  });
});
```

---

## 6. Строгие запреты

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ Тестировать реализацию, не поведение | Нарушает @testing-library |
| 2 | ❌ Прямой доступ к DOM-дереву | Используйте `screen.getBy*` |
| 3 | ❌ Мокировать React | React не мокается |
| 4 | ❌ Пропускать `beforeEach` с `vi.clearAllMocks()` | Контаминация между тестами |
| 5 | ❌ Не очищать моки в `afterEach` | Память, утечки |
| 6 | ❌ Мокировать `@/lib/api-client` без импорта | Ошибки компиляции |
| 7 | ❌ Дублировать `render()` без helper | Нарушение DRY |
| 8 | ❌ Пропускать `await waitFor` для async | Race conditions |
| 9 | ❌ Пропускать тесты для loading/error | Полное покрытие сценариев |
| 10 | ❌ Пропускать JSDoc | Spec-Driven Development |

---

## 7. Чек-лист

### Definition of Done

- [ ] Моки всех внешних зависимостей (`next/navigation`, `next-auth/react`, `@/lib/api-client`)
- [ ] `beforeEach` с `vi.clearAllMocks()`
- [ ] `afterEach` с `vi.clearAllMocks()`
- [ ] Helper функция `render<Component>()` с дефолтными props
- [ ] Секция "Рендеринг" — базовые элементы
- [ ] Секция "Состояния" — loading, error, empty
- [ ] Секция "Валидация" (для Form) — пустая форма, некорректные данные
- [ ] Секция "События" (для Form/Delete/Toggle) — callback вызван, кнопка блокируется
- [ ] Секция "Подтверждение" (для Delete) — ConfirmDialog
- [ ] Все тесты PASS — `npm run test:unit`
- [ ] Lint чистый — `npm run lint`
- [ ] Types чистые — `npm run type-check`

---

## 8. Референсы

| Ресурс | Файл |
|--------|------|
| Реальный пример | [`LoginForm.test.jsx`](../../tests/components/features/auth/LoginForm.test.jsx) |
| @testing-library | [Документация](https://testing-library.com/docs/react-testing-library/intro) |
| Vitest | [Документация](https://vitest.dev/) |

---

**Последнее обновление:** 2026-07-16
