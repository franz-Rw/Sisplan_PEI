import apiClient from './api'

export interface CostCenter {
  id: string
  code: string
  description?: string
  parentId?: string
  parent?: {
    id: string
    code: string
    description?: string
  }
  assignedUserId?: string
  assignedUser?: {
    id: string
    name: string
    email: string
  }
  status: 'ACTIVO' | 'INACTIVO'
  users: any[]
  _count?: {
    users: number
  }
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
}

export interface CreateCostCenterRequest {
  code: string
  description?: string
  parentId?: string
  assignedUserId?: string
  status?: 'ACTIVO' | 'INACTIVO'
}

export interface UpdateCostCenterRequest extends Partial<CreateCostCenterRequest> {}

export const costCentersService = {
  // Obtener todos los centros de costo
  getAll: async (search?: string, status?: string): Promise<CostCenter[]> => {
    try {
      const params: any = {}
      if (search) params.search = search
      if (status) params.status = status
      
      console.log('Fetching cost centers with params:', params)
      const response = await apiClient.get('/cost-centers', { params })
      console.log('Cost centers response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error in getAll cost centers:', error)
      throw error
    }
  },

  // Obtener un centro de costo por ID
  getById: async (id: string): Promise<CostCenter> => {
    try {
      if (!id) {
        throw new Error('ID de centro de costo es requerido')
      }
      
      const response = await apiClient.get(`/cost-centers/${id}`)
      return response.data
    } catch (error) {
      console.error('Error getting cost center by ID:', error)
      
      // Si es un 404, lanzar un error más específico
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Centro de costo no encontrado')
      }
      
      throw error
    }
  },

  // Obtener usuarios para asignación
  getUsersForAssignment: async (): Promise<User[]> => {
    const response = await apiClient.get('/cost-centers/users')
    return response.data
  },

  // Obtener centros padres
  getParentCostCenters: async (): Promise<CostCenter[]> => {
    const response = await apiClient.get('/cost-centers/parents')
    return response.data
  },

  // Crear nuevo centro de costo
  create: async (costCenterData: CreateCostCenterRequest): Promise<CostCenter> => {
    const response = await apiClient.post('/cost-centers', costCenterData)
    return response.data
  },

  // Actualizar centro de costo
  update: async (id: string, costCenterData: UpdateCostCenterRequest): Promise<CostCenter> => {
    const response = await apiClient.put(`/cost-centers/${id}`, costCenterData)
    return response.data
  },

  // Eliminar centro de costo
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-centers/${id}`)
  }
}
