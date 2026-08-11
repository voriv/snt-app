# E2E-тестирование — Playwright

## Обзор

End-to-End (E2E) тесты проверяют полные пользовательские сценарии от начала до конца, имитируя реальное поведение пользователя в браузере.

**Стек:** Playwright  
**Среда:**headed/ headless режимы  
**Селлектор:** CSS-селекторы, тестовые IDs

---

## 1. Структура тестовой папки

```
tests/e2e/
├── auth/
│   ├── login.e2e.spec.ts               # Вход (US-04, US-05)
│   ├── register.e2e.spec.ts            # Регистрация (US-06, US-07)
│   ├── auth-errors.e2e.spec.ts         # Ошибки аутентификации (US-11)
│   ├── callback-url.spec.ts            # Callback URL при редиректе
│   ├── landing-redirect.e2e.spec.ts    # Редирект с лендинга
│   ├── change-password.e2e.spec.ts     # Смена пароля (US-12, B-015) ✨ НОВЫЙ
│   └── helpers.ts                      # Помощники для auth-тестов
├── announcements/
│   └── announcements.e2e.spec.ts       # Объявления (US-21-27..29)
├── chats/
│   └── chats.e2e.spec.ts               # Групповые чаты (US-21-04..06)
├── comms/
│   ├── comms-tabs.e2e.spec.ts          # Навигация по вкладкам (US-21-36)
│   ├── conversations-list.e2e.spec.ts  # Список диалогов (US-21-01)
│   └── new-conversation.e2e.spec.ts    # Новый диалог (US-21-02)
├── documents/
│   ├── documents-categories.e2e.spec.ts # Категории документов (US-22-01..02)
│   ├── documents-upload.e2e.spec.ts     # Загрузка (US-22-03..04)
│   ├── documents-list.e2e.spec.ts       # Список (US-22-05)
│   ├── documents-detail.e2e.spec.ts     # Детали (US-22-06)
│   ├── documents-edit.e2e.spec.ts       # Редактирование (US-22-07)
│   └── fixtures.ts                      # Фикстуры для documents
├── navigation/
│   ├── 404.e2e.spec.ts                 # Страница 404 (US-NAV-03)
│   ├── breadcrumbs.e2e.spec.ts          # Хлебные крошки (US-NAV-06)
│   ├── mobile-menu.e2e.spec.ts          # Мобильное меню (US-NAV-07)
│   ├── redirects.e2e.spec.ts            # Редиректы (US-NAV-01)
│   └── sidebar.e2e.spec.ts             # Боковое меню (US-NAV-05)
├── plots/
│   ├── plot-card-view.e2e.spec.ts      # Карточка участка (US-17)
│   ├── plot-creation.e2e.spec.ts       # Создание (US-14)
│   ├── plot-deletion.e2e.spec.ts       # Удаление (US-16)
│   ├── plot-editing.e2e.spec.ts        # Редактирование (US-15)
│   ├── plot-list.e2e.spec.ts           # Список участков
│   ├── plot-search.e2e.spec.ts         # Поиск (US-18)
│   └── fixtures.ts                     # Фикстуры для plots
├── profile/
│   └── profile.e2e.spec.ts             # Профиль (US-19-01..06)
├── roles/
│   ├── role-guard.e2e.spec.ts          # Защита по ролям (US-03)
│   └── roles-crud.e2e.spec.ts          # CRUD ролей
├── users/
│   └── users.e2e.spec.ts               # Управление пользователями (US-20-01..04)
└── shared/
    ├── test-helpers.ts                 # Общие помощники (login, createPlot, etc.)
    └── .gitkeep
```

---

## 2. Конфигурация Playwright

