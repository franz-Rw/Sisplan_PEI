import { useState, useRef } from 'react'
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi'
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

interface RobustCascadeConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function RobustCascadeConfig({ field, onUpdate }: RobustCascadeConfigProps) {
  const [levels, setLevels] = useState<CascadeLevel[]>([])
  const [cascadeData, setCascadeData] = useState<Record<string, CascadeOption>>({})
  const [autocompleteMap, setAutocompleteMap] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importError, setImportError] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAutocomplete = field.type === 'cascade_with_autocomplete'

  // Inicializar solo una vez
  useState(() => {
    const config = isAutocomplete ? field.autocompleteConfig : field.cascadeConfig
    if (config && field.id) {
      const cfg = config as any
      setLevels(cfg.levels || [])
      setCascadeData(cfg.data || {})
      setAutocompleteMap(cfg.autocompleteMap || {})
      setIsInitialized(true)
    } else {
      setIsInitialized(true)
    }
  })

  // Validar estructura
  const validateStructure = (): boolean => {
    const errors: string[] = []
    
    if (levels.length === 0) {
      errors.push('Debe agregar al menos un nivel')
    }
    
    const fieldNames = levels.map(l => l.fieldName)
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      errors.push(`Nombres de campo duplicados: ${duplicates.join(', ')}`)
    }
    
    if (levels.length > 0 && Object.keys(cascadeData).length === 0) {
      errors.push('El primer nivel debe tener opciones configuradas')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Agregar nivel - versión ultra segura
  const addLevel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Prevenir submit del formulario
    e.stopPropagation() // Detener propagación
    
    try {
      const newLevel: CascadeLevel = {
        id: `level_${Date.now()}_${Math.random()}`,
        level: levels.length + 1,
        label: `Nivel ${levels.length + 1}`,
        fieldName: `nivel_${levels.length + 1}`,
        required: true
      }
      
      setLevels(prev => [...prev, newLevel])
      setValidationErrors([])
    } catch (error) {
      console.error('Error en addLevel:', error)
      setValidationErrors([`Error al agregar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Actualizar nivel
  const updateLevel = (levelId: string, updates: Partial<CascadeLevel>) => {
    try {
      setLevels(prev => prev.map(l => l.id === levelId ? { ...l, ...updates } : l))
      setValidationErrors([])
    } catch (error) {
      console.error('Error en updateLevel:', error)
      setValidationErrors([`Error al actualizar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Eliminar nivel
  const removeLevel = (levelId: string) => {
    try {
      const levelToRemove = levels.find(l => l.id === levelId)
      if (!levelToRemove || levelToRemove.level === 1) return
      
      setLevels(prev => prev.filter(l => l.id !== levelId))
      
      if (levelToRemove.level === 1) {
        setCascadeData({})
        setAutocompleteMap({})
      }
      
      setValidationErrors([])
    } catch (error) {
      console.error('Error en removeLevel:', error)
      setValidationErrors([`Error al eliminar nivel: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Agregar opción
  const addOption = (parentKey: string, optionKey: string, optionLabel: string) => {
    try {
      if (!parentKey) {
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
      
      setValidationErrors([])
    } catch (error) {
      console.error('Error en addOption:', error)
      setValidationErrors([`Error al agregar opción: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Eliminar opción
  const removeOption = (keyToRemove: string) => {
    try {
      const removeFromData = (data: Record<string, CascadeOption>): Record<string, CascadeOption> => {
        const result: Record<string, CascadeOption> = {}
        
        Object.keys(data).forEach(key => {
          const option = data[key]
          if (option.key === keyToRemove) {
            return // No incluir esta opción
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
      
      if (autocompleteMap[keyToRemove]) {
        setAutocompleteMap(prev => {
          const newMap = { ...prev }
          delete newMap[keyToRemove]
          return newMap
        })
      }
      
      setValidationErrors([])
    } catch (error) {
      console.error('Error en removeOption:', error)
      setValidationErrors([`Error al eliminar opción: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Actualizar autocompletado
  const updateAutocomplete = (key: string, value: string) => {
    try {
      setAutocompleteMap(prev => ({
        ...prev,
        [key]: value
      }))
      setValidationErrors([])
    } catch (error) {
      console.error('Error en updateAutocomplete:', error)
      setValidationErrors([`Error al actualizar autocompletado: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
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
          if (data.cascadeData) setCascadeData(data.cascadeData)
          if (data.autocompleteMap) setAutocompleteMap(data.autocompleteMap)
          
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
    } catch (error) {
      console.error('Error en exportData:', error)
      setValidationErrors(['Error al exportar datos'])
    }
  }

  // Limpiar todo
  const clearAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setLevels([])
      setCascadeData({})
      setAutocompleteMap({})
      setValidationErrors([])
      setImportError('')
    } catch (error) {
      console.error('Error en clearAll:', error)
      setValidationErrors(['Error al limpiar configuración'])
    }
  }

  // Cargar ejemplo
  const loadExample = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
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
                'se': { key: 'se', label: 'SE' }
              }
            }
          }
        }
      }
      
      setLevels(exampleLevels)
      setCascadeData(exampleData)
      if (isAutocomplete) {
        setAutocompleteMap({
          'le': 'Motor 1.8L',
          'se': 'Motor 2.0L'
        })
      }
      
      setValidationErrors([])
      setImportError('')
    } catch (error) {
      console.error('Error en loadExample:', error)
      setValidationErrors(['Error al cargar ejemplo'])
    }
  }

  // Guardar configuración
  const saveConfiguration = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
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
    } catch (error) {
      console.error('Error en saveConfiguration:', error)
      setValidationErrors([`Error al guardar configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`])
    }
  }

  // Si no está inicializado, mostrar loading
  if (!isInitialized) {
    return (
      <div className="p-4 bg-white border border-neutral-200 rounded-lg">
        <div className="text-center py-8">
          <div className="text-neutral-500">Cargando configuración...</div>
        </div>
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
            type="button"
            onClick={loadExample}
            className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm hover:bg-amber-200"
          >
            <FiDownload className="w-4 h-4 inline mr-1" />
            Ejemplo
          </button>
          
          <button
            type="button"
            onClick={exportData}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
          >
            <FiUpload className="w-4 h-4 inline mr-1" />
            Exportar
          </button>
          
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
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
            type="button"
            onClick={addLevel}
            disabled={levels.length >= 5}
            className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
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
                      id={`required_${level.id}`}
                      checked={level.required}
                      onChange={(e) => updateLevel(level.id, { required: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                    />
                    <label htmlFor={`required_${level.id}`} className="text-sm">Obligatorio</label>
                    
                    {index > 0 && (
                      <button
                        onClick={() => removeLevel(level.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Eliminar nivel"
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

      {/* Configuración de datos - simplificada */}
      {levels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Datos de la Cascada</h4>
          </div>
          
          <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500">
            <p className="mb-4">Configuración simplificada para pruebas</p>
            <p className="text-sm text-neutral-600">
              Para agregar datos manualmente, use la opción "Cargar Ejemplo" o "Importar"
            </p>
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
            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded text-sm hover:bg-neutral-200"
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
