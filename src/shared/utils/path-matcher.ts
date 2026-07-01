/**
 * @function matchPath
 * @description Сопоставляет путь запроса с шаблоном, содержащим параметры `:param`
 *
 * @param pattern - Шаблон с параметрами (например `/members/:id`)
 * @param actual - Реальный путь запроса (например `/members/abc123`)
 * @returns `true` если пути совпадают, `false` в противном случае
 *
 * @spec
 * - `:param` соответствует любому одиночному сегменту пути (`[\\w-]+`)
 * - Количество сегментов pattern и actual должно совпадать
 * - `/members/:id` соответствует `/members/abc123`, но НЕ `/members/abc123/profile`
 * - `/members/:id` соответствует `/members/abc-123` (дефис разрешён)
 * - Регистрозависимое сопоставление
 * - Пустые строки и пути без ведущего `/` не валидируются (вызывающий код должен гарантировать формат)
 *
 * @example
 * matchPath('/members/:id', '/members/abc123') // true
 * matchPath('/members/:id', '/members/abc123/profile') // false
 * matchPath('/members', '/members') // true
 * matchPath('/members/:id/posts/:postId', '/members/abc/posts/xyz') // true
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
