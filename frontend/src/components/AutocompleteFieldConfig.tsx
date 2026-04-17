import { FiPlus, FiMinus, FiTrash2, FiDatabase, FiCode, FiEdit3 } from 'react-icons/fi'
import { FormField, AutocompleteConfig, AutocompleteLevel } from '@services/indicatorVariablesService'

interface AutocompleteFieldConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function AutocompleteFieldConfig({ field, onUpdate }: AutocompleteFieldConfigProps) {
  const autocompleteConfig = field.autocompleteConfig || {
    groupLabel: '',
    levels: [],
    layout: 'vertical' as const
  }

  const updateAutocompleteConfig = (updates: Partial<AutocompleteConfig>) => {
    onUpdate(field.id, {
      autocompleteConfig: {
        ...autocompleteConfig,
        ...updates
      }
    })
  }

  const addLevel = () => {
    const newLevel: AutocompleteLevel = {
      level: autocompleteConfig.levels.length + 1,
      fieldName: `nivel${autocompleteConfig.levels.length + 1}_campo`,
      label: `Nivel ${autocompleteConfig.levels.length + 1}`,
      required: true,
      dataSource: 'static',
      valueField: 'value',
      labelField: 'label',
      hasAutocomplete: autocompleteConfig.levels.length > 0, // El último nivel siempre tiene autocompletado
      autocompleteField: `nivel${autocompleteConfig.levels.length + 1}_autocomplete`,
      autocompleteLabel: 'Valor Autocompletado',
      autocompletePlaceholder: 'Se autocompletará según selección...',
      staticOptions: [
        { value: 'option1', label: 'Opción 1' },
        { value: 'option2', label: 'Opción 2' }
      ]
    }
    
    updateAutocompleteConfig({
      levels: [...autocompleteConfig.levels, newLevel]
    })
  }

  const updateLevel = (levelIndex: number, updates: Partial<AutocompleteLevel>) => {
    const newLevels = [...autocompleteConfig.levels]
    newLevels[levelIndex] = {
      ...newLevels[levelIndex],
      ...updates
    }
    updateAutocompleteConfig({ levels: newLevels })
  }

  const removeLevel = (levelIndex: number) => {
    const newLevels = autocompleteConfig.levels.filter((_, index) => index !== levelIndex)
    updateAutocompleteConfig({ levels: newLevels })
  }

  const addStaticOption = (levelIndex: number) => {
    const level = autocompleteConfig.levels[levelIndex]
    const currentOptions = level.staticOptions || []
    const newOption = { value: `option${currentOptions.length + 1}`, label: `Opción ${currentOptions.length + 1}` }
    
    const newStaticOptions = [...currentOptions, newOption]
    updateLevel(levelIndex, { staticOptions: newStaticOptions })
  }

