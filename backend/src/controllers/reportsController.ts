import { Request, Response } from 'express'
import { prisma } from '../config/database'
import jsPDF from 'jspdf'

export const reportsController = {
  // Generar reporte de Planes Estratégicos
  getPlansReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, status } = req.query

      const plans = await prisma.strategicPlan.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate as string) } })
        },
        include: {
          objectives: {
            include: {
              indicators: true
            }
          },
          actions: {
            include: {
              indicators: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Formatear datos para el reporte según especificación
      const reportData = plans.map((plan: any) => {
        const objectivesCount = plan.objectives.length
        const objectiveIndicatorsCount = plan.objectives.reduce((acc: number, obj: any) => acc + obj.indicators.length, 0)
        const actionsCount = plan.actions.length
        const actionIndicatorsCount = plan.actions.reduce((acc: number, act: any) => acc + act.indicators.length, 0)

        return {
          Nombre: plan.name,
          'Año Inicio': plan.startYear,
          'Año Fin': plan.endYear,
          Estado: plan.status,
          'Objetivos Estratégicos Institucionales': objectivesCount,
          'Indicadores de Objetivos Institucionales': objectiveIndicatorsCount,
          'Acciones Estratégicas Institucionales': actionsCount,
          'Indicadores de Acciones Estratégicas Institucionales': actionIndicatorsCount
        }
      })

      return res.json(reportData)
    } catch (error) {
      console.error('Error generating plans report:', error)
      return res.status(500).json({ error: 'Error al generar reporte de planes' })
    }
  },

  // Generar reporte de Usuarios
  getUsersReport: async (req: Request, res: Response) => {
    try {
      const { role, status, startDate, endDate } = req.query

      const users = await prisma.user.findMany({
        where: {
          ...(role && { role: role as any }),
          ...(status && { status: status as any }),
          ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate as string) } })
        },
        include: {
          costCenter: {
            select: {
              code: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Formatear datos para el reporte según especificación
      const reportData = users.map((user: any) => ({
        'Nombre y apellidos': user.name,
        'Email': user.email,
        'Contraseña': user.password, // Importar la contraseña como se solicitó
        'Rol': user.role,
        'Centro de Costo': user.costCenter?.description || 'N/A',
        'Estado': user.status
      }))

      return res.json(reportData)
    } catch (error) {
      console.error('Error generating users report:', error)
      return res.status(500).json({ error: 'Error al generar reporte de usuarios' })
    }
  },

  // Generar reporte de Centros de Costo
  getCostCentersReport: async (req: Request, res: Response) => {
    try {
      const { status, startDate, endDate } = req.query

      const costCenters = await prisma.costCenter.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate as string) } })
        },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              description: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Formatear datos para el reporte según especificación
      const reportData = costCenters.map((costCenter: any) => ({
        'Código del centro de costo': costCenter.code,
        'Descripción': costCenter.description,
        'Centro de costos Padre': costCenter.parent?.description || 'N/A',
        'Usuario Responsable': costCenter.assignedUser?.name || 'N/A',
        'Estado': costCenter.status
      }))

      return res.json(reportData)
    } catch (error) {
      console.error('Error generating cost centers report:', error)
      return res.status(500).json({ error: 'Error al generar reporte de centros de costo' })
    }
  },

  // Exportar reporte en diferentes formatos
  exportReport: async (req: Request, res: Response) => {
    try {
      const { type, format } = req.body

      let data: any[] = []
      let filename = ''

      // Obtener datos según el tipo
      switch (type) {
        case 'plans':
          data = await (reportsController.getPlansReport as any)(req, res)
          filename = `planes-estrategicos-${new Date().toISOString().split('T')[0]}`
          break
        case 'users':
          data = await (reportsController.getUsersReport as any)(req, res)
          filename = `usuarios-${new Date().toISOString().split('T')[0]}`
          break
        case 'costCenters':
          data = await (reportsController.getCostCentersReport as any)(req, res)
          filename = `centros-costo-${new Date().toISOString().split('T')[0]}`
          break
        default:
          return res.status(400).json({ error: 'Tipo de reporte no válido' })
      }

      // Generar según el formato
      switch (format) {
        case 'csv':
          return exportCSV(res, data, filename)
        case 'excel':
          return exportExcel(res, data, filename)
        case 'pdf':
          return exportPDF(res, data, filename, type)
        default:
          return res.status(400).json({ error: 'Formato de exportación no válido' })
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      return res.status(500).json({ error: 'Error al exportar reporte' })
    }
  }
}

