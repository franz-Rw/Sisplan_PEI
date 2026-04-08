export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  costCenter?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export interface StrategicPlan {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface CostCenter {
  id: string
  name: string
  code: string
  createdAt: Date
  updatedAt: Date
}

export interface StrategicObjective {
  id: string
  planId: string
  name: string
  description: string
  indicator: string
  createdAt: Date
  updatedAt: Date
}

export interface StrategicAction {
  id: string
  objectiveId: string
  name: string
  description: string
  responsible: string
  createdAt: Date
  updatedAt: Date
}

export interface Variable {
  id: string
  name: string
  description: string
  unit: string
  createdAt: Date
  updatedAt: Date
}

export interface Indicator {
  id: string
  objectiveId?: string
  actionId?: string
  name: string
  value: number
  target: number
  period: string
  createdAt: Date
  updatedAt: Date
}
