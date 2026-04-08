import apiClient from './api'

export interface IndicatorVariable {
  id: string
  indicatorId: string
  code: string
  name: string
  description?: string
  fields: FormField[]
  indicator?: {
    id: string
    code: string
    statement: string
    plan?: {
      id: string
      name: string
    }
    objective?: {
      id: string
      code: string
    }
    action?: {
      id: string
      code: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface FormField {
  id: string
  type: 'date' | 'select' | 'integer' | 'decimal' | 'currency' | 'text' | 'textarea' | 'coordinates' | 'checkbox' | 'time'
  label: string
  name: string
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface CreateIndicatorVariableRequest {
  indicatorId: string
  name: string
  description?: string
  fields: FormField[]
}

export const indicatorVariablesService = {
  // Obtener todas las variables
  getAll: async (): Promise<IndicatorVariable[]> => {
    try {
      const response = await apiClient.get('/indicator-variables')
      const data = response.data
      return Array.isArray(data) ? data : (data?.data || [])
    } catch (error) {
      console.error('Error fetching all indicator variables:', error)
      return []
    }
  },

  // Obtener variables de indicadores de objetivos
  getObjectiveVariables: async (planId?: string, search?: string): Promise<IndicatorVariable[]> => {
    const params = new URLSearchParams()
    if (planId) params.append('planId', planId)
    if (search) params.append('search', search)
    
    const response = await apiClient.get(`/indicator-variables/objectives?${params}`)
    return response.data
  },

  // Obtener variables de indicadores de acciones
  getActionVariables: async (planId?: string, search?: string): Promise<IndicatorVariable[]> => {
    const params = new URLSearchParams()
    if (planId) params.append('planId', planId)
    if (search) params.append('search', search)
    
    const response = await apiClient.get(`/indicator-variables/actions?${params}`)
    return response.data
  },

  // Obtener variables por indicador
  getByIndicator: async (indicatorId: string): Promise<IndicatorVariable[]> => {
    const response = await apiClient.get(`/indicator-variables/indicator/${indicatorId}`)
    return response.data
  },

  // Obtener indicadores para variables de objetivos
  getObjectiveIndicators: async (planId?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (planId) params.append('planId', planId)
    
    const response = await apiClient.get(`/indicator-variables/objectives/indicators?${params}`)
    return response.data
  },

  // Obtener indicadores para variables de acciones
  getActionIndicators: async (planId?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (planId) params.append('planId', planId)
    
    const response = await apiClient.get(`/indicator-variables/actions/indicators?${params}`)
    return response.data
  },

  // Crear variable
  create: async (variableData: CreateIndicatorVariableRequest): Promise<IndicatorVariable> => {
    const response = await apiClient.post('/indicator-variables', variableData)
    return response.data
  },

  // Actualizar variable
  update: async (id: string, variableData: Partial<CreateIndicatorVariableRequest>): Promise<IndicatorVariable> => {
    const response = await apiClient.put(`/indicator-variables/${id}`, variableData)
    return response.data
  },

  // Eliminar variable
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/indicator-variables/${id}`)
  }
}
