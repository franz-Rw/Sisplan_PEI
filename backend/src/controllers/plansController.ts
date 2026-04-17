import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { PlanStatus } from '@prisma/client'

export const plansController = {
  // Obtener todos los planes estratégicos
  getAll: async (req: Request, res: Response) => {
    try {
      const { status } = req.query
      
      const plans = await prisma.strategicPlan.findMany({
        where: status ? { status: status as PlanStatus } : undefined,
        orderBy: { createdAt: 'desc' }
      })

      return res.json(plans)
    } catch (error) {
      console.error('Error al obtener planes:', error)
      return res.status(500).json({ error: 'Error al obtener planes' })
    }
  },

  // Obtener un plan estratégico por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const plan = await prisma.strategicPlan.findUnique({
        where: { id }
      })

      if (!plan) {
        return res.status(404).json({ error: 'Plan no encontrado' })
      }

      return res.json(plan)
    } catch (error) {
      console.error('Error al obtener plan:', error)
      return res.status(500).json({ error: 'Error al obtener plan' })
    }
  },

  // Crear nuevo plan estratégico
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        startYear,
        endYear,
        status = PlanStatus.VIGENTE,
        ceplanValidationDoc,
        approvalDoc,
        description
      } = req.body

      // Validaciones
      if (!name || !startYear || !endYear) {
        return res.status(400).json({
          error: 'Nombre, año de inicio y año de fin son obligatorios'
        })
      }

      if (startYear > endYear) {
        return res.status(400).json({
          error: 'El año de inicio no puede ser mayor al año de fin'
        })
      }

      const plan = await prisma.strategicPlan.create({
        data: {
          name,
          description,
          startYear: parseInt(startYear),
          endYear: parseInt(endYear),
          status: status as PlanStatus,
          ceplanValidationDoc,
          approvalDoc
        }
      })

      return res.status(201).json(plan)
    } catch (error) {
      console.error('Error al crear plan:', error)
      return res.status(500).json({ error: 'Error al crear plan' })
    }
  },

  // Actualizar plan estratégico
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        name,
        startYear,
        endYear,
        status,
        ceplanValidationDoc,
        approvalDoc,
        description
      } = req.body

      // Validaciones
      if (startYear && endYear && startYear > endYear) {
        return res.status(400).json({
          error: 'El año de inicio no puede ser mayor al año de fin'
        })
      }

      const plan = await prisma.strategicPlan.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(startYear && { startYear: parseInt(startYear) }),
          ...(endYear && { endYear: parseInt(endYear) }),
          ...(status && { status: status as PlanStatus }),
          ...(ceplanValidationDoc !== undefined && { ceplanValidationDoc }),
          ...(approvalDoc !== undefined && { approvalDoc })
        }
      })

      return res.json(plan)
    } catch (error) {
      console.error('Error al actualizar plan:', error)
      return res.status(500).json({ error: 'Error al actualizar plan' })
    }
  },

  // Eliminar plan estratégico
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.strategicPlan.delete({
        where: { id }
      })

      return res.json({ message: 'Plan eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar plan:', error)
      return res.status(500).json({ error: 'Error al eliminar plan' })
    }
  }
}
