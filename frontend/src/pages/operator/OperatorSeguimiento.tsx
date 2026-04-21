import React, { useState, useEffect } from 'react'
import { FiEye, FiEdit, FiTrash2, FiTarget, FiZap, FiSave, FiX, FiDatabase, FiCheckCircle } from 'react-icons/fi'
import apiClient from '@services/api'
import { useAuth } from '@context/AuthContext'
import { strategicObjectivesService, strategicActionsService, indicatorsService } from '@services/strategicService'
import { type FormField } from '@services/indicatorVariablesService'

// Interfaces
interface Plan {
  id: string
  name: string
  startYear: number
  endYear: number
}

interface StrategicObjective {
  id: string
  planId: string
  code: string
  statement: string
}

interface StrategicAction {
  id: string
  planId: string
  objectiveId?: string
  code: string
  statement: string
}

interface Indicator {
  id: string
  planId?: string
  objectiveId?: string
  actionId?: string
  code: string
  statement: string
  formula?: string
  parameter?: string
  baseYear?: number
  baseValue?: number
}

interface IndicatorVariable {
  id: string
  indicatorId: string
  code: string
  name: string
  description?: string
  fields: VariableField[]
}

// VariableField es alias de FormField del backend
type VariableField = FormField

interface IndicatorData {
  id: string
  indicatorId: string
  variableId: string
  costCenterId: string
  costCenterCode: string
  year: number
  values: { [key: string]: any }
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface FormData {
  year: number
  values: { [key: string]: any }
}

type ActiveTab = 'objectives' | 'actions'

export default function OperatorSeguimiento() {
  const { user } = useAuth()
  const userCostCenterId = user?.costCenter?.id || ''
  
  // Estados de navegación
  const [activeTab, setActiveTab] = useState<ActiveTab>('objectives')
  
  // Estados de datos
  const [plans, setPlans] = useState<Plan[]>([])
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [actions, setActions] = useState<StrategicAction[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [variables, setVariables] = useState<IndicatorVariable[]>([])
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([])
  const [_costCenters, setCostCenters] = useState<any[]>([])
  
  // Estados de selección
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedObjective, setSelectedObjective] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [expandedObjectives, setExpandedObjectives] = useState<string[]>([])
  const [expandedActions, setExpandedActions] = useState<string[]>([])
  const [expandedIndicators, setExpandedIndicators] = useState<string[]>([])
  const [selectedIndicator, setSelectedIndicator] = useState<string>('')
  const [selectedVariable, setSelectedVariable] = useState<string>('')
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IndicatorData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    year: new Date().getFullYear(),
    values: {}
  })
  const [formLoading, setFormLoading] = useState(false)
  
  // Estados de paginación y selección
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPlans()
    loadCostCenters()
  }, [])

  // ✅ NUEVO: Limpiar estado cuando cambia de pestaña
  useEffect(() => {
    // Reiniciar todos los estados específicos de la pestaña
    setSelectedObjective('')
    setSelectedAction('')
    setSelectedIndicator('')
    setSelectedVariable('')
    setIndicators([])
    setVariables([])
    setIndicatorData([])
    setCurrentPage(1)
    setSelectedRecords(new Set())
    setFormData({
      year: new Date().getFullYear(),
      values: {}
    })
    setEditingRecord(null)
    setShowFormModal(false)
    setExpandedIndicators([])
  }, [activeTab]) // Ejecutar cuando activeTab cambia

  useEffect(() => {
    if (selectedPlan) {
      loadObjectives()
      loadActions()
    }
  }, [selectedPlan])

  useEffect(() => {
    if (selectedObjective) {
      loadIndicators(selectedObjective)
    }
  }, [selectedObjective])

  useEffect(() => {
    if (selectedAction) {
      loadIndicators(undefined, selectedAction)
    }
  }, [selectedAction])

  useEffect(() => {
    if (selectedIndicator) {
      loadVariables(selectedIndicator)
    }
  }, [selectedIndicator])

  useEffect(() => {
    if (selectedVariable) {
      loadIndicatorData(selectedVariable)
    }
  }, [selectedVariable])

  const loadPlans = async () => {
    try {
      const response = await apiClient.get('/plans')
      setPlans(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlans([])
    }
  }

  const loadCostCenters = async () => {
    try {
      const response = await apiClient.get('/cost-centers')
      setCostCenters(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading cost centers:', error)
      setCostCenters([])
    }
  }

  const loadObjectives = async () => {
    try {
      // Cargar todos los objetivos del plan
      const allObjectives = await strategicObjectivesService.getAll()
      
      // Cargar indicadores de cada objetivo para filtrar por centro de costo
      const objectivesWithIndicators = await Promise.all(
        allObjectives.map(async (objective) => {
          const indicators = await indicatorsService.getByObjective(objective.id)
          // Filtrar indicadores por centro de costo del operador
          const operatorIndicators = indicators.filter(
            indicator => indicator.responsibleId === userCostCenterId
          )
          
          return {
            ...objective,
            hasOperatorIndicators: operatorIndicators.length > 0,
            operatorIndicators: operatorIndicators
          }
        })
      )
      
      // Solo mostrar objetivos que tienen indicadores asignados al centro de costo del operador
      const filteredObjectives = objectivesWithIndicators.filter(
        obj => obj.hasOperatorIndicators
      )
      
      setObjectives(filteredObjectives)
    } catch (error) {
      console.error('Error loading objectives:', error)
    }
  }

  const loadActions = async () => {
    try {
      // Cargar todas las acciones del plan
      const allActions = await strategicActionsService.getAll()
      
      // Cargar indicadores de cada acción para filtrar por centro de costo
      const actionsWithIndicators = await Promise.all(
        allActions.map(async (action) => {
          const indicators = await indicatorsService.getByAction(action.id)
          // Filtrar indicadores por centro de costo del operador
          const operatorIndicators = indicators.filter(
            indicator => indicator.responsibleId === userCostCenterId
          )
          
          return {
            ...action,
            hasOperatorIndicators: operatorIndicators.length > 0,
            operatorIndicators: operatorIndicators
          }
        })
      )
      
      // Solo mostrar acciones que tienen indicadores asignados al centro de costo del operador
      const filteredActions = actionsWithIndicators.filter(
        action => action.hasOperatorIndicators
      )
      
      // Agrupar acciones por objetivo para mostrar en la estructura jerárquica
      const actionsByObjective = filteredActions.reduce((acc, action) => {
        if (!acc[action.objectiveId || '']) {
          acc[action.objectiveId || ''] = []
        }
        acc[action.objectiveId || ''].push(action)
        return acc
      }, {} as Record<string, StrategicAction[]>)
      
      setActions(Object.values(actionsByObjective).flat())
    } catch (error) {
      console.error('Error loading actions:', error)
    }
  }

  const loadIndicators = async (objectiveId?: string, actionId?: string) => {
    try {
      let data
      if (objectiveId) {
        data = await indicatorsService.getByObjective(objectiveId)
      } else if (actionId) {
        data = await indicatorsService.getByAction(actionId)
      }
      
      // Filtrar indicadores por centro de costo del operador
      const filteredIndicators = data?.filter(
        indicator => indicator.responsibleId === userCostCenterId
      ) || []
      
      setIndicators(filteredIndicators)
    } catch (error) {
      console.error('Error loading indicators:', error)
      setIndicators([])
    }
  }

  const loadVariables = async (indicatorId: string) => {
    try {
      const response = await apiClient.get(`/indicator-variables/indicator/${indicatorId}`)
      const allVariables = Array.isArray(response.data) ? response.data : []
      
      console.log('VARIABLES LOADED:', {
        indicatorId,
        totalVariables: allVariables.length,
        variables: allVariables.map(v => ({
          id: v.id,
          code: v.code,
          name: v.name,
          indicatorId: v.indicatorId
        })),
        userCostCenterId
      })
      
      // Las variables no tienen costCenterId - se asignan por indicador
      // El indicador ya está filtrado por centro de costo del operador
      setVariables(allVariables)
    } catch (error) {
      console.error('Error loading variables:', error)
      setVariables([])
    }
  }

  const loadIndicatorData = async (variableId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/indicator-data/variable/${variableId}`)
      setIndicatorData(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading indicator data:', error)
      setIndicatorData([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (type: 'objective' | 'action' | 'indicator', id: string) => {
    const setter = type === 'objective' ? setExpandedObjectives : 
                  type === 'action' ? setExpandedActions : setExpandedIndicators
    // const current = type === 'objective' ? expandedObjectives : 
    //                type === 'action' ? expandedActions : expandedIndicators
    
    setter(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleObjectiveClick = (objectiveId: string) => {
    toggleExpanded('objective', objectiveId)
    setSelectedObjective(objectiveId) // Actualizar estado para que useEffect se ejecute
  }

  const handleActionClick = (actionId: string) => {
    toggleExpanded('action', actionId)
    setSelectedAction(actionId) // Actualizar estado para que useEffect se ejecute
  }

  const handleIndicatorClick = (indicatorId: string) => {
    toggleExpanded('indicator', indicatorId)
    setSelectedIndicator(indicatorId) // Actualizar estado para que useEffect se ejecute
  }

  const handleVariableClick = (variableId: string) => {
    setSelectedVariable(variableId) // Ya lo hace correctamente
    // El useEffect se ejecutará y cargará los datos
    // Solo cargar los datos, no abrir el modal de formulario
  }

  const handleAddNewRecord = async (variableId: string) => {
    console.log('=== DEBUG: handleAddNewRecord ===')
    console.log('Variable ID:', variableId)
    console.log('Current variables:', variables.length)
    
    setSelectedVariable(variableId)
    const variable = variables.find(v => v.id === variableId)
    
    if (variable) {
      setSelectedIndicator(variable.indicatorId)
      console.log('Variable found:', variable.name)
      console.log('Indicator ID:', variable.indicatorId)
    } else {
      console.log('Variable not found, loading from API...')
      try {
        // Intentar obtener la variable directamente
        const response = await apiClient.get(`/indicator-variables/${variableId}`)
        if (response.data) {
          setSelectedIndicator(response.data.indicatorId)
          console.log('Variable loaded from API:', response.data.name)
        }
      } catch (error) {
        console.error('Error loading variable:', error)
        alert('Error al cargar la variable')
        return
      }
    }
    
    setShowFormModal(true)
    setEditingRecord(null)
    setFormData({
      year: new Date().getFullYear(),
      values: {}
    })
    console.log('=== END DEBUG: handleAddNewRecord ===')
  }

  const handleEditRecord = async (record: IndicatorData) => {
    console.log('=== DEBUG: handleEditRecord ===')
    console.log('Record to edit:', record)
    console.log('Current variables:', variables.length)
    
    // Primero asegurarse de que las variables estén cargadas
    if (variables.length === 0 || !variables.find(v => v.id === record.variableId)) {
      console.log('Variables not loaded, loading from indicator...')
      try {
        // Cargar variables del indicador del registro
        const response = await apiClient.get(`/indicator-variables/indicator/${record.indicatorId}`)
        const loadedVariables = Array.isArray(response.data) ? response.data : []
        setVariables(loadedVariables)
        console.log('Loaded variables:', loadedVariables.length)
      } catch (error) {
        console.error('Error loading variables for edit:', error)
        alert('Error al cargar las variables para editar')
        return
      }
    }
    
    // Ahora configurar el formulario para edición
    setEditingRecord(record)
    setSelectedVariable(record.variableId)
    
    // Cargar el indicador asociado
    const variable = variables.find(v => v.id === record.variableId) || 
                    (await apiClient.get(`/indicator-variables/indicator/${record.indicatorId}`).then(res => 
                      Array.isArray(res.data) ? res.data.find((v: any) => v.id === record.variableId) : null
                    ))
    
    if (variable) {
      setSelectedIndicator(variable.indicatorId)
    }
    
    setFormData({
      year: record.year,
      values: record.values
    })
    setShowFormModal(true)
    
    console.log('=== END DEBUG: handleEditRecord ===')
  }

  const handleSendToApproval = async (recordId: string) => {
    try {
      await apiClient.patch(`/indicator-data/${recordId}`, { status: 'PENDING' })
      loadIndicatorData(selectedVariable)
      alert('Registro enviado a aprobación exitosamente')
    } catch (error) {
      console.error('Error sending to approval:', error)
      alert('Error al enviar a aprobación')
    }
  }

  const handleSendMultipleToApproval = async () => {
    if (selectedRecords.size === 0) {
      alert('Seleccione al menos un registro para enviar a aprobación')
      return
    }

    if (window.confirm(`¿Está seguro de enviar ${selectedRecords.size} registro(s) a aprobación?`)) {
      try {
        const promises = Array.from(selectedRecords).map(recordId => 
          apiClient.patch(`/indicator-data/${recordId}`, { status: 'PENDING' })
        )
        await Promise.all(promises)
        loadIndicatorData(selectedVariable)
        setSelectedRecords(new Set())
        alert('Registros enviados a aprobación exitosamente')
      } catch (error) {
        console.error('Error sending multiple to approval:', error)
        alert('Error al enviar registros a aprobación')
      }
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await apiClient.delete(`/indicator-data/${recordId}`)
        loadIndicatorData(selectedVariable)
        setSelectedRecords(prev => {
          const updated = new Set(prev)
          updated.delete(recordId)
          return updated
        })
      } catch (error) {
        console.error('Error deleting record:', error)
        alert('Error al eliminar el registro')
      }
    }
  }

  // Funciones de paginación y selección
  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return indicatorData.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(indicatorData.length / itemsPerPage)
  }

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev => {
      const updated = new Set(prev)
      if (updated.has(recordId)) {
        updated.delete(recordId)
      } else {
        updated.add(recordId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    const visibleRecords = getPaginatedRecords()
    if (selectedRecords.size === visibleRecords.length && visibleRecords.length > 0) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(visibleRecords.map(r => r.id)))
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleFormSubmit = async (e: React.FormEvent, action: 'save' | 'send') => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const payload = {
        variableId: selectedVariable,
        costCenterId: user?.costCenter?.id || editingRecord?.costCenterId || null,
        year: formData.year,
        values: formData.values,
        status: action === 'send' ? 'PENDING' : 'DRAFT'
      }

      if (editingRecord) {
        await apiClient.put(`/indicator-data/${editingRecord.id}`, payload)
      } else {
        await apiClient.post('/indicator-data', payload)
      }
      
      setShowFormModal(false)
      setEditingRecord(null)
      setFormData({
        year: new Date().getFullYear(),
        values: {}
      })
      loadIndicatorData(selectedVariable)
      
      // Mostrar mensaje apropiado
      if (action === 'send') {
        alert('Datos enviados a aprobación exitosamente')
      } else {
        alert('Datos guardados como borrador exitosamente')
      }
    } catch (error) {
      console.error('Error saving data:', error)
      alert(`Error al ${action === 'send' ? 'enviar' : 'guardar'} los datos`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [fieldName]: value
      }
    }))
  }

  const getIndicatorsCount = (objectiveId?: string, actionId?: string) => {
    return indicators.filter(ind => 
      (objectiveId && ind.objectiveId === objectiveId) ||
      (actionId && ind.actionId === actionId)
    ).length
  }

  const formatFieldName = (fieldName: string) => {
    // Convierte "Tipo_Riesgo_Peligro" a "Tipo de riesgo o peligro"
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b(\w)/g, (s) => s.toUpperCase())
      .replace(/\bA\b/g, 'a')
  }

  // Función para formatear valores según su tipo
  const formatFieldValue = (value: any, fieldType?: string) => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    // Manejar objetos de coordenadas
    if (fieldType === 'coordinates' && typeof value === 'object' && value !== null) {
      const { latitude, longitude } = value
      if (latitude !== undefined && longitude !== undefined) {
        return `Lat: ${latitude}, Lng: ${longitude}`
      }
      return 'Coordenadas no disponibles'
    }

    // Manejar otros tipos de objetos
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value)
    }

    // Para valores primitivos, devolverlos directamente
    return String(value)
  }

  const renderFormField = (field: VariableField) => {
    const value = formData.values[field.name] || ''
    const coordinateValue = typeof value === 'object' ? value : { latitude: '', longitude: '' }

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={field.placeholder || `Ingrese ${formatFieldName(field.name)}`}
            required={field.required}
          />
        )
      case 'integer':
        return (
          <input
            type="number"
            step="1"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || '')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={field.placeholder || `Ingrese ${formatFieldName(field.name)}`}
            required={field.required}
          />
        )
      case 'decimal':
      case 'currency':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || '')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={field.placeholder || `Ingrese ${formatFieldName(field.name)}`}
            required={field.required}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        )
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        )
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={field.placeholder || `Ingrese ${formatFieldName(field.name)}`}
            rows={3}
            required={field.required}
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <label className="text-sm text-neutral-700">
              {field.label}
            </label>
          </div>
        )
      case 'coordinates':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Latitud
              </label>
              <input
                type="number"
                step="0.000001"
                value={coordinateValue.latitude || ''}
                onChange={(e) => handleFieldChange(field.name, {
                  ...coordinateValue,
                  latitude: parseFloat(e.target.value) || ''
                })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: -12.345678"
                required={field.required}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Longitud
              </label>
              <input
                type="number"
                step="0.000001"
                value={coordinateValue.longitude || ''}
                onChange={(e) => handleFieldChange(field.name, {
                  ...coordinateValue,
                  longitude: parseFloat(e.target.value) || ''
                })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: -77.123456"
                required={field.required}
              />
            </div>
          </div>
        )
      default:
        // Fallback para tipos no reconocidos - mostrar como texto
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={field.placeholder || `Ingrese ${formatFieldName(field.name)}`}
            required={field.required}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title with User Info */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Seguimiento de Indicadores</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-neutral-600">
            {user?.name} - Rol: {user?.role === 'OPERATOR' ? 'Operador' : user?.role}
          </span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-600 font-medium">
            Centro de Costo: {user?.costCenter?.description || user?.costCenter?.code || 'No asignado'}
          </span>
        </div>
        <p className="text-neutral-600 mt-1">Gestiona y registra los datos de indicadores asignados a tu centro de costo</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-neutral-200 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('objectives')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'objectives'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FiTarget className="w-4 h-4" />
            Objetivos Estratégicos Institucionales
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'actions'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FiZap className="w-4 h-4" />
            Acciones Estratégicas Institucionales
          </button>
        </div>
      </div>

      {/* Objectives Tab */}
      {activeTab === 'objectives' && (
        <div className="space-y-6">
          {/* Plan Selection Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiTarget className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Selección de Plan Estratégico</h2>
            </div>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Plan Estratégico
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value)
                  setExpandedObjectives([])
                  setExpandedIndicators([])
                }}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar plan...</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.startYear} - {plan.endYear})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Objectives Table */}
          {selectedPlan && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Objetivos Estratégicos Institucionales asignados para cumplimiento
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Código de Objetivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Enunciado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Número de indicadores asignados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {objectives.map(objective => (
                      <React.Fragment key={objective.id}>
                        <tr className="hover:bg-neutral-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-neutral-900">{objective.code}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-neutral-900">{objective.statement}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-neutral-900">
                              {getIndicatorsCount(objective.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleObjectiveClick(objective.id)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Ver indicadores"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        
                        {/* Indicators Sub-table */}
                        {expandedObjectives.includes(objective.id) && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                  <h4 className="font-semibold text-blue-900 text-lg">Lista de indicadores para cumplimiento</h4>
                                  <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Código de Indicador</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Enunciado</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Año Base</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Valor Base</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Logros Esperados</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-blue-100 bg-white">
                                        {indicators
                                          .filter(ind => ind.objectiveId === objective.id)
                                          .map(indicator => (
                                            <React.Fragment key={indicator.id}>
                                              <tr className="hover:bg-blue-50 transition-colors">
                                                <td className="px-4 py-3">
                                                  <div className="text-sm font-medium text-neutral-900">{indicator.code}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="text-sm text-neutral-900">{indicator.statement}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="text-sm text-neutral-900">{indicator.baseYear || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="text-sm text-neutral-900">{indicator.baseValue || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="text-sm text-neutral-900">Configurado por admin</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                  <button
                                                    onClick={() => handleIndicatorClick(indicator.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    title="Ver variables"
                                                  >
                                                    <FiEye className="w-4 h-4" />
                                                    <span className="text-xs">Variables</span>
                                                  </button>
                                                </td>
                                              </tr>
                                              
                                              {/* Variables Sub-table */}
                                              {expandedIndicators.includes(indicator.id) && (
                                                <tr>
                                                  <td colSpan={6} className="px-4 py-4 bg-gradient-to-r from-emerald-50 to-teal-50">
                                                    <div className="space-y-4">
                                                      <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                                        <h5 className="font-semibold text-emerald-900 text-lg">Variables del indicador</h5>
                                                        <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
                                                      </div>
                                                      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full">
                                                            <thead className="bg-gradient-to-r from-emerald-100 to-emerald-50 border-b border-emerald-200">
                                                              <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Código de Variable</th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Nombre de la Variable</th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acción</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-emerald-100 bg-white">
                                                              {(() => {
                                                                const filteredVariables = variables.filter(variable => variable.indicatorId === indicator.id)
                                                                console.log('OBJECTIVES TAB - Variables for indicator:', {
                                                                  indicatorId: indicator.id,
                                                                  indicatorCode: indicator.code,
                                                                  totalVariables: variables.length,
                                                                  filteredVariables: filteredVariables.length,
                                                                  filteredVariableIds: filteredVariables.map(v => v.id)
                                                                })
                                                                return filteredVariables
                                                              })()
                                                              .map(variable => (
                                                                    <tr key={variable.id} className="hover:bg-emerald-50 transition-colors">
                                                                      <td className="px-4 py-3">
                                                                        <div className="text-sm font-medium text-neutral-900">{variable.code}</div>
                                                                      </td>
                                                                      <td className="px-4 py-3">
                                                                        <div className="text-sm text-neutral-900">{variable.name}</div>
                                                                      </td>
                                                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                      <button
                                                                        onClick={() => handleVariableClick(variable.id)}
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                                        title="Ver registros"
                                                                      >
                                                                        <FiEye className="w-4 h-4" />
                                                                        <span className="text-xs">Ver registros</span>
                                                                      </button>
                                                                      <button
                                                                        onClick={() => handleAddNewRecord(variable.id)}
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                                        title="Añadir nuevo registro"
                                                                      >
                                                                        <FiDatabase className="w-4 h-4" />
                                                                        <span className="text-xs">Añadir</span>
                                                                      </button>
                                                                    </div>
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Data Records Table */}
                                                      {selectedVariable && (
                                                        <div className="mt-6">
                                                          <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                              <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                                                              <h5 className="font-semibold text-purple-900 text-lg">Registros realizados</h5>
                                                              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                                                            </div>
                                                            {selectedRecords.size > 0 && (
                                                              <button
                                                                onClick={handleSendMultipleToApproval}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                              >
                                                                <FiCheckCircle className="w-4 h-4" />
                                                                Enviar {selectedRecords.size} a aprobación
                                                              </button>
                                                            )}
                                                          </div>
                                                          {loading ? (
                                                            <div className="text-center py-8 text-neutral-500">
                                                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                                              Cargando datos...
                                                            </div>
                                                          ) : indicatorData.length === 0 ? (
                                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
                                                              <div className="text-purple-600 text-sm">No hay registros aún</div>
                                                            </div>
                                                          ) : (
                                                            <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
                                                              <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                  <thead className="bg-gradient-to-r from-purple-100 to-purple-50 border-b border-purple-200">
                                                                    <tr>
                                                                      <th className="px-4 py-3 text-left w-10">
                                                                        <input
                                                                          type="checkbox"
                                                                          checked 
={getPaginatedRecords().length > 0 && selectedRecords.size === getPaginatedRecords().length}
                                                                          onChange={handleSelectAll}
                                                                          className="w-4 h-4 rounded border-gray-300"
                                                                          title="Seleccionar todo"
                                                                        />
                                                                      </th>
                                                                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Mi Centro de Costo</th>
                                                                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Año</th>
                                                                      {variables.find(v => v.id === selectedVariable)?.fields.map(field => (
                                                                        <th key={field.id} className="px-4 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                                                                          {field.label}
                                                                        </th>
                                                                      ))}
                                                                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Estado</th>
                                                                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Acciones</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody className="divide-y divide-purple-100 bg-white">
                                                                    {getPaginatedRecords().map(record => (
                                                                      <tr key={record.id} className="hover:bg-purple-50 transition-colors">
                                                                        <td className="px-4 py-3 text-center">
                                                                          <input
                                                                            type="checkbox"
                                                                            checked={selectedRecords.has(record.id)}
                                                                            onChange={() => handleSelectRecord(record.id)}
                                                                            className="w-4 h-4 rounded border-gray-300"
                                                                          />
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                          <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                            <div>
                                                                              <div className="text-sm font-medium text-neutral-900">{user?.costCenter?.code || 'N/A'}</div>
                                                                              <div className="text-xs text-neutral-500">{user?.costCenter?.description || 'Centro de Costo'}</div>
                                                                            </div>
                                                                          </div>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                          <div className="text-sm text-neutral-900">{record.year}</div>
                                                                        </td>
                                                                        {variables.find(v => v.id === selectedVariable)?.fields.map(field => (
                                                                          <td key={field.id} className="px-4 py-3">
                                                                            <div className="text-sm text-neutral-900">
                                                                              {formatFieldValue(record.values[field.name], field.type)}
                                                                            </div>
                                                                          </td>
                                                                        ))}
                                                                        <td className="px-4 py-3">
                                                                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                                               style={{
                                                                                 backgroundColor: record.status === 'approved' ? '#dcfce7' : 
                                                                                                 record.status === 'rejected' ? '#fee2e2' : 
                                                                                                 record.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                                                                                 color: record.status === 'approved' ? '#166534' : 
                                                                                        record.status === 'rejected' ? '#991b1b' : 
                                                                                        record.status === 'pending' ? '#92400e' : '#6b7280'
                                                                               }}>
                                                                            <div className="w-1.5 h-1.5 rounded-full"
                                                                                 style={{
                                                                                   backgroundColor: record.status === 'approved' ? '#22c55e' : 
                                                                                                  record.status === 'rejected' ? '#ef4444' : 
                                                                                                  record.status === 'pending' ? '#f59e0b' : '#9ca3af'
                                                                                 }}></div>
                                                                            {record.status === 'approved' ? 'Aprobado' : 
                                                                             record.status === 'rejected' ? 'Rechazado' : 
                                                                             record.status === 'pending' ? 'Enviado a aprobar' : 'Guardado como borrador'}
                                                                          </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                          <div className="flex items-center gap-2">
                                                                            <button
                                                                              onClick={() => handleEditRecord(record)}
                                                                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                                              title="Editar"
                                                                            >
                                                                              <FiEdit className="w-3 h-3" />
                                                                              <span className="text-xs">Editar</span>
                                                                            </button>
                                                                            {record.status === 'draft' && (
                                                                              <button
                                                                                onClick={() => handleSendToApproval(record.id)}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                                                title="Enviar a aprobación"
                                                                              >
                                                                                <FiCheckCircle className="w-3 h-3" />
                                                                                <span className="text-xs">Enviar a Aprobar</span>
                                                                              </button>
                                                                            )}
                                                                            {record.status === 'rejected' && (
                                                                              <button
                                                                                onClick={() => handleSendToApproval(record.id)}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                                                                title="Reenviar a aprobación"
                                                                              >
                                                                                <FiCheckCircle className="w-3 h-3" />
                                                                                <span className="text-xs">Reenviar</span>
                                                                              </button>
                                                                            )}
                                                                            <button
                                                                              onClick={() => handleDeleteRecord(record.id)}
                                                                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                                              title="Eliminar"
                                                                            >
                                                                              <FiTrash2 className="w-3 h-3" />
                                                                              <span className="text-xs">Eliminar</span>
                                                                            </button>
                                                                          </div>
                                                                        </td>
                                                                      </tr>
                                                                    ))}
                                                                  </tbody>
                                                                </table>
                                                              </div>
                                                              {/* Controles de Paginación */}
                                                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border-t border-purple-200">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                  <label htmlFor="itemsPerPage" className="font-medium">Mostrar:</label>
                                                                  <select
                                                                    id="itemsPerPage"
                                                                    value={itemsPerPage}
                                                                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                                                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                                  >
                                                                    {[5, 10, 20, 30, 50, 75, 90, 100].map(num => (
                                                                      <option key={num} value={num}>{num} registros</option>
                                                                    ))}
                                                                  </select>
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                  Página {currentPage} de {getTotalPages() || 1} | Total: {indicatorData.length} registros
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                  <button
                                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                    disabled={currentPage === 1}
                                                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                  >
                                                                    ← Anterior
                                                                  </button>
                                                                  <button
                                                                    onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                                                                    disabled={currentPage === getTotalPages()}
                                                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                  >
                                                                    Siguiente →
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Tab - Similar structure */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* Plan and Objective Selection */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiZap className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Selección de Plan y Objetivo</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  Plan Estratégico
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => {
                    setSelectedPlan(e.target.value)
                    setExpandedActions([])
                    setExpandedIndicators([])
                  }}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all duration-200 text-sm"
                >
                  <option value="">Seleccionar plan...</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id} className="py-2">
                      {plan.name} ({plan.startYear} - {plan.endYear})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Objetivo Estratégico
                </label>
                <select
                  value={selectedObjective}
                  onChange={(e) => setSelectedObjective(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200 text-sm disabled:bg-neutral-50 disabled:cursor-not-allowed"
                  disabled={!selectedPlan}
                >
                  <option value="">Seleccionar objetivo...</option>
                  {objectives.map(objective => (
                    <option key={objective.id} value={objective.id} className="py-2">
                      {objective.code} - {objective.statement}
                    </option>
                  ))}
                </select>
                {!selectedPlan && (
                  <p className="text-xs text-neutral-500 italic mt-1">Seleccione primero un plan estratégico</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions Table - Similar to objectives */}
          {selectedPlan && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Acciones Estratégicas Institucionales asignadas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Código de Acción Estratégica
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Enunciado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Número de indicadores asignados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {(() => {
                        const filteredActions = actions.filter(action => {
                          // Si hay un objetivo seleccionado, filtrar acciones por ese objetivo
                          if (selectedObjective) {
                            return action.objectiveId === selectedObjective
                          }
                          // Si no hay objetivo seleccionado, mostrar todas las acciones
                          return true
                        })
                        
                        console.log('ACTIONS FILTERED BY OBJECTIVE:', {
                          selectedObjective,
                          totalActions: actions.length,
                          filteredActions: filteredActions.length,
                          filteredActionIds: filteredActions.map(a => ({
                            id: a.id,
                            code: a.code,
                            objectiveId: a.objectiveId
                          }))
                        })
                        
                        return filteredActions
                      })()
                      .map(action => (
                        <React.Fragment key={action.id}>
                          <tr className="hover:bg-neutral-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-neutral-900">{action.code}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-neutral-900">{action.statement}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-neutral-900">
                                {getIndicatorsCount(undefined, action.id)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleActionClick(action.id)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Ver indicadores"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          
                          {/* Indicators Sub-table */}
                          {expandedActions.includes(action.id) && (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                    <h4 className="font-semibold text-orange-900 text-lg">Lista de indicadores para cumplimiento</h4>
                                    <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-200">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Código de Indicador</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Enunciado</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Año Base</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Valor Base</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Logros Esperados</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-orange-100 bg-white">
                                          {indicators
                                            .filter(ind => ind.actionId === action.id)
                                            .map(indicator => (
                                              <React.Fragment key={indicator.id}>
                                                <tr className="hover:bg-orange-50 transition-colors">
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-neutral-900">{indicator.code}</div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm text-neutral-900">{indicator.statement}</div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm text-neutral-900">{indicator.baseYear || '-'}</div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm text-neutral-900">{indicator.baseValue || '-'}</div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm text-neutral-900">Configurado por admin</div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                      onClick={() => handleIndicatorClick(indicator.id)}
                                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                                      title="Ver variables"
                                                    >
                                                      <FiEye className="w-4 h-4" />
                                                      <span className="text-xs">Variables</span>
                                                    </button>
                                                  </td>
                                                </tr>
                                                
                                                {/* Variables Sub-table */}
                                                {expandedIndicators.includes(indicator.id) && (
                                                  <tr>
                                                    <td colSpan={6} className="px-4 py-4 bg-gradient-to-r from-teal-50 to-cyan-50">
                                                      <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                          <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                                                          <h5 className="font-semibold text-teal-900 text-lg">Variables del indicador</h5>
                                                          <div className="flex-1 h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
                                                        </div>
                                                        <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                                                          <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                              <thead className="bg-gradient-to-r from-emerald-100 to-emerald-50 border-b border-emerald-200">
                                                                <tr>
                                                                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Código de Variable</th>
                                                                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Nombre de la Variable</th>
                                                                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acciones</th>
                                                                </tr>
                                                              </thead>
                                                              <tbody className="divide-y divide-emerald-100 bg-white">
                                                                {(() => {
                                                                  const filteredVariables = variables.filter(variable => variable.indicatorId === indicator.id)
                                                                  console.log('ACTIONS TAB - Variables for indicator:', {
                                                                    indicatorId: indicator.id,
                                                                    indicatorCode: indicator.code,
                                                                    totalVariables: variables.length,
                                                                    filteredVariables: filteredVariables.length,
                                                                    filteredVariableIds: filteredVariables.map(v => v.id)
                                                                  })
                                                                  return filteredVariables
                                                                })()
                                                                .map(variable => (
                                                                    <tr key={variable.id} className="hover:bg-emerald-50 transition-colors">
                                                                      <td className="px-4 py-3">
                                                                        <div className="text-sm font-medium text-neutral-900">{variable.code}</div>
                                                                      </td>
                                                                      <td className="px-4 py-3">
                                                                        <div className="text-sm text-neutral-900">{variable.name}</div>
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                        <div className="flex items-center gap-2">
                                                                          <button
                                                                            onClick={() => handleVariableClick(variable.id)}
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                                            title="Ver registros"
                                                                          >
                                                                            <FiEye className="w-4 h-4" />
                                                                            <span className="text-xs">Ver registros</span>
                                                                          </button>
                                                                          <button
                                                                            onClick={() => handleAddNewRecord(variable.id)}
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                                            title="Añadir nuevo registro"
                                                                          >
                                                                            <FiDatabase className="w-4 h-4" />
                                                                            <span className="text-xs">Añadir</span>
                                                                          </button>
                                                                        </div>
                                                                      </td>
                                                                    </tr>
                                                                  ))}
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Data Records Table */}
                                                        {selectedVariable && variables.find(v => v.id === selectedVariable)?.indicatorId === indicator.id && (
                                                          <div className="mt-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                              <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                                                              <h5 className="font-semibold text-indigo-900 text-lg">Registros realizados</h5>
                                                              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
                                                            </div>
                                                            {loading ? (
                                                              <div className="text-center py-8 text-neutral-500">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                                                Cargando datos...
                                                              </div>
                                                            ) : indicatorData.length === 0 ? (
                                                              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
                                                                <div className="text-indigo-600 text-sm">No hay registros aún</div>
                                                              </div>
                                                            ) : (
                                                              <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                                                                <div className="overflow-x-auto">
                                                                  <table className="w-full">
                                                                    <thead className="bg-gradient-to-r from-indigo-100 to-indigo-50 border-b border-indigo-200">
                                                                      <tr>
                                                                        <th className="px-4 py-3 text-left w-10">
                                                                          <input
                                                                            type="checkbox"
                                                                            checked={getPaginatedRecords().length > 0 && selectedRecords.size === getPaginatedRecords().length}
                                                                            onChange={handleSelectAll}
                                                                            className="w-4 h-4 rounded border-gray-300"
                                                                            title="Seleccionar todo"
                                                                          />
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Mi Centro de Costo</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Año</th>
                                                                        {variables.find(v => v.id === selectedVariable)?.fields.map(field => (
                                                                          <th key={field.id} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                                                                            {field.label}
                                                                          </th>
                                                                        ))}
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Estado</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Acciones</th>
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-indigo-100 bg-white">
                                                                      {getPaginatedRecords().map(record => (
                                                                        <tr key={record.id} className="hover:bg-indigo-50 transition-colors">
                                                                          <td className="px-4 py-3 text-center">
                                                                            <input
                                                                              type="checkbox"
                                                                              checked={selectedRecords.has(record.id)}
                                                                              onChange={() => handleSelectRecord(record.id)}
                                                                              className="w-4 h-4 rounded border-gray-300"
                                                                            />
                                                                          </td>
                                                                          <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-2">
                                                                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                              <div>
                                                                                <div className="text-sm font-medium text-neutral-900">{user?.costCenter?.code || 'N/A'}</div>
                                                                                <div className="text-xs text-neutral-500">{user?.costCenter?.description || 'Centro de Costo'}</div>
                                                                              </div>
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-4 py-3">
                                                                            <div className="text-sm text-neutral-900">{record.year}</div>
                                                                          </td>
                                                                          {variables.find(v => v.id === selectedVariable)?.fields.map(field => (
                                                                            <td key={field.id} className="px-4 py-3">
                                                                              <div className="text-sm text-neutral-900">
                                                                                {record.values[field.name] || '-'}
                                                                              </div>
                                                                            </td>
                                                                          ))}
                                                                          <td className="px-4 py-3">
                                                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                                                 style={{
                                                                                   backgroundColor: record.status === 'approved' ? '#dcfce7' : 
                                                                                                   record.status === 'rejected' ? '#fee2e2' : 
                                                                                                   record.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                                                                                   color: record.status === 'approved' ? '#166534' : 
                                                                                          record.status === 'rejected' ? '#991b1b' : 
                                                                                          record.status === 'pending' ? '#92400e' : '#6b7280'
                                                                                 }}>
                                                                              <div className="w-1.5 h-1.5 rounded-full"
                                                                                   style={{
                                                                                     backgroundColor: record.status === 'approved' ? '#22c55e' : 
                                                                                                    record.status === 'rejected' ? '#ef4444' : 
                                                                                                    record.status === 'pending' ? '#f59e0b' : '#9ca3af'
                                                                                   }}></div>
                                                                              {record.status === 'approved' ? 'Aprobado' : 
                                                                               record.status === 'rejected' ? 'Rechazado' : 
                                                                               record.status === 'pending' ? 'Enviado a aprobar' : 'Borrador'}
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                            <div className="flex items-center gap-2">
                                                                              <button
                                                                                onClick={() => handleEditRecord(record)}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                                                title="Editar"
                                                                              >
                                                                                <FiEdit className="w-3 h-3" />
                                                                                <span className="text-xs">Editar</span>
                                                                              </button>
                                                                              {record.status !== 'pending' && record.status !== 'approved' && (
                                                                                <button
                                                                                  onClick={() => handleSendToApproval(record.id)}
                                                                                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                                                  title="Enviar a aprobación"
                                                                                >
                                                                                  <FiCheckCircle className="w-3 h-3" />
                                                                                  <span className="text-xs">Enviar</span>
                                                                                </button>
                                                                              )}
                                                                              <button
                                                                                onClick={() => handleDeleteRecord(record.id)}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                                                title="Eliminar"
                                                                              >
                                                                                <FiTrash2 className="w-3 h-3" />
                                                                                <span className="text-xs">Eliminar</span>
                                                                              </button>
                                                                            </div>
                                                                          </td>
                                                                        </tr>
                                                                      ))}
                                                                    </tbody>
                                                                  </table>
                                                                </div>

                                                                {/* Pagination Controls - Actions Tab */}
                                                                <div className="mt-6 space-y-4 border-t border-indigo-200 pt-4">
                                                                  <div className="flex flex-wrap items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                      <label className="text-sm text-neutral-700 font-medium">Registros por página:</label>
                                                                      <select
                                                                        value={itemsPerPage}
                                                                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                                                        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                                                      >
                                                                        {[5, 10, 20, 30, 50, 75, 90, 100].map(num => (
                                                                          <option key={num} value={num}>{num}</option>
                                                                        ))}
                                                                      </select>
                                                                    </div>

                                                                    <div className="text-sm text-neutral-600">
                                                                      Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{getTotalPages()}</span> | Total: <span className="font-semibold">{indicatorData.length}</span> registros
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                      <button
                                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                        disabled={currentPage === 1}
                                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                      >
                                                                        &larr; Anterior
                                                                      </button>
                                                                      <button
                                                                        onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                                                                        disabled={currentPage === getTotalPages()}
                                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                      >
                                                                        Siguiente &rarr;
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingRecord ? 'Editar Registro' : 'Registrar Datos'} - {variables.find(v => v.id === selectedVariable)?.name}
              </h3>
              <button
                onClick={() => {
                  setShowFormModal(false)
                  setEditingRecord(null)
                  setFormData({
                    year: new Date().getFullYear(),
                    values: {}
                  })
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4">
              {/* Variable Description */}
              {variables.find(v => v.id === selectedVariable)?.description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {variables.find(v => v.id === selectedVariable)?.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
              </div>

              {variables.find(v => v.id === selectedVariable)?.fields.map(field => (
                <div key={field.id}>
                  {field.type !== 'checkbox' && (
                    <>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'coordinates' && (
                        <p className="text-xs text-neutral-500 mb-3">
                          Ingrese la latitud y longitud de la ubicación
                        </p>
                      )}
                    </>
                  )}
                  {renderFormField(field)}
                  {field.type === 'checkbox' && (
                    <div className="text-xs text-neutral-500 mt-1">
                      {field.required && <span className="text-red-500">* Campo obligatorio</span>}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false)
                    setEditingRecord(null)
                    setFormData({
                      year: new Date().getFullYear(),
                      values: {}
                    })
                  }}
                  className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleFormSubmit(e as any, 'save')}
                  disabled={formLoading}
                  className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Guardar Borrador
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleFormSubmit(e as any, 'send')}
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Enviar a Aprobación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
