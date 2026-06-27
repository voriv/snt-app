# Logging & Monitoring — Логирование и мониторинг

## Статус: На обсуждении

---

## 0. Общие положения

### 0.1 Назначение

Спецификация определяет правила логирования и мониторинга в приложении СНТ.

### 0.2 Выбор инструментов

| Инструмент | Назначение | RAM | Обоснование |
|------------|-----------|-----|-------------|
| **Pino** | Структурированное логирование JSON | ~2-5 MB | Быстрый, минимальный overhead, стандарт для Node.js |
| **PM2** | Мониторинг процессов | ~20-30 MB | Управление процессами, uptime, restart |
| **Файлы логов** | Долгосрочное хранение | Зависит от ротации | Простота, logrotate |

### 0.3 Ограничения

Учитывая лимит VPS (1 GB RAM):
- Pino: ~2-5 MB RAM
- PM2: ~20-30 MB RAM (включая приложение)
- **Общий мониторинг: <50 MB RAM**

---

## 1. Pino — Структурированное логирование

### 1.1 Установка и конфигурация

**Зависимость:**

```bash
pnpm add pino pino-http pino-pretty
pnpm add -D @types/pino
```

**Конфигурация (`src/lib/logger.ts`):**

```typescript
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

const logger = pino({
  // Уровень логирования
  level: process.env.LOG_LEVEL || 'info',
  
  // Формат: JSON в production, pretty в development
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  
  // Стандартные поля для всех логов
  base: {
    app: 'snt-app',
    env: process.env.NODE_ENV || 'development',
  },
  
  // Отключение чувствительных полей
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.email',
    ],
    censor: '[REDACTED]',
  },
})

export default logger
```

### 1.2 Уровень логирования

| Уровень | Когда писать | Примеры |
|---------|-------------|---------|
| `fatal` | Приложение не может работать | БД недоступна, критическая ошибка инициализации |
| `error` | Ошибки, которые видит пользователь | 500 Internal Server Error, валидация не прошла (бизнес-правило) |
| `warn` | Предупреждения, но система работает | Медленные запросы (>500ms), устаревшие API |
| `info` | Ключевые бизнес-события | User login, Payment created, Vote started |
| `debug` | Для отладки (только dev) | SQL query details, request/response body |

**В production:** уровень `info` и выше.
**В development:** уровень `debug` и выше.

### 1.3 Структура лог-записи

```json
{
  "level": 30,
  "time": "2026-06-24T10:00:00.000Z",
  "pid": 1234,
  "hostname": "snt-vps",
  "app": "snt-app",
  "env": "production",
  "msg": "User login successful",
  "userId": "clxxx123abc",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "reqId": "req-123"
}
```

### 1.4 Логирование в API Router

**Middleware для HTTP запросов:**

```typescript
import logger from '@/lib/logger'

export async function GET(request: Request) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  logger.info({
    reqId: requestId,
    method: 'GET',
    url: request.url,
    ip: request.headers.get('x-forwarded-for'),
  }, 'HTTP request')
  
  try {
    const response = await handler(request)
    const duration = Date.now() - startTime
    
    logger.info({
      reqId: requestId,
      status: response.status,
      duration,
    }, 'HTTP response')
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error({
      reqId: requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      stack: error instanceof Error ? error.stack : undefined,
    }, 'HTTP error')
    
    throw error
  }
}
```

### 1.5 Логирование в Service

```typescript
import logger from '@/lib/logger'

class PlotService {
  async create(data: CreatePlotDto) {
    logger.info({
      action: 'plot.create.start',
      plotNumber: data.number,
    }, 'Creating new plot')
    
    try {
      const plot = await this.plotRepository.create(data)
      
      logger.info({
        action: 'plot.create.success',
        plotId: plot.id,
        plotNumber: plot.number,
      }, 'Plot created successfully')
      
      return plot
    } catch (error) {
      logger.error({
        action: 'plot.create.error',
        error: error instanceof Error ? error.message : 'Unknown error',
        plotNumber: data.number,
      }, 'Failed to create plot')
      
      throw error
    }
  }
}
```

### 1.6 Логирование в Repository

```typescript
import logger from '@/lib/logger'

class PlotRepository {
  async findById(id: string) {
    const startTime = Date.now()
    
    try {
      const plot = await prisma.plot.findUnique({ where: { id } })
      
      const duration = Date.now() - startTime
      if (duration > 100) {
        logger.warn({
          action: 'repository.slow_query',
          table: 'plots',
          query: 'findById',
          duration,
          id,
        }, `Slow query detected: ${duration}ms`)
      }
      
      return plot
    } catch (error) {
      logger.error({
        action: 'repository.error',
        table: 'plots',
        query: 'findById',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Database error')
      
      throw error
    }
  }
}
```

