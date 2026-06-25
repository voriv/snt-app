export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🌳 СНТ-Приложение
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          Система управления садоводческим товариществом
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">🏠 Участки</h2>
            <p className="text-gray-600">Управление садовыми участками и их владельцами</p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">💰 Бухгалтерия</h2>
            <p className="text-gray-600">Начисления, платежи и финансовая отчётность</p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">🗳️ Голосования</h2>
            <p className="text-gray-600">Организация голосований и принятие решений</p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">📋 Документы</h2>
            <p className="text-gray-600">Хранение и обмен документами товарищества</p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">📢 Объявления</h2>
            <p className="text-gray-600">Информирование членов товарищества</p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">💬 Общение</h2>
            <p className="text-gray-600">Форум, чаты и уведомления в реальном времени</p>
          </div>
        </div>
      </div>
    </main>
  );
}