import apiClient from './api'

export interface StrategicPlan {
  id: string
  name: string
  description?: string
  startYear: number
  endYear: number
  status: 'VIGENTE' | 'NO_VIGENTE' | 'AMPLIADO'
  ceplanValidationDoc?: string
  approvalDoc?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePlanRequest {
  name: string
  startYear: number
  endYear: number
  status?: 'VIGENTE' | 'NO_VIGENTE' | 'AMPLIADO'
  ceplanValidationDoc?: string
  approvalDoc?: string
  description?: string
}

export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {}

export const plansService = {
  // Obtener todos los planes
  getAll: async (status?: string): Promise<StrategicPlan[]> => {
    const params = status ? { status } : {}
    const response = await apiClient.get('/plans', { params })
    return response.data
  },

  // Obtener un plan por ID
  getById: async (id: string): Promise<StrategicPlan> => {
    const response = await apiClient.get(`/plans/${id}`)
    return response.data
  },

  // Crear nuevo plan
  create: async (planData: CreatePlanRequest): Promise<StrategicPlan> => {
    const response = await apiClient.post('/plans', planData)
    return response.data
  },

  // Actualizar plan
  update: async (id: string, planData: UpdatePlanRequest): Promise<StrategicPlan> => {
    const response = await apiClient.put(`/plans/${id}`, planData)
    return response.data
  },

  // Eliminar plan
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/plans/${id}`)
  }
}
