import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'

type IndicatorDataStatus = 'draft' | 'pending' | 'approved' | 'rejected'

const VALID_DATA_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const
type PersistedDataStatus = (typeof VALID_DATA_STATUSES)[number]

const isValidDataStatus = (status: string): status is PersistedDataStatus =>
  VALID_DATA_STATUSES.includes(status as PersistedDataStatus)

const normalizeDataStatus = (status: string): PersistedDataStatus => status.toUpperCase() as PersistedDataStatus

type CostCenterSnapshot = {
  id: string
  code: string
  description: string | null
}

const serializeIndicatorData = <T extends { status: string }>(record: T) => ({
  ...record,
  status: record.status.toLowerCase() as IndicatorDataStatus,
})

const indicatorDataInclude = {
  variable: {
    select: {
      id: true,
      code: true,
      name: true,
      fields: true,
      indicator: {
        select: {
          id: true,
          code: true,
          statement: true,
          planId: true,
          objectiveId: true,
          actionId: true,
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
          objective: {
            select: {
              id: true,
              code: true,
              statement: true,
            },
          },
          action: {
            select: {
              id: true,
              code: true,
              statement: true,
              objective: {
                select: {
                  id: true,
                  code: true,
                  statement: true,
                },
              },
            },
          },
        },
      },
    },
  },
  costCenter: {
    select: {
      id: true,
      code: true,
      description: true,
    },
  },
} as const

const getAuthenticatedUserEmail = async (req: AuthRequest) => {
  if (!req.userId) {
    return 'SYSTEM'
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true },
  })

  return user?.email || 'SYSTEM'
}

const resolveUserCostCenter = <T extends {
  costCenter?: CostCenterSnapshot | null
  assignedCostCenter?: CostCenterSnapshot | null
}>(
  user: T | null | undefined
): CostCenterSnapshot | null => user?.costCenter || user?.assignedCostCenter || null

const resolveCostCenterContext = async (req: AuthRequest, explicitCostCenterId?: string | null) => {
  if (explicitCostCenterId) {
    const costCenter = await prisma.costCenter.findUnique({
      where: { id: explicitCostCenterId },
      select: {
        id: true,
        code: true,
      },
    })

    return {
      costCenterId: costCenter?.id || explicitCostCenterId,
      costCenterCode: costCenter?.code || 'N/A',
    }
  }

  if (!req.userId) {
    return {
      costCenterId: null,
      costCenterCode: 'N/A',
    }
  }

  const authenticatedUser = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      costCenter: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      assignedCostCenter: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  })

  const resolvedCostCenter = resolveUserCostCenter(authenticatedUser)

  return {
    costCenterId: resolvedCostCenter?.id || null,
    costCenterCode: resolvedCostCenter?.code || 'N/A',
  }
}

const withResolvedCostCenters = async <
  T extends {
    createdBy: string
    costCenterId: string | null
    costCenterCode: string
    costCenter?: CostCenterSnapshot | null
  }
>(records: T[]): Promise<T[]> => {
  const missingCostCenterEmails = Array.from(
    new Set(
      records
        .filter(record => !record.costCenterId && !record.costCenter)
        .map(record => record.createdBy)
        .filter(Boolean)
    )
  )

  if (missingCostCenterEmails.length === 0) {
    return records
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: missingCostCenterEmails,
      },
    },
    select: {
      email: true,
      costCenter: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      assignedCostCenter: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  })

  const userCostCenterMap = new Map(
    users.map(user => [user.email, resolveUserCostCenter(user)])
  )

  return records.map(record => {
    if (record.costCenterId || record.costCenter) {
      return record
    }

    const fallbackCostCenter = userCostCenterMap.get(record.createdBy)
    if (!fallbackCostCenter) {
      return record
    }

    return {
      ...record,
      costCenterId: fallbackCostCenter.id,
      costCenterCode: fallbackCostCenter.code,
      costCenter: fallbackCostCenter,
    }
  })
}

