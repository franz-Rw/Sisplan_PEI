import { useState, useEffect } from 'react'
import { FormField } from '@services/indicatorVariablesService'

interface SimpleCascadeRendererProps {
  field: FormField
  value?: Record<string, string>
  onChange?: (values: Record<string, string>) => void
  disabled?: boolean
  className?: string
}

export default function SimpleCascadeRenderer({ 
  field, 
  value = {}, 
  onChange, 
  disabled = false, 
  className = '' 
}: SimpleCascadeRendererProps) {
  const [availableOptions, setAvailableOptions] = useState<Record<number, Array<{value: string, label: string}>>>({})
  const [autocompleteValue, setAutocompleteValue] = useState<string>('')

  const isAutocomplete = field.type === 'cascade_with_autocomplete'
  
  const config = isAutocomplete 
    ? (field.autocompleteConfig as any)
    : (field.cascadeConfig as any)

  if (!config || !config.data || config.levels.length === 0) {
    return <div className="text-red-500 text-sm">Configuración de cascada no válida</div>
  }

  // Obtener opciones para un nivel específico basado en la selección anterior
  const getOptionsForLevel = (level: number, parentValue?: string): Array<{value: string, label: string}> => {
    if (level === 1) {
      // Primer nivel: obtener todas las opciones raíz
      return Object.keys(config.data).map(key => ({
        value: key,
        label: config.data[key].label
      }))
    }

    if (!parentValue) return []

    // Niveles siguientes: navegar por la estructura anidada
    let currentData: any = config.data
    const previousLevels = config.levels.slice(0, level - 1)
    
    // Navegar hasta el nivel anterior
    for (let i = 0; i < previousLevels.length; i++) {
      const previousValue = value[previousLevels[i].fieldName]
      if (!previousValue || !currentData[previousValue]) return []
      
      currentData = currentData[previousValue].children || {}
    }

    return Object.keys(currentData).map(key => ({
      value: key,
      label: currentData[key].label
    }))
  }

  // Manejar cambio en un nivel
  const handleLevelChange = (level: any, selectedValue: string) => {
    const newValues = { ...value, [level.fieldName]: selectedValue }
    
    // Limpiar valores de niveles inferiores
    config.levels.forEach((l: any) => {
      if (l.level > level.level) {
        delete (newValues as any)[l.fieldName]
      }
    })

    // Limpiar autocompletado si aplica
    if (isAutocomplete) {
      delete (newValues as any).autocomplete_value
      setAutocompleteValue('')
    }

    // Calcular opciones para el siguiente nivel
    const nextLevelOptions = getOptionsForLevel(level.level + 1, selectedValue)
    const newAvailableOptions = { ...availableOptions }
    newAvailableOptions[level.level + 1] = nextLevelOptions
    
    // Limpiar opciones de niveles inferiores
    for (let i = level.level + 2; i <= config.levels.length; i++) {
      delete newAvailableOptions[i]
    }
    
    setAvailableOptions(newAvailableOptions)
    onChange?.(newValues)

    // Si es el último nivel y tiene autocompletado, buscar el valor
    if (isAutocomplete && level.level === config.levels.length && selectedValue) {
      const autocompleteMap = config.autocompleteMap || {}
      const foundValue = autocompleteMap[selectedValue] || ''
      setAutocompleteValue(foundValue)
      
      // Agregar valor de autocompletado a los valores del formulario
      setTimeout(() => {
        onChange?.({ ...newValues, autocomplete_value: foundValue } as any)
      }, 0)
    }
  }

  // Inicializar opciones del primer nivel
  useEffect(() => {
    if (config.levels.length > 0) {
      const firstLevelOptions = getOptionsForLevel(1)
      setAvailableOptions({ 1: firstLevelOptions })
    }
  }, [config])

  // Validar campos requeridos
  const validateField = (level: any) => {
    if (level.required && !value[level.fieldName]) {
      return level.validationMessage || 'Este campo es obligatorio'
    }
    return ''
  }

  const layoutClass = config.layout === 'horizontal' 
    ? 'flex gap-3 items-end' 
    : 'space-y-3'

  return (
    <div className={`simple-cascade ${layoutClass} ${className}`}>
      {/* Etiqueta del grupo */}
      {config.groupLabel && (
        <div className={`w-full ${config.layout === 'horizontal' ? 'mb-3' : 'mb-2'}`}>
          <label className="text-sm font-medium text-neutral-700">
            {config.groupLabel}
            {config.levels.some((l: any) => l.required) && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        </div>
      )}

      {config.levels.map((level: any) => {
        const currentValue = value[level.fieldName] || ''
        const levelOptions = availableOptions[level.level] || []
        const hasError = validateField(level)

        // Determinar si este nivel debe estar habilitado
        const isEnabled = level.level === 1 || 
          (level.level > 1 && value[config.levels[level.level - 2].fieldName])

        return (
          <div 
            key={level.level} 
            className={`${config.layout === 'horizontal' ? 'flex-1' : ''}`}
          >
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {level.label}
              {level.required && <span className="text-red-500 ml-1">*</span>}
              {isAutocomplete && level.level === config.levels.length && (
                <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  + Autocompletar
                </span>
              )}
            </label>
            
            {/* Lista desplegable */}
            <select
              value={currentValue}
              onChange={(e) => handleLevelChange(level, e.target.value)}
              disabled={!isEnabled || disabled}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                hasError 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-neutral-300 bg-white'
              } ${!isEnabled ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Seleccionar...</option>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Campo de autocompletado (solo para el último nivel) */}
            {isAutocomplete && level.level === config.levels.length && (
              <div className="mt-2">
                <label className="block text-xs text-neutral-600 mb-1">
                  Información Adicional
                </label>
                <input
                  type="text"
                  value={autocompleteValue}
                  readOnly
                  placeholder="Se autocompletará según selección..."
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-neutral-50 ${
                    autocompleteValue 
                      ? 'border-primary-300 bg-primary-50 text-primary-700' 
                      : 'border-neutral-200'
                  }`}
                />
                {autocompleteValue && (
                  <div className="mt-1 text-xs text-primary-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    Autocompletado automáticamente
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

            {/* Indicador visual de estado */}
            {!isEnabled && !disabled && (
              <div className="mt-1 text-xs text-neutral-400">
                Seleccione una opción en el nivel anterior
              </div>
            )}

            {/* Indicador para autocompletado */}
            {isAutocomplete && level.level === config.levels.length && !currentValue && !disabled && (
              <div className="mt-1 text-xs text-neutral-400">
                Seleccione una opción para ver información adicional
              </div>
            )}
          </div>
        )
      })}

      {/* Información adicional */}
      <div className={`w-full text-xs text-neutral-500 ${config.layout === 'horizontal' ? 'mt-3' : 'mt-2'}`}>
        {config.levels.length > 1 && (
          <span>
            Seleccione en orden: {config.levels.map((l: any) => l.label).join(' > ')}
            {isAutocomplete && (
              <span className="ml-1 text-primary-600">
                (el último nivel incluye información adicional)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
