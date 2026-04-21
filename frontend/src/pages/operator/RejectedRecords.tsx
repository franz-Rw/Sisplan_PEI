import React, { useState, useEffect } from 'react'
import { FiDownload, FiFilter, FiCalendar, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import apiClient from '@services/api'
import { useAuth } from '@context/AuthContext'

interface RejectedRecord {
  id: string
  year: number
  status: string
  createdAt: string
  updatedAt: string
  rejectionReason?: string
  variable: {
    id: string
    code: string
    name: string
    indicator: {
      code: string
      statement: string
      actionId?: string
      objectiveId?: string
    }
  }
  costCenter: {
    code: string
    description: string
  }
}

export default function RejectedRecords() {
  const { user } = useAuth()
  const [rejectedRecords, setRejectedRecords] = useState<RejectedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterCostCenter, setFilterCostCenter] = useState<string>('')
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRejectedRecords()
  }, [])

  const loadRejectedRecords = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/indicator-data/all?status=rejected')
      const records = Array.isArray(response.data) ? response.data : []
      setRejectedRecords(records)
    } catch (error) {
      console.error('Error loading rejected records:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (recordId: string) => {
    setExpandedRecords(prev => 
      prev.has(recordId) 
        ? new Set(Array.from(prev).filter(id => id !== recordId))
        : new Set([...prev, recordId])
    )
  }

  const filteredRecords = rejectedRecords.filter(record => {
    const matchesYear = !filterYear || record.year.toString() === filterYear
    const matchesCostCenter = !filterCostCenter || 
      record.costCenter.code.toLowerCase().includes(filterCostCenter.toLowerCase()) ||
      record.costCenter.description.toLowerCase().includes(filterCostCenter.toLowerCase())
    return matchesYear && matchesCostCenter
  })

  const exportToCSV = () => {
    const headers = [
      'Código Variable',
      'Nombre Variable', 
      'Código Indicador',
      'Nombre Indicador',
      'Centro de Costo',
      'Código Centro',
      'Año',
      'Fecha Rechazo',
      'Motivo Rechazo'
    ]

    const csvData = filteredRecords.map(record => [
      record.variable.code,
      record.variable.name,
      record.variable.indicator.code,
      record.variable.indicator.statement,
      record.costCenter.description,
      record.costCenter.code,
      record.year,
      new Date(record.updatedAt).toLocaleDateString('es-PE'),
      record.rejectionReason || 'No especificado'
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `registros_rechazados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const uniqueYears = [...new Set(rejectedRecords.map(r => r.year))].sort((a, b) => b - a)
  const uniqueCostCenters = [...new Set(rejectedRecords.map(r => r.costCenter.code))].sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registros Rechazados</h1>
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
          Visualización y gestión de registros que han sido rechazados por el administrador.
          Estos registros pueden ser corregidos y enviados nuevamente para aprobación.
        </p>
      </div>

      {/* Filtros y Exportación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los años</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filterCostCenter}
            onChange={(e) => setFilterCostCenter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los centros</option>
            {uniqueCostCenters.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <FiDownload className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={loadRejectedRecords}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Rechazados</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiCalendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Centros Afectados</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredRecords.map(r => r.costCenter.code)).size}
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
              <p className="text-sm text-gray-600">Variables Afectadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredRecords.map(r => r.variable.code)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros Rechazados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron registros rechazados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centro de Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Rechazo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map(record => (
                  <React.Fragment key={record.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.variable.code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.variable.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {record.variable.indicator.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {record.costCenter.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.costCenter.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(record.updatedAt).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 truncate">
                            {record.rejectionReason || 'No especificado'}
                          </div>
                          {record.rejectionReason && record.rejectionReason.length > 50 && (
                            <button
                              onClick={() => toggleExpanded(record.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              {expandedRecords.has(record.id) ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => window.location.href = `/operator/seguimiento/indicadores?variable=${record.variable.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Corregir y Reenviar
                        </button>
                      </td>
                    </tr>
                    {expandedRecords.has(record.id) && record.rejectionReason && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm text-gray-700">
                            <strong>Motivo completo del rechazo:</strong>
                            <p className="mt-1">{record.rejectionReason}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
