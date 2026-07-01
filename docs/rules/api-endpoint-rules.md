# 🌐 Правила формирования API endpoints в клиентских компонентах

## 1. Основная концепция

`ApiClient` в `src/lib/api-client.ts` инициализируется с дефолтным `baseUrl = '/api/v1'`. Все пути, передаваемые в методы клиента, должны быть **относительными** и подставляться к `baseUrl` автоматически.

```typescript
// src/lib/api-client.ts
class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      // ...
    });
  }
}

export const apiClient = new ApiClient(); // Default baseUrl is '/api/v1'
```

## 2. Формирование полного URL

```
полный URL = baseUrl + path
           = '/api/v1' + '/profile/theme'
           = '/api/v1/profile/theme'
```

## 3. Правила

### ✅ Правильно

Все пути должны быть **относительными** (начинаться с `/`), без префикса `/api/v1`:

```typescript
// ✅ GET запрос
const response = await apiClient.get<UserProfile>('/profile');

// ✅ PATCH запрос
await apiClient.patch('/profile/theme', { theme: 'dark' });

// ✅ POST запрос
await apiClient.post('/members', { firstName: 'Иван', lastName: 'Петров' });

// ✅ PUT запрос
await apiClient.put('/members/123', { firstName: 'Иван' });

// ✅ DELETE запрос
await apiClient.delete('/members/123');

// ✅ Загрузка файлов (FormData)
await apiClient.postFormData('/profile/avatar', formData);

// ✅ Путь с параметром
await apiClient.get('/members/123/profile');
```

### ❌ Неправильно

Никогда не используйте полный путь с `/api/v1` — это приведёт к дублированию:

```typescript
// ❌ ОШИБКА: Дублирование basePath
await apiClient.get('/api/v1/profile');
// Результат: /api/v1/api/v1/profile → 404 Not Found

// ❌ ОШИБКА: Абсолютный URL
await apiClient.get('http://localhost:3000/api/v1/profile');
// Результат: fetch не подставит baseUrl → неверный путь

// ❌ ОШИБКА: Относительный путь без / в начале
await apiClient.get('profile');
// Результат: /api/v1profile → 404 Not Found
```

## 4. Матрица путей

| Ресурс | API Route Handler | Путь для apiClient | Пример полного URL |
|--------|-------------------|-------------------|-------------------|
| Профиль | `src/app/api/v1/profile/route.ts` | `/profile` | `/api/v1/profile` |
| Тема профиля | `src/app/api/v1/profile/theme/route.ts` | `/profile/theme` | `/api/v1/profile/theme` |
| Аватар | `src/app/api/v1/profile/route.ts` (POST/DELETE) | `/profile/avatar` | `/api/v1/profile/avatar` |
| Участники | `src/app/api/v1/members/route.ts` | `/members` | `/api/v1/members` |
| Участник (ByID) | `src/app/api/v1/members/[id]/route.ts` | `/members/:id` | `/api/v1/members/123` |
| Участки | `src/app/api/v1/plots/route.ts` | `/plots` | `/api/v1/plots` |
| Регистрация | `src/app/api/v1/auth/register/route.ts` | `/auth/register` | `/api/v1/auth/register` |

## 5. Использование с кастомным baseUrl

Если нужен другой baseUrl (например, для тестирования или микросервисов), используйте `createApiClient()`:

```typescript
// Создание клиента с кастомным baseUrl
const customClient = new ApiClient('/api/v2');

// Использование
await customClient.get('/profile');
// Результат: /api/v2/profile
```

## 6. Примеры использования в компонентах

### Example 1: ThemeToggle

```typescript
// src/components/features/userProfile/ThemeToggle/ThemeToggle.tsx
const handleToggle = async () => {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await apiClient.patch('/profile/theme', { theme: newTheme });
  onThemeChange(newTheme);
};
```

### Example 2: AppLayout

```typescript
// src/components/layouts/AppLayout.tsx
const handleThemeChange = async (theme: Theme) => {
  try {
    await apiClient.patch('/profile/theme', { theme });
  } catch {
    console.error('Failed to update theme');
  }
  setTheme(theme);
};
```

### Example 3: Profile Page

```typescript
// src/app/(dashboard)/profile/page.tsx
const handleThemeSave = useCallback(async (theme: Theme) => {
  setIsSavingTheme(true);
  try {
    const response = await apiClient.patch('/profile/theme', { theme });
    if (response.success && response.data?.theme) {
      // Обновляем локальное состояние
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Ошибка');
  } finally {
    setIsSavingTheme(false);
  }
}, []);
```

## 7. Чек-лист при добавлении нового API endpoint

- [ ] API Route Handler создан в `src/app/api/v1/<resource>/route.ts`
- [ ] Путь в клиенте начинается с `/` (без `/api/v1` префикса)
- [ ] Путь соответствует структуре маршрута Next.js
- [ ] Проверено формирование полного URL (baseUrl + path)
- [ ] Добавлен в матрицу путей (этот документ)

## 8. Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| 404 Not Found | Дублирование `/api/v1/api/v1/...` | Удалить `/api/v1` префикс из пути |
| 404 Not Found | Путь без ведущего `/` | Добавить `/` в начало пути |
| CORS Error | Абсолютный URL | Использовать относительный путь |
| 500 Internal Error | Неправильная структура маршрута | Проверить файл route.ts в API |

## 9. Быстрая проверка

Перед добавлением нового API вызова проверьте:

```typescript
// 1. Какой baseUrl у apiClient?
// Ответ: '/api/v1' (из src/lib/api-client.ts)

// 2. Какой путь вы хотите использовать?
// Пример: '/profile/theme'

// 3. Какой будет полный URL?
// '/api/v1' + '/profile/theme' = '/api/v1/profile/theme'

// 4. Существует ли такой маршрут?
// Проверьте: src/app/api/v1/profile/theme/route.ts ✅
```

---

**Последнее обновление:** 2026-06-30  
**Автор:** System Architect  
**Связанные файлы:** [`src/lib/api-client.ts`](../../src/lib/api-client.ts)
