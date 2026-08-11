/**
 * @e2e users
 * @description E2E-тесты исправления B-013: подсветка строки таблицы (белый фон) в тёмной/зелёной теме на /dashboard/users.
 *
 * @spec
 * - B-013-AC-1: hover-фон строки таблицы в dark/green темах тёмный (var(--theme-hover-bg)), не белый
 * - B-013-AC-2: hover-фон строки таблицы в light теме светлый (#f3f4f6), без регресса
 * - B-013-AC-3: hover-фон кнопок пагинации совпадает с переменной темы
 * - B-013-AC-4: текст строки остаётся читаемым при hover (контраст с фоном)
 *
 * @see docs/tests/B-013-diagnostic-report.md
 * @see docs/plans/B-013-theme-table-fix-plan.md
 * @see docs/tests/B-013-qa-report-theme-table.md
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import { loginAsAdmin } from '../shared/test-helpers';

const USERS_URL = '/dashboard/users';

/**
 * Ожидаемые значения hover-фона по темам (из src/app/globals.css, B-013)
 */
const THEME_HOVER_EXPECT: Record<string, string> = {
  light: 'rgb(243, 244, 246)', // #f3f4f6 (gray-100)
  dark: 'rgb(55, 65, 81)', // #374151 (gray-700)
  green: 'rgb(4, 120, 87)', // #047857 (emerald-700)
};

/**
 * Ожидаемые значения фона таблицы (tbody bg-primary) по темам
 */
const THEME_BG_PRIMARY_EXPECT: Record<string, string> = {
  light: 'rgb(255, 255, 255)', // #ffffff
  dark: 'rgb(17, 24, 39)', // #111827
  green: 'rgb(6, 78, 59)', // #064e3b
};

/**
 * Установить тему напрямую через data-theme атрибут на <html> + localStorage.
 * CSS-переменные применяются мгновенно при изменении data-theme.
 */
async function setTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    window.localStorage.setItem('theme', t);
  }, theme);
}

/**
 * Получить вычисленный background-color элемента
 */
async function getBackgroundColor(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    return window.getComputedStyle(el as HTMLElement).backgroundColor;
  });
}

/**
 * Получить вычисленный color элемента
 */
async function getTextColor(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    return window.getComputedStyle(el as HTMLElement).color;
  });
}

test.describe('B-013: Подсветка строки таблицы в темах (hover)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(USERS_URL);
    // Ждём загрузки таблицы
    await page.waitForTimeout(2000);
  });

  for (const theme of ['light', 'dark', 'green'] as const) {
    test(`[${theme}] hover-фон строки таблицы соответствует --theme-hover-bg, не белый`, async ({ page }) => {
      await setTheme(page, theme);

      // Находим первую строку таблицы
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount === 0) {
        test.skip(true, 'Таблица пуста — нет строк для проверки hover');
      }

      const row = rows.first();
      await expect(row).toBeVisible();

      // До hover: фон tbody = bg-primary (var(--theme-bg-primary))
      // (строка <tr> прозрачна, фон задаёт <tbody>)
      const tbody = page.locator('tbody').first();
      const bgBefore = await getBackgroundColor(tbody);
      expect(bgBefore).toBe(THEME_BG_PRIMARY_EXPECT[theme]);

      // Наводим курсор
      await row.hover();
      await page.waitForTimeout(200); // transition-colors (150ms)

      // После hover: фон = var(--theme-hover-bg)
      const bgHover = await getBackgroundColor(row);
      expect(bgHover).toBe(THEME_HOVER_EXPECT[theme]);

      // Критично: в dark/green фон НЕ белый и НЕ #f9fafb (старый баг)
      expect(bgHover).not.toBe('rgb(255, 255, 255)');
      expect(bgHover).not.toBe('rgb(249, 250, 251)'); // #f9fafb (gray-50) — старый баг
    });
  }

  for (const theme of ['light', 'dark', 'green'] as const) {
    test(`[${theme}] текст строки читаем при hover (цвет != фон)`, async ({ page }) => {
      await setTheme(page, theme);

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      if (rowCount === 0) {
        test.skip(true, 'Таблица пуста');
      }

      const row = rows.first();
      const firstCell = row.locator('td').first();

      await row.hover();
      await page.waitForTimeout(200);

      const bgHover = await getBackgroundColor(row);
      const textHover = await getTextColor(firstCell);

      // Текст должен отличаться от фона (контраст)
      expect(textHover).not.toBe(bgHover);
    });
  }

  for (const theme of ['light', 'dark', 'green'] as const) {
    test(`[${theme}] hover-фон кнопки "Вперёд" пагинации соответствует --theme-hover-bg`, async ({ page }) => {
      await setTheme(page, theme);

      const paginationText = page.getByText(/страница \d+ из \d+/i);
      const hasPagination = await paginationText.isVisible().catch(() => false);
      if (!hasPagination) {
        test.skip(true, 'Пагинация не отображается');
      }

      const nextBtn = page.getByRole('button', { name: 'Следующая страница' });
      await expect(nextBtn).toBeVisible();

      // Проверяем, что кнопка не disabled (если на последней странице — пропускаем)
      const isDisabled = await nextBtn.isDisabled();
      if (isDisabled) {
        // Берём кнопку "Назад"
        const prevBtn = page.getByRole('button', { name: 'Предыдущая страница' });
        const prevDisabled = await prevBtn.isDisabled();
        if (prevDisabled) {
          test.skip(true, 'Обе кнопки пагинации disabled (1 страница)');
        }
        await prevBtn.hover();
        await page.waitForTimeout(200);
        const bg = await getBackgroundColor(prevBtn);
        expect(bg).toBe(THEME_HOVER_EXPECT[theme]);
        expect(bg).not.toBe('rgb(255, 255, 255)');
        expect(bg).not.toBe('rgb(249, 250, 251)');
        return;
      }

      await nextBtn.hover();
      await page.waitForTimeout(200);

      const bg = await getBackgroundColor(nextBtn);
      expect(bg).toBe(THEME_HOVER_EXPECT[theme]);
      expect(bg).not.toBe('rgb(255, 255, 255)');
      expect(bg).not.toBe('rgb(249, 250, 251)');
    });
  }

  test('[light] регресс: hover-фон строки светлый (не сломан light-тема)', async ({ page }) => {
    await setTheme(page, 'light');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(true, 'Таблица пуста');
    }

    const row = rows.first();
    await row.hover();
    await page.waitForTimeout(200);

    const bg = await getBackgroundColor(row);
    expect(bg).toBe(THEME_HOVER_EXPECT.light);
    // В light теме hover-фон серый, не белый
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });

  test('[dark] регресс: до hover фон tbody тёмный (bg-primary), не белый', async ({ page }) => {
    await setTheme(page, 'dark');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(true, 'Таблица пуста');
    }

    // Фон задаёт <tbody>, <tr> прозрачен
    const tbody = page.locator('tbody').first();
    const bg = await getBackgroundColor(tbody);
    expect(bg).toBe(THEME_BG_PRIMARY_EXPECT.dark);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });

  test('[green] регресс: до hover фон tbody тёмно-зелёный (bg-primary), не белый', async ({ page }) => {
    await setTheme(page, 'green');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(true, 'Таблица пуста');
    }

    const tbody = page.locator('tbody').first();
    const bg = await getBackgroundColor(tbody);
    expect(bg).toBe(THEME_BG_PRIMARY_EXPECT.green);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});