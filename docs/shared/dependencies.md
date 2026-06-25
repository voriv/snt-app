# Библиотеки и зависимости

> 📌 Единый справочник разрешённых и запрещённых зависимостей по слоям.
> Спецификации ссылаются на этот файл вместо дублирования.

---

## Общие правила

1. **Никаких новых пакетов без согласования.** Перед установкой — обсудить в спецификации.
2. **Приоритет zero-dependency библиотекам.** Предпочитать библиотеки с минимальным числом зависимостей.

---

## По слоям

### UI / Компоненты

> Источник: [`component-requirements.md`](../specs/components/component-requirements.md), [`ui-component-requirements.md`](../specs/components/ui/ui-component-requirements.md)

**Разрешённые:** `clsx`, `tailwind-merge`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@radix-ui/*`, `lucide-react`, `@tanstack/react-query`, `zustand`, `date-fns`

**Запрещённые:** `styled-components`, `emotion` (CSS-in-JS), CSS modules, SASS/SCSS, `redux`, `yup`, `ajv`

---

### API Router

> Источник: [`api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md)

**Разрешённые:** `zod`, `next`, `next-auth`

**Запрещённые:** `express`, `hapi`, `fastify` (Next.js имеет встроенный роутер)

---

### Service

> Источник: [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md)

**Разрешённые:** `zod`, `@prisma/client` (только через Repository), `@prisma/client/testing` (dev)

**Запрещённые:** `express`, `fastify`, `hapi` (Service не знает о HTTP); `react`, `next` (Service не знает о UI); `class-validator`, `joi` (проект использует `zod`)

---

### Repository

> Источник: [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md)

**Разрешённые:** Prisma Client (только в `src/repositories`), `zod` (валидация параметров)

**Принцип:** ORM-клиент разрешён только в Repository-слое. Service обращается к данным только через интерфейс Repository.