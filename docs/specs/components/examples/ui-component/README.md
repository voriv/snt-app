# Пример: UI Компонент с декомпозицией

Пример демонстрирует паттерн декомпозиции UI-компонента на подкомпоненты
согласно правилу 50 строк и выделению бизнес-логики в custom hooks.

## Структура

```
PlotCard.tsx           ← Основной компонент-контейнер (< 50 строк)
PlotCard.Header.tsx    ← Заголовок карточки (номер, статус)
PlotCard.Body.tsx      ← Основная информация (площадь, адрес)
PlotCard.Footer.tsx    ← Действия (кнопки)
usePlotActions.ts      ← Custom hook для действий (side effects)
```

## Ключевые паттерны

| Паттерн | Реализация |
|---------|-----------|
| **Правило 50 строк** | Каждый подкомпонент < 50 строк кода |
| **Composition** | Основной компонент собирает подкомпоненты |
| **Custom hooks** | Вся логика действий вынесена в `usePlotActions` |
| **JSDoc + TypeScript** | Полная типизация Props интерфейсов |
| **A11y** | aria-label, role, semantic HTML |
| **Tailwind CSS** | Адаптивная стилизация с breakpoints |

## Связанные спецификации

- [`ui-component-requirements.md`](../../ui/ui-component-requirements.md)
- [`component-requirements.md`](../../component-requirements.md)