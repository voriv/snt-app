# US-17: Поиск по участкам — Детальная спецификация

## Цель

Реализовать функционал поиска земельных участков по номеру, кадастровому номеру и описанию с использованием клиентских компонентов и API-first подхода.

## Влияние на архитектуру

### Слой Repository (`src/domains/plot/`)

#### 1. [`src/domains/plot/plot.types.ts`](src/domains/plot/plot.types.ts)
**Добавление типа:**

```typescript
/**
 * @type PlotSearchFilters
 * @domain plot
 * @description Фильтры для поиска участков
 *
 * @spec
 * - Все поля опциональны
 * - number: частичное совпадение (>= 2 символа)
 * - cadstral: частичное совпадение (>= 3 символа)
 * - note: частичное совпадение (>= 2 символа)
 * - AND-логика: все непустые фильтры применяются совместно
 */
export interface PlotSearchFilters {
  /**
   * Поиск по номеру участка (partial match)
   * Минимальная длина: 2 символа
   */
  number?: string;
  /**
   * Поиск по кадастровому номеру (partial match)
   * Минимальная длина: 3 символа
   */
  cadstral?: string;
  /**
   * Текстовый поиск по примечанию (partial match)
   * Минимальная длина: 2 символа
   */
  note?: string;
}
```

**Реализация:** Добавить определение интерфейса после `UpdatePlotData`

---

#### 2. [`src/domains/plot/plot.repository.interface.ts`](src/domains/plot/plot.repository.interface.ts)
**Добавление методов в `IPlotRepository`:**

```typescript
/**
 * @interface IPlotRepository
 * @domain plot
 * @description Контракт доступа к данным земельных участков
 *
 * @spec
 * - findAll возвращает все участки, отсортированные по plotNumber ASC
 * - findById возвращает null если участок не найден — НЕ бросает ошибку
 * - findByPlotNumber возвращает null если участок не найден — НЕ бросает ошибку
 * - create/update могут выбросить PlotDuplicateError при дублировании plotNumber или cadastralNumber
 * - update исключает plotNumber из данных обновления (неизменяемое поле, BR-1)
 *
 * @see docs/user-stories/US-15-plot-editing.md — BR-1 (номер неизменяем), BR-2 (уникальность кадастра)
 */
export interface IPlotRepository {
  /** Найти все участки, отсортированные по plotNumber ASC */
  findAll(): Promise<Plot[]>;

  /** Найти по ID. Возвращает null если не найден */
  findById(id: string): Promise<Plot | null>;

  /** Найти по номеру участка. Возвращает null если не найден */
  findByPlotNumber(plotNumber: string): Promise<Plot | null>;

  /** Создать новый участок */
  create(data: CreatePlotData): Promise<Plot>;

  /**
   * Обновить участок
   *
   * @param id - Уникальный идентификатор участка
   * @param data - Данные для обновления (plotNumber игнорируется — неизменяемое поле)
   * @returns Обновленный участок
   * @throws {PlotNotFoundError} если участок не найден
   * @throws {PlotDuplicateError} при дубликате cadastralNumber (P2002)
   *
   * @spec
   * - plotNumber не может быть изменён (BR-1)
   * - Проверка уникальности cadastralNumber выполняется в Service слое перед вызовом
   * - Возвращает полный объект Plot без фильтрации полей
   */
  update(id: string, data: UpdatePlotData): Promise<Plot>;

  /** Удалить участок по ID */
  delete(id: string): Promise<void>;

  /**
   * Проверяет, существует ли участок с указанным кадастровым номером
   *
   * @param cadstralNumber - кадастровый номер участка
   * @returns true, если участок с таким кадастровым номером существует, иначе false
   *
   * @spec - Используется при создании участка (US-14)
   */
  existsByCadstralNumber(cadstralNumber: string): Promise<boolean>;

  /**
   * Проверяет, существует ли ДРУГОЙ участок с указанным кадастровым номером
   * (исключая участок с заданным ID — для проверки уникальности при обновлении)
   *
   * @param cadstralNumber - кадастровый номер для проверки
   * @param excludeId - ID участка, который исключается из проверки (редактируемый участок)
   * @returns true, если существует ДРУГОЙ участок с таким кадастровым номером, иначе false
   *
   * @spec
   * - Используется при обновлении участка (US-15, BR-2)
   * - Исключает текущий редактируемый участок из проверки
   * - Возвращает false, если кадастровый номер принадлежит только excludeId
   *
   * @see docs/user-stories/US-15-plot-editing.md — BR-2 (уникальность кадастра)
   */
  existsByCadstralNumberExcludingId(cadstralNumber: string, excludeId: string): Promise<boolean>;

  /**
   * Поиск участков по фильтрам
   *
   * @param filters - Объект с фильтрами поиска (number, cadstral, note)
   * @returns Массив найденных участков
   *
   * @spec
   * - Использует ILIKE для частичного совпадения (case-insensitive)
   * - Все непустые фильтры применяются совместно (AND-логика)
   * - Экранирует специальные символы (% и _) в поисковых запросах
   * - Обрезает длинные запросы до 100 символов
   * - Результаты отсортированы по plotNumber ASC
   */
  search(filters: PlotSearchFilters): Promise<Plot[]>;
}
```

