# Требования к UI компонентам

## Статус: На обсуждении

---

## 0. Общие положения

Настоящий документ определяет единые требования к созданию, именованию, структуре, декомпозиции, используемым библиотекам и самодокументированию UI компонентов проекта `snt-app`.

### 0.1 Связанные документы

| Документ | Назначение |
|----------|------------|
| [`.roo/rules/architecture.md`](../../../../.roo/rules/architecture.md) | Архитектурные правила, spec-driven development |
| [`.roo/rules/change-rules.md`](../../../../.roo/rules/change-rules.md) | Порядок внесения изменений |
| [`docs/specs/component-spec-requirements.md`](../../component-spec-requirements.md) | Требования к спецификациям компонентов |
| [`docs/specs/component-types-classification.md`](../../component-types-classification.md) | Классификация типов компонентов |
| [`docs/specs/components/component-requirements.md`](../component-requirements.md) | **Базовые требования к компонентам** (принципы, именование, структура, декомпозиция, библиотеки, самодокументирование, ошибки) |
| [`architecture/structure/03-components-lib.md`](../../../architecture/structure/03-components-lib.md) | Структура компонентов и библиотек |

### 0.2 Ссылка на базовые требования

Базовые требования к компонентам (принципы, именование, структура, декомпозиция, библиотеки, самодокументирование, обработка ошибок) определены в документе [`component-requirements.md`](../component-requirements.md).

Этот документ определяет **UI-специфичные требования**, которые дополняют базовые.

---

## 1. UI-специфичное именование и структура

### 1.1 Именование файлов

| Категория | Паттерн | Примеры |
|-----------|---------|---------|
| **UI базовые** | `<component>.tsx` | [`button.tsx`](../../../src/components/ui/button.tsx), [`input.tsx`](../../../src/components/ui/input.tsx) |
| **Layout** | `<layout>.tsx` | [`header.tsx`](../../../src/components/layout/header.tsx), [`sidebar.tsx`](../../../src/components/layout/sidebar.tsx) |
| **Forms** | `<entity>-form.tsx` | [`plot-form.tsx`](../../../src/components/forms/plot-form.tsx), [`member-form.tsx`](../../../src/components/forms/member-form.tsx) |
| **Features** | `<entity>-card.tsx`, `<entity>-item.tsx` | [`plot-card.tsx`](../../../src/components/features/plot-card.tsx), [`vote-option.tsx`](../../../src/components/features/vote-option.tsx) |
| **Providers** | `<context>-provider.tsx` | [`session-provider.tsx`](../../../src/components/providers/session-provider.tsx) |

> ℹ️ **Общие правила** именования компонентов (PascalCase, primary export) — в [`component-requirements.md#1-именование-компонентов`](../component-requirements.md#1-именование-компонентов)

```
src/components/
├── ui/                          # Базовые переиспользуемые компоненты
│   ├── button.tsx              # Кнопки: primary, secondary, danger, ghost
│   ├── input.tsx               # Текстовые поля с label, ошибкой
│   ├── select.tsx              # Выпадающие списки
│   ├── textarea.tsx            # Многострочные поля
│   ├── checkbox.tsx            # Чекбоксы
│   ├── modal.tsx               # Модальные окна
│   ├── table.tsx               # Таблицы с сортировкой
│   ├── card.tsx                # Карточки контента
│   ├── badge.tsx               # Бейджи статуса
│   ├── tabs.tsx                # Вкладки
│   ├── dropdown.tsx            # Выпадающие меню
│   ├── pagination.tsx          # Постраничная навигация
│   ├── spinner.tsx             # Индикаторы загрузки
│   ├── avatar.tsx              # Аватары пользователей
│   ├── alert.tsx               # Алерт-сообщения
│   ├── toast.tsx               # Toast-уведомления
│   ├── file-upload.tsx         # Загрузка файлов
│   └── confirm-dialog.tsx      # Диалоги подтверждения
├── layout/                      # Layout компоненты
│   ├── header.tsx              # Верхняя панель
│   ├── sidebar.tsx             # Боковая навигация (садовод)
│   ├── admin-sidebar.tsx       # Боковая навигация (администратор)
│   ├── footer.tsx              # Нижняя панель
│   └── mobile-nav.tsx          # Мобильная навигация
├── forms/                       # Переиспользуемые формы
│   ├── login-form.tsx          # Форма входа
│   ├── register-form.tsx       # Форма регистрации
│   ├── plot-form.tsx           # Форма участка
│   ├── member-form.tsx         # Форма садовода
│   ├── document-form.tsx       # Форма документа
│   ├── announcement-form.tsx   # Форма объявления
│   ├── vote-form.tsx           # Форма голосования
│   ├── charge-form.tsx         # Форма начисления
│   └── ...
├── features/                    # Доменные компоненты
│   ├── plot-card.tsx           # Карточка участка
│   ├── member-card.tsx         # Карточка садовода
│   ├── document-card.tsx       # Карточка документа
│   ├── announcement-card.tsx   # Карточка объявления
│   ├── vote-card.tsx           # Карточка голосования
│   ├── vote-option.tsx         # Вариант ответа в голосовании
│   ├── charge-row.tsx          # Строка начисления
│   ├── payment-row.tsx         # Строка платежа
│   ├── forum-post.tsx          # Сообщение форума
│   ├── chat-message.tsx        # Сообщение чата
│   └── notification-item.tsx   # Элемент уведомления
└── providers/                   # React Context Providers
    ├── session-provider.tsx    # Session Context
    ├── theme-provider.tsx      # Theme Context (светлая/тёмная)
    └── ws-provider.tsx         # WebSocket Connection Context
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

---

## 3. Требования к декомпозиции

### 3.1 Правило 50 строк

> ⚠️ **Функция-компонент не должна превышать 50 строк кода.** При превышении — разбить на подкомпоненты или хуки.

### 3.2 Иерархия декомпозиции

```
Уровень 0: Страница (src/app/page.tsx, src/app/[feature]/page.tsx)
    ↓
Уровень 1: Layout (Header, Sidebar, Footer)
    ↓
Уровень 2: Feature-контейнеры (PlotList, MemberDashboard)
    ↓
Уровень 3: Feature-компоненты (PlotCard, MemberForm)
    ↓
Уровень 4: Базовые UI компоненты (Button, Input, Select)
    ↓
Уровень 5: Хуки и утилиты (useDebounce, cn)
```

### 3.3 Выделение хуков

```tsx
// Хук для сложной логики состояния
export function usePlotActions(plotId: string) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: deletePlot } = useDeletePlot();

  const handleDelete = useCallback(async () => {
    try {
      await deletePlot(plotId);
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  }, [plotId, deletePlot]);

  return { isEditing, setIsEditing, handleDelete };
}
```

---

## 4. Требования к используемым библиотекам

> ℹ️ **Полный справочник** разрешённых/запрещённых зависимостей — в [`shared/dependencies.md#2-ui--компоненты`](../../shared/dependencies.md#2-ui--компоненты)

