# Токены отступов

> **Назначение:** Стандартные отступы (margin, padding, gap).
> **Статус:** `[ACTIVE]`

---

## 1. Значения

| Токен | Значение | Tailwind | Использование |
|-------|----------|----------|---------------|
| `space-0` | 0 | `m-0` | Убирает отступы |
| `space-1` | 0.25rem (4px) | `m-1 p-1` | Микро-отступы (иконки, чекбоксы) |
| `space-2` | 0.5rem (8px) | `m-2 p-2` | Отступы внутри кнопок, badge |
| `space-3` | 0.75rem (12px) | `m-3 p-3` | Отступы между элементами в группе |
| `space-4` | 1rem (16px) | `m-4 p-4` | Стандартный отступ |
| `space-5` | 1.25rem (20px) | `m-5 p-5` | — |
| `space-6` | 1.5rem (24px) | `m-6 p-6` | Отступы в карточках |
| `space-8` | 2rem (32px) | `m-8 p-8` | Отступы между секциями |
| `space-10` | 2.5rem (40px) | `m-10 p-10` | — |
| `space-12` | 3rem (48px) | `m-12 p-12` | Большие отступы |
| `space-16` | 4rem (64px) | `m-16 p-16` | Отступы между большими секциями |
| `space-20` | 5rem (80px) | `m-20 p-20` | Hero-секции |
| `space-24` | 6rem (96px) | `m-24 p-24` | — |

---

## 2. Применение в компонентах

| Компонент | Padding | Gap |
|-----------|---------|-----|
| Button (sm) | `space-2` vertical, `space-3` horizontal | — |
| Button (md) | `space-2` vertical, `space-4` horizontal | — |
| Button (lg) | `space-3` vertical, `space-6` horizontal | — |
| Card | `space-6` | — |
| CardHeader | `space-4` vertical, `space-6` horizontal | — |
| CardBody | `space-6` | — |
| Input group | — | `space-3` между label и input |
| Form | — | `space-4` между полями |
| Список карточек | — | `space-4` между карточками |

---

## 3. Использование

### В макетах

```markdown
| Элемент | Padding | Margin |
|---------|---------|--------|
| Карточка | `space-6` | — |
| Кнопка md | `space-2 × space-4` | — |
| Секция | `space-8` | — |
```

### В Tailwind

```tsx
// Отступы в карточке
<div className="p-6">
  <h2 className="text-xl font-semibold mb-4">Заголовок</h2>
  <p className="text-sm mb-4">Текст</p>
  <button className="py-2 px-4">Кнопка</button>
</div>

// Отступы между секциями
<div className="space-y-8">
  <section>...</section>
  <section>...</section>
</div>
```

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`colors.md`](colors.md)
- 📋 **Типографика:** [`typography.md`](typography.md)
