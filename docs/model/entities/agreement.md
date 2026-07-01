# Agreement

## Описание

Договор — документ, регламентирующий отношения между СНТ и его членом (участком).

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор договора | Генерируется автоматически (cuid) |
| `type` | String | Да | Тип договора | membership, utility, additional |
| `start_date` | DateTime | Да | Дата начала действия | Не может быть в будущем |
| `end_date` | DateTime? | Нет | Дата окончания действия | Если null — бессрочный |
| `amount` | Decimal | Да | Сумма договора | Точность: 10,2 (рубли) |
| `status` | AgreementStatus | Да | Статус договора | DRAFT (по умолчанию), ACTIVE, EXPIRED, CANCELLED |
| `note` | String? | Нет | Примечание к договору | Опциональное поле |
| `member_id` | String | Да | Ссылка на члена СНТ | Внешний ключ |
| `plot_id` | String? | Нет | Ссылка на участок | Опциональный внешний ключ |
| `created_at` | DateTime | Да | Дата создания договора | Генерируется автоматически |
| `updated_at` | DateTime | Да | Дата последнего обновления | Обновляется при каждой записи |

## Типы статусов

| Значение | Описание |
|----------|----------|
| `DRAFT` | Черновик, не утвержден |
| `ACTIVE` | Действующий договор |
| `EXPIRED` | Истёкший срок действия |
| `CANCELLED` | Отменённый договор |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Member | belongs_to | Договор привязан к члену СНТ |
| Plot | belongs_to | Договор может быть привязан к участку |
| Payment | has_many | К договору могут быть привязаны платежи |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| `member_id` | index | Индекс для поиска по члену СНТ |
| `plot_id` | index | Индекс для поиска по участку |
| `status` | index | Индекс для поиска по статусу |

## Бизнес-инварианты

- Дата окончания не может быть раньше даты начала
- Договор может быть создан только для активного члена СНТ
- При переходе в статус EXPIRED проверяется текущая дата
- Сумма договора должна быть положительным числом

## Конвенции именования

- **БД (PostgreSQL):** `agreements`, `id`, `type`, `start_date`, `end_date`, `amount`, `status`, `note`, `member_id`, `plot_id`, `created_at`, `updated_at`
- **Prisma:** `Agreement`, `id`, `type`, `startDate`, `endDate`, `amount`, `status`, `note`, `memberId`, `plotId`, `createdAt`, `updatedAt`
- **TypeScript домен:** `Agreement`, `id: string`, `type: string`, `startDate: Date`, `endDate: Date \| null`, `amount: number`, `status: 'DRAFT' \| 'ACTIVE' \| 'EXPIRED' \| 'CANCELLED'`, `note: string \| null`, `memberId: string`, `plotId: string \| null`, `createdAt: Date`, `updatedAt: Date`
