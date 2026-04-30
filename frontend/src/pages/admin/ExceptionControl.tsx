import { useState, useEffect } from 'react'
import { FiX, FiDownload, FiEye, FiFilter, FiCalendar, FiFileText, FiTrash2 } from 'react-icons/fi'
import apiClient from '@services/api'

interface Exception {
  id: string
  exceptionType: 'ioei' | 'iaei'
  variableId: string
  reason: string
  periodFrom: string
  periodTo: string
  costCenterId: string
  supportFile: string
  supportFileOriginal: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: string
  reviewComment?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  variable: {
    id: string
    code: string
    name: string
    indicator: {
      id: string
      code: string
      statement: string
      actionId?: string
      objectiveId?: string
      action?: {
        id: string
        code: string
        statement: string
        plan?: {
          id: string
          name: string
          startYear: number
          endYear: number
        }
        objective?: {
          id: string
          code: string
          statement: string
          plan: {
            id: string
            name: string
            startYear: number
            endYear: number
          }
        }
      }
      objective?: {
        id: string
        code: string
        statement: string
        plan: {
          id: string
          name: string
          startYear: number
          endYear: number
        }
      }
    }
  }
  costCenter: {
    id: string
    code: string
    description: string
  }
}

type ExceptionTab = 'ioei' | 'iaei'

export default function ExceptionControl() {
  const [activeTab, setActiveTab] = useState<ExceptionTab>('ioei')
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedException, setSelectedException] = useState<Exception | null>(null)
  const [newStatus, setNewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [reviewComment, setReviewComment] = useState('')
  const [showMessage, setShowMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    loadExceptions()
  }, [activeTab, statusFilter])

  useEffect(() => {
    if (!showMessage) return

    const timeout = window.setTimeout(() => {
      setShowMessage(null)
    }, 4000)

    return () => window.clearTimeout(timeout)
  }, [showMessage])

  const loadExceptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('type', activeTab)
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await apiClient.get(`/indicator-exceptions?${params}`)
      setExceptions(response.data || [])
    } catch (error) {
      console.error('Error loading exceptions:', error)
      setExceptions([])
      setShowMessage({ type: 'error', message: 'Error al cargar las excepciones' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedException) return

    try {
      const response = await apiClient.put(`/indicator-exceptions/exceptions/${selectedException.id}/status`, {
        status: newStatus,
        reviewComment,
      })

      if (response.data.success) {
        setShowStatusModal(false)
        setSelectedException(null)
        setReviewComment('')
        setShowMessage({ type: 'success', message: 'Estado de excepción actualizado correctamente' })
        loadExceptions()
      }
    } catch (error) {
      console.error('Error updating exception status:', error)
      setShowMessage({ type: 'error', message: 'Error al actualizar el estado de la excepción' })
    }
  }

  const handleDeleteException = async (exceptionId: string) => {
    if (!confirm('¿Está seguro de eliminar esta excepción? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await apiClient.delete(`/indicator-exceptions/exceptions/${exceptionId}`)
      loadExceptions()
      setShowMessage({ type: 'success', message: 'Excepción eliminada correctamente' })
    } catch (error) {
      console.error('Error deleting exception:', error)
      setShowMessage({ type: 'error', message: 'Error al eliminar la excepción' })
    }
  }

  const handleSupportFile = async (exception: Exception, mode: 'view' | 'download') => {
    try {
      const response = await apiClient.get(`/indicator-exceptions/exceptions/${exception.id}/download`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const filename = exception.supportFileOriginal || exception.supportFile || 'sustento.pdf'

      if (mode === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
        return
      }

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading support file:', error)
      alert('Error al descargar el archivo de sustento')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'APPROVED':
        return 'Aprobado'
      case 'REJECTED':
        return 'Rechazado'
      default:
        return status
    }
  }

  const getPlanInfo = (exception: Exception) =>
    exception.variable.indicator.action?.objective?.plan ||
    exception.variable.indicator.action?.plan ||
    exception.variable.indicator.objective?.plan

  const getContextInfo = (exception: Exception) =>
    exception.exceptionType === 'iaei'
      ? exception.variable.indicator.action
      : exception.variable.indicator.objective

  return (
    <div className="p-6">
      {showMessage && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            showMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {showMessage.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Control y Seguimiento de Excepciones
        </h1>
        <p className="text-neutral-600">
          Gestione las excepciones registradas por los operadores cuando no hay datos disponibles
        </p>
      </div>

      <div className="flex space-x-1 mb-6 bg-neutral-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('ioei')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ioei'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Variables de IOEI sin seguimiento
        </button>
        <button
          onClick={() => setActiveTab('iaei')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'iaei'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Variables de IAEI sin seguimiento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Estado:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Plan Estratégico
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {activeTab === 'ioei' ? 'Objetivo' : 'Acción'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Indicador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Variable
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Sustento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-neutral-500">
                    Cargando excepciones...
                  </td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-neutral-500">
                    No se encontraron excepciones
                  </td>
                </tr>
              ) : (
                exceptions.map((exception) => {
                  const plan = getPlanInfo(exception)
                  const context = getContextInfo(exception)

                  return (
                    <tr key={exception.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {plan?.name || 'Sin plan asociado'}
                          </div>
                          <div className="text-neutral-500">
                            {plan ? `${plan.startYear} - ${plan.endYear}` : 'Sin período'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {context?.code || 'Sin referencia'}
                          </div>
                          <div className="text-neutral-500 text-xs max-w-xs truncate">
                            {context?.statement || 'Sin descripción'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {exception.variable.indicator.code}
                          </div>
                          <div className="text-neutral-500 text-xs max-w-xs truncate">
                            {exception.variable.indicator.statement}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {exception.variable.code}
                          </div>
                          <div className="text-neutral-500 text-xs max-w-xs truncate">
                            {exception.variable.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {exception.costCenter.code}
                          </div>
                          <div className="text-neutral-500 text-xs max-w-xs truncate">
                            {exception.costCenter.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-1 text-neutral-500">
                          <FiCalendar className="w-3 h-3" />
                          {exception.periodFrom} a {exception.periodTo}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="max-w-xs truncate" title={exception.reason}>
                          {exception.reason}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exception.status)}`}>
                          {getStatusText(exception.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-neutral-700">
                            <FiFileText className="w-4 h-4" />
                            <span className="max-w-[180px] truncate text-xs" title={exception.supportFileOriginal || exception.supportFile}>
                              {exception.supportFileOriginal || exception.supportFile}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSupportFile(exception, 'view')}
                              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
                              title="Visualizar sustento"
                            >
                              <FiEye className="w-4 h-4" />
                              Ver
                            </button>
                            <button
                              onClick={() => handleSupportFile(exception, 'download')}
                              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
                              title="Descargar sustento"
                            >
                              <FiDownload className="w-4 h-4" />
                              Descargar
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {exception.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedException(exception)
                                setNewStatus('APPROVED')
                                setReviewComment(exception.reviewComment || '')
                                setShowStatusModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              Revisar
                            </button>
                          )}
                          {exception.reviewComment && (
                            <button
                              className="text-neutral-600 hover:text-neutral-700"
                              title={exception.reviewComment}
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteException(exception.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                            title="Eliminar excepción"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showStatusModal && selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Revisar Excepción
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nuevo Estado
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="APPROVED"
                      checked={newStatus === 'APPROVED'}
                      onChange={(e) => setNewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Aprobar</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="REJECTED"
                      checked={newStatus === 'REJECTED'}
                      onChange={(e) => setNewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Rechazar</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Comentario de Revisión
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ingrese un comentario sobre la decisión..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
