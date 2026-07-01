# US-4: Logout — Спецификации компонентов

## Обзор

Спецификации UI компонентов для реализации функционала logout пользователя из US-4-logout.md.

## Модель данных

**Без изменений** — logout работает через уничтожение JWT-сессии NextAuth, не требует операций с БД.

---

## Компоненты

### 1. ConfirmDialog — UI компонент модального диалога

**Файл:** `src/components/ui/ConfirmDialog/ConfirmDialog.tsx`

```typescript
/**
 * @component ConfirmDialog
 * @category ui
 * @description Переиспользуемый компонент модального диалога подтверждения действий
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isLogoutModalOpen}
 *   onClose={() => setIsLogoutModalOpen(false)}
 *   title="Выход из системы"
 *   message="Вы действительно хотите выйти?"
 *   confirmLabel="Выйти"
 *   cancelLabel="Отмена"
 *   onConfirm={handleLogout}
 *   isLoading={isLoggingOut}
 *   variant="danger"
 * />
 * ```
 *
 * @spec
 * - Состояния: isOpen=true — диалог отображается, isOpen=false — скрыт
 * - Закрытие: через onClose (кнопка «Отмена»), клик вне области, клавиша Escape
 * - Варианты кнопки подтверждения: primary (default), danger (деструктивное действие)
 * - При isLoading=true: кнопка подтверждения блокируется, показывается спиннер
 * - Модальное окно блокирует скроллинг основного контента (modal backdrop)
 * - Доступность: фокус на кнопку подтверждения при открытии, Escape закрывает
 */
export interface ConfirmDialogProps {
  /** Показывать ли модальное окно */
  isOpen: boolean;
  /** Функция вызывается при закрытии диалога (отмена) */
  onClose: () => void;
  /** Заголовок диалога */
  title: string;
  /** Текст сообщения/вопроса */
  message: string;
  /** Текст кнопки подтверждения @default 'Подтвердить' */
  confirmLabel?: string;
  /** Текст кнопки отмены @default 'Отмена' */
  cancelLabel?: string;
  /** Функция вызывается при подтверждении действия */
  onConfirm: () => void;
  /** Показывать индикатор загрузки при выполнении действия @default false */
  isLoading?: boolean;
  /** Вариант кнопки подтверждения: primary (default), danger (@default 'primary') */
  variant?: 'primary' | 'danger';
}

export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
```

**Связанные User Story:**
- US-4-logout.md — FR-2, AC-3, AC-4, AC-5, AC-6, AC-8

---

### 2. LogoutButton — Client Component кнопки logout

**Файл:** `src/components/features/auth/LogoutButton/LogoutButton.tsx`

```typescript
/**
 * @component LogoutButton
 * @category features
 * @description Кнопка выхода из системы с модальным окном подтверждения
 *
 * @description
 * Компонент отображает кнопку «Выйти» в навбаре. При нажатии открывается
 * модальное окно подтверждения. После подтверждения вызывается signOut() из next-auth/react.
 *
 * @example
 * ```tsx
 * <LogoutButton onLogoutComplete={() => console.log('Logged out')} />
 * ```
 *
 * @spec
 * - При нажатии на кнопку открывается ConfirmDialog с текстом «Вы действительно хотите выйти?»
 * - При подтверждении вызывается signOut({ callbackUrl: '/' }) из next-auth/react
 * - При isLoading=true в модальном окне: кнопка «Выйти» блокируется
 * - После signOut пользователь перенаправляется на /
 * - Обработка ошибок: при ошибке signOut показывается error toast (вне скелета)
 *
 * @data-flow
 * - Клик на «Выйти» → isOpen=true → ConfirmDialog
 * - Клик на «Выйти» (danger) → onConfirm → signOut({ callbackUrl: '/' })
 * - signOut завершён → redirect to /
 */
export interface LogoutButtonProps {
  /**callback функция после успешного logout */
  onLogoutComplete?: () => void;
}

/**
 * Хук для управления состоянием logout
 *
 * @param props - Опции компонента
 * @param props.onLogoutComplete - Callback после успешного logout
 *
 * @returns {Object} - Объект с полями isOpen, isLoggingOut, handleLogoutClick, handleCloseModal, handleLogout
 */
interface UseLogoutResult {
  /** Показывать ли модальное окно */
  isOpen: boolean;
  /** Выполняется ли logout */
  isLoggingOut: boolean;
  /** Обработчик клика на кнопку «Выйти» */
  handleLogoutClick: () => void;
  /** Закрытие модального окна */
  handleCloseModal: () => void;
  /** Выполнение logout */
  handleLogout: () => Promise<void>;
}

/**
 * Хук управления состоянием logout
 *
 * @spec
 * - isOpen=false по умолчанию
 * - При handleLogoutClick → isOpen=true
 * - При handleCloseModal → isOpen=false
 * - При handleLogout → isLoggingOut=true, вызывается signOut, затем isLoggingOut=false
 * - signOut использует callbackUrl: '/'
 *
 * @see https://next-auth.js.org/getting-started/client#signout
 */
function useLogout(props: LogoutButtonProps): UseLogoutResult {
  throw new Error('Not implemented');
}

/**
 * Кнопка выхода из системы
 *
 * @spec
 * - Отображает кнопку «Выйти» (variant='ghost')
 * - При клике вызывает handleLogoutClick
 * - Внутри использует ConfirmDialog для подтверждения
 */
