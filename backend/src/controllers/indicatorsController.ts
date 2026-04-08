import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const indicatorsController = {
  // Obtener todos los indicadores
  getAll: async (_req: Request, res: Response) => {
    try {
      const indicators = await prisma.indicator.findMany({
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener todos los indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores' })
    }
  },

  // Obtener indicadores por objetivo
  getByObjective: async (req: Request, res: Response) => {
    try {
      const { objectiveId } = req.params
      
      const indicators = await prisma.indicator.findMany({
        where: { objectiveId },
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores' })
    }
  },

  // Obtener indicadores por acción
  getByAction: async (req: Request, res: Response) => {
    try {
      const { actionId } = req.params
      
      const indicators = await prisma.indicator.findMany({
        where: { actionId },
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores' })
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

  // Crear nuevo indicador
  create: async (req: Request, res: Response) => {
    try {
      const {
        planId,
        objectiveId,
        actionId,
        code,
        statement,
        responsibleId,
        formula,
        parameter,
        baseYear,
        baseValue
      } = req.body

      // Validaciones
      if (!planId || (!objectiveId && !actionId) || !code || !statement) {
        console.log('Validación fallida:', { planId, objectiveId, actionId, code, statement })
        return res.status(400).json({
          error: 'Plan, Objetivo/Acción, código y enunciado son obligatorios'
        })
      }

      const indicator = await prisma.indicator.create({
        data: {
          planId,
          objectiveId: objectiveId || null,
          actionId: actionId || null,
          code,
          statement,
          responsibleId: responsibleId || null,
          formula,
          parameter,
          baseYear,
          baseValue
        },
        include: {
          plan: {
            select: { id: true, name: true, startYear: true, endYear: true }
          },
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.status(201).json(indicator)
    } catch (error) {
      console.error('Error al crear indicador:', error)
      return res.status(500).json({ error: 'Error al crear indicador' })
    }
  },

  // Actualizar indicador
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        objectiveId,
        actionId,
        code,
        statement,
        responsibleId,
        formula,
        parameter,
        baseYear,
        baseValue
      } = req.body

      const indicator = await prisma.indicator.update({
        where: { id },
        data: {
          ...(objectiveId !== undefined && { objectiveId: objectiveId || null }),
          ...(actionId !== undefined && { actionId: actionId || null }),
          ...(code && { code }),
          ...(statement && { statement }),
          ...(responsibleId !== undefined && { responsibleId: responsibleId || null }),
          ...(formula !== undefined && { formula }),
          ...(parameter !== undefined && { parameter }),
          ...(baseYear !== undefined && { baseYear }),
          ...(baseValue !== undefined && { baseValue })
        },
        include: {
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      return res.json(indicator)
    } catch (error) {
      console.error('Error al actualizar indicador:', error)
      return res.status(500).json({ error: 'Error al actualizar indicador' })
    }
  },

  // Eliminar indicador
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.indicator.delete({
        where: { id }
      })

      return res.json({ message: 'Indicador eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar indicador:', error)
      return res.status(500).json({ error: 'Error al eliminar indicador' })
    }
  }
}
