import type { Plot, CreatePlotData, UpdatePlotData, PlotSearchFilters } from './plot.types';
import type { IPlotRepository } from './plot.repository.interface';
import {
  PlotNotFoundError,
  PlotDuplicateError,
  PlotInvalidDataError,
} from './plot.errors';
import { createPlotSchema } from './plot.validators';
import { updatePlotSchema } from './plot.validators';

/**
 * @service PlotService
 * @domain plot
 * @description Бизнес-логика управления земельными участками СНТ
 *
 * @spec
 * - Валидация: через Zod-схемы из plot.validators.ts
 * - Ошибки: PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError
 * - Зависимости: IPlotRepository через DI
 * - findAll возвращает все участки без пагинации (MVP)
 * - create проверяет уникальность plotNumber и cadstralNumber
 */
export class PlotService {
  private readonly plotRepository: IPlotRepository;

  constructor(plotRepository: IPlotRepository) {
    this.plotRepository = plotRepository;
  }

  /**
   * Получить список всех участков
   * @returns Массив всех участков, отсортированный по номеру
   */
  async findAll(): Promise<Plot[]> {
    return this.plotRepository.findAll();
  }

  /**
   * Найти участок по идентификатору
   * @throws {PlotNotFoundError} если участок не найден
   */
  async findById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findById(id);
    if (!plot) throw new PlotNotFoundError(id);
    return plot;
  }

  /**
   * Создать новый участок
   *
   * @param data - Данные для создания участка
   * @returns Созданный участок
   * @throws {PlotDuplicateError} при дубликате plotNumber или cadstralNumber
   * @throws {PlotInvalidDataError} при ошибке валидации
   *
   * @spec
   * - Валидация данных через Zod-схему createPlotSchema
   * - Проверка уникальности plotNumber через repository.findByPlotNumber
   * - Проверка уникальности cadstralNumber через repository.existsByCadstralNumber (если задан)
   * - При обнаружении дубликата бросает PlotDuplicateError
   */
  async create(data: CreatePlotData): Promise<Plot> {
    // Валидация через Zod-схему
    const validatedData = createPlotSchema.parse(data);

    // Проверка уникальности plotNumber
    const existingByPlotNumber = await this.plotRepository.findByPlotNumber(
      validatedData.plotNumber
    );
    if (existingByPlotNumber) {
      throw new PlotDuplicateError('plotNumber', validatedData.plotNumber);
    }

    // Проверка уникальности cadastralNumber (если задан)
    if (validatedData.cadastralNumber) {
      const existsByCadastral = await this.plotRepository.existsByCadastralNumber(
        validatedData.cadastralNumber
      );
      if (existsByCadastral) {
        throw new PlotDuplicateError('cadastralNumber', validatedData.cadastralNumber);
      }
    }

    // Создаем объект с типом CreatePlotData, явно указывая plotNumber
    const createData: CreatePlotData = {
      plotNumber: validatedData.plotNumber,
      cadastralNumber: validatedData.cadastralNumber,
      area: validatedData.area,
      address: validatedData.address,
      note: validatedData.note,
    };

    return this.plotRepository.create(createData);
  }

  /**
   * Обновить участок
   *
   * @param id - Уникальный идентификатор участка
   * @param data - Данные для обновления
   * @returns Обновленный участок
   * @throws {PlotNotFoundError} если участок не найден
   * @throws {PlotDuplicateError} при дубликате cadastralNumber (BR-2)
   * @throws {PlotInvalidDataError} при ошибке валидации (BR-3, BR-4)
   *
   * @spec
   * - plotNumber не может быть изменён (BR-1) — поле игнорируется в данных
   * - Проверка уникальности cadastralNumber выполняется ТОЛЬКО если поле задано
   *   и отличается от текущего значения участка
   * - Валидация данных через updatePlotSchema (Zod)
   * - При обнаружении дубликата бросает PlotDuplicateError с указанием кадастрового номера
   *
   * @see docs/user-stories/US-15-plot-editing.md — BR-1 (номер неизменяем), BR-2 (уникальность кадастра)
   */
  async update(id: string, data: UpdatePlotData): Promise<Plot> {
    // Получаем существующий участок для получения текущего cadastralNumber
    const existingPlot = await this.plotRepository.findById(id);
    if (!existingPlot) {
      throw new PlotNotFoundError(id);
    }

    // Исключаем plotNumber из данных обновления (BR-1: номер неизменяем)
    const { plotNumber: _, ...updateData } = data;

    // Валидация через Zod-схему
    const validatedData = updatePlotSchema.parse(updateData);

    // Проверка уникальности cadastralNumber (только если поле задано и отличается от текущего)
    if (validatedData.cadastralNumber !== undefined && validatedData.cadastralNumber !== null) {
      if (validatedData.cadastralNumber !== existingPlot.cadastralNumber) {
  const existsByCadastral = await this.plotRepository.existsByCadastralNumberExcludingId(
    validatedData.cadastralNumber,
    id,
  );
  if (existsByCadastral) {
          throw new PlotDuplicateError('cadastralNumber', validatedData.cadastralNumber);
        }
      }
    }

    return this.plotRepository.update(id, validatedData);
  }

  /**
   * Удалить участок по идентификатору
   *
   * @param id - Уникальный идентификатор участка
   * @throws {PlotNotFoundError} если участок не найден
   *
   * @spec
   * - Проверяет существование участка перед удалением
   * - Удаление необратимо (BR-4)
   *
   * @see docs/user-stories/US-16-plot-deletion.md — BR-3, BR-4
   */
  /**
   * Поиск участков по фильтрам
   *
   * @param filters - Фильтры для поиска
   * @returns Массив найденных участков
   *
   * @spec
   * - Все фильтры опциональны и комбинируются через AND
   * - plotNumber: частичное совпадение (case-insensitive ILIKE)
   * - cadastralNumber: частичное совпадение (case-insensitive ILIKE)
   * - searchText: поиск по address, note, plotNumber (case-insensitive ILIKE)
   * - Если все фильтры пустые — возвращается пустой массив
   * - Пустые/пробельные значения фильтров игнорируются
   */
  async search(filters: PlotSearchFilters): Promise<Plot[]> {
    const { number, cadastral, note } = filters;
    const hasFilters = [number, cadastral, note].some(
      (v) => v !== undefined && v !== null && v.trim() !== ''
    );
    if (!hasFilters) {
      return [];
    }
    return this.plotRepository.search(filters);
  }

  /**
   * Удалить участок по идентификатору
   *
   * @param id - Уникальный идентификатор участка
   * @throws {PlotNotFoundError} если участок не найден
   *
   * @spec
   * - Проверяет существование участка перед удалением
   * - Удаление необратимо (BR-4)
   *
   * @see docs/user-stories/US-16-plot-deletion.md — BR-3, BR-4
   */
  async delete(id: string): Promise<void> {
    // Проверяем существование участка
    const existing = await this.plotRepository.findById(id);
    if (!existing) {
      throw new PlotNotFoundError(id);
    }

    // Выполняем удаление (BR-4: необратимо)
    await this.plotRepository.delete(id);
  }
}
