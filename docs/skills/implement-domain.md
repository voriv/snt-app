# Skill: Реализация кода (Implement Domain)

> **Исполнитель:** `code` mode
> **Вход:** `docs/plans/{US-id}-realization-plan.md`
> **Выход:** Код в `src/`

---

## Алгоритм

1. **Прочитать план** — открой realization plan
2. **Выполнять задачи последовательно** — строго в порядке из плана:
   - Types → Validators → Errors → Repository Interface → Repository Prisma → Service → API Routes → UI Components → Hooks
3. **Для каждой задачи:**
   - Прочитай существующий файл (если есть)
   - Внеси изменения
   - Проверь TypeScript: `tsc --noEmit`
4. **После всех задач:**
   - Запусти `npm run type-check`
   - Запусти `npm run lint`
5. **Запросить code review**

## Правила

- Следуй DDD-архитектуре — каждый домен изолирован
- Правило 50 строк для компонентов
- Всегда экспортируй через index.ts
- Zod схемы — единственный источник валидации
