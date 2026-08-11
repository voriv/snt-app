import { Page, APIRequestContext, expect } from '@playwright/test';

/**
 * Тестовые учётные данные для аутентификации
 */
export { expect };
export const TEST_USERS = {
  admin: {
    email: 'admin@snt.local',
    password: 'adm2snt',
    role: 'ADMIN' as const,
    firstName: 'Администратор',
    lastName: 'СНТ',
  },
  member: {
    email: 'member@snt.local',
    password: 'Member123!',
    role: 'MEMBER' as const,
    firstName: 'Член',
    lastName: 'СНТ',
  },
};

/**
 * Тестовые данные для участков
 */
export const TEST_PLOTS = {
  valid: {
    plotNumber: '42',
    cadastralNumber: '54:12:1234567:8901',
    area: 600,
    address: 'ул. Садовая, д. 42',
    note: 'Тестовый участок',
  },
  duplicate: {
    plotNumber: '42',
    cadastralNumber: '54:12:9999999:0000',
    area: 600,
    address: 'ул. Пушкина, д. 1',
    note: '',
  },
  invalidCadastral: {
    plotNumber: '99',
    cadastralNumber: 'invalid-format',
    area: 600,
    address: 'ул. Ленина, д. 10',
    note: '',
  },
  minimal: {
    plotNumber: '100',
    area: 1000,
    cadastralNumber: '',
    address: '',
    note: '',
  },
};

/**
 * Логин для тестов
 * 
 * @param page - Страница для выполнения действий
 * @param email - Email пользователя
 * @param password - Пароль пользователя
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Очищаем куки, чтобы сбросить текущую сессию (если пользователь уже аутентифицирован)
  await page.context().clearCookies();
  
  // Переходим на страницу входа
  await page.goto('/login');
  
  // Вводим email
  await page.getByLabel(/email адрес для входа/i).fill(email);
  
  // Вводим пароль
  await page.getByLabel(/пароль для входа/i).fill(password);
  
  // Нажимаем кнопку входа
  await page.getByRole('button', { name: /войти/i }).click();
  
  // Ожидаем перенаправление на dashboard
  await page.waitForURL(/\/dashboard/);
}

/**
 * Логин в качестве администратора
 * 
 * @param page - Страница для выполнения действий
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * Логин в качестве члена СНТ
 * 
 * @param page - Страница для выполнения действий
 */
export async function loginAsMember(page: Page): Promise<void> {
  await login(page, TEST_USERS.member.email, TEST_USERS.member.password);
}

/**
 * Создание теста через API
 * 
 * @param request - APIRequestContext
 * @param authToken - Token аутентификации
 * @param data - Данные для создания участка
 */
export async function createPlotViaApi(
  request: APIRequestContext,
  authToken: string,
  data: Partial<typeof TEST_PLOTS.valid> = {}
): Promise<{ id: string; plotNumber: string }> {
  const plotData = {
    ...TEST_PLOTS.valid,
    ...data,
  };

  const response = await request.post('/api/v1/plots', {
    data: plotData,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return {
    id: result.data.id,
    plotNumber: result.data.plotNumber,
  };
}

/**
 * Удаление участка через API
 * 
 * @param request - APIRequestContext
 * @param authToken - Token аутентификации
 * @param plotId - ID участка для удаления
 */
export async function deletePlotViaApi(
  request: APIRequestContext,
  authToken: string,
  plotId: string
): Promise<void> {
  const response = await request.delete(`/api/v1/plots/${plotId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
  }
}

/**
 * Получение списка всех участков через API
 * 
 * @param request - APIRequestContext
 * @param authToken - Token аутентификации
 */
export async function getAllPlots(
  request: APIRequestContext,
  authToken: string
): Promise<any[]> {
  const response = await request.get('/api/v1/plots', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Открытие диалога подтверждения удаления
 * 
 * @param page - Страница для выполнения действий
 * @param plotNumber - Номер участка для удаления
 */
export async function openDeleteDialog(
  page: Page,
  plotNumber: string
): Promise<void> {
  // Поиск кнопки удаления для конкретного участка
  const deleteButton = page
    .getByRole('row', { name: plotNumber, exact: false })
    .getByRole('button', { name: /удалить/i });
  
  if (await deleteButton.isVisible()) {
    await deleteButton.click();
  } else {
    // Альтернативный поиск через контекстное меню
    await page.getByRole('button', { name: /действ/i }).click();
  }
  
  // Ожидаем появление диалога подтверждения
  await expect(page.getByText(/вы уверены/i)).toBeVisible();
}

/**
 * Закрытие диалога подтверждения отменой
 * 
 * @param page - Страница для выполнения действий
 */
export async function cancelDeleteDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: /отмена/i }).click();
  await expect(page.getByText(/вы уверены/i)).not.toBeVisible();
}

/**
 * Подтверждение удаления
 * 
 * @param page - Страница для выполнения действий
 */
export async function confirmDelete(page: Page): Promise<void> {
  await page.getByRole('button', { name: /удалить/i }).click();
}

/**
 * Заполнение формы создания/редактирования участка
 * 
 * @param page - Страница для выполнения действий
 * @param data - Данные для заполнения
 */
export async function fillPlotForm(
  page: Page,
  data: Partial<typeof TEST_PLOTS.valid>
): Promise<void> {
  if (data.plotNumber !== undefined) {
    await page.getByLabel(/номер участка/i).fill(data.plotNumber);
  }
  if (data.cadastralNumber !== undefined) {
    await page.getByLabel(/кадастровый номер/i).fill(data.cadastralNumber);
  }
  if (data.area !== undefined) {
    await page.getByLabel(/площадь/i).fill(String(data.area));
  }
  if (data.address !== undefined) {
    await page.getByLabel(/адрес/i).fill(data.address || '');
  }
  if (data.note !== undefined) {
    await page.getByLabel(/примечание/i).fill(data.note || '');
  }
}

/**
 * Поиск участка в таблице по номеру
 * 
 * @param page - Страница для выполнения действий
 * @param plotNumber - Номер участка для поиска
 */
export async function findPlotInTable(page: Page, plotNumber: string): Promise<boolean> {
  const row = page.getByRole('row', { name: plotNumber, exact: false });
  return row.isVisible();
}

/**
 * Очистка всех фильтров поиска
 * 
 * @param page - Страница для выполнения действий
 */
export async function clearAllFilters(page: Page): Promise<void> {
  await page.getByRole('button', { name: /очистить/i }).click();
}

/**
 * Ввод текста в поле поиска
 * 
 * @param page - Страница для выполнения действий
 * @param plotNumber - Текст для поиска
 */
export async function searchByPlotNumber(page: Page, plotNumber: string): Promise<void> {
  await page.getByLabel(/номер/i).fill(plotNumber);
}

/**
 * Ввод текста в поле поиска по кадастровому номеру
 * 
 * @param page - Страница для выполнения действий
 * @param cadastralNumber - Текст для поиска
 */
export async function searchByCadastralNumber(page: Page, cadastralNumber: string): Promise<void> {
  await page.getByLabel(/кадастровый номер/i).fill(cadastralNumber);
}

/**
 * Ввод текста в поле поиска по примечанию
 * 
 * @param page - Страница для выполнения действий
 * @param note - Текст для поиска
 */
export async function searchByNote(page: Page, note: string): Promise<void> {
  await page.getByLabel(/примечание/i).fill(note);
}