export const indicatorDataController = {
  // Obtener todos los datos con filtro opcional por estado
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query

      // Obtener el costCenter del usuario si es OPERATOR
      const userCostCenter = await resolveCostCenterContext(req)
      
      const where: Record<string, unknown> = {}
      
      if (status) {
        // Convertir a mayúsculas para coincidir con el enum DataStatus
        where.status = normalizeDataStatus(status as string)
      }

      // Si es operador, filtrar por su centro de costo
      if (userCostCenter.costCenterId) {
        where.costCenterId = userCostCenter.costCenterId
      }
      
      // También permitir filtro explícito por costCenterId
      if (req.query.costCenterId) {
        where.costCenterId = req.query.costCenterId as string
      }

      const data = await prisma.indicatorData.findMany({
        where,
        include: indicatorDataInclude,
        orderBy: [{ createdAt: 'desc' }, { costCenterCode: 'asc' }]
      })

      // Convertir los estados a minúsculas para consistencia con el frontend
      const resolvedData = await withResolvedCostCenters(data)
      return res.json(resolvedData.map(serializeIndicatorData))
    } catch (error) {
      console.error('Error al obtener todos los datos de indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener datos' })
    }
  },

  // Obtener datos por variable
  getByVariable: async (req: AuthRequest, res: Response) => {
    try {
      const { variableId } = req.params
      const { dateFrom, dateTo, year, costCenterId, status } = req.query

      const where: Record<string, unknown> = { variableId }

      if (dateFrom || dateTo) {
        const createdAt: { gte?: Date; lte?: Date } = {}
        if (dateFrom) createdAt.gte = new Date(dateFrom as string)
        if (dateTo) {
          const endDate = new Date(dateTo as string)
          endDate.setHours(23, 59, 59, 999)
          createdAt.lte = endDate
        }
        where.createdAt = createdAt
      }

      if (year) where.year = parseInt(year as string, 10)
      if (costCenterId) where.costCenterId = costCenterId as string
      if (status) where.status = normalizeDataStatus(status as string)

      const data = await prisma.indicatorData.findMany({
        where,
        include: indicatorDataInclude,
        orderBy: [{ createdAt: 'desc' }, { costCenterCode: 'asc' }]
      })

      // Convertir los estados a minúsculas para consistencia con el frontend
      const resolvedData = await withResolvedCostCenters(data)
      return res.json(resolvedData.map(serializeIndicatorData))
    } catch (error) {
      console.error('Error al obtener datos de variable:', error)
      return res.status(500).json({ error: 'Error al obtener datos' })
    }
  },

  // Obtener un registro específico
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const data = await prisma.indicatorData.findUnique({
        where: { id },
        include: indicatorDataInclude
      })

      if (!data) {
        return res.status(404).json({ error: 'Registro no encontrado' })
      }

      // Convertir el estado a minúsculas para consistencia con el frontend
      const [resolvedData] = await withResolvedCostCenters([data])
      return res.json(serializeIndicatorData(resolvedData))
    } catch (error) {
      console.error('Error al obtener registro:', error)
      return res.status(500).json({ error: 'Error al obtener registro' })
    }
  },

  // Crear nuevo registro de datos
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { variableId, costCenterId, year, values, status } = req.body
      if (!variableId || !year || !values) {
        return res.status(400).json({
          error: 'Variable, año y valores son obligatorios'
        })
      }

      // Obtener información del centro de costo
      const requestedStatus = status ? normalizeDataStatus(status) : 'DRAFT'
      if (!isValidDataStatus(requestedStatus)) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      const userEmail = await getAuthenticatedUserEmail(req)
      const resolvedCostCenter = await resolveCostCenterContext(req, costCenterId)


      const data = await prisma.indicatorData.create({
        data: {
          variableId,
          costCenterId: resolvedCostCenter.costCenterId,
          costCenterCode: resolvedCostCenter.costCenterCode,
          year: Number(year),
          values,
          createdBy: userEmail,
          status: requestedStatus
        },
        include: indicatorDataInclude
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      return res.status(201).json(serializeIndicatorData(data))
    } catch (error: unknown) {
      console.error('Error al crear registro:', error)

      // Manejar error de unicidad
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(400).json({
          error: 'Ya existe un registro para esta variable, centro de costo y año'
        })
      }

      return res.status(500).json({ error: 'Error al crear registro' })
    }
  },

  // Actualizar registro
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { year, values, status } = req.body

      if (status && !isValidDataStatus(normalizeDataStatus(status))) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      const userEmail = await getAuthenticatedUserEmail(req)

      const data = await prisma.indicatorData.update({
        where: { id },
        data: {
          ...(year !== undefined && { year: Number(year) }),
          ...(values !== undefined && { values }),
          ...(status !== undefined && { status: normalizeDataStatus(status) }),
          updatedBy: userEmail
        },
        include: indicatorDataInclude
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      return res.json(serializeIndicatorData(data))
    } catch (error) {
      console.error('Error al actualizar registro:', error)
      return res.status(500).json({ error: 'Error al actualizar registro' })
    }
  },

  // Eliminar registro
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      await prisma.indicatorData.delete({
        where: { id }
      })

      return res.json({ message: 'Registro eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar registro:', error)
      return res.status(500).json({ error: 'Error al eliminar registro' })
    }
  },

  // Cambiar estado (aprobado/rechazado)
  updateStatus: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!['PENDING', 'APPROVED', 'REJECTED', 'pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      // Convertir a mayúsculas para consistencia en la base de datos
      const userEmail = await getAuthenticatedUserEmail(req)
      const normalizedStatus = normalizeDataStatus(status)

      const data = await prisma.indicatorData.update({
        where: { id },
        data: {
          status: normalizedStatus,
          updatedBy: userEmail
        },
        include: indicatorDataInclude
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      return res.json(serializeIndicatorData(data))
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      return res.status(500).json({ error: 'Error al actualizar estado' })
    }
  }
}
