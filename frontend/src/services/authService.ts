import apiClient from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'OPERATOR'
    costCenter?: {
      id: string
      code: string
      description?: string
    }
  }
  token: string
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData: {
    email: string
    password: string
    name: string
    role?: string
  }): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('authToken')
  },

  getToken: () => {
    return localStorage.getItem('authToken')
  },

  setToken: (token: string) => {
    localStorage.setItem('authToken', token)
  }
}
