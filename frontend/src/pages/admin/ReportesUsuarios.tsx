import { useState, useEffect } from 'react'
import { FiDownload } from 'react-icons/fi'
import apiClient from '@services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  costCenter?: {
    id: string
    code: string
    description: string
  }
}

export default function ReportesUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    // Implement export functionality
    console.log(`Exporting users data as ${format}`)
    
    // CSV Export (basic implementation)
    if (format === 'csv') {
      const headers = ['Nombres y Apellidos', 'Usuario', 'Rol', 'Centro de Costos Asignado', 'Estado']
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          `${user.firstName} ${user.lastName}`,
          user.email,
          user.role,
          user.costCenter ? `${user.costCenter.code} - ${user.costCenter.description}` : 'Sin asignar',
          user.status
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    // TODO: Implement Excel and PDF export
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador'
      case 'OPERATOR':
        return 'Operador'
      default:
        return role
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo'
      case 'INACTIVE':
        return 'Inactivo'
      default:
        return status
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes de Usuarios</h1>
        <p className="text-gray-600">Visualice y exporte la información de usuarios del sistema</p>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => exportData('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => exportData('excel')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">Cargando usuarios...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No hay usuarios registrados</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombres y Apellidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centro de Costos Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.costCenter ? (
                        <div>
                          <div className="font-medium">{user.costCenter.code}</div>
                          <div className="text-xs text-gray-500">{user.costCenter.description}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusDisplayName(user.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
