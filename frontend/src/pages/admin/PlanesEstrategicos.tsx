import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { plansService, StrategicPlan, CreatePlanRequest } from '@services/plansService'

type PlanStatus = 'VIGENTE' | 'NO_VIGENTE' | 'AMPLIADO'

const statusColors = {
  VIGENTE: 'badge-success',
  NO_VIGENTE: 'badge-danger',
  AMPLIADO: 'badge-warning'
}

const statusLabels = {
  VIGENTE: 'Vigente',
  NO_VIGENTE: 'No vigente',
  AMPLIADO: 'Ampliado'
}

export default function PlanesEstrategicos() {
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<StrategicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editingPlan, setEditingPlan] = useState<StrategicPlan | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreatePlanRequest>({
    name: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 4,
    status: 'VIGENTE'
  })

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    filterPlans()
  }, [plans, searchTerm, statusFilter])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await plansService.getAll()
      setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPlans = () => {
    let filtered = plans

    if (searchTerm) {
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(plan => plan.status === statusFilter)
    }

    setFilteredPlans(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPlan) {
        await plansService.update(editingPlan.id, formData)
      } else {
        await plansService.create(formData)
      }
      
      await loadPlans()
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving plan:', error)
    }
  }

  const handleEdit = (plan: StrategicPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      startYear: plan.startYear,
      endYear: plan.endYear,
      status: plan.status,
      description: plan.description,
      ceplanValidationDoc: plan.ceplanValidationDoc,
      approvalDoc: plan.approvalDoc
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este plan?')) {
      try {
        await plansService.delete(id)
        await loadPlans()
      } catch (error) {
        console.error('Error deleting plan:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 4,
      status: 'VIGENTE'
    })
    setEditingPlan(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Planes Estratégicos</h1>
          <p className="text-neutral-600 mt-1">Gestiona los planes estratégicos de la organización</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Nuevo Plan Estratégico
        </button>
      </div>

      {/* Plans List */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Lista de Planes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar planes..."
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
                <option value="VIGENTE">Vigente</option>
                <option value="NO_VIGENTE">No vigente</option>
                <option value="AMPLIADO">Ampliado</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  Nombre del Plan
                </th>
                <th className="table-header-cell">
                  Año de Inicio
                </th>
                <th className="table-header-cell">
                  Año de Fin
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
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    {searchTerm || statusFilter ? 'No se encontraron planes con los filtros aplicados' : 'No hay planes estratégicos registrados'}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{plan.name}</div>
                        {plan.description && (
                          <div className="text-xs text-neutral-500 mt-1">{plan.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {plan.startYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {plan.endYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge-${statusColors[plan.status]}`}>
                        {statusLabels[plan.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {editingPlan ? 'Editar Plan Estratégico' : 'Nuevo Plan Estratégico'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre del plan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-base"
                  placeholder="Nombre del plan estratégico"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Periodo de inicio *
                  </label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={formData.startYear}
                    onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
                    className="input-base"
                    placeholder="Año de inicio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Periodo fin *
                  </label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={formData.endYear}
                    onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
                    className="input-base"
                    placeholder="Año de fin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
                  className="input-base"
                >
                  <option value="VIGENTE">Vigente</option>
                  <option value="NO_VIGENTE">No vigente</option>
                  <option value="AMPLIADO">Ampliado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Documento de validación CEPLAN
                </label>
                <input
                  type="text"
                  value={formData.ceplanValidationDoc || ''}
                  onChange={(e) => setFormData({ ...formData, ceplanValidationDoc: e.target.value })}
                  className="input-base"
                  placeholder="URL o referencia del documento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Documento de Aprobación
                </label>
                <input
                  type="text"
                  value={formData.approvalDoc || ''}
                  onChange={(e) => setFormData({ ...formData, approvalDoc: e.target.value })}
                  className="input-base"
                  placeholder="URL o referencia del documento"
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
                  placeholder="Descripción del plan estratégico"
                />
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
                  {editingPlan ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
