'use client';

/**
 * @component ParticipantBadge
 * @category features
 * @description Бейдж для отображения роли или статуса участника
 *
 * @example
 * ```tsx
 * <ParticipantBadge type="role" value={1} />
 * <ParticipantBadge type="status" value="active" />
 * ```
 *
 * @spec
 * - role: отображает метку роли (Владелец, Проживает, Представитель)
 * - status: отображает цветной бейдж (зелёный=active, жёлтый=pending, серый=expired)
 * - Использует Badge из ui/Badge
 *
 * @see US-19-2 AC-1.2 (столбцы таблицы)
 */

import { Badge } from '@/components/ui/Badge';
import {
  PlotUserRoleRoleLabel,
  PlotUserRoleStatusLabel,
  type PlotUserRoleRole,
  type PlotUserRoleStatus,
} from '@/domains/plotUser/plotUser.types';

/** Props для ParticipantBadge */
export interface ParticipantBadgeProps {
  /** Тип бейджа: role или status */
  type: 'role' | 'status';
  /** Значение роли (1, 2, 3) или статуса ('active', 'pending', 'expired') */
  value: PlotUserRoleRole | PlotUserRoleStatus;
}

/**
 * @component
 */
/**
 * @component ParticipantBadge
 * @description Отображает бейдж для роли или статуса участника
 * @param type - Тип бейджа
 * @param value - Значение
 * @returns JSX элемент
 */
export function ParticipantBadge({ type, value }: ParticipantBadgeProps) {
  if (type === 'role') {
    const roleValue = value as PlotUserRoleRole;
    const label = PlotUserRoleRoleLabel[roleValue] || 'Неизвестно';

    return <Badge>{label}</Badge>;
  }

  if (type === 'status') {
    const statusValue = value as PlotUserRoleStatus;
    const label = PlotUserRoleStatusLabel[statusValue] || 'Неизвестно';

    const variantMap: Record<PlotUserRoleStatus, 'success' | 'warning' | 'default'> = {
      active: 'success',
      pending: 'warning',
      expired: 'default',
    };

    return <Badge variant={variantMap[statusValue]}>{label}</Badge>;
  }

  return null;
}
