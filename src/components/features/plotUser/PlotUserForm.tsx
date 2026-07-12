'use client';

/**
 * @component PlotUserForm
 * @category features
 * @description Форма для создания/обновления связи пользователя с участком
 * с визуальным отображением выбранных значений через карточки
 *
 * @example
 * ```tsx
 * <PlotUserForm
 *   onSubmit={handleCreate}
 *   isLoading={isSubmitting}
 * />
 * ```
 *
 * @spec
 * - FR-1: Выбор пользователя и участка через карточки с визуальными элементами
 * - FR-2: Выбор роли через стилизованный select
 * - FR-3: Опциональные поля (expiresAt, comment)
 * - FR-4: Валидация обязательных полей (userId, plotId, role)
 * - При onSubmit передаёт { userId, plotId, role, comment, expiresAt }
 * - Загружает списки пользователей и участков для выбора
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { User } from '@prisma/client';

/**
 * Данные формы PlotUser
 */
export interface PlotUserFormData {
  userId: string;
  plotId: string;
  role: 1 | 2 | 3;
  comment?: string | null;
  expiresAt?: string | null;
}

/**
 * Данные пользователя для выбора
 */
export interface UserOption {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Данные участка для выбора
 */
export interface PlotOption {
  id: string;
  plotNumber: string;
  address?: string | null;
}

/**
 * Props для PlotUserForm
 */
export interface PlotUserFormProps {
  /** Callback при успешной отправке формы */
  onSubmit: (data: PlotUserFormData) => Promise<void>;
  /** Callback при успешной отправке формы */
  onSuccess?: () => void;
  /** Callback при ошибке при сохранении */
  onError?: (error: string) => void;
  /** Показывает ли индикатор загрузки */
  isLoading?: boolean;
  /** Начальные значения формы (для редактирования) */
  initialData?: Partial<PlotUserFormData>;
  /** ID редактируемой записи (для загрузки данных) */
  editId?: string;
  /** Режим редактирования (если true, сообщение об успехе не показывается) */
  isEditing?: boolean;
  /** Текст кнопки отправки */
  submitText?: string;
  /** Callback при отмене формы */
  onCancel?: () => void;
  /** ID участка для блокировки (при создании связи с конкретного участка) */
  disabledPlotId?: string;
}

/**
 * Опции ролей для Select
 */
const ROLE_OPTIONS = [
  { value: 1, label: 'Владелец', selected: 'bg-gray-700 text-white border-gray-700 dark:bg-gray-500 dark:border-gray-500', unselected: 'bg-white border-gray-200 hover:border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-100' },
  { value: 2, label: 'Проживает', selected: 'bg-gray-700 text-white border-gray-700 dark:bg-gray-500 dark:border-gray-500', unselected: 'bg-white border-gray-200 hover:border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-100' },
  { value: 3, label: 'Представитель', selected: 'bg-gray-700 text-white border-gray-700 dark:bg-gray-500 dark:border-gray-500', unselected: 'bg-white border-gray-200 hover:border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-100' },
] as const;

/**
 * Получает инициалы из имени
 */
function getInitials(firstName?: string | null, lastName?: string | null): string {
  const parts = [lastName, firstName].filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.map(p => p?.[0] || '').join('').toUpperCase().slice(0, 2);
}

/**
 * Получает имя пользователя
 */
function getName(user: UserOption): string {
  const parts = [];
  if (user.firstName) parts.push(user.firstName);
  if (user.lastName) parts.push(user.lastName);
  return parts.length ? parts.join(" ") : "Без имени";
}

/**
 * @component
 */
export function PlotUserForm({
  onSubmit,
  onSuccess,
  onError,
  isLoading = false,
  initialData,
  editId,
  submitText = 'Создать связь',
  onCancel,
  disabledPlotId,
  isEditing = false,
}: PlotUserFormProps) {
  const [formData, setFormData] = useState<PlotUserFormData>({
    userId: initialData?.userId || '',
    plotId: initialData?.plotId || '',
    role: initialData?.role || 1,
    comment: initialData?.comment || '',
    expiresAt: initialData?.expiresAt || '',
  });

  const [users, setUsers] = useState<UserOption[]>([]);
  const [plots, setPlots] = useState<PlotOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPlotDropdown, setShowPlotDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [plotSearch, setPlotSearch] = useState('');

  // Загрузка списков пользователей и участков
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const usersResponse = await apiClient.get<UserOption[]>('/plot-users/users');
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }

