/**
 * @type Plot
 * @domain plot
 * @description Земельный участок СНТ
 *
 * @spec
 * - Бизнес-ключ: нет натурального ключа, идентификация через id
 * - Уникальные поля: plotNumber, cadastralNumber (если задан)
 * - Площадь измеряется в квадратных метрах
 *
 * @see docs/model/entities/plot.md — концептуальная модель
 */
export interface Plot {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** Номер участка — уникальное обязательное поле */
  plotNumber: string;
  /** Кадастровый номер — опциональное уникальное поле */
  cadastralNumber: string | null;
  /** Площадь участка в квадратных метрах */
  area: number;
  /** Адрес участка — опциональное поле */
  address: string | null;
  /** Примечание — опциональное поле */
  note: string | null;
  /** Дата создания записи */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreatePlotData
 * @domain plot
 * @description Данные для создания нового земельного участка
 *
 * @spec
 * - plotNumber обязателен и должен быть уникальным
 * - area обязателен и должен быть положительным числом
 * - Остальные поля опциональны
 */
export interface CreatePlotData {
  /** Номер участка — обязателен */
  plotNumber: string;
  /** Кадастровый номер — опционально */
  cadastralNumber?: string | null | undefined;
  /** Площадь участка в м² — обязателен, должен быть > 0 */
  area: number;
  /** Адрес участка — опционально */
  address?: string | null | undefined;
  /** Примечание — опционально */
  note?: string | null | undefined;
}

/**
 * @type UpdatePlotData
 * @domain plot
 * @description Данные для обновления земельного участка
 *
 * @spec
 * - Все поля опциональны
 */
export interface UpdatePlotData {
  plotNumber?: string | null;
  cadastralNumber?: string | null;
  area?: number;
  address?: string | null;
  note?: string | null;
}

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
  cadastral?: string;
  /**
   * Текстовый поиск по примечанию (partial match)
   * Минимальная длина: 2 символа
   */
  note?: string;
}
