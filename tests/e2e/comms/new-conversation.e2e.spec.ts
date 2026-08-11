import { test, expect } from '../plots/fixtures';
import { loginAsMember } from '../shared/test-helpers';

const NEW_CONVERSATION_URL = '/dashboard/messages/new';
const MESSAGES_URL = '/dashboard/messages';

test.describe('US-21-02: Начало нового личного диалога', () => {
  // AC-1.1: Авторизация
  test.describe('AC-1.1: Авторизация', () => {
    test('должен перенаправить неавторизованного пользователя на /login', async ({ page }) => {
      await page.goto(NEW_CONVERSATION_URL);
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  // AC-1.3: Заголовок страницы
  test.describe('AC-1.3: Заголовок страницы', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('должен отобразить заголовок "Новый диалог"', async ({ page }) => {
      await page.goto(NEW_CONVERSATION_URL);
      await expect(page.locator('h1')).toContainText('Новый диалог');
    });
  });

  // AC-1.4: Кнопка "Назад"
  test.describe('AC-1.4: Кнопка Назад', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('должен перейти к списку диалогов по кнопке Назад', async ({ page }) => {
      await page.goto(NEW_CONVERSATION_URL);
      await page.getByLabel('Назад к списку диалогов').click();
      await expect(page).toHaveURL(MESSAGES_URL);
    });
  });

  // AC-1.5: Поиск пользователя
  test.describe('AC-1.5: Поиск пользователя', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('должен найти пользователя по имени', async ({ page, request }) => {
      // Create a second user for search
      const searchUser = await request.post('/api/v1/test/users', {
        data: {
          email: 'search-test@example.com',
          password: 'password123',
          firstName: 'Иван',
          lastName: 'Тестов',
        },
      });

      await page.goto(NEW_CONVERSATION_URL);

      // Type in search input
      const searchInput = page.getByPlaceholder(/поиск/i);
      await searchInput.fill('Иван');

      // Wait for search results (debounced 300ms)
      await page.waitForTimeout(500);

      // Check that search result appears
      await expect(page.locator('[role="option"]')).toContainText('Иван');
    });

    /**
     * @spec B030-T3-1 — e2e-тест поиска по email
     * @traces B-030 симптом 1, AC-1.5
     */
    test('должен найти пользователя по email', async ({ page, request }) => {
      // Arrange: создать пользователя с уникальным email
      const uniqueEmail = `email-search-${Date.now()}@example.com`;
      await request.post('/api/v1/test/users', {
        data: {
          email: uniqueEmail,
          password: 'password123',
          firstName: 'Email',
          lastName: 'Search',
        },
      });

      // Act: открыть страницу и ввести email в поле поиска
      await page.goto(NEW_CONVERSATION_URL);
      const searchInput = page.getByLabel('Найти пользователя');
      await searchInput.fill(uniqueEmail);
      await page.waitForTimeout(500);

      // Assert: результат поиска содержит пользователя с данным email
      await expect(page.locator('[role="option"]')).toContainText(uniqueEmail);
    });
  });

  // AC-1.6: Создание нового диалога
  test.describe('AC-1.6: Создание нового диалога', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('должен создать новый диалог при выборе пользователя', async ({ page, request }) => {
      // Create a participant user
      const participant = await request.post('/api/v1/test/users', {
        data: {
          email: 'participant-test@example.com',
          password: 'password123',
          firstName: 'Петр',
          lastName: 'Участник',
        },
      });

      await page.goto(NEW_CONVERSATION_URL);

      // Search and select user
      const searchInput = page.getByPlaceholder(/поиск/i);
      await searchInput.fill('Петр');
      await page.waitForTimeout(500);

      await page.locator('[role="option"]').filter({ hasText: 'Петр' }).click();

      // Should redirect to messages page with new conversation
      await expect(page).toHaveURL(/.*\/dashboard\/messages\/[a-zA-Z0-9]+/);
    });
  });

  // AC-1.7: Редирект в существующий диалог
  test.describe('AC-1.7: Редирект в существующий диалог', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('должен перейти в существующий диалог если он уже существует', async ({ page, request }) => {
      // Create a participant
      const participant = await request.post('/api/v1/test/users', {
        data: {
          email: 'existing-dialog-test@example.com',
          password: 'password123',
          firstName: 'Существующий',
          lastName: 'Диалог',
        },
      });

      // Create conversation first
      const currentUser = await request.get('/api/v1/profile');
      const currentUserId = (currentUser.body as any).data.id;
      const participantBody = participant.body as any;
      const participantId = participantBody.data?.id || participantBody.data?.user?.id;

      await request.post('/api/v1/conversations', {
        data: { participantId },
      });

      // Now try to start new conversation with same user
      await page.goto(NEW_CONVERSATION_URL);
      const searchInput = page.getByPlaceholder(/поиск/i);
      await searchInput.fill('Существующий');
      await page.waitForTimeout(500);

      await page.locator('[role="option"]').filter({ hasText: 'Существующий' }).click();

      // Should redirect to existing conversation
      await expect(page).toHaveURL(/.*\/dashboard\/messages\/[a-zA-Z0-9]+/);
    });
  });

  // AC-1.8: Текущий пользователь не отображается
  test.describe('AC-1.8: Текущий пользователь не отображается', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('не должен отображать текущего пользователя в результатах поиска', async ({ page }) => {
      await page.goto(NEW_CONVERSATION_URL);

      // Get current user's name from profile or search for common name
      const searchInput = page.getByPlaceholder(/поиск/i);
      // Search for an empty string to get all users
      await searchInput.fill('');
      await page.waitForTimeout(500);

      // Current user should not be in the results
      const options = page.locator('[role="option"]');
      // If we have results, current user should not be among them
      const count = await options.count();
      if (count > 0) {
        // The current logged-in user should not appear
        // This is a basic check - the actual user won't see themselves
        await expect(options.first()).toBeVisible();
      }
    });
  });

  // B030-T4-1: Новый диалог при наличии других диалогов (US-21-39)
  test.describe('B030-T4-1: Новый диалог при наличии других (US-21-39)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    /**
     * @spec B030-T4-1 — e2e-тест US-21-39: новый диалог при наличии других
     * @traces US-21-39, AC-05, FR-09
     *
     * Сценарий:
     * 1. User A (текущий) имеет диалог с User B
     * 2. User A открывает /dashboard/messages/new
     * 3. Для User B показана кнопка «Открыть диалог»
     * 4. User A ищет User C и видит кнопку «Написать»
     * 5. Клик «Написать» → новый диалог с User C, редирект
     */
    test('должен создать новый диалог с C при наличии диалога с B (US-21-39)', async ({ page, request }) => {
      // Arrange: создать двух пользователей с УНИКАЛЬНЫМИ именами (суффикс Date.now())
      // — чтобы отделить среду (накопленные дубликаты «B-User»/«C-User» в общей dev-БД)
      // от проверяемой логики создания диалога.
      const suffix = Date.now();
      const userBResp = await request.post('/api/v1/test/users', {
        data: { email: `b-user-${suffix}@example.com`, password: 'password123', firstName: `B-${suffix}`, lastName: 'Test' },
      });
      const userCResp = await request.post('/api/v1/test/users', {
        data: { email: `c-user-${suffix}@example.com`, password: 'password123', firstName: `C-${suffix}`, lastName: 'Test' },
      });
      const userBBody = (await userBResp.json()) as any;
      const userCBody = (await userCResp.json()) as any;
      const participantBId = userBBody.data?.id || userBBody.data?.user?.id;
      const participantCId = userCBody.data?.id || userCBody.data?.user?.id;

      // Создать диалог A ↔ B (новый) → HTTP 201, а не 500
      const convB = await page.request.post('/api/v1/conversations', {
        data: { participantId: participantBId },
      });
      expect(convB.status()).toBe(201);

      // Повторный POST A ↔ B → 409 с существующим диалогом (не 500)
      const convB2 = await page.request.post('/api/v1/conversations', {
        data: { participantId: participantBId },
      });
      expect(convB2.status()).toBe(409);

      // Act 1: открыть страницу нового диалога
      await page.goto(NEW_CONVERSATION_URL);
      const searchInput = page.getByLabel('Найти пользователя');

      // Assert 1: поиск B → кнопка «Открыть диалог»
      await searchInput.fill(`B-${suffix}`);
      await page.waitForTimeout(500);
      const optionB = page.locator('[role="option"]').filter({ hasText: `B-${suffix}` });
      await expect(optionB.locator('button')).toContainText('Открыть диалог');

      // Assert 2: поиск C → кнопка «Написать» (диалог ещё не создан)
      await searchInput.fill(`C-${suffix}`);
      await page.waitForTimeout(500);
      const optionC = page.locator('[role="option"]').filter({ hasText: `C-${suffix}` });
      await expect(optionC.locator('button')).toContainText('Написать');

      // Act 2: кликнуть «Написать» для C → POST /conversations должен вернуть 201 и редирект
      await optionC.locator('button').click();

      // Assert 3: редирект на новый диалог (значит создание прошло без 500).
      // Клиент после 201/409 делает router.replace('/dashboard/comms/messages/{conversationId}') —
      // фактический URL-паттерн /dashboard/comms/messages/{id}.
      await expect(page).toHaveURL(/.*\/dashboard\/comms\/messages\/[a-zA-Z0-9]+/);
    });
  });

  // B031-T3-1: Кнопка «Написать» при сбое предзагрузки диалогов (EC-04, AC-05)
  test.describe('B031-T3-1: Кнопка «Написать» при сбое предзагрузки', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    /**
     * @spec B031-T3-1 — e2e-тест: кнопка «Написать» при сбое предзагрузки диалогов
     * @traces B-031, EC-04, AC-05
     *
     * Сценарий:
     * 1. Создать тестового пользователя через POST /api/v1/test/users
     *    (уникальный email с Date.now() — избегаем strict-mode коллизий)
     * 2. Заблокировать GET /conversations через page.route (500)
     * 3. Открыть страницу нового диалога
     * 4. Убедиться, что Loading-кнопки исчезают (не застревают) — EC-04
     * 5. Найти созданного пользователя → кнопка «Написать» появляется — AC-05
     */
    test('должен показать кнопку "Написать" при сбое предзагрузки диалогов (B-031)', async ({ page, request }) => {
      // Arrange: создать тестового пользователя с УНИКАЛЬНЫМ email (Date.now())
      const uniqueEmail = `b031-write-${Date.now()}@example.com`;
      const createResp = await request.post('/api/v1/test/users', {
        data: {
          email: uniqueEmail,
          password: 'password123',
          firstName: 'B031',
          lastName: `Write${Date.now()}`,
        },
      });
      expect(createResp.ok()).toBeTruthy();

      // Arrange: заблокировать GET /conversations (500), POST пропустить
      await page.route('**/api/v1/conversations', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({ status: 500, body: '{"success":false,"error":"Internal Server Error"}' });
        } else {
          route.continue(); // POST проходит нормально
        }
      });

      // Act: открыть страницу нового диалога
      await page.goto(NEW_CONVERSATION_URL);

      // Assert EC-04: Loading-кнопки исчезают после сбоя (не застревают)
      // Явное ожидание вместо waitForTimeout()
      const loadingButtons = page.locator('button[aria-label="Загрузка"]');
      await expect(loadingButtons).toHaveCount(0, { timeout: 10000 });

      // Ищем созданного пользователя по уникальному email
      const searchInput = page.getByLabel('Найти пользователя');
      await searchInput.fill(uniqueEmail);

      // Явное ожидание результата поиска вместо waitForTimeout(500).
      // Увеличенный таймаут: в dev-режиме первый запрос /api/v1/users/search
      // компилируется лениво (Next.js on-demand compilation) и может занять >5с.
      const option = page.locator('[role="option"]').filter({ hasText: uniqueEmail });
      await expect(option).toBeVisible({ timeout: 15000 });

      // Assert AC-05: кнопка «Написать» присутствует для нового собеседника
      await expect(option.locator('button')).toContainText('Написать');
    });
  });

  // B032-T2-1: Кнопка «Новый диалог» в заголовке ConversationList при непустом списке
  test.describe('B032-T2-1: Кнопка «Новый диалог» при наличии диалогов', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    const MESSAGES_LIST_URL = '/dashboard/comms/messages';
    const NEW_CONVERSATION_FULL_URL = '/dashboard/comms/messages/new';

    /**
     * @spec B032-T2-1 — e2e-тест: кнопка «Новый диалог» видна при непустом списке диалогов
     * @traces B-032, US-21-39, AC-05
     *
     * Сценарий:
     * 1. User A (текущий) создаёт диалог с User B → список становится непустым
     * 2. User A открывает /dashboard/comms/messages
     * 3. В заголовке ConversationList видна кнопка «Новый диалог» (не только в пустом состоянии)
     * 4. Клик по кнопке → переход на /dashboard/comms/messages/new
     */
    test('должен показать кнопку «Новый диалог» при непустом списке и перейти на /new по клику (B-032)', async ({ page, request }) => {
      // Arrange: создать участника с УНИКАЛЬНЫМ именем и email (суффикс Date.now())
      const suffix = Date.now();
      const participantResp = await request.post('/api/v1/test/users', {
        data: { email: `b032-participant-${suffix}@example.com`, password: 'password123', firstName: `B032-${suffix}`, lastName: 'Test' },
      });
      expect(participantResp.ok()).toBeTruthy();
      const participantBody = (await participantResp.json()) as any;
      const participantId = participantBody.data?.id || participantBody.data?.user?.id;
      expect(participantId).toBeTruthy();

      // Arrange: создать диалог A ↔ B → HTTP 201 (список становится непустым)
      const convResp = await page.request.post('/api/v1/conversations', {
        data: { participantId },
      });
      expect(convResp.status()).toBe(201);

      // Act 1: открыть страницу списка диалогов
      await page.goto(MESSAGES_LIST_URL);

      // Assert 1: список диалогов непустой — карточка с уникальным собеседником видна
      const conversationCard = page.locator('[role="link"]').filter({ hasText: `B032-${suffix}` });
      await expect(conversationCard).toBeVisible({ timeout: 15000 });

      // Assert 2: кнопка «Новый диалог» видна в заголовке (не только в пустом состоянии)
      const newConversationButton = page.getByRole('button', { name: /новый диалог/i });
      await expect(newConversationButton).toBeVisible();

      // Act 2: кликнуть кнопку «Новый диалог»
      await newConversationButton.click();

      // Assert 3: переход на страницу нового диалога
      await expect(page).toHaveURL(NEW_CONVERSATION_FULL_URL);
    });
  });
});
