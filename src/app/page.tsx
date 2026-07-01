import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'СНТ Берёзки-НТ — Управление товариществом',
  description: 'Система управления членами СНТ Берёзки-НТ. Просмотр информации о членах, участках и платежах.',
};

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            СНТ Берёзки-НТ
          </h1>
          <p className="text-lg text-gray-600 sm:text-xl">
            Система управления товариществом — централизованный портал для членов СНТ.
            Получайте информацию о членах, участках и платежах в одном месте.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
        >
          Войти в систему
        </Link>
      </div>
    </div>
  );
}
