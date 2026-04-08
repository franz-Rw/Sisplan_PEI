import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiTable, FiX, FiPlusCircle } from 'react-icons/fi'
import { indicatorVariablesService, IndicatorVariable, FormField, CreateIndicatorVariableRequest } from '@services/indicatorVariablesService'
import FormFieldBuilder from '@components/FormFieldBuilder'

export default function Variables() {
  const [activeTab, setActiveTab] = useState<'objectives' | 'actions'>('objectives')
  const [objectiveIndicators, setObjectiveIndicators] = useState<any[]>([])
  const [actionIndicators, setActionIndicators] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Estados para modales
  const [showVariablesModal, setShowVariablesModal] = useState(false)
  const [showVariableFormModal, setShowVariableFormModal] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null)
  const [selectedVariable, setSelectedVariable] = useState<IndicatorVariable | null>(null)
  const [variablesForIndicator, setVariablesForIndicator] = useState<IndicatorVariable[]>([])
  
  // Formulario de variable
  const [variableFormData, setVariableFormData] = useState<CreateIndicatorVariableRequest>({
    indicatorId: '',
    name: '',
    description: '',
    fields: []
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // La búsqueda se implementará más adelante si es necesario
  }, [activeTab, search])

  const loadData = async () => {
    try {
      await Promise.all([
        loadObjectiveIndicators(),
        loadActionIndicators()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadObjectiveIndicators = async () => {
    try {
      const data = await indicatorVariablesService.getObjectiveIndicators()
      setObjectiveIndicators(data)
    } catch (error) {
      console.error('Error loading objective indicators:', error)
    }
  }

  const loadActionIndicators = async () => {
    try {
      const data = await indicatorVariablesService.getActionIndicators()
      setActionIndicators(data)
    } catch (error) {
      console.error('Error loading action indicators:', error)
    }
  }

  const refreshIndicators = async () => {
    await Promise.all([
      loadObjectiveIndicators(),
      loadActionIndicators()
    ])
  }

  const handleShowVariables = async (indicator: any) => {
    try {
      setSelectedIndicator(indicator)
      const variables = await indicatorVariablesService.getByIndicator(indicator.id)
      setVariablesForIndicator(variables)
      setShowVariablesModal(true)
    } catch (error) {
      console.error('Error loading variables:', error)
    }
  }

  const handleShowVariableForm = (indicator: any) => {
    setSelectedIndicator(indicator)
    setSelectedVariable(null)
    setVariableFormData({
      indicatorId: indicator.id,
      name: '',
      description: '',
      fields: []
    })
    setShowVariableFormModal(true)
  }

  const handleEditVariable = (variable: IndicatorVariable) => {
    setSelectedVariable(variable)
    setVariableFormData({
      indicatorId: variable.indicatorId,
      name: variable.name,
      description: variable.description || '',
      fields: variable.fields
    })
    setShowVariableFormModal(true)
  }

  const handleDeleteVariable = async (variableId: string) => {
    if (!confirm('¿Está seguro de eliminar esta variable?')) {
      return
    }

    try {
      await indicatorVariablesService.delete(variableId)
      
      // Recargar variables del indicador
      if (selectedIndicator) {
        const variables = await indicatorVariablesService.getByIndicator(selectedIndicator.id)
        setVariablesForIndicator(variables)
      }
      
      // Recargar lista principal
      await refreshIndicators()
    } catch (error) {
      console.error('Error deleting variable:', error)
    }
  }

  const handleVariableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedVariable) {
        await indicatorVariablesService.update(selectedVariable.id, variableFormData)
      } else {
        await indicatorVariablesService.create(variableFormData)
      }
      
      // Cerrar modal y recargar
      setShowVariableFormModal(false)
      resetVariableForm()
      
      // Recargar variables del indicador si está abierto
      if (selectedIndicator) {
        const variables = await indicatorVariablesService.getByIndicator(selectedIndicator.id)
        setVariablesForIndicator(variables)
      }
      
      // Recargar lista principal
      await refreshIndicators()
    } catch (error) {
      console.error('Error saving variable:', error)
    }
  }

  const resetVariableForm = () => {
    setVariableFormData({
      indicatorId: '',
      name: '',
      description: '',
      fields: []
    })
    setSelectedVariable(null)
  }

  // Funciones para el constructor de formularios
  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      name: '',
      required: false,
      placeholder: ''
    }
    setVariableFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setVariableFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  const removeField = (fieldId: string) => {
    setVariableFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }))
  }

  const indicators = activeTab === 'objectives' ? objectiveIndicators : actionIndicators

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Variables de Indicadores</h1>
          <p className="text-neutral-600 mt-1">Administra los formularios dinámicos para captura de datos de indicadores</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('objectives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'objectives'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Variables de indicadores de objetivos estratégicos
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Variables de indicadores de acciones estratégicas
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar indicadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {activeTab === 'objectives' ? 'Indicadores de Objetivos Estratégicos' : 'Indicadores de Acciones Estratégicas'}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Plan</th>
                <th className="table-header-cell">
                  {activeTab === 'objectives' ? 'Código de Objetivo Estratégico' : 'Código de Acción Estratégica'}
                </th>
                <th className="table-header-cell">Código de Indicador</th>
                <th className="table-header-cell">Enunciado del Indicador</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    Cargando...
                  </td>
                </tr>
              ) : indicators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No hay indicadores registrados
                  </td>
                </tr>
              ) : (
                indicators.map((indicator) => (
                  <tr key={indicator.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {indicator.plan?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {activeTab === 'objectives' ? indicator.objective?.code : indicator.action?.code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{indicator.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600">{indicator.statement}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleShowVariables(indicator)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Ver variables"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShowVariableForm(indicator)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Crear variable"
                      >
                        <FiTable className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variables Modal */}
      {showVariablesModal && selectedIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Variables del Indicador: {selectedIndicator.code}
              </h3>
              <button
                onClick={() => setShowVariablesModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={() => handleShowVariableForm(selectedIndicator)}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Agregar Variable
              </button>
            </div>

            {/* Variables Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Código de la Variable</th>
                    <th className="table-header-cell">Nombre</th>
                    <th className="table-header-cell">Campos del Formulario</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {variablesForIndicator.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                        No hay variables registradas
                      </td>
                    </tr>
                  ) : (
                    variablesForIndicator.map((variable) => (
                      <tr key={variable.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{variable.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">{variable.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">
                            {variable.fields.length} campo(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditVariable(variable)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Editar"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVariable(variable.id)}
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
      )}

      {/* Variable Form Modal */}
      {showVariableFormModal && selectedIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {selectedVariable ? 'Editar Variable' : 'Crear Variable'} para: {selectedIndicator.code}
              </h3>
              <button
                onClick={() => setShowVariableFormModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVariableSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Plan
                  </label>
                  <input
                    type="text"
                    value={selectedIndicator.plan?.name || ''}
                    readOnly
                    className="input-base bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {activeTab === 'objectives' ? 'Código de Objetivo' : 'Código de Acción'}
                  </label>
                  <input
                    type="text"
                    value={activeTab === 'objectives' ? selectedIndicator.objective?.code : selectedIndicator.action?.code || ''}
                    readOnly
                    className="input-base bg-neutral-50"
                  />
                </div>
                {activeTab === 'actions' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Objetivo
                    </label>
                    <input
                      type="text"
                      value={(() => {
                        const actionCode = selectedIndicator.action?.code || ''
                        // Extraer el primer número del código (ej: AEI 01.05 -> 01 -> OEI 01)
                        const match = actionCode.match(/\d+/)
                        if (match) {
                          const objectiveNumber = match[0]
                          return `OEI ${objectiveNumber}`
                        }
                        return ''
                      })()}
                      readOnly
                      className="input-base bg-neutral-50"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código de Indicador
                  </label>
                  <input
                    type="text"
                    value={selectedIndicator.code}
                    readOnly
                    className="input-base bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código de Variable
                  </label>
                  <input
                    type="text"
                    value={selectedVariable ? selectedVariable.code : 'Se generará automáticamente'}
                    readOnly
                    className="input-base bg-neutral-50"
                    placeholder="Se generará automáticamente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nombre de la Variable *
                  </label>
                  <input
                    type="text"
                    required
                    value={variableFormData.name}
                    onChange={(e) => setVariableFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-base"
                    placeholder="Ej: Formulario de Datos Mensuales"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={variableFormData.description}
                    onChange={(e) => setVariableFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-base"
                    rows={3}
                    placeholder="Descripción de la variable"
                  />
                </div>
              </div>

              {/* Dynamic Form Builder */}
              <div className="space-y-4 border-t border-neutral-200 pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-neutral-900">Constructor de Formulario</h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiPlusCircle className="w-4 h-4" />
                    Agregar Campo
                  </button>
                </div>

                {variableFormData.fields.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-lg">
                    No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variableFormData.fields.map((field) => (
                      <FormFieldBuilder
                        key={field.id}
                        field={field}
                        onUpdate={updateField}
                        onRemove={removeField}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVariableFormModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {selectedVariable ? 'Actualizar Variable' : 'Guardar Variable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
