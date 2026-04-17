import { useState, useEffect } from 'react'
import { FormField, AutocompleteConfig, AutocompleteLevel } from '@services/indicatorVariablesService'
import apiClient from '@services/api'

interface AutocompleteFieldRendererProps {
  field: FormField
  value?: Record<string, string>
  onChange?: (values: Record<string, string>) => void
  disabled?: boolean
  className?: string
}

interface CascadeOption {
  key: string
  value: string
  label: string
  children?: CascadeOption[]
}

interface AutocompleteValue {
  id: string
  variableId: string
  fieldId: string
  level: number
  parentValue?: string
  triggerValue: string
  autocompleteValue: string
  label?: string
  createdAt: string
  updatedAt: string
}

export default function AutocompleteFieldRenderer({ 
  field, 
  value = {}, 
  onChange, 
  disabled = false, 
  className = '' 
}: AutocompleteFieldRendererProps) {
  const [options, setOptions] = useState<Record<string, CascadeOption[]>>({})
  const [autocompleteValues, setAutocompleteValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const autocompleteConfig = field.autocompleteConfig
  if (!autocompleteConfig || autocompleteConfig.levels.length === 0) {
    return <div className="text-red-500 text-sm">Configuración de autocompletado no válida</div>
  }

  // Cargar opciones para un nivel específico
  const loadOptions = async (level: AutocompleteLevel, parentValue?: string) => {
    if (disabled) return

    const levelKey = `level${level.level}`
    setLoading(prev => ({ ...prev, [levelKey]: true }))
    setErrors(prev => ({ ...prev, [levelKey]: '' }))

    try {
      if (level.dataSource === 'static') {
        // Para datos estáticos, simular carga asíncrona
        await new Promise(resolve => setTimeout(resolve, 100))
        const staticOptions = level.staticOptions || []
        const cascadeOptions: CascadeOption[] = staticOptions.map(opt => ({
          key: opt.value,
          value: opt.value,
          label: opt.label
        }))
        setOptions(prev => ({ 
          ...prev, 
          [levelKey]: cascadeOptions 
        }))
      } else if (level.dataSource === 'database') {
        // Para datos de base de datos
        const params = new URLSearchParams()
        if (level.databaseTable) params.append('table', level.databaseTable)
        if (level.valueField) params.append('valueField', level.valueField)
        if (level.labelField) params.append('labelField', level.labelField)
        if (parentValue && level.parentField) params.append('parentValue', parentValue)
        if (level.parentField) params.append('parentField', level.parentField)

        const response = await apiClient.get(`/cascade-options?${params}`)
        setOptions(prev => ({ 
          ...prev, 
          [levelKey]: response.data 
        }))
      }
    } catch (error) {
      console.error(`Error loading options for ${levelKey}:`, error)
      setErrors(prev => ({ 
        ...prev, 
        [levelKey]: 'Error al cargar opciones' 
      }))
    } finally {
      setLoading(prev => ({ ...prev, [levelKey]: false }))
    }
  }

  // Cargar valores de autocompletado para un nivel específico
  const loadAutocompleteValues = async (level: AutocompleteLevel, triggerValue: string) => {
    if (disabled || !triggerValue) return

    try {
      const response = await apiClient.get(`/indicator-variables/${field.id}/autocomplete-values`, {
        params: {
          level: level.level,
          triggerValue
        }
      })

      const values = response.data.reduce((acc: Record<string, string>, item: AutocompleteValue) => {
        if (item.triggerValue === triggerValue) {
          acc[item.fieldId] = item.autocompleteValue
        }
        return acc
      }, {})

      setAutocompleteValues(prev => ({ ...prev, ...values }))
    } catch (error) {
      console.error(`Error loading autocomplete values for level ${level.level}:`, error)
    }
  }

  // Manejar cambio en un nivel
  const handleLevelChange = (level: AutocompleteLevel, selectedValue: string) => {
    const newValues = { ...value, [level.fieldName]: selectedValue }
    
    // Limpiar valores de niveles inferiores
    autocompleteConfig.levels.forEach(l => {
      if (l.level > level.level) {
        delete newValues[l.fieldName]
        if (l.autocompleteField) {
          delete newValues[l.autocompleteField]
        }
        // Limpiar opciones de niveles inferiores
        const lowerLevelKey = `level${l.level}`
        setOptions(prev => ({ ...prev, [lowerLevelKey]: [] }))
        // Limpiar valores de autocompletado
        if (l.autocompleteField) {
          setAutocompleteValues(prev => ({ ...prev, [l.autocompleteField]: '' }))
        }
      }
    })

    onChange?.(newValues)

    // Cargar opciones del siguiente nivel
    const nextLevel = autocompleteConfig.levels.find(l => l.level === level.level + 1)
    if (nextLevel && selectedValue) {
      loadOptions(nextLevel, selectedValue)
    }

    // Cargar valores de autocompletado para este nivel si tiene autocompletado
    if (level.hasAutocomplete && selectedValue) {
      loadAutocompleteValues(level, selectedValue)
    }
  }

  // Manejar cambio en campo de autocompletado
  const handleAutocompleteChange = (level: AutocompleteLevel, autocompleteValue: string) => {
    const newValues = { ...value, [level.autocompleteField]: autocompleteValue }
    onChange?.(newValues)
  }

  // Cargar opciones del primer nivel al montar
  useEffect(() => {
    const firstLevel = autocompleteConfig.levels[0]
    if (firstLevel) {
      loadOptions(firstLevel)
    }
  }, [autocompleteConfig])

  // Validar campos requeridos
  const validateField = (level: AutocompleteLevel) => {
    if (level.required && !value[level.fieldName]) {
      return level.validationMessage || 'Este campo es obligatorio'
    }
    return ''
  }

  const validateAutocompleteField = (level: AutocompleteLevel) => {
    if (level.hasAutocomplete && level.required && !value[level.autocompleteField]) {
      return `El campo de autocompletado es obligatorio`
    }
    return ''
  }

  const layoutClass = autocompleteConfig.layout === 'horizontal' 
    ? 'flex gap-3 items-end' 
    : 'space-y-3'

  return (
    <div className={`autocomplete-field ${layoutClass} ${className}`}>
      {/* Etiqueta del grupo */}
      {autocompleteConfig.groupLabel && (
        <div className={`w-full ${autocompleteConfig.layout === 'horizontal' ? 'mb-3' : 'mb-2'}`}>
          <label className="text-sm font-medium text-neutral-700">
            {autocompleteConfig.groupLabel}
            {autocompleteConfig.levels.some(l => l.required) && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        </div>
      )}

      {autocompleteConfig.levels.map((level) => {
        const levelKey = `level${level.level}`
        const currentValue = value[level.fieldName] || ''
        const autocompleteCurrentValue = level.hasAutocomplete ? (value[level.autocompleteField] || '') : ''
        const levelOptions = options[levelKey] || []
        const autocompleteValue = level.hasAutocomplete ? (autocompleteValues[level.autocompleteField] || '') : ''
        const isLoading = loading[levelKey]
        const hasError = errors[levelKey] || validateField(level)
        const hasAutocompleteError = level.hasAutocomplete ? validateAutocompleteField(level) : ''
        const isDisabled = disabled || isLoading

        // Determinar si este nivel debe estar habilitado
        const isEnabled = level.level === 1 || 
          (level.level > 1 && value[autocompleteConfig.levels[level.level - 2].fieldName])

        return (
          <div 
            key={level.level} 
            className={`${autocompleteConfig.layout === 'horizontal' ? 'flex-1' : ''}`}
          >
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {level.label}
              {level.required && <span className="text-red-500 ml-1">*</span>}
              {level.hasAutocomplete && (
                <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  + Autocompletar
                </span>
              )}
            </label>
            
            {/* Lista desplegable */}
            <select
              value={currentValue}
              onChange={(e) => handleLevelChange(level, e.target.value)}
              disabled={!isEnabled || isDisabled}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                hasError 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-neutral-300 bg-white'
              } ${!isEnabled ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {isLoading ? 'Cargando...' : 'Seleccionar...'}
              </option>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Campo de autocompletado */}
            {level.hasAutocomplete && (
              <div className="mt-2">
                <label className="block text-xs text-neutral-600 mb-1">
                  {level.autocompleteLabel || 'Valor Autocompletado'}
                </label>
                <input
                  type="text"
                  value={autocompleteCurrentValue}
                  onChange={(e) => handleAutocompleteChange(level, e.target.value)}
                  disabled={!currentValue || isDisabled}
                  placeholder={level.autocompletePlaceholder || 'Se autocompletará según selección...'}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    hasAutocompleteError 
                      ? 'border-red-300 bg-red-50' 
                      : autocompleteValue 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-neutral-300 bg-white'
                  } ${!currentValue ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
                />
                {autocompleteValue && (
                  <div className="mt-1 text-xs text-primary-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    Valor autocompletado: {autocompleteValue}
                  </div>
                )}
              </div>
            )}

            {/* Mensajes de error o ayuda */}
            {hasError && (
              <div className="mt-1 text-xs text-red-600">
                {hasError}
              </div>
            )}
            
            {hasAutocompleteError && (
              <div className="mt-1 text-xs text-red-600">
                {hasAutocompleteError}
              </div>
            )}
            
            {isLoading && (
              <div className="mt-1 text-xs text-neutral-500">
                Cargando opciones...
              </div>
            )}

            {/* Indicador visual de estado */}
            {!isEnabled && !disabled && (
              <div className="mt-1 text-xs text-neutral-400">
                Seleccione una opción en el nivel anterior
              </div>
            )}

            {/* Indicador visual para autocompletado */}
            {level.hasAutocomplete && !currentValue && !disabled && (
              <div className="mt-1 text-xs text-neutral-400">
                Seleccione una opción para activar el autocompletado
              </div>
            )}
          </div>
        )
      })}

      {/* Información adicional */}
      <div className={`w-full text-xs text-neutral-500 ${autocompleteConfig.layout === 'horizontal' ? 'mt-3' : 'mt-2'}`}>
        {autocompleteConfig.levels.length > 1 && (
          <span>
            Seleccione en orden: {autocompleteConfig.levels.map(l => l.label).join(' > ')}
            {autocompleteConfig.levels.some(l => l.hasAutocomplete) && (
              <span className="ml-1 text-primary-600">
                (algunos niveles incluyen autocompletado)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
