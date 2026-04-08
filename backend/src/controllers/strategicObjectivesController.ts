import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const strategicObjectivesController = {
  // Obtener todos los objetivos estratégicos
  getAll: async (req: Request, res: Response) => {
    try {
      const { planId, search } = req.query
      
      const objectives = await prisma.strategicObjective.findMany({
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
          responsible: {
            select: { id: true, code: true, description: true }
          },
          _count: {
            select: { indicators: true }
          }
        },
        orderBy: { code: 'asc' }
      })
      
      return res.json(objectives)
    } catch (error) {
      console.error('Error al obtener objetivos:', error)
      return res.status(500).json({ error: 'Error al obtener objetivos' })
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

  // Crear nuevo objetivo
  create: async (req: Request, res: Response) => {
    try {
      const {
        planId,
        code,
        statement,
        responsibleId
      } = req.body

      // Validaciones
      if (!planId || !code || !statement) {
        return res.status(400).json({
          error: 'Plan, código y enunciado son obligatorios'
        })
      }

      // Verificar si el código ya existe en el mismo plan
      const existingObjective = await prisma.strategicObjective.findFirst({
        where: {
          planId,
          code
        }
      })

      if (existingObjective) {
        return res.status(409).json({
          error: 'El código de objetivo ya existe en este plan'
        })
      }

      const objective = await prisma.strategicObjective.create({
        data: {
          planId,
          code,
          statement,
          responsibleId: responsibleId || null
        },
        include: {
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.status(201).json(objective)
    } catch (error) {
      console.error('Error al crear objetivo:', error)
      return res.status(500).json({ error: 'Error al crear objetivo' })
    }
  },

  // Actualizar objetivo
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        code,
        statement,
        responsibleId
      } = req.body

      // Verificar si el código ya existe (si se está cambiando)
      if (code) {
        const existingObjective = await prisma.strategicObjective.findFirst({
          where: {
            id: { not: id },
            planId: (await prisma.strategicObjective.findUnique({ 
              where: { id }, 
              select: { planId: true } 
            }))?.planId,
            code
          }
        })

        if (existingObjective) {
          return res.status(409).json({
            error: 'El código de objetivo ya existe en este plan'
          })
        }
      }

      const objective = await prisma.strategicObjective.update({
        where: { id },
        data: {
          ...(code && { code }),
          ...(statement && { statement }),
          ...(responsibleId !== undefined && { responsibleId: responsibleId || null })
        },
        include: {
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.json(objective)
    } catch (error) {
      console.error('Error al actualizar objetivo:', error)
      return res.status(500).json({ error: 'Error al actualizar objetivo' })
    }
  },

  // Eliminar objetivo
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Verificar si tiene indicadores asociados
      const indicatorsCount = await prisma.indicator.count({
        where: { objectiveId: id }
      })

      if (indicatorsCount > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el objetivo porque tiene indicadores asociados'
        })
      }

      await prisma.strategicObjective.delete({
        where: { id }
      })

      return res.json({ message: 'Objetivo eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar objetivo:', error)
      return res.status(500).json({ error: 'Error al eliminar objetivo' })
    }
  }
}