**Реализация:** Добавить новый метод `search` в конец интерфейса

---

#### 3. [`src/domains/plot/plot.repository.prisma.ts`](src/domains/plot/plot.repository.prisma.ts)
**Реализация метода `search`:**

```typescript
/**
 * Поиск участков по фильтрам
 *
 * @param filters - Фильтры поиска
 * @returns Массив найденных участков
 *
 * @spec
 * - Использует ILIKE для частичного совпадения (case-insensitive)
 * - Все непустые фильтры применяются совместно (AND-логика)
 * - Экранирует специальные символы (% и _) в поисковых запросах
 * - Обрезает запросы до 100 символов
 * - Результаты отсортированы по plotNumber ASC
 * - BR-2: OR-логика для поиска по номеру (начало слова или содержит)
 */
async search(filters: PlotSearchFilters): Promise<Plot[]> {
  const { number, cadstral, note } = filters;

  // Обрезаем длинные запросы до 100 символов
  const sanitizeQuery = (query: string | undefined): string | undefined => {
    if (!query) return undefined;
    return query.slice(0, 100);
  };

  // Экранирование специальных символов для ILIKE
  const escapeLike = (query: string): string => {
    return query
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/\\/g, '\\\\');
  };

  const searchFilters: Record<string, unknown> = {};

  // Поиск по номеру участка: ILIKE '%запрос%' или plotNumber LIKE 'запрос%'
  if (number && number.length >= 2) {
    const safeNumber = escapeLike(sanitizeQuery(number).toLowerCase());
    searchFilters.plot_number = {
      or: [
        { contains: safeNumber, mode: 'insensitive' }, // Начинается с запроса
        { contains: ` %${safeNumber}%`, mode: 'insensitive' }, // Содержит запрос
      ],
    };
  }

  // Поиск по кадастровому номеру: ILIKE '%запрос%'
  if (cadstral && cadstral.length >= 3) {
    const safeCadstral = escapeLike(sanitizeQuery(cadstral).toLowerCase());
    if (searchFilters.cadastral_number) {
      // Если уже есть фильтр по number, объединяем через AND
      searchFilters.cadastral_number = {
        contains: safeCadstral,
        mode: 'insensitive',
      };
    } else {
      searchFilters.cadastral_number = {
        contains: safeCadstral,
        mode: 'insensitive',
      };
    }
  }

  // Поиск по примечанию: ILIKE '%запрос%'
  if (note && note.length >= 2) {
    const safeNote = escapeLike(sanitizeQuery(note).toLowerCase());
    searchFilters.note = {
      contains: safeNote,
      mode: 'insensitive',
    };
  }

  const plots = await prisma.plot.findMany({
    where: searchFilters,
    orderBy: { plot_number: 'asc' },
  });

  return plots.map((p) => this.mapToPlot(p));
}
```

**Реализация:** Добавить новый метод `search` в конец класса `PlotRepositoryPrisma`

---

### Слой Service (`src/domains/plot/`)

#### 4. [`src/domains/plot/plot.service.ts`](src/domains/plot/plot.service.ts)
**Добавление метода `search`:**

