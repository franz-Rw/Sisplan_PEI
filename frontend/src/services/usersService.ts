import apiClient from './api'

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
  costCenterId?: string
  costCenter?: {
    id: string
    code: string
    description?: string
  }
  status: 'ACTIVO' | 'INACTIVO'
  createdAt: string
  updatedAt: string
}

export interface CostCenterOption {
  id: string
  code: string
  description?: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role?: 'ADMIN' | 'OPERATOR'
  costCenterId?: string
  status?: 'ACTIVO' | 'INACTIVO'
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  password?: string
}

export const usersService = {
  // Obtener todos los usuarios
  getAll: async (search?: string, role?: string, status?: string, costCenterId?: string): Promise<User[]> => {
    const params: any = {}
    if (search) params.search = search
    if (role) params.role = role
    if (status) params.status = status
    if (costCenterId) params.costCenterId = costCenterId
    
    const response = await apiClient.get('/users', { params })
    return response.data
  },

  // Obtener centros de costo para asignación
  getCostCentersForAssignment: async (): Promise<CostCenterOption[]> => {
    const response = await apiClient.get('/users/cost-centers')
    return response.data
  },

  // Crear nuevo usuario
  create: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/users', userData)
    return response.data
  },

  // Actualizar usuario
  update: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  },

  // Eliminar usuario
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  }
}
