'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Хук для управления действиями над участком.
 *
 * @remarks
 * Инкапсулирует side effects: навигацию на страницу редактирования,
 * удаление участка с подтверждением.
 *
 * @param plotId - ID участка
 *
 * @public
 */
export function usePlotActions(plotId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /** Переход на страницу редактирования. */
  const handleEdit = useCallback(() => {
    router.push(`/plots/${plotId}/edit`);
  }, [router, plotId]);

  /** Удаление участка с подтверждением. */
  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить участок?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/plots/${plotId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete plot:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plotId, router]);

  return { isLoading, handleEdit, handleDelete };
}