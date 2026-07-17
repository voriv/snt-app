import { NotFoundError, ValidationError } from '@/shared/errors';

/**
 * @error AnnouncementNotFoundError
 * @domain announcement
 * @description Ошибка, когда объявление не найдено по ID
 *
 * @description Возникает при попытке получить объявление, которое не существует в базе данных
 */
export class AnnouncementNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Announcement', id, 'ANNOUNCEMENT_NOT_FOUND');
    this.name = 'AnnouncementNotFoundError';
  }
}

/**
 * @error AnnouncementInvalidDataError
 * @domain announcement
 * @description Ошибка, когда данные объявления не проходят валидацию
 *
 * @description Возникает при попытке создать/обновить объявление с некорректными данными
 */
export class AnnouncementInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'AnnouncementInvalidDataError';
  }
}