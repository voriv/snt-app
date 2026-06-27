# Логирование и мониторинг

> 📌 Контекстный сегмент. Полная версия: [`logging-monitoring.md`](../specs/logging-monitoring.md)

---

## Инструменты

| Инструмент | Назначение | RAM | Обоснование |
|------------|-----------|-----|-------------|
| **Pino** | Структурированное JSON-логирование | ~2-5 MB | Быстрый, минимальный overhead |
| **PM2** | Мониторинг процессов, restart | ~20-30 MB | Управление процессами |
| **logrotate** | Ротация лог-файлов | — | Стандарт Linux |

**Общий мониторинг: <50 MB RAM**

---

## Pino — конфигурация

**Файл:** `src/lib/logger.ts`

| Параметр | Значение |
|----------|----------|
| Уровень (production) | `info` и выше |
| Уровень (development) | `debug` и выше |
| Формат (production) | JSON |
| Формат (development) | Pretty (pino-pretty) |
| Redact | `req.headers.authorization`, `req.body.password`, `req.body.email` |

---

## Уровни логирования

| Уровень | Когда | Пример |
|---------|-------|--------|
| `fatal` | Приложение не может работать | БД недоступна |
| `error` | Ошибки, видимые пользователем | 500, валидация бизнес-правила |
| `warn` | Предупреждения, система работает | Медленные запросы (>500ms) |
| `info` | Ключевые бизнес-события | User login, Payment created |
| `debug` | Отладка (только dev) | SQL details, request body |

---

## Паттерны логирования

```typescript
// API Router — HTTP запрос/ответ
logger.info({ reqId, method, url, ip }, 'HTTP request')

// Service — бизнес-операции
logger.info({ action: 'plot.create.success', plotId, plotNumber }, 'Plot created')

// Repository — медленные запросы
if (duration > 100) logger.warn({ action: 'repository.slow_query', table, duration }, 'Slow query')

// Аутентификация
logger.info({ action: 'auth.login.success', userId, ip }, 'User login successful')
logger.warn({ action: 'auth.login.failed', email, ip, reason }, 'Failed login attempt')
```

---

## PM2 — конфигурация

**Файл:** `ecosystem.config.js`

| Приложение | Скрипт | Max RAM | Логи |
|------------|--------|---------|------|
| `snt-app` | Next.js start | 200 MB | `/var/log/snt-app/snt-app/` |
| `snt-ws` | ws-server/dist/index.js | 100 MB | `/var/log/snt-app/snt-ws/` |

**Ключевые команды:**
```bash
pm2 monit          # Мониторинг
pm2 logs snt-app   # Логи
pm2 restart snt-app # Перезапуск
pm2 flush          # Очистка логов
```

---

## Ротация логов

**Файл:** `/etc/logrotate.d/snt-app`

| Параметр | Значение |
|----------|----------|
| Период | daily |
| Хранение | 7 дней |
| Сжатие | да (compress, delaycompress) |
| Макс. размер в день | ~50 MB (app.log) |

---

## Мониторинг и алерты

| Метрика | Источник | Лимит | Алерт |
|---------|----------|-------|-------|
| Process uptime | PM2 | — | Restart >3 раз/час |
| RAM usage | PM2 | 200 MB | >180 MB |
| Disk usage | Система | 10 GB | >8 GB |
| Response time | Pino (duration) | 500 ms | >1000 ms |

**Health Check:** `GET /api/health` — проверка БД + uptime + memory

**Cron:** каждые 5 минут — `curl http://localhost:3000/api/health`

---

📄 Полная спецификация: [`logging-monitoring.md`](../specs/logging-monitoring.md)