// Función para exportar a CSV
function exportCSV(res: Response, data: any[], filename: string) {
  if (data.length === 0) {
    return res.status(400).json({ error: 'No hay datos para exportar' })
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escapar comillas y envolver en comillas si es necesario
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
  return res.send(csvContent)
}

// Función para exportar a Excel (básico)
function exportExcel(res: Response, data: any[], filename: string) {
  // Por ahora, usaremos CSV como fallback para Excel
  // En producción, podríamos usar librerías como xlsx o exceljs
  return exportCSV(res, data, filename)
}

// Función para exportar a PDF
function exportPDF(res: Response, data: any[], filename: string, type: string): void {
  try {
    if (data.length === 0) {
      res.status(400).json({ error: 'No hay datos para exportar' })
      return
    }

    // Crear nuevo documento PDF
    const doc = new jsPDF()
    
    // Configuración inicial
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin
    
    // Título del reporte
    const title = getReportTitle(type)
    doc.setFontSize(20)
    doc.text(title, margin, yPosition)
    yPosition += 15
    
    // Fecha de generación
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, yPosition)
    yPosition += 15
    
    // Obtener encabezados
    const headers = Object.keys(data[0])
    const columnWidth = (pageWidth - margin * 2) / headers.length
    
    // Dibujar encabezados de tabla
    doc.setFontSize(12)
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition, pageWidth - margin * 2, 12, 'F')
    
    headers.forEach((header, index) => {
      const x = margin + (index * columnWidth)
      const text = String(header).substring(0, 20) // Limitar texto
      doc.text(text, x + 2, yPosition + 8)
    })
    
    yPosition += 12
    
    // Dibujar filas de datos
    doc.setFontSize(10)
    let currentPage = 1
    
    data.forEach((row) => {
      // Verificar si necesitamos nueva página
      if (yPosition + 10 > pageHeight - margin) {
        doc.addPage()
        currentPage++
        yPosition = margin
        
        // Redibujar encabezados en nueva página
        doc.setFontSize(12)
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, yPosition, pageWidth - margin * 2, 12, 'F')
        
        headers.forEach((header, index) => {
          const x = margin + (index * columnWidth)
          const text = String(header).substring(0, 20)
          doc.text(text, x + 2, yPosition + 8)
        })
        
        yPosition += 12
        doc.setFontSize(10)
      }
      
      // Dibujar fila
      headers.forEach((header, index) => {
        const x = margin + (index * columnWidth)
        const value = String(row[header] || '').substring(0, 20)
        doc.text(value, x + 2, yPosition + 7)
      })
      
      yPosition += 10
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
    })
    
    // Pie de página
    for (let i = 1; i <= currentPage; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Página ${i} de ${currentPage}`, pageWidth - margin - 30, pageHeight - 10)
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`)
    
    // Generar y enviar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    res.send(pdfBuffer)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ error: 'Error al generar PDF' })
  }
}

function getReportTitle(type: string): string {
  switch (type) {
    case 'plans':
      return 'Reporte de Planes Estratégicos'
    case 'users':
      return 'Reporte de Usuarios'
    case 'costCenters':
      return 'Reporte de Centros de Costo'
    default:
      return 'Reporte del Sistema'
  }
}
