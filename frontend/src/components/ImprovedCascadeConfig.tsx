import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiCheck, FiX, FiAlertCircle, FiChevronDown, FiChevronRight, FiEdit2 } from 'react-icons/fi'
import { FormField } from '@services/indicatorVariablesService'

interface CascadeLevel {
  id: string
  level: number
  label: string
  fieldName: string
  required: boolean
}

interface CascadeOption {
  key: string
  label: string
  children?: Record<string, CascadeOption>
}

interface ImprovedCascadeConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function ImprovedCascadeConfig({ field, onUpdate }: ImprovedCascadeConfigProps) {
  const [levels, setLevels] = useState<CascadeLevel[]>([])
  const [cascadeData, setCascadeData] = useState<Record<string, CascadeOption>>({})
  const [autocompleteMap, setAutocompleteMap] = useState<Record<string, string>>({})
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedParent, setSelectedParent] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importError, setImportError] = useState<string>('')
  const [editingNode, setEditingNode] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAutocomplete = field.type === 'cascade_with_autocomplete'

  // Manejo de errores global
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error en ImprovedCascadeConfig:', event.error)
      setHasError(true)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection en ImprovedCascadeConfig:', event.reason)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Función segura para ejecutar acciones
  const safeExecute = (action: () => void, errorMessage: string) => {
    try {
      action()
    } catch (error) {
      console.error(errorMessage, error)
      setValidationErrors([`${errorMessage}: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Inicializar configuración existente
  useEffect(() => {
    // Solo inicializar si el campo tiene configuración previa
    if (!field.id) return
    
    const config = isAutocomplete ? field.autocompleteConfig : field.cascadeConfig
    if (config) {
      const cfg = config as any
      setLevels(cfg.levels || [])
      setCascadeData(cfg.data || {})
      setAutocompleteMap(cfg.autocompleteMap || {})
    } else {
      // Limpiar estados si no hay configuración (campo nuevo)
      setLevels([])
      setCascadeData({})
      setAutocompleteMap({})
      setExpandedNodes(new Set())
      setSelectedParent('')
      setValidationErrors([])
      setImportError('')
      setEditingNode('')
    }
  }, [field.id, isAutocomplete])

  // Validar estructura
  const validateStructure = (): boolean => {
    const errors: string[] = []
    
    if (levels.length === 0) {
      errors.push('Debe agregar al menos un nivel')
    }
    
    // Validar nombres de campo únicos
    const fieldNames = levels.map(l => l.fieldName)
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      errors.push(`Nombres de campo duplicados: ${duplicates.join(', ')}`)
    }
    
    // Validar que el primer nivel tenga opciones
    if (levels.length > 0 && Object.keys(cascadeData).length === 0) {
      errors.push('El primer nivel debe tener opciones configuradas')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Agregar nivel
  const addLevel = () => {
    safeExecute(() => {
      setLevels(prevLevels => {
        const newLevel: CascadeLevel = {
          id: `level_${Date.now()}`,
          level: prevLevels.length + 1,
          label: `Nivel ${prevLevels.length + 1}`,
          fieldName: `nivel_${prevLevels.length + 1}`,
          required: true
        }
        return [...prevLevels, newLevel]
      })
    }, 'Error al agregar nivel')
  }

  // Actualizar nivel
  const updateLevel = (levelId: string, updates: Partial<CascadeLevel>) => {
    setLevels(prevLevels => prevLevels.map(l => l.id === levelId ? { ...l, ...updates } : l))
  }

  // Eliminar nivel
  const removeLevel = (levelId: string) => {
    setLevels(prevLevels => {
      const levelToRemove = prevLevels.find(l => l.id === levelId)
      if (!levelToRemove || levelToRemove.level === 1) return prevLevels // No eliminar primer nivel
      
      // Limpiar datos dependientes si es necesario
      if (levelToRemove.level === 1) {
        setCascadeData({})
        setAutocompleteMap({})
      }
      
      return prevLevels.filter(l => l.id !== levelId)
    })
  }

  // Agregar opción
  const addOption = (parentKey: string, optionKey: string, optionLabel: string) => {
    if (!parentKey) {
      // Agregar al nivel raíz
      setCascadeData(prev => ({
        ...prev,
        [optionKey]: {
          key: optionKey,
          label: optionLabel,
          children: {}
        }
      }))
    } else {
      // Agregar como hijo
      const updateParent = (data: Record<string, CascadeOption>, targetKey: string, newOption: CascadeOption): Record<string, CascadeOption> => {
        const result: Record<string, CascadeOption> = {}
        
        Object.keys(data).forEach(key => {
          const option = data[key]
          if (option.key === targetKey) {
            result[key] = {
              ...option,
              children: {
                ...option.children,
                [newOption.key]: newOption
              }
            }
          } else if (option.children) {
            result[key] = {
              ...option,
              children: updateParent(option.children, targetKey, newOption)
            }
          } else {
            result[key] = option
          }
        })
        
        return result
      }
      
      setCascadeData(prev => updateParent(prev, parentKey, {
        key: optionKey,
        label: optionLabel,
        children: {}
      }))
    }
  }

  // Eliminar opción
  const removeOption = (keyToRemove: string) => {
    const removeFromData = (data: Record<string, CascadeOption>): Record<string, CascadeOption> => {
      const result: Record<string, CascadeOption> = {}
      
      Object.keys(data).forEach(key => {
        const option = data[key]
        if (option.key === keyToRemove) {
          // No incluir esta opción
          return
        }
        
        if (option.children) {
          result[key] = {
            ...option,
            children: removeFromData(option.children)
          }
        } else {
          result[key] = option
        }
      })
      
      return result
    }
    
    setCascadeData(prev => removeFromData(prev))
    
    // Limpiar autocompletado si existe
    if (autocompleteMap[keyToRemove]) {
      setAutocompleteMap(prev => {
        const newMap = { ...prev }
        delete newMap[keyToRemove]
        return newMap
      })
    }
  }

  // Actualizar etiqueta de opción
  const updateOptionLabel = (keyToUpdate: string, newLabel: string) => {
    const updateLabel = (data: Record<string, CascadeOption>): Record<string, CascadeOption> => {
      const result: Record<string, CascadeOption> = {}
      
      Object.keys(data).forEach(key => {
        const option = data[key]
        if (option.key === keyToUpdate) {
          result[key] = { ...option, label: newLabel }
        } else if (option.children) {
          result[key] = {
            ...option,
            children: updateLabel(option.children)
          }
        } else {
          result[key] = option
        }
      })
      
      return result
    }
    
    setCascadeData(prev => updateLabel(prev))
  }

  // Actualizar autocompletado
  const updateAutocomplete = (key: string, value: string) => {
    setAutocompleteMap(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Obtener opciones del último nivel
  const getLastLevelOptions = (): string[] => {
    if (levels.length === 0) return []
    
    const collectLastLevel = (data: Record<string, CascadeOption>, currentLevel: number): string[] => {
      if (currentLevel === levels.length) {
        return Object.keys(data)
      }
      
      const result: string[] = []
      Object.values(data).forEach(option => {
        if (option.children) {
          result.push(...collectLastLevel(option.children, currentLevel + 1))
        }
      })
      
      return result
    }
    
    return collectLastLevel(cascadeData, 1)
  }

  // Importar datos
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        if (data.levels) setLevels(data.levels)
        if (data.cascadeData) setCascadeData(data.cascadeData)
        if (data.autocompleteMap) setAutocompleteMap(data.autocompleteMap)
        
        setImportError('')
      } catch (error) {
        setImportError('Error al parsear el archivo JSON')
      }
    }
    reader.readAsText(file)
  }

  // Exportar datos
  const exportData = () => {
    const data = {
      levels,
      cascadeData,
      autocompleteMap: isAutocomplete ? autocompleteMap : undefined
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cascade_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Limpiar todo
  const clearAll = () => {
    setLevels([])
    setCascadeData({})
    setAutocompleteMap({})
    setExpandedNodes(new Set())
    setSelectedParent('')
    setValidationErrors([])
    setImportError('')
  }

  // Cargar ejemplo
  const loadExample = () => {
    const exampleLevels: CascadeLevel[] = [
      { id: 'l1', level: 1, label: 'Marca', fieldName: 'marca_id', required: true },
      { id: 'l2', level: 2, label: 'Modelo', fieldName: 'modelo_id', required: true },
      { id: 'l3', level: 3, label: 'Versión', fieldName: 'version_id', required: true }
    ]
    
    const exampleData: Record<string, CascadeOption> = {
      'toyota': {
        key: 'toyota',
        label: 'Toyota',
        children: {
          'corolla': {
            key: 'corolla',
            label: 'Corolla',
            children: {
              'le': { key: 'le', label: 'LE' },
              'se': { key: 'se', label: 'SE' },
              'xse': { key: 'xse', label: 'XSE' }
            }
          },
          'hilux': {
            key: 'hilux',
            label: 'Hilux',
            children: {
              'sr': { key: 'sr', label: 'SR' },
              'sr5': { key: 'sr5', label: 'SR5' }
            }
          }
        }
      },
      'honda': {
        key: 'honda',
        label: 'Honda',
        children: {
          'civic': {
            key: 'civic',
            label: 'Civic',
            children: {
              'lx': { key: 'lx', label: 'LX' },
              'ex': { key: 'ex', label: 'EX' }
            }
          }
        }
      }
    }
    
    const exampleAutocomplete: Record<string, string> = {
      'le': 'Motor 1.8L, consumo 32mpg',
      'se': 'Motor 2.0L, consumo 30mpg',
      'xse': 'Motor 2.0L híbrido, consumo 50mpg',
      'sr': 'Diésel 2.4L',
      'sr5': 'Diésel 2.8L 4x4',
      'lx': 'Motor 2.0L, consumo 28mpg',
      'ex': 'Motor 1.5L Turbo, consumo 35mpg'
    }
    
    setLevels(exampleLevels)
    setCascadeData(exampleData)
    if (isAutocomplete) {
      setAutocompleteMap(exampleAutocomplete)
    }
  }

  // Renderizar árbol de opciones
  const renderOption = (option: CascadeOption, depth: number = 0, parentKey: string = '') => {
    const isExpanded = expandedNodes.has(option.key)
    const hasChildren = option.children && Object.keys(option.children).length > 0
    const isLastLevel = depth === levels.length - 1
    const isEditing = editingNode === option.key
    
    return (
      <div key={option.key} className="border border-neutral-200 rounded-lg mb-2">
        <div className="flex items-center justify-between p-3 bg-neutral-50">
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedNodes)
                  if (isExpanded) {
                    newExpanded.delete(option.key)
                  } else {
                    newExpanded.add(option.key)
                  }
                  setExpandedNodes(newExpanded)
                }}
                className="p-1 hover:bg-neutral-200 rounded"
              >
                {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
              </button>
            )}
            
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOptionLabel(option.key, e.target.value)}
                    onBlur={() => setEditingNode('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingNode('')
                      if (e.key === 'Escape') setEditingNode('')
                    }}
                    className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm font-medium"
                    autoFocus
                  />
                  <button
                    onClick={() => setEditingNode('')}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <FiCheck className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.label}</span>
                  <button
                    onClick={() => setEditingNode(option.key)}
                    className="p-1 text-neutral-400 hover:bg-neutral-200 rounded"
                  >
                    <FiEdit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
              {option.key}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setSelectedParent(option.key)}
                className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                title="Agregar opción hija"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => removeOption(option.key)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Eliminar opción"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Autocompletado para último nivel */}
        {isAutocomplete && isLastLevel && (
          <div className="px-3 pb-3 border-t border-neutral-200">
            <label className="block text-xs text-neutral-600 mb-1">Autocompletado:</label>
            <input
              type="text"
              value={autocompleteMap[option.key] || ''}
              onChange={(e) => updateAutocomplete(option.key, e.target.value)}
              className="w-full px-2 py-1 border border-primary-300 rounded text-sm bg-primary-50"
              placeholder="Texto que se autocompletará..."
            />
            {autocompleteMap[option.key] && (
              <div className="mt-1 text-xs text-primary-600">Configurado</div>
            )}
          </div>
        )}
        
        {/* Hijos expandidos */}
        {isExpanded && hasChildren && (
          <div className="border-t border-neutral-200">
            <div className="p-3">
              {Object.values(option.children || {}).map(child => renderOption(child, depth + 1, option.key))}
            </div>
          </div>
        )}
        
        {/* Agregar nueva opción hija */}
        {selectedParent === option.key && (
          <div className="border-t border-neutral-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Clave (ej: opcion1)"
                className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                id={`key_${option.key}`}
              />
              <input
                type="text"
                placeholder="Etiqueta (ej: Opción 1)"
                className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                id={`label_${option.key}`}
              />
              <button
                onClick={() => {
                  const keyInput = document.getElementById(`key_${option.key}`) as HTMLInputElement
                  const labelInput = document.getElementById(`label_${option.key}`) as HTMLInputElement
                  
                  if (keyInput?.value && labelInput?.value) {
                    addOption(option.key, keyInput.value, labelInput.value)
                    keyInput.value = ''
                    labelInput.value = ''
                  }
                }}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
              >
                Agregar
              </button>
              <button
                onClick={() => setSelectedParent('')}
                className="px-2 py-1 border border-neutral-300 rounded text-sm"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Guardar configuración
  const saveConfiguration = () => {
    if (!validateStructure()) {
      return
    }
    
    if (isAutocomplete) {
      const config = {
        groupLabel: `Selección Jerárquica (${levels.length} niveles)`,
        levels,
        layout: 'vertical' as const,
        data: cascadeData,
        autocompleteMap
      }
      onUpdate(field.id, { autocompleteConfig: config as any })
    } else {
      const config = {
        groupLabel: `Selección Jerárquica (${levels.length} niveles)`,
        levels,
        layout: 'vertical' as const,
        data: cascadeData
      }
      onUpdate(field.id, { cascadeConfig: config as any })
    }
  }

  // Mostrar error si hay
  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <FiAlertCircle className="w-5 h-5" />
          <span className="font-medium">Error en el componente</span>
        </div>
        <p className="mt-2 text-sm text-red-600">
          Ha ocurrido un error inesperado. Por favor recargue la página y vuelva a intentarlo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm"
        >
          Recargar Página
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 bg-white border border-neutral-200 rounded-lg">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Configuración {isAutocomplete ? 'con Autocompletado' : 'Multinivel'}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadExample}
            className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm"
          >
            <FiDownload className="w-4 h-4 inline mr-1" />
            Ejemplo
          </button>
          
          <button
            onClick={exportData}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
          >
            <FiUpload className="w-4 h-4 inline mr-1" />
            Exportar
          </button>
          
          <button
            onClick={clearAll}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
          >
            <FiTrash2 className="w-4 h-4 inline mr-1" />
            Limpiar
          </button>
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

      {/* Configuración de niveles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Niveles</h4>
          <button
            onClick={addLevel}
            disabled={levels.length >= 5}
            className="px-3 py-1 bg-primary-600 text-white rounded text-sm disabled:bg-neutral-300"
          >
            <FiPlus className="w-4 h-4 inline mr-1" />
            Agregar Nivel
          </button>
        </div>
        
        {levels.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500">
            Agregue niveles para empezar
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level, index) => (
              <div key={level.id} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">{level.level}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Etiqueta</label>
                      <input
                        type="text"
                        value={level.label}
                        onChange={(e) => updateLevel(level.id, { label: e.target.value })}
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                        placeholder="Ej: Marca"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Campo BD</label>
                      <input
                        type="text"
                        value={level.fieldName}
                        onChange={(e) => updateLevel(level.id, { fieldName: e.target.value })}
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                        placeholder="Ej: marca_id"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={level.required}
                      onChange={(e) => updateLevel(level.id, { required: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm">Obligatorio</label>
                    
                    {index > 0 && (
                      <button
                        onClick={() => removeLevel(level.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-neutral-600 bg-neutral-100 rounded p-2">
                  {index === 0 ? "Nivel raíz - opciones principales" : `Depende de: ${levels[index - 1].label}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuración de datos */}
      {levels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Datos de la Cascada</h4>
            
            {levels.length > 0 && (
              <button
                onClick={() => setSelectedParent('')}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
              >
                <FiPlus className="w-4 h-4 inline mr-1" />
                Agregar Opción Raíz
              </button>
            )}
          </div>
          
          {Object.keys(cascadeData).length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500">
              Agregue opciones para empezar
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 max-h-96 overflow-y-auto">
              {Object.values(cascadeData).map(option => renderOption(option))}
            </div>
          )}
          
          {selectedParent === '' && (
            <div className="border-t border-neutral-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Clave raíz (ej: toyota)"
                  className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                  id="new_root_key"
                />
                <input
                  type="text"
                  placeholder="Etiqueta (ej: Toyota)"
                  className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                  id="new_root_label"
                />
                <button
                  onClick={() => {
                    const keyInput = document.getElementById('new_root_key') as HTMLInputElement
                    const labelInput = document.getElementById('new_root_label') as HTMLInputElement
                    
                    if (keyInput?.value && labelInput?.value) {
                      addOption('', keyInput.value, labelInput.value)
                      keyInput.value = ''
                      labelInput.value = ''
                    }
                  }}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setSelectedParent('')}
                  className="px-2 py-1 border border-neutral-300 rounded text-sm"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Autocompletado masivo */}
      {isAutocomplete && levels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Autocompletado del Último Nivel</h4>
            <button
              onClick={() => {
                const lastLevelOptions = getLastLevelOptions()
                if (lastLevelOptions.length === 0) {
                  setValidationErrors(['No hay opciones en el último nivel'])
                  return
                }
                // Aquí se podría abrir un modal para configurar autocompletado masivo
              }}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
            >
              Configurar Autocompletado
            </button>
          </div>
          
          <div className="text-sm text-neutral-600">
            Hay {getLastLevelOptions().length} opciones en el último nivel listas para autocompletado
          </div>
        </div>
      )}

      {/* Importar archivo */}
      <div className="border-t border-neutral-200 pt-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Importar:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded text-sm"
          >
            <FiUpload className="w-4 h-4 inline mr-1" />
            Seleccionar Archivo
          </button>
          
          {importError && (
            <div className="text-sm text-red-600">
              <FiAlertCircle className="w-4 h-4 inline mr-1" />
              {importError}
            </div>
          )}
        </div>
      </div>

      {/* Guardar */}
      <div className="border-t border-neutral-200 pt-4 flex justify-end">
        <button
          onClick={saveConfiguration}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium"
        >
          <FiCheck className="w-4 h-4 inline mr-2" />
          Guardar Configuración
        </button>
      </div>
    </div>
  )
}