### [`playwright.config.ts`](../../playwright.config.ts) (актуальный)

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright конфигурация для E2E тестирования SNT App
 * @see https://playwright.dev/docs/configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  timeout: 60000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5433/snt_test',
    },
  },
  testIgnore: '**/*.test.ts', // Ignore vitest test files
});
```

---

## 3. Глобальная настройка и фикстуры

### tests/e2e/setup.ts

```typescript
import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Авторизация для сохранения сессии
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Пароль').fill('Test1234!');
  await page.getByRole('button', { name: /войти|sign in/i }).click();
  await page.waitForURL('/dashboard');
  
  // Сохранение состояния аутентификации
  await page.context().storageState({ path: authFile });
});
```

### tests/e2e/shared/fixtures.ts

```typescript
import { test as base } from '@playwright/test';
import { loginAsAdmin, loginAsMember, createTestPlot } from './test-helpers';

export const test = base.extend<{
  adminContext: import('@playwright/test').BrowserContext;
  memberContext: import('@playwright/test').BrowserContext;
}>({
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: require.resolve('../playwright/.auth/admin.json'),
    });
    await use(context);
    await context.close();
  },
  memberContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: require.resolve('../playwright/.auth/user.json'),
    });
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

---

## 4. Примеры E2E-тестов

### tests/e2e/auth.spec.ts — Аутентификация

```typescript
import { test, expect } from '../e2e/shared/fixtures';

test.describe('Аутентификация', () => {
  test('AC-1: Регистрация нового пользователя', async ({ page }) => {
    // Navigating to registration page
    await page.goto('/register');
    
    // Filling registration form
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Пароль').fill('Test1234!');
    await page.getByLabel('Имя').fill('Новый');
    await page.getByLabel('Фамилия').fill('Пользователь');
    
    // Submitting form
    await page.getByRole('button', { name: /зарегистрироваться|register/i }).click();
    
    // Verifying success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Новый Пользователь')).toBeVisible();
  });

  test('AC-1: Вход с невалидным паролем', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Пароль').fill('WrongPassword123!');
    await page.getByRole('button', { name: /войти|sign in/i }).click();
    
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Неверный email или пароль');
  });

  test('AC-4: Выход из системы', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /профиль|menu/i }).click();
    await page.getByRole('menuitem', { name: /выйти|logout/i }).click();
    
    await expect(page).toHaveURL('/login');
  });
});
```

### tests/e2e/plots.spec.ts — Управление участками

```typescript
import { test, expect } from '../e2e/shared/fixtures';

test.describe('Управление участками', () => {
  test('AC-2: Создание нового участка', async ({ page }) => {
    await page.goto('/dashboard/plots');
    
    // Открытие формы создания
    await page.getByRole('button', { name: /добавить|создать|new plot/i }).click();
    
    // Заполнение формы
    await page.getByLabel('Номер участка').fill('42');
    await page.getByLabel('Кадастровый номер').fill('54:12:1234567:8901');
    await page.getByLabel('Площадь (м²)').fill('600');
    await page.getByLabel('Адрес').fill('ул. Садовая, д. 42');
    
    // Отправка формы
    await page.getByRole('button', { name: /сохранить|save/i }).click();
    
    // Проверка успеха
    await expect(page.getByText('Участок успешно создан')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
  });

  test('AC-2: Валидация формы создания', async ({ page }) => {
    await page.goto('/dashboard/plots');
    await page.getByRole('button', { name: /добавить|создать/i }).click();
    
    // Отправка без заполнения
    await page.getByRole('button', { name: /сохранить/i }).click();
    
    await expect(page.getByText('Номер участка обязателен')).toBeVisible();
    await expect(page.getByText('Площадь должна быть больше 0')).toBeVisible();
  });

  test('AC-5: Редактирование участка', async ({ page }) => {
    await page.goto('/dashboard/plots');
    await page.getByRole('button', { name: /редактировать|edit/i }).first().click();
    
    await page.getByLabel('Адрес').fill('ул. Цветочная, д. 10');
    await page.getByRole('button', { name: /сохранить/i }).click();
    
    await expect(page.getByText('Участок обновлён')).toBeVisible();
    await expect(page.getByText('ул. Цветочная')).toBeVisible();
  });

  test('AC-6: Удаление участка с подтверждением', async ({ page }) => {
    await page.goto('/dashboard/plots');
    await page.getByRole('button', { name: /удалить|delete/i }).first().click();
    
    // Подтверждение удаления
    await page.getByRole('button', { name: /подтвердить|delete/i }).click();
    
    await expect(page.getByText('Участок удалён')).toBeVisible();
    await expect(page.getByText('42')).not.toBeVisible();
  });

  test('AC-7: Поиск по участкам', async ({ page }) => {
    await page.goto('/dashboard/plots');
    
    await page.getByLabel('Поиск').fill('42');
    await expect(page.getByText('42')).toBeVisible();
    
    await page.getByLabel('Поиск').fill('999');
    await expect(page.getByText('Не найдено')).toBeVisible();
  });

  test('AC-7: Фильтрация по кадастровому номеру', async ({ page }) => {
    await page.goto('/dashboard/plots');
    
    await page.getByLabel('Кадастровый номер').fill('54:12:');
    // Фильтрация по кадастру
    await expect(page.getByRole('table')).toBeVisible();
  });
});
```

