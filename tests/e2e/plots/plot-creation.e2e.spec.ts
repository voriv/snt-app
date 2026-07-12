/**
 * @e2e plot-creation
 * @description E2E-тесты для создания участка (US-14)
 *
 * @spec
 * - AC-2.1: Создание участка с минимальными данными
 * - AC-2.2: Валидация дубликата номера участка
 * - AC-2.3: Валидация дубликата кадастрового номера
 * - AC-2.4: Валидация формата кадастрового номера
 * - AC-2.5: Валидация обязательных полей
 */
import { test, expect } from './fixtures';
import { loginAsAdmin, TEST_PLOTS, fillPlotForm } from '../shared/test-helpers';

const PLOTS_URL = '/dashboard/plots';

// ============================================================================
// Tests
// ============================================================================

test.describe('AC-2: Создание участка', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(PLOTS_URL);
  });

  test.describe('AC-2.1: Создание участка с минимальными данными', () => {
    test('должен создать участок с номером и площадью', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать|new plot/i });
      await createButton.click();

      // Заполняем обязательные поля
      await page.getByLabel(/номер участка/i).fill('50');
      await page.getByLabel(/площадь/i).fill('1000');

      // Сохраняем
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем успех
      await expect(page.getByText(/участок успешно создан|created/i)).toBeVisible();
      await expect(page.getByText('50')).toBeVisible();
    });
  });

  test.describe('AC-2.2: Валидация дубликата номера участка', () => {
    test('должен показать ошибку при дубликате номера участка', async ({
      page,
      apiRequest,
    }) => {
      // Создаем участок через API
      await apiRequest.post('/api/v1/plots', {
        data: {
          plotNumber: TEST_PLOTS.duplicate.plotNumber,
          area: TEST_PLOTS.duplicate.area,
        },
      });

      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Пытаемся создать дубликат
      await page.getByLabel(/номер участка/i).fill(TEST_PLOTS.duplicate.plotNumber);
      await page.getByLabel(/площадь/i).fill('600');

      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/участок с номером.*уже существует|duplicate.*plot number/i)
      ).toBeVisible();
    });
  });

  test.describe('AC-2.3: Валидация дубликата кадастрового номера', () => {
    test('должен показать ошибку при дубликате кадастрового номера', async ({
      page,
      apiRequest,
    }) => {
      // Создаем участок через API с кадастровым номером
      await apiRequest.post('/api/v1/plots', {
        data: {
          plotNumber: '42-A',
          cadastralNumber: TEST_PLOTS.valid.cadastralNumber,
          area: TEST_PLOTS.valid.area,
        },
      });

      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Пытаемся создать участок с таким же кадастровым номером
      await page.getByLabel(/номер участка/i).fill('50-B');
      await page.getByLabel(/кадастровый номер/i).fill(TEST_PLOTS.valid.cadastralNumber);
      await page.getByLabel(/площадь/i).fill('600');

      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/участок с кадастровым номером.*уже существует|duplicate.*cadastral/i)
      ).toBeVisible();
    });
  });

  test.describe('AC-2.4: Валидация формата кадастрового номера', () => {
    test('должен показать ошибку при неверном формате кадастрового номера', async ({
      page,
    }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Заполняем данные с неверным форматом кадастра
      await page.getByLabel(/номер участка/i).fill('50');
      await page.getByLabel(/кадастровый номер/i).fill(TEST_PLOTS.invalidCadastral.cadastralNumber);
      await page.getByLabel(/площадь/i).fill('600');

      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку формата
      await expect(
        page.getByText(/неверный формат.*кадастровый|cadastral.*format| XX:XX:XXXXXXX:XXX/i)
      ).toBeVisible();
    });
  });

  test.describe('AC-2.5: Валидация обязательных полей', () => {
    test('должен показать ошибку при отсутствии номера участка', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Заполняем только площадь
      await page.getByLabel(/площадь/i).fill('600');

      // Отправляем форму без номера
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/номер участка обязателен|plot number is required/i)
      ).toBeVisible();
    });

    test('должен показать ошибку при отсутствии площади', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Заполняем только номер
      await page.getByLabel(/номер участка/i).fill('50');

      // Отправляем форму без площади
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/площадь обязательна|area is required/i)
      ).toBeVisible();
    });

    test('должен показать ошибку при отсутствии всех данных', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Отправляем пустую форму
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибки
      await expect(
        page.getByText(/номер участка обязателен/i)
      ).toBeVisible();
      await expect(
        page.getByText(/площадь обязательна/i)
      ).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен поддерживать создание участка с минимальными данными (только обязательные поля)', async ({
      page,
    }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Заполняем только обязательные поля
      await page.getByLabel(/номер участка/i).fill('50');
      await page.getByLabel(/площадь/i).fill('600');

      // Остальные поля оставляем пустыми
      await page.getByLabel(/кадастровый номер/i).clear();
      await page.getByLabel(/адрес/i).clear();
      await page.getByLabel(/примечание/i).clear();

      // Сохраняем
      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем успех
      await expect(page.getByText(/участок успешно создан/i)).toBeVisible();
      await expect(page.getByText('50')).toBeVisible();
    });

    test('должен поддерживать отрицательные значения площади', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Заполняем данные с отрицательной площадью
      await page.getByLabel(/номер участка/i).fill('50');
      await page.getByLabel(/площадь/i).fill('-100');

      const saveButton = page.getByRole('button', { name: /сохранить/i });
      await saveButton.click();

      // Проверяем ошибку
      await expect(
        page.getByText(/площадь должна быть больше нуля/i)
      ).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('все поля формы должны иметь aria-label', async ({ page }) => {
      // Открываем форму создания
      const createButton = page.getByRole('button', { name: /добавить|создать/i });
      await createButton.click();

      // Проверяем поля
      const numberInput = page.getByLabel(/номер участка/i);
      await expect(numberInput).toHaveAttribute('aria-label');

      const cadastralInput = page.getByLabel(/кадастровый номер/i);
      await expect(cadastralInput).toHaveAttribute('aria-label');

      const areaInput = page.getByLabel(/площадь/i);
      await expect(areaInput).toHaveAttribute('aria-label');

      const addressInput = page.getByLabel(/адрес/i);
      await expect(addressInput).toHaveAttribute('aria-label');

      const noteInput = page.getByLabel(/примечание/i);
      await expect(noteInput).toHaveAttribute('aria-label');
    });
  });
});
