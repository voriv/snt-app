/**
 * @hook useUrlState
 * @category hooks
 * @description Переиспользуемый хук для синхронизации состояния React с URL query-параметрами.
 * Поддерживает debounce для предотвращения засорения истории браузера и
 * мгновенную синхронизацию для критичных действий (пагинация, сортировка).
 *
 * @spec
 * - Чтение: Инициализирует state из URL query params, если ключ существует, иначе использует default
 * - Запись: Обновляет URL при изменении state (с debounce или мгновенно)
 * - Sync URL->State: Перехватывает popstate и изменения searchParams для восстановления state
 * - Debounce: Использует debounceMs для обновления URL (по умолчанию 0 = мгновенно)
 * - ClearOnDefault: Если значение state совпадает с default, параметр удаляется из URL
 * - Типизация: Автоматический парсинг типов (string, number, boolean)
 * - Неверные типы параметров (например, ?page=abc) игнорируются, используется default
 * - Неизвестные ключи в URL игнорируются (только ключи из defaults считаются известными)
 * - При popstate состояние восстанавливается из новых URL params
 * - Защита от бесконечных циклов URL -> State -> URL
 *
 * @example
 * ```tsx
 * const [urlState, updateUrlState] = useUrlState(
 *   { page: 1, search: '', sort: 'lastName' },
 *   { debounceMs: 500, clearOnDefault: true }
 * );
 *
 * // Поиск (с debounce 500мс)
 * updateUrlState({ search: 'Alex' });
 *
 * // Пагинация (мгновенно, без debounce)
 * updateUrlState({ page: 2 }, { force: true });
 * ```
 *
 * @see docs/user-stories/US-10-spa-routing.md — FR-1..FR-9, AC-1..AC-9
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * Допустимые значения состояния URL
 */
export type UrlStateValue = string | number | boolean | undefined | null;

/**
 * Объект состояния URL — запись строковых ключей в значения
 */
export type UrlState = Record<string, UrlStateValue>;

/**
 * Опции хука useUrlState
 */
export interface UseUrlStateOptions {
  /**
   * Задержка в мс перед обновлением URL.
   * Используйте 0 для мгновенной синхронизации.
   * Рекомендуется 500мс для search-параметров.
   * @default 0
   */
  debounceMs?: number;

  /**
   * Если true, параметры со значениями по умолчанию удаляются из URL.
   * @default false
   */
  clearOnDefault?: boolean;
}

/**
 * Опции вызова updateState
 */
export interface UpdateStateOptions {
  /**
   * Если true, URL обновляется мгновенно без debounce.
   * Используется для пагинации и сортировки.
   * @default false
   */
  force?: boolean;
}

/**
 * Функция обновления состояния URL
 *
 * @param updater - Частичное обновление состояния или функция-обновитель
 * @param options - Опции обновления (force для мгновенного обновления)
 */
export type UpdateUrlState = (
  updater: Partial<UrlState> | ((prev: UrlState) => Partial<UrlState>),
  options?: UpdateStateOptions
) => void;

/**
 * Возвращаемое значение хука useUrlState
 */
export type UseUrlStateReturn = [state: UrlState, updateState: UpdateUrlState];

/**
 * Хук для синхронизации состояния с URL query parameters
 *
 * @template T - Тип объекта состояния с параметрами URL
 * @param defaults - Значения по умолчанию для каждого параметра URL
 * @param options - Опции хука (debounceMs, clearOnDefault)
 * @returns [state, updateState] - Текущее состояние и функция обновления
 *
 * @spec
 * - Начальное состояние инициализируется из URL query params
 * - Если параметр отсутствует в URL — используется значение из defaults
 * - Неверные типы параметров (например, page=abc) игнорируются, используется default
 * - updateState обновляет React state и синхронизирует URL
 * - При clearOnDefault=true параметры со значением default удаляются из URL
 * - popstate event перехватывается для восстановления состояния при навигации "Назад"
 * - Неизвестные ключи в URL игнорируются
 * - При force=true URL обновляется мгновенно без debounce
 *
 * @throws {Error} не выбрасывает ошибок
 *
 * @see docs/user-stories/US-10-spa-routing.md — FR-1..FR-9
 */
