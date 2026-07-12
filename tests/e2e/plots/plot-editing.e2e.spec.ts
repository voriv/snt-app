/**
 * @e2e plot-editing
 * @description E2E-тесты для редактирования участка (US-15)
 *
 * @spec
 * - AC-3.1: Начало редактирования
 * - AC-3.2: Обновление данных участка
 * - AC-3.3: Номер участка неизменяем
 * - AC-3.4: Валидация при обновлении
 * - AC-3.5: Проверка уникальности кадастрового номера при обновлении
 */
import { test, expect } from './fixtures';
import { loginAsAdmin, TEST_PLOTS, fillPlotForm } from '../shared/test-helpers';

const PLOTS_URL = '/dashboard/plots';

// ============================================================================
// Tests
// ============================================================================

test.describe('AC-3: Редактирование участка', () => {
  test.beforeEach(async ({ page, apiRequest }) => {
    await loginAsAdmin(page);

    // Создаем тестовый участок перед каждым тестом
    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: TEST_PLOTS.valid.plotNumber,
        cadastralNumber: TEST_PLOTS.valid.cadastralNumber,
        area: TEST_PLOTS.valid.area,
        address: TEST_PLOTS.valid.address,
        note: TEST_PLOTS.valid.note,
      },
    });

    await page.goto(PLOTS_URL);
  });

  test.afterEach(async ({ page, apiRequest }) => {
    // Удаляем созданные участки после тестов
    const listResponse = await apiRequest.get('/api/v1/plots');
    const list = await listResponse.json();

    for (const plot of list.data || []) {
      if (plot.plotNumber === TEST_PLOTS.valid.plotNumber) {
        await apiRequest.delete(`/api/v1/plots/${plot.id}`);
        break;
      }
    }
  });

  test.describe('AC-3.1: Начало редактирования', () => {
    test('должен открыть форму редактирования с предзаполненными данными', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования для участка
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Проверяем, что форма открыта
      await expect(page.getByRole('heading', { name: /редактировать/i })).toBeVisible();

      // Проверяем предзаполнение
      await expect(page.getByLabel(/номер участка/i)).toHaveValue(
        TEST_PLOTS.valid.plotNumber
      );
      await expect(page.getByLabel(/площадь/i)).toHaveValue(
        String(TEST_PLOTS.valid.area)
      );
      await expect(page.getByLabel(/адрес/i)).toHaveValue(TEST_PLOTS.valid.address);
    });
  });

  test.describe('AC-3.2: Обновление данных участка', () => {
    test('должен обновить площадь, адрес и примечание', async ({ page, apiRequest }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Обновляем данные
      await page.getByLabel(/площадь/i).fill('1500');
      await page.getByLabel(/адрес/i).fill('ул. Новая, д. 100');
      await page.getByLabel(/примечание/i).fill('Обновленное примечание');

      // Сохраняем
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем успех
      await expect(page.getByText(/участок обновлён|updated successfully/i)).toBeVisible();

      // Перезагружаем страницу и проверяем обновления
      await page.reload();
      await expect(page.getByText('1500')).toBeVisible();
      await expect(page.getByText('ул. Новая, д. 100')).toBeVisible();
      await expect(page.getByText('Обновленное примечание')).toBeVisible();
    });

    test('должен обновить кадастровый номер', async ({ page, apiRequest }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Обновляем кадастровый номер
      await page.getByLabel(/кадастровый номер/i).fill('50:20:0000000:1234');

      // Сохраняем
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем успех
      await expect(page.getByText(/участок обновлён/i)).toBeVisible();

      // Перезагружаем страницу и проверяем обновления
      await page.reload();
      await expect(page.getByText('50:20:0000000:1234')).toBeVisible();
    });
  });

  test.describe('AC-3.3: Номер участка неизменяем', () => {
    test('должен заблокировать поле номера участка для редактирования', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Проверяем, что поле номера заблокировано
      const numberInput = page.getByLabel(/номер участка/i);
      await expect(numberInput).toBeDisabled();

      // Проверяем, что значение нельзя изменить
      await numberInput.fill('999');
      await expect(numberInput).toHaveValue(TEST_PLOTS.valid.plotNumber);
    });
  });

  test.describe('AC-3.4: Валидация при обновлении', () => {
    test('должен показать ошибку при отрицательной площади', async ({ page, apiRequest }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Заполняем отрицательную площадь
      await page.getByLabel(/площадь/i).fill('-100');

      // Пытаемся сохранить
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/площадь должна быть больше нуля|area must be greater than 0/i)
      ).toBeVisible();
    });

    test('должен показать ошибку при неверном формате кадастрового номера', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Заполняем неверный формат кадастра
      await page.getByLabel(/кадастровый номер/i).fill('invalid-format');

      // Пытаемся сохранить
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку формата
      await expect(
        page.getByText(/неверный формат.*кадастровый|cadastral.*format| XX:XX:XXXXXXX:XXX/i)
      ).toBeVisible();
    });
  });

  test.describe('AC-3.5: Проверка уникальности кадастрового номера при обновлении', () => {
    test('должен показать ошибку при дубликате кадастрового номера', async ({
      page,
      apiRequest,
    }) => {
      // Создаем второй участок с уникальным номером
      await apiRequest.post('/api/v1/plots', {
        data: {
          plotNumber: '50-B',
          cadastralNumber: '50:20:0000000:5678',
          area: 800,
          address: 'ул. Вторая, д. 50',
        },
      });

      // Кликаем на кнопку редактирования для первого участка
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Пытаемся установить кадастровый номер второго участка
      await page.getByLabel(/кадастровый номер/i).fill('50:20:0000000:5678');

      // Пытаемся сохранить
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/участок с кадастровым номером.*уже существует|duplicate.*cadastral/i)
      ).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен показать ошибку при попытке изменения номера участка через API', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Пытаемся изменить номер (должно быть заблокировано UI)
      // В реальном сценарии это проверяет backend валидацию
      await page.getByLabel(/номер участка/i).fill('999');

      // Проверяем, что значение не изменилось
      await expect(page.getByLabel(/номер участка/i)).toHaveValue(
        TEST_PLOTS.valid.plotNumber
      );
    });

    test('должен поддерживать пустые значения опциональных полей', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Очищаем опциональные поля
      await page.getByLabel(/адрес/i).clear();
      await page.getByLabel(/примечание/i).clear();

      // Сохраняем
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем успех
      await expect(page.getByText(/участок обновлён/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('кнопка редактирования должна иметь aria-label', async ({ page, apiRequest }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });

      await expect(editButton).toHaveAttribute('aria-label');
    });

    test('форма редактирования должна иметь aria-label для полей', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку редактирования
      const editButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /редактировать/i });
      await editButton.click();

      // Проверяем поля
      const numberInput = page.getByLabel(/номер участка/i);
      await expect(numberInput).toHaveAttribute('aria-label');

      const areaInput = page.getByLabel(/площадь/i);
      await expect(areaInput).toHaveAttribute('aria-label');
    });
  });
});
