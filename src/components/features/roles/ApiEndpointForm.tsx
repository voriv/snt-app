/**
 * @component ApiEndpointForm
 * @category features
 * @description Форма создания/редактирования API endpoint
 *
 * @spec
 * - Поля: метод (GET/POST/PATCH/PUT/DELETE), путь, описание
 * - Валидация пути (должен начинаться с /)
 * - При сохранении вызывает onSubmit
 * - При отмене вызывает onCancel
 * - Блокировка кнопок при загрузке
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-13, AC-17
 */
'use client';

import { useState, useEffect } from 'react';
import type { ApiEndpoint, CreateApiEndpointInput, UpdateApiEndpointInput } from '@/domains/roles';
import { Button, Input, Select } from '@/components/ui';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const httpMethods: HttpMethod[] = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

/**
 * @interface ApiEndpointFormProps
 * @description Интерфейс props для компонента ApiEndpointForm
 * @spec
 * - endpoint: null или undefined означает режим создания новой записи
 * - onSubmit: опциональный callback для обработки сохранения (вызывается только при валидной форме)
 * - onCancel: опциональный callback для отмены редактирования/создания
 * - isLoading: блокировка UI элементов при выполнении асинхронной операции
 */
export interface ApiEndpointFormProps {
  /**
   * Существующий API endpoint для редактирования.
   * Если undefined или null — режим создания нового endpoint
   *
   * @spec endpoint !== null && endpoint !== undefined → режим редактирования
   * @spec endpoint === null || endpoint === undefined → режим создания
   */
  endpoint?: ApiEndpoint | null;

  /**
   * Callback вызывается при успешной валидации и отправке формы.
   * Передает валидированные данные без пустых полей описания.
   *
   * @param data - Валидированные данные endpoint с полями: method, path, description (опционально)
   * @returns Promise<void> — resolves при успешной отправки, reject при ошибке
   *
   * @spec - данные передаются в неизменном виде, бизнес-логика обрабатывается вызывающим кодом
   * @spec - вызывается только после прохождения валидации пути
   * @spec - должен обрабатывать ошибки (try/catch) на стороне вызывающего компонента
   */
  onSubmit?: (data: {
    /** HTTP метод endpoint */
    method: HttpMethod;
    /** Относительный путь endpoint, начинается с '/' (например '/users', '/users/:id') */
    path: string;
    /** Описание endpoint. Опциональное поле, исключается из данных если пустое */
    description?: string;
  }) => Promise<void>;

  /**
   * Callback вызывается при нажатии кнопки "Отмена".
   * Обычно используется для закрытия модального окна или отмены редактирования.
   *
   * @spec - вызывается только при клике на кнопку "Отмена"
   * @spec - не вызывает подтверждение удаления, это ответственность вызывающего компонента
   */
  onCancel?: () => void;

  /**
   * Флаг блокировки UI элементов при выполнении асинхронных операций.
   * При true: все input'ы и кнопки disabled, на кнопке отправки показывается спиннер.
   *
   * @default false
   * @spec - при true: форма визуально заблокирована, новые данные не могут быть введены
   * @spec - обычно используется вместе с isLoading в API вызовах (создание/обновление)
   */
  isLoading?: boolean;
}



/**
 * @function ApiEndpointForm
 * @description Компонент формы для создания/редактирования API endpoint
 *
 * @param props - props компонента
 * @param props.endpoint - существующий endpoint для редактирования (опционально)
 * @param props.onSubmit - callback для сохранения данных (опционально)
 * @param props.onCancel - callback для отмены операции (опционально)
 * @param props.isLoading - флаг блокировки формы при загрузке
 * @returns React.JSX.Element - разметка формы
 *
 * @spec
 * - При монтировании синхронизирует локальное состояние с props.endpoint
 * - При смене endpoint обновляет значения полей
 * - Валидация path: непустой, начинается с '/'
 * - При отправке формы исключает description из данных если пустая строка
 * - Блокирует input'ы и кнопки при isLoading=true
 * - Показывает спиннер на кнопке отправки при isLoading=true
 * @see ApiEndpointFormProps — интерфейс пропсов
 */
