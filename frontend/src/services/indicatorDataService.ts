import apiClient from './api'

export interface IndicatorDataRecord {
  id: string
  variableId: string
  costCenterId?: string
  costCenterCode: string
  year: number
  values: Record<string, unknown>
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  createdBy: string
  variable?: {
    id: string
    code: string
    name: string
    fields: Array<{
      id: string
      name: string
      type: string
      label: string
      required: boolean
      placeholder?: string
      options?: string[]
    }>
    indicator?: {
      id: string
      code: string
      statement: string
      planId: string
      objectiveId?: string
      actionId?: string
      plan?: {
        id: string
        name: string
      }
      objective?: {
        id: string
        code: string
        statement: string
      }
      action?: {
        id: string
        code: string
        statement: string
        objective?: {
          id: string
          code: string
          statement: string
        }
      }
    }
  }
  costCenter?: {
    id: string
    code: string
    description?: string
  }
}

export const indicatorDataService = {
  // Obtener datos de una variable con rango de fechas
  getByVariableAndDateRange: async (
    variableId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<IndicatorDataRecord[]> => {
    const params: any = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    try {
      const response = await apiClient.get(`/indicator-data/variable/${variableId}`, { params })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      return []
    }
  },

  // Obtener datos de una variable por año
  getByVariableAndYear: async (
    variableId: string,
    year: number
  ): Promise<IndicatorDataRecord[]> => {
    try {
      const response = await apiClient.get(`/indicator-data/variable/${variableId}`, {
        params: { year }
      })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      return []
    }
  },

  // Obtener datos de una variable por centro de costo
  getByVariableAndCostCenter: async (
    variableId: string,
    costCenterId: string
  ): Promise<IndicatorDataRecord[]> => {
    try {
      const response = await apiClient.get(`/indicator-data/variable/${variableId}`, {
        params: { costCenterId }
      })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      return []
    }
  },

  // Obtener datos de una variable por estado
  getByVariableAndStatus: async (
    variableId: string,
    status: 'draft' | 'pending' | 'approved' | 'rejected'
  ): Promise<IndicatorDataRecord[]> => {
    try {
      const response = await apiClient.get(`/indicator-data/variable/${variableId}`, {
        params: { status }
      })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching indicator data by status:', error)
      return []
    }
  },

  // Obtener todos los datos pendientes (nuevo método)
  getAllPending: async (): Promise<IndicatorDataRecord[]> => {
    try {
      const response = await apiClient.get('/indicator-data/all', {
        params: { status: 'pending' }
      })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching all pending indicator data:', error)
      return []
    }
  },

  // Obtener todos los datos con filtros opcionales
  getAll: async (filters?: { status?: string }): Promise<IndicatorDataRecord[]> => {
    try {
      const params: any = {}
      if (filters?.status) params.status = filters.status
      
      const response = await apiClient.get('/indicator-data/all', { params })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching all indicator data:', error)
      return []
    }
  },

  // Actualizar el estado de un registro
  updateStatus: async (
    recordId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> => {
    try {
      await apiClient.patch(`/indicator-data/${recordId}`, { status })
    } catch (error) {
      console.error('Error updating indicator data status:', error)
      throw error
    }
  }
}
