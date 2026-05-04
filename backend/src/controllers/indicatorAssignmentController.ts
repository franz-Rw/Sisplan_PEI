import { Request, Response } from 'express'
import { prisma } from '../config/database'

const serializeAssignment = (assignment: any) => {
  const { assigner, deleter, ...rest } = assignment

  return {
    ...rest,
    assignedBy: assigner || null,
    deletedByUser: deleter || null,
  }
}

export const indicatorAssignmentController = {
  // Obtener todas las asignaciones con filtros
  getAllAssignments: async (req: Request, res: Response) => {
    try {
      const {
        search,
        userId,
        indicatorId,
        costCenterId,
        status,
        page = 1,
        limit = 20,
      } = req.query

      const whereClause: any = {}

      if (userId) whereClause.userId = userId
      if (indicatorId) whereClause.indicatorId = indicatorId
      if (costCenterId) whereClause.indicator = { responsibleId: String(costCenterId) }
      if (status) whereClause.status = status
      if (search) {
        whereClause.OR = [
          { user: { name: { contains: String(search), mode: 'insensitive' } } },
          { user: { email: { contains: String(search), mode: 'insensitive' } } },
          { indicator: { code: { contains: String(search), mode: 'insensitive' } } },
          { indicator: { statement: { contains: String(search), mode: 'insensitive' } } },
        ]
      }

      const [assignments, total] = await Promise.all([
        prisma.indicatorAssignment.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
            indicator: {
              include: {
                objective: { select: { code: true, statement: true } },
                action: { select: { code: true, statement: true } },
                responsible: { select: { code: true, description: true } },
              },
            },
            assigner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.indicatorAssignment.count({ where: whereClause }),
      ])

      return res.json({
        assignments: assignments.map(serializeAssignment),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      console.error('Error al obtener asignaciones:', error)
      return res.status(500).json({ error: 'Error al obtener asignaciones' })
    }
  },

  // Obtener indicadores disponibles para asignar
  getAvailableIndicators: async (req: Request, res: Response) => {
    try {
      const { costCenterId, excludeAssigned = 'true' } = req.query

      const whereClause: any = {}

      if (costCenterId) {
        whereClause.responsibleId = String(costCenterId)
      }

      if (excludeAssigned === 'true') {
        const assignedIndicatorIds = await prisma.indicatorAssignment.findMany({
          where: { status: 'ACTIVE' },
          select: { indicatorId: true },
        })

        whereClause.id = {
          notIn: assignedIndicatorIds.map((assignment: { indicatorId: string }) => assignment.indicatorId),
        }
      }

      const indicators = await prisma.indicator.findMany({
        where: whereClause,
        include: {
          objective: { select: { code: true, statement: true } },
          action: { select: { code: true, statement: true } },
          responsible: { select: { code: true, description: true } },
          _count: {
            select: {
              indicatorValues: true,
              indicatorVariables: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      })

      return res.json(indicators)
    } catch (error) {
      console.error('Error al obtener indicadores disponibles:', error)
      return res.status(500).json({ error: 'Error al obtener indicadores disponibles' })
    }
  },

  // Obtener usuarios disponibles para asignacion
  getAvailableUsers: async (req: Request, res: Response) => {
    try {
      const { costCenterId, role } = req.query

      const whereClause: any = { status: 'ACTIVO' }

      if (role) whereClause.role = role
      if (costCenterId) {
        whereClause.OR = [
          { costCenterId: String(costCenterId) },
          { assignedCostCenter: { id: String(costCenterId) } },
        ]
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          costCenter: { select: { id: true, code: true, description: true } },
          assignedCostCenter: { select: { id: true, code: true, description: true } },
          _count: {
            select: {
              assignedIndicators: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return res.json(users)
    } catch (error) {
      console.error('Error al obtener usuarios disponibles:', error)
      return res.status(500).json({ error: 'Error al obtener usuarios disponibles' })
    }
  },

  // Crear nueva asignacion
  createAssignment: async (req: Request, res: Response) => {
    try {
      const { indicatorId, userId, notes, validFrom, validTo, assignedBy } = req.body

      if (!indicatorId || !userId) {
        return res.status(400).json({
          error: 'El indicador y el usuario son obligatorios',
        })
      }

      const indicator = await prisma.indicator.findUnique({
        where: { id: indicatorId },
      })

      if (!indicator) {
        return res.status(404).json({
          error: 'El indicador no existe',
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return res.status(404).json({
          error: 'El usuario no existe',
        })
      }

      const existingAssignment = await prisma.indicatorAssignment.findFirst({
        where: {
          indicatorId,
          userId,
          status: 'ACTIVE',
        },
      })

      if (existingAssignment) {
        return res.status(409).json({
          error: 'El usuario ya tiene asignado este indicador',
        })
      }

      const assignment = await prisma.indicatorAssignment.create({
        data: {
          indicatorId,
          userId,
          notes: notes || '',
          validFrom: validFrom ? new Date(validFrom) : new Date(),
          validTo: validTo ? new Date(validTo) : null,
          assignedBy: assignedBy || null,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          assigner: {
            select: { id: true, name: true, email: true },
          },
          indicator: {
            include: {
              objective: { select: { code: true, statement: true } },
              action: { select: { code: true, statement: true } },
            },
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'INDICATOR_ASSIGNED',
          entityType: 'INDICATOR_ASSIGNMENT',
          entityId: assignment.id,
          userId: assignedBy || null,
          details: {
            indicatorId,
            userId,
            indicatorCode: indicator.code,
            userName: user.name,
            timestamp: new Date(),
          },
        },
      })

      return res.status(201).json({
        message: 'Asignacion creada exitosamente',
        assignment: serializeAssignment(assignment),
      })
    } catch (error) {
      console.error('Error al crear asignacion:', error)
      return res.status(500).json({ error: 'Error al crear asignacion' })
    }
  },

  // Actualizar asignacion
  updateAssignment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { status, notes, validFrom, validTo, updatedBy } = req.body

      const existingAssignment = await prisma.indicatorAssignment.findUnique({
        where: { id },
      })

      if (!existingAssignment) {
        return res.status(404).json({
          error: 'Asignacion no encontrada',
        })
      }

      const updatedAssignment = await prisma.indicatorAssignment.update({
        where: { id },
        data: {
          status: status || existingAssignment.status,
          notes: notes !== undefined ? notes : existingAssignment.notes,
          validFrom: validFrom ? new Date(validFrom) : existingAssignment.validFrom,
          validTo: validTo !== undefined ? (validTo ? new Date(validTo) : null) : existingAssignment.validTo,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          assigner: {
            select: { id: true, name: true, email: true },
          },
          indicator: {
            include: {
              objective: { select: { code: true, statement: true } },
              action: { select: { code: true, statement: true } },
            },
          },
        },
      })

      if (status && status !== existingAssignment.status) {
        await prisma.auditLog.create({
          data: {
            action: 'INDICATOR_ASSIGNMENT_UPDATED',
            entityType: 'INDICATOR_ASSIGNMENT',
            entityId: id,
            userId: updatedBy || null,
            details: {
              assignmentId: id,
              oldStatus: existingAssignment.status,
              newStatus: status,
              timestamp: new Date(),
            },
          },
        })
      }

      return res.json({
        message: 'Asignacion actualizada exitosamente',
        assignment: serializeAssignment(updatedAssignment),
      })
    } catch (error) {
      console.error('Error al actualizar asignacion:', error)
      return res.status(500).json({ error: 'Error al actualizar asignacion' })
    }
  },

  // Eliminar asignacion (soft delete)
  deleteAssignment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { deletedBy, reason } = req.body

      const existingAssignment = await prisma.indicatorAssignment.findUnique({
        where: { id },
      })

      if (!existingAssignment) {
        return res.status(404).json({
          error: 'Asignacion no encontrada',
        })
      }

      await prisma.indicatorAssignment.update({
        where: { id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          deletedBy: deletedBy || null,
          deletionReason: reason || '',
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'INDICATOR_ASSIGNMENT_DELETED',
          entityType: 'INDICATOR_ASSIGNMENT',
          entityId: id,
          userId: deletedBy || null,
          details: {
            assignmentId: id,
            reason: reason || 'No especificada',
            timestamp: new Date(),
          },
        },
      })

      return res.json({
        message: 'Asignacion eliminada exitosamente',
      })
    } catch (error) {
      console.error('Error al eliminar asignacion:', error)
      return res.status(500).json({ error: 'Error al eliminar asignacion' })
    }
  },

  // Obtener dashboard de asignaciones
  getAssignmentDashboard: async (req: Request, res: Response) => {
    try {
      const { costCenterId, userId } = req.query

      const whereClause: any = {}

      if (costCenterId) {
        whereClause.indicator = { responsibleId: String(costCenterId) }
      }

      if (userId) {
        whereClause.userId = userId
      }

      const [
        totalAssignments,
        activeAssignments,
        expiredAssignments,
        assignmentsByStatus,
        recentAssignments,
      ] = await Promise.all([
        prisma.indicatorAssignment.count({ where: whereClause }),
        prisma.indicatorAssignment.count({
          where: { ...whereClause, status: 'ACTIVE' },
        }),
        prisma.indicatorAssignment.count({
          where: {
            ...whereClause,
            status: 'ACTIVE',
            validTo: { lt: new Date() },
          },
        }),
        prisma.indicatorAssignment.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        prisma.indicatorAssignment.findMany({
          where: whereClause,
          include: {
            user: { select: { name: true, email: true } },
            indicator: { select: { code: true, statement: true } },
            assigner: { select: { id: true, name: true, email: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        }),
      ])

      return res.json({
        summary: {
          total: totalAssignments,
          active: activeAssignments,
          expired: expiredAssignments,
          byStatus: assignmentsByStatus.reduce<Record<string, number>>((acc, item) => {
            const groupCount = item._count as any
            const count =
              typeof groupCount === 'number'
                ? groupCount
                : groupCount.status ?? groupCount._all ?? 0

            acc[item.status] = count
            return acc
          }, {}),
        },
        recent: recentAssignments.map(serializeAssignment),
      })
    } catch (error) {
      console.error('Error al obtener dashboard de asignaciones:', error)
      return res.status(500).json({ error: 'Error al obtener dashboard de asignaciones' })
    }
  },
}
