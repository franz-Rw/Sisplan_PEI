import { useState, useEffect, useCallback } from 'react'
import { FiX, FiPlus, FiSettings, FiTrash2, FiSave, FiRotateCcw, FiCheck, FiAlertCircle } from 'react-icons/fi'
import apiClient from '@services/api'

interface ExpressionNode {
  id: string
  type: 'VARIABLE' | 'FUNCTION' | 'OPERATOR' | 'CONSTANT' | 'CONDITION'
  position: { x: number, y: number }
  data: {
    variableId?: string
    fieldId?: string
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN'
    functionType?: 'SUM' | 'AVG' | 'RATIO' | 'RATE' | 'INDEX' | 'PERCENTAGE'
    operator?: '+' | '-' | '*' | '/' | '^'
    leftOperand?: string
    rightOperand?: string
    value?: number
    condition?: 'EQUAL' | 'RANGE' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN'
    field?: string
    compareValue?: any
    range?: { min: any, max: any }
  }
  connections?: string[]
}

interface Variable {
  id: string
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
  }>
}

interface Indicator {
  id: string
  code: string
  statement: string
  variables: Variable[]
}

export default function DynamicFormulaBuilder({ indicatorId, onClose, onSave }: {
  indicatorId: string
  onClose: () => void
  onSave: (formula: any) => void
}) {
  const [nodes, setNodes] = useState<ExpressionNode[]>([])
  const [connections, setConnections] = useState<Array<{
    from: string
    to: string
    type: 'input' | 'output'
  }>>([])
  const [selectedNode, setSelectedNode] = useState<ExpressionNode | null>(null)
  const [variables, setVariables] = useState<Variable[]>([])
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [formulaName, setFormulaName] = useState('')
  const [formulaDescription, setFormulaDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [indicatorId])

  const loadData = async () => {
    try {
      // Cargar datos del indicador
      const indicatorRes = await apiClient.get(`/indicators/${indicatorId}`)
      setIndicator(indicatorRes.data)
      setVariables(indicatorRes.data.variables || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addNode = (type: ExpressionNode['type'], position: { x: number, y: number }) => {
    const newNode: ExpressionNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: getDefaultDataForType(type),
      connections: []
    }
    setNodes([...nodes, newNode])
    setSelectedNode(newNode)
  }

  const getDefaultDataForType = (type: ExpressionNode['type']) => {
    switch (type) {
      case 'VARIABLE':
        return {
          variableId: variables[0]?.id || '',
          fieldId: '',
          aggregation: 'SUM' as 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN'
        }
      case 'FUNCTION':
        return {
          functionType: 'SUM' as 'SUM' | 'AVG' | 'RATIO' | 'RATE' | 'INDEX' | 'PERCENTAGE',
          parameters: []
        }
      case 'OPERATOR':
        return {
          operator: '+' as '+' | '-' | '*' | '/' | '^',
          leftOperand: '',
          rightOperand: ''
        }
      case 'CONSTANT':
        return {
          value: 0
        }
      case 'CONDITION':
        return {
          field: '',
          condition: 'EQUAL' as 'EQUAL' | 'RANGE' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN',
          compareValue: ''
        }
      default:
        return {}
    }
  }

  const updateNode = (nodeId: string, updates: Partial<ExpressionNode>) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId))
    setConnections(connections.filter(conn => 
      conn.from !== nodeId && conn.to !== nodeId
    ))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const handleNodeDragStart = (nodeId: string) => {
    setIsDragging(true)
    setDraggedNode(nodeId)
  }

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!isDragging || !draggedNode) return

    const canvas = document.getElementById('formula-canvas')
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    updateNode(draggedNode, { position: { x, y } })
  }

  const handleNodeDragEnd = () => {
    setIsDragging(false)
    setDraggedNode(null)
  }

  const addConnection = (fromNode: string, toNode: string) => {
    // Validar que no exista ya la conexión
    const exists = connections.some(conn => 
      (conn.from === fromNode && conn.to === toNode) ||
      (conn.from === toNode && conn.to === fromNode)
    )

    if (!exists) {
      setConnections([...connections, { from: fromNode, to: toNode, type: 'output' }])
    }
  }

  const deleteConnection = (fromNode: string, toNode: string) => {
    setConnections(connections.filter(conn => 
      !(conn.from === fromNode && conn.to === toNode)
    ))
  }

  const validateFormula = () => {
    if (!formulaName.trim()) {
      return 'El nombre de la fórmula es requerido'
    }

    if (nodes.length === 0) {
      return 'Debe agregar al menos un nodo a la fórmula'
    }

    // Validar que todos los nodos tengan datos válidos
    for (const node of nodes) {
      if (node.type === 'VARIABLE' && !node.data.variableId) {
        return 'Los nodos de variable deben tener una variable seleccionada'
      }
      if (node.type === 'FUNCTION' && !node.data.functionType) {
        return 'Los nodos de función deben tener un tipo de función seleccionado'
      }
    }

    return null
  }

  const saveFormula = async () => {
    const validationError = validateFormula()
    if (validationError) {
      alert(validationError)
      return
    }

    setIsSaving(true)
    try {
      const formulaData = {
        name: formulaName,
        description: formulaDescription,
        expressionTree: {
          nodes,
          connections
        },
        components: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data
        })),
        conditions: nodes.filter(node => node.type === 'CONDITION').map(node => node.data),
        aggregationType: 'SUM',
        category: 'CUSTOM',
        isTemplate: false
      }

      await apiClient.post('/dynamic-formulas', formulaData)
      
      // Configurar la fórmula para el indicador
      await apiClient.post(`/dynamic-formulas/indicators/${indicatorId}/config`, {
        formulaId: formulaData.name, // Esto debería ser el ID real de la fórmula creada
        customComponents: formulaData.components,
        customConditions: formulaData.conditions
      })

      onSave(formulaData)
      onClose()
    } catch (error) {
      console.error('Error saving formula:', error)
      alert('Error al guardar la fórmula')
    } finally {
      setIsSaving(false)
    }
  }

  const renderNode = (node: ExpressionNode) => {
    const isSelected = selectedNode?.id === node.id
    const nodeColor = getNodeColor(node.type)

    return (
      <div
        key={node.id}
        className={`absolute p-3 rounded-lg border-2 cursor-move transition-all ${isSelected ? 'border-primary-500 shadow-lg' : 'border-gray-300'}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          backgroundColor: nodeColor.bg,
          minWidth: '150px'
        }}
        onMouseDown={() => handleNodeDragStart(node.id)}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${nodeColor.text}`}>
            {getNodeLabel(node.type)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteNode(node.id)
            }}
            className="text-red-500 hover:text-red-700"
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="text-xs">
          {renderNodeContent(node)}
        </div>

        {/* Conexiones */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 bg-primary-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
        </div>
      </div>
    )
  }

  const renderNodeContent = (node: ExpressionNode) => {
    switch (node.type) {
      case 'VARIABLE':
        const variable = variables.find(v => v.id === node.data.variableId)
        return (
          <div>
            <select
              value={node.data.variableId}
              onChange={(e) => updateNode(node.id, { 
                data: { ...node.data, variableId: e.target.value } 
              })}
              className="w-full text-xs border rounded px-1 py-0.5"
            >
              <option value="">Seleccionar variable</option>
              {variables.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {variable && (
              <select
                value={node.data.fieldId}
                onChange={(e) => updateNode(node.id, { 
                  data: { ...node.data, fieldId: e.target.value } 
                })}
                className="w-full text-xs border rounded px-1 py-0.5 mt-1"
              >
                <option value="">Seleccionar campo</option>
                {variable.fields.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            <select
              value={node.data.aggregation}
              onChange={(e) => updateNode(node.id, { 
                data: { ...node.data, aggregation: e.target.value as any } 
              })}
              className="w-full text-xs border rounded px-1 py-0.5 mt-1"
            >
              <option value="SUM">Suma</option>
              <option value="COUNT">Conteo</option>
              <option value="AVG">Promedio</option>
              <option value="MAX">Máximo</option>
              <option value="MIN">Mínimo</option>
            </select>
          </div>
        )
      case 'FUNCTION':
        return (
          <select
            value={node.data.functionType}
            onChange={(e) => updateNode(node.id, { 
              data: { ...node.data, functionType: e.target.value as any } 
            })}
            className="w-full text-xs border rounded px-1 py-0.5"
          >
            <option value="SUM">Suma</option>
            <option value="AVG">Promedio</option>
            <option value="RATIO">Ratio</option>
            <option value="RATE">Tasa</option>
            <option value="PERCENTAGE">Porcentaje</option>
          </select>
        )
      case 'OPERATOR':
        return (
          <select
            value={node.data.operator}
            onChange={(e) => updateNode(node.id, { 
              data: { ...node.data, operator: e.target.value as any } 
            })}
            className="w-full text-xs border rounded px-1 py-0.5"
          >
            <option value="+">Suma (+)</option>
            <option value="-">Resta (-)</option>
            <option value="*">Multiplicación (*)</option>
            <option value="/">División (/)</option>
          </select>
        )
      case 'CONSTANT':
        return (
          <input
            type="number"
            value={node.data.value}
            onChange={(e) => updateNode(node.id, { 
              data: { ...node.data, value: parseFloat(e.target.value) || 0 } 
            })}
            className="w-full text-xs border rounded px-1 py-0.5"
            placeholder="Valor constante"
          />
        )
      default:
        return <span>Nodo {node.type}</span>
    }
  }

  const getNodeColor = (type: ExpressionNode['type']) => {
    const colors = {
      VARIABLE: { bg: '#EBF8FF', text: 'text-blue-700' },
      FUNCTION: { bg: '#F0FDF4', text: 'text-green-700' },
      OPERATOR: { bg: '#FEF3C7', text: 'text-yellow-700' },
      CONSTANT: { bg: '#F3F4F6', text: 'text-gray-700' },
      CONDITION: { bg: '#FEE2E2', text: 'text-red-700' }
    }
    return colors[type] || colors.VARIABLE
  }

  const getNodeLabel = (type: ExpressionNode['type']) => {
    const labels = {
      VARIABLE: 'Variable',
      FUNCTION: 'Función',
      OPERATOR: 'Operador',
      CONSTANT: 'Constante',
      CONDITION: 'Condición'
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Constructor de Fórmulas Dinámicas</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={saveFormula}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              Guardar Fórmula
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Panel Izquierdo - Componentes y Configuración */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            {/* Información del Indicador */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Indicador</h3>
              <div className="bg-white p-3 rounded-lg text-xs">
                <p className="font-medium">{indicator?.code}</p>
                <p className="text-gray-600">{indicator?.statement}</p>
              </div>
            </div>

            {/* Configuración de Fórmula */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Configuración</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre de la Fórmula
                  </label>
                  <input
                    type="text"
                    value={formulaName}
                    onChange={(e) => setFormulaName(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1"
                    placeholder="Ej: Porcentaje de Cumplimiento"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formulaDescription}
                    onChange={(e) => setFormulaDescription(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1"
                    rows={3}
                    placeholder="Descripción de la fórmula..."
                  />
                </div>
              </div>
            </div>

            {/* Componentes Arrastrables */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Componentes</h3>
              <div className="space-y-2">
                <button
                  onClick={() => addNode('VARIABLE', { x: 100, y: 100 })}
                  className="w-full text-left px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs"
                >
                  Variable
                </button>
                <button
                  onClick={() => addNode('FUNCTION', { x: 100, y: 200 })}
                  className="w-full text-left px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs"
                >
                  Función
                </button>
                <button
                  onClick={() => addNode('OPERATOR', { x: 100, y: 300 })}
                  className="w-full text-left px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs"
                >
                  Operador
                </button>
                <button
                  onClick={() => addNode('CONSTANT', { x: 100, y: 400 })}
                  className="w-full text-left px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs"
                >
                  Constante
                </button>
                <button
                  onClick={() => addNode('CONDITION', { x: 100, y: 500 })}
                  className="w-full text-left px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs"
                >
                  Condición
                </button>
              </div>
            </div>

            {/* Propiedades del Nodo Seleccionado */}
            {selectedNode && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Propiedades</h3>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xs space-y-2">
                    <p><strong>ID:</strong> {selectedNode.id}</p>
                    <p><strong>Tipo:</strong> {getNodeLabel(selectedNode.type)}</p>
                    <p><strong>Posición:</strong> ({selectedNode.position.x}, {selectedNode.position.y})</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Principal */}
          <div className="flex-1 relative">
            <div
              id="formula-canvas"
              className="absolute inset-0 bg-gray-100"
              onMouseMove={handleNodeDrag}
              onMouseUp={handleNodeDragEnd}
              onClick={() => setSelectedNode(null)}
            >
              {/* Grid Background */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Render Nodes */}
              {nodes.map(renderNode)}

              {/* Render Connections */}
              <svg className="absolute inset-0 pointer-events-none">
                {connections.map((conn, index) => {
                  const fromNode = nodes.find(n => n.id === conn.from)
                  const toNode = nodes.find(n => n.id === conn.to)
                  
                  if (!fromNode || !toNode) return null

                  return (
                    <g key={index}>
                      <line
                        x1={fromNode.position.x + 150}
                        y1={fromNode.position.y + 30}
                        x2={toNode.position.x}
                        y2={toNode.position.y + 30}
                        stroke="#6B7280"
                        strokeWidth="2"
                      />
                      <circle
                        cx={fromNode.position.x + 150}
                        cy={fromNode.position.y + 30}
                        r="4"
                        fill="#6B7280"
                      />
                      <circle
                        cx={toNode.position.x}
                        cy={toNode.position.y + 30}
                        r="4"
                        fill="#6B7280"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Empty State */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Arrastra componentes aquí para construir tu fórmula</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
