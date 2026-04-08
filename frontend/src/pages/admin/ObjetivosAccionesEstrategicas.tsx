import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiBarChart2 } from 'react-icons/fi'
import apiClient from '@services/api'
import { 
  strategicObjectivesService, 
  strategicActionsService,
  indicatorsService,
  indicatorValuesService,
  StrategicObjective,
  StrategicAction,
  Indicator,
  CostCenterOption,
  CreateObjectiveRequest,
  CreateActionRequest,
  CreateIndicatorRequest
} from '@services/strategicService'

export default function ObjetivosAccionesEstrategicas() {
  const [activeTab, setActiveTab] = useState<'objectives' | 'actions'>('objectives')
  
  // Estados para Objetivos Estratégicos
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [objectivesLoading, setObjectivesLoading] = useState(true)
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [editingObjective, setEditingObjective] = useState<StrategicObjective | null>(null)
  const [objectiveFormData, setObjectiveFormData] = useState<CreateObjectiveRequest>({
    planId: '', // Se seleccionará del formulario
    code: '',
    statement: '',
    responsibleId: ''
  })
  const [costCenters, setCostCenters] = useState<CostCenterOption[]>([])
  const [objectiveSearch, setObjectiveSearch] = useState('')
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false)
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(false)

  // Estados para Acciones Estratégicas
  const [actions, setActions] = useState<StrategicAction[]>([])
  const [actionsLoading, setActionsLoading] = useState(true)
  const [showActionModal, setShowActionModal] = useState(false)
  const [editingAction, setEditingAction] = useState<StrategicAction | null>(null)
  const [actionFormData, setActionFormData] = useState<CreateActionRequest>({
    planId: '', // Se seleccionará del formulario
    objectiveId: undefined, // Se seleccionará del formulario
    code: '',
    statement: '',
    responsibleId: ''
  })
  const [objectivesForAction, setObjectivesForAction] = useState<StrategicObjective[]>([])

  // Estados para Indicadores
  const [showIndicatorFormModal, setShowIndicatorFormModal] = useState(false)
  const [indicatorFormData, setIndicatorFormData] = useState<CreateIndicatorRequest>({
    planId: '',
    objectiveId: '',
    actionId: '',
    code: '',
    statement: '',
    responsibleId: '',
    formula: '',
    parameter: '',
    baseYear: new Date().getFullYear(),
    baseValue: 0
  })
  const [indicatorInputValues, setIndicatorInputValues] = useState<{[key: string]: {absolute: string, relative: string}}>({})
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null)
  const [selectedAction, setSelectedAction] = useState<StrategicAction | null>(null)

  // Estados para generación dinámica de años
  const [planYears, setPlanYears] = useState<number[]>([])
  const [strategicPlans, setStrategicPlans] = useState<any[]>([])

  useEffect(() => {
    loadObjectives()
    loadActions()
    loadCostCenters()
    loadStrategicPlans()
  }, [])

  const loadStrategicPlans = async () => {
    try {
      const response = await apiClient.get('/plans')
      console.log('Planes cargados:', response.data)
      setStrategicPlans(response.data)
      
      // Generar años basados en el primer plan activo
      if (response.data && response.data.length > 0) {
        const activePlan = response.data[0]
        const years = []
        for (let i = activePlan.startYear; i <= activePlan.endYear; i++) {
          years.push(i)
        }
        setPlanYears(years)
      } else {
        console.log('No hay planes registrados')
        setPlanYears([])
      }
    } catch (error) {
      console.error('Error loading strategic plans:', error)
      setStrategicPlans([])
    }
  }

  useEffect(() => {
    if (showIndicatorsModal && selectedObjective) {
      loadIndicators(selectedObjective.id)
    } else if (showIndicatorsModal && selectedAction) {
      loadIndicatorsForAction(selectedAction.id)
    }
  }, [showIndicatorsModal, selectedObjective, selectedAction])

  const loadObjectives = async () => {
    try {
      setObjectivesLoading(true)
      const data = await strategicObjectivesService.getAll()
      setObjectives(data)
    } catch (error) {
      console.error('Error loading objectives:', error)
    } finally {
      setObjectivesLoading(false)
    }
  }

  const loadActions = async () => {
    try {
      setActionsLoading(true)
      const data = await strategicActionsService.getAll()
      setActions(data)
    } catch (error) {
      console.error('Error loading actions:', error)
    } finally {
      setActionsLoading(false)
    }
  }

  const loadObjectivesForAction = async () => {
    try {
      const data = await strategicObjectivesService.getAll()
      setObjectivesForAction(data)
    } catch (error) {
      console.error('Error loading objectives for action:', error)
    }
  }

  const loadCostCenters = async () => {
    try {
      const data = await strategicObjectivesService.getCostCentersForAssignment()
      setCostCenters(data)
    } catch (error) {
      console.error('Error loading cost centers:', error)
    }
  }

  const loadIndicators = async (objectiveId: string) => {
    try {
      setIndicatorsLoading(true)
      const data = await indicatorsService.getByObjective(objectiveId)
      setIndicators(data)
    } catch (error) {
      console.error('Error loading indicators:', error)
    } finally {
      setIndicatorsLoading(false)
    }
  }

  const loadIndicatorsForAction = async (actionId: string) => {
    try {
      setIndicatorsLoading(true)
      const data = await indicatorsService.getByAction(actionId)
      setIndicators(data)
    } catch (error) {
      console.error('Error loading indicators for action:', error)
    } finally {
      setIndicatorsLoading(false)
    }
  }

  const handleObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingObjective) {
        await strategicObjectivesService.update(editingObjective.id, objectiveFormData)
      } else {
        await strategicObjectivesService.create(objectiveFormData)
      }
      
      await loadObjectives()
      setShowObjectiveModal(false)
      resetObjectiveForm()
    } catch (error: any) {
      console.error('Error saving objective:', error)
      alert(`Error al guardar objetivo: ${error.message || 'Error desconocido'}`)
    }
  }

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAction) {
        await strategicActionsService.update(editingAction.id, actionFormData)
      } else {
        await strategicActionsService.create(actionFormData)
      }
      
      await loadActions()
      setShowActionModal(false)
      resetActionForm()
    } catch (error) {
      console.error('Error saving action:', error)
    }
  }

  const handleIndicatorValueChange = (year: number, type: 'absolute' | 'relative', value: string) => {
    // Actualizar el valor del input (preservando el texto)
    setIndicatorInputValues(prev => ({
      ...prev,
      [year.toString()]: {
        ...prev[year.toString()],
        [type]: value
      }
    }))
  }

  const handleIndicatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== INICIANDO GUARDADO DE INDICADOR ===')
    console.log('indicatorFormData:', indicatorFormData)
    console.log('indicatorInputValues:', indicatorInputValues)
    console.log('editingIndicator:', editingIndicator)
    
    // Validación básica - debe tener código, enunciado y al menos un objetivo o acción
    if (!indicatorFormData.code || !indicatorFormData.statement) {
      alert('Por favor complete todos los campos requeridos')
      return
    }
    
    if (!indicatorFormData.objectiveId && !indicatorFormData.actionId) {
      alert('Por favor seleccione un objetivo o una acción')
      return
    }
    
    try {
      let savedIndicator: Indicator
      
      if (editingIndicator) {
        console.log('Actualizando indicador existente...')
        savedIndicator = await indicatorsService.update(editingIndicator.id, indicatorFormData)
      } else {
        console.log('Creando nuevo indicador...')
        savedIndicator = await indicatorsService.create(indicatorFormData)
      }
      
      console.log('Indicador guardado:', savedIndicator)
      
      // Guardar valores anuales
      const indicatorId = savedIndicator.id
      console.log('Guardando valores para indicador ID:', indicatorId)
      
      // Eliminar valores existentes si estamos editando
      if (editingIndicator && editingIndicator.indicatorValues) {
        console.log('Eliminando valores existentes...')
        for (const existingValue of editingIndicator.indicatorValues) {
          try {
            await indicatorValuesService.delete(existingValue.id)
            console.log('Valor eliminado:', existingValue.id)
          } catch (error) {
            console.warn('Error al eliminar valor existente:', error)
          }
        }
      }
      
      // Crear nuevos valores anuales
      console.log('Creando nuevos valores anuales...')
      for (const [yearKey, values] of Object.entries(indicatorInputValues)) {
        const year = parseInt(yearKey)
        console.log(`Procesando año ${year}:`, values)
        
        // Guardar valor absoluto si existe
        if (values.absolute && values.absolute !== '') {
          console.log('Guardando valor absoluto:', values.absolute)
          await indicatorValuesService.createAbsolute({
            indicatorId,
            year,
            value: parseFloat(values.absolute),
            type: 'ABSOLUTE'
          })
        }
        
        // Guardar valor relativo si existe
        if (values.relative && values.relative !== '') {
          console.log('Guardando valor relativo:', values.relative)
          await indicatorValuesService.createRelative({
            indicatorId,
            year,
            value: parseFloat(values.relative),
            type: 'RELATIVE'
          })
        }
      }
      
      console.log('=== VALORES GUARDADOS ===')
      
      if (selectedObjective) {
        await loadIndicators(selectedObjective.id)
      } else if (selectedAction) {
        await loadIndicatorsForAction(selectedAction.id)
      }
      setShowIndicatorFormModal(false)
      resetIndicatorForm()
      setEditingIndicator(null)
      alert(editingIndicator ? 'Indicador actualizado exitosamente' : 'Indicador guardado exitosamente')
    } catch (error: any) {
      console.error('Error saving indicator:', error)
      alert('Error al guardar el indicador')
    }
  }

  const handleEditObjective = (objective: StrategicObjective) => {
    setEditingObjective(objective)
    setObjectiveFormData({
      planId: objective.planId,
      code: objective.code,
      statement: objective.statement,
      responsibleId: objective.responsibleId || ''
    })
    setShowObjectiveModal(true)
  }

  const handleEditAction = (action: StrategicAction) => {
    setEditingAction(action)
    setActionFormData({
      planId: action.planId,
      objectiveId: action.objectiveId || '',
      code: action.code,
      statement: action.statement,
      responsibleId: action.responsibleId || ''
    })
    
    // Cargar objetivos para el plan de esta acción
    loadObjectivesForAction()
    
    setShowActionModal(true)
  }

  const handleEditIndicator = (indicator: Indicator) => {
    // Cargar los valores anuales del indicador
    const yearlyValues: {[key: string]: {absolute: string, relative: string}} = {}
    
    if (indicator.indicatorValues) {
      indicator.indicatorValues.forEach(value => {
        const yearKey = value.year.toString()
        if (!yearlyValues[yearKey]) {
          yearlyValues[yearKey] = { absolute: '', relative: '' }
        }
        
        if (value.type === 'ABSOLUTE') {
          yearlyValues[yearKey].absolute = value.value.toString()
        } else if (value.type === 'RELATIVE') {
          yearlyValues[yearKey].relative = value.value.toString()
        }
      })
    }
    
    setIndicatorInputValues(yearlyValues)
    
    setIndicatorFormData({
      planId: (indicator as any).planId || '',
      objectiveId: indicator.objectiveId || '',
      actionId: indicator.actionId || '',
      code: indicator.code,
      statement: indicator.statement,
      responsibleId: indicator.responsibleId || '',
      formula: indicator.formula || '',
      parameter: indicator.parameter || '',
      baseYear: indicator.baseYear || new Date().getFullYear(),
      baseValue: indicator.baseValue || 0
    })
    setEditingIndicator(indicator)
    setShowIndicatorFormModal(true)
  }

  const handleDeleteObjective = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este objetivo?')) {
      try {
        await strategicObjectivesService.delete(id)
        await loadObjectives()
      } catch (error) {
        console.error('Error deleting objective:', error)
      }
    }
  }

  const handleDeleteAction = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta acción?')) {
      try {
        await strategicActionsService.delete(id)
        await loadActions()
      } catch (error) {
        console.error('Error deleting action:', error)
      }
    }
  }

  const handleShowIndicators = (objective: StrategicObjective) => {
    setSelectedObjective(objective)
    setSelectedAction(null)
    setShowIndicatorsModal(true)
  }

  const handleShowIndicatorsForAction = (action: StrategicAction) => {
    console.log('handleShowIndicatorsForAction called with action:', action)
    setSelectedAction(action)
    setSelectedObjective(null)
    setShowIndicatorsModal(true)
  }

  const handleShowIndicatorsForm = (objective: StrategicObjective) => {
    setSelectedObjective(objective)
    setSelectedAction(null)
    resetIndicatorForm()
    setIndicatorFormData({
      ...indicatorFormData,
      planId: objective.planId,
      objectiveId: objective.id,
      actionId: ''
    })
    setIndicatorInputValues({})
    setShowIndicatorFormModal(true)
  }

  const handleShowIndicatorsFormForAction = (action: StrategicAction) => {
    console.log('handleShowIndicatorsFormForAction called with action:', action)
    setSelectedAction(action)
    setSelectedObjective(null)
    resetIndicatorForm()
    setIndicatorFormData({
      planId: action.planId,
      objectiveId: undefined,
      actionId: action.id,
      code: '',
      statement: '',
      responsibleId: '',
      formula: '',
      parameter: '',
      baseYear: new Date().getFullYear(),
      baseValue: 0
    })
    setIndicatorInputValues({})
    setShowIndicatorFormModal(true)
  }

  const resetObjectiveForm = () => {
    setObjectiveFormData({
      planId: '', // Se seleccionará del formulario
      code: '',
      statement: '',
      responsibleId: ''
    })
    setEditingObjective(null)
  }

  const resetActionForm = () => {
    setActionFormData({
      planId: '', // Se seleccionará del formulario
      objectiveId: undefined, // Se seleccionará del formulario
      code: '',
      statement: '',
      responsibleId: ''
    })
    setEditingAction(null)
  }

  const handleDeleteIndicator = async (indicatorId: string) => {
    if (!confirm('¿Está seguro de eliminar este indicador?')) {
      return
    }
    
    try {
      await indicatorsService.delete(indicatorId)
      
      if (selectedObjective) {
        await loadIndicators(selectedObjective.id)
      } else if (selectedAction) {
        await loadIndicatorsForAction(selectedAction.id)
      }
    } catch (error) {
      console.error('Error deleting indicator:', error)
      alert('Error al eliminar indicador')
    }
  }

  const resetIndicatorForm = () => {
    setIndicatorFormData({
      planId: '',
      objectiveId: '',
      actionId: '',
      code: '',
      statement: '',
      responsibleId: '',
      formula: '',
      parameter: '',
      baseYear: new Date().getFullYear(),
      baseValue: 0
    })
    setIndicatorInputValues({})
  }

  const filteredObjectives = objectives.filter(obj => 
    obj.code.toLowerCase().includes(objectiveSearch.toLowerCase()) ||
    obj.statement.toLowerCase().includes(objectiveSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Objetivos y Acciones Estratégicas</h1>
          <p className="text-neutral-600 mt-1">Gestiona los objetivos y acciones estratégicas del plan</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('objectives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'objectives'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Objetivos Estratégicos
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Acciones Estratégicas
          </button>
        </nav>
      </div>

      {/* Objetivos Estratégicos Tab */}
      {activeTab === 'objectives' && (
        <div className="space-y-6">
          {/* Form and Search */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Registrar Objetivo Estratégico</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar objetivos..."
                    value={objectiveSearch}
                    onChange={(e) => setObjectiveSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowObjectiveModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Form */}
            {showObjectiveModal && (
              <div className="border-t border-neutral-200 pt-6">
                <form onSubmit={handleObjectiveSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Plan Estratégico *
                      </label>
                      <select
                        value={objectiveFormData.planId}
                        onChange={(e) => setObjectiveFormData({ ...objectiveFormData, planId: e.target.value })}
                        className="input-base"
                        required
                      >
                        <option value="">Seleccionar plan...</option>
                        {strategicPlans && Array.isArray(strategicPlans) && strategicPlans.length > 0 ? (
                        strategicPlans.map((plan: any) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.startYear} - {plan.endYear})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No hay planes estratégicos registrados
                        </option>
                      )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Código del Objetivo *
                      </label>
                      <input
                        type="text"
                        required
                        value={objectiveFormData.code}
                        onChange={(e) => setObjectiveFormData({ ...objectiveFormData, code: e.target.value })}
                        className="input-base"
                        placeholder="Ej: OBJ-001"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Enunciado del Objetivo *
                      </label>
                      <textarea
                        required
                        value={objectiveFormData.statement}
                        onChange={(e) => setObjectiveFormData({ ...objectiveFormData, statement: e.target.value })}
                        className="input-base"
                        rows={3}
                        placeholder="Descripción detallada del objetivo"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Responsable del Objetivo
                      </label>
                      <select
                        value={objectiveFormData.responsibleId}
                        onChange={(e) => setObjectiveFormData({ ...objectiveFormData, responsibleId: e.target.value })}
                        className="input-base"
                      >
                        <option value="">Seleccionar centro de costo...</option>
                        {costCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.code} - {center.description || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowObjectiveModal(false)}
                      className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 btn-primary">
                      {editingObjective ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Objectives Table */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Objetivos Estratégicos Registrados</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Código del Objetivo</th>
                    <th className="table-header-cell">Enunciado</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {objectivesLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                        Cargando...
                      </td>
                    </tr>
                  ) : filteredObjectives.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                        No hay objetivos registrados
                      </td>
                    </tr>
                  ) : (
                    filteredObjectives.map((objective) => (
                      <tr key={objective.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{objective.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">{objective.statement}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleShowIndicators(objective)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Ver indicadores"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShowIndicatorsForm(objective)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Registrar indicador"
                          >
                            <FiBarChart2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditObjective(objective)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Editar"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteObjective(objective.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Acciones Estratégicas Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* Form and Search */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Registrar Acción Estratégica</h2>
              <button
                onClick={() => setShowActionModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {/* Form */}
            {showActionModal && (
              <div className="border-t border-neutral-200 pt-6">
                <form onSubmit={handleActionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Plan Estratégico *
                      </label>
                      <select
                        value={actionFormData.planId}
                        onChange={(e) => {
                          e.preventDefault()
                          const planId = e.target.value
                          setActionFormData(prev => ({ ...prev, planId, objectiveId: '' }))
                          if (planId) {
                            loadObjectivesForAction()
                          } else {
                            setObjectivesForAction([])
                          }
                        }}
                        className="input-base"
                        required
                      >
                        <option value="">Seleccionar plan...</option>
                        {strategicPlans && Array.isArray(strategicPlans) && strategicPlans.length > 0 ? (
                        strategicPlans.map((plan: any) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.startYear} - {plan.endYear})
                          </option>
                        ))
                      ) : (
                        <option value="">No hay planes disponibles</option>
                      )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Código de Objetivo Estratégico *
                      </label>
                      <select
                        value={actionFormData.objectiveId || ''}
                        onChange={(e) => setActionFormData({ ...actionFormData, objectiveId: e.target.value || undefined })}
                        className="input-base"
                        required
                        disabled={!actionFormData.planId}
                      >
                        <option value="">
                          {actionFormData.planId ? 'Seleccionar objetivo...' : 'Seleccione primero un plan'}
                        </option>
                        {objectivesForAction.map((objective) => (
                          <option key={objective.id} value={objective.id}>
                            {objective.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Código de la Acción Estratégica *
                      </label>
                      <input
                        type="text"
                        required
                        value={actionFormData.code}
                        onChange={(e) => setActionFormData({ ...actionFormData, code: e.target.value })}
                        className="input-base"
                        placeholder="Ej: ACC-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Responsable de la Acción Estratégica
                      </label>
                      <select
                        value={actionFormData.responsibleId || ''}
                        onChange={(e) => setActionFormData({ ...actionFormData, responsibleId: e.target.value })}
                        className="input-base"
                      >
                        <option value="">Seleccionar responsable...</option>
                        {costCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.code} - {center.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Enunciado de la Acción Estratégica *
                    </label>
                    <textarea
                      required
                      value={actionFormData.statement}
                      onChange={(e) => setActionFormData({ ...actionFormData, statement: e.target.value })}
                      className="input-base"
                      rows={3}
                      placeholder="Descripción detallada de la acción estratégica"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowActionModal(false)}
                      className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 btn-primary">
                      {editingAction ? 'Actualizar Acción' : 'Guardar Acción'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Actions Table */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Acciones Estratégicas Registradas</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Plan</th>
                    <th className="table-header-cell">Código del Objetivo</th>
                    <th className="table-header-cell">Código de la Acción</th>
                    <th className="table-header-cell">Enunciado</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {actionsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                        Cargando...
                      </td>
                    </tr>
                  ) : actions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                        No hay acciones registradas
                      </td>
                    </tr>
                  ) : (
                    actions.map((action) => (
                      <tr key={action.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-600">
                            {strategicPlans.find(p => p.id === action.planId)?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {action.objective?.code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{action.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">{action.statement}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleShowIndicatorsForAction(action)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Ver indicadores"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShowIndicatorsFormForAction(action)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Registrar indicador"
                          >
                            <FiBarChart2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditAction(action)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Editar"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(action.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Indicador Form Modal - FUERA DE AMBAS PESTAÑAS */}
      {showIndicatorFormModal && (selectedObjective || selectedAction) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingIndicator ? 'Editar Indicador' : 'Registrar Indicador'} para: {selectedObjective ? selectedObjective.code : selectedAction?.code}
              </h3>
              <button
                onClick={() => setShowIndicatorFormModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleIndicatorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Plan Estratégico
                  </label>
                  <input
                    type="text"
                    value={strategicPlans.find(p => p.id === indicatorFormData.planId)?.name || ''}
                    readOnly
                    className="input-base bg-neutral-50"
                    placeholder="Se selecciona automáticamente del objetivo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código del Objetivo
                  </label>
                  <input
                    type="text"
                    value={selectedObjective?.code || ''}
                    readOnly
                    className="input-base bg-neutral-50"
                    placeholder={selectedAction ? "No aplica para indicadores de acción" : "Se selecciona automáticamente"}
                  />
                </div>
                {selectedAction && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Código de la Acción Estratégica
                    </label>
                    <input
                      type="text"
                      value={selectedAction.code}
                      readOnly
                      className="input-base bg-neutral-50"
                      placeholder="Se selecciona automáticamente"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código del Indicador *
                  </label>
                  <input
                    type="text"
                    required
                    value={indicatorFormData.code}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, code: e.target.value })}
                    className="input-base"
                    placeholder="Ej: IND-001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Enunciado del Indicador *
                  </label>
                  <textarea
                    required
                    value={indicatorFormData.statement}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, statement: e.target.value })}
                    className="input-base"
                    rows={3}
                    placeholder="Descripción del indicador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Responsable de la Medición
                  </label>
                  <select
                    value={indicatorFormData.responsibleId}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, responsibleId: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Seleccionar centro de costo...</option>
                    {costCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.code} - {center.description || ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fórmula de Cálculo
                  </label>
                  <input
                    type="text"
                    value={indicatorFormData.formula}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, formula: e.target.value })}
                    className="input-base"
                    placeholder="Ej: (Valor Actual / Valor Base) * 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Parámetro
                  </label>
                  <input
                    type="text"
                    value={indicatorFormData.parameter}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, parameter: e.target.value })}
                    className="input-base"
                    placeholder="Ej: Porcentaje"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Año Base
                  </label>
                  <input
                    type="number"
                    value={indicatorFormData.baseYear}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, baseYear: parseInt(e.target.value) })}
                    className="input-base"
                    placeholder="Ej: 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valor Base
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={indicatorFormData.baseValue}
                    onChange={(e) => setIndicatorFormData({ ...indicatorFormData, baseValue: parseFloat(e.target.value) })}
                    className="input-base"
                    placeholder="Ej: 100"
                  />
                </div>
              </div>

              {/* Generación dinámica de campos de años */}
              <div className="space-y-6 border-t border-neutral-200 pt-6">
                <h5 className="text-sm font-medium text-neutral-700 mb-3">
                  Valores por Año ({planYears.length} años) - Basado en Plan Estratégico
                </h5>
                
                {/* Fila de Valores Absolutos */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-neutral-600">Valores Absolutos</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planYears.map((year) => (
                      <div key={`abs-${year}`} className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          Año {year}
                        </label>
                        <input
                          type="text"
                          className="input-base"
                          placeholder={`Valor absoluto para ${year}`}
                          value={indicatorInputValues[year.toString()]?.absolute || ''}
                          onChange={(e) => handleIndicatorValueChange(year, 'absolute', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fila de Valores Relativos */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-neutral-600">Valores Relativos (%)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planYears.map((year) => (
                      <div key={`rel-${year}`} className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          Año {year}
                        </label>
                        <input
                          type="text"
                          className="input-base"
                          placeholder={`Valor relativo para ${year}`}
                          value={indicatorInputValues[year.toString()]?.relative || ''}
                          onChange={(e) => handleIndicatorValueChange(year, 'relative', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIndicatorFormModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingIndicator ? 'Actualizar Indicador' : 'Guardar Indicador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Indicadores Modal - FUERA DE AMBAS PESTAÑAS */}
      {showIndicatorsModal && (selectedObjective || selectedAction) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Indicadores {selectedObjective ? 'del Objetivo' : 'de la Acción'}: {selectedObjective ? selectedObjective.code : selectedAction?.code}
              </h3>
              <button
                onClick={() => setShowIndicatorsModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>

            {/* Indicators Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-neutral-900">Indicadores Registrados</h4>
              </div>
              
              {indicatorsLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  Cargando indicadores...
                </div>
              ) : indicators.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No hay indicadores registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Código de Indicador</th>
                        <th className="table-header-cell">Enunciado</th>
                        <th className="table-header-cell">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {indicators.map((indicator) => (
                        <tr key={indicator.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">{indicator.code}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-neutral-600">{indicator.statement}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditIndicator(indicator)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                              title="Editar"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIndicator(indicator.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
