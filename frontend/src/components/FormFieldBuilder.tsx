import { FiPlus, FiMinus, FiTrash2, FiClock, FiMapPin, FiDollarSign, FiCalendar, FiType, FiAlignLeft, FiCheckSquare, FiChevronDown, FiMoreVertical, FiGitBranch } from 'react-icons/fi'
import { FormField } from '@services/indicatorVariablesService'
import ProperMultipleDependentListsConfig from './ProperMultipleDependentListsConfig'
import RobustCascadeConfig from './RobustCascadeConfig'

interface FormFieldBuilderProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onRemove: (fieldId: string) => void
}

const FIELD_TYPES = [
  { value: 'date', label: 'Fecha', icon: FiCalendar },
  { value: 'select', label: 'Lista desplegable', icon: FiChevronDown },
  { value: 'integer', label: 'Número entero', icon: FiType },
  { value: 'decimal', label: 'Número decimal', icon: FiType },
  { value: 'currency', label: 'Moneda (PEN)', icon: FiDollarSign },
  { value: 'text', label: 'Texto corto', icon: FiType },
  { value: 'textarea', label: 'Párrafo largo', icon: FiAlignLeft },
  { value: 'coordinates', label: 'Coordenadas', icon: FiMapPin },
  { value: 'checkbox', label: 'Casilla de verificación', icon: FiCheckSquare },
  { value: 'time', label: 'Hora', icon: FiClock },
  { value: 'multiple_dependent_lists', label: 'Lista dependientes múltiples', icon: FiGitBranch },
  { value: 'cascade', label: 'Listas en cascada multinivel', icon: FiGitBranch },
  { value: 'cascade_with_autocomplete', label: 'Listas con autocompletado', icon: FiGitBranch }
]

