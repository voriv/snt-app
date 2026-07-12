/**
 * @component PlotForm
 * @category features
 * @description Форма регистрации/редактирования участка СНТ
 *
 * @spec
 * - Два режима работы: 'create' и 'edit'
 * - Поля: plotNumber (обязательное), cadastralNumber (опциональное), area (обязательное, >0), address (опциональное), note (опциональное)
 * - При mode='edit': plotNumber — readonly (BR-1: номер неизменяем после создания)
 * - При mode='edit': plotNumber НЕ отправляется в PATCH-запросе (AC-2.1)
 * - Клиентская валидация: номер (1-50 символов), кадастр (regex XX:XX:XXXXXXX:XXX), площадь (>0), адрес (max 200), заметка (max 500)
 * - При отправке: POST /plots (create) или PATCH /plots/:id (edit)
 * - Блокировка кнопки отправки при isLoading, текст «Сохранение...» при mode='edit'
 * - Обработка ошибок: подсветка полей при клиентской валидации, сообщение при серверной ошибке
 * - При 409 Conflict (дубликат кадастра): поле cadastralNumber подсвечивается красным (AC-2.4)
 * - При 400 Bad Request: ошибки отображаются под соответствующими полями (AC-2.5)
 * - Кнопка «Отмена» сбрасывает форму
 * - При режиме 'edit' заполняет поля данными из plot
 *
 * @example
 * ```tsx
 * <PlotForm
 *   mode="create"
 *   onSubmit={createdPlot => router.refresh()}
 *   onCancel={() => router.back()}
 * />
 * ```
 *
 * @param mode - Режим формы: 'create' или 'edit'
 * @param plot - Объект участка (только для режима 'edit')
 * @param onSubmit - Коллбек при успешной отправке
 * @param onCancel - Коллбек при отмене формы
 * @param isLoading - Состояние загрузки отправки @default false
 *
 * @see docs/user-stories/US-15-plot-editing.md — AC-1.3 (предзаполнение), AC-2.1 (PATCH), BR-1 (номер неизменяем)
 */
'use client';

import { useState, useCallback, type ReactElement, type FormEvent, type ChangeEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Plot } from '@/domains/plot/plot.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';

/**
 * Regex для валидации кадастрового номера (BR-3)
 * @spec - Формат: XX:XX:XXXXXXX:XXX (19 символов с двоеточиями)
 */
const cadastralNumberRegex = /^\d{2}:\d{2}:\d{7}:\d{3}$/;

/**
 * @interface PlotFormData
 * @description Данные формы участка
 */
export interface PlotFormData {
  /** Номер участка */
  plotNumber: string;
  /** Кадастровый номер */
  cadastralNumber: string | null;
  /** Площадь в м² */
  area: number | '';
  /** Адрес */
  address: string | null;
  /** Примечание */
  note: string | null;
}

/**
 * @interface PlotFormErrors
 * @description Ошибки валидации полей формы
 */
export interface PlotFormErrors {
  /** Ошибка номера участка */
  plotNumber?: string;
  /** Ошибка кадастрового номера */
  cadastralNumber?: string;
  /** Ошибка площади */
  area?: string;
  /** Ошибка адреса */
  address?: string;
  /** Ошибка примечания */
  note?: string;
}

/**
 * @interface PlotFormProps
 * @description Пропсы компонента формы участка
 */
export interface PlotFormProps {
  /** Режим формы: 'create' или 'edit' @default 'create' */
  mode: 'create' | 'edit';
  /** Объект участка для редактирования (обязателен при mode='edit') */
  plot?: Plot;
  /** Коллбек при успешной отправке формы */
  onSubmit: (plot: Plot) => void;
  /** Коллбек при отмене формы */
  onCancel: () => void;
  /** Индикатор загрузки отправки @default false */
  isLoading?: boolean;
}

const INITIAL_DATA: PlotFormData = {
  plotNumber: '',
  cadastralNumber: null,
  area: '',
  address: null,
  note: null,
};

/**
 * @component PlotForm
 * @description Форма с полями для ввода/редактирования участка
 *
 * @spec
 * - Инициализирует форму значениями по умолчанию при mode='create'
 * - При mode='edit' заполняет поля данными из plot
 * - Валидация на лету при изменении полей (onChange)
 * - При ошибке API отображает сообщение об ошибке
 * - Кнопка отправки заблокирована при isLoading=true
 * - Кнопка «Отмена» вызывает onCancel и сбрасывает форму
 */
