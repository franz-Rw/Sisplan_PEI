import apiClient from './api'

export interface StrategicObjective {
  id: string
  planId: string
  code: string
  statement: string
  responsibleId?: string
  responsible?: {
    id: string
    code: string
    description?: string
  }
  _count?: {
    indicators: number
  }
  createdAt: string
  updatedAt: string
}

export interface StrategicAction {
  id: string
  planId: string
  objectiveId?: string
  code: string
  statement: string
  responsibleId?: string
  responsible?: {
    id: string
    code: string
    description?: string
  }
  objective?: {
    id: string
    code: string
    statement: string
  }
  _count?: {
    indicators: number
  }
  createdAt: string
  updatedAt: string
}

export interface Indicator {
  id: string
  objectiveId?: string
  actionId?: string
  code: string
  statement: string
  responsibleId?: string
  responsible?: {
    id: string
    code: string
    description?: string
  }
  formula?: string
  parameter?: string
  baseYear?: number
  baseValue?: number
  indicatorValues?: IndicatorValue[]
  createdAt: string
  updatedAt: string
}

export interface IndicatorValue {
  id: string
  indicatorId: string
  year: number
  value: number
  type: 'ABSOLUTE' | 'RELATIVE'
  createdAt: string
  updatedAt: string
}

export interface CostCenterOption {
  id: string
  code: string
  description?: string
}

export interface CreateObjectiveRequest {
  planId: string
  code: string
  statement: string
  responsibleId?: string
}

export interface CreateActionRequest {
  planId: string
  objectiveId?: string
  code: string
  statement: string
  responsibleId?: string
}

export interface CreateIndicatorRequest {
  planId: string
  objectiveId?: string
  actionId?: string
  code: string
  statement: string
  responsibleId?: string
  formula?: string
  parameter?: string
  baseYear?: number
  baseValue?: number
}

export interface CreateIndicatorValueRequest {
  indicatorId: string
  year: number
  value: number
  type: 'ABSOLUTE' | 'RELATIVE'
}

export const strategicObjectivesService = {
  getAll: async (): Promise<StrategicObjective[]> => {
    const response = await apiClient.get('/strategic-objectives')
    return response.data
  },

  getById: async (id: string): Promise<StrategicObjective> => {
    const response = await apiClient.get(`/strategic-objectives/${id}`)
    return response.data
  },

  getCostCentersForAssignment: async (): Promise<CostCenterOption[]> => {
    const response = await apiClient.get('/strategic-objectives/cost-centers')
    return response.data
  },

  create: async (objectiveData: CreateObjectiveRequest): Promise<StrategicObjective> => {
    const response = await apiClient.post('/strategic-objectives', objectiveData)
    return response.data
  },

  update: async (id: string, objectiveData: Partial<CreateObjectiveRequest>): Promise<StrategicObjective> => {
    const response = await apiClient.put(`/strategic-objectives/${id}`, objectiveData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/strategic-objectives/${id}`)
  }
}

export const strategicActionsService = {
  getAll: async (): Promise<StrategicAction[]> => {
    const response = await apiClient.get('/strategic-actions')
    return response.data
  },

  getById: async (id: string): Promise<StrategicAction> => {
    const response = await apiClient.get(`/strategic-actions/${id}`)
    return response.data
  },

  create: async (actionData: CreateActionRequest): Promise<StrategicAction> => {
    const response = await apiClient.post('/strategic-actions', actionData)
    return response.data
  },

  update: async (id: string, actionData: Partial<CreateActionRequest>): Promise<StrategicAction> => {
    const response = await apiClient.put(`/strategic-actions/${id}`, actionData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/strategic-actions/${id}`)
  }
}

export const indicatorsService = {
  // Obtener todos los indicadores
  getAll: async (): Promise<Indicator[]> => {
    try {
      const response = await apiClient.get('/indicators')
      // Asegurar que siempre devuelva un array
      const data = response.data
      return Array.isArray(data) ? data : (data?.data || [])
    } catch (error) {
      console.error('Error fetching all indicators:', error)
      return []
    }
  },

  getById: async (id: string): Promise<Indicator> => {
    const response = await apiClient.get(`/indicators/${id}`)
    return response.data
  },

  // Obtener indicadores por objetivo
  getByObjective: async (objectiveId: string): Promise<Indicator[]> => {
    const response = await apiClient.get(`/strategic-objectives/${objectiveId}/indicators`)
    return response.data
  },

  // Obtener indicadores por acción
  getByAction: async (actionId: string): Promise<Indicator[]> => {
    const response = await apiClient.get(`/strategic-actions/${actionId}/indicators`)
    return response.data
  },

  // Obtener centros de costo para asignación
  getCostCentersForAssignment: async (): Promise<CostCenterOption[]> => {
    const response = await apiClient.get('/indicators/cost-centers')
    return response.data
  },

  // Crear indicador
  create: async (indicatorData: CreateIndicatorRequest): Promise<Indicator> => {
    const response = await apiClient.post('/indicators', indicatorData)
    return response.data
  },

  // Actualizar indicador
  update: async (id: string, indicatorData: Partial<CreateIndicatorRequest>): Promise<Indicator> => {
    const response = await apiClient.put(`/indicators/${id}`, indicatorData)
    return response.data
  },

  // Eliminar indicador
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/indicators/${id}`)
  }
}

export const indicatorValuesService = {
  // Crear valor absoluto
  createAbsolute: async (valueData: CreateIndicatorValueRequest): Promise<IndicatorValue> => {
    const response = await apiClient.post('/indicator-values/absolute', valueData)
    return response.data
  },

  // Crear valor relativo
  createRelative: async (valueData: CreateIndicatorValueRequest): Promise<IndicatorValue> => {
    const response = await apiClient.post('/indicator-values/relative', valueData)
    return response.data
  },

  // Actualizar valor
  update: async (id: string, valueData: Partial<CreateIndicatorValueRequest>): Promise<IndicatorValue> => {
    const response = await apiClient.put(`/indicator-values/${id}`, valueData)
    return response.data
  },

  // Eliminar valor
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/indicator-values/${id}`)
  }
}
