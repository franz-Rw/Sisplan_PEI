import { Request, Response } from 'express'
import { prisma } from '../config/database'

const resolveIndicatorRelations = async ({
  planId,
  objectiveId,
  actionId
}: {
  planId?: string
  objectiveId?: string | null
  actionId?: string | null
}) => {
  const normalizedActionId = actionId || null
  const normalizedObjectiveId = objectiveId || null

  // Validar exclusividad: no puede tener ambos
  if (normalizedActionId && normalizedObjectiveId) {
    const error = new Error('Un indicador solo puede pertenecer a un objetivo O a una acción estratégica, no a ambos') as Error & { status?: number }
    error.status = 400
    throw error
  }

  if (!normalizedActionId) {
    return {
      planId,
      objectiveId: normalizedObjectiveId,
      actionId: null
    }
  }

  const action = await prisma.strategicAction.findUnique({
    where: { id: normalizedActionId },
    select: {
      planId: true,
      objectiveId: true
    }
  })

  if (!action) {
    const error = new Error('Acción estratégica no encontrada') as Error & { status?: number }
    error.status = 400
    throw error
  }

  if (planId && planId !== action.planId) {
    const error = new Error('La acción estratégica no pertenece al plan seleccionado') as Error & { status?: number }
    error.status = 400
    throw error
  }

  return {
    planId: planId || action.planId,
    objectiveId: null, // Las acciones no deben tener objectiveId en el indicador
    actionId: normalizedActionId
  }
}