```typescript
/**
 * Поиск участков по фильтрам
 *
 * @param filters - Объект с фильтрами поиска
 * @returns Массив найденных участков
 * @throws {PlotInvalidDataError} при неверных фильтрах
 *
 * @spec
 * - Валидирует минимальную длину фильтров: number >= 2, cadstral >= 3, note >= 2
 * - Если фильтры не заданы — возвращает все участки через findAll()
 * - Передаёт валидированные фильтры в repository.search()
 * - Применяет AND-логику: все непустые фильтры применяются совместно
 * - Обрезает длинные запросы до 100 символов
 *
 * @see docs/user-stories/US-17-plot-search.md — BR-1 (минимальная длина), BR-2 (AND-логика), BR-3 (debounce)
 */
async search(filters: PlotSearchFilters): Promise<Plot[]> {
  const { number, cadstral, note } = filters;
  const hasFilters = number !== undefined || cadstral !== undefined || note !== undefined;

  if (!hasFilters) {
    return this.findAll();
  }

  // Валидация минимальной длины фильтров
  if (number !== undefined && number !== null && number.length < 2) {
    throw new PlotInvalidDataError(
      'Поиск по номеру участка должен содержать минимум 2 символа'
    );
  }

  if (cadstral !== undefined && cadstral !== null && cadstral.length < 3) {
    throw new PlotInvalidDataError(
      'Поиск по кадастровому номеру должен содержать минимум 3 символа'
    );
  }

  if (note !== undefined && note !== null && note.length < 2) {
    throw new PlotInvalidDataError(
      'Поиск по описанию должен содержать минимум 2 символа'
    );
  }

  return this.plotRepository.search(filters);
}
```

**Реализация:** Добавить новый метод `search` после метода `delete`

---

#### 5. [`src/domains/plot/index.ts`](src/domains/plot/index.ts)
**Re-export нового типа:**

```typescript
export type { Plot, CreatePlotData, UpdatePlotData, PlotSearchFilters } from './plot.types';
export { createPlotSchema, updatePlotSchema } from './plot.validators';
export { PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError } from './plot.errors';
export type { IPlotRepository } from './plot.repository.interface';
export { PlotRepositoryPrisma } from './plot.repository.prisma';
export { PlotService } from './plot.service';
```

**Реализация:** Добавить `PlotSearchFilters` в export

---

### Слой API (`src/app/api/v1/plots/`)

#### 6. **Новый файл:** `src/app/api/v1/plots/search/route.ts`

```typescript
/**
 * @route GET /api/v1/plots/search
 * @auth required
 * @description Ищет участки по фильтрам (номер, кадастр, описание)
 *
 * @query number - Поиск по номеру участка (optional, >= 2 символа)
 * @query cadstral - Поиск по кадастровому номеру (optional, >= 3 символа)
 * @query note - Текстовый поиск по описанию (optional, >= 2 символа)
 *
 * @response 200 { success: true, data: Plot[], total: number }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Фильтры передаются через query params
 * - При отсутствии фильтров возвращает все участки
 * - Применяет AND-логику: все непустые фильтры применяются совместно
 * - Обрезает запросы до 100 символов на уровне сервиса
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotService } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import { PlotInvalidDataError } from '@/domains/plot/plot.errors';

export const GET = withRoleGuard(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    const cadstral = searchParams.get('cadstral');
    const note = searchParams.get('note');

    const service = createPlotService();

    const plots = await service.search({
      number: number || undefined,
      cadstral: cadstral || undefined,
      note: note || undefined,
    });

    return NextResponse.json({
      success: true,
      data: plots,
      total: plots.length,
    });
  },
  { required: true } // Требуется авторизация
);
```

**Реализация:** Создать новый файл в `src/app/api/v1/plots/search/route.ts`

---

### Слой UI (`src/components/features/plots/`)

#### 7. **Новый файл:** `src/components/features/plots/PlotSearch/PlotSearch.tsx`