        const plotsResponse = await apiClient.get<PlotOption[]>('/plots');
        if (plotsResponse.success && plotsResponse.data) {
          if (disabledPlotId) {
            const singlePlot = plotsResponse.data.filter(p => p.id === disabledPlotId);
            setPlots(singlePlot);
          } else {
            setPlots(plotsResponse.data);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки опций формы:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [disabledPlotId]);

  // Загрузка данных для редактирования
  useEffect(() => {
    const loadEditData = async () => {
      if (!editId || !initialData) return;

      try {
        const response = await apiClient.get<PlotUserFormData>(`/plot-users/${editId}`);
        if (response.success && response.data) {
          setFormData({
            userId: response.data.userId,
            plotId: response.data.plotId,
            role: response.data.role,
            comment: response.data.comment || '',
            expiresAt: response.data.expiresAt || '',
          });
        }
      } catch (err) {
        console.error('Ошибка загрузки данных для редактирования:', err);
      }
    };

    loadEditData();
  }, [editId, initialData]);

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    const fullName = `${user.lastName || ''} ${user.firstName || ''} ${user.email}`.toLowerCase();
    return fullName.includes(query);
  });

  // Фильтрация участков
  const filteredPlots = plots.filter(plot => {
    if (!plotSearch.trim()) return true;
    const query = plotSearch.toLowerCase();
    const fullInfo = `${plot.plotNumber} ${plot.address || ''}`.toLowerCase();
    return fullInfo.includes(query);
  });

  // Выбранные элементы
  const selectedUser = users.find(u => u.id === formData.userId);
  const selectedPlot = plots.find(p => p.id === formData.plotId);

  // Валидация формы
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Выберите пользователя';
    }

    if (!formData.plotId) {
      newErrors.plotId = 'Выберите участок';
    }

    if (!formData.role) {
      newErrors.role = 'Выберите роль';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setServerError(null);
      return;
    }

    setServerError(null);
    setShowSuccess(false);

    try {
      await onSubmit(
        {
          ...formData,
          comment: formData.comment || undefined,
          expiresAt: formData.expiresAt || undefined,
        }
      );

      // Показываем сообщение об успехе после успешной отправки
      setShowSuccess(true);
      onSuccess?.();

      // Автоматически скрываем сообщение через 3 секунды
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при сохранении';
      setServerError(errorMessage);
      onError?.(errorMessage);
    }
  }, [formData, onSubmit, validate, onSuccess, onError]);

  const handleUserSelect = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, userId: id }));
    setShowUserDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.userId;
      return next;
    });
  }, []);

  const handlePlotSelect = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, plotId: id }));
    setShowPlotDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.plotId;
      return next;
    });
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, role: parseInt(value) as 1 | 2 | 3 }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.role;
      return next;
    });
  }, []);

  const clearUser = useCallback(() => {
    setFormData((prev) => ({ ...prev, userId: '' }));
    setUserSearch('');
    setShowUserDropdown(true);
  }, []);

  const clearPlot = useCallback(() => {
    if (disabledPlotId && formData.plotId === disabledPlotId) {
      return;
    }
    setFormData((prev) => ({ ...prev, plotId: '' }));
    setPlotSearch('');
    setShowPlotDropdown(true);
  }, [disabledPlotId, formData.plotId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* --- Выбор пользователя --- */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Пользователь <span className="text-red-500">*</span>
        </label>

        {selectedUser ? (
          /* Отображение выбранного пользователя */
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600">
              <div className="flex items-center gap-3">
                {/* Аватар с инициалами */}
                <div className="w-12 h-12 rounded-full bg-gray-700 dark:bg-gray-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </div>
                {/* Информация */}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedUser.lastName && selectedUser.firstName
                      ? `${selectedUser.lastName} ${selectedUser.firstName}`
                      : selectedUser.email}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearUser}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Изменить"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Поиск — появляется при клике на крестик */}
            {showUserDropdown && (
              <div className="mt-2 relative z-10">
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  autoFocus
                />
                <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600">
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm dark:text-gray-400">Ничего не найдено</div>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors dark:hover:bg-gray-700 dark:border-gray-600 ${user.id === formData.userId ? 'bg-gray-100' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-500 text-white flex items-center justify-center text-xs font-bold">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {getName(user)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Нет выбранного — показываем кнопку выбора */
          <button
            type="button"
            onClick={() => setShowUserDropdown(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-left dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Выберите пользователя</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ФИО или email</div>
              </div>
            </div>
          </button>
        )}

        {/* Открытый поиск */}
        {showUserDropdown && !selectedUser && (
          <div className="mt-2 relative z-10">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              autoFocus
            />
            <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm dark:text-gray-400">Ничего не найдено</div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors dark:hover:bg-gray-700 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-500 text-white flex items-center justify-center text-xs font-bold">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {getName(user)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {errors.userId && (
          <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
        )}
      </div>

      {/* --- Выбор участка --- */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Участок <span className="text-red-500">*</span>
        </label>

        {selectedPlot ? (
          /* Отображение выбранного участка */
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600">
              <div className="flex items-center gap-3">
                {/* Иконка участка */}
                <div className="w-12 h-12 rounded-xl bg-gray-700 dark:bg-gray-500 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                {/* Информация */}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    Участок №{selectedPlot.plotNumber}
                    {selectedPlot.address && <span className="text-gray-600 dark:text-gray-400 font-normal"> — {selectedPlot.address}</span>}
                  </div>
                </div>
              </div>
              {!disabledPlotId || formData.plotId !== disabledPlotId ? (
                <button
                  type="button"
                  onClick={clearPlot}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Изменить"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          /* Нет выбранного */
          <button
            type="button"
            onClick={() => setShowPlotDropdown(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-left dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Выберите участок</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Номер или адрес</div>
              </div>
            </div>
          </button>
        )}

        {errors.plotId && (
          <p className="mt-1 text-sm text-red-600">{errors.plotId}</p>
        )}
      </div>

      {/* --- Выбор роли --- */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Роль <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.role === option.value
                ? option.selected
                : option.unselected
                }`}
            >
              <input
                type="radio"
                name="role"
                value={String(option.value)}
                checked={formData.role === option.value}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === option.value ? 'border-current' : 'border-gray-300 dark:border-gray-600'
                }`}>
                {formData.role === option.value && (
                  <div className={`w-2.5 h-2.5 rounded-full ${formData.role === option.value ? 'bg-current' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </div>

      {/* --- Дата истечения --- */}
      <div>
        <label htmlFor="expiresAt" className="block text-sm font-semibold text-gray-800 mb-2">
          ⏰ Дата истечения (опционально)
        </label>
        <input
          type="datetime-local"
          id="expiresAt"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.expiresAt || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
        />
      </div>

      {/* --- Комментарий --- */}
      <div>
        <label htmlFor="comment" className="block text-sm font-semibold text-gray-800 mb-2">
          💬 Комментарий (опционально)
        </label>
        <textarea
          id="comment"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Причина создания связи, примечание..."
          value={formData.comment || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">{(formData.comment || '').length}/500</div>
      </div>

      {/* --- Сообщение об ошибке --- */}
      {serverError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              {serverError}
            </span>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* --- Сообщение об успехе --- */}
      {!isEditing && showSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Связь успешно создана
            </span>
          </div>
        </div>
      )}

      {/* --- Кнопки --- */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" isLoading={isLoading} disabled={!formData.userId || !formData.plotId}>
          {isLoading ? 'Сохранение...' : submitText}
        </Button>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
