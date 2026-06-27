# Docker Component: {{component-name}}

## Статус: {{статус}}

## 1. Описание

### 1.1 Назначение

{{Краткое описание назначения Docker компонента. Какой сервис/container описывает.}}

### 1.2 Границы ответственности

{{Описание границ ответственности Docker компонента. Что входит и что НЕ входит в ответственность.}}

| Входит | НЕ входит |
|--------|-----------|
| {{Operation 1}} | {{External concern 1}} |
| {{Operation 2}} | {{External concern 2}} |

### 1.3 Связанные компоненты

| Компонент | Тип | Ссылка |
|-----------|-----|--------|
| {{component-name}} | {{component-type}} | [Ссылка](../path/to/component.md) |

---

## 2. Контейнер

### 2.1 Настройки контейнера

| Параметр | Значение | Описание |
|----------|----------|----------|
| Image | {{image}}:{{tag}} | Базовый образ |
| Container Name | {{container-name}} | Имя контейнера |
| Restart Policy | {{policy}} | Политика перезапуска |
| Environment | {{env-file}} | Файл переменных окружения |

### 2.2 Dockerfile

```dockerfile
# ================================
# Базовый образ
# ================================
FROM {{base-image}} AS base

# ================================
# Этап зависимостей
# ================================
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN {{install-command}}

# ================================
# Этап сборки
# ================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN {{build-command}}

# ================================
# Production образ
# ================================
FROM base AS runner
WORKDIR /app

# Создание пользователя
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE {{port}}

CMD ["{{command}}"]
```

### 2.3 .dockerignore

```
node_modules
.next
.git
.env
.env.local
*.md
Dockerfile
docker-compose*.yml
```

---

## 3. Docker Compose

### 3.1 Конфигурация сервисов

```yaml
version: '3.8'

services:
  {{service-name}}:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: {{container-name}}
    restart: {{restart-policy}}
    ports:
      - "{{host-port}}:{{container-port}}"
    environment:
      - {{env-var}}={{value}}
    depends_on:
      - {{dependency}}
    volumes:
      - {{volume-name}}:/app/data
    networks:
      - {{network-name}}

  {{dependency}}:
    image: {{image}}:{{tag}}
    container_name: {{dependency-container}}
    restart: {{restart-policy}}
    environment:
      - {{env-var}}={{value}}
    volumes:
      - {{volume-name}}:/var/lib/{{service}}/data
    networks:
      - {{network-name}}

volumes:
  {{volume-name}}:

networks:
  {{network-name}}:
    driver: bridge
```

### 3.2 Переменные окружения

| Переменная | Значение | Описание |
|------------|----------|----------|
| {{ENV_VAR}} | {{value}} | {{description}} |
| {{ENV_VAR}} | {{value}} | {{description}} |

---

## 4.healthcheck

### 4.1 Healthcheck настройка

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:{{port}}/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4.2 Endpoint проверки

| Endpoint | Метод | Код успеха | Описание |
|----------|-------|------------|----------|
| /health | GET | 200 | Общая проверка работоспособности |
| /health/db | GET | 200 | Проверка подключения к БД |
| /health/cache | GET | 200 | Проверка подключения к Redis |

---

## 5. Сетевая конфигурация

### 5.1 Сети

| Сеть | Драйвер | Описание |
|------|---------|----------|
| {{network-name}} | bridge | Внутренняя сеть сервисов |
| {{network-name}} | bridge | Внешняя сеть (если требуется) |

### 5.2 Правила Firewall

{{Описание правил firewall при необходимости.}}

---

## 6. Логирование

### 6.1 Конфигурация логирования

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 6.2 Сбор логов

| Параметр | Значение |
|----------|----------|
| Драйвер | json-file / fluentd / gelf |
| Максимальный размер | 10MB |
| Максимальное количество файлов | 3 |

---

## 7. Хранение данных

### 7.1 Volumes

| Volume | Mount Point | Описание |
|--------|-------------|----------|
| {{volume-name}} | /app/data | Данные приложения |
| {{volume-name}} | /var/lib/{{service}}/data | Данные сервиса |

### 7.2 Backup

{{Описание стратегии резервного копирования.}}

---

## 8. Оркестрация

### 8.1 Сценарии запуска

```bash
# Запуск всех сервисов
docker compose up -d

# Пересборка и запуск
docker compose up -d --build

# Остановка всех сервисов
docker compose down

# Остановка и удаление volumes
docker compose down -v

# Логи
docker compose logs -f {{service-name}}

# Масштабирование
docker compose up -d --scale {{service-name}}=3
```

### 8.2 Healthcheck

{{Описание проверки здоровья сервисов.}}

---

## 9. CI/CD интеграция

### 9.1 Конфигурация

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          push: ${{ github.event_name != 'pull_request' }}
          tags: ghcr.io/${{ github.repository }}:latest
```

### 9.2 Этапы

| Этап | Описание |
|------|----------|
| Build | Сборка Docker образа |
| Test | Запуск тестов в контейнере |
| Push | Push образа в registry |
| Deploy | Развёртывание на сервере |

---

## 10. Зависимости

### 10.1 Внутренние зависимости

| Зависимость | Версия | Описание |
|-------------|--------|----------|
| {{dependency}} | {{version}} | {{description}} |

### 10.2 Внешние зависимости

| Пакет | Версия | Назначение | Согласовано |
|-------|--------|------------|-------------|
| {{package}} | {{version}} | {{purpose}} | {{yes/no}} |

---

## 11. Чек-лист качества

- [ ] Dockerfile оптимизирован (многоэтапная сборка)
- [ ] Используется non-root пользователь
- [ ] .dockerignore исключает ненужные файлы
- [ ] Healthcheck настроен
- [ ] Логирование конфигурировано
- [ ] Volumes для сохранения данных
- [ ] Переменные окружения вынесены в .env
- [ ] Docker Compose тестирован локально
- [ ] CI/CD pipeline настроен
- [ ] Образы минимизированы (alpine если возможно)

---

## 12. История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | {{YYYY-MM-DD}} | Начальная версия | {{автор}} |
