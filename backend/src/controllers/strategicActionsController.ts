import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const strategicActionsController = {
  // Obtener todas las acciones estratégicas
  getAll: async (req: Request, res: Response) => {
    try {
      const { planId, search } = req.query
      
      const actions = await prisma.strategicAction.findMany({
        where: {
          ...(planId && { planId: planId as string }),
          ...(search && {
            OR: [
              { code: { contains: search as string, mode: 'insensitive' } },
              { statement: { contains: search as string, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          objective: {
            select: { id: true, code: true, statement: true }
          },
          responsible: {
            select: { id: true, code: true, description: true }
          },
          _count: {
            select: { indicators: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(actions)
    } catch (error) {
      console.error('Error al obtener acciones:', error)
      return res.status(500).json({ error: 'Error al obtener acciones' })
    }
  },

  // Obtener centros de costo para asignación
  getCostCentersForAssignment: async (_req: Request, res: Response) => {
    try {
      const costCenters = await prisma.costCenter.findMany({
        where: { status: 'ACTIVO' },
        select: {
          id: true,
          code: true,
          description: true
        },
        orderBy: { code: 'asc' }
      })

      return res.json(costCenters)
    } catch (error) {
      console.error('Error al obtener centros de costo:', error)
      return res.status(500).json({ error: 'Error al obtener centros de costo' })
    }
  },

  // Crear nueva acción
  create: async (req: Request, res: Response) => {
    try {
      const {
        planId,
        objectiveId,
        code,
        statement,
        responsibleId
      } = req.body

      // Validaciones
      if (!planId || !objectiveId || !code || !statement) {
        return res.status(400).json({
          error: 'Plan, objetivo, código y enunciado son obligatorios'
        })
      }

      // Verificar si el código ya existe en el mismo plan
      const existingAction = await prisma.strategicAction.findFirst({
        where: {
          planId,
          code
        }
      })

      if (existingAction) {
        return res.status(409).json({
          error: 'El código de acción ya existe en este plan'
        })
      }

      const action = await prisma.strategicAction.create({
        data: {
          planId,
          objectiveId,
          code,
          statement,
          responsibleId: responsibleId || null
        },
        include: {
          objective: {
            select: { id: true, code: true, statement: true }
          },
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.status(201).json(action)
    } catch (error) {
      console.error('Error al crear acción:', error)
      return res.status(500).json({ error: 'Error al crear acción' })
    }
  },

  // Actualizar acción
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        code,
        objectiveId,
        statement,
        responsibleId
      } = req.body

      // Verificar si el código ya existe (si se está cambiando)
      if (code) {
        const existingAction = await prisma.strategicAction.findFirst({
          where: {
            id: { not: id },
            planId: (await prisma.strategicAction.findUnique({ 
              where: { id }, 
              select: { planId: true } 
            }))?.planId,
            code
          }
        })

        if (existingAction) {
          return res.status(409).json({
            error: 'El código de acción ya existe en este plan'
          })
        }
      }

      const action = await prisma.strategicAction.update({
        where: { id },
        data: {
          ...(code && { code }),
          ...(objectiveId && { objectiveId: objectiveId }),
          ...(statement && { statement }),
          ...(responsibleId !== undefined && { responsibleId: responsibleId || null })
        },
        include: {
          objective: {
            select: { id: true, code: true, statement: true }
          },
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.json(action)
    } catch (error) {
      console.error('Error al actualizar acción:', error)
      return res.status(500).json({ error: 'Error al actualizar acción' })
    }
  },

  // Eliminar acción
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Verificar si tiene indicadores asociados
      const indicatorsCount = await prisma.indicator.count({
        where: { actionId: id }
      })

      if (indicatorsCount > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar la acción porque tiene indicadores asociados'
        })
      }

      await prisma.strategicAction.delete({
        where: { id }
      })

      return res.json({ message: 'Acción eliminada correctamente' })
    } catch (error) {
      console.error('Error al eliminar acción:', error)
      return res.status(500).json({ error: 'Error al eliminar acción' })
    }
  }
}
