import { useState, useEffect } from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import { plansService, StrategicPlan } from '@services/plansService'
import { indicatorDataService, IndicatorDataRecord } from '@services/indicatorDataService'
import { costCentersService, CostCenter } from '@services/costCentersService'
import { strategicObjectivesService, StrategicObjective } from '@services/strategicService'
import { strategicActionsService, StrategicAction } from '@services/strategicService'
import { indicatorsService, Indicator } from '@services/strategicService'
import { indicatorVariablesService, IndicatorVariable } from '@services/indicatorVariablesService'

// Interfaces
interface VariableIndicator {
  id: string
  costCenter: CostCenter
  objective: StrategicObjective
  action?: StrategicAction
  indicator: Indicator
  variable: IndicatorVariable
  plan: StrategicPlan
  pendingRecords: IndicatorDataRecord[]
}

interface ApprovalModalData {
  isOpen: boolean
  variableIndicator: VariableIndicator | null
  selectedRecords: Set<string>
  currentPage: number
  itemsPerPage: number
}

export default function Seguimiento() {
  const [activeTab, setActiveTab] = useState<'objectives' | 'actions'>('objectives')
  
  // Estados principales
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [selectedPlanObjectives, setSelectedPlanObjectives] = useState<string>('')
  const [selectedPlanActions, setSelectedPlanActions] = useState<string>('')
  const [variableIndicators, setVariableIndicators] = useState<VariableIndicator[]>([])
  const [loading, setLoading] = useState(false)
  
  // Obtener el plan seleccionado según la pestaña activa
  const selectedPlan = activeTab === 'objectives' ? selectedPlanObjectives : selectedPlanActions
  
  // Función para establecer el plan seleccionado según la pestaña
  const setSelectedPlan = (planId: string) => {
    if (activeTab === 'objectives') {
      setSelectedPlanObjectives(planId)
    } else {
      setSelectedPlanActions(planId)
    }
  }
  
  // Estados para el modal de aprobación
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData>({
    isOpen: false,
    variableIndicator: null,
    selectedRecords: new Set(),
    currentPage: 1,
    itemsPerPage: 10
  })
  
  // Estados para mensajes
  const [showMessage, setShowMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Cargar planes al inicio
  useEffect(() => {
    loadPlans()
  }, [])

  // Cargar variables cuando se selecciona un plan
  useEffect(() => {
    if (selectedPlan) {
      loadVariableIndicators()
    } else {
      setVariableIndicators([])
    }
  }, [selectedPlan, activeTab])

  const loadPlans = async () => {
    try {
      const plansData = await plansService.getAll()
      setPlans(plansData)
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  const loadVariableIndicators = async () => {
    setLoading(true)
    setVariableIndicators([])
    
    try {
      // Obtener todos los datos pendientes
      const pendingData = await indicatorDataService.getAll({ status: 'pending' })
      
      // Filtrar por plan y tipo (objetivos o acciones)
      const filteredData = pendingData.filter(record => {
        const recordPlan = record.variable?.indicator?.planId
        const planMatches = recordPlan === selectedPlan
        
        // Filtrar por tipo según la pestaña activa
        const indicator = record.variable?.indicator
        if (!indicator) return false
        
        if (activeTab === 'objectives') {
          // Para objetivos, mostrar solo indicadores que NO tienen actionId
          return planMatches && !indicator.actionId
        } else {
          // Para acciones, mostrar solo indicadores que SÍ tienen actionId
          return planMatches && indicator.actionId
        }
      })

      // Agrupar por variable y crear estructura de VariableIndicator
      const variableMap = new Map<string, VariableIndicator>()
      
      for (const record of filteredData) {
        const variableId = record.variableId
        
        if (!variableMap.has(variableId)) {
          // Obtener información completa - ahora el indicador está incluido en la respuesta
          const variable = record.variable
          const indicator = variable?.indicator
          const objective = indicator ? await strategicObjectivesService.getById(indicator.objectiveId) : null
          const action = indicator?.actionId ? await strategicActionsService.getById(indicator.actionId) : undefined
          const costCenter = record.costCenter || { id: 'N/A', code: 'N/A', description: 'Sin centro de costo' }
          const plan = indicator ? await plansService.getById(indicator.planId) : null

          if (variable && indicator && objective && plan) {
            variableMap.set(variableId, {
              id: variableId,
              costCenter,
              objective,
              action,
              indicator,
              variable,
              plan,
              pendingRecords: []
            })
          }
        }
        
        // Agregar el registro a la variable correspondiente
        const variableIndicator = variableMap.get(variableId)
        if (variableIndicator) {
          variableIndicator.pendingRecords.push(record)
        }
      }
      
      setVariableIndicators(Array.from(variableMap.values()))
    } catch (error) {
      console.error('Error loading variable indicators:', error)
      setShowMessage({ type: 'error', message: 'Error al cargar los datos' })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (variableIndicator: VariableIndicator) => {
    setApprovalModal({
      isOpen: true,
      variableIndicator,
      selectedRecords: new Set(),
      currentPage: 1,
      itemsPerPage: 10
    })
  }

  const handleRecordSelection = (recordId: string) => {
    setApprovalModal(prev => {
      const newSelected = new Set(prev.selectedRecords)
      if (newSelected.has(recordId)) {
        newSelected.delete(recordId)
      } else {
        newSelected.add(recordId)
      }
      return { ...prev, selectedRecords: newSelected }
    })
  }

  const handleSelectAll = () => {
    const paginatedRecords = getPaginatedRecords()
    const allSelected = paginatedRecords.every(record => approvalModal.selectedRecords.has(record.id))
    
    setApprovalModal(prev => {
      const newSelected = new Set(prev.selectedRecords)
      if (allSelected) {
        // Deseleccionar todos los registros de la página actual
        paginatedRecords.forEach(record => newSelected.delete(record.id))
      } else {
        // Seleccionar todos los registros de la página actual
        paginatedRecords.forEach(record => newSelected.add(record.id))
      }
      return { ...prev, selectedRecords: newSelected }
    })
  }

  const handleApprove = async () => {
    if (approvalModal.selectedRecords.size === 0) {
      setShowMessage({ type: 'error', message: 'Seleccione al menos un registro para aprobar' })
      return
    }

    try {
      const promises = Array.from(approvalModal.selectedRecords).map(recordId =>
        indicatorDataService.updateStatus(recordId, 'approved')
      )
      
      await Promise.all(promises)
      
      setShowMessage({ type: 'success', message: `${approvalModal.selectedRecords.size} registro(s) aprobado(s) exitosamente` })
      setApprovalModal({ isOpen: false, variableIndicator: null, selectedRecords: new Set(), currentPage: 1, itemsPerPage: 10 })
      loadVariableIndicators() // Recargar datos
      
      setTimeout(() => setShowMessage(null), 3000)
    } catch (error) {
      console.error('Error approving records:', error)
      setShowMessage({ type: 'error', message: 'Error al aprobar los registros' })
    }
  }

  const handleReject = async () => {
    if (approvalModal.selectedRecords.size === 0) {
      setShowMessage({ type: 'error', message: 'Seleccione al menos un registro para rechazar' })
      return
    }

    try {
      const promises = Array.from(approvalModal.selectedRecords).map(recordId =>
        indicatorDataService.updateStatus(recordId, 'rejected')
      )
      
      await Promise.all(promises)
      
      setShowMessage({ type: 'success', message: `${approvalModal.selectedRecords.size} registro(s) rechazado(s) exitosamente` })
      setApprovalModal({ isOpen: false, variableIndicator: null, selectedRecords: new Set(), currentPage: 1, itemsPerPage: 10 })
      loadVariableIndicators() // Recargar datos
      
      setTimeout(() => setShowMessage(null), 3000)
    } catch (error) {
      console.error('Error rejecting records:', error)
      setShowMessage({ type: 'error', message: 'Error al rechazar los registros' })
    }
  }

  const getPaginatedRecords = () => {
    if (!approvalModal.variableIndicator) return []
    
    const startIndex = (approvalModal.currentPage - 1) * approvalModal.itemsPerPage
    const endIndex = startIndex + approvalModal.itemsPerPage
    return approvalModal.variableIndicator.pendingRecords.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    if (!approvalModal.variableIndicator) return 0
    return Math.ceil(approvalModal.variableIndicator.pendingRecords.length / approvalModal.itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setApprovalModal(prev => ({ ...prev, currentPage: page }))
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setApprovalModal(prev => ({ ...prev, itemsPerPage, currentPage: 1 }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seguimiento</h1>
        <p className="text-gray-600">Revisión y aprobación de datos registrados por operadores</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('objectives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'objectives'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Variables de Objetivos Estratégicos
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Variables de Acciones Estratégicas
          </button>
        </nav>
      </div>

      {/* Plan Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan Estratégico
        </label>
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccione un plan</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      )}

      {/* Variables Table */}
      {!loading && selectedPlan && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Variables de Indicadores</h2>
          </div>
          
          {variableIndicators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay variables con datos pendientes de aprobación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro de Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Objetivo
                    </th>
                    {activeTab === 'actions' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción Estratégica
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variableIndicators.map(variableIndicator => (
                    <tr key={variableIndicator.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{variableIndicator.costCenter.code}</div>
                          <div className="text-gray-500">{variableIndicator.costCenter.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{variableIndicator.objective.code}</div>
                          <div className="text-gray-500">{variableIndicator.objective.name}</div>
                        </div>
                      </td>
                      {activeTab === 'actions' && variableIndicator.action && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{variableIndicator.action.code}</div>
                            <div className="text-gray-500">{variableIndicator.action.name}</div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{variableIndicator.indicator.code}</div>
                          <div className="text-gray-500">{variableIndicator.indicator.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{variableIndicator.variable.id}</div>
                          <div className="text-gray-500">{variableIndicator.variable.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleApproveClick(variableIndicator)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FiCheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.variableIndicator && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Datos de la variable: {approvalModal.variableIndicator.variable.id} - {approvalModal.variableIndicator.variable.name}
              </h3>
              <button
                onClick={() => setApprovalModal({ isOpen: false, variableIndicator: null, selectedRecords: new Set(), currentPage: 1, itemsPerPage: 10 })}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Records Table */}
            <div className="mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={getPaginatedRecords().length > 0 && getPaginatedRecords().every(record => approvalModal.selectedRecords.has(record.id))}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Centro de Costo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      {approvalModal.variableIndicator.variable.fields.map(field => (
                        <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label || field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedRecords().map(record => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={approvalModal.selectedRecords.has(record.id)}
                            onChange={() => handleRecordSelection(record.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.costCenter?.code || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.year}
                        </td>
                        {approvalModal.variableIndicator.variable.fields.map(field => (
                          <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.values[field.name] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Mostrar:</label>
                  <select
                    value={approvalModal.itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={70}>70</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Página {approvalModal.currentPage} de {getTotalPages()}
                  </span>
                  <button
                    onClick={() => handlePageChange(approvalModal.currentPage - 1)}
                    disabled={approvalModal.currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(approvalModal.currentPage + 1)}
                    disabled={approvalModal.currentPage === getTotalPages()}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setApprovalModal({ isOpen: false, variableIndicator: null, selectedRecords: new Set(), currentPage: 1, itemsPerPage: 10 })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={approvalModal.selectedRecords.size === 0}
                className="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                onClick={handleApprove}
                disabled={approvalModal.selectedRecords.size === 0}
                className="px-4 py-2 border border-green-300 rounded-md text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {showMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showMessage.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {showMessage.message}
        </div>
      )}
    </div>
  )
}