export const indicatorsController = {
  // Obtener todos los indicadores
  getAll: async (req: Request, res: Response) => {
    try {
      const { planId, search } = req.query

      const where: any = {}
      if (planId) {
        where.planId = planId
      }
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { statement: { contains: search, mode: 'insensitive' } }
        ]
      }

      const indicators = await prisma.indicator.findMany({
        where,
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          },
          plan: {
            select: { id: true, name: true }
          },
          objective: {
            select: { id: true, code: true, statement: true }
          },
          action: {
            select: { 
              id: true, 
              code: true, 
              statement: true,
              objective: {
                select: { id: true, code: true, statement: true }
              }
            }
          },
          responsible: {
            select: { id: true, code: true, description: true }
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

  // Obtener un indicador por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const indicator = await prisma.indicator.findUnique({
        where: { id },
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          },
          objective: {
            select: { id: true, code: true, statement: true }
          },
          action: {
            select: { id: true, code: true, statement: true }
          },
          responsible: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      if (!indicator) {
        return res.status(404).json({ error: 'Indicador no encontrado' })
      }

      return res.json(indicator)
    } catch (error) {
      console.error('Error al obtener indicador:', error)
      return res.status(500).json({ error: 'Error al obtener indicador' })
    }
  },

  // Obtener indicadores por objetivo
  getByObjective: async (req: Request, res: Response) => {
    try {
      const { objectiveId } = req.params
      const { costCenterId } = req.query
      
      const indicators = await prisma.indicator.findMany({
        where: { 
          objectiveId,
          ...(costCenterId && { responsibleId: costCenterId as string })
        },
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          },
          responsible: {
            select: { id: true, code: true, description: true }
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
      const { costCenterId } = req.query
      
      const indicators = await prisma.indicator.findMany({
        where: { 
          actionId,
          ...(costCenterId && { responsibleId: costCenterId as string })
        },
        include: {
          indicatorValues: {
            orderBy: { year: 'asc' }
          },
          responsible: {
            select: { id: true, code: true, description: true }
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

      // Validar exclusividad: no puede tener ambos objectiveId y actionId
      if (objectiveId && actionId) {
        return res.status(400).json({
          error: 'Un indicador solo puede pertenecer a un objetivo O a una acción estratégica, no a ambos'
        })
      }

      const resolvedRelations = await resolveIndicatorRelations({
        planId,
        objectiveId,
        actionId
      })

      const indicator = await prisma.indicator.create({
        data: {
          planId: resolvedRelations.planId!,
          objectiveId: resolvedRelations.objectiveId,
          actionId: resolvedRelations.actionId,
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
    } catch (error: unknown) {
      console.error('Error al crear indicador:', error)
      if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        return res.status(error.status).json({ error: error instanceof Error ? error.message : 'Error al crear indicador' })
      }
      return res.status(500).json({ error: 'Error al crear indicador' })
    }
  },

  // Actualizar indicador
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
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

      const resolvedRelations =
        actionId !== undefined || objectiveId !== undefined || planId !== undefined
          ? await resolveIndicatorRelations({
              planId,
              objectiveId,
              actionId
            })
          : null

      const indicator = await prisma.indicator.update({
        where: { id },
        data: {
          ...(resolvedRelations?.planId && { planId: resolvedRelations.planId }),
          ...(resolvedRelations && { objectiveId: resolvedRelations.objectiveId }),
          ...(resolvedRelations && { actionId: resolvedRelations.actionId }),
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
    } catch (error: unknown) {
      console.error('Error al actualizar indicador:', error)
      if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        return res.status(error.status).json({ error: error instanceof Error ? error.message : 'Error al actualizar indicador' })
      }
      return res.status(500).json({ error: 'Error al actualizar indicador' })
    }
  },

  // Diagnosticar indicadores con problemas de vinculación
  diagnose: async (_req: Request, res: Response) => {
    try {
      const indicators = await prisma.indicator.findMany({
        include: {
          objective: {
            select: { id: true, code: true, statement: true }
          },
          action: {
            select: { id: true, code: true, statement: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      const diagnosis = indicators.map(indicator => {
        const hasObjective = indicator.objectiveId !== null
        const hasAction = indicator.actionId !== null
        
        let status = 'CORRECT'
        let issue = null
        
        if (hasObjective && hasAction) {
          status = 'ERROR'
          issue = 'DOBLE VINCULACIÓN: Tiene tanto objectiveId como actionId'
        } else if (!hasObjective && !hasAction) {
          status = 'ERROR'
          issue = 'SIN VINCULACIÓN: No tiene ni objectiveId ni actionId'
        }

        return {
          id: indicator.id,
          code: indicator.code,
          statement: indicator.statement,
          objectiveId: indicator.objectiveId,
          actionId: indicator.actionId,
          objective: indicator.objective,
          action: indicator.action,
          status,
          issue
        }
      })

      const summary = {
        total: indicators.length,
        correct: diagnosis.filter(d => d.status === 'CORRECT').length,
        errors: diagnosis.filter(d => d.status === 'ERROR').length,
        doubleLinked: diagnosis.filter(d => d.issue?.includes('DOBLE VINCULACIÓN')).length,
        unlinked: diagnosis.filter(d => d.issue?.includes('SIN VINCULACIÓN')).length
      }

      return res.json({
        summary,
        indicators: diagnosis
      })
    } catch (error) {
      console.error('Error al diagnosticar indicadores:', error)
      return res.status(500).json({ error: 'Error al diagnosticar indicadores' })
    }
  },

  // Corregir indicadores con doble vinculación
  fixDoubleLinked: async (req: Request, res: Response) => {
    try {
      const { prioritize } = req.body // 'action' o 'objective'
      
      if (!prioritize || !['action', 'objective'].includes(prioritize)) {
        return res.status(400).json({ 
          error: 'Debe especificar "action" u "objective" en el campo prioritize' 
        })
      }

      const doubleLinkedIndicators = await prisma.indicator.findMany({
        where: {
          AND: [
            { objectiveId: { not: null } },
            { actionId: { not: null } }
          ]
        },
        include: {
          objective: { select: { code: true } },
          action: { select: { code: true } }
        }
      })

      if (doubleLinkedIndicators.length === 0) {
        return res.json({ 
          message: 'No hay indicadores con doble vinculación que necesiten corrección',
          fixed: 0
        })
      }

      const updateData = prioritize === 'action' 
        ? { objectiveId: null }
        : { actionId: null }

      const result = await prisma.indicator.updateMany({
        where: {
          AND: [
            { objectiveId: { not: null } },
            { actionId: { not: null } }
          ]
        },
        data: updateData
      })

      return res.json({
        message: `Se corrigieron ${result.count} indicadores con doble vinculación`,
        prioritize,
        fixed: result.count,
        indicators: doubleLinkedIndicators.map(ind => ({
          id: ind.id,
          code: ind.code,
          objective: ind.objective?.code,
          action: ind.action?.code,
          kept: prioritize
        }))
      })
    } catch (error) {
      console.error('Error al corregir indicadores:', error)
      return res.status(500).json({ error: 'Error al corregir indicadores' })
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
