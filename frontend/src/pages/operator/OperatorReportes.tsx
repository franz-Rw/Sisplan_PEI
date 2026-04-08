import { useState, useEffect } from 'react'
import { FiX, FiDownload } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf/dist/jspdf.umd.min.js'
import apiClient from '@services/api'
import { strategicObjectivesService, strategicActionsService, indicatorsService, type Indicator } from '@services/strategicService'
import { type IndicatorVariable } from '@services/indicatorVariablesService'
import { indicatorDataService } from '@services/indicatorDataService'

interface Plan {
  id: string
  name: string
  startYear: number
  endYear: number
}

interface StrategicObjective {
  id: string
  planId: string
  code: string
  statement: string
}

interface StrategicAction {
  id: string
  planId: string
  objectiveId?: string
  code: string
  statement: string
}

interface IndicatorDataRecord {
  id: string
  variableId: string
  costCenterCode: string
  year: number
  values: { [key: string]: any }
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  createdBy: string
}

type ReportTab = 'objectives' | 'actions'

export default function OperatorReportes() {
  const [activeTab, setActiveTab] = useState<ReportTab>('objectives')

  // Datos principales
  const [plans, setPlans] = useState<Plan[]>([])
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [actions, setActions] = useState<StrategicAction[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [variables, setVariables] = useState<IndicatorVariable[]>([])
  const [indicatorData, setIndicatorData] = useState<IndicatorDataRecord[]>([])

  // Filtros
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedObjectiveActionId, setSelectedObjectiveActionId] = useState('')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('')

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState<IndicatorVariable | null>(null)
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')
  const [pdfResponsibleName, setPdfResponsibleName] = useState('')
  const [pdfResponsiblePosition, setPdfResponsiblePosition] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  // Cargar planes
  useEffect(() => {
    loadPlans()
  }, [])

  // Cargar objetivos/acciones cuando cambia el plan y tab
  useEffect(() => {
    if (selectedPlanId) {
      if (activeTab === 'objectives') {
        loadObjectives()
      } else {
        loadActions()
      }
    }
  }, [selectedPlanId, activeTab])

  // Cargar indicadores cuando cambia objetivo/acción
  useEffect(() => {
    if (selectedObjectiveActionId) {
      loadIndicators()
    }
  }, [selectedObjectiveActionId, activeTab])

  // Cargar variables cuando cambia indicador
  useEffect(() => {
    if (selectedIndicatorId) {
      loadVariables()
    }
  }, [selectedIndicatorId])

  const loadPlans = async () => {
    try {
      const response = await apiClient.get('/plans')
      setPlans(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlans([])
    }
  }

  const loadObjectives = async () => {
    try {
      const data = await strategicObjectivesService.getAll()
      setObjectives(Array.isArray(data) ? data : [])
      setSelectedObjectiveActionId('')
      setSelectedIndicatorId('')
      setVariables([])
    } catch (error) {
      console.error('Error loading objectives:', error)
      setObjectives([])
    }
  }

  const loadActions = async () => {
    try {
      const data = await strategicActionsService.getAll()
      setActions(Array.isArray(data) ? data : [])
      setSelectedObjectiveActionId('')
      setSelectedIndicatorId('')
      setVariables([])
    } catch (error) {
      console.error('Error loading actions:', error)
      setActions([])
    }
  }

  const loadIndicators = async () => {
    try {
      let indicatorsData: Indicator[] = []
      if (activeTab === 'objectives') {
        indicatorsData = await indicatorsService.getByObjective(selectedObjectiveActionId)
      } else {
        indicatorsData = await indicatorsService.getByAction(selectedObjectiveActionId)
      }
      setIndicators(Array.isArray(indicatorsData) ? indicatorsData : [])
      setSelectedIndicatorId('')
      setVariables([])
    } catch (error) {
      console.error('Error loading indicators:', error)
      setIndicators([])
    }
  }

  const loadVariables = async () => {
    try {
      const response = await apiClient.get(`/indicator-variables/indicator/${selectedIndicatorId}`)
      setVariables(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading variables:', error)
      setVariables([])
    }
  }

  const loadIndicatorData = async (variableId: string, dateFrom?: string, dateTo?: string) => {
    try {
      setLoading(true)
      const data = await indicatorDataService.getByVariableAndDateRange(variableId, dateFrom, dateTo)
      setIndicatorData(data)
    } catch (error) {
      console.error('Error loading indicator data:', error)
      setIndicatorData([])
    } finally {
      setLoading(false)
    }
  }

  const handleReportClick = (variable: IndicatorVariable) => {
    setSelectedVariable(variable)
    setReportDateFrom('')
    setReportDateTo('')
    setShowReportModal(true)
  }

  const handleGenerateReport = async () => {
    if (!selectedVariable || !reportDateFrom || !reportDateTo) {
      alert('Debe seleccionar un rango de fechas')
      return
    }

    await loadIndicatorData(selectedVariable.id, reportDateFrom, reportDateTo)

    if (exportFormat === 'pdf') {
      setShowReportModal(false)
      setShowPDFModal(true)
    } else {
      performExport(exportFormat)
      setShowReportModal(false)
    }
  }

  const handleExportPDF = () => {
    if (!pdfResponsibleName || !pdfResponsiblePosition) {
      alert('Debe ingresar el nombre y cargo del responsable')
      return
    }
    performExport('pdf')
    setShowPDFModal(false)
    setShowReportModal(false)
  }

  const performExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedVariable) return

    if (format === 'csv') {
      exportToCSV()
    } else if (format === 'excel') {
      exportToExcel()
    } else if (format === 'pdf') {
      exportToPDF()
    }
  }

  const exportToCSV = () => {
    if (!selectedVariable || indicatorData.length === 0) return

    const headers = [
      'Código de Variable',
      ...selectedVariable.fields.map(field => field.label),
      'Centro de Costo',
      'Año',
      'Fecha de Registro',
      'Registrado por'
    ]

    const csvContent = [
      headers.join(','),
      ...indicatorData.map(record => [
        selectedVariable.code,
        ...selectedVariable.fields.map(field => {
          const value = record.values[field.name] || ''
          // Escapar comillas en valores
          return `"${String(value).replace(/"/g, '""')}"`
        }),
        record.costCenterCode,
        record.year,
        new Date(record.createdAt).toLocaleDateString('es-ES'),
        record.createdBy
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_${selectedVariable.code}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToExcel = () => {
    // Por ahora, usar CSV como sustituto (se puede mejorar con librería xlsx)
    exportToCSV()
  }

  const exportToPDF = () => {
    if (!selectedVariable || indicatorData.length === 0) return

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      let yPosition = margin

      // Encabezado
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text('Reporte de Variables de Indicadores', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      // Información del reporte
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Variable: ${selectedVariable.name} (${selectedVariable.code})`, margin, yPosition)
      yPosition += 5
      doc.text(`Período: ${reportDateFrom} a ${reportDateTo}`, margin, yPosition)
      yPosition += 10

      // Tabla
      const headers = [
        'Código',
        ...selectedVariable.fields.map(field => field.label),
        'Centro',
        'Año',
        'Fecha',
        'Registrado por'
      ]

      const tableData = indicatorData.map(record => [
        selectedVariable.code,
        ...selectedVariable.fields.map(field => {
          const value = record.values[field.name]
          return value !== undefined && value !== null ? String(value) : '-'
        }),
        record.costCenterCode,
        String(record.year),
        new Date(record.createdAt).toLocaleDateString('es-ES'),
        record.createdBy
      ])

      // Usar autoTable si está disponible
      if ((doc as any).autoTable) {
        (doc as any).autoTable({
          head: [headers],
          body: tableData,
          margin: { top: yPosition, left: margin, right: margin },
          willDrawPage: (data: any) => {
            // Encabezado en cada página
            if (data.pageNumber > 1) {
              doc.setFontSize(10)
              doc.text(`Variable: ${selectedVariable.name}`, margin, 10)
            }
          },
          didDrawPage: () => {
            // Pie de página
            const finalY = (doc as any).lastAutoTable?.finalY || yPosition + tableData.length * 5
            
            if (finalY + 20 < pageHeight) {
              doc.setFontSize(10)
              doc.setFont(undefined, 'normal')
              doc.text('_'.repeat(50), margin, finalY + 10)
              doc.text(pdfResponsibleName, margin, finalY + 18)
              doc.text(pdfResponsiblePosition, margin, finalY + 23)
            }
          }
        })
      } else {
        // Versión simplificada sin autoTable
        doc.setFontSize(9)
        let currentY = yPosition
        const lineHeight = 6
        const columnWidths = [15, 20, 20, 15, 15, 20, 20]

        // Encabezado de tabla
        doc.setFont(undefined, 'bold')
        headers.forEach((header, idx) => {
          const xPos = margin + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0)
          doc.text(header, xPos, currentY, { maxWidth: columnWidths[idx] })
        })
        currentY += lineHeight
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2)

        // Filas de tabla
        doc.setFont(undefined, 'normal')
        tableData.forEach(row => {
          if (currentY > pageHeight - 30) {
            // Nueva página
            doc.addPage()
            currentY = margin + 10
            doc.setFontSize(9)
            doc.setFont(undefined, 'bold')
            headers.forEach((header, idx) => {
              const xPos = margin + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0)
              doc.text(header, xPos, currentY, { maxWidth: columnWidths[idx] })
            })
            currentY += lineHeight
            doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2)
            doc.setFont(undefined, 'normal')
          }

          row.forEach((cell, idx) => {
            const xPos = margin + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0)
            doc.text(cell, xPos, currentY, { maxWidth: columnWidths[idx] })
          })
          currentY += lineHeight
        })

        // Pie de página
        currentY += 5
        doc.setFont(undefined, 'normal')
        doc.text('_'.repeat(50), margin, currentY)
        doc.text(pdfResponsibleName, margin, currentY + 8)
        doc.text(pdfResponsiblePosition, margin, currentY + 13)
      }

      const filename = `reporte_${selectedVariable.code}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const renderFilterPanel = () => {
    const items = activeTab === 'objectives' ? objectives : actions

    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          {activeTab === 'objectives' 
            ? 'Filtros para Objetivos Estratégicos' 
            : 'Filtros para Acciones Estratégicas'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Plan Estratégico
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {activeTab === 'objectives' 
                ? 'Objetivo Estratégico' 
                : 'Acción Estratégica'}
            </label>
            <select
              value={selectedObjectiveActionId}
              onChange={(e) => setSelectedObjectiveActionId(e.target.value)}
              disabled={!selectedPlanId}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              <option value="">
                {activeTab === 'objectives' 
                  ? 'Seleccionar objetivo' 
                  : 'Seleccionar acción'}
              </option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.statement}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Indicador
            </label>
            <select
              value={selectedIndicatorId}
              onChange={(e) => setSelectedIndicatorId(e.target.value)}
              disabled={!selectedObjectiveActionId}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              <option value="">Seleccionar indicador</option>
              {indicators.map(indicator => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.code} - {indicator.statement}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  const renderVariablesTable = () => {
    if (!selectedIndicatorId || variables.length === 0) {
      return null
    }

    const title = activeTab === 'objectives' 
      ? 'Variables de Indicadores de Objetivos Estratégicos'
      : 'Variables de Indicadores de Acciones Estratégicas'

    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">{title}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Código de Variable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Enunciado o Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {variables.map(variable => (
                <tr key={variable.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-neutral-900">{variable.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-900">{variable.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleReportClick(variable)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                      title="Generar reporte"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reportes de Indicadores</h1>
        <p className="text-neutral-600 mt-1">Genera y exporta reportes de datos registrados</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 border-b border-neutral-200">
        <button
          onClick={() => {
            setActiveTab('objectives')
            setSelectedPlanId('')
            setSelectedObjectiveActionId('')
            setSelectedIndicatorId('')
            setVariables([])
          }}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'objectives'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Reporte para Objetivos Estratégicos
        </button>
        <button
          onClick={() => {
            setActiveTab('actions')
            setSelectedPlanId('')
            setSelectedObjectiveActionId('')
            setSelectedIndicatorId('')
            setVariables([])
          }}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'actions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Reporte para Acciones Estratégicas
        </button>
      </div>

      {/* Filter Panel */}
      {renderFilterPanel()}

      {/* Variables Table */}
      {renderVariablesTable()}

      {/* Report Modal */}
      {showReportModal && selectedVariable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Generar Reporte</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Variable: {selectedVariable.name}
                </label>
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <p className="text-sm text-neutral-600">Código: {selectedVariable.code}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Formato de Exportación
                </label>
                <div className="space-y-2">
                  {(['csv', 'excel', 'pdf'] as const).map(format => (
                    <label key={format} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'pdf')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-neutral-900 capitalize">
                        {format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : 'PDF'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPDFModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Información del Responsable (PDF)</h3>
              <button
                onClick={() => setShowPDFModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nombre Completo del Responsable
                </label>
                <input
                  type="text"
                  value={pdfResponsibleName}
                  onChange={(e) => setPdfResponsibleName(e.target.value)}
                  placeholder="Ingrese el nombre completo"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={pdfResponsiblePosition}
                  onChange={(e) => setPdfResponsiblePosition(e.target.value)}
                  placeholder="Ingrese el cargo"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPDFModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
