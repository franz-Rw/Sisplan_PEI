import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const deadlineConfigController = {
  // Obtener todas las configuraciones de plazos
  getAll: async (_req: Request, res: Response) => {
    try {
      const configs = await prisma.deadlineConfig.findMany({
        include: {
          costCenter: {
            select: {
              id: true,
              code: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Transformar a formato esperado por el frontend
      const formatted = configs.map(config => {
        try {
          return {
            id: config.id,
            costCenterId: config.costCenterId,
            costCenterCode: config.costCenter.code,
            costCenterDescription: config.costCenter.description,
            startDate: config.startDate.toISOString().split('T')[0],
            endDate: config.endDate.toISOString().split('T')[0],
            endTime: config.endTime,
            notifications: config.notifications && typeof config.notifications === 'object'
              ? config.notifications
              : { sevenDays: true, threeDays: true, sameDay: true },
            status: calculateStatus(config.startDate, config.endDate),
            createdAt: config.createdAt.toISOString()
          }
        } catch (error) {
          console.error(`Error transformando config ${config.id}:`, error)
          throw error
        }
      })

      return res.json(formatted)
    } catch (error) {
      console.error('Error al obtener configuraciones:', error)
      return res.status(500).json({ error: 'Error al obtener configuraciones' })
    }
  },

  // Crear configuración para múltiples centros de costo
  create: async (req: Request, res: Response) => {
    try {
      const { costCenterIds, startDate, endDate, endTime, notifications } = req.body

      // Validar inputs
      if (!costCenterIds || !Array.isArray(costCenterIds) || costCenterIds.length === 0) {
        return res.status(400).json({
          error: 'costCenterIds debe ser un array no vacío'
        })
      }

      if (!startDate || !endDate || !endTime) {
        return res.status(400).json({
          error: 'Los campos startDate, endDate y endTime son obligatorios'
        })
      }

      // Validar que las fechas sean válidas
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Las fechas no tienen un formato válido'
        })
      }

      if (start >= end) {
        return res.status(400).json({
          error: 'La fecha de inicio debe ser anterior a la fecha de fin'
        })
      }

      // Crear configuraciones para cada centro de costo
      const createdConfigs = []
      const skippedCostCenters = []

      for (const costCenterId of costCenterIds) {
        // Verificar si ya existe configuración vigente para este centro de costo
        const existing = await prisma.deadlineConfig.findFirst({
          where: {
            costCenterId,
            endDate: {
              gte: new Date()
            }
          }
        })

        if (!existing) {
          const config = await prisma.deadlineConfig.create({
            data: {
              costCenterId,
              startDate: start,
              endDate: end,
              endTime,
              notifications: notifications && typeof notifications === 'object' 
                ? notifications 
                : {
                    sevenDays: true,
                    threeDays: true,
                    sameDay: true
                  },
              status: 'PENDING'
            },
            include: {
              costCenter: {
                select: {
                  id: true,
                  code: true,
                  description: true
                }
              }
            }
          })

          createdConfigs.push(config)
        } else {
          skippedCostCenters.push(costCenterId)
        }
      }

      // Si no se creó nada, retornar error
      if (createdConfigs.length === 0) {
        return res.status(400).json({
          error: 'Ya existen configuraciones vigentes para todos los centros de costo seleccionados'
        })
      }

      // Transformar al mismo formato que getAll
      const formatted = createdConfigs.map(config => ({
        id: config.id,
        costCenterId: config.costCenterId,
        costCenterCode: config.costCenter.code,
        costCenterDescription: config.costCenter.description,
        startDate: config.startDate.toISOString().split('T')[0],
        endDate: config.endDate.toISOString().split('T')[0],
        endTime: config.endTime,
        notifications: config.notifications,
        status: calculateStatus(config.startDate, config.endDate),
        createdAt: config.createdAt.toISOString()
      }))

      return res.status(201).json(formatted)
    } catch (error) {
      console.error('Error al crear configuraciones:', error)
      return res.status(500).json({ error: 'Error al crear configuraciones' })
    }
  },

  // Actualizar configuración
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { startDate, endDate, endTime, notifications } = req.body

      // Validar inputs
      if (!id) {
        return res.status(400).json({ error: 'El ID es requerido' })
      }

      if (!startDate || !endDate || !endTime) {
        return res.status(400).json({
          error: 'Los campos startDate, endDate y endTime son obligatorios'
        })
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Las fechas no tienen un formato válido'
        })
      }

      if (start >= end) {
        return res.status(400).json({
          error: 'La fecha de inicio debe ser anterior a la fecha de fin'
        })
      }

      // Verificar que existe la configuración
      const existingConfig = await prisma.deadlineConfig.findUnique({
        where: { id }
      })

      if (!existingConfig) {
        return res.status(404).json({
          error: 'Configuración no encontrada'
        })
      }

      const config = await prisma.deadlineConfig.update({
        where: { id },
        data: {
          startDate: start,
          endDate: end,
          endTime,
          notifications: notifications && typeof notifications === 'object'
            ? notifications
            : {
                sevenDays: true,
                threeDays: true,
                sameDay: true
              }
        },
        include: {
          costCenter: {
            select: {
              id: true,
              code: true,
              description: true
            }
          }
        }
      })

      // Transformar al mismo formato que getAll
      const formatted = {
        id: config.id,
        costCenterId: config.costCenterId,
        costCenterCode: config.costCenter.code,
        costCenterDescription: config.costCenter.description,
        startDate: config.startDate.toISOString().split('T')[0],
        endDate: config.endDate.toISOString().split('T')[0],
        endTime: config.endTime,
        notifications: config.notifications,
        status: calculateStatus(config.startDate, config.endDate),
        createdAt: config.createdAt.toISOString()
      }

      return res.json(formatted)
    } catch (error) {
      console.error('Error al actualizar configuración:', error)
      return res.status(500).json({ error: 'Error al actualizar configuración' })
    }
  },

  // Eliminar configuración
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      if (!id) {
        return res.status(400).json({ error: 'El ID es requerido' })
      }

      // Verificar que existe antes de eliminar
      const existing = await prisma.deadlineConfig.findUnique({
        where: { id }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Configuración no encontrada' })
      }

      await prisma.deadlineConfig.delete({
        where: { id }
      })

      return res.json({ 
        message: 'Configuración eliminada correctamente',
        id 
      })
    } catch (error) {
      console.error('Error al eliminar configuración:', error)
      return res.status(500).json({ error: 'Error al eliminar configuración' })
    }
  },

  // Obtener configuraciones por centro de costo
  getByCostCenter: async (req: Request, res: Response) => {
    try {
      const { costCenterId } = req.params

      if (!costCenterId) {
        return res.status(400).json({ error: 'costCenterId es requerido' })
      }

      const configs = await prisma.deadlineConfig.findMany({
        where: { costCenterId },
        include: {
          costCenter: {
            select: {
              id: true,
              code: true,
              description: true
            }
          }
        },
        orderBy: {
          endDate: 'desc'
        }
      })

      // Transformar al mismo formato que getAll para consistencia
      const formatted = configs.map(config => ({
        id: config.id,
        costCenterId: config.costCenterId,
        costCenterCode: config.costCenter.code,
        costCenterDescription: config.costCenter.description,
        startDate: config.startDate.toISOString().split('T')[0],
        endDate: config.endDate.toISOString().split('T')[0],
        endTime: config.endTime,
        notifications: config.notifications,
        status: calculateStatus(config.startDate, config.endDate),
        createdAt: config.createdAt.toISOString()
      }))

      return res.json(formatted)
    } catch (error) {
      console.error('Error al obtener configuraciones:', error)
      return res.status(500).json({ error: 'Error al obtener configuraciones' })
    }
  }
}

// Función auxiliar para calcular estado
function calculateStatus(startDate: Date | string, endDate: Date | string): 'pending' | 'active' | 'expired' {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    const now = new Date()

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Fechas inválidas en calculateStatus:', { start, end })
      return 'pending'
    }

    if (now < start) {
      return 'pending'
    } else if (now >= start && now <= end) {
      return 'active'
    } else {
      return 'expired'
    }
  } catch (error) {
    console.error('Error en calculateStatus:', error)
    return 'pending'
  }
}
