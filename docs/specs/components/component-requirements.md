# Требования к компонентам проекта

## Статус: На обсуждении

---

## 0. Общие положения

Настоящий документ определяет единые требования к созданию, именованию, структуре, декомпозиции, используемым библиотекам и самодокументированию **всех компонентов** проекта `snt-app`.

UI-специфичные требования определены в отдельном документе [`ui-component-requirements.md`](./ui/ui-component-requirements.md).

### 0.1 Связанные документы

| Документ | Назначение |
|----------|------------|
| [`.roo/rules/architecture.md`](../../../.roo/rules/architecture.md) | Архитектурные правила, spec-driven development |
| [`.roo/rules/change-rules.md`](../../../.roo/rules/change-rules.md) | Порядок внесения изменений |
| [`docs/specs/component-spec-requirements.md`](../component-spec-requirements.md) | Требования к спецификациям компонентов |
| [`docs/specs/component-types-classification.md`](../component-types-classification.md) | Классификация типов компонентов |
| [`docs/specs/components/services/spec-service-template.md`](./services/spec-service-template.md) | Шаблон спецификации Service компонента |
| [`architecture/structure/03-components-lib.md`](../../../architecture/structure/03-components-lib.md) | Структура компонентов и библиотек |
| [`docs/specs/components/ui/ui-component-requirements.md`](./ui/ui-component-requirements.md) | UI-специфичные требования |

### 0.2 Принципы разработки

1. **Типобезопасность.** Все компоненты строго типизированы (TypeScript strict mode). Использование `any`, `unknown` (как обходного пути) или `ts-ignore` запрещено, если явно не разрешено в спецификации.

2. **Декларативность.** Компоненты описывают _что_, а не _как_.

3. **Чистота.** Бизнес-логика в сервисах, компоненты — только представление и UI-поведение.

4. **Переиспользование.** Общие паттерны выносятся в базовые компоненты.

5. **Самодокументирование.** Каждый публичный API компонента описан JSDoc/TSDoc.

6. **Spec-Driven Development.** Перед созданием или изменением компонента необходимо найти соответствующий спецификационный файл в каталоге `specs/`. Если спецификация отсутствует — создать её через Architect Mode.

---

## 1. Именование компонентов

### 1.1 Именование компонентов

Все React-компоненты должны использовать **PascalCase**:

```tsx
// ✅ Правильно: PascalCase для компонентов
export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}

export const PlotCard = () => {};
export const MemberForm = () => {};

// ❌ Неправильно: camelCase для компонентов
export function button({ children }: ButtonProps) {}
export const plotCard = () => {};
```

### 1.2 Именование экспортов

Primary экспорт компонента должен быть по имени компонента:

```tsx
// ✅ Primary export по имени компонента
export function Button({ variant, children }: ButtonProps) {
  return <button className={cn(VARIANT_VARIANTS[variant])}>{children}</button>;
}
```

---

## 2. Структура файлов

### 2.1 Структура файла компонента

Каждый файл компонента должен соблюдать следующую последовательность:

```tsx
// ================================
// 1. Импорт зависимостей
// ================================
import React from 'react';
import { cn } from '@/lib/utils';

// ================================
// 2. Типы и интерфейсы
// ================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// ================================
// 3. Константы (если нужны)
// ================================
const VARIANT_VARIANTS = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'hover:bg-gray-100',
} as const;

const SIZES = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const;

// ================================
// 4. Основной компонент
// ================================
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        VARIANT_VARIANTS[variant],
        SIZES[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2.2 Правила расположения файлов

| Файл | Расположение |
|------|-------------|
| Базовые UI компоненты | `src/components/ui/<name>.tsx` |
| Layout компоненты | `src/components/layout/<name>.tsx` |
| Формы | `src/components/forms/<entity>-form.tsx` |
| Доменные компоненты | `src/components/features/<entity>-<type>.tsx` |
| Провайдеры | `src/components/providers/<context>-provider.tsx` |
| Хуки | `src/hooks/<name>.ts` |
| Утилиты | `src/lib/<name>.ts` |
| API Routes | `src/app/api/<domain>/route.ts` |
| Сервисы | `src/services/<domain>.ts` |
| Репозитории | `src/repositories/<domain>.ts` |

### 2.3 Правила импорта

```typescript
// ✅ Правильно: абсолютные импорты с алиасами
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { Plot, Member } from '@/types';