### tests/e2e/plot-users.spec.ts — Управление участниками

```typescript
import { test, expect } from '../e2e/shared/fixtures';

test.describe('Управление участниками', () => {
  test('AC-3: Создание связи участка и участника', async ({ page }) => {
    await page.goto('/dashboard/plot-users');
    
    await page.getByRole('button', { name: /добавить|создать/i }).click();
    
    await page.getByLabel('Участок').selectOption('42');
    await page.getByLabel('Участник').selectOption('Иван Иванов');
    
    await page.getByRole('button', { name: /сохранить/i }).click();
    
    await expect(page.getByText('Связь создана')).toBeVisible();
  });

  test('AC-3: Фильтрация участников', async ({ page }) => {
    await page.goto('/dashboard/plot-users');
    
    // Фильтр по участку
    await page.getByLabel('Участок').selectOption('42');
    await expect(page.getByRole('table')).toBeVisible();
    
    // Фильтр по статусу
    await page.getByLabel('Статус').selectOption('active');
  });

  test('AC-3: Поиск участников по имени', async ({ page }) => {
    await page.goto('/dashboard/plot-users');
    
    await page.getByLabel('Поиск').fill('Иван');
    await expect(page.getByText('Иван Иванов')).toBeVisible();
  });

  test('AC-3: Деактивация участника', async ({ page }) => {
    await page.goto('/dashboard/plot-users');
    
    await page.getByRole('button', { name: /деактивировать|deactivate/i }).first().click();
    
    await expect(page.getByText('Участник деактивирован')).toBeVisible();
  });

  test('AC-3: Удаление связи', async ({ page }) => {
    await page.goto('/dashboard/plot-users');
    
    await page.getByRole('button', { name: /удалить|delete/i }).first().click();
    
    await expect(page.getByText('Связь удалена')).toBeVisible();
  });
});
```

### tests/e2e/profile.spec.ts — Редактирование профиля

```typescript
import { test, expect } from '../e2e/shared/fixtures';

test.describe('Профиль пользователя', () => {
  test('AC-4: Редактирование профиля', async ({ page }) => {
    await page.goto('/dashboard/profile');
    
    await page.getByLabel('Имя').fill('Обновлённое Имя');
    await page.getByLabel('Фамилия').fill('Обновлённая Фамилия');
    await page.getByLabel('Телефон').fill('+7 (999) 123-45-67');
    
    await page.getByRole('button', { name: /сохранить/i }).click();
    
    await expect(page.getByText('Профиль обновлён')).toBeVisible();
  });

  test('AC-4: Смена темы (светлая → тёмная)', async ({ page }) => {
    await page.goto('/dashboard/profile');
    
    // Переключение темы
    const themeToggle = page.getByRole('button', { name: /тема|theme/i });
    await themeToggle.click();
    
    // Проверка смены темы
    await expect(page.locator('html')).not.toHaveAttribute('class', '*light*');
  });

  test('AC-4: Загрузка аватара', async ({ page }) => {
    await page.goto('/dashboard/profile');
    
    await page.getByLabel('Аватар').setInputFiles('tests/e2e/fixtures/test-avatar.png');
    
    await expect(page.getByAltText('Аватар пользователя')).toBeVisible();
  });
});
```

