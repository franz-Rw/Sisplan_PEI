import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiTarget, FiCalendar, FiFilter, FiDownload, FiEye, FiCheck, FiX, FiClock } from 'react-icons/fi'
import apiClient from '@services/api'

interface IndicatorAssignment {
  id: string
  indicatorId: string
  userId: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DELETED'
  notes?: string
  validFrom: string
  validTo?: string
  assignedAt: string
  assignedBy?: {
    id: string
    name: string
    email: string
  }
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  indicator: {
    id: string
    code: string
    statement: string
    objective?: {
      code: string
      statement: string
    }
    action?: {
      code: string
      statement: string
    }
  }
}

interface Indicator {
  id: string
  code: string
  statement: string
  objective?: {
    code: string
    statement: string
  }
  action?: {
    code: string
    statement: string
  }
  responsible?: {
    code: string
    description: string
  }
  _count?: {
    indicatorValues: number
    indicatorVariables: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  costCenter?: {
    id: string
    code: string
    description: string
  }
  assignedCostCenter?: {
    id: string
    code: string
    description: string
  }
  _count?: {
    assignedIndicators: number
  }
}

const statusColors = {
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-warning',
  EXPIRED: 'badge-danger',
  DELETED: 'badge-secondary'
}

const statusLabels = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  EXPIRED: 'Expirada',
  DELETED: 'Eliminada'
}