// ❌ Неправильно: относительные импорты > 2 уровней
import { cn } from '../../../../lib/utils';
import { Button } from '../../../components/ui/button';
```

---

## 3. Декомпозиция компонентов

### 3.1 Правило 50 строк

> ⚠️ **Функция-компонент не должна превышать 50 строк кода.** При превышении — разбить на подкомпоненты или хуки.

### 3.2 Критерии выделения подкомпонента

| Критерий | Пример |
|----------|--------|
| **Повторяющийся UI** | Карточка участника в списке и в модальном окне → `MemberCard` |
| **Сложная логика** > 50 строк | Форма с валидацией → `Form` + `FormField` + `FormValidation` |
| **Разделение ответственности** | Список + отрисовка элемента → `PlotList` + `PlotCard` |
| **Переиспользование** | Кнопка с вариантами → `Button` (variant prop) |
| **Сложные события** | Drag-and-drop, виртуальный скролл → `useDragDrop`, `useVirtualScroll` |

### 3.3 Пример декомпозиции

```tsx
// ❌ ПЛОХО: один компонент для всего
export function PlotCard({ plot }: PlotCardProps) {
  // 150 строк: заголовок, содержание, действия, валидация, отрисовка
}

// ✅ ХОРОШО: декомпозиция на подкомпоненты
export function PlotCard({ plot }: PlotCardProps) {
  return (
    <Card>
      <PlotCardHeader plot={plot} />
      <PlotCardContent plot={plot} />
      <PlotCardActions plot={plot} />
    </Card>
  );
}

export function PlotCardHeader({ plot }: PlotCardHeaderProps) {
  // 20 строк
}

export function PlotCardContent({ plot }: PlotCardContentProps) {
  // 30 строк
}

export function PlotCardActions({ plot }: PlotCardActionsProps) {
  // 25 строк
}
```

---

## 4. Библиотеки и зависимости

> ℹ️ **Полный справочник** разрешённых/запрещённых зависимостей — в [`shared/dependencies.md#2-ui--компоненты`](../../shared/dependencies.md#2-ui--компоненты)

### 4.1 Правила зависимости от внешних пакетов

1. **Никаких новых пакетов без согласования.** Перед установкой нового npm-пакета — обсудить в спецификации.
2. **Приоритет zero-dependency библиотекам.** Предпочирать библиотеки без или с минимальным числом зависимостей.
3. **Tree-shakeable.** Библиотека должна поддерживать tree-shaking для минимизации бандла.

---

## 5. Самодокументирование (JSDoc/TSDoc)

### 5.1 Обязательные JSDoc аннотации

Все **публичные** функции и интерфейсы должны иметь JSDoc/TSDoc аннотации:

| Элемент | Требуется | Описание |
|---------|-----------|----------|
| **Описание** | Да | Краткое назначение компонента/функции |
| **@param** | Да | Все параметры с описанием |
| **@returns** | Да | Описание возвращаемого значения |
| **@example** | Да (для UI) | Пример использования в JSX/TypeScript |
| **@remarks** | Опционально | Дополнительная информация, предупреждения |
| **@public** | Да (для публичных) | Маркер публичного API |

### 5.2 Шаблон JSDoc для UI компонента

```tsx
/**
 * Кнопка с различными вариантами стилизации и размерами.
 *
 * @remarks
 * Используется как базовый UI-компонент для действий пользователя.
 * Поддерживает 4 варианта стиля (primary, secondary, danger, ghost)
 * и 3 размера (sm, md, lg).
 *
 * @param props - Свойства компонента
 * @param props.variant - Стиль кнопки: primary, secondary, danger, ghost
 * @param props.size - Размер кнопки: sm, md, lg
 * @param props.className - Дополнительные Tailwind классы
 * @param props.children - Содержимое кнопки (текст, иконка)
 * @param props.disabled - Состояние отключено (неактивна)
 * @param props.onClick - Обработчик клика
 *
 * @example
 * ```tsx
 * // Основная кнопка
 * <Button variant="primary" size="lg">
 *   Сохранить
 * </Button>
 *
 * // Кнопка удаления
 * <Button variant="danger" onClick={handleDelete}>
 *   Удалить
 * </Button>
 *
 * // Кнопка с иконкой
 * <Button variant="ghost" size="sm">
 *   <DownloadIcon />
 *   <span>Скачать</span>
 * </Button>
 * ```
 *
 * @public
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        VARIANT_VARIANTS[variant],
        SIZES[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 5.3 Шаблон JSDoc для хука

```tsx
/**
 * Хук для дебаунса значения с возвратом последнего значения.
 *
 * @remarks
 * Применяется для отложенных запросов поиска и ввода.
 * Сбрасывает таймер при каждом новом изменении значения.
 *
 * @param value - Значение для дебаунса
 * @param delay - Задержка в миллисекундах (по умолчанию 300ms)
 * @returns Дебаунсированное значение того же типа, что и входное
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 *
 * @public
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### 5.4 Шаблон JSDoc для TypeScript интерфейса

```tsx
/**
 * Интерфейс свойств компонента PlotCard.
 */
