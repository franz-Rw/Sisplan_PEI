import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const indicatorExceptionsController = {
  // Crear una nueva excepción de variable sin datos
  createException: async (req: Request, res: Response) => {
    try {
      const { variableId, reason, periodFrom, periodTo, costCenterId } = req.body

      if (!variableId || !reason || !periodFrom || !periodTo || !costCenterId) {
        return res.status(400).json({ 
          error: 'Se requieren todos los campos: variableId, reason, periodFrom, periodTo, costCenterId' 
        })
      }

      // Verificar que la variable exista y pertenezca al centro de costo
      const variable = await prisma.indicatorVariable.findFirst({
        where: {
          id: variableId,
          indicator: {
            responsibleId: costCenterId
          }
        },
        include: {
          indicator: {
            select: {
              id: true,
              code: true,
              statement: true,
              actionId: true,
              objectiveId: true
            }
          }
        }
      })

      if (!variable) {
        return res.status(404).json({ error: 'Variable no encontrada o no pertenece al centro de costo' })
      }

      // Simular creación de excepción (temporal sin archivo)
      const exception = {
        id: `temp-${Date.now()}`,
        variableId,
        reason,
        periodFrom,
        periodTo,
        costCenterId,
        supportFile: 'temp-file.pdf',
        supportFileOriginal: 'documento.pdf',
        status: 'PENDING',
        submittedBy: 'operator',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return res.json({
        success: true,
        message: 'Excepción registrada exitosamente',
        data: exception
      })
    } catch (error) {
      console.error('Error creating exception:', error)
      return res.status(500).json({ error: 'Error al registrar la excepción' })
    }
  },

  // Obtener excepciones para administrador
  getExceptions: async (req: Request, res: Response) => {
    try {
      const { type } = req.query

      // Simular excepciones (temporal hasta que la tabla esté creada)
      const mockExceptions = [
        {
          id: 'exc-1',
          variableId: 'var-1',
          reason: 'No se pudo recolectar datos debido a falta de personal',
          periodFrom: '2024-01-01',
          periodTo: '2024-03-31',
          costCenterId: 'cc-1',
          supportFile: 'sustento.pdf',
          status: 'PENDING',
          submittedBy: 'operator1',
          createdAt: new Date(),
          updatedAt: new Date(),
          variable: {
            id: 'var-1',
            code: 'IAEI-01.01.01',
            name: 'Número de capacitaciones realizadas',
            indicator: {
              id: 'ind-1',
              code: 'IAEI-01.01',
              statement: 'Capacitar al personal en gestión de riesgos',
              actionId: 'act-1',
              objectiveId: null,
              action: {
                id: 'act-1',
                code: 'AEI-01.01',
                statement: 'Programa de capacitaciones',
                objective: {
                  id: 'obj-1',
                  code: 'OEI-01',
                  statement: 'Reducir vulnerabilidad ante riesgos',
                  plan: {
                    id: 'plan-1',
                    name: 'PEI 2025-2030',
                    startYear: 2025,
                    endYear: 2030
                  }
                }
              }
            }
          },
          costCenter: {
            id: 'cc-1',
            code: '02.3.7.6',
            description: 'Subgerencia de Gestión de Riesgos de Desastres'
          }
        }
      ]

      // Filtrar por tipo (IOEI o IAEI) si se especifica
      let filteredExceptions = mockExceptions
      if (type === 'ioei') {
        filteredExceptions = mockExceptions.filter((exc: any) => 
          exc.variable.indicator.objectiveId !== null
        )
      } else if (type === 'iaei') {
        filteredExceptions = mockExceptions.filter((exc: any) => 
          exc.variable.indicator.actionId !== null
        )
      }

      return res.json(filteredExceptions)
    } catch (error) {
      console.error('Error getting exceptions:', error)
      return res.status(500).json({ error: 'Error al obtener las excepciones' })
    }
  },

  // Actualizar estado de una excepción
  updateExceptionStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { status, reviewComment } = req.body

      // Simular actualización
      return res.json({
        success: true,
        message: 'Estado de excepción actualizado',
        data: {
          id,
          status,
          reviewComment,
          reviewedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating exception status:', error)
      return res.status(500).json({ error: 'Error al actualizar el estado de la excepción' })
    }
  }
}
