import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'ADMIN' | 'OPERATOR'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    } else if (user?.role === 'OPERATOR') {
      return <Navigate to="/operator" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