### 1.7 Логирование в WebSocket

```typescript
import logger from '@/lib/logger'

class ConnectionManager {
  handleConnection(socket: Socket) {
    logger.info({
      action: 'ws.connection',
      userId: socket.handshake.auth.userId,
      ip: socket.handshake.address,
    }, 'WebSocket connection established')
    
    socket.on('disconnect', () => {
      logger.info({
        action: 'ws.disconnection',
        userId: socket.handshake.auth.userId,
        reason: 'client or server',
      }, 'WebSocket connection closed')
    })
  }
}
```

### 1.8 Логирование аутентификации

```typescript
import logger from '@/lib/logger'

// Login
logger.info({
  action: 'auth.login.success',
  userId: user.id,
  email: user.email,
  ip: request.ip,
}, 'User login successful')

// Failed login
logger.warn({
  action: 'auth.login.failed',
  email: email,
  ip: request.ip,
  reason: 'invalid_password',
}, 'Failed login attempt')

// Logout
logger.info({
  action: 'auth.logout',
  userId: user.id,
}, 'User logout')
```

---

## 2. PM2 — Мониторинг процессов

### 2.1 Конфигурация (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'snt-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/snt-app',
      instances: 1,
      max_memory_restart: '200M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
        PM2_LOG_LEVEL: 'warn',
      },
      // Логирование PM2
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/snt-app/error.log',
      out_file: '/var/log/snt-app/out.log',
      merge_logs: true,
    },
    {
      name: 'snt-ws',
      script: 'ws-server/dist/index.js',
      cwd: '/var/www/snt-app',
      instances: 1,
      max_memory_restart: '100M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/snt-app/ws-error.log',
      out_file: '/var/log/snt-app/ws-out.log',
      merge_logs: true,
    },
  ],
}
```

### 2.2 PM2 команды

```bash
# Мониторинг
pm2 monit

# Просмотр логов
pm2 logs snt-app
pm2 logs snt-ws

# Статус процессов
pm2 status

# Перезапуск
pm2 restart snt-app
pm2 reload snt-app  # zero-downtime

# Очистка старых логов
pm2 flush

# Startup script (автозапуск при reboot)
pm2 startup
pm2 save
```

---

## 3. Файлы логов и ротация

### 3.1 Структура логов

```
/var/log/snt-app/
├── snt-app/
│   ├── out.log          # stdout (PM2)
│   ├── error.log        # stderr (PM2)
│   └── app.log          # Pino (через file destination)
└── snt-ws/
    ├── out.log
    ├── error.log
    └── app.log
```

### 3.2 Logrotate конфигурация

**`/etc/logrotate.d/snt-app`:**

```
/var/log/snt-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    dateext
    dateformat -%Y%m%d
}
```

### 3.3 Размер логов и хранение

| Лог | Макс. размер (в день) | Хранение | Удаление |
|-----|----------------------|----------|----------|
| out.log / error.log | ~10 MB | 7 дней | logrotate |
| app.log (Pino) | ~50 MB | 7 дней | logrotate |

---

## 4. Мониторинг и алертинг

### 4.1 Минимальный мониторинг (учитывая 1 GB RAM)

| Метрика | Источник | Лимит | Алерт |
|---------|----------|-------|-------|
| Process uptime | PM2 | - | Restart >3 раз в час |
| RAM usage | PM2 | 200 MB (Next.js) | >180 MB |
| Disk usage | Система | 10 GB | >8 GB |
| Database size | PostgreSQL | 8 GB | >6 GB |
| Response time | Pino (duration) | 500 ms | >1000 ms |

### 4.2 Health Check эндпоинт

**GET `/api/health`**

```typescript
import logger from '@/lib/logger'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Проверка БД
    await prisma.$queryRaw`SELECT 1`
    
    const duration = Date.now() - startTime
    
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      duration,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    })
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown',
      duration: Date.now() - startTime,
    }, 'Health check failed')
    
    return Response.json(
      { status: 'error', error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
```

### 4.3 Мониторинг через cron

**Проверка здоровья каждые 5 минут:**

```bash
# /etc/crontab
*/5 * * * * curl -s http://localhost:3000/api/health >> /var/log/snt-app/health-check.log 2>&1
```

---

## 5. Чек-лист качества

> ℹ️ **Полный чек-лист** логирования и мониторинга — в [`shared/checklists.md#6-логирование-и-мониторинг`](../../shared/checklists.md#6-логирование-и-мониторинг)

---

## 6. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
