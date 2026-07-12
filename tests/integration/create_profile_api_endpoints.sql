-- Insert API endpoints for user profile management
-- Эти точки должны быть активны для доступа к профильным операциям

INSERT INTO api_endpoints (method, path, description, access_type, is_active)
VALUES 
  ('GET', '/profile', 'Получить профиль текущего пользователя', 'owner', true),
  ('PATCH', '/profile', 'Обновить профиль текущего пользователя', 'owner', true),
  ('PUT', '/profile', 'Полное обновление профиля (REST)', 'owner', true),
  ('POST', '/profile/avatar', 'Загрузить аватар пользователя', 'owner', true),
  ('DELETE', '/profile/avatar', 'Удалить аватар пользователя', 'owner', true);
