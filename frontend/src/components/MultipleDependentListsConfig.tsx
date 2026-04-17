import { useState, useRef } from 'react'
import { FiPlus, FiTrash2, FiEdit2, FiChevronRight, FiChevronDown, FiUpload, FiDownload, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { FormField } from '@services/indicatorVariablesService'

// Interfaces para la estructura de árbol n-ario
interface TreeNode {
  id: string
  label: string
  parentId: string | null
  level: number
  children: TreeNode[]
  expanded: boolean
}

interface LevelDefinition {
  id: string
  name: string
  fieldName: string
  required: boolean
}

interface MultipleDependentListsConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function MultipleDependentListsConfig({ field, onUpdate }: MultipleDependentListsConfigProps) {
  const [levels, setLevels] = useState<LevelDefinition[]>([])
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [editingLevel, setEditingLevel] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [newLevelName, setNewLevelName] = useState('')
  const [newNodeLabel, setNewNodeLabel] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importError, setImportError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inicializar configuración existente
  useState(() => {
    const config = field.multipleDependentConfig
    if (config && field.id) {
      const cfg = config as any
      setLevels(cfg.levels || [])
      setNodes(cfg.nodes || [])
    }
  })

  // Validar estructura
  const validateStructure = (): boolean => {
    const errors: string[] = []
    
    if (levels.length === 0) {
      errors.push('Debe agregar al menos un nivel')
    }
    
    if (levels.length > 0 && nodes.length === 0) {
      errors.push('Debe agregar al menos un nodo raíz')
    }
    
    const levelNames = levels.map(l => l.name)
    const duplicates = levelNames.filter((name, index) => levelNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      errors.push(`Nombres de nivel duplicados: ${duplicates.join(', ')}`)
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Agregar nivel
  const addLevel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const newLevel: LevelDefinition = {
        id: `level_${Date.now()}`,
        name: newLevelName || `Nivel ${levels.length + 1}`,
        fieldName: `nivel_${levels.length + 1}`,
        required: true
      }
      
      setLevels(prev => [...prev, newLevel])
      setNewLevelName('')
      setValidationErrors([])
    } catch (error) {
      console.error('Error en addLevel:', error)
      setValidationErrors([`Error al agregar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Actualizar nivel
  const updateLevel = (levelId: string, updates: Partial<LevelDefinition>) => {
    try {
      setLevels(prev => prev.map(l => l.id === levelId ? { ...l, ...updates } : l))
      setValidationErrors([])
    } catch (error) {
      console.error('Error en updateLevel:', error)
      setValidationErrors([`Error al actualizar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Actualizar nodo
  const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
    try {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n))
      setValidationErrors([])
    } catch (error) {
      console.error('Error en updateNode:', error)
      setValidationErrors([`Error al actualizar nodo: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Eliminar nivel con validación
  const removeLevel = (levelId: string) => {
    try {
      const levelToRemove = levels.find(l => l.id === levelId)
      if (!levelToRemove) return
      
      // Verificar si hay nodos en este nivel
      const levelIndex = levels.findIndex(l => l.id === levelId)
      const nodesInLevel = nodes.filter(n => n.level === levelIndex + 1)
      if (nodesInLevel.length > 0) {
        setValidationErrors([`No se puede eliminar el nivel "${levelToRemove.name}" porque contiene ${nodesInLevel.length} nodos. Elimine los nodos primero.`])
        return
      }
      
      setLevels(prev => prev.filter(l => l.id !== levelId))
      setValidationErrors([])
    } catch (error) {
      console.error('Error en removeLevel:', error)
      setValidationErrors([`Error al eliminar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Agregar nodo
  const addNode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (!newNodeLabel.trim()) {
        setValidationErrors(['El label del nodo no puede estar vacío'])
        return
      }
      
      const newNode: TreeNode = {
        id: `node_${Date.now()}`,
        label: newNodeLabel.trim(),
        parentId: selectedNode ? selectedNode.id : null,
        level: selectedNode ? selectedNode.level + 1 : 1,
        children: [],
        expanded: false
      }
      
      setNodes(prev => [...prev, newNode])
      setNewNodeLabel('')
      setValidationErrors([])
    } catch (error) {
      console.error('Error en addNode:', error)
      setValidationErrors([`Error al agregar nodo: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  
  // Eliminar nodo
  const removeNode = (nodeId: string) => {
    try {
      // Eliminar el nodo y todos sus hijos recursivamente
      const removeNodeAndChildren = (nodes: TreeNode[], id: string): TreeNode[] => {
        return nodes.filter(n => n.id !== id).map(n => ({
          ...n,
          children: removeNodeAndChildren(n.children, id)
        }))
      }
      
      setNodes(prev => removeNodeAndChildren(prev, nodeId))
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
      setValidationErrors([])
    } catch (error) {
      console.error('Error en removeNode:', error)
      setValidationErrors([`Error al eliminar nodo: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Toggle expansión de nodo
  const toggleNodeExpansion = (nodeId: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, expanded: !n.expanded } : n))
  }

  // Construir árbol jerárquico
  const buildTree = (flatNodes: TreeNode[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []
    
    // Crear mapa de nodos
    flatNodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })
    
    // Construir jerarquía
    flatNodes.forEach(node => {
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

  // Renderizar árbol
  const renderTree = (treeNodes: TreeNode[], level = 0): JSX.Element[] => {
    return treeNodes.map(node => (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-neutral-100 ${
            selectedNode?.id === node.id ? 'bg-primary-100' : ''
          }`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {node.children.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleNodeExpansion(node.id)
              }}
              className="p-1 hover:bg-neutral-200 rounded"
            >
              {node.expanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
            </button>
          )}
          
          {editingNode === node.id ? (
            <input
              type="text"
              value={node.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              onBlur={() => setEditingNode(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingNode(null)
                }
              }}
              className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span 
              className="flex-1 text-sm cursor-pointer hover:text-primary-600"
              onClick={(e) => {
                e.stopPropagation()
                setEditingNode(node.id)
              }}
            >
              {node.label}
            </span>
          )}
          
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEditingNode(node.id)
              }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Editar"
            >
              <FiEdit2 className="w-3 h-3" />
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeNode(node.id)
              }}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Eliminar"
            >
              <FiTrash2 className="w-3 h-3" />
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

  // Vista previa para el operador
  const renderPreview = () => {
    const [selectedValues, setSelectedValues] = useState<{[key: string]: string}>({})
    
    const handleLevelChange = (levelIndex: number, value: string) => {
      const newValues = { ...selectedValues }
      
      // Limpiar niveles posteriores
      for (let i = levelIndex + 1; i < levels.length; i++) {
        delete newValues[levels[i].id]
      }
      
      newValues[levels[levelIndex].id] = value
      setSelectedValues(newValues)
    }
    
    const getOptionsForLevel = (levelIndex: number): TreeNode[] => {
      if (levelIndex === 0) {
        // Nivel raíz: nodos sin padre
        return nodes.filter(n => n.parentId === null)
      } else {
        // Niveles posteriores: hijos del valor seleccionado en nivel anterior
        const previousValue = selectedValues[levels[levelIndex - 1].id]
        if (!previousValue) return []
        
        const parentNode = nodes.find(n => n.id === previousValue)
        return parentNode ? nodes.filter(n => n.parentId === previousValue) : []
      }
    }
    
    return (
      <div className="space-y-4 p-4 bg-neutral-50 rounded-lg">
        <h4 className="font-medium text-neutral-900 mb-3">Vista Previa - Comportamiento del Operador</h4>
        
        {levels.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-lg">
            Agregue niveles para ver la vista previa
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level, index) => {
              const options = getOptionsForLevel(index)
              const isDisabled = index > 0 && !selectedValues[levels[index - 1].id]
              const currentValue = selectedValues[level.id] || ''
              
              return (
                <div key={level.id}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {level.name}
                    {level.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    value={currentValue}
                    onChange={(e) => handleLevelChange(index, e.target.value)}
                    disabled={isDisabled || options.length === 0}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm disabled:bg-neutral-100 disabled:text-neutral-500"
                  >
                    <option value="">Seleccione {level.name}...</option>
                    {options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {isDisabled && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Seleccione {levels[index - 1].name} primero
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Guardar configuración
  const saveConfiguration = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (!validateStructure()) {
        return
      }
      
      // Guardar configuración en JSON para compatibilidad
      const config = {
        groupLabel: `Lista Dependientes Múltiples (${levels.length} niveles)`,
        levels,
        nodes
      }
      
      // Preparar datos para DependentListValue
      const dependentListData = prepareDependentListData()
      
      // Actualizar configuración del campo
      onUpdate(field.id, { 
        multipleDependentConfig: config as any,
        dependentListData: dependentListData as any
      })
    } catch (error) {
      console.error('Error en saveConfiguration:', error)
      setValidationErrors([`Error al guardar configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Preparar datos para DependentListValue
  const prepareDependentListData = () => {
    const treeNodes = buildTree(nodes)
    const dependentListValues: any[] = []
    
    // Función recursiva para convertir el árbol a formato plano
    const flattenTree = (treeNodes: TreeNode[], level = 0, parentId: string | null = null): void => {
      treeNodes.forEach(node => {
        dependentListValues.push({
          nodeId: node.id,
          parentId: parentId,
          level: level,
          label: node.label,
          value: node.id // Usar el ID como valor
        })
        
        if (node.children && node.children.length > 0) {
          flattenTree(node.children, level + 1, node.id)
        }
      })
    }
    
    // Procesar nodos raíz (parentId = null)
    flattenTree(treeNodes)
    
    return dependentListValues
  }

  // Importar datos
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)
          
          if (data.levels) setLevels(data.levels)
          if (data.nodes) setNodes(data.nodes)
          
          setImportError('')
          setValidationErrors([])
        } catch (parseError) {
          setImportError('Error al parsear el archivo JSON')
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Error en importData:', error)
      setImportError('Error al leer el archivo')
    }
  }

  // Exportar datos
  const exportData = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const data = {
        levels,
        nodes
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dependent_lists_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error en exportData:', error)
      setValidationErrors(['Error al exportar datos'])
    }
  }

  return (
    <div className="space-y-6 p-4 bg-white border border-neutral-200 rounded-lg">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lista Dependientes Múltiples</h3>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportData}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
          >
            <FiDownload className="w-4 h-4 inline mr-1" />
            Exportar
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            <FiUpload className="w-4 h-4 inline mr-1" />
            Importar
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </div>
      </div>

      {/* Errores */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">Errores:</span>
          </div>
          <ul className="space-y-1 text-sm text-red-600">
            {validationErrors.map((error, index) => (
              <li key={index}>- {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errores de importación */}
      {importError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">{importError}</span>
          </div>
        </div>
      )}

      {/* Contenido principal con dos paneles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo: Construcción del árbol */}
        <div className="space-y-4">
          <h4 className="font-medium text-neutral-900">Construcción del Árbol</h4>
          
          {/* Definición de niveles */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h5 className="font-medium text-sm mb-3">Niveles</h5>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Nombre del nivel (ej: Continente)"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={addLevel}
                className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            
            {levels.length === 0 ? (
              <div className="text-center py-4 text-neutral-500 text-sm border-2 border-dashed border-neutral-300 rounded">
                Agregue niveles para empezar
              </div>
            ) : (
              <div className="space-y-2">
                {levels.map((level, index) => (
                  <div key={level.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
                    <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>
                    
                    {editingLevel === level.id ? (
                      <input
                        type="text"
                        value={level.name}
                        onChange={(e) => updateLevel(level.id, { name: e.target.value })}
                        onBlur={() => setEditingLevel(null)}
                        className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="flex-1 text-sm cursor-pointer hover:text-primary-600"
                        onClick={() => setEditingLevel(level.id)}
                      >
                        {level.name}
                      </span>
                    )}
                    
                    <input
                      type="text"
                      value={level.fieldName}
                      onChange={(e) => updateLevel(level.id, { fieldName: e.target.value })}
                      placeholder="Campo BD"
                      className="w-24 px-2 py-1 border border-neutral-300 rounded text-xs"
                    />
                    
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeLevel(level.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Eliminar nivel"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Construcción de nodos */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h5 className="font-medium text-sm mb-3">Nodos del Árbol</h5>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder={
                  selectedNode 
                    ? `Hijo de: ${selectedNode.label}` 
                    : "Nodo raíz (ej: América)"
                }
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={addNode}
                className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            
            {nodes.length === 0 ? (
              <div className="text-center py-4 text-neutral-500 text-sm border-2 border-dashed border-neutral-300 rounded">
                Agregue nodos raíz para empezar
              </div>
            ) : (
              <div className="border border-neutral-200 rounded p-2 max-h-64 overflow-y-auto">
                {renderTree(buildTree(nodes))}
              </div>
            )}
          </div>
        </div>
        
        {/* Panel derecho: Vista previa */}
        <div className="space-y-4">
          {renderPreview()}
        </div>
      </div>

      {/* Guardar configuración */}
      <div className="border-t border-neutral-200 pt-4 flex justify-end">
        <button
          type="button"
          onClick={saveConfiguration}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          <FiCheck className="w-4 h-4 inline mr-2" />
          Guardar Configuración
        </button>
      </div>
    </div>
  )
}
