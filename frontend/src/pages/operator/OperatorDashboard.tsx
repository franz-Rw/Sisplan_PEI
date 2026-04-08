import { useState, useEffect } from 'react'
import { FiTrendingUp, FiActivity, FiCheckCircle, FiClock, FiBarChart2, FiFileText, FiCalendar, FiTarget, FiZap, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '@context/AuthContext'

interface DashboardStats {
  totalObjectives: number
  totalObjectiveIndicators: number
  totalActions: number
  totalActionIndicators: number
  assignedVariables: number
  submittedVariables: number
  pendingApproval: number
  recentActivity: number
}

interface TrackingStatus {
  isOpen: boolean
  startDate: string
  endDate: string
  deadlineTime: string
  daysRemaining: number
}

interface RecentActivity {
  id: string
  type: 'data_registered' | 'data_approved' | 'data_rejected'
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

export default function OperatorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalObjectives: 0,
    totalObjectiveIndicators: 0,
    totalActions: 0,
    totalActionIndicators: 0,
    assignedVariables: 0,
    submittedVariables: 0,
    pendingApproval: 0,
    recentActivity: 0
  })
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    isOpen: false,
    startDate: '',
    endDate: '',
    deadlineTime: '',
    daysRemaining: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Simulate API calls - replace with actual API calls
      setTimeout(() => {
        setStats({
          totalObjectives: 8,
          totalObjectiveIndicators: 24,
          totalActions: 15,
          totalActionIndicators: 32,
          assignedVariables: 56,
          submittedVariables: 42,
          pendingApproval: 8,
          recentActivity: 12
        })
        
        setTrackingStatus({
          isOpen: true,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          deadlineTime: '23:59',
          daysRemaining: 15
        })
        
        setRecentActivities([
          {
            id: '1',
            type: 'data_registered',
            description: 'Datos registrados para indicador "Tasa de Cobertura"',
            timestamp: '2024-01-15 10:30',
            status: 'success'
          },
          {
            id: '2',
            type: 'data_approved',
            description: 'Datos aprobados para indicador "Eficiencia Operativa"',
            timestamp: '2024-01-15 09:45',
            status: 'success'
          },
          {
            id: '3',
            type: 'data_registered',
            description: 'Datos registrados para indicador "Índice de Satisfacción"',
            timestamp: '2024-01-15 08:20',
            status: 'success'
          },
          {
            id: '4',
            type: 'data_rejected',
            description: 'Datos rechazados para indicador "Productividad"',
            timestamp: '2024-01-14 16:30',
            status: 'error'
          }
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const progressPercentage = stats.assignedVariables > 0 
    ? Math.round((stats.submittedVariables / stats.assignedVariables) * 100)
    : 0

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'data_registered':
        return <FiActivity className="w-5 h-5 text-blue-600" />
      case 'data_approved':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />
      case 'data_rejected':
        return <FiTrendingUp className="w-5 h-5 text-red-600" />
      default:
        return <FiActivity className="w-5 h-5 text-neutral-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Bienvenido, {user?.name}</h1>
            <p className="text-primary-100">
              Panel de control para operadores - Gestiona y registra datos de indicadores
            </p>
          </div>
          <div className="hidden md:block">
            <FiBarChart2 className="w-16 h-16 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Tracking Status Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${trackingStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h2 className="text-lg font-semibold text-neutral-900">Estado del Seguimiento</h2>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            trackingStatus.isOpen 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {trackingStatus.isOpen ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Fecha de Inicio</p>
              <p className="font-semibold text-neutral-900">{formatDate(trackingStatus.startDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Fecha Fin</p>
              <p className="font-semibold text-neutral-900">{formatDate(trackingStatus.endDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Hora Límite</p>
              <p className="font-semibold text-neutral-900">{trackingStatus.deadlineTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Avance del Seguimiento</h2>
          <span className="text-2xl font-bold text-primary-600">{progressPercentage}%</span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>{stats.submittedVariables} de {stats.assignedVariables} variables enviadas</span>
            <span>{stats.assignedVariables - stats.submittedVariables} pendientes</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.submittedVariables}</p>
            <p className="text-sm text-green-700">Enviadas</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
            <p className="text-sm text-yellow-700">Por Aprobar</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-2xl font-bold text-neutral-600">{stats.assignedVariables - stats.submittedVariables}</p>
            <p className="text-sm text-neutral-700">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTarget className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-neutral-500 font-medium">Objetivos</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.totalObjectives}</div>
          <div className="text-sm text-neutral-600 mt-1">Objetivos Estratégicos Vinculados</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-neutral-500 font-medium">Indicadores</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.totalObjectiveIndicators}</div>
          <div className="text-sm text-neutral-600 mt-1">Indicadores de Objetivos Asignados</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiZap className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-neutral-500 font-medium">Acciones</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.totalActions}</div>
          <div className="text-sm text-neutral-600 mt-1">Acciones Estratégicas Vinculadas</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-neutral-500 font-medium">Indicadores</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.totalActionIndicators}</div>
          <div className="text-sm text-neutral-600 mt-1">Indicadores de Acciones Asignados</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Actividad Reciente</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todo
          </button>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <FiCalendar className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs text-neutral-500">{activity.timestamp}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.type === 'data_registered' && 'Registrado'}
                    {activity.type === 'data_approved' && 'Aprobado'}
                    {activity.type === 'data_rejected' && 'Rechazado'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <FiActivity className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Registrar Datos</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <FiFileText className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Ver Reportes</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <FiBarChart2 className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Mis Indicadores</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Información del Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Versión del Sistema</span>
              <span className="text-sm font-medium text-neutral-900">v2.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Última Actualización</span>
              <span className="text-sm font-medium text-neutral-900">15 Ene 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Estado del Servidor</span>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Activo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