```typescript
/**
 * @component PlotSearch
 * @category features
 * @description Компонент поиска участков по номеру, кадастру и описанию
 *
 * @spec
 * - Три поля ввода: number, cadstral, note
 * - Debounce 300мс на каждый ввод
 * - При изменении любого поля: onSearch(filters)
 * - Кнопка «Очистить» сбрасывает все поля и вызывает onSearch({})
 * - Состояние загрузки: спиннер справа от кнопки «Очистить»
 * - Минимальная длина ввода: number >= 2, cadstral >= 3, note >= 2
 * - Поля очищаются по крестику в каждом поле (очищает только своё поле)
 * - Поля имеют aria-label для доступности
 *
 * @example
 * ```tsx
 * <PlotSearch onSearch={handleSearch} isLoading={isSearching} />
 * ```
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PlotSearchFilters } from '@/domains/plot';

export interface PlotSearchProps {
  /**
   * Callback при изменении фильтров
   * Вызывается с debounce (300мс) после прекращения ввода
   */
  onSearch: (filters: PlotSearchFilters) => void;
  /** Индикатор состояния загрузки поиска */
  isLoading?: boolean;
  /** Индикатор: есть ли активные фильтры */
  hasActiveFilters?: boolean;
}

/**
 * Дебаунс функция для задержки выполнения callback
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export const PlotSearch: React.FC<PlotSearchProps> = ({
  onSearch,
  isLoading = false,
  hasActiveFilters = false,
}) => {
  const [number, setNumber] = useState<string>('');
  const [cadstral, setCadstral] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Отменяем предыдущий запрос при новом вводе
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce для вызова onSearch
  const debouncedOnSearch = useCallback(
    debounce((filters: PlotSearchFilters) => {
      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Создаём новый AbortController для текущего запроса
      abortControllerRef.current = new AbortController();

      onSearch(filters);
    }, 300),
    [onSearch]
  );

  // Обработчик ввода для поля "№ участка"
  const handleNumberChange = useCallback(
    (value: string) => {
      setNumber(value);
      debouncedOnSearch({
        number: value || undefined,
        cadstral: cadstral || undefined,
        note: note || undefined,
      });
    },
    [cadstral, note, debouncedOnSearch]
  );

  // Обработчик ввода для поля "Кадастровый номер"
  const handleCadstralChange = useCallback(
    (value: string) => {
      setCadstral(value);
      debouncedOnSearch({
        number: number || undefined,
        cadstral: value || undefined,
        note: note || undefined,
      });
    },
    [number, note, debouncedOnSearch]
  );

  // Обработчик ввода для поля "Описание"
  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);
      debouncedOnSearch({
        number: number || undefined,
        cadstral: cadstral || undefined,
        note: value || undefined,
      });
    },
    [number, cadstral, debouncedOnSearch]
  );

  // Очистка всех полей
  const handleClearAll = useCallback(() => {
    setNumber('');
    setCadstral('');
    setNote('');

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    onSearch({});
  }, [onSearch]);

  // Очистка отдельного поля
  const handleClearField = useCallback(
    (field: 'number' | 'cadstral' | 'note') => {
      switch (field) {
        case 'number':
          setNumber('');
          break;
        case 'cadstral':
          setCadstral('');
          break;
        case 'note':
          setNote('');
          break;
      }

      debouncedOnSearch({
        number: field === 'number' ? '' : number || undefined,
        cadstral: field === 'cadstral' ? '' : cadstral || undefined,
        note: field === 'note' ? '' : note || undefined,
      });
    },
    [number, cadstral, note, debouncedOnSearch]
  );

  // Очистка AbortController при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Поле: № участка */}
      <div className="flex-1">
        <Input
          value={number}
          onChange={handleNumberChange}
          placeholder="Поиск по номеру..."
          aria-label="Поиск по номеру участка"
          clearable={number.length > 0}
          onClear={() => handleClearField('number')}
        />
      </div>

      {/* Поле: Кадастровый номер */}
      <div className="flex-1">
        <Input
          value={cadstral}
          onChange={handleCadstralChange}
          placeholder="Поиск по кадастру..."
          aria-label="Поиск по кадастровому номеру"
          clearable={cadstral.length > 0}
          onClear={() => handleClearField('cadstral')}
        />
      </div>

      {/* Поле: Описание */}
      <div className="flex-1">
        <Input
          value={note}
          onChange={handleNoteChange}
          placeholder="Поиск по описанию..."
          aria-label="Поиск по описанию"
          clearable={note.length > 0}
          onClear={() => handleClearField('note')}
        />
      </div>

      {/* Кнопка «Очистить» */}
      <Button
        variant="secondary"
        onClick={handleClearAll}
        isLoading={isLoading}
        disabled={!hasActiveFilters && !isLoading}
      >
        {isLoading ? 'Поиск...' : 'Очистить'}
      </Button>
    </div>
  );
};
```

**Реализация:** Создать новый файл в `src/components/features/plots/PlotSearch/PlotSearch.tsx`

---

#### 8. **Новый файл:** `src/components/features/plots/PlotSearch/index.ts`

```typescript
export { PlotSearch } from './PlotSearch';
export type { PlotSearchProps } from './PlotSearch';
```

**Реализация:** Создать новый файл

---

#### 9. **Обновление:** `src/components/features/plots/index.ts`

```typescript
export * from './PlotForm';
export * from './PlotFormModal';
export * from './PlotList';
export * from './PlotSearch';
```

**Реализация:** Добавить экспорт `PlotSearch`

---

### Слой Pages (`src/app/dashboard/plots/`)

#### 10. **Обновление:** `src/app/dashboard/plots/page.tsx`

Необходимо интегрировать компонент `PlotSearch` и обновить логику загрузки данных.