export interface PlotCardProps {
  /** Данные участка */
  plot: Plot;
  /** Обработчик клика по карточке */
  onClick?: (plot: Plot) => void;
  /** Режим отображения: list, grid, compact */
  variant?: 'list' | 'grid' | 'compact';
  /** Дополнительные CSS классы обёртки */
  className?: string;
}
```

### 5.5 Чек-лист самодoкументирования

- [ ] Все публичные компоненты имеют JSDoc сверху
- [ ] Все публичные интерфейсы Props имеют JSDoc
- [ ] Все параметры описаны через `@param`
- [ ] Возвращаемое значение описано через `@returns` (для функций/хуков)
- [ ] Пример использования приведён в `@example`
- [ ] Нет `any` в описании типов — использовать конкретные типы

---

## 6. Обработка ошибок

### 6.1 Правило нулевого игнорирования ошибок

> ⚠️ **НИКОГДА не игнорировать ошибки.** Каждый promise/result должен иметь явную обработку ошибок.

Использовать явные типизированные ошибки или доменно-специфичные классы ошибок. Избегать бросания generic `Error` или перехвата `any`.

### 6.2 Обязательные элементы обработки

| Сценарий | Требование |
|----------|------------|
| **Async операции** | `try/catch` или `.catch()` с обработкой |
| **REST API** | Обработка ответов: `{ data }` или `{ error: { code, message } }` |
| **API вызовы** | Обработка 4xx, 5xx статусов |
| **Loading/Empty states** | Отображение скелетонов, пустых состояний |
| **Error boundary** | Обработка crash-состояний в UI |

### 6.3 Шаблон обработки ошибок

```tsx
export async function createPlot(data: CreatePlotInput) {
  try {
    const result = await prisma.plot.create({ data });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Участок с таким номером уже существует' };
      }
    }
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}
```

---

## 7. Тестирование

### 7.1 Требование单元测试 для бизнес-логики

> Перед объячением задачи завершённой необходимо написать unit-тесты для бизнес-логики (Service layer).

### 7.2 Уровни тестирования

| Слой | Тип тестов | Инструмент |
|------|------------|------------|
| **Services** | Unit-тесты бизнес-логики | Jest / Vitest |
| **Utils/Hooks** | Unit-тесты чистых функций | Jest / Vitest |
| **UI Components** | Component-тесты | React Testing Library |
| **Integrations** | Integration-тесты | Jest + MSW |

### 7.3 Правила тестирования

1. Тесты должны писаться **до** или **во время** реализации, а не после.
2. Каждый тест должен иметь понятное описание сценария.
3. Покрытие сервисного слоя — минимум 80%.
4. Запуск тестов обязателен перед мержем.

---

## 8. Архитектурные ограничения

### 8.1 Clean Architecture / Layered Architecture

Строго соблюдать разделение ответственности между слоями:

| Слой | Назначение | Запрещено |
|------|------------|-----------|
| **Handlers/Controllers/Route** | HTTP/API слой | Бизнес-логика |
| **Services** | Чистая бизнес-логика | Зависимости от фреймворков |
| **Repositories** | Доступ к БД/хранилищу | Бизнес-логика |

### 8.2 Управление состоянием

Все состояния приложения должны быть явными. Глобальные мутабельные переменные запрещены.

### 8.3 Type Safety

Режим `strict: true` активен. Использование `any`, `unknown` (как обходного пути), или `ts-ignore` строго запрещено, если явно не разрешено в спецификации.

---

## 9. Чек-лист качества компонента

> ℹ️ **Полный чек-лист** качества компонента — в [`shared/checklists.md#1-общий-чек-лист-компонента`](../../shared/checklists.md#1-общий-чек-лист-компонента)

---

## 10. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
