
export default function OperatorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Operador</h1>
              <p className="text-gray-600">Gestión de Indicadores de Planes Estratégicos</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Planes Asignados</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-600">Planes activos</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Indicadores Registrados</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-gray-600">Este mes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pendientes</h3>
            <p className="text-3xl font-bold text-orange-600">0</p>
            <p className="text-gray-600">Por registrar</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Planes Estratégicos</h2>
            <div className="space-y-3">
              <p className="text-gray-600">No tienes planes asignados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
