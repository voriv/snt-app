# Цветовые токены

> **Назначение:** Все цвета приложения через токены и CSS-переменные.
> **Статус:** `[ACTIVE]`

---

## 1. Базовые цвета

| Токен | CSS-переменная | Light | Dark | Green |
|-------|---------------|-------|------|-------|
| `color.bg.primary` | `var(--theme-bg-primary)` | `#ffffff` | `#111827` | `#064e3b` |
| `color.bg.secondary` | `var(--theme-bg-secondary)` | `#f9fafb` | `#1f2937` | `#065f46` |
| `color.bg.overlay` | `var(--theme-bg-overlay)` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.6)` | <!-- B-020: фон модальных оверлеев (ConfirmDialog) -->
| `color.text.primary` | `var(--theme-text-primary)` | `#111827` | `#f9fafb` | `#ecfdf5` |
| `color.text.secondary` | `var(--theme-text-secondary)` | `#6b7280` | `#9ca3af` | `#6ee7b7` |
| `color.border.default` | `var(--theme-border-color)` | `#e5e7eb` | `#374151` | `#047857` |
| `color.accent.default` | `var(--theme-accent)` | `#3b82f6` | `#8b5cf6` | `#10b981` |
| `color.nav.bg` | `var(--theme-nav-bg)` | `#ffffff` | `#1f2937` | `#065f46` |
| `color.nav.shadow` | `var(--theme-nav-shadow)` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.2)` |

---

## 2. Цвета элементов форм

| Токен | CSS-переменная | Light | Dark | Green |
|-------|---------------|-------|------|-------|
| `color.input.bg` | `var(--theme-input-bg)` | `#ffffff` | `#1f2937` | `#065f46` |
| `color.input.text` | `var(--theme-input-text)` | `#111827` | `#f9fafb` | `#ecfdf5` |
| `color.input.placeholder` | `var(--theme-input-placeholder)` | `#6b7280` | `#9ca3af` | `#6ee7b7` |
| `color.input.border` | `var(--theme-input-border)` | `#d1d5db` | `#374151` | `#047857` |
| `color.input.focus` | `var(--theme-input-focus-border)` | `#3b82f6` | `#8b5cf6` | `#10b981` |

---

## 3. Семантические цвета

| Токен | CSS-переменная | Light | Dark | Green |
|-------|---------------|-------|------|-------|
| `color.success` | `var(--theme-success)` | `#10b981` | `#34d399` | `#6ee7b7` |
| `color.warning` | `var(--theme-warning)` | `#f59e0b` | `#fbbf24` | `#fcd34d` |
| `color.danger` | `var(--theme-danger)` | `#ef4444` | `#f87171` | `#fca5a5` |
| `color.info` | `var(--theme-info)` | `#3b82f6` | `#818cf8` | `#38bdf8` |

---

## 4. Цвета статус-бейджей (B-021)

> **B-021** (R-27). Токены для статусных бейджей и пилюль. Добавлены для всех 3 тем.

| Токен | CSS-переменная | Light | Dark | Green |
|-------|---------------|-------|------|-------|
| `color.badge.default.bg` | `var(--theme-badge-default-bg)` | `#f3f4f6` | `#374151` | `#374151` |
| `color.badge.default.color` | `var(--theme-badge-default-color)` | `#1f2937` | `#f9fafb` | `#f9fafb` |
| `color.badge.success.bg` | `var(--theme-badge-success-bg)` | `#d1fae5` | `#065f46` | `#065f46` |
| `color.badge.success.color` | `var(--theme-badge-success-color)` | `#065f46` | `#6ee7b7` | `#6ee7b7` |
| `color.badge.warning.bg` | `var(--theme-badge-warning-bg)` | `#fef3c7` | `#78350f` | `#78350f` |
| `color.badge.warning.color` | `var(--theme-badge-warning-color)` | `#92400e` | `#fde68a` | `#fde68a` |
| `color.badge.danger.bg` | `var(--theme-badge-danger-bg)` | `#fee2e2` | `#7f1d1d` | `#7f1d1d` |
| `color.badge.danger.color` | `var(--theme-badge-danger-color)` | `#991b1b` | `#fca5a5` | `#fca5a5` |
| `color.badge.info.bg` | `var(--theme-badge-info-bg)` | `#dbeafe` | `#1e3a8a` | `#1e3a8a` |
| `color.badge.info.color` | `var(--theme-badge-info-color)` | `#1e40af` | `#93c5fd` | `#93c5fd` |

**Применение** (вместо хардкод-классов `bg-{gray,green,yellow,red,blue}-100` / `text-*`) в `DocumentCard`, `DocumentDetail`, `ChatList`, `UserList`, `DeleteCategoryDialog`:

```tsx
// ✅ Правильно — через токены бейджей
<span className="bg-[var(--theme-badge-success-bg)] text-[var(--theme-badge-success-color)]">
  Активен
</span>

// ❌ Неправильно — хардкод
<span className="bg-green-100 text-green-800">Активен</span>
```

---

## 5. Использование

### В макетах (ASCII/Text или HTML/CSS)

```markdown
| Элемент | Токен | Описание |
|---------|-------|----------|
| Фон | `color.bg.primary` | Основной фон страницы |
| Текст | `color.text.primary` | Основной текст |
| Акцент | `color.accent.default` | Кнопки, ссылки |
| Успех | `color.success` | Статус "активен" |
| Ошибка | `color.danger` | Сообщения об ошибках |
```

### В коде

```tsx
// ✅ Правильно — через CSS-переменные
<div style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
  <span style={{ color: 'var(--theme-text-primary)' }}>Текст</span>
</div>

// ❌ Неправильно — хардкод
<div style={{ backgroundColor: '#ffffff' }}>
  <span style={{ color: '#111827' }}>Текст</span>
</div>
```

### В Tailwind

```tsx
// ✅ Правильно — через []
<button className="bg-[var(--theme-accent)] text-white">Кнопка</button>

// ❌ Неправильно — хардкод
<button className="bg-indigo-600 text-white">Кнопка</button>
```

---

## 🔗 Связанные артефакты

- 📁 **CSS-переменные:** [`src/app/globals.css`](../../../src/app/globals.css)
- 📋 **Типографика:** [`typography.md`](typography.md)
