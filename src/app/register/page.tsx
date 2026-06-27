import { RegisterForm } from '@/components/forms/register-form';

/**
 * Страница регистрации нового пользователя.
 *
 * @remarks
 * Публичная страница. Не требует аутентификации.
 * Позволяет новым пользователям зарегистрироваться с ролью GUEST.
 *
 * @public
 */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4 py-8">
      <RegisterForm />
    </div>
  );
}
