/**
 * @file plots/[id]/page.tsx
 * @description Страница карточки участка с возможностью редактирования
 *
 * @spec
 * - Client Component с 'use client'
 * - Принимает params: { id: string } (Next.js 15 — Promise<{id: string}>)
 * - Загружает данные участка через GET /api/v1/plots/:id
 * - Отображает PlotForm в режиме редактирования
 * - Кнопка "Добавить связь" открывает модальное окно для создания связи пользователь-участок
 * - При отсутствии участка → показывается сообщение "Участок не найден"
 * - Ошибки обрабатываются и отображаются пользователю
 *
 * @data-flow
 * - Client Component → useSession → apiClient.get('/plots/:id') → PlotForm (edit mode)
 * - Button onClick → PlotUserForm modal → apiClient POST /plot-users
 */
'use client';

import { ConfirmModal } from '@/components/ui/ConfirmModal';

import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PlotForm } from '@/components/features/plots/PlotForm';
import { PlotUserForm } from '@/components/features/plotUser/PlotUserForm';
import { ParticipantList } from '@/components/features/plotUser/ParticipantList';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Plot } from '@/domains/plot/plot.types';
import type { PlotUserRoleParticipant } from '@/domains/plotUser/plotUser.types';

/**
 * @page /dashboard/plots/[id]
 * @auth required
 * @description Страница карточки участка для просмотра и редактирования
 *
 * @spec
 * - Загружает данные участка по ID из URL-параметра
 * - Отображает PlotForm в режиме edit
 * - При ошибке 404 показывает сообщение "Участок не найден"
 * - Кнопка возврата на /dashboard/plots
 */
export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const id = params?.id;

  const [plot, setPlot] = useState<Plot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlotUserModalOpen, setIsPlotUserModalOpen] = useState(false);
const [activeTab, setActiveTab] = useState<'plot' | 'participants'>('plot');
 const [deletingParticipant, setDeletingParticipant] =
   useState<PlotUserRoleParticipant | null>(null);

  // Определяем, является ли пользователь администратором (ADMIN или SUPER_ADMIN)
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].some(role => (session?.user?.roles ?? []).includes(role));

  // Ref дляParticipantList для вызова перезагрузки данных
  const participantListRef = useRef<{ refetch: () => void }>(null);

  /**
   * Callback для повторной загрузки данных участников
   */
  const refetchParticipants = useCallback(() => {
    console.log('[PlotDetailPage] refetchParticipants called');
    participantListRef.current?.refetch();
  }, []);

  /**
   * Обработчик удаления участника
   */
 const handleDeleteParticipant = useCallback(
   async (participant: PlotUserRoleParticipant) => {
     // Открываем модальное окно подтверждения
     setDeletingParticipant(participant);
   },
   []
 );

 const handleConfirmDelete = useCallback(async () => {
   if (!deletingParticipant) return;

   try {
     setIsSubmitting(true);
     // Отправляем запрос на удаление
     await apiClient.delete(
       `/plots/${id}/participants/${deletingParticipant.id}`
     );
     // После успешного удаления загружаем список заново
     await participantListRef?.current?.refetch();
   } catch (err) {
     setError(
       err instanceof Error ? err.message : 'Произошла ошибка при удалении участника'
     );
   } finally {
     setIsSubmitting(false);
     setDeletingParticipant(null);
   }
 }, [id, deletingParticipant, participantListRef]);

 const handleCancelDelete = useCallback(() => {
   setDeletingParticipant(null);
 }, []);

  // Загрузка данных участка
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }

    if (!id) {
      setError('ID участка не указан');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPlot = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<Plot>(`/plots/${id}`);
        if (!cancelled) {
          if (response.success && response.data) {
            setPlot(response.data);
          } else if (response.error) {
            setError(response.error?.message || 'Участок не найден');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки участка');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlot();

    return () => {
      cancelled = true;
    };
  }, [session, status, router, id]);

  // Обработчик отмены редактирования
  const handleCancel = useCallback(() => {
    router.push('/dashboard/plots');
  }, [router]);

  // Обработчик сохранения изменений
  const handleSave = useCallback(
    async (data: {
      cadastralNumber: string | null;
      area: number;
      address: string | null;
      note: string | null;
    }) => {
      if (!id) return;

      try {
        setIsSubmitting(true);
        setError(null);
        const response = await apiClient.patch<Plot>(`/plots/${id}`, data);
        if (response.success && response.data) {
          setPlot(response.data);
        } else if (response.error) {
          setError(response.error?.message || 'Ошибка сохранения');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id]
  );

  // Обработчик создания связи пользователь-участок
  const handlePlotUserSave = useCallback(
    async (data: {
      userId: string;
      plotId: string;
      role: 1 | 2 | 3;
      expiresAt?: string | null;
      comment?: string | null;
    }) => {
      try {
        setIsSubmitting(true);
        const response = await apiClient.post('/plot-users', {
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          expiresAt: data.expiresAt,
          comment: data.comment,
        });

        if (response.success) {
          setIsPlotUserModalOpen(false);
          // Перезагружаем список участников
          await refetchParticipants();
        } else {
          throw new Error(response.error?.message || 'Ошибка при сохранении');
        }
      } catch (err) {
        setIsSubmitting(false);
        console.error('Failed to save plot user:', err);
        throw err;
      }
    },
    [refetchParticipants]
  );

  // Состояние загрузки
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Загрузка...</div>
      </div>
    );
  }

  // Нет сессии
  if (!session) {
    return null; // Redirect handled by useEffect
  }

  // Участок не найден
  if (!plot) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Участок</h1>
        </div>
        <EmptyState
          title="Участок не найден"
          description="Участок с таким идентификатором не существует"
        />
        <div>
          <Button variant="primary" onClick={() => router.push('/dashboard/plots')}>
            Вернуться к списку участков
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Участок</h1>
        <Button variant="secondary" onClick={handleCancel}>
          Назад к списку
        </Button>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('plot')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plot'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Информация
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'participants'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Участники
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {/* Ошибка */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Информация об участке */}
        {activeTab === 'plot' && (
          <div className="bg-white shadow rounded-lg p-6">
            <PlotForm
              mode="edit"
              plot={plot}
              onSubmit={handleSave}
              isLoading={isSubmitting}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Вкладка: Участники */}
        {activeTab === 'participants' && (
          <>
           <ParticipantList
             ref={participantListRef}
             plotId={id}
             onAddParticipant={() => setIsPlotUserModalOpen(true)}
             onEditParticipant={(participant) => {
               console.log('Редактирование участника:', participant);
             }}
             onDeleteParticipant={handleDeleteParticipant}
             isAdmin={isAdmin}
           />
           {deletingParticipant && (
             <ConfirmModal
               isOpen={true}
               onClose={handleCancelDelete}
               title="Удаление участника"
               message={`Вы уверены, что хотите удалить участника ${deletingParticipant.user?.email || 'без email'}?`}
               confirmText="Удалить"
               onConfirm={handleConfirmDelete}
             />
           )}
         </>
        )}

        {/* Модальное окно для вкладки участники */}
        {isPlotUserModalOpen && activeTab === 'participants' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Новая связь — участок №{plot.plotNumber}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsPlotUserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <PlotUserForm
                onSubmit={handlePlotUserSave}
                isLoading={isSubmitting}
                initialData={{ plotId: id, role: 1 }}
                disabledPlotId={id}
                onError={(errorMessage) => {
                  console.error('Ошибка при создании связи:', errorMessage);
                }}
                onCancel={() => setIsPlotUserModalOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