### tests/e2e/navigation.spec.ts — Навигация и доступ по ролям

```typescript
import { test, expect } from '../e2e/shared/fixtures';

test.describe('Навигация и доступ', () => {
  test('Переход между разделами', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: /участки|plots/i }).click();
    await expect(page).toHaveURL('/dashboard/plots');
    
    await page.getByRole('link', { name: /участники|members/i }).click();
    await expect(page).toHaveURL('/dashboard/plot-users');
  });

  test('Доступ к страницам по ролям', async ({ adminContext }) => {
    const page = await adminContext.newPage();
    await page.goto('/dashboard/roles');
    
    await expect(page).toHaveURL('/dashboard/roles');
  });

  test('Редирект с защищённой страницы на login', async ({ page }) => {
    await page.goto('/login');
    await page.addInitScript(() => {
      localStorage.removeItem('next-auth.session-token');
    });
    
    await page.goto('/dashboard/plots');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## 6. Запуск E2E-тестов

### Команды (через npm scripts)

```bash
# Запуск всех E2E-тестов (3 браузера)
npm run test:e2e

# Запуск в headed режиме для отладки
npm run test:e2e:headed

# Запуск конкретного теста
npx playwright test auth/change-password.e2e.spec.ts --project=chromium

# Запуск одного файла в headed режиме
npx playwright test auth/change-password.e2e.spec.ts --headed --project=chromium

# Запуск с UI-режимом (Playwright Inspector)
npx playwright test --ui --project=chromium

# Открытие отчёта
npx playwright show-report

