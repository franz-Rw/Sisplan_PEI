import { useEffect, useState } from 'react'
import { FiBarChart, FiCalendar, FiEdit2, FiSave, FiTarget, FiTrash2 } from 'react-icons/fi'
import apiClient from '@services/api'
import { plansService, StrategicPlan } from '@services/plansService'
import {
  Indicator,
  StrategicAction,
  StrategicObjective,
  indicatorsService,
  strategicActionsService,
  strategicObjectivesService,
} from '@services/strategicService'

interface IndicatorResultRelation {
  id: string
  code: string
  statement: string
}

interface IndicatorResultPlan {
  id: string
  name: string
}

interface IndicatorResultIndicator {
  id: string
  code: string
  statement: string
  parameter?: string | null
}

interface IndicatorResult {
  id: string
  planId: string
  objectiveId?: string | null
  actionId?: string | null
  indicatorId: string
  year: number
  expectedValue: number
  obtainedValue?: number | null
  createdAt: string
  updatedAt: string
  plan?: IndicatorResultPlan
  objective?: IndicatorResultRelation | null
  action?: IndicatorResultRelation | null
  indicator?: IndicatorResultIndicator | null
}

type TrackingTab = 'objectives' | 'actions'

type TrackingState = {
  planId: string
  objectiveId: string
  actionId: string
  indicatorId: string
  objectives: StrategicObjective[]
  actions: StrategicAction[]
  indicators: Indicator[]
  results: IndicatorResult[]
  obtainedValues: Record<number, string>
  loading: boolean
  saving: boolean
  editing: boolean
  editingResultId: string | null
  error: string | null
}

type YearEntry = {
  year: number
  expectedValue: number | null
  type: 'ABSOLUTE' | 'RELATIVE'
}

type ParameterPresentation = {
  family: 'ABSOLUTE' | 'RELATIVE'
  label: string
  suffix: string
  step: string
}

const createInitialTrackingState = (): TrackingState => ({
  planId: '',
  objectiveId: '',
  actionId: '',
  indicatorId: '',
  objectives: [],
  actions: [],
  indicators: [],
  results: [],
  obtainedValues: {},
  loading: false,
  saving: false,
  editing: false,
  editingResultId: null,
  error: null,
})

const normalizeArrayResponse = <T,>(responseData: unknown): T[] => {
  if (Array.isArray(responseData)) {
    return responseData as T[]
  }

  if (responseData && typeof responseData === 'object') {
    for (const key of ['data', 'items', 'results']) {
      const nestedValue = (responseData as Record<string, unknown>)[key]
      if (Array.isArray(nestedValue)) {
        return nestedValue as T[]
      }
    }
  }

  return []
}

const getParameterPresentation = (indicator?: Indicator): ParameterPresentation => {
  const normalizedParameter = (indicator?.parameter || '').trim()
  const parameterLabel = normalizedParameter || 'Número'
  const lowerParameter = normalizedParameter.toLowerCase()
  const valueType = indicator?.indicatorValues?.[0]?.type

  if (lowerParameter.includes('porcentaje')) {
    return { family: 'RELATIVE', label: 'Porcentaje', suffix: '%', step: '0.01' }
  }

  if (lowerParameter.includes('tasa de variación') || lowerParameter.includes('tasa de variacion')) {
    return { family: 'RELATIVE', label: 'Tasa de Variación', suffix: '', step: '0.01' }
  }

  if (lowerParameter.includes('variación') || lowerParameter.includes('variacion')) {
    return { family: 'RELATIVE', label: 'Variación', suffix: '', step: '0.01' }
  }

  if (lowerParameter.includes('ratio')) {
    return { family: 'RELATIVE', label: 'Ratio', suffix: '', step: '0.01' }
  }

  if (lowerParameter.includes('tasa')) {
    return { family: 'RELATIVE', label: 'Tasa', suffix: '', step: '0.01' }
  }

  if (lowerParameter.includes('promedio')) {
    return { family: 'ABSOLUTE', label: 'Promedio', suffix: '', step: '0.01' }
  }

  if (valueType === 'RELATIVE') {
    return { family: 'RELATIVE', label: parameterLabel, suffix: '', step: '0.01' }
  }

  return { family: 'ABSOLUTE', label: parameterLabel, suffix: '', step: '0.01' }
}

