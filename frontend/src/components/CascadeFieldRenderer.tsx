import { useState, useEffect } from 'react'
import { FormField, CascadeConfig, CascadeLevel } from '@services/indicatorVariablesService'
import apiClient from '@services/api'

interface CascadeFieldRendererProps {
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

export default function CascadeFieldRenderer({ 
  field, 
  value = {}, 
  onChange, 
  disabled = false, 
  className = '' 
}: CascadeFieldRendererProps) {
  const [options, setOptions] = useState<Record<string, CascadeOption[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cascadeConfig = field.cascadeConfig
  if (!cascadeConfig || cascadeConfig.levels.length === 0) {
    return <div className="text-red-500 text-sm">Configuración de cascada no válida</div>
  }

  // Cargar opciones para un nivel específico
  const loadOptions = async (level: CascadeLevel, parentValue?: string) => {
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

  // Manejar cambio en un nivel
  const handleLevelChange = (level: CascadeLevel, selectedValue: string) => {
    const newValues = { ...value, [level.fieldName]: selectedValue }
    
    // Limpiar valores de niveles inferiores
    cascadeConfig.levels.forEach(l => {
      if (l.level > level.level) {
        delete newValues[l.fieldName]
        // Limpiar opciones de niveles inferiores
        const lowerLevelKey = `level${l.level}`
        setOptions(prev => ({ ...prev, [lowerLevelKey]: [] }))
      }
    })

    onChange?.(newValues)

    // Cargar opciones del siguiente nivel
    const nextLevel = cascadeConfig.levels.find(l => l.level === level.level + 1)
    if (nextLevel && selectedValue) {
      loadOptions(nextLevel, selectedValue)
    }
  }

  // Cargar opciones del primer nivel al montar
  useEffect(() => {
    const firstLevel = cascadeConfig.levels[0]
    if (firstLevel) {
      loadOptions(firstLevel)
    }
  }, [cascadeConfig])

  // Validar campos requeridos
  const validateField = (level: CascadeLevel) => {
    if (level.required && !value[level.fieldName]) {
      return level.validationMessage || 'Este campo es obligatorio'
    }
    return ''
  }

  const layoutClass = cascadeConfig.layout === 'horizontal' 
    ? 'flex gap-3 items-end' 
    : 'space-y-3'

  return (
    <div className={`cascade-field ${layoutClass} ${className}`}>
      {/* Etiqueta del grupo */}
      {cascadeConfig.groupLabel && (
        <div className={`w-full ${cascadeConfig.layout === 'horizontal' ? 'mb-3' : 'mb-2'}`}>
          <label className="text-sm font-medium text-neutral-700">
            {cascadeConfig.groupLabel}
            {cascadeConfig.levels.some(l => l.required) && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        </div>
      )}

      {cascadeConfig.levels.map((level) => {
        const levelKey = `level${level.level}`
        const currentValue = value[level.fieldName] || ''
        const levelOptions = options[levelKey] || []
        const isLoading = loading[levelKey]
        const hasError = errors[levelKey] || validateField(level)
        const isDisabled = disabled || isLoading

        // Determinar si este nivel debe estar habilitado
        const isEnabled = level.level === 1 || 
          (level.level > 1 && value[cascadeConfig.levels[level.level - 2].fieldName])

        return (
          <div 
            key={level.level} 
            className={cascadeConfig.layout === 'horizontal' ? 'flex-1' : ''}
          >
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {level.label}
              {level.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
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

            {/* Mensajes de error o ayuda */}
            {hasError && (
              <div className="mt-1 text-xs text-red-600">
                {hasError}
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
          </div>
        )
      })}

      {/* Información adicional */}
      <div className={`w-full text-xs text-neutral-500 ${cascadeConfig.layout === 'horizontal' ? 'mt-3' : 'mt-2'}`}>
        {cascadeConfig.levels.length > 1 && (
          <span>
            Seleccione en orden: {cascadeConfig.levels.map(l => l.label).join(' > ')}
          </span>
        )}
      </div>
    </div>
  )
}