  const updateStaticOption = (levelIndex: number, optionIndex: number, updates: { value?: string; label?: string }) => {
    const level = autocompleteConfig.levels[levelIndex]
    const currentOptions = level.staticOptions || []
    const newOptions = [...currentOptions]
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    }
    updateLevel(levelIndex, { staticOptions: newOptions })
  }

  const removeStaticOption = (levelIndex: number, optionIndex: number) => {
    const level = autocompleteConfig.levels[levelIndex]
    const currentOptions = level.staticOptions || []
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex)
    updateLevel(levelIndex, { staticOptions: newOptions })
  }

  return (
    <div className="space-y-4 mt-4 border-t border-neutral-200 pt-4">
      {/* Configuración General */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-neutral-700">Etiqueta del Grupo</label>
          <input
            type="text"
            value={autocompleteConfig.groupLabel}
            onChange={(e) => updateAutocompleteConfig({ groupLabel: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
            placeholder="Ej: Ubicación con Datos Adicionales"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-neutral-700">Disposición de Niveles</label>
          <select
            value={autocompleteConfig.layout}
            onChange={(e) => updateAutocompleteConfig({ layout: e.target.value as 'vertical' | 'horizontal' })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
          >
            <option value="vertical">Vertical (uno debajo del otro)</option>
            <option value="horizontal">Horizontal (uno al lado del otro)</option>
          </select>
        </div>
      </div>

      {/* Niveles de Autocompletado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">Niveles con Autocompletado</label>
          <button
            type="button"
            onClick={addLevel}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            disabled={autocompleteConfig.levels.length >= 4}
          >
            <FiPlus className="w-4 h-4" />
            Agregar Nivel
          </button>
        </div>

        {autocompleteConfig.levels.length === 0 ? (
          <div className="text-center py-4 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-lg">
            No hay niveles configurados. Agrega niveles para comenzar.
          </div>
        ) : (
          <div className="space-y-4">
            {autocompleteConfig.levels.map((level, levelIndex) => (
              <div key={level.level} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                {/* Header del Nivel */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">{level.level}</span>
                    </div>
                    <span className="font-medium text-neutral-900">Nivel {level.level}</span>
                    {level.hasAutocomplete && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        + Autocompletar
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLevel(levelIndex)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Configuración del Nivel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Etiqueta del Nivel</label>
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => updateLevel(levelIndex, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                      placeholder="Ej: Departamento"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Nombre del Campo (BD)</label>
                    <input
                      type="text"
                      value={level.fieldName}
                      onChange={(e) => updateLevel(levelIndex, { fieldName: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                      placeholder="Ej: departamento_id"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Origen de Datos</label>
                    <select
                      value={level.dataSource}
                      onChange={(e) => updateLevel(levelIndex, { dataSource: e.target.value as 'database' | 'static' })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                    >
                      <option value="static">JSON Estático</option>
                      <option value="database">Tabla SQL</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${level.level}`}
                      checked={level.required}
                      onChange={(e) => updateLevel(levelIndex, { required: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                    />
                    <label htmlFor={`required-${level.level}`} className="ml-2 text-sm text-neutral-700">
                      Campo obligatorio
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`autocomplete-${level.level}`}
                      checked={level.hasAutocomplete}
                      onChange={(e) => updateLevel(levelIndex, { hasAutocomplete: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                    />
                    <label htmlFor={`autocomplete-${level.level}`} className="ml-2 text-sm text-neutral-700">
                      Tiene autocompletado
                    </label>
                  </div>
                </div>

                {/* Configuración de autocompletado */}
                {level.hasAutocomplete && (
                  <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                      <FiEdit3 className="w-3 h-3" />
                      Configuración de Autocompletado
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Etiqueta del campo</label>
                        <input
                          type="text"
                          value={level.autocompleteLabel || ''}
                          onChange={(e) => updateLevel(levelIndex, { autocompleteLabel: e.target.value })}
                          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm"
                          placeholder="Ej: Datos adicionales"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Nombre del campo (BD)</label>
                        <input
                          type="text"
                          value={level.autocompleteField || ''}
                          onChange={(e) => updateLevel(levelIndex, { autocompleteField: e.target.value })}
                          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm"
                          placeholder="Ej: datos_adicionales"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-neutral-500 mb-1">Placeholder del autocompletado</label>
                      <input
                        type="text"
                        value={level.autocompletePlaceholder || ''}
                        onChange={(e) => updateLevel(levelIndex, { autocompletePlaceholder: e.target.value })}
                        className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm"
                        placeholder="Ej: Se autocompletará automáticamente..."
                      />
                    </div>
                  </div>
                )}

                {/* Configuración según origen de datos */}
                {level.dataSource === 'database' ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-neutral-700 flex items-center gap-1">
                      <FiDatabase className="w-3 h-3" />
                      Configuración de Base de Datos
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={level.databaseTable || ''}
                        onChange={(e) => updateLevel(levelIndex, { databaseTable: e.target.value })}
                        className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
                        placeholder="Tabla SQL"
                      />
                      <input
                        type="text"
                        value={level.parentField || ''}
                        onChange={(e) => updateLevel(levelIndex, { parentField: e.target.value })}
                        className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
                        placeholder="Campo Padre"
                      />
                      <input
                        type="text"
                        value={level.valueField}
                        onChange={(e) => updateLevel(levelIndex, { valueField: e.target.value })}
                        className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
                        placeholder="Campo Valor"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-neutral-700 flex items-center gap-1">
                      <FiCode className="w-3 h-3" />
                      Opciones Estáticas
                    </div>
                    <div className="space-y-2">
                      {(level.staticOptions || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 w-4">{optionIndex + 1}.</span>
                          <input
                            type="text"
                            value={option.value}
                            onChange={(e) => updateStaticOption(levelIndex, optionIndex, { value: e.target.value })}
                            className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                            placeholder="Valor"
                          />
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) => updateStaticOption(levelIndex, optionIndex, { label: e.target.value })}
                            className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                            placeholder="Etiqueta"
                          />
                          <button
                            type="button"
                            onClick={() => removeStaticOption(levelIndex, optionIndex)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <FiMinus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addStaticOption(levelIndex)}
                        className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1"
                      >
                        <FiPlus className="w-3 h-3" />
                        Agregar Opción
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje de Validación */}
                <div className="mt-3">
                  <label className="block text-xs text-neutral-500 mb-1">Mensaje de Validación</label>
                  <input
                    type="text"
                    value={level.validationMessage || ''}
                    onChange={(e) => updateLevel(levelIndex, { validationMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                    placeholder="Ej: Por favor seleccione una opción"
                  />
                </div>

                {/* Sección de valores de autocompletado */}
                {level.hasAutocomplete && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-xs font-medium text-amber-700 mb-2">
                      💡 Valores de Autocompletado
                    </div>
                    <div className="text-xs text-amber-600">
                      Para cada opción de la lista, puedes configurar valores específicos que se autocompletarán cuando el operador seleccione esa opción.
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded hover:bg-amber-200 transition-colors"
                    >
                      Configurar valores de autocompletado
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