const buildYearEntries = (indicator: Indicator | undefined, plan: StrategicPlan | undefined): YearEntry[] => {
  const indicatorValues = [...(indicator?.indicatorValues || [])]
    .sort((left, right) => left.year - right.year)
    .filter((value, index, array) => index === 0 || array[index - 1].year !== value.year)

  if (indicatorValues.length > 0) {
    return indicatorValues.map(value => ({
      year: value.year,
      expectedValue: value.value,
      type: value.type,
    }))
  }

  if (!plan) {
    return []
  }

  return Array.from({ length: plan.endYear - plan.startYear + 1 }, (_, index) => ({
    year: plan.startYear + index,
    expectedValue: null,
    type: 'ABSOLUTE' as const,
  }))
}

const buildObtainedValues = (yearEntries: YearEntry[], results: IndicatorResult[]) =>
  yearEntries.reduce<Record<number, string>>((accumulator, entry) => {
    const result = results.find(item => item.year === entry.year)
    accumulator[entry.year] =
      result?.obtainedValue === null || result?.obtainedValue === undefined
        ? ''
        : String(result.obtainedValue)
    return accumulator
  }, {})

const formatNumericValue = (value: number | null | undefined, suffix = '') => {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${value}${suffix}`
}

const extractApiError = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'error' in error.response.data &&
    typeof error.response.data.error === 'string'
  ) {
    return error.response.data.error
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

export default function IndicatorTracking() {
  const [activeTab, setActiveTab] = useState<TrackingTab>('objectives')
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [trackingState, setTrackingState] = useState<Record<TrackingTab, TrackingState>>({
    objectives: createInitialTrackingState(),
    actions: createInitialTrackingState(),
  })

  const patchTabState = (tab: TrackingTab, patch: Partial<TrackingState>) => {
    setTrackingState(previousState => ({
      ...previousState,
      [tab]: {
        ...previousState[tab],
        ...patch,
      },
    }))
  }

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true)
        setPlansError(null)
        const response = await plansService.getAll()
        setPlans(normalizeArrayResponse<StrategicPlan>(response))
      } catch (error) {
        console.error('Error loading plans:', error)
        setPlans([])
        setPlansError(extractApiError(error, 'No se pudieron cargar los planes estratégicos'))
      } finally {
        setPlansLoading(false)
      }
    }

    loadPlans()
  }, [])

  const loadObjectivesForTab = async (tab: TrackingTab, planId: string) => {
    try {
      patchTabState(tab, { loading: true, error: null })
      const objectives = await strategicObjectivesService.getByPlan(planId)

      setTrackingState(previousState => {
        if (previousState[tab].planId !== planId) {
          return previousState
        }

        return {
          ...previousState,
          [tab]: {
            ...previousState[tab],
            objectives: normalizeArrayResponse<StrategicObjective>(objectives),
            loading: false,
          },
        }
      })
    } catch (error) {
      console.error('Error loading objectives:', error)
      patchTabState(tab, {
        objectives: [],
        loading: false,
        error: extractApiError(error, 'No se pudieron cargar los objetivos estratégicos'),
      })
    }
  }

  const loadActionsForTab = async (planId: string, objectiveId: string) => {
    try {
      patchTabState('actions', { loading: true, error: null })
      const actions = await strategicActionsService.getAll({ planId, objectiveId })

      setTrackingState(previousState => {
        if (
          previousState.actions.planId !== planId ||
          previousState.actions.objectiveId !== objectiveId
        ) {
          return previousState
        }

        return {
          ...previousState,
          actions: {
            ...previousState.actions,
            actions: normalizeArrayResponse<StrategicAction>(actions),
            loading: false,
          },
        }
      })
    } catch (error) {
      console.error('Error loading actions:', error)
      patchTabState('actions', {
        actions: [],
        loading: false,
        error: extractApiError(error, 'No se pudieron cargar las acciones estratégicas'),
      })
    }
  }

  const loadIndicatorsForTab = async (
    tab: TrackingTab,
    relationId: string,
    relationType: 'objective' | 'action'
  ) => {
    try {
      patchTabState(tab, { loading: true, error: null })

      const indicators =
        relationType === 'objective'
          ? await indicatorsService.getByObjective(relationId)
          : await indicatorsService.getByAction(relationId)

      setTrackingState(previousState => {
        const shouldApply =
          relationType === 'objective'
            ? previousState[tab].objectiveId === relationId
            : previousState[tab].actionId === relationId

        if (!shouldApply) {
          return previousState
        }

        return {
          ...previousState,
          [tab]: {
            ...previousState[tab],
            indicators: normalizeArrayResponse<Indicator>(indicators),
            loading: false,
          },
        }
      })
    } catch (error) {
      console.error('Error loading indicators:', error)
      patchTabState(tab, {
        indicators: [],
        loading: false,
        error: extractApiError(error, 'No se pudieron cargar los indicadores'),
      })
    }
  }

  const loadResultsForTab = async ({
    tab,
    indicatorId,
    planId,
    objectiveId,
    actionId,
    indicator,
  }: {
    tab: TrackingTab
    indicatorId: string
    planId: string
    objectiveId?: string
    actionId?: string
    indicator?: Indicator
  }) => {
    try {
      patchTabState(tab, { loading: true, error: null })

      const plan = plans.find(item => item.id === planId)
      const response = await apiClient.get(`/indicator-results/indicator/${indicatorId}`, {
        params: {
          planId,
          ...(objectiveId ? { objectiveId } : {}),
          ...(actionId ? { actionId } : {}),
        },
      })

      const results = normalizeArrayResponse<IndicatorResult>(response.data)
      const yearEntries = buildYearEntries(indicator, plan)

      setTrackingState(previousState => {
        const currentState = previousState[tab]
        const selectionMatches =
          currentState.planId === planId &&
          currentState.indicatorId === indicatorId &&
          currentState.objectiveId === (objectiveId || '') &&
          currentState.actionId === (actionId || '')

        if (!selectionMatches) {
          return previousState
        }

        return {
          ...previousState,
          [tab]: {
            ...currentState,
            results,
            obtainedValues: buildObtainedValues(yearEntries, results),
            loading: false,
            editing: false,
            editingResultId: null,
          },
        }
      })
    } catch (error) {
      console.error('Error loading results:', error)
      patchTabState(tab, {
        results: [],
        loading: false,
        error: extractApiError(error, 'No se pudieron cargar los resultados históricos'),
      })
    }
  }

  const handlePlanChange = async (tab: TrackingTab, planId: string) => {
    patchTabState(tab, {
      planId,
      objectiveId: '',
      actionId: '',
      indicatorId: '',
      objectives: [],
      actions: [],
      indicators: [],
      results: [],
      obtainedValues: {},
      editing: false,
      editingResultId: null,
      error: null,
    })

    if (!planId) {
      return
    }

    await loadObjectivesForTab(tab, planId)
  }

  const handleObjectiveChange = async (tab: TrackingTab, objectiveId: string) => {
    const currentState = trackingState[tab]

    patchTabState(tab, {
      objectiveId,
      actionId: '',
      indicatorId: '',
      actions: [],
      indicators: [],
      results: [],
      obtainedValues: {},
      editing: false,
      editingResultId: null,
      error: null,
    })

    if (!objectiveId) {
      return
    }

    if (tab === 'objectives') {
      await loadIndicatorsForTab('objectives', objectiveId, 'objective')
      return
    }

    if (currentState.planId) {
      await loadActionsForTab(currentState.planId, objectiveId)
    }
  }

  const handleActionChange = async (actionId: string) => {
    patchTabState('actions', {
      actionId,
      indicatorId: '',
      indicators: [],
      results: [],
      obtainedValues: {},
      editing: false,
      editingResultId: null,
      error: null,
    })

    if (!actionId) {
      return
    }

    await loadIndicatorsForTab('actions', actionId, 'action')
  }

  const handleIndicatorChange = async (tab: TrackingTab, indicatorId: string) => {
    const currentState = trackingState[tab]
    const selectedPlan = plans.find(plan => plan.id === currentState.planId)
    const selectedIndicator = currentState.indicators.find(indicator => indicator.id === indicatorId)
    const yearEntries = buildYearEntries(selectedIndicator, selectedPlan)

    patchTabState(tab, {
      indicatorId,
      results: [],
      obtainedValues: buildObtainedValues(yearEntries, []),
      editing: false,
      editingResultId: null,
      error: null,
    })

    if (!indicatorId) {
      return
    }

    await loadResultsForTab({
      tab,
      indicatorId,
      planId: currentState.planId,
      objectiveId: tab === 'objectives' ? currentState.objectiveId : undefined,
      actionId: tab === 'actions' ? currentState.actionId : undefined,
      indicator: selectedIndicator,
    })
  }

  const handleSave = async (tab: TrackingTab) => {
    const currentState = trackingState[tab]
    const selectedPlan = plans.find(plan => plan.id === currentState.planId)
    const selectedIndicator = currentState.indicators.find(
      indicator => indicator.id === currentState.indicatorId
    )
    const yearEntries = buildYearEntries(selectedIndicator, selectedPlan)

    if (!currentState.planId || !currentState.indicatorId || !selectedIndicator) {
      alert('Debe seleccionar un plan y un indicador antes de guardar')
      return
    }

    if (yearEntries.length === 0) {
      alert('El indicador no tiene horizonte temporal ni metas esperadas configuradas')
      return
    }

    const payloads: Array<{
      planId: string
      objectiveId?: string
      actionId?: string
      indicatorId: string
      year: number
      obtainedValue: number
    }> = []

    for (const entry of yearEntries) {
      const rawValue = currentState.obtainedValues[entry.year]

      if (rawValue === undefined || rawValue.trim() === '') {
        continue
      }

      const numericValue = Number(rawValue)
      if (!Number.isFinite(numericValue)) {
        alert(`El valor obtenido del año ${entry.year} no es válido`)
        return
      }

      if (entry.expectedValue === null) {
        alert(
          `No se puede guardar el año ${entry.year} porque el indicador no tiene un valor esperado configurado`
        )
        return
      }

      payloads.push({
        planId: currentState.planId,
        ...(tab === 'objectives' && currentState.objectiveId
          ? { objectiveId: currentState.objectiveId }
          : {}),
        ...(tab === 'actions' && currentState.actionId ? { actionId: currentState.actionId } : {}),
        indicatorId: currentState.indicatorId,
        year: entry.year,
        obtainedValue: numericValue,
      })
    }

    if (payloads.length === 0) {
      alert('Debe ingresar al menos un resultado obtenido')
      return
    }

    try {
      patchTabState(tab, { saving: true, error: null })

      await Promise.all(payloads.map(payload => apiClient.post('/indicator-results', payload)))

      await loadResultsForTab({
        tab,
        indicatorId: currentState.indicatorId,
        planId: currentState.planId,
        objectiveId: tab === 'objectives' ? currentState.objectiveId : undefined,
        actionId: tab === 'actions' ? currentState.actionId : undefined,
        indicator: selectedIndicator,
      })

      patchTabState(tab, {
        saving: false,
        editing: false,
        editingResultId: null,
      })

      alert(currentState.editing ? 'Resultados actualizados correctamente' : 'Resultados guardados correctamente')
    } catch (error) {
      console.error('Error saving results:', error)
      patchTabState(tab, {
        saving: false,
        error: extractApiError(error, 'No se pudieron guardar los resultados'),
      })
      alert(extractApiError(error, 'No se pudieron guardar los resultados'))
    }
  }

  const handleEdit = (tab: TrackingTab, result: IndicatorResult) => {
    const currentState = trackingState[tab]
    const selectedPlan = plans.find(plan => plan.id === currentState.planId)
    const selectedIndicator = currentState.indicators.find(
      indicator => indicator.id === currentState.indicatorId
    )
    const yearEntries = buildYearEntries(selectedIndicator, selectedPlan)

    patchTabState(tab, {
      editing: true,
      editingResultId: result.id,
      obtainedValues: buildObtainedValues(yearEntries, currentState.results),
      error: null,
    })
  }

  const handleDelete = async (tab: TrackingTab, result: IndicatorResult) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) {
      return
    }

    try {
      patchTabState(tab, { saving: true, error: null })
      await apiClient.delete(`/indicator-results/${result.id}`)

      const currentState = trackingState[tab]
      const selectedPlan = plans.find(plan => plan.id === currentState.planId)
      const selectedIndicator = currentState.indicators.find(
        indicator => indicator.id === currentState.indicatorId
      )

      await loadResultsForTab({
        tab,
        indicatorId: currentState.indicatorId,
        planId: currentState.planId,
        objectiveId: tab === 'objectives' ? currentState.objectiveId : undefined,
        actionId: tab === 'actions' ? currentState.actionId : undefined,
        indicator: selectedIndicator,
      })

      const yearEntries = buildYearEntries(selectedIndicator, selectedPlan)
      const remainingResults = trackingState[tab].results.filter(item => item.id !== result.id)

      patchTabState(tab, {
        saving: false,
        editing: false,
        editingResultId: null,
        obtainedValues: buildObtainedValues(yearEntries, remainingResults),
      })

      alert('Registro eliminado correctamente')
    } catch (error) {
      console.error('Error deleting result:', error)
      patchTabState(tab, {
        saving: false,
        error: extractApiError(error, 'No se pudo eliminar el registro'),
      })
      alert(extractApiError(error, 'No se pudo eliminar el registro'))
    }
  }

  const currentState = trackingState[activeTab]
  const selectedPlan = plans.find(plan => plan.id === currentState.planId)
  const selectedObjective = currentState.objectives.find(
    objective => objective.id === currentState.objectiveId
  )
  const selectedAction = currentState.actions.find(action => action.id === currentState.actionId)
  const selectedIndicator = currentState.indicators.find(
    indicator => indicator.id === currentState.indicatorId
  )
  const yearEntries = buildYearEntries(selectedIndicator, selectedPlan)
  const parameterPresentation = getParameterPresentation(selectedIndicator)
  const hasMissingExpectedValues = yearEntries.some(entry => entry.expectedValue === null)
  const tabContextLabel =
    activeTab === 'objectives' ? 'Objetivo Estratégico Institucional' : 'Acción Estratégica Institucional'

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Seguimiento de Indicadores</h1>
        <p className="text-neutral-600">
          Gestione, registre y monitoree el avance de los indicadores estratégicos institucionales.
        </p>
      </div>

      <div className="flex gap-4 border-b border-neutral-200 mb-6">
        <button
          onClick={() => setActiveTab('objectives')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'objectives'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Indicadores de Objetivos Estratégicos
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'actions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Indicadores de Acciones Estratégicas
        </button>
      </div>

      {(plansError || currentState.error) && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {plansError || currentState.error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Filtros Jerárquicos</h2>

        <div
          className={`grid grid-cols-1 gap-4 ${
            activeTab === 'actions' ? 'md:grid-cols-4' : 'md:grid-cols-3'
          }`}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Planes</label>
            <select
              value={currentState.planId}
              onChange={event => void handlePlanChange(activeTab, event.target.value)}
              disabled={plansLoading || currentState.loading || currentState.saving}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              <option value="">Seleccionar plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.startYear} - {plan.endYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Objetivos Estratégicos Institucionales
            </label>
            <select
              value={currentState.objectiveId}
              onChange={event => void handleObjectiveChange(activeTab, event.target.value)}
              disabled={!currentState.planId || currentState.loading || currentState.saving}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              <option value="">Seleccionar objetivo</option>
              {currentState.objectives.map(objective => (
                <option key={objective.id} value={objective.id}>
                  {objective.code} - {objective.statement}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'actions' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Acciones Estratégicas Institucionales
              </label>
              <select
                value={currentState.actionId}
                onChange={event => void handleActionChange(event.target.value)}
                disabled={!currentState.objectiveId || currentState.loading || currentState.saving}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
              >
                <option value="">Seleccionar acción</option>
                {currentState.actions.map(action => (
                  <option key={action.id} value={action.id}>
                    {action.code} - {action.statement}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {activeTab === 'objectives'
                ? 'Indicadores de Objetivos Estratégicos Institucionales'
                : 'Indicadores de Acciones Estratégicas Institucionales'}
            </label>
            <select
              value={currentState.indicatorId}
              onChange={event => void handleIndicatorChange(activeTab, event.target.value)}
              disabled={
                activeTab === 'objectives'
                  ? !currentState.objectiveId || currentState.loading || currentState.saving
                  : !currentState.actionId || currentState.loading || currentState.saving
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              <option value="">Seleccionar indicador</option>
              {currentState.indicators.map(indicator => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.code} - {indicator.statement}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentState.loading && (
          <p className="mt-4 text-sm text-neutral-500">Cargando información relacionada...</p>
        )}
      </div>

      {selectedPlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FiTarget className="w-5 h-5" />
              Contexto Seleccionado
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-neutral-700">Plan Estratégico</span>
                <p className="text-neutral-900">{selectedPlan.name}</p>
              </div>

              {selectedObjective && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    Objetivo Estratégico Institucional
                  </span>
                  <p className="text-neutral-900">
                    {selectedObjective.code} - {selectedObjective.statement}
                  </p>
                </div>
              )}

              {activeTab === 'actions' && selectedAction && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    Acción Estratégica Institucional
                  </span>
                  <p className="text-neutral-900">
                    {selectedAction.code} - {selectedAction.statement}
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedIndicator && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <FiBarChart className="w-5 h-5" />
                Información del Indicador
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-neutral-700">Código</span>
                  <p className="text-neutral-900">{selectedIndicator.code}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-neutral-700">Nombre</span>
                  <p className="text-neutral-900">{selectedIndicator.statement}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-neutral-700">Parámetro</span>
                  <p className="text-neutral-900">{selectedIndicator.parameter || 'No definido'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-neutral-700">Tipo de visualización</span>
                  <p className="text-neutral-900">{parameterPresentation.label}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-neutral-700">Valores esperados por año</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {yearEntries.length > 0 ? (
                      yearEntries.map(entry => (
                        <span
                          key={entry.year}
                          className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                        >
                          {entry.year}: {formatNumericValue(entry.expectedValue, parameterPresentation.suffix)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500">
                        No hay metas esperadas configuradas para este indicador.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedIndicator && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <FiCalendar className="w-5 h-5" />
            Registro de Resultados Obtenidos
          </h3>

          {hasMissingExpectedValues && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Existen años sin valor esperado configurado. Esos años no podrán guardarse hasta definir sus metas.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            {yearEntries.map(entry => (
              <div key={entry.year} className="rounded-lg border border-neutral-200 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-neutral-800">Año {entry.year}</p>
                  <p className="text-xs text-neutral-500">
                    Esperado: {formatNumericValue(entry.expectedValue, parameterPresentation.suffix)}
                  </p>
                </div>

                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Resultado obtenido
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={parameterPresentation.step}
                    value={currentState.obtainedValues[entry.year] || ''}
                    onChange={event =>
                      patchTabState(activeTab, {
                        obtainedValues: {
                          ...currentState.obtainedValues,
                          [entry.year]: event.target.value,
                        },
                      })
                    }
                    disabled={currentState.saving}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
                    placeholder="Ingrese valor obtenido"
                  />
                  {parameterPresentation.suffix && (
                    <span className="text-sm text-neutral-500">{parameterPresentation.suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSave(activeTab)}
              disabled={currentState.loading || currentState.saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-400 transition"
            >
              <FiSave className="w-4 h-4" />
              {currentState.saving
                ? currentState.editing
                  ? 'Actualizando...'
                  : 'Guardando...'
                : currentState.editing
                  ? 'Actualizar resultados'
                  : 'Guardar resultados'}
            </button>

            {currentState.editing && (
              <button
                onClick={() =>
                  patchTabState(activeTab, {
                    editing: false,
                    editingResultId: null,
                    obtainedValues: buildObtainedValues(yearEntries, currentState.results),
                  })
                }
                disabled={currentState.saving}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 disabled:bg-neutral-100"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </div>
      )}

      {selectedIndicator && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Registros Históricos</h3>

          {currentState.results.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Aún no existen resultados registrados para este indicador.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">
                      {tabContextLabel}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Indicador</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Parámetro</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Año</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Valor Esperado</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Valor Obtenido</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentState.results.map(result => (
                    <tr
                      key={result.id}
                      className={`border-b border-neutral-100 ${
                        currentState.editingResultId === result.id ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">{result.plan?.name || selectedPlan?.name || '-'}</td>
                      <td className="py-3 px-4">
                        {activeTab === 'objectives'
                          ? result.objective
                            ? `${result.objective.code} - ${result.objective.statement}`
                            : selectedObjective
                              ? `${selectedObjective.code} - ${selectedObjective.statement}`
                              : '-'
                          : result.action
                            ? `${result.action.code} - ${result.action.statement}`
                            : selectedAction
                              ? `${selectedAction.code} - ${selectedAction.statement}`
                              : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {result.indicator
                          ? `${result.indicator.code} - ${result.indicator.statement}`
                          : selectedIndicator
                            ? `${selectedIndicator.code} - ${selectedIndicator.statement}`
                            : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {result.indicator?.parameter || selectedIndicator?.parameter || '-'}
                      </td>
                      <td className="py-3 px-4">{result.year}</td>
                      <td className="py-3 px-4">
                        {formatNumericValue(result.expectedValue, parameterPresentation.suffix)}
                      </td>
                      <td className="py-3 px-4">
                        {formatNumericValue(result.obtainedValue, parameterPresentation.suffix)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(activeTab, result)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(activeTab, result)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
