# Lite-спецификация: API Router

> 📄 Полная версия: [`../specs/components/api-routers/api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md)

---

## Структура файла

```
src/app/api/<domain>/<resource>/route.ts
```

---

## Паттерн API Router

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiResponse } from '@/app/api/_lib/response';
import { createPlotService } from '@/services';

// 1. Zod схема валидации
const CreatePlotSchema = z.object({
  number: z.string().min(1),
  area: z.number().positive(),
});

// 2. Router-функция
export async function POST(request: NextRequest) {
  try {
    // 3. Парсинг и валидация
    const body = await request.json();
    const parsed = CreatePlotSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse.error(400, 'Валидация не пройдена', parsed.error);
    }

    // 4. Вызов сервиса
    const service = createPlotService();
    const result = await service.create(parsed.data);

    // 5. Успешный ответ
    return apiResponse.success(201, result);
  } catch (error) {
    return apiResponse.error(500, 'Внутренняя ошибка');
  }
}

export async function GET(request: NextRequest) {
  // Аналогично...
}
```

---

## Обязательные элементы

| Элемент | Описание |
|---------|----------|
| **Валидация** | Zod-схема для всех входящих данных |
| **Обработка ошибок** | try/catch + apiResponse.error() |
| **Аутентификация** | requireAuth() для защищённых эндпоинтов |
| **JSDoc** | Описание каждого метода API |

---

## HTTP Status Codes

| Код | Когда использовать |
|-----|---------------------|
| 200 | Успешный GET/PUT |
| 201 | Успешное создание (POST) |
| 204 | Успешное удаление (DELETE) |
| 400 | Ошибка валидации |
| 401 | Неавторизован |
| 403 | Доступ запрещён |
| 404 | Ресурс не найден |
| 409 | Конфликт (дубликат) |
| 500 | Внутренняя ошибка сервера |

---

## Зависимости

| Компонент | Путь |
|-----------|------|
| Service | `src/services/` |
| Repository | `src/repositories/` |
| Response utility | `src/app/api/_lib/response.ts` |
| Auth utility | `src/app/api/_lib/auth.ts` |

---

## Тестирование

| Правило | Описание |
|---------|----------|
| Mock сервисы | `vi.fn()` для моков сервисов |
| Покрытие | ≥80% |
| AAA паттерн | Arrange → Act → Assert |

---

📄 Полная спецификация: [`../specs/components/api-routers/api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md)
