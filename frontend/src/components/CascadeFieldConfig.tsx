import { FiPlus, FiMinus, FiTrash2, FiDatabase, FiCode } from 'react-icons/fi'
import { FormField, CascadeConfig, CascadeLevel, CascadeOption } from '@services/indicatorVariablesService'

interface CascadeFieldConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function CascadeFieldConfig({ field, onUpdate }: CascadeFieldConfigProps) {
  const cascadeConfig = field.cascadeConfig || {
    groupLabel: '',
    levels: [],
    layout: 'vertical' as const
  }

  const updateCascadeConfig = (updates: Partial<CascadeConfig>) => {
    onUpdate(field.id, {
      cascadeConfig: {
        ...cascadeConfig,
        ...updates
      }
    })
  }

  const addLevel = () => {
    const newLevel: CascadeLevel = {
      level: cascadeConfig.levels.length + 1,
      fieldName: `nivel${cascadeConfig.levels.length + 1}_campo`,
      label: `Nivel ${cascadeConfig.levels.length + 1}`,
      required: true,
      dataSource: 'static',
      valueField: 'value',
      labelField: 'label',
      staticOptions: [
        { value: 'option1', label: 'Opción 1' },
        { value: 'option2', label: 'Opción 2' }
      ]
    }
    
    updateCascadeConfig({
      levels: [...cascadeConfig.levels, newLevel]
    })
  }

  const updateLevel = (levelIndex: number, updates: Partial<CascadeLevel>) => {
    const newLevels = [...cascadeConfig.levels]
    newLevels[levelIndex] = {
      ...newLevels[levelIndex],
      ...updates
    }
    updateCascadeConfig({ levels: newLevels })
  }

  const removeLevel = (levelIndex: number) => {
    const newLevels = cascadeConfig.levels.filter((_, index) => index !== levelIndex)
    updateCascadeConfig({ levels: newLevels })
  }

  const addStaticOption = (levelIndex: number) => {
    const level = cascadeConfig.levels[levelIndex]
    const currentOptions = level.staticOptions || []
    const newOption: CascadeOption = {
      key: `option${currentOptions.length + 1}`,
      value: `option${currentOptions.length + 1}`,
      label: `Opción ${currentOptions.length + 1}`
    }
    
    const newStaticOptions = [...currentOptions, newOption]
    updateLevel(levelIndex, { staticOptions: newStaticOptions })
  }

  const updateStaticOption = (levelIndex: number, optionIndex: number, updates: Partial<CascadeOption>) => {
    const level = cascadeConfig.levels[levelIndex]
    const currentOptions = level.staticOptions || []
    const newOptions = [...currentOptions]
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    }
    updateLevel(levelIndex, { staticOptions: newOptions })
  }

  const removeStaticOption = (levelIndex: number, optionIndex: number) => {
    const level = cascadeConfig.levels[levelIndex]
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
            value={cascadeConfig.groupLabel}
            onChange={(e) => updateCascadeConfig({ groupLabel: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
            placeholder="Ej: Ubicación Geográfica"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-neutral-700">Disposición de Niveles</label>
          <select
            value={cascadeConfig.layout}
            onChange={(e) => updateCascadeConfig({ layout: e.target.value as 'vertical' | 'horizontal' })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
          >
            <option value="vertical">Vertical (uno debajo del otro)</option>
            <option value="horizontal">Horizontal (uno al lado del otro)</option>
          </select>
        </div>
      </div>

      {/* Niveles de Cascada */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">Niveles de Cascada</label>
          <button
            type="button"
            onClick={addLevel}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            disabled={cascadeConfig.levels.length >= 4}
          >
            <FiPlus className="w-4 h-4" />
            Agregar Nivel
          </button>
        </div>

        {cascadeConfig.levels.length === 0 ? (
          <div className="text-center py-4 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-lg">
            No hay niveles configurados. Agrega niveles para comenzar.
          </div>
        ) : (
          <div className="space-y-4">
            {cascadeConfig.levels.map((level, levelIndex) => (
              <div key={level.level} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                {/* Header del Nivel */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">{level.level}</span>
                    </div>
                    <span className="font-medium text-neutral-900">Nivel {level.level}</span>
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
                </div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
