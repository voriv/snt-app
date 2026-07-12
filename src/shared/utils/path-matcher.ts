/**
 * @function matchPath
 * @description Сопоставляет путь запроса с шаблоном, содержащим параметры `:param`
 *
 * @param pattern - Шаблон с параметрами (например `/plots/:id`)
 * @param actual - Реальный путь запроса (например `/plots/abc123`)
 * @returns `true` если пути совпадают, `false` в противном случае
 *
 * @spec
 * - `:param` соответствует любому одиночному сегменту пути (`[\\w-]+`)
 * - Количество сегментов pattern и actual должно совпадать
 * - `/plots/:id` соответствует `/plots/abc123`, но НЕ `/plots/abc123/profile`
 * - `/plots/:id` соответствует `/plots/abc-123` (дефис разрешён)
 * - Регистрозависимое сопоставление
 * - Пустые строки и пути без ведущего `/` не валидируются (вызывающий код должен гарантировать формат)
 *
 * @example
 * matchPath('/plots/:id', '/plots/abc123') // true
 * matchPath('/plots/:id', '/plots/abc123/profile') // false
 * matchPath('/plots', '/plots') // true
 * matchPath('/plots/:id', '/plots/abc') // true
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-16, BR-29
 */
export function matchPath(pattern: string, actual: string): boolean {
  const patternSegments = pattern.split('/').filter(Boolean);
  const actualSegments = actual.split('/').filter(Boolean);

  if (patternSegments.length !== actualSegments.length) {
    return false;
  }

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const actualSegment = actualSegments[i];

    // :param соответствует любому одиночному сегменту [\w-]+
    if (patternSegment.startsWith(':')) {
      if (!/^[\w-]+$/.test(actualSegment)) {
        return false;
      }
      continue;
    }

    // Литерал — точное регистрозависимое совпадение
    if (patternSegment !== actualSegment) {
      return false;
    }
  }

  return true;
}