# Открытие Trace Viewer для упавшего теста
npx playwright show-trace test-results/*/trace.zip
```

### CI/CD интеграция

```yaml
# .github/workflows/e2e-tests.yml (пример)
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 7. Паттерны и лучшие практики

### 7.1. Тестовые данные

```typescript
// tests/e2e/shared/test-helpers.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'ADMIN' as const,
  },
  member: {
    email: 'member@test.com',
    password: 'Test1234!',
    role: 'MEMBER' as const,
  },
};

export const testPlots = {
  valid: {
    plotNumber: '42',
    cadastralNumber: '54:12:1234567:8901',
    area: 600,
    address: 'ул. Садовая, д. 42',
  },
};
```

### 7.2. Селекторы

```typescript
// ✅ Правильно: доступные селекторы
page.getByRole('button', { name: /сохранить/i })
page.getByLabel('Email')
page.getByRole('link', { name: /участки/i })
page.getByText('Участок успешно создан')

// ❌ Неправильно: хрупкие CSS-селекторы
page.locator('.btn-primary')
page.locator('div > div > button')
```

### 7.3. Ожидания

```typescript
// ✅ Правильно: явные ожидания
await expect(page).toHaveURL('/dashboard')
await expect(page.getByText('Участок создан')).toBeVisible()
await page.waitForResponse(response => 
  response.url().includes('/api/v1/plots') && response.status() === 201
)

// ❌ Неправильно: фиксированные задержки
await page.waitForTimeout(1000)
```

### 7.4. Авторизация в тестах

```typescript
// ✅ Вариант 1: Использование storageState (быстрее)
const context = await browser.newContext({
  storageState: authFile,
});

// ✅ Вариант 2: Прямая авторизация (реалистичнее)
await page.goto('/login');
await page.getByLabel('Email').fill('test@example.com');
await page.getByLabel('Пароль').fill('Test1234!');
await page.getByRole('button', { name: /войти/i }).click();
await page.waitForURL('/dashboard');
```

---

## 8. Цели покрытия

| Аспект | Цель |
|--------|------|
| Ключевые пользовательские сценарии | 100% |
| Позитивные сценарии | 100% |
| Негативные сценарии (валидация) | 90% |
| Кросс-браузерность (Chromium, Firefox, WebKit) | 100% |
| Мобильная адаптивность | 80% |

---

## 9. Интеграция с другими тестами

```mermaid
flowchart LR
    Unit[Unit-тесты<br/>Vitest] --> Integration
    Integration[Integration-тесты<br/>PG Docker] --> API
    API[API-тесты<br/>supertest] --> E2E
    E2E[E2E-тесты<br/>Playwright] --> CI
    CI[CI/CD Pipeline]
    
    style Unit fill:#e1f5fe
    style Integration fill:#f3e5f5
    style API fill:#e8f5e9
    style E2E fill:#fff3e0
    style CI fill:#ffebee
```

**Взаимосвязь:**
- Unit-тесты проверяют бизнес-логику изолированно
- Integration-тесты проверяют работу с БД
- API-тесты проверяют HTTP-контракты
- E2E-тесты проверяют полные пользовательские сценарии

**Золотое правило:** E2E-тесты должны покрывать только критические пользовательские пути, которые невозможно проверить на нижних уровнях тестовой пирамиды.

---

## 10. Частые ошибки и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| Тесты нестабильны (flaky) | Отсутствие явных ожиданий | Использовать `expect()` вместо `waitForTimeout()` |
| Медленный запуск | Создание данных в каждом тесте | Использовать `storageState` для авторизации, транзакционный rollback |
| Ошибки селекторов | Использование CSS-классов | Перейти на `getByRole()`, `getByLabel()` |
| Конфликт тестов | Общие тестовые данные | Изолировать данные через уникальные префиксы |
| Ошибки авторизации | Устаревший storageState | Обновлять `setup.ts` при изменении форм входа |

---

## 11. Связь с другими документами

| Документ | Связь |
|----------|-------|
| [`docs/tests/README.md`](README.md) | Общий реестр тестовых подходов |
| [`docs/tests/unit-tests.md`](unit-tests.md) | Unit-тесты для Service-слоя |
| [`docs/tests/integration-tests.md`](integration-tests.md) | Integration-тесты для Repository-слоя |
| [`docs/tests/api-tests.md`](api-tests.md) | API Contract-тесты |
| [`docs/tests/component-tests.md`](component-tests.md) | Component-тесты для UI |
| [`.github/workflows/`](../../.github/workflows/) | CI/CD конфигурация |

---

**Последнее обновление:** 2026-07-27
**Статус:** Актуализировано (B-011)
**Приоритет реализации:** Последний этап тестовой пирамиды

---

## 12. Карта покрытия E2E-тестами (актуализация 2026-07-27)

> **Общее количество:** 1170 тестов в 32 файлах × 3 браузера (chromium, firefox, webkit)
> **Авторизация:** `loginAsMember()` / `loginAsAdmin()` через `tests/e2e/shared/test-helpers.ts`

### 12.1 AUTH (B-001, B-015)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Вход (US-04, US-05) | `auth/login.e2e.spec.ts` | ✅ |
| Регистрация (US-06, US-07) | `auth/register.e2e.spec.ts` | ✅ |
| Ошибки аутентификации (US-11) | `auth/auth-errors.e2e.spec.ts` | ✅ |
| Callback URL | `auth/callback-url.spec.ts` | ✅ |
| Landing redirect | `auth/landing-redirect.e2e.spec.ts` | ✅ |
| **Смена пароля (US-12, B-015)** | `auth/change-password.e2e.spec.ts` | ✅ **НОВЫЙ** |

### 12.2 ROLES (B-002)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Role Guard (US-03) | `roles/role-guard.e2e.spec.ts` | ✅ |
| CRUD ролей | `roles/roles-crud.e2e.spec.ts` | ✅ |

### 12.3 PLOTS (B-003)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Карточка участка (US-17) | `plots/plot-card-view.e2e.spec.ts` | ✅ |
| Создание (US-14) | `plots/plot-creation.e2e.spec.ts` | ✅ |
| Удаление (US-16) | `plots/plot-deletion.e2e.spec.ts` | ✅ |
| Редактирование (US-15) | `plots/plot-editing.e2e.spec.ts` | ✅ |
| Список участков | `plots/plot-list.e2e.spec.ts` | ✅ |
| Поиск (US-18) | `plots/plot-search.e2e.spec.ts` | ✅ |

### 12.4 PROFILE (B-005)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Профиль (US-19-01..06) | `profile/profile.e2e.spec.ts` | ✅ |

### 12.5 USERS (B-006)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Пользователи (US-20-01..04) | `users/users.e2e.spec.ts` | ✅ |

### 12.6 COMMS (B-007)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Навигация по вкладкам (US-21-36) | `comms/comms-tabs.e2e.spec.ts` | ✅ |
| Список диалогов (US-21-01) | `comms/conversations-list.e2e.spec.ts` | ✅ |
| Новый диалог (US-21-02) | `comms/new-conversation.e2e.spec.ts` | ✅ |
| Групповые чаты (US-21-04..06) | `chats/chats.e2e.spec.ts` | ✅ |
| Объявления (US-21-27..29) | `announcements/announcements.e2e.spec.ts` | ✅ |
| Отправка сообщений (US-21-03) | — | ⛔ **Блокировано** — UI не реализован |
| История сообщений (US-21-03-02) | — | ⛔ **Блокировано** — UI не реализован |
| Модерация (US-21-19..26) | — | ⛔ **Блокировано** — модели БД отсутствуют |
| Категории чатов (US-21-11..14) | — | ⛔ **Блокировано** — модели БД отсутствуют |
| Персональные папки (US-21-15..18) | — | ⛔ **Блокировано** — модели БД отсутствуют |
| Публикация/архивация объявлений (US-21-30..33) | — | ⛔ **Блокировано** — частичная реализация |
| Уведомления (US-21-34..35) | — | ⛔ **Блокировано** — не реализовано |

### 12.7 DOCS (B-008)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Категории документов (US-22-01..02) | `documents/documents-categories.e2e.spec.ts` | ✅ |
| Загрузка документов (US-22-03..04) | `documents/documents-upload.e2e.spec.ts` | ✅ |
| Список документов (US-22-05) | `documents/documents-list.e2e.spec.ts` | ✅ |
| Детали документа (US-22-06) | `documents/documents-detail.e2e.spec.ts` | ✅ |
| Редактирование документа (US-22-07) | `documents/documents-edit.e2e.spec.ts` | ✅ |

### 12.8 NAV (B-009)

| Сценарий | Файл | Статус |
|----------|------|--------|
| Страница 404 (US-NAV-03) | `navigation/404.e2e.spec.ts` | ✅ |
| Хлебные крошки (US-NAV-06) | `navigation/breadcrumbs.e2e.spec.ts` | ✅ |
| Мобильное меню (US-NAV-07) | `navigation/mobile-menu.e2e.spec.ts` | ✅ |
| Редиректы (US-NAV-01) | `navigation/redirects.e2e.spec.ts` | ✅ |
| Боковое меню (US-NAV-05) | `navigation/sidebar.e2e.spec.ts` | ✅ |

### 12.9 Итоговая сводка

| Домен | Всего сценариев | ✅ Покрыто | ⛔ Блокировано | Покрытие |
|-------|----------------|------------|----------------|----------|
| AUTH | 6 | 6 | 0 | 100% |
| ROLES | 2 | 2 | 0 | 100% |
| PLOTS | 6 | 6 | 0 | 100% |
| PROFILE | 1 | 1 | 0 | 100% |
| USERS | 1 | 1 | 0 | 100% |
| COMMS | 15 | 5 | 10 | 33% |
| DOCS | 5 | 5 | 0 | 100% |
| NAV | 5 | 5 | 0 | 100% |
| **ИТОГО** | **41** | **31** | **10** | **76%** |

> **Примечание:** Блокированные сценарии COMMS связаны с отсутствием UI (`src/app/comms/` — пустая директория) и моделей БД (согласно [`docs/tests/comms-test-audit.md`](comms-test-audit.md)). После реализации B-014 remediation — требуется актуализация E2E-покрытия.
