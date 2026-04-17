import { useState, useEffect } from 'react'
import { FiX, FiSettings, FiPlus, FiEdit2, FiTrash2, FiFilter, FiChevronDown, FiCheck, FiAlertCircle, FiCode } from 'react-icons/fi'
import apiClient from '@services/api'
import DynamicFormulaBuilder from './DynamicFormulaBuilder'

interface FormulaTemplate {
  id: string
  name: string
  type: string
  category: string
  expression: string
  variables: string[]
  parameters: any
  validationRules: any
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Indicator {
  id: string
  code: string
  statement: string
  plan: {
    id: string
    name: string
  }
  objective?: {
    id: string
    code: string
    statement: string
  }
  action?: {
    id: string
    code: string
    statement: string
    objective?: {
      id: string
      code: string
      statement: string
    }
  }
  formulaConfig?: {
    id: string
    templateId: string
    customParameters?: any
    conditions?: any
    template: FormulaTemplate
  }
}

type IndicatorType = 'ioei' | 'iaei'

export default function FormulaConfiguration() {
  const [activeTab, setActiveTab] = useState<IndicatorType>('ioei')
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [templates, setTemplates] = useState<FormulaTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showDynamicBuilder, setShowDynamicBuilder] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormulaTemplate | null>(null)
  const [customParameters, setCustomParameters] = useState<any>({})
  const [filters, setFilters] = useState({
    planId: '',
    search: ''
  })
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Cargando datos...', { activeTab, filters })
      
      // Cargar planes
      const plansRes = await apiClient.get('/plans')
      console.log('Planes cargados:', plansRes.data)
      setPlans(plansRes.data || [])

      // Cargar templates
      const templatesRes = await apiClient.get('/formula-templates')
      console.log('Templates cargados:', templatesRes.data)
      setTemplates(templatesRes.data || [])

      // Cargar indicadores según el tipo
      const indicatorsRes = await apiClient.get('/indicators', {
        params: {
          ...(filters.planId && { planId: filters.planId }),
          ...(filters.search && { search: filters.search })
        }
      })

      const allIndicators = indicatorsRes.data || []
      console.log('Todos los indicadores:', allIndicators)
      
      // Filtrar por tipo (IOEI o IAEI)
      const filteredIndicators = allIndicators.filter((indicator: any) => {
        const isIOEI = indicator.objectiveId && !indicator.actionId
        const isIAEI = indicator.actionId
        console.log(`Indicador ${indicator.code}:`, { 
          objectiveId: indicator.objectiveId, 
          actionId: indicator.actionId, 
          isIOEI, 
          isIAEI,
          activeTab 
        })
        if (activeTab === 'ioei') {
          return isIOEI
        } else {
          return isIAEI
        }
      })

      console.log('Indicadores filtrados:', filteredIndicators)

      // Cargar configuraciones de fórmulas para cada indicador
      const indicatorsWithConfig = await Promise.all(
        filteredIndicators.map(async (indicator: any) => {
          try {
            const configRes = await apiClient.get(`/formula-templates/indicators/${indicator.id}/config`)
            return {
              ...indicator,
              formulaConfig: configRes.data
            }
          } catch {
            return indicator
          }
        })
      )

      console.log('Indicadores con config:', indicatorsWithConfig)
      setIndicators(indicatorsWithConfig)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureFormula = (indicator: Indicator) => {
    setSelectedIndicator(indicator)
    setSelectedTemplate(indicator.formulaConfig?.template || null)
    setCustomParameters(indicator.formulaConfig?.customParameters || {})
    setShowConfigModal(true)
  }

  const handleDynamicFormula = (indicator: Indicator) => {
    setSelectedIndicator(indicator)
    setShowDynamicBuilder(true)
  }

  const handleSaveFormulaConfig = async () => {
    if (!selectedIndicator || !selectedTemplate) return

    try {
      await apiClient.post(`/formula-templates/indicators/${selectedIndicator.id}/config`, {
        templateId: selectedTemplate.id,
        customParameters,
        conditions: {}
      })

      setShowConfigModal(false)
      setSelectedIndicator(null)
      setSelectedTemplate(null)
      setCustomParameters({})
      loadData()
    } catch (error) {
      console.error('Error saving formula config:', error)
    }
  }

