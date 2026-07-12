import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors/index';

/**
 * @class PlotNotFoundError
 * @domain plot
 * @description Ошибка: участок не найден по заданному идентификатору
 *
 * @spec - Используется в Service и Repository слоях
 */
export class PlotNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Plot', id);
  }
}

/**
 * @class PlotDuplicateError
 * @domain plot
 * @description Ошибка при попытке создать/обновить участок с дубликатом уникального поля
 *
 * @spec
 * - Сообщение об ошибке различается для plotNumber и cadastralNumber
 * - Для plotNumber: "Участок с номером {number} уже существует"
 * - Для cadastralNumber: "Участок с кадастровым номером {number} уже существует"
 *
 * @see docs/user-stories/US-15-plot-editing.md — BR-2 (уникальность кадастра)
 */
export class PlotDuplicateError extends ConflictError {
  constructor(field: 'plotNumber' | 'cadastralNumber', value: string) {
    const message =
      field === 'plotNumber'
        ? `Участок с номером ${value} уже существует`
        : `Участок с кадастровым номером ${value} уже существует`;
    super(message);
  }
}

/**
 * @class PlotInvalidDataError
 * @domain plot
 * @description Ошибка валидации данных участка
 *
 * @spec - Выбрасывается при невалидных данных (формат, ограничения)
 */
export class PlotInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Plot data invalid: ${message}`);
  }
}
