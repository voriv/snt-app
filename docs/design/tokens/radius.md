# Токены border-radius

> **Назначение:** Стандартные значения border-radius для элементов UI.
> **Статус:** `[ACTIVE]`

---

## 1. Значения

| Токен | Значение | Tailwind | Использование |
|-------|----------|----------|---------------|
| `radius-none` | 0 | `rounded-none` | Резкие углы (tables, code blocks) |
| `radius-sm` | 4px | `rounded` | Кнопки, инпуты, badge |
| `radius-md` | 8px | `rounded-lg` | Карточки, модалки, дропдауны |
| `radius-lg` | 12px | `rounded-xl` | Большие карточки, паннели |
| `radius-xl` | 16px | `rounded-2xl` | Hero-секции, большие панели |
| `radius-2xl` | 24px | `rounded-3xl` | — |
| `radius-full` | 9999px | `rounded-full` | Аватары, badge, pill-кнопки |

---

## 2. Применение в компонентах

| Компонент | Radius | Токен |
|-----------|--------|-------|
| Button | 4px | `radius-sm` |
| Input | 4px | `radius-sm` |
| Select | 4px | `radius-sm` |
| Badge | 9999px | `radius-full` |
| Card | 8px | `radius-md` |
| Dialog/Modal | 8px | `radius-md` |
| Avatar | 9999px | `radius-full` |
| Sidebar panel | 12px | `radius-lg` |

---

## 3. Использование

### В макетах

```markdown
| Элемент | Radius |
|---------|--------|
| Кнопка | `radius-sm` |
| Карточка | `radius-md` |
| Аватар | `radius-full` |
| Бейдж | `radius-full` |
```

### В Tailwind

```tsx
// Кнопка
<button className="rounded">OK</button>

// Карточка
<div className="rounded-lg">Карточка</div>

// Аватар
<img className="rounded-full" src="..." />

// Badge
<span className="rounded-full px-2 py-1">Новый</span>
```

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`colors.md`](colors.md)
- 📋 **Тени:** [`shadows.md`](shadows.md)
