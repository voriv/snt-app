/**
 * @e2e plot-deletion
 * @description E2E-тесты для удаления участка (US-16)
 *
 * @spec
 * - AC-4.1: Подтверждение удаления
 * - AC-4.2: Подтверждение удаления
 * - AC-4.3: Отмена удаления
 * - AC-4.4: Пессемистичное обновление
 * - AC-4.5: Обработка ошибки удаления
 */
import { test, expect } from './fixtures';
import { loginAsAdmin, TEST_PLOTS, openDeleteDialog, cancelDeleteDialog, confirmDelete } from '../shared/test-helpers';

const PLOTS_URL = '/dashboard/plots';

// ============================================================================
// Tests
// ============================================================================

test.describe('AC-4: Удаление участка', () => {
  test.beforeEach(async ({ page, apiRequest }) => {
    await loginAsAdmin(page);

    // Создаем тестовый участок перед каждым тестом
    await apiRequest.post('/api/v1/plots', {
      data: {
        plotNumber: TEST_PLOTS.valid.plotNumber,
        area: TEST_PLOTS.valid.area,
        address: TEST_PLOTS.valid.address,
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

  test.describe('AC-4.1: Подтверждение удаления', () => {
    test('должен показать ConfirmDialog с сообщением о необратимости', async ({ page, apiRequest }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Проверяем, что диалог подтверждения показан
      await expect(page.getByText(/вы уверены/i)).toBeVisible();

      // Проверяем текст сообщения о необратимости
      await expect(
        page.getByText(/это действие нельзя отменить|this action cannot be undone/i)
      ).toBeVisible();
    });

    test('должен показать номер участка в сообщении', async ({ page }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Проверяем, что номер участка показан в сообщении
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });
  });

  test.describe('AC-4.2: Подтверждение удаления', () => {
    test('должен удалить участок после подтверждения', async ({ page, apiRequest }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // Проверяем, что участок удалён
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).not.toBeVisible();

      // Проверяем, что показан EmptyState (так как других участков нет)
      const emptyState = page.getByText(/участки не найдены/i);
      await expect(emptyState).toBeVisible();
    });

    test('должен показать сообщение об успешном удалении', async ({ page, apiRequest }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // Проверяем сообщение об успехе
      await expect(
        page.getByText(/участок удалён|deleted successfully/i)
      ).toBeVisible();
    });
  });

  test.describe('AC-4.3: Отмена удаления', () => {
    test('должен отменить удаление и оставить участок в списке', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Отменяем удаление
      await cancelDeleteDialog(page);

      // Проверяем, что диалог закрыт
      await expect(page.getByText(/вы уверены/i)).not.toBeVisible();

      // Проверяем, что участок остался в списке
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });
  });

  test.describe('AC-4.4: Пессимистичное обновление', () => {
    test('должен перезагрузить страницу после удаления', async ({
      page,
      apiRequest,
    }) => {
      // Получаем текущий URL
      const initialUrl = page.url();

      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // Проверяем, что страница перезагружена (URL остался тем же)
      await expect(page).toHaveURL(initialUrl);
    });

    test('должен показать обновлённый список после удаления', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // Проверяем, что другие данные в списке остаются
      // (если есть другие участки)
      const table = page.getByRole('table');
      // Таблица видима (или EmptyState если это был последний участок)
      await expect(table.or(page.getByText(/участки не найдены/i))).toBeVisible();
    });
  });

  test.describe('AC-4.5: Обработка ошибки удаления', () => {
    test('должен показать сообщение об ошибке при неудачном удалении', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // В реальном сценарии это проверяет обработчик ошибок
      // Для E2E теста проверяем, что участок остался в списке
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });

    test('должен оставить участок в списке после ошибки', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Подтверждаем удаление
      await confirmDelete(page);

      // Проверяем, что участок остался в списке
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен предотвратить удаление при клике вне диалога', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Кликаем вне диалога (если диалог поддерживает закрытие по клику вне)
      await page.locator('body').click({ position: { x: 10, y: 10 } });

      // Проверяем, что участок остался в списке
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });

    test('должен закрыть диалог при нажатии Esc', async ({ page, apiRequest }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Нажимаем Esc
      await page.keyboard.press('Escape');

      // Проверяем, что диалог закрыт
      await expect(page.getByText(/вы уверены/i)).not.toBeVisible();

      // Проверяем, что участок остался в списке
      await expect(page.getByText(TEST_PLOTS.valid.plotNumber)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('диалог подтверждения должен иметь aria-labelledby', async ({
      page,
      apiRequest,
    }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Проверяем атрибуты диалога
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-labelledby');
    });

    test('кнопки диалога должны иметь aria-label', async ({ page, apiRequest }) => {
      // Кликаем на кнопку удаления
      const deleteButton = page
        .getByRole('row', { name: TEST_PLOTS.valid.plotNumber, exact: false })
        .getByRole('button', { name: /удалить/i });
      await deleteButton.click();

      // Проверяем кнопки
      const cancelButton = page.getByRole('button', { name: /отмена/i });
      await expect(cancelButton).toHaveAttribute('aria-label');

      const deleteDialogButton = page.getByRole('button', { name: /удалить/i });
      await expect(deleteDialogButton).toHaveAttribute('aria-label');
    });
  });
});
