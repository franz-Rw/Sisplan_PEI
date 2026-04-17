import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@services/authService'

interface User {
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

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isOperator: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getToken()
      if (storedToken) {
        setToken(storedToken)
        try {
          // Validate token and get user profile
          const userProfile = await authService.getProfile()
          setUser(userProfile)
        } catch (error) {
          console.error('Token validation failed:', error)
          authService.logout()
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    setUser(response.user)
    setToken(response.token)
    authService.setToken(response.token)
    
    // Redirect based on role
    if (response.user.role === 'ADMIN') {
      navigate('/admin')
    } else if (response.user.role === 'OPERATOR') {
      navigate('/operator')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    authService.logout()
    navigate('/login')
  }

  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === 'ADMIN'
  const isOperator = user?.role === 'OPERATOR'

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    isAdmin,
    isOperator
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
