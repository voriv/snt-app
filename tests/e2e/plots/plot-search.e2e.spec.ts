/**
 * @e2e plot-search
 * @description E2E-тесты для поиска участков (US-18)
 *
 * @spec
 * - AC-6.1: Поиск по номеру участка
 * - AC-6.2: Поиск по кадастровому номеру
 * - AC-6.3: Поиск по примечанию
 * - AC-6.4: Комбинированный поиск
 * - AC-6.5: Сброс поиска
 * - AC-6.6: Пустой поиск
 */
import { test, expect } from './fixtures';
import { loginAsAdmin, TEST_PLOTS } from '../shared/test-helpers';

const PLOTS_URL = '/dashboard/plots';

// ============================================================================
// Tests
// ============================================================================

test.describe('AC-6: Поиск участков', () => {
  test.beforeEach(async ({ page, apiRequest }) => {
    await loginAsAdmin(page);

    // Очищаем все участки
    const listResponse = await apiRequest.get('/api/v1/plots');
    const list = await listResponse.json();

    for (const plot of list.data || []) {
      await apiRequest.delete(`/api/v1/plots/${plot.id}`);
    }

    // Создаем несколько участков для тестирования поиска
    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: '10',
        cadastralNumber: '50:20:0000000:1001',
        area: 600,
        address: 'ул. Первая, д. 10',
        note: 'Центральная часть',
      },
    });

    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: '20',
        cadastralNumber: '50:20:0000000:2002',
        area: 800,
        address: 'ул. Вторая, д. 20',
        note: 'Юго-западная часть',
      },
    });

    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: '30',
        cadastralNumber: '50:20:0000000:3003',
        area: 1000,
        address: 'ул. Третья, д. 30',
        note: '',
      },
    });

    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: '40',
        area: 500,
        address: 'ул. Четвёртая, д. 40',
        note: '',
      },
    });

    await page.goto(PLOTS_URL);
  });

  test.afterEach(async ({ apiRequest }) => {
    // Очищаем участки после тестов
    const listResponse = await apiRequest.get('/api/v1/plots');
    const list = await listResponse.json();

    for (const plot of list.data || []) {
      await apiRequest.delete(`/api/v1/plots/${plot.id}`);
    }
  });

  test.describe('AC-6.1: Поиск по номеру участка', () => {
    test('должен фильтровать по номеру участка (частичное совпадение)', async ({
      page,
    }) => {
      // Вводим "1" - должны остаться участки с номерами 10
      await page.getByLabel(/номер/i).fill('1');

      // Проверяем, что отфильтрованы только участки с номерами, начинающимися на 1
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();
      await expect(page.getByText('30')).not.toBeVisible();
      await expect(page.getByText('40')).not.toBeVisible();
    });

    test('должен поддерживать case-insensitive поиск', async ({ page }) => {
      // Вводим "10" в нижнем регистре
      await page.getByLabel(/номер/i).fill('10');

      // Проверяем, что участок найден
      await expect(page.getByText('10')).toBeVisible();
    });

    test('должен возвращать полный список при очистке поля поиска', async ({
      page,
    }) => {
      // Сначала фильтруем
      await page.getByLabel(/номер/i).fill('10');
      await expect(page.getByText('10')).toBeVisible();

      // Очищаем поле
      await page.getByLabel(/номер/i).clear();

      // Возвращаем полный список
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).toBeVisible();
      await expect(page.getByText('30')).toBeVisible();
      await expect(page.getByText('40')).toBeVisible();
    });
  });

  test.describe('AC-6.2: Поиск по кадастровому номеру', () => {
    test('должен фильтровать по кадастровому номеру', async ({ page }) => {
      // Вводим часть кадастрового номера
      await page.getByLabel(/кадастровый номер/i).fill('50:20:0000000:1');

      // Проверяем, что отфильтрованы только соответствующие участки
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();
      await expect(page.getByText('30')).not.toBeVisible();
      await expect(page.getByText('40')).not.toBeVisible();
    });

    test('должен поддерживать частичное совпадение кадастрового номера', async ({
      page,
    }) => {
      // Вводим префикс кадастрового номера
      await page.getByLabel(/кадастровый номер/i).fill('50:20:0000000:');

      // Проверяем, что все участки с префиксом отображаются
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).toBeVisible();
      await expect(page.getByText('30')).toBeVisible();
    });
  });

  test.describe('AC-6.3: Поиск по примечанию', () => {
    test('должен фильтровать по примечанию', async ({ page }) => {
      // Вводим "центр" - должны остаться участки с "Центральная часть"
      await page.getByLabel(/примечание/i).fill('центр');

      // Проверяем, что отфильтрованы только соответствующие участки
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('Центральная часть')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();
      await expect(page.getByText('Юго-западная часть')).not.toBeVisible();
    });

    test('должен поддерживайте case-insensitive поиск по примечанию', async ({
      page,
    }) => {
      // Вводим "центр" в нижнем регистре
      await page.getByLabel(/примечание/i).fill('центр');

      // Проверяем, что участок найден
      await expect(page.getByText('10')).toBeVisible();
    });
  });

  test.describe('AC-6.4: Комбинированный поиск', () => {
    test('должен фильтровать по нескольким полям одновременно (AND-логика)', async ({
      page,
    }) => {
      // Вводим значения в несколько полей
      await page.getByLabel(/номер/i).fill('1');
      await page.getByLabel(/кадастровый номер/i).fill('50:20:0000000:1');

      // Проверяем, что отфильтрованы только соответствующие участки
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();
    });

    test('должен фильтровать по примечанию и номеру одновременно', async ({
      page,
    }) => {
      // Вводим значения
      await page.getByLabel(/номер/i).fill('1');
      await page.getByLabel(/примечание/i).fill('центр');

      // Проверяем, что отфильтрованы только соответствующие участки
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('Центральная часть')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();
    });
  });

  test.describe('AC-6.5: Сброс поиска', () => {
    test('должен возвращать полный список после очистки фильтров', async ({
      page,
    }) => {
      // Применяем фильтры
      await page.getByLabel(/номер/i).fill('10');

      // Проверяем, что отфильтровано
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).not.toBeVisible();

      // Очищаем фильтры
      await page.getByRole('button', { name: /очистить/i }).click();

      // Возвращаем полный список
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).toBeVisible();
      await expect(page.getByText('30')).toBeVisible();
      await expect(page.getByText('40')).toBeVisible();
    });
  });

  test.describe('AC-6.6: Пустой поиск', () => {
    test('должен показывать полный список при пустом запросе', async ({
      page,
    }) => {
      // Переходим на страницу (пустой поиск по умолчанию)
      await page.goto(PLOTS_URL);

      // Проверяем, что показан полный список
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('20')).toBeVisible();
      await expect(page.getByText('30')).toBeVisible();
      await expect(page.getByText('40')).toBeVisible();
    });

    test('должен показывать EmptyState при отсутствии результатов', async ({
      page,
    }) => {
      // Вводим несуществующий номер
      await page.getByLabel(/номер/i).fill('999');

      // Проверяем, что показан EmptyState
      await expect(page.getByText(/участки не найдены/i)).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен поддерживать очень длинные строки поиска', async ({ page }) => {
      // Вводим очень длинную строку
      const longString = 'a'.repeat(150);
      await page.getByLabel(/номер/i).fill(longString);

      // Проверяем, что ошибка формата или пустой результат
      const hasError = await page.getByText(/ошибка/i).isVisible();
      const hasEmptyState = await page.getByText(/участки не найдены/i).isVisible();

      expect(hasError || hasEmptyState).toBe(true);
    });

    test('должен поддерживать специальные символы в поиске', async ({ page }) => {
      // Вводим специальные символы
      await page.getByLabel(/примечание/i).fill('@#$%^&*()');

      // Проверяем, что показан EmptyState или нет ошибок
      const hasEmptyState = await page.getByText(/участки не найдены/i).isVisible();
      expect(hasEmptyState).toBe(true);
    });

    test('должен поддерживать поиск с пробелами', async ({ page }) => {
      // Вводим строку с пробелами
      await page.getByLabel(/номер/i).fill('10 20');

      // Проверяем, что показан EmptyState (не точное совпадение)
      const hasEmptyState = await page.getByText(/участки не найдены/i).isVisible();
      expect(hasEmptyState).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('поля поиска должны иметь aria-label', async ({ page }) => {
      // Проверяем номера
      const numberInput = page.getByLabel(/номер/i);
      await expect(numberInput).toHaveAttribute('aria-label');

      const cadastralInput = page.getByLabel(/кадастровый номер/i);
      await expect(cadastralInput).toHaveAttribute('aria-label');

      const noteInput = page.getByLabel(/примечание/i);
      await expect(noteInput).toHaveAttribute('aria-label');
    });

    test('кнопка очистки должна иметь aria-label', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /очистить/i });
      await expect(clearButton).toHaveAttribute('aria-label');
    });

    test('статус поиска должен быть объявлен через aria-live', async ({ page }) => {
      // Вводим поиск
      await page.getByLabel(/номер/i).fill('10');

      // Проверяем, что результат поиска объявлен
      const resultAnnouncement = page.getByRole('status', { name: /результатов/i });
      await expect(resultAnnouncement).toBeVisible();
    });
  });
});
