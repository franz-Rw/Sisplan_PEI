
export default function Dashboard() {
  const stats = [
    {
      title: 'Planes Estratégicos',
      value: '0',
      subtitle: 'Planes activos',
      color: 'blue',
      icon: '📊'
    },
    {
      title: 'Usuarios',
      value: '1',
      subtitle: 'Usuarios registrados',
      color: 'green',
      icon: '👥'
    },
    {
      title: 'Centros de Costo',
      value: '0',
      subtitle: 'Centros configurados',
      color: 'purple',
      icon: '🏢'
    },
    {
      title: 'Indicadores',
      value: '0',
      subtitle: 'Indicadores registrados',
      color: 'orange',
      icon: '📈'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      action: 'Usuario administrador creado',
      time: 'Hace unos minutos',
      type: 'user'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`w-2 h-2 rounded-full bg-${stat.color}-500`}></div>
            </div>
            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">{stat.title}</p>
            <p className="text-xs text-neutral-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors duration-200 font-medium text-sm">
              Crear Nuevo Plan Estratégico
            </button>
            <button className="w-full text-left px-4 py-3 bg-neutral-50 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors duration-200 font-medium text-sm">
              Gestionar Usuarios
            </button>
            <button className="w-full text-left px-4 py-3 bg-neutral-50 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors duration-200 font-medium text-sm">
              Configurar Centros de Costo
            </button>
            <button className="w-full text-left px-4 py-3 bg-neutral-50 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors duration-200 font-medium text-sm">
              Ver Reportes
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                    <p className="text-xs text-neutral-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