export function LogoutButton(props: LogoutButtonProps): JSX.Element {
  throw new Error('Not implemented');
}
```

**Связанные User Story:**
- US-4-logout.md — FR-1, FR-2, FR-3, AC-3, AC-7, AC-11

---

### 3. AppLayout — доработка layout

**Файл:** `src/components/layouts/AppLayout.tsx`

**Текущее состояние:**
- Навбар с ссылками на разделы
- Нет отображения информации о пользователе
- Нет кнопки logout

**Необходимые изменения:**

```typescript
/**
 * @component AppLayout
 * @description Обёртка для страниц авторизованной зоны с навбаром и пользовательской информацией
 *
 * @spec
 * - Отображает имя пользователя (session.user.name), если name не null
 * - При null name показывает email пользователя (session.user.email)
 * - В правом углу навбара отображает LogoutButton
 * - Использует useSession из next-auth/react для получения сессии
 * - При загрузке сессии показывает placeholder или пустой блок
 * - Все страницы внутри /(dashboard)/* используют этот layout через dashboard/layout.tsx
 *
 * @data-flow
 * - AppLayout → useSession() → session.user.name/email + LogoutButton
 */
import { SessionProvider } from 'next-auth/react';

/**
 * Обёртка для страниц авторизованной зоны
 *
 * @param children - Дочерние компоненты
 *
 * @spec
 * - Обёрнут в SessionProvider для доступа к useSession в дочерних компонентах
 * - Рендерит AppLayoutChildren с доступом к сессии
 */
export function AppLayout({ children }: { children: React.ReactNode }): JSX.Element {
  throw new Error('Not implemented');
}

/**
 * Внутренний компонент с доступом к сессии
 *
 * @param session - Объект сессии из useSession
 *
 * @spec
 * - Если session.user.name существует и не null → показывает имя
 * - Иначе → показывает session.user.email
 * - Всегда показывает LogoutButton справа
 */
function AppLayoutChildren({ session }: { session: NonNullable<ReturnType<typeof useSession>['data']> }): JSX.Element {
  throw new Error('Not implemented');
}
```

**Связанные User Story:**
- US-4-logout.md — FR-1, AC-1, AC-2, AC-11

---

## Влияние на другие слои

### Repository
- **Без изменений** — logout не требует доступа к БД

### Service
- **Без изменений** — logout не содержит бизнес-логики, используется NextAuth client-side API

### API
- **Без изменений** — используется существующий маршрут `/api/auth/[...nextauth]` для signOut

### Model
- **Без изменений** — сессия NextAuth уничтожается через signOut(), новые поля/таблицы не нужны

---

## Связанные файлы для экспорта

### `src/components/ui/index.ts`
Добавить export для ConfirmDialog:
```typescript
export { ConfirmDialog } from './ConfirmDialog';
```

### `src/components/features/auth/LogoutButton/index.ts`
```typescript
export { LogoutButton } from './LogoutButton';
export type { LogoutButtonProps } from './LogoutButton';
```

### `src/components/features/auth/index.ts`
Создать новый файл:
```typescript
export { LogoutButton } from './LogoutButton';
export type { LogoutButtonProps } from './LogoutButton';
```

---

## Валидация соответствия User Story

| ID | Требование US-4 | Реализация компонентом | Статус |
|----|-----------------|------------------------|--------|
| FR-1 | Отображение имени/email в навбаре | AppLayout (useSession) | ✓ |
| FR-2 | Модальное окно подтверждения | ConfirmDialog | ✓ |
| FR-3 | Вызов signOut({ callbackUrl: '/' }) | LogoutButton (useLogout) | ✓ |
| FR-4 | Редирект на / | signOut callbackUrl | ✓ (NextAuth) |
| FR-5 | Доступность на всех страницах dashboard/* | AppLayout в dashboard/layout.tsx | ✓ |
| FR-6 | Состояние загрузки при logout | ConfirmDialog isLoading | ✓ |
| AC-1 | Показ имени при name не null | AppLayoutChildren | ✓ |
| AC-2 | Показ email при name null | AppLayoutChildren | ✓ |
| AC-3 | Открытие модального окна | LogoutButton → ConfirmDialog | ✓ |
| AC-4 | Закрытие по кнопке «Отмена» | ConfirmDialog onClose | ✓ |
| AC-5 | Закрытие по клику вне | ConfirmDialog onClose | ✓ |
| AC-6 | Закрытие по Escape | ConfirmDialog onClose | ✓ |
| AC-7 | Выполнение logout | LogoutButton handleLogout | ✓ |
| AC-8 | Блокировка кнопки при isLoading | ConfirmDialog isLoading | ✓ |
| AC-11 | Доступность logout на всех страницах | AppLayout | ✓ |

---

## Примечания

1. **NextAuth signOut** — использует `signOut({ callbackUrl: '/' })` из `next-auth/react`
2. **useSession** — хук для получения сессии из `next-auth/react`
3. **SessionProvider** — должен быть обернут вокруг AppLayout для доступа к useSession
4. **Конфигурация NextAuth** — см. `src/lib/auth.ts` и `src/infrastructure/auth/auth.config.ts`

---

## История версий

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-06-29 | — | Создание спецификаций для US-4 logout |
