# ============================================
# Этап 1: Сборка приложения
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Установка зависимостей для нативных модулей
RUN apk add --no-cache python3 make g++

# NEXT_PUBLIC_* переменные встраиваются в bundle на этапе next build (B-034-T7)
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_DESCRIPTION
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_DESCRIPTION=$NEXT_PUBLIC_APP_DESCRIPTION

# Копирование файлов зависимостей
COPY package.json package-lock.json ./

# Установка всех зависимостей (включая devDependencies для сборки)
RUN npm ci

# Копирование Prisma schema и генерация Prisma Client
COPY prisma/ ./prisma/
RUN npm run db:generate

# Копирование остального кода
COPY . .

# Сборка приложения (standalone: создаёт .next/standalone)
RUN npm run build

# ============================================
# Этап 2: Продакшен образ
# ============================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копирование файлов зависимостей
COPY package.json package-lock.json ./

# Установка только продакшен зависимостей (при этом prisma установлена — T3.1)
RUN npm ci --only=production && npm cache clean --force

# Копирование standalone-сборки и статики из builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Копирование Prisma schema (для prisma migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Копирование сгенерированного Prisma Client (.prisma + @prisma/client)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Миграции выполняются перед стартом приложения (B-034-T3, T7)
# Переключение на пользователя без прав root
USER nextjs

# Экспорт порта
EXPOSE 3000

# Healthcheck приложения через health-маршрут (B-034-T1)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Запуск миграций и приложения
CMD npx prisma migrate deploy && node server.js