export function useUrlState(
  defaults: UrlState,
  options: UseUrlStateOptions = {}
): UseUrlStateReturn {
  const { debounceMs = 0, clearOnDefault = false } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Инициализация состояния из URL query params
  const [state, setState] = useState<UrlState>(() => {
    const parsed: UrlState = {};
    const knownKeys = Object.keys(defaults);

    for (const key of knownKeys) {
      const defaultValue = defaults[key];
      const rawValue = searchParams.get(key);

      if (rawValue !== null) {
        const parsedValue = parseParamImpl(key, rawValue, defaultValue);
        if (parsedValue !== undefined) {
          parsed[key] = parsedValue;
        } else {
          parsed[key] = defaultValue;
        }
      } else {
        parsed[key] = defaultValue;
      }
    }

    return parsed;
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);
  const searchParamsKeysRef = useRef<string | null>(null);
  const stateRef = useRef<UrlState>(state);
  stateRef.current = state;

  /**
   * Парсинг значения параметра URL с учётом типа default
   */
  const parseParam = useCallback(
    (key: string, rawValue: string | null, defaultValue: UrlStateValue): UrlStateValue => {
      if (rawValue === null) return defaultValue;

      // Проверяем, что ключ известный
      if (!(key in defaults)) {
        return defaultValue;
      }

      try {
        if (typeof defaultValue === 'number') {
          const parsed = parseInt(rawValue, 10);
          if (isNaN(parsed)) return defaultValue;
          return parsed;
        }

        if (typeof defaultValue === 'boolean') {
          if (rawValue === 'true') return true;
          if (rawValue === 'false') return false;
          return defaultValue;
        }

        // string
        return rawValue;
      } catch {
        return defaultValue;
      }
    },
    [defaults]
  );

  /**
   * Построение URLSearchParams из объекта состояния
   */
  const buildSearchParams = useCallback(
    (currentState: UrlState): URLSearchParams => {
      const params = new URLSearchParams();
      const knownKeys = Object.keys(defaults);

      for (const key of knownKeys) {
        const value = currentState[key];
        const defaultValue = defaults[key];

        // Пропускаем undefined
        if (value === undefined) continue;

        // Если clearOnDefault=true и значение равно default — пропускаем
        if (clearOnDefault && value === defaultValue) continue;

        // Конвертируем значение в строку
        if (typeof value === 'number') {
          params.set(key, String(value));
        } else if (typeof value === 'boolean') {
          params.set(key, value ? 'true' : 'false');
        } else if (typeof value === 'string') {
          params.set(key, value);
        }
      }

      return params;
    },
    [defaults, clearOnDefault]
  );

  /**
   * Обновление URL через router.push
   */
  const updateUrl = useCallback(
    (newState: UrlState, force: boolean) => {
      const params = buildSearchParams(newState);
      const newSearch = params.toString();

      // Защита от бесконечного цикла: если search params не изменились, не обновляем URL
      if (!force && searchParamsKeysRef.current === newSearch) {
        return;
      }

      // Флаг для предотвращения обработки popstate как внешнего изменения
      isInternalUpdateRef.current = true;
      searchParamsKeysRef.current = newSearch;

      if (force) {
        // Мгновенное обновление
        router.push(`${pathname}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
      } else if (debounceMs > 0) {
        // Debounce обновление
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          router.push(`${pathname}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
        }, debounceMs);
      } else {
        // Мгновенное обновление (debounceMs === 0)
        router.push(`${pathname}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
      }
    },
    [router, pathname, debounceMs, buildSearchParams]
  );

  /**
   * Функция обновления состояния и URL
   *
   * КРИТИЧНО: updateUrl (router.push) вызывается как ОТДЕЛЬНАЯ операция после setState,
   * а НЕ внутри setState updater. Вызов router.push() внутри setState updater приводит
   * к React-ошибке: "Cannot update a component while rendering a different component"
   */
  const updateState = useCallback<UpdateUrlState>(
    (updater, updateOptions) => {
      const force = updateOptions?.force ?? false;

      // Вычисляем новое состояние используя stateRef (актуальное состояние вне render cycle)
      const prev = stateRef.current;
      const partial = typeof updater === 'function' ? updater(prev) : updater;
      const newState: UrlState = { ...prev, ...partial };

      // setState и updateUrl — две отдельные операции, НЕ вложенные друг в друга
      setState(newState);
      updateUrl(newState, force);
    },
    [updateUrl]
  );

  /**
   * Эффект: подписка на изменения searchParams (popstate / Назад)
   */
  useEffect(() => {
    // Собираем все известные параметры из URL
    const knownKeys = Object.keys(defaults);
    const newState: UrlState = {};
    let changed = false;

    for (const key of knownKeys) {
      const defaultValue = defaults[key];
      const rawValue = searchParams.get(key);
      const parsedValue = parseParam(key, rawValue, defaultValue);

      if (parsedValue !== state[key]) {
        changed = true;
      }

      if (parsedValue !== undefined) {
        newState[key] = parsedValue;
      } else {
        newState[key] = defaultValue;
      }
    }

    if (changed) {
      // Если изменение вызвано внутренним обновлением, игнорируем
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false;
        return;
      }

      setState(newState);
    }
  }, [searchParams, defaults, parseParam, state]);

  /**
   * Эффект: очистка debounce таймера при размонтировании
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return [state, updateState];
}

/**
 * Вспомогательная функция для парсинга параметра (используется при инициализации useState)
 */
function parseParamImpl(
  key: string,
  rawValue: string | null,
  defaultValue: UrlStateValue
): UrlStateValue | undefined {
  if (rawValue === null) return undefined;

  try {
    if (typeof defaultValue === 'number') {
      const parsed = parseInt(rawValue, 10);
      if (isNaN(parsed)) return undefined;
      return parsed;
    }

    if (typeof defaultValue === 'boolean') {
      if (rawValue === 'true') return true;
      if (rawValue === 'false') return false;
      return undefined;
    }

    // string
    return rawValue;
  } catch {
    return undefined;
  }
}
