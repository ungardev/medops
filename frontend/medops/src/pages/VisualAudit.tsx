export default function VisualAudit() {
  return (
    <div className="min-h-screen bg-bgLight dark:bg-bgDark p-8">
      <div className="bg-surfaceLight dark:bg-surfaceDark rounded-lg shadow p-6 space-y-6">
        <h1 className="text-primary text-3xl font-bold">
          MedOps visual audit 🚀
        </h1>
        <p className="text-textMuted dark:text-textDarkMuted text-lg">
          Tokens extendidos funcionando correctamente.
        </p>

        {/* 🔹 Botón institucional */}
        <button className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">
          Botón institucional
        </button>

        {/* 🔹 Caja con borde institucional */}
        <div className="border border-borderLight dark:border-borderDark p-4 rounded">
          <p className="text-textMuted dark:text-textDark">
            Caja con borde institucional
          </p>
        </div>

        {/* 🔹 Test estándar de modo oscuro (clases nativas de Tailwind) */}
        <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-4 rounded">
          Test estándar (clases nativas de Tailwind)
        </div>

        {/* 🔹 Test institucional con tokens extendidos */}
        <div className="bg-bgLight dark:bg-bgDark text-textMuted dark:text-textDark p-4 rounded">
          Test institucional (tokens extendidos)
        </div>

        {/* 🔹 Test modo claro reforzado */}
        <div className="bg-surfaceLight text-textLight border border-borderLight p-4 rounded">
          Test modo claro (tokens reforzados)
        </div>
      </div>
    </div>
  );
}
