import React, { useState, useEffect } from 'react'
import { FiDownload, FiCalendar, FiAlertCircle, FiTrendingUp, FiFileText } from 'react-icons/fi'
import RejectedRecords from './RejectedRecords'
import { useAuth } from '@context/AuthContext'

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
)

export default function Reportes() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'rejected' | 'statistics'>('rejected')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-gray-600">
            {user?.name} - Rol: {user?.role === 'OPERATOR' ? 'Operador' : user?.role}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-medium">
            Centro de Costo: {user?.costCenter?.description || user?.costCenter?.code || 'No asignado'}
          </span>
        </div>
        <p className="text-gray-600 mt-1">
          Sistema de reportes y análisis de datos para la gestión de variables estratégicas.
        </p>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={activeTab === 'rejected'}
          onClick={() => setActiveTab('rejected')}
        >
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            Registros Rechazados
          </div>
        </TabButton>
        <TabButton
          active={activeTab === 'statistics'}
          onClick={() => setActiveTab('statistics')}
        >
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4" />
            Estadísticas
          </div>
        </TabButton>
      </div>

      {/* Contenido del tab activo */}
      {activeTab === 'rejected' && <RejectedRecords />}
      {activeTab === 'statistics' && <StatisticsTab />}
    </div>
  )
}

function StatisticsTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRecords: 0,
    approvedRecords: 0,
    rejectedRecords: 0,
    pendingRecords: 0,
    draftRecords: 0,
    totalVariables: 0,
    totalCostCenters: 0,
    recentActivity: [] as any[]
  })

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      // Aquí se cargarían las estadísticas desde el backend
      // Por ahora, datos de ejemplo
      setStats({
        totalRecords: 156,
        approvedRecords: 89,
        rejectedRecords: 12,
        pendingRecords: 8,
        draftRecords: 47,
        totalVariables: 24,
        totalCostCenters: 15,
        recentActivity: [
          { id: 1, action: 'Nuevo registro', variable: 'VIOE 1.1.1', user: 'Operador 1', time: 'Hace 5 min' },
          { id: 2, action: 'Aprobación', variable: 'VIAE 01.01.01.1', user: 'Administrador', time: 'Hace 15 min' },
          { id: 3, action: 'Rechazo', variable: 'VIOE 1.2.1', user: 'Administrador', time: 'Hace 1 hora' },
          { id: 4, action: 'Envío a aprobación', variable: 'VIAE 01.02.01.1', user: 'Operador 2', time: 'Hace 2 horas' }
        ]
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportStatistics = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Total de Registros', stats.totalRecords.toString()],
      ['Registros Aprobados', stats.approvedRecords.toString()],
      ['Registros Rechazados', stats.rejectedRecords.toString()],
      ['Registros Pendientes', stats.pendingRecords.toString()],
      ['Borradores', stats.draftRecords.toString()],
      ['Variables Activas', stats.totalVariables.toString()],
      ['Centros de Costo', stats.totalCostCenters.toString()]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `estadisticas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aprobados</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRecords}</p>
              <p className="text-xs text-gray-500">
                {((stats.approvedRecords / stats.totalRecords) * 100).toFixed(1)}% del total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRecords}</p>
              <p className="text-xs text-gray-500">Esperando aprobación</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedRecords}</p>
              <p className="text-xs text-gray-500">
                {((stats.rejectedRecords / stats.totalRecords) * 100).toFixed(1)}% del total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aprobados</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.approvedRecords / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.approvedRecords}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendientes</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(stats.pendingRecords / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.pendingRecords}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rechazados</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.rejectedRecords / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.rejectedRecords}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Borradores</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${(stats.draftRecords / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.draftRecords}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen General</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Variables Activas</span>
              <span className="text-sm font-medium">{stats.totalVariables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Centros de Costo</span>
              <span className="text-sm font-medium">{stats.totalCostCenters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de Aprobación</span>
              <span className="text-sm font-medium text-green-600">
                {((stats.approvedRecords / (stats.totalRecords - stats.draftRecords)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de Rechazo</span>
              <span className="text-sm font-medium text-red-600">
                {((stats.rejectedRecords / (stats.totalRecords - stats.draftRecords)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          <button
            onClick={exportStatistics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <FiDownload className="w-4 h-4" />
            Exportar Estadísticas
          </button>
        </div>
        <div className="space-y-3">
          {stats.recentActivity.map(activity => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.action === 'Aprobación' ? 'bg-green-100' :
                  activity.action === 'Rechazo' ? 'bg-red-100' :
                  activity.action === 'Envío a aprobación' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  {activity.action === 'Aprobación' ? <FiTrendingUp className="w-4 h-4 text-green-600" /> :
                   activity.action === 'Rechazo' ? <FiAlertCircle className="w-4 h-4 text-red-600" /> :
                   activity.action === 'Envío a aprobación' ? <FiCalendar className="w-4 h-4 text-yellow-600" /> :
                   <FiFileText className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.variable}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{activity.user}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