  const handleRemoveFormula = async (indicatorId: string) => {
    if (!confirm('¿Está seguro de eliminar la configuración de fórmula de este indicador?')) return

    try {
      await apiClient.delete(`/formula-templates/indicators/${indicatorId}/config`)
      loadData()
    } catch (error) {
      console.error('Error removing formula config:', error)
    }
  }

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'bg-blue-100 text-blue-800'
      case 'RATIO': return 'bg-green-100 text-green-800'
      case 'RATE': return 'bg-purple-100 text-purple-800'
      case 'SUM': return 'bg-orange-100 text-orange-800'
      case 'COUNT': return 'bg-yellow-100 text-yellow-800'
      case 'AVERAGE': return 'bg-pink-100 text-pink-800'
      case 'CUSTOM': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTemplateTypeName = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'Porcentaje'
      case 'RATIO': return 'Ratio'
      case 'RATE': return 'Tasa'
      case 'SUM': return 'Suma'
      case 'COUNT': return 'Conteo'
      case 'AVERAGE': return 'Promedio'
      case 'CUSTOM': return 'Personalizado'
      default: return type
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Configuración de Fórmulas
        </h1>
        <p className="text-neutral-600">
          Configure las fórmulas de cálculo para cada indicador del sistema
        </p>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 mb-6 bg-neutral-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('ioei')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ioei'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Indicadores de Objetivos Estratégicos (IOEI)
        </button>
        <button
          onClick={() => setActiveTab('iaei')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'iaei'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Indicadores de Acciones Estratégicas (IAEI)
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filtros:</span>
          </div>
          <select
            value={filters.planId}
            onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los planes</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar indicador..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabla de Indicadores */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Plan Estratégico
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {activeTab === 'ioei' ? 'Objetivo' : 'Acción'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Indicador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fórmula Configurada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    Cargando indicadores...
                  </td>
                </tr>
              ) : indicators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No se encontraron indicadores
                  </td>
                </tr>
              ) : (
                indicators.map((indicator) => (
                  <tr key={indicator.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {indicator.plan.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {activeTab === 'ioei' 
                            ? indicator.objective?.code
                            : indicator.action?.code}
                        </div>
                        <div className="text-neutral-500 text-xs max-w-xs truncate">
                          {activeTab === 'ioei'
                            ? indicator.objective?.statement
                            : indicator.action?.statement}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {indicator.code}
                        </div>
                        <div className="text-neutral-500 text-xs max-w-xs truncate">
                          {indicator.statement}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {indicator.formulaConfig ? (
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTemplateTypeColor(indicator.formulaConfig.template.type)}`}>
                            {getTemplateTypeName(indicator.formulaConfig.template.type)}
                          </span>
                          <div className="text-xs text-neutral-600">
                            {indicator.formulaConfig.template.name}
                          </div>
                          <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">
                            {indicator.formulaConfig.template.expression}
                          </code>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <FiAlertCircle className="w-4 h-4" />
                          <span className="text-xs">Sin configurar</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfigureFormula(indicator)}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          title="Configurar fórmula simple"
                        >
                          <FiSettings className="w-4 h-4" />
                          <span className="text-xs">Simple</span>
                        </button>
                        <button
                          onClick={() => handleDynamicFormula(indicator)}
                          className="text-green-600 hover:text-green-700 flex items-center gap-1"
                          title="Constructor de fórmulas dinámicas"
                        >
                          <FiCode className="w-4 h-4" />
                          <span className="text-xs">Dinámica</span>
                        </button>
                        {indicator.formulaConfig && (
                          <button
                            onClick={() => handleRemoveFormula(indicator.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar configuración"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuración */}
      {showConfigModal && selectedIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Configurar Fórmula
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Información del Indicador */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-2">Indicador Seleccionado</h4>
                <div className="text-sm text-neutral-600 space-y-1">
                  <p><strong>Plan:</strong> {selectedIndicator.plan.name}</p>
                  <p><strong>{activeTab === 'ioei' ? 'Objetivo' : 'Acción'}:</strong> {activeTab === 'ioei' ? selectedIndicator.objective?.code : selectedIndicator.action?.code}</p>
                  <p><strong>Indicador:</strong> {selectedIndicator.code}</p>
                  <p><strong>Descripción:</strong> {selectedIndicator.statement}</p>
                </div>
              </div>

              {/* Selector de Template */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Template de Fórmula
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value)
                    setSelectedTemplate(template || null)
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {getTemplateTypeName(template.type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalles del Template */}
              {selectedTemplate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Detalles del Template</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Tipo:</strong> {getTemplateTypeName(selectedTemplate.type)}</p>
                    <p><strong>Categoría:</strong> {selectedTemplate.category}</p>
                    <p><strong>Expresión:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">{selectedTemplate.expression}</code></p>
                    <p><strong>Variables:</strong> {selectedTemplate.variables.join(', ')}</p>
                    {selectedTemplate.description && (
                      <p><strong>Descripción:</strong> {selectedTemplate.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Parámetros Personalizados */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Parámetros Personalizados (opcional)
                  </label>
                  <textarea
                    value={JSON.stringify(customParameters, null, 2)}
                    onChange={(e) => {
                      try {
                        setCustomParameters(JSON.parse(e.target.value))
                      } catch {
                        // Mantener el valor actual si no es JSON válido
                      }
                    }}
                    placeholder='{"unit": "%", "decimal_places": 2}'
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Formato JSON. Sobrescribe los parámetros por defecto del template.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFormulaConfig}
                disabled={!selectedTemplate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración Simple */}
      {showConfigModal && selectedIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Configurar Fórmula
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Información del Indicador */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-2">Indicador Seleccionado</h4>
                <div className="text-sm text-neutral-600 space-y-1">
                  <p><strong>Plan:</strong> {selectedIndicator.plan.name}</p>
                  <p><strong>{activeTab === 'ioei' ? 'Objetivo' : 'Acción'}:</strong> {activeTab === 'ioei' ? selectedIndicator.objective?.code : selectedIndicator.action?.code}</p>
                  <p><strong>Indicador:</strong> {selectedIndicator.code}</p>
                  <p><strong>Descripción:</strong> {selectedIndicator.statement}</p>
                </div>
              </div>

              {/* Selector de Template */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Template de Fórmula
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value)
                    setSelectedTemplate(template || null)
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {getTemplateTypeName(template.type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalles del Template */}
              {selectedTemplate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Detalles del Template</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Tipo:</strong> {getTemplateTypeName(selectedTemplate.type)}</p>
                    <p><strong>Categoría:</strong> {selectedTemplate.category}</p>
                    <p><strong>Expresión:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">{selectedTemplate.expression}</code></p>
                    <p><strong>Variables:</strong> {selectedTemplate.variables.join(', ')}</p>
                    {selectedTemplate.description && (
                      <p><strong>Descripción:</strong> {selectedTemplate.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Parámetros Personalizados */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Parámetros Personalizados (opcional)
                  </label>
                  <textarea
                    value={JSON.stringify(customParameters, null, 2)}
                    onChange={(e) => {
                      try {
                        setCustomParameters(JSON.parse(e.target.value))
                      } catch {
                        // Mantener el valor actual si no es JSON válido
                      }
                    }}
                    placeholder='{"unit": "%", "decimal_places": 2}'
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Formato JSON. Sobrescribe los parámetros por defecto del template.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFormulaConfig}
                disabled={!selectedTemplate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Formula Builder */}
      {showDynamicBuilder && selectedIndicator && (
        <DynamicFormulaBuilder
          indicatorId={selectedIndicator.id}
          onClose={() => setShowDynamicBuilder(false)}
          onSave={(formula) => {
            console.log('Fórmula dinámica guardada:', formula)
            setShowDynamicBuilder(false)
            loadData() // Recargar para mostrar la nueva configuración
          }}
        />
      )}
    </div>
  )
}
