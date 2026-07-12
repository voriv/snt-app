/**
 * @component ConnectionBadge
 * @category features
 * @description Бейдж статуса или роли связи пользователя с участком
 *
 * @example
 * ```tsx
 * <ConnectionBadge type="status" value="active" />
 * <ConnectionBadge type="role" value={1} />
 * ```
 *
 * @spec
 * - type=status: active (зелёный), pending (жёлтый), expired (серый)
 * - type=role: owner, resident, representative — текстовые метки
 * - Использует ui/Badge
 *
 * @see US-19-3 AC-1.2 (бейдж статуса)
 */
'use client';

import { Badge } from '@/components/ui/Badge';
import type { PlotUserRoleRole, PlotUserRoleStatus } from '@/domains/plotUser/plotUser.types';
import { PlotUserRoleRoleLabel, PlotUserRoleStatusLabel } from '@/domains/plotUser/plotUser.types';

export interface ConnectionBadgeProps {
  type: 'status' | 'role';
  value: PlotUserRoleStatus | PlotUserRoleRole;
}

/**
 * Возвращает стиль бейджа в зависимости от типа и значения
 */
function getBadgeProps(type: 'status' | 'role', value: PlotUserRoleStatus | PlotUserRoleRole): {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  label: string;
} {
  if (type === 'status') {
    const statusVariantMap: Record<PlotUserRoleStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      active: 'success',
      pending: 'warning',
      expired: 'default',
    };
    return {
      variant: statusVariantMap[value as PlotUserRoleStatus],
      label: PlotUserRoleStatusLabel[value as PlotUserRoleStatus],
    };
  }

  return {
    variant: 'info',
    label: PlotUserRoleRoleLabel[value as PlotUserRoleRole],
  };
}

export function ConnectionBadge({ type, value }: ConnectionBadgeProps) {
  const { variant, label } = getBadgeProps(type, value);
  return <Badge variant={variant}>{label}</Badge>;
}
