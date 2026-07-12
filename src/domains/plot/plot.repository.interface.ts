import type { Plot, CreatePlotData, UpdatePlotData, PlotSearchFilters } from './plot.types';

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
   * @param cadastralNumber - кадастровый номер участка
   * @returns true, если участок с таким кадастровым номером существует, иначе false
   *
   * @spec - Используется при создании участка (US-14)
   */
  existsByCadastralNumber(cadastralNumber: string): Promise<boolean>;

  /**
   * Проверяет, существует ли ДРУГОЙ участок с указанным кадастровым номером
   * (исключая участок с заданным ID — для проверки уникальности при обновлении)
   *
   * @param cadastralNumber - кадастровый номер для проверки
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
  existsByCadastralNumberExcludingId(cadastralNumber: string, excludeId: string): Promise<boolean>;

  /**
  /**
   * Поиск участков по фильтрам
   *
   * @param filters - Объект с фильтрами поиска (number, cadastral, note)
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
