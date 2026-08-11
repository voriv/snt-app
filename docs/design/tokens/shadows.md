# Токены теней

> **Назначение:** Стандартные box-shadow для элементов UI.
> **Статус:** `[ACTIVE]`

---

## 1. Значения

| Токен | CSS | Tailwind | Использование |
|-------|-----|----------|---------------|
| `shadow-none` | none | `shadow-none` | Без тени (flat-дизайн) |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Карточки, лёгкий приподъём |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | `shadow-md` | Модалки, дропдауны |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | `shadow-lg` | Большие панели, оверлеи |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | `shadow-xl` | Hero-секции |

---

## 2. Применение в компонентах

| Компонент | Тень | Токен |
|-----------|------|-------|
| Card | `shadow` | `shadow-sm` |
| ConfirmDialog | `shadow-md` | `shadow-md` |
| Dropdown/Select | `shadow-md` | `shadow-md` |
| Navbar | `0 1px 3px rgba(0,0,0,0.1)` | — |
| Sidebar | `none` | `shadow-none` |

---

## 3. Использование

### В макетах

```markdown
| Элемент | Тень |
|---------|------|
| Карточка | `shadow-sm` |
| Модалка | `shadow-md` |
| Дропдаун | `shadow-md` |
```

### В Tailwind

```tsx
// Карточка
<div className="shadow-sm rounded-lg">Карточка</div>

// Модалка
<div className="shadow-md rounded-lg">Модалка</div>

// Дропдаун
<div className="shadow-md rounded-lg border">Select</div>
```

---

## 🔗 Связанные артефакты

- 📋 **Цвета:** [`colors.md`](colors.md)
- 📋 **Border-radius:** [`radius.md`](radius.md)