**Пример изменений:**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PlotList } from '@/components/features/plots/PlotList';
import { PlotSearch } from '@/components/features/plots/PlotSearch';
import type { Plot, PlotSearchFilters } from '@/domains/plot';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PlotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated') {
      loadPlots();
    }
  }, [status, router]);

  const loadPlots = async (filters?: PlotSearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.number) queryParams.append('number', filters.number);
      if (filters?.cadstral) queryParams.append('cadstral', filters.cadstral);
      if (filters?.note) queryParams.append('note', filters.note);

      const url = `/api/v1/plots${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<unknown>(url);

      if (response.success && Array.isArray(response.data)) {
        setPlots(response.data as Plot[]);
      } else {
        setError(response.error?.message || 'Ошибка загрузки данных');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (filters: PlotSearchFilters) => {
    setIsSearching(true);
    await loadPlots(filters);
    setIsSearching(false);
  };

  const hasActiveFilters =
    plots.length === 0 && (error || isSearching)
      ? false
      : Object.values({
          number: plots[0]?.plotNumber,
          cadstral: plots[0]?.cadastralNumber,
          note: plots[0]?.note,
        }).some((val) => val !== undefined && val !== null);

  if (status === 'loading') {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Участки СНТ</h1>

      <PlotSearch
        onSearch={handleSearch}
        isLoading={isSearching}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading && !isSearching ? (
        <div>Загрузка участков...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : plots.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте изменить параметры поиска"
        />
      ) : (
        <PlotList plots={plots} />
      )}
    </div>
  );
}
```

**Реализация:** Обновить файл `src/app/dashboard/plots/page.tsx` с интеграцией `PlotSearch` и обновлением логики загрузки

---

## Чек-лист реализации

### Repository Layer
- [ ] Добавить тип `PlotSearchFilters` в [`plot.types.ts`](src/domains/plot/plot.types.ts)
- [ ] Добавить метод `search(filters: PlotSearchFilters)` в интерфейс [`IPlotRepository`](src/domains/plot/plot.repository.interface.ts)
- [ ] Реализовать метод `search` в [`PlotRepositoryPrisma`](src/domains/plot/plot.repository.prisma.ts) с использованием Prisma ILIKE
- [ ] Добавить `PlotSearchFilters` в экспорт [`index.ts`](src/domains/plot/index.ts)

### Service Layer
- [ ] Добавить метод `search(filters: PlotSearchFilters)` в [`PlotService`](src/domains/plot/plot.service.ts)
- [ ] Реализовать валидацию минимальной длины фильтров
- [ ] Реализовать логику возврата всех участков при отсутствии фильтров

### API Layer
- [ ] Создать новый файл [`src/app/api/v1/plots/search/route.ts`](src/app/api/v1/plots/search/route.ts)
- [ ] Реализовать `GET` handler с авторизацией
- [ ] Использовать `withRoleGuard` для защиты маршрута

### UI Layer
- [ ] Создать компонент [`PlotSearch/PlotSearch.tsx`](src/components/features/plots/PlotSearch/PlotSearch.tsx)
- [ ] Реализовать debounce 300мс
- [ ] Реализовать AbortController для отмены запросов
- [ ] Создать [`PlotSearch/index.ts`](src/components/features/plots/PlotSearch/index.ts)
- [ ] Обновить [`src/components/features/plots/index.ts`](src/components/features/plots/index.ts)
- [ ] Обновить [`src/app/dashboard/plots/page.tsx`](src/app/dashboard/plots/page.tsx) для интеграции поиска

---

## Бизнес-правила (BR)

| ID | Правило | Реализация |
|----|---------|-----------|
| BR-1 | Минимальная длина фильтра | Валидация в Service: number >= 2, cadstral >= 3, note >= 2 |
| BR-2 | AND-логика | Service передаёт все непустые фильтры в repository |
| BR-3 | Debounce 300мс | UI: debounce функция в PlotSearch |
| BR-4 | Отмена предыдущих запросов | UI: AbortController при новом вводе |

---

## Граничные случаи

| Сценарий | Ожидаемое поведение |
|----------|-------------------|
| Специальные символы (% и _) | Экранируются в Prisma запросе |
| Очень длинный запрос (> 100 символов) | Обрезается до 100 символов |
| Поиск во время загрузки | Отменяется предыдущий запрос через AbortController |
| Быстрая смена запросов | Отменяются предыдущие запросы |

---

## Заключение

Данная спецификация полностью покрывает требования US-17 и готова к реализации в режиме Code.
