import React, { useState, useEffect } from 'react'
import { FiDownload, FiEye, FiFilter, FiCalendar } from 'react-icons/fi'
import apiClient from '@services/api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface StrategicPlan {
  id: string
  name: string
  year: number
}

interface StrategicObjective {
  id: string
  code: string
  statement: string
  planId: string
}

interface StrategicAction {
  id: string
  code: string
  statement: string
  objectiveId: string
}

interface Indicator {
  id: string
  code: string
  statement: string
  objectiveId?: string
  actionId?: string
}

interface IndicatorVariable {
  id: string
  code: string
  name: string
  fields?: Array<{
    id: string
    name: string
    type: string
    label: string
    required: boolean
  }>
  indicator?: {
    code: string
    statement: string
  }
  objective?: {
    code: string
    statement: string
  }
}

interface CostCenter {
  id: string
  code: string
  description?: string
}

interface IndicatorData {
  id: string
  variableId: string
  costCenterId?: string
  costCenterCode: string
  costCenter?: CostCenter
  year: number
  values: Record<string, any>
  status: string
  createdAt: string
  updatedAt: string
  variable: IndicatorVariable
}

export default function ReportesVariables() {
  const [activeTab, setActiveTab] = useState<'objectives' | 'actions'>('objectives')
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedObjective, setSelectedObjective] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedIndicator, setSelectedIndicator] = useState<string>('')
  
  // Data
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [actions, setActions] = useState<StrategicAction[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [variables, setVariables] = useState<IndicatorVariable[]>([])
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([])
  
  // Modal state
  const [showDataModal, setShowDataModal] = useState(false)
  const [selectedVariableData, setSelectedVariableData] = useState<IndicatorData[]>([])
  const [selectedVariableFields, setSelectedVariableFields] = useState<any[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (selectedPlan) {
      loadObjectives()
      loadActions()
    } else {
      setObjectives([])
      setActions([])
      setSelectedObjective('')
      setSelectedAction('')
      setIndicators([])
      setSelectedIndicator('')
      setVariables([])
      setIndicatorData([])
    }
  }, [selectedPlan])

  // Cargar indicadores cuando cambia el objetivo (en pestaña objetivos)
  // o cuando cambia la acción (en pestaña acciones)
  useEffect(() => {
    if (activeTab === 'objectives' && selectedObjective) {
      loadIndicators()
    } else if (activeTab === 'actions' && selectedAction) {
      loadIndicators()
    } else {
      setIndicators([])
      setSelectedIndicator('')
      setVariables([])
      setIndicatorData([])
    }
  }, [activeTab, selectedObjective, selectedAction])

  useEffect(() => {
    if (selectedIndicator) {
      loadVariables()
    } else {
      setVariables([])
      setIndicatorData([])
    }
  }, [selectedIndicator])

  // Limpiar filtros al cambiar de pestaña (mantener el plan seleccionado)
  useEffect(() => {
    setSelectedObjective('')
    setSelectedAction('')
    setSelectedIndicator('')
    setObjectives([])
    setActions([])
    setIndicators([])
    setVariables([])
    setIndicatorData([])
    // NO limpiar selectedPlan para mantener el flujo de trabajo
  }, [activeTab])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/plans')
      setPlans(response.data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadObjectives = async () => {
    try {
      const response = await apiClient.get(`/strategic-objectives/plan/${selectedPlan}`)
      setObjectives(response.data)
    } catch (error) {
      console.error('Error loading objectives:', error)
    }
  }

  const loadActions = async () => {
    try {
      const response = await apiClient.get(`/strategic-actions/plan/${selectedPlan}`)
      setActions(response.data)
    } catch (error) {
      console.error('Error loading actions:', error)
    }
  }

  const loadIndicators = async () => {
    try {
      let url = '/indicators'
      if (activeTab === 'objectives' && selectedObjective) {
        url = `/strategic-objectives/${selectedObjective}/indicators`
      } else if (activeTab === 'actions' && selectedAction) {
        url = `/strategic-actions/${selectedAction}/indicators`
      }
      
      const response = await apiClient.get(url)
      setIndicators(response.data)
    } catch (error) {
      console.error('Error loading indicators:', error)
    }
  }

  const loadVariables = async () => {
    try {
      const [variablesResponse, indicatorResponse] = await Promise.all([
        apiClient.get(`/indicator-variables/indicator/${selectedIndicator}`),
        apiClient.get(`/indicators/${selectedIndicator}`)
      ])
      
      // Obtener información del objetivo si es un indicador de objetivos estratégicos
      let objectiveInfo = null
      if (indicatorResponse.data.objectiveId && activeTab === 'objectives') {
        try {
          const objectiveResponse = await apiClient.get(`/strategic-objectives/${indicatorResponse.data.objectiveId}`)
          objectiveInfo = {
            code: objectiveResponse.data.code,
            statement: objectiveResponse.data.statement
          }
        } catch (error) {
          console.error('Error loading objective:', error)
        }
      }
      
      // Agregar información del indicador y objetivo a cada variable
      const variablesWithInfo = variablesResponse.data.map((variable: any) => ({
        ...variable,
        indicator: {
          code: indicatorResponse.data.code,
          statement: indicatorResponse.data.statement
        },
        objective: objectiveInfo
      }))
      
      setVariables(variablesWithInfo)
      loadIndicatorData(selectedIndicator)
    } catch (error) {
      console.error('Error loading variables:', error)
    }
  }

  const loadIndicatorData = async (indicatorId: string) => {
    try {
      // Primero obtener las variables del indicador con su información completa
      const variablesResponse = await apiClient.get(`/indicator-variables/indicator/${indicatorId}`)
      const variables = variablesResponse.data
      
      // Obtener información del indicador
      const indicatorResponse = await apiClient.get(`/indicators/${indicatorId}`)
      const indicatorInfo = indicatorResponse.data
      
      // Obtener información del objetivo si aplica
      let objectiveInfo = null
      if (indicatorInfo.objectiveId && activeTab === 'objectives') {
        try {
          const objectiveResponse = await apiClient.get(`/strategic-objectives/${indicatorInfo.objectiveId}`)
          objectiveInfo = {
            code: objectiveResponse.data.code,
            statement: objectiveResponse.data.statement
          }
        } catch (error) {
          console.error('Error loading objective:', error)
        }
      }
      
      // Luego obtener los datos para cada variable
      const dataPromises = variables.map(async (variable: any) => {
        const dataResponse = await apiClient.get(`/indicator-data/variable/${variable.id}?status=APPROVED`)
        return dataResponse.data.map((data: any) => ({
          ...data,
          variable: {
            ...variable,
            indicator: {
              code: indicatorInfo.code,
              statement: indicatorInfo.statement
            },
            objective: objectiveInfo
          }
        }))
      })
      
      const allData = await Promise.all(dataPromises)
      const flattenedData = allData.flat()
      setIndicatorData(flattenedData)
    } catch (error) {
      console.error('Error loading indicator data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewData = (variableId: string) => {
    const data = indicatorData.filter(d => d.variableId === variableId)
    
    // Obtener los fields de la variable desde el primer registro que tenga la información
    if (data.length > 0 && data[0].variable?.fields) {
      setSelectedVariableFields(data[0].variable.fields)
    } else {
      setSelectedVariableFields([])
    }
    
    setSelectedVariableData(data)
    setCurrentPage(1)
    setShowDataModal(true)
  }

  // Función para formatear valores según el tipo de field
  const formatFieldValue = (fieldName: string, value: any): string => {
    if (value === null || value === undefined) return '-'

    const field = selectedVariableFields.find(f => f.name === fieldName)
    if (!field) return String(value)

    switch (field.type) {
      case 'currency':
        return typeof value === 'number' 
          ? `S/ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
          : value
      case 'decimal':
        return typeof value === 'number' ? value.toFixed(2) : value
      case 'date':
        return value ? new Date(value).toLocaleDateString('es-ES') : '-'
      case 'time':
        return value || '-'
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'coordinates':
        if (value && typeof value === 'object') {
          // Intentar ambos formatos (latitude/longitude o lat/lng)
          const lat = value.latitude !== undefined ? value.latitude : value.lat
          const lng = value.longitude !== undefined ? value.longitude : value.lng
          if (lat !== undefined && lng !== undefined) {
            return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
          }
        }
        return '-'
      default:
        return String(value)
    }
  }

  // Calcular datos paginados
  const paginatedData = selectedVariableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(selectedVariableData.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reiniciar a la primera página
  }

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    // Exportar datos de la tabla de variables
    if (variables.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const headers = ['Código', 'Enunciado']
    const data = variables.map(v => [v.code, v.name])
    
    if (format === 'csv') {
      exportToCSV(headers, data, 'variables-indicadores')
    } else if (format === 'excel') {
      exportToExcel(headers, data, 'variables-indicadores')
    } else if (format === 'pdf') {
      exportToPDF(headers, data, 'Reporte de Variables de Indicadores')
    }
  }

  const exportVariableData = (format: 'csv' | 'excel' | 'pdf') => {
    // Exportar datos del modal (registros de la variable)
    if (paginatedData.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Preparar encabezados dinámicamente según la pestaña activa
    const headers = [
      'Centro de Costo'
    ]

    // Agregar columnas de objetivo si es de objetivos estratégicos
    if (activeTab === 'objectives' && paginatedData[0]?.variable?.objective) {
      headers.push('Código OEI', 'Enunciado de objetivo')
    }

    // Agregar columnas de indicador y variable (siempre)
    headers.push(
      'Código de Indicador',
      'Enunciado del indicador',
      'Código de variable',
      'Enunciado de la variable',
      'Año'
    )

    // Agregar campos dinámicos de la variable
    headers.push(...selectedVariableFields.map(f => f.label))

    // Agregar columnas finales
    headers.push('Estado', 'Fecha de Creación')

    // Preparar filas
    const rows = paginatedData.map(data => {
      const row = [
        data.costCenterCode
      ]

      // Agregar datos de objetivo si aplica
      if (activeTab === 'objectives' && data.variable?.objective) {
        row.push(
          data.variable.objective.code,
          data.variable.objective.statement
        )
      }

      // Agregar datos de indicador y variable (siempre)
      row.push(
        data.variable?.indicator?.code || '',
        data.variable?.indicator?.statement || '',
        data.variable?.code || '',
        data.variable?.name || '',
        String(data.year)
      )

      // Agregar valores de campos dinámicos
      row.push(...selectedVariableFields.map(f => formatFieldValue(f.name, data.values[f.name])))

      // Agregar datos finales
      row.push(
        data.status,
        new Date(data.createdAt).toLocaleDateString()
      )

      return row
    })

    if (format === 'csv') {
      exportToCSV(headers, rows, 'datos-variables')
    } else if (format === 'excel') {
      exportToExcel(headers, rows, 'datos-variables')
    } else if (format === 'pdf') {
      exportToPDF(headers, rows, 'Reporte de Datos de Variables')
    }
  }

  // Funciones auxiliares de exportación
  const exportToCSV = (headers: string[], data: any[][], filename: string) => {
    const csv = [
      headers.join(','),
      ...data.map(row => 
        row.map(cell => {
          const cellValue = String(cell || '')
          // Escapar comillas y encomillar si contiene comas
          return cellValue.includes(',') ? `"${cellValue.replace(/"/g, '""')}"` : cellValue
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = (headers: string[], data: any[][], filename: string) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Datos')
    
    // Ajustar ancho de columnas
    const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportToPDF = (headers: string[], data: any[][], title: string) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text(title, 14, 15)

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 25)

    ;(doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [12, 142, 204],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14, right: 14 }
    })

    doc.save(`${title.toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportData_old = (format: 'csv' | 'excel' | 'pdf') => {
    // Implement export functionality
    console.log(`Exporting data as ${format}`)
    // TODO: Implement actual export functionality
  }

  const exportVariableData_old = (format: 'csv' | 'excel' | 'pdf') => {
    // Export modal data
    console.log(`Exporting variable data as ${format}`)
    // TODO: Implement actual export functionality
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes de Variables</h1>
        <p className="text-gray-600">Visualice y exporte datos de variables de indicadores</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('objectives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'objectives'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Variables de Indicadores de Objetivos Estratégicos
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Variables de Indicadores de Acciones Estratégicas
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FiFilter className="mr-2" />
          Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Estratégico
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccione un plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          {/* Objective/Action Filter */}
          {activeTab === 'objectives' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo Estratégico
              </label>
              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedPlan}
              >
                <option value="">Seleccione un objetivo</option>
                {objectives.map(objective => (
                  <option key={objective.id} value={objective.id}>
                    {objective.code} - {objective.statement}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo Estratégico
              </label>
              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedPlan}
              >
                <option value="">Seleccione un objetivo</option>
                {objectives.map(objective => (
                  <option key={objective.id} value={objective.id}>
                    {objective.code} - {objective.statement}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Filter (only for actions tab) */}
          {activeTab === 'actions' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acción Estratégica
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedObjective}
              >
                <option value="">Seleccione una acción</option>
                {actions
                  .filter(action => !selectedObjective || action.objectiveId === selectedObjective)
                  .map(action => (
                    <option key={action.id} value={action.id}>
                      {action.code} - {action.statement}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Indicator Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicador
            </label>
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={activeTab === 'objectives' ? !selectedObjective : !selectedAction}
            >
              <option value="">Seleccione un indicador</option>
              {indicators.map(indicator => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.code} - {indicator.statement}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Variables del Indicador</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">Cargando variables...</div>
          </div>
        ) : variables.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">
              {selectedIndicator ? 'No hay variables para este indicador' : 'Seleccione un indicador para ver sus variables'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código de Variable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enunciado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variables.map(variable => (
                  <tr key={variable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variable.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {variable.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleViewData(variable.id)}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <FiEye className="mr-1" />
                        Ver datos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Datos de la Variable</h3>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => exportVariableData('csv')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <FiDownload className="mr-2" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => exportVariableData('excel')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FiDownload className="mr-2" />
                  Exportar Excel
                </button>
                <button
                  onClick={() => exportVariableData('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                  <FiDownload className="mr-2" />
                  Exportar PDF
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-10 bg-gray-50">
                        Centro de Costo
                      </th>
                      
                      {/* Columnas informativas del objetivo, indicador y variable */}
                      {activeTab === 'objectives' && selectedVariableData[0]?.variable?.objective && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Código OEI
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Enunciado de objetivo
                          </th>
                        </>
                      )}
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Código de Indicador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Enunciado del indicador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Código de variable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Enunciado de la variable
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Año
                      </th>
                      
                      {/* Columnas dinámicas de campos */}
                      {selectedVariableFields.map(field => (
                        <th
                          key={field.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          title={field.label}
                        >
                          {field.label}
                        </th>
                      ))}
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Fecha de Creación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map(data => (
                      <tr key={data.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap sticky left-0 z-10 bg-white hover:bg-gray-50">
                          <div className="font-medium">{data.costCenterCode}</div>
                          {data.costCenter?.description && (
                            <div className="text-xs text-gray-500">{data.costCenter.description}</div>
                          )}
                        </td>
                        
                        {/* Columnas informativas del objetivo, indicador y variable */}
                        {activeTab === 'objectives' && data.variable?.objective && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              <div className="font-medium">{data.variable.objective.code}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={data.variable.objective.statement}>
                                {data.variable.objective.statement}
                              </div>
                            </td>
                          </>
                        )}
                        
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <div className="font-medium">{data.variable?.indicator?.code}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={data.variable?.indicator?.statement}>
                            {data.variable?.indicator?.statement}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <div className="font-medium">{data.variable?.code}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={data.variable?.name}>
                            {data.variable?.name}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.year}
                        </td>
                        
                        {/* Celdas dinámicas con valores de cada campo */}
                        {selectedVariableFields.map(field => (
                          <td key={field.id} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {formatFieldValue(field.name, data.values[field.name])}
                          </td>
                        ))}
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            data.status === 'APPROVED' || data.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : data.status === 'PENDING' || data.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {data.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(data.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación Profesional */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={70}>70</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">registros</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>

                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages} ({selectedVariableData.length} registros totales)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
