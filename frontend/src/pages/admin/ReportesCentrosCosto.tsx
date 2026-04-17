import { useState, useEffect } from 'react'
import { FiDownload } from 'react-icons/fi'
import apiClient from '@services/api'

interface CostCenter {
  id: string
  code: string
  description: string
  status: string
}

export default function ReportesCentrosCosto() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCostCenters()
  }, [])

  const loadCostCenters = async () => {
    try {
      const response = await apiClient.get('/cost-centers')
      setCostCenters(response.data)
    } catch (error) {
      console.error('Error loading cost centers:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    // Implement export functionality
    console.log(`Exporting cost centers data as ${format}`)
    
    // CSV Export (basic implementation)
    if (format === 'csv') {
      const headers = ['Código', 'Descripción', 'Estado']
      const csvContent = [
        headers.join(','),
        ...costCenters.map(center => [
          center.code,
          `"${center.description}"`,
          center.status
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `centros_costo_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    // TODO: Implement Excel and PDF export
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo'
      case 'INACTIVE':
        return 'Inactivo'
      default:
        return status
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes de Centros de Costos</h1>
        <p className="text-gray-600">Visualice y exporte la información de centros de costos del sistema</p>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => exportData('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => exportData('excel')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Centros de Costos</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">Cargando centros de costo...</div>
          </div>
        ) : costCenters.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No hay centros de costo registrados</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costCenters.map(center => (
                  <tr key={center.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {center.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {center.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        center.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusDisplayName(center.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
