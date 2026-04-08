import React, { useState, useEffect } from 'react'
import { FiSearch, FiCheck, FiEdit2, FiTrash2, FiCalendar, FiClock, FiFilter } from 'react-icons/fi'
import apiClient from '@services/api'

interface CostCenter {
  id: string
  code: string
  description: string
  responsible?: string
}

interface DeadlineConfig {
  id: string
  costCenterId: string
  costCenterCode: string
  costCenterDescription: string
  startDate: string
  endDate: string
  endTime: string
  notifications: {
    sevenDays: boolean
    threeDays: boolean
    sameDay: boolean
  }
  status: 'active' | 'expired' | 'pending'
  createdAt: string
}

export default function ConfiguracionPlazos() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [configurations, setConfigurations] = useState<DeadlineConfig[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    endTime: '23:59',
    notifications: {
      sevenDays: true,
      threeDays: true,
      sameDay: true
    }
  })
  
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DeadlineConfig | null>(null)

  useEffect(() => {
    loadCostCenters()
    loadConfigurations()
  }, [])

  const loadCostCenters = async () => {
    try {
      const response = await apiClient.get('/cost-centers')
      // Asegurarnos de que siempre sea un array
      const data = Array.isArray(response.data) ? response.data : []
      setCostCenters(data)
    } catch (error) {
      console.error('Error loading cost centers:', error)
      setCostCenters([]) // Asegurar que sea un array vacío en caso de error
    }
  }

  const loadConfigurations = async () => {
    try {
      const response = await apiClient.get('/deadline-configs')
      // Asegurarnos de que siempre sea un array
      const data = Array.isArray(response.data) ? response.data : []
      setConfigurations(data)
    } catch (error) {
      console.error('Error loading configurations:', error)
      setConfigurations([]) // Asegurar que sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const filteredCostCenters = costCenters.filter(cc => 
    cc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = () => {
    if (selectedCostCenters.length === filteredCostCenters.length) {
      setSelectedCostCenters([])
    } else {
      setSelectedCostCenters(filteredCostCenters.map(cc => cc.id))
    }
  }

  const handleSelectCostCenter = (costCenterId: string) => {
    setSelectedCostCenters(prev => 
      prev.includes(costCenterId)
        ? prev.filter(id => id !== costCenterId)
        : [...prev, costCenterId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedCostCenters.length === 0) {
      alert('Por favor seleccione al menos un centro de costo')
      return
    }

    if (!formData.startDate || !formData.endDate || !formData.endTime) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const configData = {
        costCenterIds: selectedCostCenters,
        startDate: formData.startDate,
        endDate: formData.endDate,
        endTime: formData.endTime,
        notifications: formData.notifications
      }

      if (editingConfig) {
        await apiClient.put(`/deadline-configs/${editingConfig.id}`, configData)
      } else {
        await apiClient.post('/deadline-configs', configData)
      }

      await loadConfigurations()
      resetForm()
      setShowForm(false)
      alert('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Error al guardar la configuración')
    }
  }

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      endTime: '23:59',
      notifications: {
        sevenDays: true,
        threeDays: true,
        sameDay: true
      }
    })
    setSelectedCostCenters([])
    setEditingConfig(null)
  }

  const handleEdit = (config: DeadlineConfig) => {
    setEditingConfig(config)
    setFormData({
      startDate: config.startDate,
      endDate: config.endDate,
      endTime: config.endTime,
      notifications: config.notifications
    })
    setSelectedCostCenters([config.costCenterId])
    setShowForm(true)
  }

  const handleDelete = async (configId: string) => {
    if (!confirm('¿Está seguro de eliminar esta configuración?')) {
      return
    }

    try {
      await apiClient.delete(`/deadline-configs/${configId}`)
      await loadConfigurations()
      alert('Configuración eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting configuration:', error)
      alert('Error al eliminar la configuración')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'expired':
        return 'Vencida'
      case 'pending':
        return 'Pendiente'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Configuración de Plazos</h1>
        <p className="text-neutral-600 mt-1">Configura plazos para los centros de costo de manera masiva o individual</p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            {editingConfig ? 'Editar Configuración' : 'Configurar Plazos por Centro de Costo'}
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiCalendar className="w-4 h-4" />
              Nueva Configuración
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cost Centers Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-neutral-700">
                  Selección de Centros de Costo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar centros de costo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    <FiCheck className="w-4 h-4" />
                    {selectedCostCenters.length === filteredCostCenters.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>
              </div>

              {/* Selected Count */}
              {selectedCostCenters.length > 0 && (
                <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <span className="text-sm text-primary-700">
                    {selectedCostCenters.length} centro{selectedCostCenters.length !== 1 ? 's' : ''} de costo seleccionado{selectedCostCenters.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Cost Centers Grid */}
              <div className="border border-neutral-200 rounded-lg max-h-64 overflow-y-auto">
                {filteredCostCenters.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500">
                    No se encontraron centros de costo
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                    {filteredCostCenters.map((costCenter) => (
                      <label
                        key={costCenter.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCostCenters.includes(costCenter.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCostCenters.includes(costCenter.id)}
                          onChange={() => handleSelectCostCenter(costCenter.id)}
                          className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-neutral-900">{costCenter.code}</div>
                          <div className="text-xs text-neutral-600">{costCenter.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deadline Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha Inicial *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha Límite de Registro *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={formData.startDate}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Hora Límite *
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-4">
                Configuración de Notificaciones
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sevenDays}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, sevenDays: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700">
                    Enviar recordatorio 7 días antes del vencimiento
                  </span>
                </label>
                <label className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.threeDays}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, threeDays: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700">
                    Enviar recordatorio 3 días antes del vencimiento
                  </span>
                </label>
                <label className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sameDay}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, sameDay: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700">
                    Enviar recordatorio el día del vencimiento
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="flex-1 px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button type="submit" className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                {editingConfig ? 'Actualizar Configuración' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Current Configurations */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Configuraciones Actuales</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <FiFilter className="w-4 h-4" />
            {configurations.length} configuración{configurations.length !== 1 ? 'es' : ''} encontrada{configurations.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fecha Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fecha Límite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Hora Límite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Notificaciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    Cargando configuraciones...
                  </td>
                </tr>
              ) : configurations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No hay configuraciones de plazos registradas
                  </td>
                </tr>
              ) : (
                configurations.map((config) => (
                  <tr key={config.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{config.costCenterCode}</div>
                        <div className="text-xs text-neutral-600">{config.costCenterDescription}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">
                        {new Date(config.startDate).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">
                        {new Date(config.endDate).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">{config.endTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(config.status)}`}>
                        {getStatusText(config.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-neutral-600">
                        {config.notifications.sevenDays && <span className="inline-block mr-1">7d</span>}
                        {config.notifications.threeDays && <span className="inline-block mr-1">3d</span>}
                        {config.notifications.sameDay && <span className="inline-block">0d</span>}
                        {!config.notifications.sevenDays && !config.notifications.threeDays && !config.notifications.sameDay && (
                          <span className="text-neutral-400">Ninguna</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Editar"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
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
    </div>
  )
}
