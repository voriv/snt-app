# UI Component: SidebarNav

## Статус: На обсуждении

---

## 1. Описание

Боковая панель навигации (Sidebar), доступная авторизованным пользователям на каждой странице авторизованной зоны. Содержит сгруппированные пункты навигации по основным разделам приложения. Поддерживает состояния свёрнутого/развёрнутого вида, подсветку активного пункта навигации.

---

## 2. Публичный API

### Компонент `SidebarNav`

#### Props

| Пропс | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `currentPath` | `string` | `'/'` | Текущий URL-путь для подсветки активного пункта |
| `collapsed` | `boolean` | `false` | Состояние свёрнутости панели |
| `onCollapseChange` | `(collapsed: boolean) => void` | `undefined` | Колбэк при изменении состояния |

### Компонент `AuthenticatedLayout`

#### Props

| Пропс | Тип | Описание |
|-------|-----|----------|
| `children` | `React.ReactNode` | Дочерние компоненты (основной контент) |

#### Логика

1. Проверяет авторизацию через `useSession()` из `next-auth/react`
2. Если пользователь не авторизован — рендерит `children` без сайдбара
3. Если авторизован — оборачивает `children` в layout с `SidebarNav`
4. Показывает лоадер во время проверки сессии (`status === 'loading'`)

---

## 3. Навигационная структура

```
SidebarNav
├── В начало (/)
├── Мои участки
│   ├── Информация (/my-plots/info)
│   └── Взносы (/my-plots/contributions)
├── Все участки
│   ├── Карты участков (/all-plots/map)
│   └── Поиск участка (/all-plots/search)
├── Информация и документы
│   ├── Новости (/info/news)
│   ├── Документы СНТ (/info/documents)
│   └── Важная информация (/info/important)
└── Настройки
    └── Мой Профиль (/profile)
```

---

## 4. Подкомпоненты

### `SidebarNavItem`

Отдельный пункт навигации с иконкой и текстовой меткой.

#### Props

| Пропс | Тип | Описание |
|-------|-----|----------|
| `item` | `SidebarNavItem` | Данные пункта навигации |
| `pathname` | `string` | Текущий путь |
| `activePrefixes` | `string[]` | Активные префиксы путей |
| `collapsed` | `boolean` | Свёрнуто ли меню |

### `SidebarNavGroup`

Группа (раздел) пунктов навигации с заголовком.

#### Props

| Пропс | Тип | Описание |
|-------|-----|----------|
| `group` | `SidebarNavGroup` | Данные группы |
| `pathname` | `string` | Текущий путь |
| `activePrefixes` | `string[]` | Активные префиксы путей |
| `collapsed` | `boolean` | Свёрнуто ли меню |

---

## 5. Стилизация

- Основной контейнер: фиксированная ширина 256px (развёрнут) / 64px (свёрнут)
- Цвета: переменные CSS (`--color-accent`, `--color-text-primary`, `--color-text-secondary`, `--color-bg-secondary`, `--color-border`)
- Активный пункт: фон `var(--color-accent)/10`, текст `var(--color-accent)`
- Hover: фон `var(--color-bg-secondary)`, текст `var(--color-text-primary)`
- Анимация переходов: `transition-all duration-300`
- Заголовки разделов: маленькие, заглавные, tracking-wide

---

## 6. Доступность (a11y)

- `<nav>` с `aria-label="Главная навигация"`
- Кнопка toggle: `aria-expanded`, `aria-label` (с описанием действия)
- Активный пункт: `aria-current="page"`
- Свёрнутый пункт: `title` с текстом для тултипа
- Иконки: `aria-hidden="true"`
- Навигация клавиатурой: стандартная (Tab, Enter, Escape)

---

## 7. Адаптивность

- Desktop: sidebar фиксирован слева, основной контент занимает оставшееся пространство
- Mobile: sidebar скрыт (по требованию будущих итераций)

---

## 8. Зависимости

### Внутренние (проект)

| Компонент | Тип | Описание |
|-----------|-----|----------|
| `cn()` | Utility | Слияние Tailwind классов |

### Внешние (пакеты)

| Пакет | Версия | Описание |
|-------|--------|----------|
| `next/link` | Next.js 15 | Клиентская навигация |
| `next-auth/react` | v5 | Проверка авторизации |

---

## 9. Примеры использования

```tsx
// Страница с sidebar
import { AuthenticatedLayout } from '@/components/layout/sidebar-nav';

export default function MyPage() {
  return (
    <AuthenticatedLayout>
      <h1>Контент страницы</h1>
    </AuthenticatedLayout>
  );
}

// Отдельный sidebar
import { SidebarNav } from '@/components/layout/sidebar-nav';

export default function MyPage() {
  return (
    <div className="flex h-screen">
      <SidebarNav currentPath="/my-plots/info" />
      <main className="flex-1">Контент</main>
    </div>
  );
}
```

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | 2026-06-26 | Начальная версия | architect |
