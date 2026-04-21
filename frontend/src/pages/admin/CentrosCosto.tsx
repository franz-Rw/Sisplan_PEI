import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { costCentersService, CostCenter, CreateCostCenterRequest, User } from '@services/costCentersService'
import Alert from '@components/Alert'

type CostCenterStatus = 'ACTIVO' | 'INACTIVO'

const statusColors = {
  ACTIVO: 'badge-success',
  INACTIVO: 'badge-danger'
}

const statusLabels = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo'
}

export default function CentrosCosto() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [filteredCostCenters, setFilteredCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [parentCostCenters, setParentCostCenters] = useState<CostCenter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateCostCenterRequest>({
    code: '',
    description: '',
    parentId: '',
    assignedUserId: '',
    status: 'ACTIVO'
  })

  useEffect(() => {
    loadCostCenters()
    loadUsers()
    loadParentCostCenters()
  }, [])

  useEffect(() => {
    filterCostCenters()
  }, [costCenters, searchTerm, statusFilter])

  const loadCostCenters = async () => {
    try {
      setLoading(true)
      const data = await costCentersService.getAll()
      console.log('LOAD CENTERS - Datos recibidos del backend:', data)
      
      // Logging detallado para diagnóstico
      data.forEach((cc, index) => {
        console.log(`LOAD CENTERS - Centro ${index + 1}:`, {
          id: cc.id,
          code: cc.code,
          assignedUserId: cc.assignedUserId,
          assignedUser: cc.assignedUser,
          hasAssignedUser: !!cc.assignedUser,
          assignedUserName: cc.assignedUser?.name || 'SIN USUARIO'
        })
      })
      
      setCostCenters(data)
    } catch (error) {
      console.error('Error loading cost centers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await costCentersService.getUsersForAssignment()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadParentCostCenters = async () => {
    try {
      const data = await costCentersService.getParentCostCenters()
      console.log('Parent cost centers loaded:', data)
      setParentCostCenters(data)
    } catch (error) {
      console.error('Error loading parent cost centers:', error)
    }
  }

  // Función para construir estructura jerárquica
  const buildHierarchy = (centers: any[]): any[] => {
    const centerMap = new Map()
    const rootCenters: any[] = []

    // Crear mapa de centros
    centers.forEach(center => {
      centerMap.set(center.id, { ...center, children: [] })
    })

    // Construir jerarquía
    centers.forEach(center => {
      const centerNode = centerMap.get(center.id)
      if (center.parentId && centerMap.has(center.parentId)) {
        centerMap.get(center.parentId).children.push(centerNode)
      } else {
        rootCenters.push(centerNode)
      }
    })

    return rootCenters
  }

  // Función para renderizar opciones jerárquicas mejorada
  const renderHierarchicalOptions = (centers: any[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = []
    
    centers.forEach(center => {
      // Crear prefijo visual jerárquico
      let prefix = ''
      if (level === 0) {
        prefix = '► '
      } else if (level === 1) {
        prefix = '  ├─ '
      } else if (level === 2) {
        prefix = '  │  ├─ '
      } else {
        prefix = '  │  │  ├─ '
      }
      
      options.push(
        <option key={center.id} value={center.id}>
          {prefix}{center.code} - {center.description || '(sin descripción)'}
        </option>
      )
      
      if (center.children && center.children.length > 0) {
        options.push(...renderHierarchicalOptions(center.children, level + 1))
      }
    })
    
    return options
  }

  // Función para ordenar centros de costos jerárquicamente
  const sortCostCentersHierarchically = (centers: CostCenter[]): CostCenter[] => {
    const centerMap = new Map<string, any>()
    const sorted: CostCenter[] = []

    // Crear mapa con children array
    centers.forEach(center => {
      centerMap.set(center.id, { ...center, children: [] })
    })

    // Construir relaciones padre-hijo
    centers.forEach(center => {
      if (center.parentId && centerMap.has(center.parentId)) {
        centerMap.get(center.parentId).children.push(centerMap.get(center.id))
      }
    })

    // Recolectar raíces y sus hijos recursivamente
    const traverse = (center: any) => {
      sorted.push(center)
      if (center.children && center.children.length > 0) {
        center.children.forEach((child: any) => traverse(child))
      }
    }

    // Procesar centros raíz
    centers.forEach(center => {
      if (!center.parentId) {
        traverse(centerMap.get(center.id))
      }
    })

    return sorted
  }

  const filterCostCenters = () => {
    let filtered = costCenters

    if (searchTerm) {
      filtered = filtered.filter(center => 
        center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (center.description && center.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(center => center.status === statusFilter)
    }

    // Aplicar ordenamiento jerárquico
    filtered = sortCostCentersHierarchically(filtered)
    setFilteredCostCenters(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Validación del código
      if (!formData.code || formData.code.trim() === '') {
        setError('El código del centro de costo es obligatorio')
        return
      }

      // Logging del payload que se enviará
      console.log('FRONTEND - Payload a enviar:', {
        action: editingCostCenter ? 'UPDATE' : 'CREATE',
        costCenterId: editingCostCenter?.id,
        formData: {
          code: formData.code,
          description: formData.description,
          parentId: formData.parentId,
          assignedUserId: formData.assignedUserId,
          status: formData.status
        }
      })

      let savedCostCenter
      if (editingCostCenter) {
        savedCostCenter = await costCentersService.update(editingCostCenter.id, formData)
        console.log('FRONTEND - Respuesta recibida (UPDATE):', savedCostCenter)
        setSuccessMessage('Centro de costo actualizado correctamente')
      } else {
        savedCostCenter = await costCentersService.create(formData)
        console.log('FRONTEND - Respuesta recibida (CREATE):', savedCostCenter)
        setSuccessMessage('Centro de costo creado correctamente')
      }
      
      // Actualización optimista del estado local inmediato
      if (editingCostCenter) {
        // Actualizar el centro existente en el estado local
        setCostCenters(prev => {
          const updatedCenters = prev.map(cc => {
            if (cc.id === editingCostCenter.id) {
              // Buscar el usuario asignado si se proporcionó assignedUserId
              const assignedUser = formData.assignedUserId 
                ? users.find(u => u.id === formData.assignedUserId)
                : null
              
              console.log(`UPDATE - Asignando usuario ${assignedUser?.name} al centro ${editingCostCenter.code}`)
              
              return {
                ...cc,
                ...formData,
                id: editingCostCenter.id,
                assignedUser: assignedUser || undefined
              }
            }
            return cc
          })
          
          // Verificar si algún otro centro perdió la asignación (debido a constraint UNIQUE)
          if (formData.assignedUserId) {
            const previouslyAssigned = prev.find(cc => 
              cc.assignedUser?.id === formData.assignedUserId && cc.id !== editingCostCenter.id
            )
            
            if (previouslyAssigned) {
              console.log(`UPDATE - Usuario desasignado automáticamente del centro ${previouslyAssigned.code}`)
              
              return updatedCenters.map(cc => 
                cc.id === previouslyAssigned.id 
                  ? { ...cc, assignedUser: undefined }
                  : cc
              )
            }
          }
          
          return updatedCenters
        })
      } else {
        // Agregar el nuevo centro al estado local
        const assignedUser = formData.assignedUserId 
          ? users.find(u => u.id === formData.assignedUserId)
          : null
        
        console.log(`CREATE - Asignando usuario ${assignedUser?.name} al nuevo centro ${formData.code}`)
        
        setCostCenters(prev => {
          // Verificar si algún otro centro perdió la asignación
          if (formData.assignedUserId) {
            const previouslyAssigned = prev.find(cc => cc.assignedUser?.id === formData.assignedUserId)
            
            if (previouslyAssigned) {
              console.log(`CREATE - Usuario desasignado automáticamente del centro ${previouslyAssigned.code}`)
              
              return prev.map(cc => 
                cc.assignedUser?.id === formData.assignedUserId 
                  ? { ...cc, assignedUser: undefined }
                  : cc
              ).concat([{ 
                ...formData, 
                id: savedCostCenter.id,
                assignedUser: assignedUser || undefined
              }])
            }
          }
          
          return [...prev, { 
            ...formData, 
            id: savedCostCenter.id,
            assignedUser: assignedUser || undefined
          }]
        })
      }
      
      // Recargar datos para asegurar consistencia completa
      await loadCostCenters()
      await loadUsers()
      await loadParentCostCenters()
      
      setShowCreateModal(false)
      resetForm()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving cost center:', error)
      
      // Extraer mensaje de error del servidor
      let errorMessage = 'Error al guardar el centro de costo'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    }
  }

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter)
    setFormData({
      code: costCenter.code,
      description: costCenter.description || '',
      parentId: costCenter.parentId || '',
      assignedUserId: costCenter.assignedUserId || '',
      status: costCenter.status
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este centro de costo?')) {
      try {
        setError(null)
        
        // Actualización optimista: eliminar inmediatamente del estado local
        setCostCenters(prev => prev.filter(cc => cc.id !== id))
        
        await costCentersService.delete(id)
        
        // Recargar para asegurar consistencia
        await loadCostCenters()
        await loadUsers()
        await loadParentCostCenters()
        
        setSuccessMessage('Centro de costo eliminado correctamente')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error: any) {
        console.error('Error deleting cost center:', error)
        
        // Revertir la actualización optimista si hay error
        await loadCostCenters()
        
        const errorMessage = error.response?.data?.error || 'Error al eliminar el centro de costo'
        setError(errorMessage)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      parentId: '',
      assignedUserId: '',
      status: 'ACTIVO'
    })
    setEditingCostCenter(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}
      
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        </div>
      )}

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Centros de Costo</h1>
          <p className="text-neutral-600 mt-1">Gestiona los centros de costo de la organización</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Nuevo Centro de Costo
        </button>
      </div>

      {/* Cost Centers List */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Lista de Centros</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar centros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  Código
                </th>
                <th className="table-header-cell">
                  Descripción
                </th>
                <th className="table-header-cell">
                  Centro de Costo Padre
                </th>
                <th className="table-header-cell">
                  Usuario Asignado
                </th>
                <th className="table-header-cell">
                  Estado
                </th>
                <th className="table-header-cell">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredCostCenters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    {searchTerm || statusFilter ? 'No se encontraron centros con los filtros aplicados' : 'No hay centros de costo registrados'}
                  </td>
                </tr>
              ) : (
                filteredCostCenters.map((center) => {
                  // Calcular nivel jerárquico contando padres
                  let level = 0
                  let currentCenter: any = center
                  
                  // Contar niveles atravesando el árbol
                  while (currentCenter?.parentId) {
                    level++
                    // Buscar el objeto padre en la lista
                    const parentCenter = costCenters.find(c => c.id === currentCenter.parentId)
                    if (!parentCenter) break
                    currentCenter = parentCenter
                  }
                  
                  // Crear prefijo visual
                  let codePrefix = ''
                  if (level === 1) {
                    codePrefix = '  ├─ '
                  } else if (level === 2) {
                    codePrefix = '  │  ├─ '
                  } else if (level > 2) {
                    codePrefix = '  │  │  ├─ '
                  }
                  
                  return (
                    <tr key={center.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {codePrefix}{center.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {center.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {center.parent ? `${center.parent.code} - ${center.parent.description || ''}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {center.assignedUser ? center.assignedUser.name : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge-${statusColors[center.status]}`}>
                          {statusLabels[center.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(center)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(center.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingCostCenter ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setError(null)
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiPlus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-base"
                  placeholder="Código del centro de costo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-base"
                  rows={3}
                  placeholder="Descripción del centro de costo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Centro de Costo Padre
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input-base"
                >
                  <option value="">Seleccionar centro padre...</option>
                  {renderHierarchicalOptions(buildHierarchy(parentCostCenters))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Usuario Asignado
                </label>
                <select
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                  className="input-base"
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CostCenterStatus })}
                  className="input-base"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingCostCenter ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
