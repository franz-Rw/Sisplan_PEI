import React, { useState, useEffect } from 'react'
import { FiDownload, FiFilter, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import { plansService } from '@services/plansService'
import apiClient from '@services/api'
import * as XLSX from 'xlsx'

interface StrategicPlan {
  id: string
  name: string
  startYear: number
  endYear: number
}

interface StrategicObjective {
  id: string
  code: string
  statement: string
  planId: string
  costCenter?: {
    code: string
    description: string
  }
}

interface StrategicAction {
  id: string
  code: string
  statement: string
  objectiveId: string
  costCenter?: {
    code: string
    description: string
  }
}

interface Indicator {
  id: string
  code: string
  statement: string
  objectiveId?: string
  actionId?: string
  costCenter?: {
    code: string
    description: string
  }
}

interface IndicatorVariable {
  id: string
  code: string
  name: string
  indicatorId: string
}

interface PlanStructureRow {
  plan: string
  startYear: number
  endYear: number
  oeiCode: string
  oeiStatement: string
  oeiCostCenter: string
  ioeiCode: string
  ioeiStatement: string
  ioeiCostCenter: string
  oeiVariableCode: string
  oeiVariableName: string
  aeiCode: string
  aeiStatement: string
  aeiCostCenter: string
  iaeiCode: string
  iaeiStatement: string
  iaeiCostCenter: string
  iaeiVariableCode: string
  iaeiVariableName: string
}

export default function ReportesPlanes() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [planData, setPlanData] = useState<PlanStructureRow[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (selectedPlan) {
      loadPlanStructure(selectedPlan)
    } else {
      setPlanData([])
    }
  }, [selectedPlan])

  const loadPlans = async () => {
    try {
      const data = await plansService.getAll()
      setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanStructure = async (planId: string) => {
    try {
      setLoading(true)
      
      // Obtener información del plan
      const plan = await plansService.getById(planId)

      // Obtener objetivos del plan
      const objectivesResponse = await apiClient.get(`/strategic-objectives/plan/${planId}`)
      const objectives = objectivesResponse.data

      // Construir estructura desnormalizada
      const structureRows: PlanStructureRow[] = []

      for (const objective of objectives) {
        // Obtener indicadores del objetivo
        const indicatorsResponse = await apiClient.get(`/strategic-objectives/${objective.id}/indicators`)
        const objectiveIndicators = indicatorsResponse.data

        // Obtener acciones del objetivo
        const actionsResponse = await apiClient.get(`/strategic-actions/plan/${planId}`)
        const actions = actionsResponse.data.filter((action: any) => action.objectiveId === objective.id)

        // Para cada indicador del objetivo, obtener sus variables
        for (const indicator of objectiveIndicators) {
          const variablesResponse = await apiClient.get(`/indicator-variables/indicator/${indicator.id}`)
          const variables = variablesResponse.data

          // Crear filas para cada variable del indicador del objetivo
          for (const variable of variables) {
            // Para cada acción asociada al objetivo
            for (const action of actions) {
              // Obtener indicadores de la acción
              const actionIndicatorsResponse = await apiClient.get(`/strategic-actions/${action.id}/indicators`)
              const actionIndicators = actionIndicatorsResponse.data

              // Para cada indicador de la acción, obtener sus variables
              for (const actionIndicator of actionIndicators) {
                const actionVariablesResponse = await apiClient.get(`/indicator-variables/indicator/${actionIndicator.id}`)
                const actionVariables = actionVariablesResponse.data

                // Crear filas para cada variable del indicador de acción
                for (const actionVariable of actionVariables) {
                  structureRows.push({
                    plan: plan.name,
                    startYear: plan.startYear,
                    endYear: plan.endYear,
                    oeiCode: objective.code,
                    oeiStatement: objective.statement,
                    oeiCostCenter: objective.responsible?.description || '',
                    ioeiCode: indicator.code,
                    ioeiStatement: indicator.statement,
                    ioeiCostCenter: indicator.responsible?.description || '',
                    oeiVariableCode: variable.code,
                    oeiVariableName: variable.name,
                    aeiCode: action.code,
                    aeiStatement: action.statement,
                    aeiCostCenter: action.responsible?.description || '',
                    iaeiCode: actionIndicator.code,
                    iaeiStatement: actionIndicator.statement,
                    iaeiCostCenter: actionIndicator.responsible?.description || '',
                    iaeiVariableCode: actionVariable.code,
                    iaeiVariableName: actionVariable.name
                  })
                }
              }
            }
          }
        }

        // Si no hay indicadores para el objetivo, crear filas solo con las acciones
        if (objectiveIndicators.length === 0) {
          for (const action of actions) {
            const actionIndicatorsResponse = await apiClient.get(`/indicators/action/${action.id}`)
            const actionIndicators = actionIndicatorsResponse.data

            for (const actionIndicator of actionIndicators) {
              const actionVariablesResponse = await apiClient.get(`/indicator-variables/indicator/${actionIndicator.id}`)
              const actionVariables = actionVariablesResponse.data

              for (const actionVariable of actionVariables) {
                structureRows.push({
                  plan: plan.name,
                  startYear: plan.startYear,
                  endYear: plan.endYear,
                  oeiCode: objective.code,
                  oeiStatement: objective.statement,
                  oeiCostCenter: objective.responsible?.description || '',
                  ioeiCode: '',
                  ioeiStatement: '',
                  ioeiCostCenter: '',
                  oeiVariableCode: '',
                  oeiVariableName: '',
                  aeiCode: action.code,
                  aeiStatement: action.statement,
                  aeiCostCenter: action.responsible?.description || '',
                  iaeiCode: actionIndicator.code,
                  iaeiStatement: actionIndicator.statement,
                  iaeiCostCenter: actionIndicator.responsible?.description || '',
                  iaeiVariableCode: actionVariable.code,
                  iaeiVariableName: actionVariable.name
                })
              }
            }
          }
        }
      }

      setPlanData(structureRows)
    } catch (error) {
      console.error('Error loading plan structure:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (planData.length === 0) return

    setIsExporting(true)
    
    try {
      const headers = [
        'Plan',
        'Año de inicio',
        'Año de finalización',
        'Código de OEI',
        'Enunciado de OEI',
        'Centro de costo responsable de OEI',
        'Código de IOEI',
        'Enunciado de IOEI',
        'Centro de costo responsable de IOEI',
        'Código de variable de OEI',
        'Enunciado de variable de OEI',
        'Código de AEI',
        'Enunciado de AEI',
        'Centro de costo responsable de AEI',
        'Código de IAEI',
        'Enunciado de IAEI',
        'Código de variable de IAEI',
        'Enunciado de variable de IAEI'
      ]

      const csv = [
        headers.join(','),
        ...planData.map(row => [
          row.plan,
          row.startYear,
          row.endYear,
          row.oeiCode,
          `"${row.oeiStatement.replace(/"/g, '""')}"`,
          row.oeiCostCenter,
          row.ioeiCode,
          `"${row.ioeiStatement.replace(/"/g, '""')}"`,
          row.ioeiCostCenter,
          row.oeiVariableCode,
          `"${row.oeiVariableName.replace(/"/g, '""')}"`,
          row.aeiCode,
          `"${row.aeiStatement.replace(/"/g, '""')}"`,
          row.aeiCostCenter,
          row.iaeiCode,
          `"${row.iaeiStatement.replace(/"/g, '""')}"`,
          row.iaeiCostCenter,
          row.iaeiVariableCode,
          `"${row.iaeiVariableName.replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `estructura_plan_${selectedPlan}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showDownloadNotification()
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    if (planData.length === 0) return

    setIsExporting(true)
    
    try {
      const headers = [
        'Plan',
        'Año de inicio',
        'Año de finalización',
        'Código de OEI',
        'Enunciado de OEI',
        'Centro de costo responsable de OEI',
        'Código de IOEI',
        'Enunciado de IOEI',
        'Centro de costo responsable de IOEI',
        'Código de variable de OEI',
        'Enunciado de variable de OEI',
        'Código de AEI',
        'Enunciado de AEI',
        'Centro de costo responsable de AEI',
        'Código de IAEI',
        'Enunciado de IAEI',
        'Código de variable de IAEI',
        'Enunciado de variable de IAEI'
      ]

      const wsData = [
        headers,
        ...planData.map(row => [
          row.plan,
          row.startYear,
          row.endYear,
          row.oeiCode,
          row.oeiStatement,
          row.oeiCostCenter,
          row.ioeiCode,
          row.ioeiStatement,
          row.ioeiCostCenter,
          row.oeiVariableCode,
          row.oeiVariableName,
          row.aeiCode,
          row.aeiStatement,
          row.aeiCostCenter,
          row.iaeiCode,
          row.iaeiStatement,
          row.iaeiCostCenter,
          row.iaeiVariableCode,
          row.iaeiVariableName
        ])
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Estructura del Plan')
      XLSX.writeFile(wb, `estructura_plan_${selectedPlan}_${new Date().toISOString().split('T')[0]}.xlsx`)

      showDownloadNotification()
    } catch (error) {
      console.error('Error exporting Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const showDownloadNotification = () => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  // Pagination
  const totalPages = Math.ceil(planData.length / itemsPerPage)
  const paginatedData = planData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reportes de Planes</h1>
        <p className="text-neutral-600">Visualiza y exporta la estructura estratégica completa de los planes institucionales</p>
      </div>

      {/* Filtro de Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FiFilter className="inline mr-2" />
              Seleccionar Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccione un plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.startYear} - {plan.endYear})
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div className="flex space-x-2 mt-6">
              <button
                onClick={exportToCSV}
                disabled={isExporting || planData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FiDownload className="mr-2" />
                Exportar CSV
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting || planData.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FiDownload className="mr-2" />
                Exportar Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Resultados */}
      {selectedPlan && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Año Inicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Año Fin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Código OEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado OEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    CC OEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Código IOEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado IOEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    CC IOEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Var. OEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado Var. OEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Código AEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado AEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    CC AEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Código IAEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado IAEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    CC IAEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Var. IAEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Enunciado Var. IAEI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-6 py-12 text-center text-neutral-500">
                      {loading ? 'Cargando datos...' : 'No hay datos disponibles para este plan'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.plan}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.startYear}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.endYear}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.oeiCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.oeiStatement}>
                          {row.oeiStatement}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.oeiCostCenter}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.ioeiCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.ioeiStatement}>
                          {row.ioeiStatement}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.ioeiCostCenter}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.oeiVariableCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.oeiVariableName}>
                          {row.oeiVariableName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.aeiCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.aeiStatement}>
                          {row.aeiStatement}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.aeiCostCenter}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.iaeiCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.iaeiStatement}>
                          {row.iaeiStatement}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.iaeiCostCenter}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">
                        {row.iaeiVariableCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        <div className="max-w-xs truncate" title={row.iaeiVariableName}>
                          {row.iaeiVariableName}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {planData.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-700">Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-neutral-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={70}>70</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-neutral-700">registros</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-neutral-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notificación de descarga */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <FiCheckCircle className="w-5 h-5" />
          <span>Descarga realizada correctamente</span>
        </div>
      )}
    </div>
  )
}