export function ApiEndpointForm({
  endpoint,
  onSubmit,
  onCancel,
  isLoading = false,
}: ApiEndpointFormProps): React.JSX.Element {
  /** Текущий HTTP метод выбранного endpoint */
  const [method, setMethod] = useState<HttpMethod>(endpoint?.method ?? 'GET');
  /** Путь endpoint (обязательное поле) */
  const [path, setPath] = useState<string>(endpoint?.path ?? '');
  /** Описание endpoint (опциональное поле) */
  const [description, setDescription] = useState<string>(endpoint?.description ?? '');
  /** Ошибка валидации или пользовательская ошибка */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (endpoint) {
      setMethod(endpoint.method);
      setPath(endpoint.path);
      setDescription(endpoint.description ?? '');
      setError(null);
    } else {
      setMethod('GET');
      setPath('');
      setDescription('');
      setError(null);
    }
  }, [endpoint]);

/**
 * @function validatePath
 * @description Валидирует путь API endpoint
 *
 * @param value - Ввод пользователя: путь endpoint
 * @returns null если валидно, строка с сообщением об ошибке если невалидно
 *
 * @spec - возвращает null если путь непустой и начинается с '/'
 * @spec - возвращает ошибку "Путь не может быть пустым" если строка пустая или только пробелы
 * @spec - возвращает ошибку "Путь должен начинаться с /" если путь не начинается с '/'
 * @spec - используется в handleSubmit перед отправкой данных
 */
  const validatePath = (value: string): string | null => {
    /** Проверка на пустое значение */
    if (value.trim().length < 1) {
      return 'Путь не может быть пустым';
    }
    /** Проверка что путь начинается с '/' */
    if (!value.startsWith('/')) {
      return 'Путь должен начинаться с /';
    }
    return null;
  };

/**
 * @function handleSubmit
 * @description Обработчик отправки формы с валидацией и вызовом onSubmit
 *
 * @param e - событие Submit из формы
 * @returns void
 *
 * @spec - предотвращает стандартное поведение формы (e.preventDefault())
 * - очищает ошибку перед валидацией
 * - вызывает validatePath для проверки пути
 * - если есть ошибка валидации, устанавливает error и aborts
 * - формирует данные: метод, путь (trim), описание (только если непустое)
 * - вызывает onSubmit с отформатированными данными если функция передана
 * @spec - не обрабатывает ошибки от onSubmit (это ответственность вызывающего компонента)
 * @spec - после успешного onSubmit component не сбрасывает состояние автоматически
 */
  const handleSubmit = async (e: React.FormEvent) => {
    /** Предотвращаем стандартное поведение формы */
    e.preventDefault();
    /** Очищаем предыдущие ошибки */
    setError(null);

    /** Валидируем путь */
    const pathError = validatePath(path);
    if (pathError) {
      /** Если ошибка, показываем её и не отправляем форму */
      setError(pathError);
      return;
    }

    /** Формируем данные для отправки */
    const data = {
      method,
      path: path.trim(),
      ...(description.trim() && { description: description.trim() }),
    };

    /** Вызываем callback для сохранения если передан */
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Форма API endpoint">
      {/* Выбор HTTP метода */}
      <Select
        label="HTTP метод"
        id="method"
        value={method}
        onChange={(e) => setMethod(e.target.value as HttpMethod)}
        required
        disabled={isLoading}
      >
        {httpMethods.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </Select>

      {/* Поле пути endpoint */}
      <Input
        label="Путь"
        id="path"
        type="text"
        value={path}
        onChange={(e) => {
          setPath(e.target.value);
          /** Очищаем ошибку при вводе */
          setError(null);
        }}
        placeholder="/api/..."
        required
        disabled={isLoading}
        error={error || undefined}
      />

      {/* Опциональное поле описания */}
      <Input
        label="Описание"
        id="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание endpoint"
        disabled={isLoading}
      />

      {/* Сообщение об ошибке */}
      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          {endpoint ? 'Сохранить' : 'Создать'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