export default function FormFieldBuilder({ field, onUpdate, onRemove }: FormFieldBuilderProps) {

  const addOption = () => {
    const currentOptions = field.options || []
    const newOption = `Opción ${currentOptions.length + 1}`
    onUpdate(field.id, { options: [...currentOptions, newOption] })
  }

  const updateOption = (optionIndex: number, value: string) => {
    const currentOptions = field.options || []
    const newOptions = [...currentOptions]
    newOptions[optionIndex] = value
    onUpdate(field.id, { options: newOptions })
  }

  const removeOption = (optionIndex: number) => {
    const currentOptions = field.options || []
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex)
    onUpdate(field.id, { options: newOptions })
  }

  const renderFieldPreview = () => {
    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
            disabled
          />
        )
      
      case 'select':
        return (
          <select className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50" disabled>
            <option value="">Selecciona una opción</option>
            {(field.options || []).slice(0, 3).map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
            {(field.options || []).length > 3 && (
              <option value="">... y {(field.options || []).length - 3} más</option>
            )}
          </select>
        )
      
      case 'integer':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
            placeholder="0"
            disabled
          />
        )
      
      case 'decimal':
        return (
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
            placeholder="0.00"
            disabled
          />
        )
      
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 font-medium">
              S/
            </span>
            <input
              type="text"
              className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
              placeholder="0.00"
              disabled
            />
          </div>
        )
      
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
            placeholder="Texto corto"
            disabled
          />
        )
      
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 resize-none"
            rows={4}
            placeholder="Párrafo largo"
            disabled
          />
        )
      
      case 'coordinates':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Latitud</label>
              <input
                type="number"
                step="0.000001"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                placeholder="-12.046373"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Longitud</label>
              <input
                type="number"
                step="0.000001"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                placeholder="-77.042755"
                disabled
              />
            </div>
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.options || []).slice(0, 3).map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                  disabled
                />
                <span className="text-sm text-neutral-700">{option}</span>
              </label>
            ))}
            {(field.options || []).length > 3 && (
              <span className="text-xs text-neutral-500">... y {(field.options || []).length - 3} más</span>
            )}
          </div>
        )
      
      case 'time':
        return (
          <div className="flex items-center gap-2">
            <input
              type="time"
              className="px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
              disabled
            />
            <select className="px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50" disabled>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        )
      
      case 'cascade':
        const levels = field.cascadeConfig?.levels || []
        return (
          <div className={`space-y-3 ${field.cascadeConfig?.layout === 'horizontal' ? 'flex gap-3' : ''}`}>
            {levels.slice(0, 3).map((level: any) => (
              <div key={level.level} className={field.cascadeConfig?.layout === 'horizontal' ? 'flex-1' : ''}>
                <label className="block text-xs text-neutral-500 mb-1">{level.label}</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-sm"
                  disabled
                >
                  <option value="">Seleccionar...</option>
                  <option value="">Opción 1</option>
                  <option value="">Opción 2</option>
                </select>
              </div>
            ))}
            {levels.length > 3 && (
              <div className={`text-xs text-neutral-500 ${field.cascadeConfig?.layout === 'horizontal' ? 'flex items-end' : ''}`}>
                ... y {levels.length - 3} niveles más
              </div>
            )}
          </div>
        )
      
      case 'cascade_with_autocomplete':
        const autocompleteLevels = field.autocompleteConfig?.levels || []
        return (
          <div className={`space-y-3 ${field.autocompleteConfig?.layout === 'horizontal' ? 'flex gap-3' : ''}`}>
            {autocompleteLevels.slice(0, 2).map((level: any) => (
              <div key={level.level} className={field.autocompleteConfig?.layout === 'horizontal' ? 'flex-1' : ''}>
                <label className="block text-xs text-neutral-500 mb-1">
                  {level.label}
                  {level.level === autocompleteLevels.length && (
                    <span className="ml-1 text-primary-600 text-xs">+ Autocompletar</span>
                  )}
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-sm"
                  disabled
                >
                  <option value="">Seleccionar...</option>
                  <option value="">Opción 1</option>
                  <option value="">Opción 2</option>
                </select>
                {level.level === autocompleteLevels.length && (
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-primary-300 rounded-md bg-primary-50 text-sm"
                    placeholder="Se autocompletará..."
                    disabled
                  />
                )}
              </div>
            ))}
            {autocompleteLevels.length > 2 && (
              <div className={`text-xs text-neutral-500 ${field.autocompleteConfig?.layout === 'horizontal' ? 'flex items-end' : ''}`}>
                ... y {autocompleteLevels.length - 2} niveles más
              </div>
            )}
          </div>
        )
      
      case 'multiple_dependent_lists':
        const dependentLevels = field.multipleDependentConfig?.levels || []
        return (
          <div className="space-y-3">
            {dependentLevels.length === 0 ? (
              <div className="text-center py-4 text-neutral-500 text-sm">
                Configure los niveles jerárquicos para ver la vista previa
              </div>
            ) : (
              <div className="space-y-2">
                {dependentLevels.slice(0, 4).map((level: any, index: number) => (
                  <div key={level.id}>
                    <label className="block text-xs text-neutral-500 mb-1">
                      {level.name}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-sm"
                      disabled
                    >
                      <option value="">Seleccionar {level.name}...</option>
                      <option value="">Opción ejemplo 1</option>
                      <option value="">Opción ejemplo 2</option>
                    </select>
                    {index > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Seleccione el nivel anterior primero
                      </p>
                    )}
                  </div>
                ))}
                {dependentLevels.length > 4 && (
                  <div className="text-xs text-neutral-500 text-center py-2">
                    ... y {dependentLevels.length - 4} niveles más
                  </div>
                )}
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  const renderFieldOptions = () => {
    switch (field.type) {
      case 'select':
        return (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">Opciones de la lista</label>
              <button
                type="button"
                onClick={addOption}
                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" />
                Agregar opción
              </button>
            </div>
            <div className="space-y-2">
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 font-medium w-8">{index + 1}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">Opciones de casilla</label>
              <button
                type="button"
                onClick={addOption}
                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" />
                Agregar casilla
              </button>
            </div>
            <div className="space-y-2">
              {(field.options || []).slice(0, 3).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                    disabled
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(field.options || []).length > 3 && (
                <div className="text-xs text-neutral-500 text-center py-2">
                  ... y {(field.options || []).length - 3} más opciones
                </div>
              )}
            </div>
          </div>
        )
      
      case 'integer':
        return (
          <div className="space-y-3 mt-4">
            <label className="text-sm font-medium text-neutral-700">Validación de número entero</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Valor mínimo</label>
                <input
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => onUpdate(field.id, { 
                    validation: { 
                      ...field.validation, 
                      min: parseInt(e.target.value) || undefined 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  placeholder="Sin límite"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Valor máximo</label>
                <input
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => onUpdate(field.id, { 
                    validation: { 
                      ...field.validation, 
                      max: parseInt(e.target.value) || undefined 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>
        )
      
      case 'decimal':
        return (
          <div className="space-y-3 mt-4">
            <label className="text-sm font-medium text-neutral-700">Validación de número decimal</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Valor mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  value={field.validation?.min || ''}
                  onChange={(e) => onUpdate(field.id, { 
                    validation: { 
                      ...field.validation, 
                      min: parseFloat(e.target.value) || undefined 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  placeholder="Sin límite"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Valor máximo</label>
                <input
                  type="number"
                  step="0.01"
                  value={field.validation?.max || ''}
                  onChange={(e) => onUpdate(field.id, { 
                    validation: { 
                      ...field.validation, 
                      max: parseFloat(e.target.value) || undefined 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>
        )
      
      case 'multiple_dependent_lists':
        return <ProperMultipleDependentListsConfig field={field} onUpdate={onUpdate} />
      
      case 'cascade':
      case 'cascade_with_autocomplete':
        return (
          <RobustCascadeConfig
            field={field}
            onUpdate={onUpdate}
          />
        )
      
      default:
        return null
    }
  }

  const SelectedIcon = FIELD_TYPES.find(type => type.value === field.type)?.icon || FiType

  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="cursor-move">
          <FiMoreVertical className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <SelectedIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md font-medium placeholder-neutral-400 ${
                  field.type === 'multiple_dependent_lists' 
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed' 
                    : 'border-neutral-300 text-neutral-900'
                }`}
                placeholder="Título del campo"
                disabled={field.type === 'multiple_dependent_lists'}
              />
              {field.type === 'multiple_dependent_lists' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded border border-amber-200">
                    Automático por niveles jerárquicos
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onUpdate(field.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm text-neutral-600 placeholder-neutral-400 mt-2"
              placeholder="nombre_del_campo"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(field.id)}
          className="text-red-600 hover:text-red-700 p-2"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Field Type Selector */}
      <div className="mb-4">
        <select
          value={field.type}
          onChange={(e) => onUpdate(field.id, { type: e.target.value as FormField['type'] })}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
        >
          {FIELD_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Field Preview */}
      <div className="mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-xs text-neutral-500 mb-2">Vista previa:</div>
        {renderFieldPreview()}
      </div>

      {/* Field Options */}
      {renderFieldOptions()}

      {/* Required Toggle */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
        <label className="text-sm font-medium text-neutral-700">Campo obligatorio</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>
    </div>
  )
}
