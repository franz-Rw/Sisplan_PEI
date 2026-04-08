import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { UserStatus, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const usersController = {
  // Obtener todos los usuarios
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, role, status, costCenterId } = req.query
      
      const users = await prisma.user.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } }
            ]
          }),
          ...(role && { role: role as Role }),
          ...(status && { status: status as UserStatus }),
          ...(costCenterId && { costCenterId: costCenterId as string })
        },
        include: {
          costCenter: {
            select: { id: true, code: true, description: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return res.json(users)
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      return res.status(500).json({ error: 'Error al obtener usuarios' })
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

  // Crear nuevo usuario
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        role = Role.OPERATOR,
        costCenterId,
        status = UserStatus.ACTIVO
      } = req.body

      // Validaciones
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Nombre, email y contraseña son obligatorios'
        })
      }

      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(409).json({
          error: 'El email ya está registrado'
        })
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as Role,
          costCenterId: costCenterId || null,
          status: status as UserStatus
        },
        include: {
          costCenter: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      // Remover contraseña del response
      const { password: _, ...userWithoutPassword } = user

      return res.status(201).json(userWithoutPassword)
    } catch (error) {
      console.error('Error al crear usuario:', error)
      return res.status(500).json({ error: 'Error al crear usuario' })
    }
  },

  // Actualizar usuario
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        name,
        email,
        password,
        role,
        costCenterId,
        status
      } = req.body

      // Verificar si el email ya existe (si se está cambiando)
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: id }
          }
        })

        if (existingUser) {
          return res.status(409).json({
            error: 'El email ya está registrado'
          })
        }
      }

      const updateData: any = {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role as Role }),
        ...(costCenterId !== undefined && { costCenterId: costCenterId || null }),
        ...(status && { status: status as UserStatus })
      }

      // Agregar contraseña solo si se proporciona
      if (password) {
        updateData.password = await bcrypt.hash(password, 10)
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          costCenter: {
            select: { id: true, code: true, description: true }
          }
        }
      })

      // Remover contraseña del response
      const { password: _, ...userWithoutPassword } = user

      return res.json(userWithoutPassword)
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      return res.status(500).json({ error: 'Error al actualizar usuario' })
    }
  },

  // Eliminar usuario
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // No permitir eliminar al propio usuario
      // TODO: Implementar verificación de usuario actual

      await prisma.user.delete({
        where: { id }
      })

      return res.json({ message: 'Usuario eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      return res.status(500).json({ error: 'Error al eliminar usuario' })
    }
  }
}
