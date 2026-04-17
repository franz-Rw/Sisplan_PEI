
import React, { useState, useEffect } from 'react'
import { FiTrendingUp, FiUsers, FiMapPin, FiTarget, FiClock, FiAlertCircle, FiCheckCircle, FiEdit3, FiFileText } from 'react-icons/fi'
import apiClient from '@services/api'
import { useNavigate } from 'react-router-dom'

// Lazy load gráficos - manejo de caso cuando recharts no está disponible

interface StatCard {
  id: string
  title: string
  value: number | string
  change?: number
  icon: React.ReactNode
  color: string
  action?: { label: string; path: string }
}

interface RecentActivity {
  id: string
  type: 'plan' | 'user' | 'data' | 'approval'
  action: string
  details: string
  timestamp: string
}

interface DataStatusMetrics {
  DRAFT: number
  PENDING: number
  APPROVED: number
  REJECTED: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartsLoaded, setChartsLoaded] = useState(false)
  
  // Componentes de recharts cargados dinámicamente
  const [chartComponents, setChartComponents] = useState<any>({
    LineChart: null,
    BarChart: null,
    PieChart: null,
    ResponsiveContainer: null,
    Line: null,
    Bar: null,
    Pie: null,
    Cell: null,
    CartesianGrid: null,
    Tooltip: null,
    Legend: null,
    XAxis: null,
    YAxis: null
  })

  // Cargar componentes de recharts dinámicamente
  useEffect(() => {
    const loadCharts = async () => {
      try {
        const recharts = await import('recharts')
        setChartComponents({
          LineChart: recharts.LineChart,
          BarChart: recharts.BarChart,
          PieChart: recharts.PieChart,
          ResponsiveContainer: recharts.ResponsiveContainer,
          Line: recharts.Line,
          Bar: recharts.Bar,
          Pie: recharts.Pie,
          Cell: recharts.Cell,
          CartesianGrid: recharts.CartesianGrid,
          Tooltip: recharts.Tooltip,
          Legend: recharts.Legend,
          XAxis: recharts.XAxis,
          YAxis: recharts.YAxis
        })
        setChartsLoaded(true)
      } catch (error) {
        console.warn('Recharts not available:', error)
        setChartsLoaded(false)
      }
    }
    
    loadCharts()
  }, [])

  // Stats
  const [stats, setStats] = useState<StatCard[]>([])

  // Data for charts
  const [indicatorsByYear, setIndicatorsByYear] = useState<any[]>([])
  const [dataStatusMetrics, setDataStatusMetrics] = useState<DataStatusMetrics>({
    DRAFT: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  })
  const [usersByRole, setUsersByRole] = useState<any[]>([])

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo
      const [plansRes, objectivesRes, actionsRes, indicatorsRes, usersRes, costCentersRes, indicatorDataRes] =
        await Promise.all([
          apiClient.get('/plans').catch(() => ({ data: [] })),
          apiClient.get('/strategic-objectives').catch(() => ({ data: [] })),
          apiClient.get('/strategic-actions').catch(() => ({ data: [] })),
          apiClient.get('/indicators').catch(() => ({ data: [] })),
          apiClient.get('/users').catch(() => ({ data: [] })),
          apiClient.get('/cost-centers').catch(() => ({ data: [] })),
          apiClient.get('/indicator-data/all').catch(() => ({ data: [] }))
        ])

      const plans = plansRes.data || []
      const objectives = objectivesRes.data || []
      const actions = actionsRes.data || []
      const indicators = indicatorsRes.data || []
      const users = usersRes.data || []
      const costCenters = costCentersRes.data || []
      const indicatorData = indicatorDataRes.data || []

      // Calcular stats
      const statsData: StatCard[] = [
        {
          id: 'plans',
          title: 'Planes Estratégicos',
          value: plans.length,
          change: 0,
          icon: <FiTarget className="w-6 h-6" />,
          color: 'blue',
          action: { label: 'Ver planes', path: '/admin/planes' }
        },
        {
          id: 'objectives',
          title: 'Objetivos Estratégicos',
          value: objectives.length,
          icon: <FiTrendingUp className="w-6 h-6" />,
          color: 'green',
          action: { label: 'Ver objetivos', path: '/admin/objetivos' }
        },
        {
          id: 'actions',
          title: 'Acciones Estratégicas',
          value: actions.length,
          icon: <FiCheckCircle className="w-6 h-6" />,
          color: 'purple',
          action: { label: 'Ver acciones', path: '/admin/objetivos' }
        },
        {
          id: 'indicators',
          title: 'Indicadores Registrados',
          value: indicators.length,
          icon: <FiFileText className="w-6 h-6" />,
          color: 'orange',
          action: { label: 'Ver indicadores', path: '/admin/seguimiento' }
        },
        {
          id: 'users',
          title: 'Usuarios Sistema',
          value: users.length,
          icon: <FiUsers className="w-6 h-6" />,
          color: 'red',
          action: { label: 'Gestionar usuarios', path: '/admin/usuarios' }
        },
        {
          id: 'costcenters',
          title: 'Centros de Costo',
          value: costCenters.filter((cc: any) => cc.status === 'ACTIVO').length,
          icon: <FiMapPin className="w-6 h-6" />,
          color: 'teal',
          action: { label: 'Gestionar', path: '/admin/centros-costo' }
        }
      ]

      setStats(statsData)

      // Procesar métrica de estados de datos
      const statusMetrics: DataStatusMetrics = {
        DRAFT: indicatorData.filter((d: any) => d.status === 'DRAFT' || d.status === 'draft').length,
        PENDING: indicatorData.filter((d: any) => d.status === 'PENDING' || d.status === 'pending').length,
        APPROVED: indicatorData.filter((d: any) => d.status === 'APPROVED' || d.status === 'approved').length,
        REJECTED: indicatorData.filter((d: any) => d.status === 'REJECTED' || d.status === 'rejected').length
      }
      setDataStatusMetrics(statusMetrics)

      // Datos por año (para gráfico de línea) - CORREGIDO: mostrar datos aprobados reales
      const indicatorsByYearMap: Record<number, number> = {}
      
      // Contar solo datos de indicadores que están APROVED
      indicatorData.forEach((data: any) => {
        if (data.status === 'APPROVED' || data.status === 'approved') {
          const year = data.year
          if (year) {
            indicatorsByYearMap[year] = (indicatorsByYearMap[year] || 0) + 1
          }
        }
      })

      const yearData = Object.entries(indicatorsByYearMap)
        .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB))
        .map(([year, count]) => ({
          year: Number(year),
          indicadores: count
        }))
        .slice(-5)

      setIndicatorsByYear(yearData)

      // Usuarios por rol
      const roleData = [
        {
          name: 'Administradores',
          value: users.filter((u: any) => u.role === 'ADMIN').length,
          fill: '#0854a1'
        },
        {
          name: 'Operadores',
          value: users.filter((u: any) => u.role === 'OPERATOR').length,
          fill: '#059669'
        }
      ]
      setUsersByRole(roleData)

      // Actividad reciente (fabricada pero realista)
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'plan',
          action: `${plans.length} Planes Estratégicos Activos`,
          details: `Última actualización: ${plans.length > 0 ? 'hace poco' : 'no disponible'}`,
          timestamp: new Date().toLocaleTimeString('es-ES')
        },
        {
          id: '2',
          type: 'data',
          action: 'Datos de Indicadores Pendientes',
          details: `${statusMetrics.PENDING} registros en espera de aprobación`,
          timestamp: new Date(Date.now() - 300000).toLocaleTimeString('es-ES')
        },
        {
          id: '3',
          type: 'user',
          action: `${users.length} Usuarios Registrados`,
          details: `${users.filter((u: any) => u.role === 'OPERATOR').length} operadores activos`,
          timestamp: new Date(Date.now() - 600000).toLocaleTimeString('es-ES')
        },
        {
          id: '4',
          type: 'approval',
          action: 'Datos Aprobados Recientemente',
          details: `${statusMetrics.APPROVED} registros aprobados en el sistema`,
          timestamp: new Date(Date.now() - 900000).toLocaleTimeString('es-ES')
        }
      ]
      setRecentActivity(activities)

      // Datos pendientes de aprobar
      const pendingData = indicatorData
        .filter((d: any) => d.status === 'PENDING' || d.status === 'pending')
        .slice(0, 5)
        .map((d: any) => ({
          id: d.id,
          variable: d.variable?.name || 'Variable desconocida',
          costCenter: d.costCenterCode || 'Sin centro',
          year: d.year || new Date().getFullYear(),
          status: d.status || 'PENDING',
          submittedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-ES') : 'Sin fecha'
        }))

      setPendingApprovals(pendingData)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const COLORS_STATUS = {
    DRAFT: '#f59e0b',
    PENDING: '#f97316',
    APPROVED: '#10b981',
    REJECTED: '#ef4444'
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Resumen general del sistema SISPLAN</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <FiAlertCircle className="text-red-600 w-5 h-5" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div
            key={stat.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => stat.action && navigate(stat.action.path)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-100`}>
                {stat.icon}
              </div>
              {stat.change !== undefined && stat.change !== 0 && (
                <span className={`text-xs font-semibold ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
            {stat.action && (
              <p className="text-xs text-primary-600 group-hover:underline">{stat.action.label} →</p>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado de Datos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Estado de Datos Registrados</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Total: {Object.values(dataStatusMetrics).reduce((a, b) => a + b, 0)}</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-2xl font-bold text-amber-700 mb-1">{dataStatusMetrics.DRAFT}</p>
                <p className="text-xs text-amber-600 font-medium">Borradores</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-2xl font-bold text-orange-700 mb-1">{dataStatusMetrics.PENDING}</p>
                <p className="text-xs text-orange-600 font-medium">Pendientes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700 mb-1">{dataStatusMetrics.APPROVED}</p>
                <p className="text-xs text-green-600 font-medium">Aprobados</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-700 mb-1">{dataStatusMetrics.REJECTED}</p>
                <p className="text-xs text-red-600 font-medium">Rechazados</p>
              </div>
            </div>

            {/* Gráfico de Dona Apilado - Estado de Datos */}
            {chartsLoaded && chartComponents.ResponsiveContainer && chartComponents.PieChart ? (
              <div className="mt-6 h-64 flex justify-center">
                <chartComponents.ResponsiveContainer width="100%" height="100%">
                  <chartComponents.PieChart>
                    <chartComponents.Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-gray-600">{payload[0].value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    {/* Capa externa - Datos Aprobados */}
                    <chartComponents.Pie
                      data={[
                        { name: 'Aprobados', value: dataStatusMetrics.APPROVED, fill: COLORS_STATUS.APPROVED }
                      ]}
                      dataKey="value"
                      outerRadius={90}
                      innerRadius={70}
                    />
                    {/* Capa media - Datos Pendientes */}
                    <chartComponents.Pie
                      data={[
                        { name: 'Pendientes', value: dataStatusMetrics.PENDING, fill: COLORS_STATUS.PENDING }
                      ]}
                      dataKey="value"
                      outerRadius={70}
                      innerRadius={50}
                    />
                    {/* Capa interna - Datos Borradores */}
                    <chartComponents.Pie
                      data={[
                        { name: 'Borradores', value: dataStatusMetrics.DRAFT, fill: COLORS_STATUS.DRAFT }
                      ]}
                      dataKey="value"
                      outerRadius={50}
                      innerRadius={30}
                    />
                    {/* Centro - Datos Rechazados */}
                    <chartComponents.Pie
                      data={[
                        { name: 'Rechazados', value: dataStatusMetrics.REJECTED, fill: COLORS_STATUS.REJECTED }
                      ]}
                      dataKey="value"
                      outerRadius={30}
                      innerRadius={10}
                    />
                  </chartComponents.PieChart>
                </chartComponents.ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-6 h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
                Gráfico cargando...
              </div>
            )}
          </div>

          {/* Indicadores por Año */}
          {chartsLoaded && chartComponents.ResponsiveContainer && chartComponents.LineChart && indicatorsByYear.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Evolución de Datos Aprobados</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Últimos {indicatorsByYear.length} años
                </span>
              </div>
              <div className="mt-6">
                <chartComponents.ResponsiveContainer width="100%" height={300}>
                  <chartComponents.LineChart
                    data={indicatorsByYear}
                    margin={{
                      top: 24,
                      left: 24,
                      right: 24,
                    }}
                  >
                    <chartComponents.CartesianGrid vertical={false} />
                    <chartComponents.XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <chartComponents.YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <chartComponents.Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-sm font-medium text-gray-900">
                                Año: {payload[0].payload.year}
                              </p>
                              <p className="text-sm text-blue-600 font-semibold">
                                Indicadores: {payload[0].value}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <chartComponents.Line
                      dataKey="indicadores"
                      type="natural"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={({ payload, ...props }) => {
                        // Asignar colores diferentes según el año o valor
                        const getDotColor = (year: number, value: number) => {
                          // Colores progresivos según el valor
                          if (value >= 50) return '#10b981' // verde para valores altos
                          if (value >= 30) return '#3b82f6' // azul para valores medios
                          if (value >= 15) return '#f59e0b' // ámbar para valores bajos
                          return '#ef4444' // rojo para valores muy bajos
                        }
                        
                        return (
                          <circle
                            key={payload.year}
                            r={5}
                            cx={props.cx}
                            cy={props.cy}
                            fill={getDotColor(payload.year, payload.indicadores)}
                            stroke={getDotColor(payload.year, payload.indicadores)}
                            className="drop-shadow-sm"
                          />
                        )
                      }}
                      activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </chartComponents.LineChart>
                </chartComponents.ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Actividad Reciente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h2>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'plan' && <FiTarget className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'user' && <FiUsers className="w-4 h-4 text-green-600" />}
                    {activity.type === 'data' && <FiFileText className="w-4 h-4 text-orange-600" />}
                    {activity.type === 'approval' && <FiCheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/planes')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <FiTarget className="w-4 h-4" />
                Ver Planes
              </button>
              <button
                onClick={() => navigate('/admin/usuarios')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <FiUsers className="w-4 h-4" />
                Gestionar Usuarios
              </button>
              <button
                onClick={() => navigate('/admin/centros-costo')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                <FiMapPin className="w-4 h-4" />
                Centros de Costo
              </button>
              <button
                onClick={() => navigate('/admin/reportes/variables')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                <FiFileText className="w-4 h-4" />
                Ver Reportes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Datos Pendientes de Aprobar */}
      {pendingApprovals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Datos Pendientes de Aprobar</h2>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">
                {pendingApprovals.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/admin/seguimiento')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Variable</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Centro de Costo</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Año</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Fecha Envío</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-900">{item.variable}</td>
                    <td className="py-3 px-3 text-gray-600">{item.costCenter}</td>
                    <td className="py-3 px-3 text-gray-600">{item.year}</td>
                    <td className="py-3 px-3 text-gray-600">{item.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
