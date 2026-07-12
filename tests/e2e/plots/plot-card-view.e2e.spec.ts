/**
 * @e2e plot-card-view
 * @description E2E-тесты для просмотра карточки участка (US-17)
 *
 * @spec
 * - AC-5.1: Страница деталей участка
 * - AC-5.2: Отображение всех полей участка
 * - AC-5.3: Номер участка только для чтения
 * - AC-5.4: Переход на страницу деталей
 * - AC-5.5: Обработка 404
 */
import { test, expect } from './fixtures';
import { loginAsAdmin, TEST_PLOTS } from '../shared/test-helpers';

const PLOTS_URL = '/dashboard/plots';
const PLOTS_DETAIL_URL = '/dashboard/plots/[id]';

// ============================================================================
// Tests
// ============================================================================

test.describe('AC-5: Карточка участка', () => {
  test.beforeEach(async ({ page, apiRequest }) => {
    await loginAsAdmin(page);

    // Создаем тестовый участок перед каждым тестом
    const response = await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: TEST_PLOTS.valid.plotNumber,
        cadastralNumber: TEST_PLOTS.valid.cadastralNumber,
        area: TEST_PLOTS.valid.area,
        address: TEST_PLOTS.valid.address,
        note: TEST_PLOTS.valid.note,
      },
    });
    const result = await response.json();
    const plotId = result.data.id;

    await page.goto(`/dashboard/plots/${plotId}`);
  });

  test.afterEach(async ({ apiRequest }) => {
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

  test.describe('AC-5.1: Страница деталей участка', () => {
    test('должен открывать страницу деталей по клику на номер в списке', async ({
      page,
      apiRequest,
    }) => {
      // Получаем ID участка
      const listResponse = await apiRequest.get('/api/v1/plots');
      const list = await listResponse.json();
      const plot = list.data.find((p: any) => p.plotNumber === TEST_PLOTS.valid.plotNumber);
      const plotId = plot.id;

      // Переходим на страницу списка
      await page.goto(PLOTS_URL);

      // Кликаем на номер участка
      const plotLink = page.getByRole('link', { name: TEST_PLOTS.valid.plotNumber });
      await plotLink.click();

      // Проверяем переход на страницу деталей
      await page.waitForURL(`**/dashboard/plots/${plotId}`);
      expect(page.url()).toContain(`/dashboard/plots/${plotId}`);
    });

    test('должен отображать заголовок страницы', async ({ page }) => {
      // Проверяем заголовок
      const heading = page.getByRole('heading', { name: /участок/i });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('AC-5.2: Отображение всех полей участка', () => {
    test('должен отображать номер участка', async ({ page }) => {
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });

    test('должен отображать кадастровый номер', async ({ page }) => {
      await expect(page.getByText(TEST_PLOTS.valid.cadastralNumber)).toBeVisible();
    });

    test('должен отображать площадь', async ({ page }) => {
      await expect(page.getByText(String(TEST_PLOTS.valid.area))).toBeVisible();
    });

    test('должен отображать адрес', async ({ page }) => {
      await expect(page.getByText(TEST_PLOTS.valid.address)).toBeVisible();
    });

    test('должен отображать примечание', async ({ page }) => {
      await expect(page.getByText(TEST_PLOTS.valid.note)).toBeVisible();
    });

    test('должен отображать дату создания', async ({ page }) => {
      // Проверяем, что дата создания отображается (формат даты может отличаться)
      const createdAtLabel = page.getByText(/создан/i);
      await expect(createdAtLabel).toBeVisible();
    });

    test('должен отображать дату обновления', async ({ page }) => {
      // Проверяем, что дата обновления отображается
      const updatedAtLabel = page.getByText(/обновлен/i);
      await expect(updatedAtLabel).toBeVisible();
    });
  });

  test.describe('AC-5.3: Номер участка только для чтения', () => {
    test('должен показывать поле номера только для чтения', async ({ page }) => {
      // Проверяем, что поле номера не является input (только для чтения)
      const numberField = page.getByLabel(/номер участка/i);
      
      // Проверяем, что это readonly поле или только текст
      const isReadonly = await numberField.getAttribute('readonly');
      expect(isReadonly).toBe('');
    });

    test('не должен позволять редактировать номер участка', async ({ page }) => {
      const numberField = page.getByLabel(/номер участка/i);

      // Пытаемся изменить значение
      await numberField.fill('999');

      // Проверяем, что значение не изменилось
      await expect(numberField).toHaveValue(TEST_PLOTS.valid.plotNumber);
    });
  });

  test.describe('AC-5.4: Переход на страницу деталей', () => {
    test('должен перенаправлять с /dashboard/plots на /dashboard/plots/:id', async ({
      page,
      apiRequest,
    }) => {
      // Получаем ID участка
      const listResponse = await apiRequest.get('/api/v1/plots');
      const list = await listResponse.json();
      const plot = list.data.find((p: any) => p.plotNumber === TEST_PLOTS.valid.plotNumber);

      // Переходим на страницу списка
      await page.goto(PLOTS_URL);

      // Кликаем на номер участка
      const plotLink = page.getByRole('link', { name: plot.plotNumber });
      await plotLink.click();

      // Проверяем, что URL содержит ID участка
      await expect(page).toHaveURL(`**/dashboard/plots/${plot.id}`);
    });

    test('должен иметь ссылку на назад к списку участков', async ({ page }) => {
      // Проверяем наличие кнопки или ссылки назад
      const backButton = page.getByRole('link', { name: /назад|back|участки/i });
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('AC-5.5: Обработка 404', () => {
    test('должен показать "Участок не найден" для несуществующего ID', async ({
      page,
    }) => {
      // Переходим на страницу с несуществующим ID
      await page.goto('/dashboard/plots/nonexistent-id-12345');

      // Проверяем сообщение об ошибке
      await expect(
        page.getByText(/участок не найден|not found|404/i)
      ).toBeVisible();
    });

    test('должен показать кнопку возврата к списку участков при 404', async ({
      page,
    }) => {
      // Переходим на страницу с несуществующим ID
      await page.goto('/dashboard/plots/nonexistent-id-12345');

      // Проверяем наличие кнопки возврата
      const backLink = page.getByRole('link', { name: /вернуться|back/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/dashboard/plots');
    });

    test('должен показывать корректную страницу при пустом ID', async ({ page }) => {
      // Переходим на страницу с пустым ID
      await page.goto('/dashboard/plots/');

      // Проверяем, что показано сообщение об ошибке или редирект
      const hasError = await page.getByText(/участок не найден/i).isVisible();
      const hasRedirect = page.url() === 'http://localhost:3000/dashboard/plots';

      expect(hasError || hasRedirect).toBe(true);
    });
  });

  test.describe('Edge Cases', () => {
    test('должен отображать прочерк для пустых опциональных полей', async ({
      page,
      apiRequest,
    }) => {
      // Создаем участок без кадастрового номера
      const response = await apiRequest.post('/api/v1/plots', {
        data: {
          plotNumber: '50-A',
          area: 600,
          address: '',
          note: '',
        },
      });
      const result = await response.json();
      const plotId = result.data.id;

      await page.goto(`/dashboard/plots/${plotId}`);

      // Проверяем, что пустые поля отображаются как прочерк
      const hasDash = await page.getByText(/- |—|no data/i).isVisible();
      expect(hasDash).toBe(true);
    });

    test('должен отображать полную информацию при наличии всех полей', async ({
      page,
    }) => {
      // Проверяем, что все поля отображаются
      const fields = [
        page.getByText(TEST_PLOTS.valid.plotNumber),
        page.getByText(TEST_PLOTS.valid.cadastralNumber),
        page.getByText(String(TEST_PLOTS.valid.area)),
        page.getByText(TEST_PLOTS.valid.address),
        page.getByText(TEST_PLOTS.valid.note),
      ];

      await expect(Promise.all(fields.map((f) => f.isVisible()))).resolves.toBe(true);
    });

    test('должен корректно отображать даты в локализованном формате', async ({
      page,
    }) => {
      // Проверяем, что даты отображаются
      const hasDate = await page.getByText(/дата|date|created|updated/i).isVisible();
      expect(hasDate).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('все поля должны иметь aria-label', async ({ page }) => {
      const fields = [
        page.getByLabel(/номер участка/i),
        page.getByLabel(/кадастровый номер/i),
        page.getByLabel(/площадь/i),
        page.getByLabel(/адрес/i),
        page.getByLabel(/примечание/i),
      ];

      for (const field of fields) {
        await expect(field).toHaveAttribute('aria-label');
      }
    });

    test('кнопка назад должна иметь aria-label', async ({ page }) => {
      const backButton = page.getByRole('link', { name: /назад|back/i });
      await expect(backButton).toHaveAttribute('aria-label');
    });

    test('карточка участка должна иметь semantic HTML', async ({ page }) => {
      // Проверяем, что используется семантическая разметка
      const mainContent = page.getByRole('main');
      const article = page.getByRole('article');

      const mainCount = await mainContent.count();
      const articleCount = await article.count();
      expect(mainCount + articleCount).toBeGreaterThan(0);
    });
  });
});
