# 🌐 Правила формирования API endpoints в клиентских компонентах

## 1. Основная концепция

[`ApiClient`](../../src/lib/api-client.ts) инициализируется с дефолтным `baseUrl = '/api/v1'`. Все пути, передаваемые в методы клиента, должны быть **относительными** и подставляться к `baseUrl` автоматически.

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

---

## 2. Формирование полного URL

```
полный URL = baseUrl + path
           = '/api/v1' + '/profile/theme'
           = '/api/v1/profile/theme'
```

---

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

---

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

---

## 5. Примеры использования в компонентах

### ThemeToggle

```typescript
// src/components/features/userProfile/ThemeToggle/ThemeToggle.tsx
const handleToggle = async () => {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await apiClient.patch('/profile/theme', { theme: newTheme });
  onThemeChange(newTheme);
};
```

### AppLayout

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

### Profile Page

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

---

## 6. Чек-лист при добавлении нового API endpoint

- [ ] API Route Handler создан в `src/app/api/v1/<resource>/route.ts`
- [ ] Путь в клиенте начинается с `/` (без `/api/v1` префикса)
- [ ] Путь соответствует структуре маршрута Next.js
- [ ] Проверено формирование полного URL (baseUrl + path)
- [ ] Путь добавлен в матрицу путей (раздел 4 этого документа)

---

## 7. Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| 404 Not Found | Дублирование `/api/v1/api/v1/...` | Удалить `/api/v1` префикс из пути |
| 404 Not Found | Путь без ведущего `/` | Добавить `/` в начало пути |
| CORS Error | Абсолютный URL | Использовать относительный путь |
| 500 Internal Error | Неправильная структура маршрута | Проверить файл route.ts в API |

---

## 8. Быстрая проверка

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

## 9. Использование с кастомным baseUrl

Если нужен другой baseUrl (например, для тестирования или микросервисов), создайте новый экземпляр [`ApiClient`](../../src/lib/api-client.ts):

```typescript
// Создание клиента с кастомным baseUrl
const customClient = new ApiClient('/api/v2');

// Использование
await customClient.get('/profile');
// Результат: /api/v2/profile
```

---

## 10. Строгие запреты

- ❌ **Запрещено** использовать `/api/v1` префикс в путях, передаваемых в `apiClient`
- ❌ **Запрещено** использовать абсолютные URL (`http://...`) в путях `apiClient`
- ❌ **Запрещено** использовать `fetch()` напрямую в компонентах — только через `apiClient`
- ❌ **Запрещено** передавать пути без ведущего `/`

---

## 11. Связь с другими правилами

### С SPECS.md

- JSDoc-аннотация `@route` в API Route Handlers содержит **полный путь** (например, `@route GET /api/v1/members`) — это документация маршрута
- Путь в клиентском коде (`apiClient.get('/members')`) — **относительный**, без `/api/v1`
- Разделение: `@route` описывает HTTP-контракт, а `apiClient` путь — реализацию вызова

### С PROJECT.md

- `apiClient` — единственный способ общения клиента с сервером (раздел 2 «Архитектурный паттерн»)
- Запрещено использовать `fetch()` напрямую в компонентах (раздел 3 «Работа с данными»)

### С CODE_REVIEW.md

- Проверка: «Используется `apiClient` вместо `fetch()` в компонентах» — включает проверку корректности путей

---

**Последнее обновление:** 2026-06-30  
**Связанные файлы:** [`src/lib/api-client.ts`](../../src/lib/api-client.ts), [`SPECS.md`](SPECS.md), [`PROJECT.md`](PROJECT.md)
