import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthStatus } from '@/components/ui/auth-status';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-config';

/**
 * Модули приложения СНТ.
 */
const modules = [
  {
    title: '🏠 Участки',
    description: 'Управление садовыми участками и их владельцами',
    href: '/plots',
    icon: '🌳',
  },
  {
    title: '💰 Бухгалтерия',
    description: 'Начисления, платежи и финансовая отчётность',
    href: '/accounting',
    icon: '💰',
  },
  {
    title: '🗳️ Голосования',
    description: 'Организация голосований и принятие решений',
    href: '/votes',
    icon: '🗳️',
  },
  {
    title: '📋 Документы',
    description: 'Хранение и обмен документами товарищества',
    href: '/documents',
    icon: '📋',
  },
  {
    title: '📢 Объявления',
    description: 'Информирование членов товарищества',
    href: '/announcements',
    icon: '📢',
  },
  {
    title: '💬 Общение',
    description: 'Форум, чаты и уведомления в реальном времени',
    href: '/forum',
    icon: '💬',
  },
];

/**
 * Стартовая страница приложения.
 *
 * @remarks
 * Server Component с получением сессии через getServerSession().
 * Отображает приветствие, AuthStatus и карточки модулей.
 *
 * @public
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Hero секция */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-bg-secondary)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Верхняя панель */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🌳</span>
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {APP_NAME}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {APP_DESCRIPTION}
                </p>
              </div>
            </div>

            {/* AuthStatus и ThemeToggle */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <AuthStatus />
            </div>
          </div>

          {/* Приветствие */}
          <div className="rounded-2xl bg-[var(--color-bg-secondary)]/50 p-8 backdrop-blur-sm">
            {session?.user ? (
              <>
                <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                  Добро пожаловать, {session.user.name || session.user.email}!
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  Выберите раздел для начала работы
                </p>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                  Добро пожаловать в {APP_NAME}
                </h2>
                <p className="mb-4 text-[var(--color-text-secondary)]">
                  Войдите в систему для доступа ко всем функциям управления товариществом
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Карточки модулей */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">
          Разделы приложения
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <a
              key={module.title}
              href={module.href}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 transition-all hover:border-[var(--color-accent)] hover:shadow-lg hover:-translate-y-1"
              aria-label={`Перейти к разделу ${module.title}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {module.icon}
                </span>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">
                  {module.title}
                </h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {module.description}
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
