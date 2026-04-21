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
      
      console.log('SERVICE GET ALL - Enviando request:', {
        url: '/cost-centers',
        method: 'GET',
        params: params
      })
      
      const response = await apiClient.get('/cost-centers', { params })
      
      console.log('SERVICE GET ALL - Respuesta recibida:', response.data)
      
      // Logging detallado para diagnóstico
      response.data.forEach((cc: any, index: number) => {
        console.log(`SERVICE GET ALL - Centro ${index + 1}:`, {
          id: cc.id,
          code: cc.code,
          assignedUserId: cc.assignedUserId,
          assignedUser: cc.assignedUser,
          hasAssignedUser: !!cc.assignedUser,
          assignedUserName: cc.assignedUser?.name || 'SIN USUARIO'
        })
      })
      
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
    console.log('SERVICE - CREATE - Enviando request:', {
      url: '/cost-centers',
      method: 'POST',
      data: costCenterData
    })
    
    const response = await apiClient.post('/cost-centers', costCenterData)
    
    console.log('SERVICE - CREATE - Respuesta recibida:', response.data)
    return response.data
  },

  // Actualizar centro de costo
  update: async (id: string, costCenterData: UpdateCostCenterRequest): Promise<CostCenter> => {
    console.log('SERVICE - UPDATE - Enviando request:', {
      url: `/cost-centers/${id}`,
      method: 'PUT',
      data: costCenterData
    })
    
    const response = await apiClient.put(`/cost-centers/${id}`, costCenterData)
    
    console.log('SERVICE - UPDATE - Respuesta recibida:', response.data)
    return response.data
  },

  // Eliminar centro de costo
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-centers/${id}`)
  }
}
