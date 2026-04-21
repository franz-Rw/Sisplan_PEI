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
    
    // PDF Export (complete implementation)
    if (format === 'pdf') {
      exportToPDF()
    }
    
    // TODO: Implement Excel export
  }

  const exportToPDF = () => {
    // Importar jsPDF dinámicamente
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => {
      // @ts-ignore
      const { jsPDF } = window.jspdf
      
      // Crear documento PDF con formato A4 vertical
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Configuración de página
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      // Configuración de fuentes
      pdf.setFont('helvetica', 'normal')
      
      // Función para agregar encabezado profesional a cada página
      const addHeader = (pageNumber: number, totalPages: number) => {
        // Fondo del encabezado
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin, 10, contentWidth, 35, 'F')
        
        // Línea superior del encabezado
        pdf.setLineWidth(1)
        pdf.setDrawColor(100, 100, 100)
        pdf.line(margin, 10, pageWidth - margin, 10)
        
        // Título del reporte centrado
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(50, 50, 50)
        pdf.text('Reporte de Centros de Costo', pageWidth / 2, 22, { align: 'center', maxWidth: contentWidth })
        
        // Subtítulo con información
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(80, 80, 80)
        const currentDate = new Date().toLocaleDateString('es-PE', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        pdf.text(`Generado el ${currentDate}`, pageWidth / 2, 32, { align: 'center', maxWidth: contentWidth })
        pdf.text(`Total de registros: ${costCenters.length} centros`, pageWidth / 2, 39, { align: 'center', maxWidth: contentWidth })
        
        // Numeración de página en esquina superior derecha
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(120, 120, 120)
        pdf.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin - 5, 15, { align: 'right' })
        
        // Línea inferior del encabezado
        pdf.setLineWidth(0.8)
        pdf.setDrawColor(150, 150, 150)
        pdf.line(margin, 45, pageWidth - margin, 45)
        
        // Restaurar color por defecto
        pdf.setTextColor(0, 0, 0)
        
        return 52 // Espacio después del encabezado
      }
      
      // Función para agregar tabla con presentación profesional
      const addTable = (startY: number, startIndex: number, endIndex: number) => {
        let currentY = startY
        
        // Configuración de columnas con alineación específica
        const colWidths = [35, contentWidth - 70, 35]
        const colAlignments = ['center', 'left', 'center']
        const headers = ['Código', 'Descripción', 'Estado']
        
        // Encabezados de tabla con alineación profesional
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setFillColor(240, 240, 240) // Fondo gris claro para encabezados
        
        // Dibujar fondo de encabezados
        pdf.rect(margin, currentY - 6, contentWidth, 12, 'F')
        
        headers.forEach((header, index) => {
          let x = margin
          for (let j = 0; j < index; j++) {
            x += colWidths[j]
          }
          
          // Alineación según columna
          let textX = x
          if (colAlignments[index] === 'center') {
            textX = x + colWidths[index] / 2
            pdf.text(header, textX, currentY, { align: 'center', maxWidth: colWidths[index] })
          } else if (colAlignments[index] === 'left') {
            textX = x + 2
            pdf.text(header, textX, currentY, { align: 'left', maxWidth: colWidths[index] })
          }
        })
        
        currentY += 8
        
        // Línea después de encabezados
        pdf.setLineWidth(0.5)
        pdf.setDrawColor(150, 150, 150)
        pdf.line(margin, currentY, pageWidth - margin, currentY)
        currentY += 6
        
        // Datos de la tabla con presentación optimizada
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        
        for (let i = startIndex; i < endIndex && i < costCenters.length; i++) {
          const center = costCenters[i]
          
          // Verificar si hay espacio para otra fila (mínimo 15mm para fila completa)
          if (currentY > pageHeight - 25) {
            pdf.addPage()
            currentY = addHeader(pdf.internal.getCurrentPageInfo().pageNumber, Math.ceil(costCenters.length / 20))
            currentY = addTable(currentY, i, Math.min(endIndex, costCenters.length))
            return currentY
          }
          
          // Calcular altura de fila según contenido
          const descriptionLines = pdf.splitTextToSize(center.description, colWidths[1] - 4)
          const rowHeight = Math.max(8, descriptionLines.length * 4 + 4)
          
          // Dibujar fondo de fila (alternado)
          if (i % 2 === 0) {
            pdf.setFillColor(250, 250, 250)
            pdf.rect(margin, currentY - 4, contentWidth, rowHeight, 'F')
          }
          
          // Código - Centrado
          const codeX = margin + colWidths[0] / 2
          pdf.text(center.code, codeX, currentY + (rowHeight / 2) - 2, { 
            align: 'center', 
            maxWidth: colWidths[0] - 4,
            baseline: 'middle'
          })
          
          // Descripción - Izquierda con altura automática
          const descX = margin + colWidths[0] + 2
          let descY = currentY + 2
          
          descriptionLines.forEach((line: string, lineIndex: number) => {
            if (lineIndex === 0) {
              pdf.text(line, descX, descY, { align: 'left', maxWidth: colWidths[1] - 4 })
            } else {
              pdf.text(line, descX, descY + (lineIndex * 3.5), { align: 'left', maxWidth: colWidths[1] - 4 })
            }
          })
          
          // Estado - Centrado horizontal y verticalmente
          const statusText = getStatusDisplayName(center.status)
          const statusColor = center.status === 'ACTIVE' ? [0, 100, 0] : [200, 0, 0] // Verde/rojo más suaves
          const statusX = margin + colWidths[0] + colWidths[1] + colWidths[2] / 2
          const statusY = currentY + (rowHeight / 2) - 2
          
          pdf.setTextColor(...statusColor)
          pdf.setFont('helvetica', 'bold')
          pdf.text(statusText, statusX, statusY, { 
            align: 'center', 
            maxWidth: colWidths[2] - 4,
            baseline: 'middle'
          })
          
          // Restaurar fuente y color
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          
          // Línea separadora entre filas (más sutil)
          if (i < endIndex - 1 && i < costCenters.length - 1) {
            pdf.setLineWidth(0.2)
            pdf.setDrawColor(220, 220, 220)
            pdf.line(margin, currentY + rowHeight - 1, pageWidth - margin, currentY + rowHeight - 1)
          }
          
          currentY += rowHeight + 2 // Espaciado compacto entre filas
        }
        
        return currentY
      }
      
      // Calcular páginas necesarias
      const rowsPerPage = 20
      const totalPages = Math.ceil(costCenters.length / rowsPerPage)
      
      // Agregar contenido página por página
      for (let page = 1; page <= totalPages; page++) {
        if (page > 1) {
          pdf.addPage()
        }
        
        const startY = addHeader(page, totalPages)
        const startIndex = (page - 1) * rowsPerPage
        const endIndex = Math.min(startIndex + rowsPerPage, costCenters.length)
        
        addTable(startY, startIndex, endIndex)
      }
      
      // Pie de página profesional
      pdf.setFillColor(240, 240, 240)
      pdf.rect(margin, pageHeight - 15, contentWidth, 15, 'F')
      
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(150, 150, 150)
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('SISPLAN - Sistema de Planificación Estratégica Integral', pageWidth / 2, pageHeight - 7, { 
        align: 'center', 
        maxWidth: contentWidth 
      })
      
      // Restaurar color por defecto
      pdf.setTextColor(0, 0, 0)
      
      // Generar y descargar PDF
      const fileName = `centros_costo_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    }
    
    document.head.appendChild(script)
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
