import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../config/database'
import { hashPassword, generateToken, comparePassword } from '../utils/auth'

const resolveUserCostCenter = <T extends {
  costCenter?: { id: string; code: string; description: string | null } | null
  assignedCostCenter?: { id: string; code: string; description: string | null } | null
}>(
  user: T | null | undefined
) => user?.costCenter || user?.assignedCostCenter || undefined

export const authController = {
  register: async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, name, role } = req.body

      // Validaciones
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Email, contraseña y nombre son obligatorios',
        })
      }

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(409).json({
          error: 'El email ya está registrado',
        })
      }

      // Encriptar contraseña
      const hashedPassword = await hashPassword(password)

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'OPERATOR',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      // Generar token
      const token = generateToken(user.id, user.role)

      return res.status(201).json({
        user,
        token,
      })
    } catch (error) {
      console.error('Error en registro:', error)
      return res.status(500).json({ error: 'Error al registrar usuario' })
    }
  },

  login: async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body

      console.log('LOGIN - Intento de login:', { email, passwordLength: password?.length })

      // Validaciones
      if (!email || !password) {
        console.log('LOGIN - Error: Email o contraseña faltantes')
        return res.status(400).json({
          error: 'Email y contraseña son obligatorios',
        })
      }

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true,
          status: true,
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

      console.log('LOGIN - Usuario encontrado:', {
        found: !!user,
        email: user?.email,
        role: user?.role,
        status: user?.status,
        hasPassword: !!user?.password
      })

      if (!user) {
        console.log('LOGIN - Error: Usuario no encontrado')
        return res.status(401).json({
          error: 'Credenciales inválidas',
        })
      }

      // Verificar estado del usuario
      if (user.status !== 'ACTIVO') {
        console.log('LOGIN - Error: Usuario no está activo', { status: user.status })
        return res.status(401).json({
          error: 'Usuario inactivo. Contacte al administrador.',
        })
      }

      // Verificar contraseña
      const isPasswordValid = await comparePassword(password, user.password)

      if (!isPasswordValid) {
        console.log('LOGIN - Error: Contraseña inválida')
        return res.status(401).json({
          error: 'Credenciales inválidas',
        })
      }

      // Generar token
      const token = generateToken(user.id, user.role)

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          costCenter: resolveUserCostCenter(user),
        },
        token,
      })
    } catch (error) {
      console.error('Error en login:', error)
      return res.status(500).json({ error: 'Error al iniciar sesión' })
    }
  },

  profile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
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
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      return res.json({
        ...user,
        costCenter: resolveUserCostCenter(user),
      })
    } catch (error) {
      console.error('Error al obtener perfil:', error)
      return res.status(500).json({ error: 'Error al obtener perfil' })
    }
  },
}
