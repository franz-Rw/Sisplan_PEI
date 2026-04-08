import { useState } from 'react'
import { FormField } from '@services/indicatorVariablesService'

interface DynamicFormProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void
  initialData?: Record<string, any>
}

export default function DynamicForm({ fields, onSubmit, initialData = {} }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={field.required}
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={field.required}
          >
            <option value="">Selecciona una opción</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            placeholder="0"
          />
        )
      
      case 'decimal':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            placeholder="0.00"
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
              value={value}
              onChange={(e) => {
                // Formatear como moneda
                const rawValue = e.target.value.replace(/[^\d.-]/g, '')
                const numericValue = parseFloat(rawValue) || 0
                const formattedValue = numericValue.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
                handleFieldChange(field.name, numericValue)
                e.target.value = formattedValue
              }}
              className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required={field.required}
              placeholder="0.00"
            />
          </div>
        )
      
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={field.required}
            placeholder={field.placeholder}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={4}
            required={field.required}
            placeholder={field.placeholder}
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
                value={value?.lat || ''}
                onChange={(e) => handleFieldChange(field.name, {
                  ...formData[field.name],
                  lat: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required={field.required}
                placeholder="-12.046373"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Longitud</label>
              <input
                type="number"
                step="0.000001"
                value={value?.lng || ''}
                onChange={(e) => handleFieldChange(field.name, {
                  ...formData[field.name],
                  lng: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required={field.required}
                placeholder="-77.042755"
              />
            </div>
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleFieldChange(field.name, [...currentValues, option])
                    } else {
                      handleFieldChange(field.name, currentValues.filter((v: string) => v !== option))
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">{option}</span>
              </label>
            ))}
          </div>
        )
      
      case 'time':
        return (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={value?.time || ''}
              onChange={(e) => {
                const timeValue = e.target.value
                const [hours, minutes] = timeValue.split(':')
                let hour24 = parseInt(hours)
                let period = 'AM'
                
                if (hour24 >= 12) {
                  period = 'PM'
                  if (hour24 > 12) hour24 -= 12
                } else if (hour24 === 0) {
                  hour24 = 12
                }
                
                handleFieldChange(field.name, {
                  time: timeValue,
                  hour24: `${hours}:${minutes}`,
                  hour12: `${hour24}:${minutes} ${period}`
                })
              }}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required={field.required}
            />
            <select
              value={value?.period || 'AM'}
              onChange={(e) => {
                const period = e.target.value
                const currentHour24 = value?.hour24?.split(':')[0] || '00'
                let hour24 = parseInt(currentHour24)
                
                if (period === 'PM' && hour24 < 12) hour24 += 12
                if (period === 'AM' && hour24 === 12) hour24 = 0
                if (period === 'AM' && hour24 === 0) hour24 = 12
                
                const newHour24 = hour24.toString().padStart(2, '0')
                const minutes = value?.hour24?.split(':')[1] || '00'
                const timeValue = `${newHour24}:${minutes}`
                
                handleFieldChange(field.name, {
                  ...formData[field.name],
                  period,
                  hour24: timeValue,
                  time: timeValue
                })
              }}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}
      
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="btn-primary"
        >
          Enviar Formulario
        </button>
        <button
          type="button"
          onClick={() => setFormData(initialData)}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
        >
          Limpiar
        </button>
      </div>
    </form>
  )
}