export default function IndicatorAssignments() {
  const [assignments, setAssignments] = useState<IndicatorAssignment[]>([])
  const [availableIndicators, setAvailableIndicators] = useState<Indicator[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<IndicatorAssignment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [costCenterFilter, setCostCenterFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    indicatorId: '',
    userId: '',
    notes: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    assignedBy: ''
  })

  useEffect(() => {
    loadAssignments()
    loadAvailableIndicators()
    loadAvailableUsers()
  }, [currentPage, searchTerm, statusFilter, userFilter, costCenterFilter])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(userFilter && { userId: userFilter }),
        ...(costCenterFilter && { costCenterId: costCenterFilter })
      })

      const response = await apiClient.get(`/indicator-assignments?${params}`)
      setAssignments(response.data.assignments)
      setTotalPages(response.data.pagination.pages)
    } catch (error: any) {
      console.error('Error loading assignments:', error)
      setError(error.response?.data?.error || 'Error al cargar asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableIndicators = async () => {
    try {
      const params = new URLSearchParams({
        excludeAssigned: 'true',
        ...(costCenterFilter && { costCenterId: costCenterFilter })
      })
      const response = await apiClient.get(`/indicator-assignments/available-indicators?${params}`)
      setAvailableIndicators(response.data)
    } catch (error: any) {
      console.error('Error loading indicators:', error)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const params = new URLSearchParams({
        ...(costCenterFilter && { costCenterId: costCenterFilter })
      })
      const response = await apiClient.get(`/indicator-assignments/available-users?${params}`)
      setAvailableUsers(response.data)
    } catch (error: any) {
      console.error('Error loading users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    try {
      if (!formData.indicatorId || !formData.userId) {
        setError('El indicador y el usuario son obligatorios')
        return
      }

      if (editingAssignment) {
        await apiClient.put(`/indicator-assignments/${editingAssignment.id}`, {
          ...formData,
          updatedBy: getCurrentUserId()
        })
        setSuccessMessage('Asignación actualizada correctamente')
      } else {
        await apiClient.post('/indicator-assignments', {
          ...formData,
          assignedBy: getCurrentUserId()
        })
        setSuccessMessage('Asignación creada correctamente')
      }

      setShowModal(false)
      resetForm()
      loadAssignments()
      loadAvailableIndicators()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving assignment:', error)
      setError(error.response?.data?.error || 'Error al guardar asignación')
    }
  }

  const handleEdit = (assignment: IndicatorAssignment) => {
    setEditingAssignment(assignment)
    setFormData({
      indicatorId: assignment.indicatorId,
      userId: assignment.userId,
      notes: assignment.notes || '',
      validFrom: assignment.validFrom.split('T')[0],
      validTo: assignment.validTo ? assignment.validTo.split('T')[0] : '',
      assignedBy: assignment.assignedBy?.id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta asignación?')) {
      try {
        await apiClient.delete(`/indicator-assignments/${id}`, {
          data: {
            deletedBy: getCurrentUserId(),
            reason: 'Eliminado por administrador'
          }
        })
        setSuccessMessage('Asignación eliminada correctamente')
        loadAssignments()
        loadAvailableIndicators()
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error: any) {
        console.error('Error deleting assignment:', error)
        setError(error.response?.data?.error || 'Error al eliminar asignación')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      indicatorId: '',
      userId: '',
      notes: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      assignedBy: ''
    })
    setEditingAssignment(null)
  }

  const getCurrentUserId = () => {
    // Implementar lógica para obtener el ID del usuario actual
    return localStorage.getItem('userId') || ''
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = !searchTerm || 
      assignment.indicator.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.indicator.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || assignment.status === statusFilter
    const matchesUser = !userFilter || assignment.userId === userFilter
    
    return matchesSearch && matchesStatus && matchesUser
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignación de Indicadores</h1>
          <p className="text-gray-600 mt-1">Gestiona la asignación de indicadores a usuarios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nueva Asignación
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por indicador, usuario..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Activa</option>
              <option value="INACTIVE">Inactiva</option>
              <option value="EXPIRED">Expirada</option>
              <option value="DELETED">Eliminada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Centro de Costo</label>
            <select
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {Array.from(new Set(availableUsers.map(u => u.costCenter?.id || u.assignedCostCenter?.id).filter(Boolean)))
                .map(ccId => {
                  const cc = availableUsers.find(u => (u.costCenter?.id || u.assignedCostCenter?.id) === ccId)
                  return cc ? (
                    <option key={ccId} value={ccId}>
                      {cc.costCenter?.code || cc.assignedCostCenter?.code} - {cc.costCenter?.description || cc.assignedCostCenter?.description}
                    </option>
                  ) : null
                })}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Asignaciones Existentes</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando asignaciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.indicator.code}</div>
                        <div className="text-sm text-gray-500">{assignment.indicator.statement}</div>
                        {assignment.indicator.objective && (
                          <div className="text-xs text-blue-600 mt-1">
                            <FiTarget className="inline w-3 h-3 mr-1" />
                            {assignment.indicator.objective.code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{assignment.user.name}</div>
                          <div className="text-sm text-gray-500">{assignment.user.email}</div>
                          <div className="text-xs text-gray-400">{assignment.user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[assignment.status]}`}>
                        {statusLabels[assignment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(assignment.validFrom).toLocaleDateString()}
                        </div>
                        {assignment.validTo && (
                          <div className="flex items-center text-xs text-gray-500">
                            <FiClock className="w-3 h-3 mr-1" />
                            hasta {new Date(assignment.validTo).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.assignedBy ? (
                        <div className="text-sm text-gray-900">
                          {assignment.assignedBy.name}
                          <div className="text-xs text-gray-500">{assignment.assignedBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <FiEdit2 className="w-4 h-4 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <FiTrash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingAssignment ? 'Editar Asignación' : 'Nueva Asignación'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Indicador *</label>
                          <select
                            value={formData.indicatorId}
                            onChange={(e) => setFormData({ ...formData, indicatorId: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Seleccionar indicador...</option>
                            {availableIndicators.map(indicator => (
                              <option key={indicator.id} value={indicator.id}>
                                {indicator.code} - {indicator.statement}
                                {indicator.objective && ` (${indicator.objective.code})`}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Usuario *</label>
                          <select
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Seleccionar usuario...</option>
                            {availableUsers.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.email}) - {user.role}
                                {user.costCenter && ` - ${user.costCenter.code}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Notas adicionales sobre la asignación..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Válido desde *</label>
                            <input
                              type="date"
                              value={formData.validFrom}
                              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Válido hasta</label>
                            <input
                              type="date"
                              value={formData.validTo}
                              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      {editingAssignment ? 'Actualizar' : 'Crear'} Asignación
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
