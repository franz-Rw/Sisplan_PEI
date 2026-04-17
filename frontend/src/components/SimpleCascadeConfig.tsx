import { FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi'
import { FormField, CascadeData, AutocompleteMap } from '@services/indicatorVariablesService'

interface SimpleCascadeConfigProps {
  field: FormField
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
}

export default function SimpleCascadeConfig({ field, onUpdate }: SimpleCascadeConfigProps) {
  const isAutocomplete = field.type === 'cascade_with_autocomplete'
  
  const config = isAutocomplete 
    ? (field.autocompleteConfig || {
        groupLabel: '',
        levels: [],
        layout: 'vertical' as const,
        data: {},
        autocompleteMap: {}
      })
    : (field.cascadeConfig || {
        groupLabel: '',
        levels: [],
        layout: 'vertical' as const,
        data: {}
      }) as any

  const updateConfig = (updates: any) => {
    if (isAutocomplete) {
      onUpdate(field.id, {
        autocompleteConfig: {
          ...config,
          ...updates
        }
      })
    } else {
      onUpdate(field.id, {
        cascadeConfig: {
          ...config,
          ...updates
        }
      })
    }
  }

  const addLevel = () => {
    const newLevel = {
      level: config.levels.length + 1,
      fieldName: `nivel${config.levels.length + 1}`,
      label: `Nivel ${config.levels.length + 1}`,
      required: true
    }
    
    updateConfig({
      levels: [...config.levels, newLevel]
    })
  }

  const updateLevel = (levelIndex: number, updates: any) => {
    const newLevels = [...config.levels]
    newLevels[levelIndex] = {
      ...newLevels[levelIndex],
      ...updates
    }
    updateConfig({ levels: newLevels })
  }

  const removeLevel = (levelIndex: number) => {
    const newLevels = config.levels.filter((_ : any, index: number) => index !== levelIndex)
    updateConfig({ levels: newLevels })
  }

  // Ejemplo de datos para demostración
  const loadExampleData = () => {
    const exampleData: CascadeData = {
      'toyota': {
        label: 'Toyota',
        children: {
          'corolla': {
            label: 'Corolla',
            children: {
              'le': { label: 'LE' },
              'se': { label: 'SE' },
              'xse': { label: 'XSE' }
            }
          },
          'hilux': {
            label: 'Hilux',
            children: {
              'sr': { label: 'SR' },
              'sr5': { label: 'SR5' }
            }
          }
        }
      },
      'honda': {
        label: 'Honda',
        children: {
          'civic': {
            label: 'Civic',
            children: {
              'lx': { label: 'LX' },
              'ex': { label: 'EX' }
            }
          },
          'crv': {
            label: 'CR-V',
            children: {
              'lx': { label: 'LX' },
              'ex': { label: 'EX' },
              'touring': { label: 'Touring' }
            }
          }
        }
      },
      'ford': {
        label: 'Ford',
        children: {
          'focus': {
            label: 'Focus',
            children: {
              'se': { label: 'SE' },
              'titanium': { label: 'Titanium' }
            }
          },
          'mustang': {
            label: 'Mustang',
            children: {
              'ecoboost': { label: 'EcoBoost' },
              'gt': { label: 'GT' }
            }
          }
        }
      }
    }

    const exampleAutocompleteMap: AutocompleteMap = {
      'le': 'Motor 1.8L, consumo 32mpg',
      'se': 'Motor 2.0L, consumo 30mpg',
      'xse': 'Motor 2.0L híbrido, consumo 50mpg',
      'sr': 'Diésel 2.4L',
      'sr5': 'Diésel 2.8L 4x4',
      'lx': 'Motor 2.0L, consumo 28mpg',
      'ex': 'Motor 1.5L Turbo, consumo 35mpg',
      'touring': 'Motor 1.5L Turbo AWD, consumo 30mpg',
      'titanium': 'Motor 2.0L EcoBoost, consumo 31mpg',
      'ecoboost': 'Motor 2.3L EcoBoost, consumo 21mpg',
      'gt': 'Motor 5.0L V8, consumo 15mpg'
    }

    if (isAutocomplete) {
      updateConfig({
        data: exampleData,
        autocompleteMap: exampleAutocompleteMap
      })
    } else {
      updateConfig({
        data: exampleData
      })
    }
  }

  const updateDataStructure = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      updateConfig({ data })
    } catch (error) {
      alert('JSON inválido. Por favor revise el formato.')
    }
  }

  const updateAutocompleteMap = (mapString: string) => {
    try {
      const map = JSON.parse(mapString)
      updateConfig({ autocompleteMap: map })
    } catch (error) {
      alert('JSON inválido. Por favor revise el formato.')
    }
  }

  return (
    <div className="space-y-4 mt-4 border-t border-neutral-200 pt-4">
      {/* Configuración General */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Etiqueta del Grupo
          </label>
          <input
            type="text"
            value={config.groupLabel}
            onChange={(e) => updateConfig({ groupLabel: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
            placeholder={isAutocomplete ? "Ej: Selección de Vehículos" : "Ej: Ubicación Geográfica"}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Disposición
          </label>
          <select
            value={config.layout}
            onChange={(e) => updateConfig({ layout: e.target.value as 'vertical' | 'horizontal' })}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
      </div>

      {/* Niveles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">
            Niveles de la Cascada
          </label>
          <button
            type="button"
            onClick={addLevel}
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            disabled={config.levels.length >= 4}
          >
            <FiPlus className="w-4 h-4" />
            Agregar Nivel
          </button>
        </div>

        {config.levels.length === 0 ? (
          <div className="text-center py-4 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-lg">
            No hay niveles configurados
          </div>
        ) : (
          <div className="space-y-3">
            {config.levels.map((level: any, index: number) => (
              <div key={level.level} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">{level.level}</span>
                    </div>
                    <span className="font-medium text-neutral-900 text-sm">{level.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLevel(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Etiqueta</label>
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => updateLevel(index, { label: e.target.value })}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                      placeholder="Ej: Marca"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Campo BD</label>
                    <input
                      type="text"
                      value={level.fieldName}
                      onChange={(e) => updateLevel(index, { fieldName: e.target.value })}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                      placeholder="Ej: marca_id"
                    />
                  </div>
                </div>

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`required-${level.level}`}
                    checked={level.required}
                    onChange={(e) => updateLevel(index, { required: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded"
                  />
                  <label htmlFor={`required-${level.level}`} className="ml-2 text-sm text-neutral-700">
                    Obligatorio
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuración de Datos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">
            {isAutocomplete ? 'Datos de la Cascada' : 'Datos de la Cascada'}
          </label>
          <button
            type="button"
            onClick={loadExampleData}
            className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded hover:bg-primary-200"
          >
            Cargar Ejemplo
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-600">
            Formato JSON anidado. Ejemplo:
          </div>
          <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">
{`{`}
  "toyota": {`{`}
    "label": "Toyota",
    "children": {`{`}
      "corolla": {`{`}
        "label": "Corolla",
        "children": {`{`}
          "le": {`{`} "label": "LE" {`}`},
          "se": {`{`} "label": "SE" {`}`}
        {`}`}
      {`}`}
    {`}`}
  {`}`}
{`}`}
          </pre>
          <textarea
            value={JSON.stringify(config.data, null, 2)}
            onChange={(e) => updateDataStructure(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-neutral-300 rounded-md text-sm font-mono text-xs"
            placeholder="Ingrese la estructura JSON de datos..."
          />
        </div>
      </div>

      {/* Configuración de Autocompletado (solo para tipo con autocompletado) */}
      {isAutocomplete && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
              <FiEdit3 className="w-3 h-3" />
              Mapeo de Autocompletado
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-neutral-600">
              Mapeo simple: valor_seleccionado {"->"} texto_autocompletado
            </div>
            <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">
{`{`}
  "le": "Motor 1.8L, consumo 32mpg",
  "se": "Motor 2.0L, consumo 30mpg",
  "xse": "Motor 2.0L híbrido, consumo 50mpg"
{`}`}
            </pre>
            <textarea
              value={JSON.stringify(config.autocompleteMap, null, 2)}
              onChange={(e) => updateAutocompleteMap(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-neutral-300 rounded-md text-sm font-mono text-xs"
              placeholder="Ingrese el mapeo de autocompletado..."
            />
          </div>
        </div>
      )}

      {/* Vista Previa */}
      {config.levels.length > 0 && Object.keys(config.data).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral-700">Vista Previa</div>
          <div className="text-xs text-neutral-600 bg-amber-50 border border-amber-200 rounded p-3">
            <div className="font-medium text-amber-700 mb-1">Ejemplo de funcionamiento:</div>
            {config.levels.map((level: any, index: number) => (
              <div key={level.level} className="ml-2">
                {index + 1}. {level.label}: 
                {index === 0 && " Toyota, Honda, Ford..."}
                {index === 1 && " (depende de selección anterior)"}
                {index === 2 && " (depende de modelo)"}
                {isAutocomplete && index === config.levels.length - 1 && " + autocompletado"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
