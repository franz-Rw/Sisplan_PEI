import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const indicatorDataController = {
  // Obtener todos los datos con filtro opcional por estado
  getAll: async (req: Request, res: Response) => {
    try {
      const { status } = req.query

      const where: any = {}
      if (status) {
        // Convertir a mayúsculas para coincidir con el enum DataStatus
        where.status = (status as string).toUpperCase()
      }

      const data = await prisma.indicatorData.findMany({
        where,
        include: {
          variable: {
            include: {
              indicator: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  planId: true,
                  objectiveId: true,
                  actionId: true
                }
              }
            }
          },
          costCenter: {
            select: {
              id: true,
              code: true,
              description: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { costCenterCode: 'asc' }
        ]
      })

      // Convertir los estados a minúsculas para consistencia con el frontend
      const normalizedData = data.map(record => ({
        ...record,
        status: record.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }))

      return res.json(normalizedData)
    } catch (error) {
      console.error('Error al obtener todos los datos de indicadores:', error)
      return res.status(500).json({ error: 'Error al obtener datos' })
    }
  },

  // Obtener datos por variable
  getByVariable: async (req: Request, res: Response) => {
    try {
      const { variableId } = req.params
      const { dateFrom, dateTo, year, costCenterId, status } = req.query

      const where: any = { variableId }

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
        if (dateTo) {
          const endDate = new Date(dateTo as string)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      if (year) where.year = parseInt(year as string)
      if (costCenterId) where.costCenterId = costCenterId as string
      if (status) where.status = (status as string).toUpperCase() // Convertir a mayúsculas

      const data = await prisma.indicatorData.findMany({
        where,
        include: {
          variable: {
            select: {
              id: true,
              code: true,
              name: true,
              fields: true
            }
          },
          costCenter: {
            select: {
              id: true,
              code: true,
              description: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { costCenterCode: 'asc' }
        ]
      })

      // Convertir los estados a minúsculas para consistencia con el frontend
      const normalizedData = data.map(record => ({
        ...record,
        status: record.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }))

      return res.json(normalizedData)
    } catch (error) {
      console.error('Error al obtener datos de variable:', error)
      return res.status(500).json({ error: 'Error al obtener datos' })
    }
  },

  // Obtener un registro específico
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const data = await prisma.indicatorData.findUnique({
        where: { id },
        include: {
          variable: true,
          costCenter: true
        }
      })

      if (!data) {
        return res.status(404).json({ error: 'Registro no encontrado' })
      }

      // Convertir el estado a minúsculas para consistencia con el frontend
      const normalizedData = {
        ...data,
        status: data.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }

      return res.json(normalizedData)
    } catch (error) {
      console.error('Error al obtener registro:', error)
      return res.status(500).json({ error: 'Error al obtener registro' })
    }
  },

  // Crear nuevo registro de datos
  create: async (req: Request, res: Response) => {
    try {
      const { variableId, costCenterId, year, values } = req.body
      const user = (req as any).user

      if (!variableId || !year || !values) {
        return res.status(400).json({
          error: 'Variable, año y valores son obligatorios'
        })
      }

      // Obtener información del centro de costo
      let costCenterCode = 'N/A'
      if (costCenterId) {
        const costCenter = await prisma.costCenter.findUnique({
          where: { id: costCenterId },
          select: { code: true }
        })
        if (costCenter) {
          costCenterCode = costCenter.code
        }
      }

      const data = await prisma.indicatorData.create({
        data: {
          variableId,
          costCenterId: costCenterId || null,
          costCenterCode,
          year,
          values,
          createdBy: user?.email || 'SYSTEM',
          status: 'PENDING'
        },
        include: {
          variable: true,
          costCenter: true
        }
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      const normalizedData = {
        ...data,
        status: data.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }

      return res.status(201).json(normalizedData)
    } catch (error: any) {
      console.error('Error al crear registro:', error)

      // Manejar error de unicidad
      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Ya existe un registro para esta variable, centro de costo y año'
        })
      }

      return res.status(500).json({ error: 'Error al crear registro' })
    }
  },

  // Actualizar registro
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { year, values, status } = req.body
      const user = (req as any).user

      const data = await prisma.indicatorData.update({
        where: { id },
        data: {
          ...(year !== undefined && { year }),
          ...(values !== undefined && { values }),
          ...(status !== undefined && { status }),
          ...(values !== undefined && { updatedBy: user?.email || 'SYSTEM' })
        },
        include: {
          variable: true,
          costCenter: true
        }
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      const normalizedData = {
        ...data,
        status: data.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }

      return res.json(normalizedData)
    } catch (error) {
      console.error('Error al actualizar registro:', error)
      return res.status(500).json({ error: 'Error al actualizar registro' })
    }
  },

  // Eliminar registro
  delete: async (req: Request, res: Response) => {
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
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { status } = req.body
      const user = (req as any).user

      if (!['PENDING', 'APPROVED', 'REJECTED', 'pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      // Convertir a mayúsculas para consistencia en la base de datos
      const normalizedStatus = status.toUpperCase()

      const data = await prisma.indicatorData.update({
        where: { id },
        data: {
          status: normalizedStatus,
          updatedBy: user?.email || 'SYSTEM'
        },
        include: {
          variable: true,
          costCenter: true
        }
      })

      // Convertir el estado a minúsculas para consistencia con el frontend
      const normalizedData = {
        ...data,
        status: data.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }

      return res.json(normalizedData)
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      return res.status(500).json({ error: 'Error al actualizar estado' })
    }
  }
}
