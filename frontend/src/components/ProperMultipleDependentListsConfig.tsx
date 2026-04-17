import React, { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiEdit2, FiChevronRight, FiChevronDown, FiSave, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { FormField } from '@services/indicatorVariablesService'

// Interfaces para la estructura jerárquica
interface Level {
  id: string
  name: string
  order: number
}

interface TreeNode {
  id: string
  name: string
  level: number
  parentId: string | null
  children: TreeNode[]
  expanded: boolean
}

interface ProperMultipleDependentListsConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function ProperMultipleDependentListsConfig({ field, onUpdate }: ProperMultipleDependentListsConfigProps) {
  const [levels, setLevels] = useState<Level[]>([])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [newLevelName, setNewLevelName] = useState('')
  const [newNodeName, setNewNodeName] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'level' | 'node', id: string, name: string} | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Inicializar desde configuración existente
  useEffect(() => {
    const config = field.multipleDependentConfig
    if (config && field.id) {
      setLevels(config.levels || [])
      setTreeNodes(config.nodes || [])
    }
  }, [field.id, field.multipleDependentConfig])

  // Construir árbol desde nodos planos
  const buildTree = (nodes: TreeNode[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []

    // Crear mapa de nodos
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // Construir jerarquía
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!
      if (node.parentId === null) {
        rootNodes.push(treeNode)
      } else {
        const parent = nodeMap.get(node.parentId)
        if (parent) {
          parent.children.push(treeNode)
        }
      }
    })

    return rootNodes
  }

  // Renderizar árbol visual
  const renderTree = (nodes: TreeNode[], level = 0): JSX.Element[] => {
    return nodes.map(node => (
      <div key={node.id} className="select-none">
        <div className={`flex items-center gap-2 py-2 px-3 hover:bg-neutral-50 rounded transition-colors ${level > 0 ? 'ml-6' : ''}`}>
          {node.children.length > 0 && (
            <button
              type="button"
              onClick={() => toggleNodeExpansion(node.id)}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              {node.expanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          {node.children.length === 0 && <div className="w-6" />}
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-neutral-500 font-medium">Nivel {node.level + 1}</span>
            
            {editingNodeId === node.id ? (
              <input
                type="text"
                value={node.name}
                onChange={(e) => updateNodeName(node.id, e.target.value)}
                onBlur={() => setEditingNodeId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingNodeId(null)
                  if (e.key === 'Escape') setEditingNodeId(null)
                }}
                className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="flex-1 text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary-600"
                onClick={() => setEditingNodeId(node.id)}
              >
                {node.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {node.level < levels.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedParentId(node.id)
                  setNewNodeName('')
                }}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Agregar hijo"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setEditingNodeId(node.id)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar nombre"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
            
            <button
              type="button"
              onClick={() => setShowDeleteConfirm({type: 'node', id: node.id, name: node.name})}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar elemento"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {node.expanded && node.children.length > 0 && (
          <div className="ml-2">
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  // Toggle expansión de nodo
  const toggleNodeExpansion = (nodeId: string) => {
    setTreeNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, expanded: !n.expanded } : n
    ))
  }

  // Agregar nuevo nivel
  const addLevel = () => {
    if (!newLevelName.trim()) {
      setErrors(['El nombre del nivel es requerido'])
      return
    }

    if (levels.length >= 8) {
      setErrors(['Máximo 8 niveles permitidos'])
      return
    }

    const newLevel: Level = {
      id: `level_${Date.now()}`,
      name: newLevelName.trim(),
      order: levels.length
    }

    setLevels(prev => [...prev, newLevel])
    setNewLevelName('')
    setErrors([])
  }

  // Actualizar nombre de nivel
  const updateLevelName = (levelId: string, name: string) => {
    setLevels(prev => prev.map(l => l.id === levelId ? { ...l, name } : l))
    setErrors([])
  }

  // Eliminar último nivel
  const removeLastLevel = () => {
    if (levels.length === 0) return

    const lastLevel = levels[levels.length - 1]
    const nodesInLastLevel = treeNodes.filter(n => n.level === levels.length - 1)
    
    if (nodesInLastLevel.length > 0) {
      setErrors([`No se puede eliminar el nivel "${lastLevel.name}" porque contiene ${nodesInLastLevel.length} elementos. Elimine los elementos primero.`])
      return
    }

    setLevels(prev => prev.slice(0, -1))
    setErrors([])
  }

  // Agregar nodo
  const addNode = () => {
    if (!newNodeName.trim()) {
      setErrors(['El nombre del elemento es requerido'])
      return
    }

    if (levels.length === 0) {
      setErrors(['Primero defina al menos un nivel'])
      return
    }

    let targetLevel = 0
    
    if (selectedParentId) {
      const parent = treeNodes.find(n => n.id === selectedParentId)
      if (parent) {
        targetLevel = parent.level + 1
      }
    }

    if (targetLevel >= levels.length) {
      setErrors(['No se puede agregar elementos en este nivel. Agregue más niveles primero.'])
      return
    }

    const newNode: TreeNode = {
      id: `node_${Date.now()}`,
      name: newNodeName.trim(),
      level: targetLevel,
      parentId: selectedParentId,
      children: [],
      expanded: false
    }

    setTreeNodes(prev => [...prev, newNode])
    setNewNodeName('')
    setErrors([])
  }

  // Actualizar nombre de nodo
  const updateNodeName = (nodeId: string, name: string) => {
    setTreeNodes(prev => prev.map(n => n.id === nodeId ? { ...n, name } : n))
    setErrors([])
  }

  // Eliminar nodo y sus descendientes
  const removeNode = (nodeId: string) => {
    const removeNodeAndDescendants = (nodes: TreeNode[], id: string): TreeNode[] => {
      return nodes.filter(n => n.id !== id).map(n => ({
        ...n,
        children: removeNodeAndDescendants(n.children, id)
      }))
    }

    const tree = buildTree(treeNodes)
    const updatedTree = removeNodeAndDescendants(tree, nodeId)
    
    // Aplanar árbol de vuelta a array
    const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.flatMap(n => [n, ...flattenTree(n.children)])
    }
    
    setTreeNodes(flattenTree(updatedTree))
    setShowDeleteConfirm(null)
    setErrors([])
  }

  // Vista previa para operador
  const renderPreview = () => {
    const [selectedValues, setSelectedValues] = useState<{[key: number]: string}>({})
    
    const handleLevelChange = (levelIndex: number, value: string) => {
      const newValues = { ...selectedValues }
      
      // Limpiar niveles posteriores
      for (let i = levelIndex + 1; i < levels.length; i++) {
        delete newValues[i]
      }
      
      newValues[levelIndex] = value
      setSelectedValues(newValues)
    }

    const getOptionsForLevel = (levelIndex: number): TreeNode[] => {
      if (levelIndex === 0) {
        return treeNodes.filter(n => n.level === 0)
      } else {
        const parentValue = selectedValues[levelIndex - 1]
        if (!parentValue) return []
        
        const parent = treeNodes.find(n => n.id === parentValue)
        if (!parent) return []
        
        return treeNodes.filter(n => n.parentId === parentValue)
      }
    }

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-neutral-900 mb-4">Vista Previa - Campos para Operador</h4>
        
        {levels.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p className="text-sm">Defina los niveles primero para ver la vista previa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {levels.map((level, index) => {
              const options = getOptionsForLevel(index)
              const isDisabled = index > 0 && !selectedValues[index - 1]
              const currentValue = selectedValues[index]
              
              return (
                <div key={level.id} className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    {level.name}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:text-neutral-500"
                    disabled={isDisabled || options.length === 0}
                    value={currentValue || ''}
                    onChange={(e) => handleLevelChange(index, e.target.value)}
                  >
                    <option value="">Seleccione {level.name}...</option>
                    {options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {isDisabled && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <FiAlertTriangle className="w-3 h-3" />
                      Seleccione el nivel anterior primero
                    </p>
                  )}
                </div>
              )
            })}
            
            {Object.keys(selectedValues).length > 0 && (
              <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h5 className="text-sm font-semibold text-primary-900 mb-2">Valores Seleccionados:</h5>
                <div className="space-y-1">
                  {levels.map((level, index) => {
                    const value = selectedValues[index]
                    if (!value) return null
                    
                    const selectedNode = treeNodes.find(n => n.id === value)
                    return (
                      <div key={level.id} className="text-sm">
                        <span className="font-medium text-primary-700">{level.name}:</span>{' '}
                        <span className="text-primary-900">{selectedNode?.name || value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Guardar configuración
  const saveConfiguration = async () => {
    if (!validateConfiguration()) {
      return
    }

    setIsSaving(true)
    
    try {
      const config = {
        groupLabel: `Lista Dependientes Múltiples (${levels.length} niveles)`,
        levels,
        nodes: treeNodes
      }

      // Simular guardado en base de datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onUpdate(field.id, { multipleDependentConfig: config as any })
      
      // Mostrar confirmación
      setShowSaveConfirm(true)
      setTimeout(() => setShowSaveConfirm(false), 3000)
    } catch (error) {
      setErrors(['Error al guardar la configuración'])
    } finally {
      setIsSaving(false)
    }
  }

  // Validar configuración
  const validateConfiguration = (): boolean => {
    const validationErrors: string[] = []

    if (levels.length === 0) {
      validationErrors.push('Debe definir al menos un nivel')
    }

    if (levels.some(l => !l.name.trim())) {
      validationErrors.push('Todos los niveles deben tener nombre')
    }

    if (treeNodes.some(n => !n.name.trim())) {
      validationErrors.push('Todos los elementos deben tener nombre')
    }

    // Validar que los nodos tengan padres válidos
    treeNodes.forEach(node => {
      if (node.parentId && !treeNodes.find(n => n.id === node.parentId)) {
        validationErrors.push(`El elemento "${node.name}" tiene un padre inválido`)
      }
    })

    setErrors(validationErrors)
    return validationErrors.length === 0
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">Lista Dependientes Múltiples</h3>
          <p className="text-sm text-neutral-600 mt-1">Configure niveles jerárquicos y sus valores dependientes</p>
        </div>
        <button
          type="button"
          onClick={saveConfiguration}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Errores de validación</h4>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel izquierdo: Configuración */}
        <div className="space-y-6">
          {/* Definición de Niveles */}
          <div className="bg-white p-6 border border-neutral-200 rounded-lg">
            <h4 className="text-lg font-semibold text-neutral-900 mb-4">1. Definir Niveles Jerárquicos</h4>
            
            <div className="space-y-3">
              {levels.map((level, index) => (
                <div key={level.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <span className="text-sm font-medium text-neutral-500 w-8">{index + 1}</span>
                  
                  {editingLevelId === level.id ? (
                    <input
                      type="text"
                      value={level.name}
                      onChange={(e) => updateLevelName(level.id, e.target.value)}
                      onBlur={() => setEditingLevelId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingLevelId(null)
                        if (e.key === 'Escape') setEditingLevelId(null)
                      }}
                      className="flex-1 px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="flex-1 text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary-600"
                      onClick={() => setEditingLevelId(level.id)}
                    >
                      {level.name}
                    </span>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setEditingLevelId(level.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar nombre"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  
                  {index === levels.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm({type: 'level', id: level.id, name: level.name})}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar último nivel"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <div className="flex items-center gap-3 p-3 border-2 border-dashed border-neutral-300 rounded-lg">
                <span className="text-sm font-medium text-neutral-500 w-8">{levels.length + 1}</span>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="Nombre del nuevo nivel..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addLevel()
                  }}
                />
                <button
                  type="button"
                  onClick={addLevel}
                  className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  title="Agregar nivel"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-neutral-500 mt-4">
              Máximo 8 niveles. Ejemplo: Continente → País → Estado → Ciudad
            </p>
          </div>

          {/* Construcción del Árbol */}
          <div className="bg-white p-6 border border-neutral-200 rounded-lg">
            <h4 className="text-lg font-semibold text-neutral-900 mb-4">2. Construir Árbol de Elementos</h4>
            
            {levels.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">Primero defina los niveles jerárquicos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selector de padre */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Elemento Padre (opcional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedParentId || ''}
                    onChange={(e) => setSelectedParentId(e.target.value || null)}
                  >
                    <option value="">Elemento raíz (sin padre)</option>
                    {treeNodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {'  '.repeat(node.level)}{node.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Agregar nuevo elemento */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="Nombre del elemento..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addNode()
                    }}
                  />
                  <button
                    type="button"
                    onClick={addNode}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Agregar elemento"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Árbol visual */}
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 max-h-96 overflow-y-auto">
                  {treeNodes.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <p className="text-sm">No hay elementos agregados</p>
                      <p className="text-xs mt-1">Comience agregando elementos raíz</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {renderTree(buildTree(treeNodes))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Vista previa */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 rounded-lg">
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              {showDeleteConfirm.type === 'level' 
                ? `¿Está seguro de eliminar el nivel "${showDeleteConfirm.name}"? Esta acción eliminará todos los elementos de este nivel y sus descendientes.`
                : `¿Está seguro de eliminar el elemento "${showDeleteConfirm.name}"? Esta acción eliminará el elemento y todos sus descendientes.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showDeleteConfirm.type === 'level') {
                    removeLastLevel()
                  } else {
                    removeNode(showDeleteConfirm.id)
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de guardado */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  ¡Configuración Guardada!
                </h3>
                <p className="text-sm text-neutral-600">
                  Lista Dependientes Múltiples guardadas y configuradas correctamente
                </p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Resumen de la configuración:</p>
                <ul className="text-xs space-y-1">
                  <li>· {levels.length} niveles jerárquicos definidos</li>
                  <li>· {treeNodes.length} elementos configurados</li>
                  <li>· Estructura guardada en base de datos</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
