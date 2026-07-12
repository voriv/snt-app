-- Проверка записи endpoint для /profile/theme
SELECT 
  method, 
  path, 
  access_type,
  is_active
FROM api_endpoints
WHERE path LIKE '%profile%theme%';

-- Если запись не найдена или access_type != 'owner', добавить/обновить
INSERT INTO api_endpoints (method, path, description, access_type, is_active)
VALUES ('PATCH', '/profile/theme', 'Обновление темы оформления пользователя', 'owner', true)
ON CONFLICT (method, path) DO UPDATE
SET 
  access_type = 'owner',
  is_active = true,
  updated_at = NOW();