export function PlotForm({ mode, plot, onSubmit, onCancel, isLoading: isLoadingProp = false }: PlotFormProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const isActiveLoading = isLoadingProp || isLoading;

  const [formData, setFormData] = useState<PlotFormData>(() => {
    if (mode === 'edit' && plot) {
      return {
        plotNumber: plot.plotNumber,
        cadastralNumber: plot.cadastralNumber,
        area: plot.area,
        address: plot.address,
        note: plot.note,
      };
    }
    return { ...INITIAL_DATA };
  });

  const [errors, setErrors] = useState<PlotFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const newErrors: PlotFormErrors = {};

    // AC-1.3: Валидация plotNumber
    if (!formData.plotNumber.trim()) {
      newErrors.plotNumber = 'Номер участка обязателен';
    } else if (formData.plotNumber.length > 50) {
      newErrors.plotNumber = 'Номер участка не может превышать 50 символов';
    }

    // AC-1.3: Валидация cadastralNumber (BR-3)
    if (formData.cadastralNumber) {
      if (formData.cadastralNumber.length > 20) {
        newErrors.cadastralNumber = 'Кадастровый номер не может превышать 20 символов';
      } else if (!cadastralNumberRegex.test(formData.cadastralNumber)) {
        newErrors.cadastralNumber = 'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX';
      }
    }

    // AC-1.3: Валидация area
    if (formData.area === '' || isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      newErrors.area = 'Площадь должна быть больше 0';
    }

    // Валидация address
    if (formData.address && formData.address.length > 200) {
      newErrors.address = 'Адрес не может превышать 200 символов';
    }

    // Валидация note
    if (formData.note && formData.note.length > 500) {
      newErrors.note = 'Примечание не может превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (field: keyof PlotFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Убираем ошибку при изменении поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // AC-2.1: POST/PATCH запрос
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      let response: { success: boolean; data?: Plot; error?: { message: string } };

      if (mode === 'create') {
        // AC-2.1 (US-14): POST /api/v1/plots — plotNumber обязателен
        const payload = {
          plotNumber: formData.plotNumber.trim(),
          cadastralNumber: formData.cadastralNumber?.trim() || null,
          area: Number(formData.area),
          address: formData.address?.trim() || null,
          note: formData.note?.trim() || null,
        };
        response = await apiClient.post('/plots', payload);
      } else {
        // AC-2.1 (US-15): PATCH /api/v1/plots/:id — plotNumber НЕ отправляется (BR-1: неизменяем)
        if (!plot) throw new Error('Plot ID is required for edit mode');
        const payload = {
          cadastralNumber: formData.cadastralNumber?.trim() || null,
          area: Number(formData.area),
          address: formData.address?.trim() || null,
          note: formData.note?.trim() || null,
        };
        response = await apiClient.patch(`/plots/${plot.id}`, payload);
      }

      if (response.success && response.data) {
        // AC-2.3: Успешное создание/редактирование
        onSubmit(response.data);
      } else {
        const errorMessage = response.error?.message || 'Ошибка при сохранении';
        
        // AC-2.4: Обработка дубликата plotNumber
        if (errorMessage.includes('номером') && errorMessage.includes('уже существует') && !errorMessage.includes('кадастровым')) {
          setErrors({ ...errors, plotNumber: 'Участок с номером ' + formData.plotNumber + ' уже существует' });
        } 
        // AC-2.5: Обработка дубликата cadastralNumber
        else if (errorMessage.includes('кадастровым')) {
          setErrors({ ...errors, cadastralNumber: 'Участок с таким кадастровым номером уже существует' });
        } 
        // AC-2.6: Ошибка валидации
        else {
          setApiError(errorMessage);
        }
      }
    } catch (err: unknown) {
      // Обработка ошибки сети
      if (err instanceof Error) {
        setApiError(err.message || 'Произошла ошибка');
      } else {
        setApiError('Произошла ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // AC-3.1: Кнопка «Отмена»
  const handleCancel = () => {
    setFormData(mode === 'edit' && plot ? {
      plotNumber: plot.plotNumber,
      cadastralNumber: plot.cadastralNumber,
      area: plot.area,
      address: plot.address,
      note: plot.note,
    } : { ...INITIAL_DATA });
    setErrors({});
    setApiError(null);
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Новый участок' : 'Редактировать участок'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardBody>
          {/* AC-1.3 (US-15): Номер участка — readonly при mode='edit' (BR-1: неизменяем) */}
          <Input
            label="Номер участка"
            value={formData.plotNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('plotNumber', e.target.value)}
            error={errors.plotNumber}
            placeholder="Введите номер участка"
            required
            disabled={mode === 'edit'}
            readOnly={mode === 'edit'}
          />
          {/* AC-1.2: Кадастровый номер */}
          <Input
            label="Кадастровый номер"
            value={formData.cadastralNumber || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('cadastralNumber', e.target.value)}
            error={errors.cadastralNumber}
            placeholder="XX:XX:XXXXXXX:XXX"
          />
          {/* AC-1.2: Площадь */}
          <Input
            label="Площадь (м²)"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.area === '' ? '' : String(formData.area)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('area', e.target.value)}
            error={errors.area}
            placeholder="Введите площадь (м²)"
            required
          />
          {/* AC-1.2: Адрес */}
          <Input
            label="Адрес"
            value={formData.address || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('address', e.target.value)}
            error={errors.address}
            placeholder="Введите адрес"
          />
          {/* AC-1.2: Примечание */}
          <Input
            label="Примечание"
            value={formData.note || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('note', e.target.value)}
            error={errors.note}
            placeholder="Дополнительная информация"
          />
          {/* Ошибка API */}
          {apiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{apiError}</p>
            </div>
          )}
        </CardBody>
        <CardFooter>
          {/* AC-2.2: Блокировка кнопки при загрузке */}
          <Button type="submit" isLoading={isActiveLoading} disabled={isActiveLoading}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
          {/* AC-3.1: Кнопка Отмена */}
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Отмена
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
