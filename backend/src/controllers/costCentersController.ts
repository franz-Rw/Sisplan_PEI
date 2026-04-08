import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { CostCenterStatus } from '@prisma/client'

export const costCentersController = {
  // Obtener todos los centros de costo
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, status } = req.query
      
      console.log('Cost centers query params:', { search, status })
      
      // Si hay un status inválido, continuar sin filtrar por status
      let whereClause: any = {}
      
      if (status && Object.values(CostCenterStatus).includes(status as CostCenterStatus)) {
        whereClause.status = status as CostCenterStatus
      }
      
      if (search) {
        whereClause.OR = [
          { code: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      const costCenters = await prisma.costCenter.findMany({
        where: whereClause,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          },
          parent: {
            select: { id: true, code: true, description: true }
          },
          _count: {
            select: { users: true }
          }
        },
        orderBy: { code: 'asc' }
      })

      console.log('Cost centers found:', costCenters.length)
      return res.json(costCenters)
    } catch (error) {
      console.error('Error al obtener centros de costo:', error)
      return res.status(500).json({ error: 'Error al obtener centros de costo' })
    }
  },

  // Endpoint de diagnóstico (solo para admin)
  diagnoseCode: async (req: Request, res: Response) => {
    try {
      const { code } = req.params
      
      if (!code) {
        return res.status(400).json({ error: 'Code parameter required' })
      }

      console.log(`\n🔍 Diagnosticando código: "${code}"\n`)

      // Search with multiple patterns
      const patterns = await prisma.costCenter.findMany({
        where: {
          OR: [
            { code: { equals: code as string } },
            { code: { equals: (code as string).trim() } },
            { code: { contains: code as string, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          code: true,
          description: true,
          status: true,
          parentId: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Analysis
      const analysis = {
        searchedFor: code,
        exactMatches: patterns.filter(p => p.code === code),
        caseInsensitiveMatches: patterns.filter(p => p.code.toLowerCase() === (code as string).toLowerCase()),
        containsMatches: patterns.filter(p => (p.code as string).includes(code as string) && p.code !== code),
        allMatches: patterns,
        totalFound: patterns.length
      }

      // Check for duplicates
      const allCodes = await prisma.costCenter.findMany({
        select: { code: true, id: true }
      })

      const codeMap = new Map()
      allCodes.forEach(cc => {
        if (!codeMap.has(cc.code)) {
          codeMap.set(cc.code, [])
        }
        codeMap.get(cc.code).push(cc.id)
      })

      const duplicates = Array.from(codeMap.entries())
        .filter(([_, ids]) => ids.length > 1)
        .map(([code, ids]) => ({ code, count: ids.length, ids }))

      return res.json({
        analysis,
        duplicates,
        message: `Found ${patterns.length} record(s) matching pattern`
      })
    } catch (error) {
      console.error('Diagnosis error:', error)
      return res.status(500).json({ error: 'Diagnosis failed' })
    }
  },

  // Obtener usuarios para asignación
  getUsersForAssignment: async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' }
      })

      return res.json(users)
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      return res.status(500).json({ error: 'Error al obtener usuarios' })
    }
  },

  // Obtener centros de costo padres (para selector jerárquico)
  getParentCostCenters: async (_req: Request, res: Response) => {
    try {
      const costCenters = await prisma.costCenter.findMany({
        where: {
          status: 'ACTIVO'
        },
        select: {
          id: true,
          code: true,
          description: true,
          parentId: true,
          parent: {
            select: {
              code: true,
              description: true
            }
          }
        },
        orderBy: { code: 'asc' }
      })

      return res.json(costCenters)
    } catch (error) {
      console.error('Error al obtener centros padres:', error)
      return res.status(500).json({ error: 'Error al obtener centros padres' })
    }
  },

  // Crear nuevo centro de costo
  create: async (req: Request, res: Response) => {
    try {
      const {
        code,
        description,
        parentId,
        assignedUserId,
        status = CostCenterStatus.ACTIVO
      } = req.body

      console.log('CREATE - Request body:', { code, description, parentId, assignedUserId, status })

      // Validaciones
      if (!code || code.trim() === '') {
        return res.status(400).json({
          error: 'El código es obligatorio'
        })
      }

      // Verificar que el código no exista (case-insensitive)
      const existingCostCenter = await prisma.costCenter.findFirst({
        where: { 
          code: {
            equals: code.trim(),
            mode: 'insensitive'
          }
        }
      })

      console.log('CREATE - Existing cost center:', existingCostCenter)

      if (existingCostCenter) {
        console.log('CREATE - Code already exists:', code)
        return res.status(409).json({
          error: `El código de centro de costo "${code}" ya existe en el sistema`
        })
      }

      // Validate parent if provided
      if (parentId) {
        const parentExists = await prisma.costCenter.findUnique({
          where: { id: parentId }
        })
        if (!parentExists) {
          return res.status(400).json({
            error: 'El centro de costo padre no existe'
          })
        }
      }

      const costCenter = await prisma.costCenter.create({
        data: {
          code: code.trim(),
          description: description?.trim() || null,
          parentId: parentId || null,
          assignedUserId: assignedUserId || null,
          status: status as CostCenterStatus
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          },
          parent: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      console.log('CREATE - Cost center created successfully:', costCenter)
      return res.status(201).json(costCenter)
    } catch (error: any) {
      console.error('Error al crear centro de costo:', error)
      
      // Handle unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        return res.status(409).json({ 
          error: `Ya existe un registro con este ${field === 'code' ? 'código' : 'valor'}`
        })
      }
      
      return res.status(500).json({ error: 'Error al crear centro de costo' })
    }
  },

  // Actualizar centro de costo
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        code,
        description,
        parentId,
        assignedUserId,
        status
      } = req.body

      console.log('UPDATE - Request params:', { id })
      console.log('UPDATE - Request body:', { code, description, parentId, assignedUserId, status })

      // Get the current cost center to compare
      const currentCostCenter = await prisma.costCenter.findUnique({
        where: { id }
      })

      if (!currentCostCenter) {
        return res.status(404).json({
          error: 'El centro de costo no existe'
        })
      }

      // Validar código si se está intentando cambiar
      if (code && code.trim() !== currentCostCenter.code) {
        const existingCostCenter = await prisma.costCenter.findFirst({
          where: {
            code: {
              equals: code.trim(),
              mode: 'insensitive'
            },
            id: { not: id }
          }
        })

        console.log('UPDATE - Existing cost center with same code:', existingCostCenter)

        if (existingCostCenter) {
          console.log('UPDATE - Code already exists in another record:', code)
          return res.status(409).json({
            error: `El código "${code}" ya está asignado a otro centro de costo`
          })
        }
      }

      // Validate parent if provided and changed
      if (parentId !== undefined && parentId !== currentCostCenter.parentId) {
        if (parentId) {
          const parentExists = await prisma.costCenter.findUnique({
            where: { id: parentId }
          })
          if (!parentExists) {
            return res.status(400).json({
              error: 'El centro de costo padre no existe'
            })
          }

          // Check for circular reference
          if (parentId === id) {
            return res.status(400).json({
              error: 'Un centro de costo no puede ser su propio padre'
            })
          }
        }
      }

      const costCenter = await prisma.costCenter.update({
        where: { id },
        data: {
          ...(code && { code: code.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(parentId !== undefined && { parentId: parentId || null }),
          ...(assignedUserId !== undefined && { assignedUserId: assignedUserId || null }),
          ...(status && { status: status as CostCenterStatus })
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          },
          parent: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      console.log('UPDATE - Cost center updated successfully:', costCenter)
      return res.json(costCenter)
    } catch (error: any) {
      console.error('Error al actualizar centro de costo:', error)
      
      // Handle unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        return res.status(409).json({ 
          error: `Ya existe un registro con este ${field === 'code' ? 'código' : 'valor'}`
        })
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'El centro de costo no existe'
        })
      }

      return res.status(500).json({ error: 'Error al actualizar centro de costo' })
    }
  },

  // Eliminar centro de costo
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Verificar si tiene usuarios asignados
      const usersCount = await prisma.user.count({
        where: { costCenterId: id }
      })

      if (usersCount > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el centro de costo porque tiene usuarios asignados'
        })
      }

      // Verificar si tiene centros hijos
      const childrenCount = await prisma.costCenter.count({
        where: { parentId: id }
      })

      if (childrenCount > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el centro de costo porque tiene centros hijos'
        })
      }

      await prisma.costCenter.delete({
        where: { id }
      })

      return res.json({ message: 'Centro de costo eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar centro de costo:', error)
      return res.status(500).json({ error: 'Error al eliminar centro de costo' })
    }
  }
}