### 4.1 Правила импорта

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

### 4.2 Правила зависимости от внешних пакетов

1. **Никаких новых пакетов без согласования.** Перед установкой нового npm-пакета — обсудить в спецификации.
2. **Приоритет zero-dependency библиотекам.** Предпочитать библиотеки без или с минимальным числом зависимостей.
3. **Tree-shakeable.** Библиотека должна поддерживать tree-shaking для минимизации бандла.

### 1.3 UI-специфичное самодокументирование

Для UI-компонентов обязательно включать `@example` с JSX-примерами использования.

> ℹ️ **Полные требования** к JSDoc/TSDoc, шаблоны для хуков и интерфейсов — в [`component-requirements.md#5-самодокументирование-jsdoc-tsdoc`](../component-requirements.md#5-самодокументирование-jsdoc-tsdoc)

---

## 2. Требования к доступности (a11y)

### 2.1 Обязательные элементы

| Требование | Реализация |
|------------|------------|
| **ARIA атрибуты** | `aria-label`, `aria-describedby`, `aria-expanded`, `aria-hidden` |
| **Навигация с клавиатуры** | `tabIndex`, `onKeyDown`, `onKeyPress`, `onFocus`, `onBlur` |
| **Семантические элементы** | `<button>` вместо `<div onClick>`, `<nav>`, `<main>`, `<header>` |
| **Focus management** | `useRef`, `focus()`, `useFocusTrap` для модалок |
| **Screen reader** | `aria-live` для динамического контента |

### 2.2 Пример доступного компонента

```tsx
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onClose()}
      aria-modal="true"
      aria-labelledby="modal-title"
      className="backdrop:bg-black/50 p-8 rounded-lg"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id="modal-title">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Закрыть модальное окно"
          className="p-1 hover:bg-gray-100 rounded"
        >
          <XIcon size={20} />
        </button>
      </div>
      <div>{children}</div>
    </dialog>
  );
}
```

---

## 3. Требования к адаптивности (Responsive)

### 3.1 Breakpoints Tailwind CSS

| Breakpoint | Ширина | Префикс |
|------------|--------|---------|
| **sm** | 640px | `sm:` |
| **md** | 768px | `md:` |
| **lg** | 1024px | `lg:` |
| **xl** | 1280px | `xl:` |
| **2xl** | 1536px | `2xl:` |

### 3.2 Правила адаптивности

```tsx
// ✅ Правильно: mobile-first подход
export function Card({ children, title }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-white',       // base (mobile)
      'sm:p-4',                             // sm: 640px+
      'md:p-6',                             // md: 768px+
      'lg:p-8',                             // lg: 1024px+
      'shadow-sm hover:shadow-md',
    )}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
```

---

## 4. UI-специфичный чек-лист качества

> ℹ️ **Полный чек-лист** UI-компонента — в [`shared/checklists.md#4-ui`](../../shared/checklists.md#4-ui)

---

## 5. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
