import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const indicatorVariablesController = {
  // Obtener todas las variables de indicadores
  getAll: async (_req: Request, res: Response) => {
    try {
      const variables = await prisma.indicatorVariable.findMany({
        include: {
          indicator: {
            select: {
              id: true,
              code: true,
              statement: true
            }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(variables)
    } catch (error) {
      console.error('Error al obtener todas las variables de indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener variables' })
    }
  },

  // Obtener todas las variables de indicadores de objetivos
  getObjectiveIndicatorVariables: async (req: Request, res: Response) => {
    try {
      const { planId, search } = req.query
      
      const variables = await prisma.indicatorVariable.findMany({
        where: {
          indicator: {
            objectiveId: { not: null },
            ...(planId && { planId: planId as string })
          },
          ...(search && {
            OR: [
              { code: { contains: search as string, mode: 'insensitive' } },
              { name: { contains: search as string, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          indicator: {
            include: {
              plan: {
                select: { id: true, name: true }
              },
              objective: {
                select: { id: true, code: true }
              }
            }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(variables)
    } catch (error) {
      console.error('Error al obtener variables de indicadores de objetivos:', error)
      return res.status(500).json({ error: 'Error al obtener variables' })
    }
  },

  // Obtener todas las variables de indicadores de acciones
  getActionIndicatorVariables: async (req: Request, res: Response) => {
    try {
      const { planId, search } = req.query
      
      const variables = await prisma.indicatorVariable.findMany({
        where: {
          indicator: {
            actionId: { not: null },
            ...(planId && { planId: planId as string })
          },
          ...(search && {
            OR: [
              { code: { contains: search as string, mode: 'insensitive' } },
              { name: { contains: search as string, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          indicator: {
            include: {
              plan: {
                select: { id: true, name: true }
              },
              action: {
                select: { id: true, code: true }
              }
            }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(variables)
    } catch (error) {
      console.error('Error al obtener variables de indicadores de acciones:', error)
      return res.status(500).json({ error: 'Error al obtener variables' })
    }
  },

  // Obtener variables por indicador
  getByIndicator: async (req: Request, res: Response) => {
    try {
      const { indicatorId } = req.params
      
      const variables = await prisma.indicatorVariable.findMany({
        where: { indicatorId },
        orderBy: { code: 'asc' }
      })

      return res.json(variables)
    } catch (error) {
      console.error('Error al obtener variables del indicador:', error)
      return res.status(500).json({ error: 'Error al obtener variables' })
    }
  },

  // Obtener indicadores para variables (objetivos)
  getObjectiveIndicators: async (req: Request, res: Response) => {
    try {
      const { planId } = req.query
      
      const indicators = await prisma.indicator.findMany({
        where: {
          objectiveId: { not: null },
          ...(planId && { planId: planId as string })
        },
        include: {
          plan: {
            select: { id: true, name: true }
          },
          objective: {
            select: { id: true, code: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener indicadores de objetivos:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores' })
    }
  },

  // Obtener indicadores para variables (acciones)
  getActionIndicators: async (req: Request, res: Response) => {
    try {
      const { planId } = req.query
      
      const indicators = await prisma.indicator.findMany({
        where: {
          actionId: { not: null },
          ...(planId && { planId: planId as string })
        },
        include: {
          plan: {
            select: { id: true, name: true }
          },
          action: {
            select: { id: true, code: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener indicadores de acciones:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores' })
    }
  },

  // Generar código automático para variable
  generateVariableCode: async (indicatorId: string): Promise<string> => {
    const indicator = await prisma.indicator.findUnique({
      where: { id: indicatorId },
      select: { code: true }
    })

    if (!indicator) {
      throw new Error('Indicador no encontrado')
    }

    // Contar variables existentes para este indicador
    const existingCount = await prisma.indicatorVariable.count({
      where: { indicatorId }
    })

    // Generar código: VIOE 1.1.1, VIOE 1.1.2, etc.
    const nextNumber = existingCount + 1
    const prefix = indicator.code.startsWith('IOE') ? 'VIOE' : 'VIAE'
    return `${prefix} ${indicator.code.substring(4)}.${nextNumber}`
  },

  // Crear nueva variable
  create: async (req: Request, res: Response) => {
    try {
      const { indicatorId, name, description, fields } = req.body

      if (!indicatorId || !name || !fields) {
        return res.status(400).json({
          error: 'Indicador, nombre y campos son obligatorios'
        })
      }

      // Generar código automático
      const code = await indicatorVariablesController.generateVariableCode(indicatorId)

      const variable = await prisma.indicatorVariable.create({
        data: {
          indicatorId,
          code,
          name,
          description,
          fields
        },
        include: {
          indicator: {
            include: {
              plan: {
                select: { id: true, name: true }
              },
              objective: {
                select: { id: true, code: true }
              },
              action: {
                select: { id: true, code: true }
              }
            }
          }
        }
      })

      return res.status(201).json(variable)
    } catch (error) {
      console.error('Error al crear variable:', error)
      return res.status(500).json({ error: 'Error al crear variable' })
    }
  },

  // Actualizar variable
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { name, description, fields } = req.body

      const variable = await prisma.indicatorVariable.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(fields && { fields })
        },
        include: {
          indicator: {
            include: {
              plan: {
                select: { id: true, name: true }
              },
              objective: {
                select: { id: true, code: true }
              },
              action: {
                select: { id: true, code: true }
              }
            }
          }
        }
      })

      return res.json(variable)
    } catch (error) {
      console.error('Error al actualizar variable:', error)
      return res.status(500).json({ error: 'Error al actualizar variable' })
    }
  },

  // Eliminar variable
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.indicatorVariable.delete({
        where: { id }
      })

      return res.json({ message: 'Variable eliminada correctamente' })
    } catch (error) {
      console.error('Error al eliminar variable:', error)
      return res.status(500).json({ error: 'Error al eliminar variable' })
    }
  }
}
