import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const dynamicFormulasController = {
  // Obtener todas las fórmulas dinámicas
  getAll: async (_req: Request, res: Response) => {
    try {
      const formulas = await prisma.dynamicFormula.findMany({
        where: { isActive: true },
        include: {
          indicatorConfigs: {
            include: {
              indicator: {
                select: { id: true, code: true, statement: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return res.json(formulas)
    } catch (error) {
      console.error('Error al obtener fórmulas dinámicas:', error)
      return res.status(500).json({ error: 'Error al obtener fórmulas dinámicas' })
    }
  },

  // Obtener una fórmula por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const formula = await prisma.dynamicFormula.findUnique({
        where: { id },
        include: {
          indicatorConfigs: {
            include: {
              indicator: true,
              formulaResults: true
            }
          }
        }
      })

      if (!formula) {
        return res.status(404).json({ error: 'Fórmula no encontrada' })
      }

      return res.json(formula)
    } catch (error) {
      console.error('Error al obtener fórmula:', error)
      return res.status(500).json({ error: 'Error al obtener fórmula' })
    }
  },

  // Crear nueva fórmula dinámica
  create: async (req: Request, res: Response) => {
    try {
      const { name, description, expressionTree, components, conditions, aggregationType, category, isTemplate } = req.body

      if (!name || !expressionTree || !components) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: name, expressionTree, components' 
        })
      }

      const formula = await prisma.dynamicFormula.create({
        data: {
          name,
          description,
          expressionTree,
          components,
          conditions: conditions || [],
          aggregationType,
          category: category || 'BASIC',
          isTemplate: isTemplate || false,
          createdBy: 'admin' // Temporal hasta que se implemente autenticación
        },
        include: {
          indicatorConfigs: true
        }
      })

      return res.status(201).json(formula)
    } catch (error) {
      console.error('Error al crear fórmula dinámica:', error)
      return res.status(500).json({ error: 'Error al crear fórmula dinámica' })
    }
  },

  // Actualizar fórmula dinámica
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { name, description, expressionTree, components, conditions, aggregationType, category, isTemplate } = req.body

      const formula = await prisma.dynamicFormula.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(expressionTree && { expressionTree }),
          ...(components && { components }),
          ...(conditions !== undefined && { conditions }),
          ...(aggregationType !== undefined && { aggregationType }),
          ...(category && { category }),
          ...(isTemplate !== undefined && { isTemplate }),
          updatedAt: new Date()
        },
        include: {
          indicatorConfigs: true
        }
      })

      return res.json(formula)
    } catch (error) {
      console.error('Error al actualizar fórmula dinámica:', error)
      return res.status(500).json({ error: 'Error al actualizar fórmula dinámica' })
    }
  },

  // Eliminar fórmula dinámica (soft delete)
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.dynamicFormula.update({
        where: { id },
        data: { isActive: false }
      })

      return res.json({ message: 'Fórmula eliminada correctamente' })
    } catch (error) {
      console.error('Error al eliminar fórmula dinámica:', error)
      return res.status(500).json({ error: 'Error al eliminar fórmula dinámica' })
    }
  },

  // Obtener configuración de fórmula para un indicador
  getIndicatorConfig: async (req: Request, res: Response) => {
    try {
      const { indicatorId } = req.params

      const config = await prisma.indicatorFormulaConfig.findUnique({
        where: { indicatorId },
        include: {
          formula: true,
          indicator: {
            select: { id: true, code: true, statement: true }
          },
          formulaResults: {
            orderBy: { period: 'desc' },
            take: 12 // Últimos 12 meses
          }
        }
      })

      return res.json(config)
    } catch (error) {
      console.error('Error al obtener configuración de indicador:', error)
      return res.status(500).json({ error: 'Error al obtener configuración de indicador' })
    }
  },

  // Configurar fórmula para un indicador
  configureIndicator: async (req: Request, res: Response) => {
    try {
      const { indicatorId } = req.params
      const { formulaId, customComponents, customConditions, activePeriods } = req.body

      if (!formulaId) {
        return res.status(400).json({ error: 'Se requiere formulaId' })
      }

      // Verificar que la fórmula existe
      const formula = await prisma.dynamicFormula.findUnique({
        where: { id: formulaId }
      })

      if (!formula) {
        return res.status(404).json({ error: 'Fórmula no encontrada' })
      }

      const config = await prisma.indicatorFormulaConfig.upsert({
        where: { indicatorId },
        update: {
          formulaId,
          customComponents,
          customConditions,
          activePeriods,
          lastCalculated: null, // Resetear para recalcular
          updatedAt: new Date()
        },
        create: {
          indicatorId,
          formulaId,
          customComponents,
          customConditions,
          activePeriods
        },
        include: {
          formula: true,
          indicator: {
            select: { id: true, code: true, statement: true }
          }
        }
      })

      return res.status(201).json(config)
    } catch (error) {
      console.error('Error al configurar indicador:', error)
      return res.status(500).json({ error: 'Error al configurar indicador' })
    }
  },

  // Eliminar configuración de fórmula de un indicador
  removeIndicatorConfig: async (req: Request, res: Response) => {
    try {
      const { indicatorId } = req.params

      await prisma.indicatorFormulaConfig.delete({
        where: { indicatorId }
      })

      return res.json({ message: 'Configuración eliminada correctamente' })
    } catch (error) {
      console.error('Error al eliminar configuración de indicador:', error)
      return res.status(500).json({ error: 'Error al eliminar configuración de indicador' })
    }
  },

  // Obtener templates de fórmulas
  getTemplates: async (_req: Request, res: Response) => {
    try {
      const templates = await prisma.dynamicFormula.findMany({
        where: { 
          isActive: true,
          isTemplate: true 
        },
        select: {
          id: true,
          name: true,
          description: true,
          expressionTree: true,
          components: true,
          conditions: true,
          aggregationType: true,
          category: true
        },
        orderBy: { name: 'asc' }
      })

      return res.json(templates)
    } catch (error) {
      console.error('Error al obtener templates:', error)
      return res.status(500).json({ error: 'Error al obtener templates' })
    }
  }
}
