import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { hashPassword, comparePassword, generateRecoveryToken } from '../utils/auth'

export const passwordRecoveryController = {
  /**
   * Inicia recuperación verificando preguntas de seguridad
   */
  initiateRecovery: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({ error: 'Email requerido' })
      }

      const user = await prisma.user.findUnique({ where: { email } })

      if (!user) {
        // Por seguridad, no revelamos si el email existe
        return res.status(200).json({ 
          message: 'Si el email existe, recibirá instrucciones' 
        })
      }

      // Solo admin tiene recuperación con preguntas
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Solo administrador puede recuperar contraseña' 
        })
      }

      // Retorna la pregunta de seguridad si está configurada
      if (!user.securityQuestion) {
        return res.status(200).json({
          message: 'Contacte al administrador del sistema',
          requiresSetup: true
        })
      }

      return res.status(200).json({
        securityQuestion: user.securityQuestion,
        recoveryMethod: 'security_question'
      })
    } catch (error) {
      console.error('Error en initiateRecovery:', error)
      return res.status(500).json({ error: 'Error al iniciar recuperación' })
    }
  },

  /**
   * Verifica respuesta de seguridad
   */
  verifySecurityAnswer: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, securityAnswer } = req.body

      if (!email || !securityAnswer) {
        return res.status(400).json({ error: 'Email y respuesta requeridos' })
      }

      const user = await prisma.user.findUnique({ where: { email } })

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      // Comparar respuesta (case-insensitive)
      const isCorrect = await comparePassword(
        securityAnswer.toLowerCase(),
        user.securityAnswer
      )

      if (!isCorrect) {
        return res.status(401).json({ error: 'Respuesta incorrecta' })
      }

      // Generar token temporal de reset (30 minutos)
      const resetToken = generateRecoveryToken(user.id, '30m')

      return res.status(200).json({
        resetToken,
        message: 'Respuesta verificada. Use el token para cambiar contraseña'
      })
    } catch (error) {
      console.error('Error en verifySecurityAnswer:', error)
      return res.status(500).json({ error: 'Error al verificar respuesta' })
    }
  },

  /**
   * Cambiar contraseña con token de recuperación
   */
  resetPassword: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { resetToken, newPassword, confirmPassword } = req.body

      if (!resetToken || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          error: 'Token y nuevas contraseñas requeridas' 
        })
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          error: 'Las contraseñas no coinciden' 
        })
      }

      // Validar contraseña fuerte
      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: 'Contraseña debe tener mínimo 8 caracteres' 
        })
      }

      // Verificar token (implementar según JWT library)
      // Por ahora asumimos que el token es válido
      // En producción, verificar la firma del JWT

      // Asumir que el token contiene el userId (verificar en middleware)
      // Por seguridad, usar un endpoint diferente autenticado
      return res.status(400).json({
        error: 'Use el endpoint autenticado para cambiar contraseña'
      })
    } catch (error) {
      console.error('Error en resetPassword:', error)
      return res.status(500).json({ error: 'Error al cambiar contraseña' })
    }
  },

  /**
   * Cambiar contraseña (autenticado) - para primer login obligatorio
   */
  changePassword: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req as any
      const { currentPassword, newPassword, confirmPassword } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' })
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' })
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: 'Contraseña debe tener mínimo 8 caracteres' 
        })
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      // Verificar contraseña actual
      const isPasswordValid = await comparePassword(currentPassword, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' })
      }

      // Actualizar contraseña
      const hashedPassword = await hashPassword(newPassword)

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          lastPasswordChange: new Date(),
          mustChangePassword: false, // Marcar como realizado
        },
      })

      return res.status(200).json({
        message: 'Contraseña cambiada exitosamente'
      })
    } catch (error) {
      console.error('Error en changePassword:', error)
      return res.status(500).json({ error: 'Error al cambiar contraseña' })
    }
  },

  /**
   * Configurar pregunta de seguridad (solo admin)
   */
  setSecurityQuestion: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req as any
      const { securityQuestion, securityAnswer } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      if (!securityQuestion || !securityAnswer) {
        return res.status(400).json({ 
          error: 'Pregunta y respuesta requeridas' 
        })
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Solo administrador puede configurar pregunta de seguridad' 
        })
      }

      // Hashear respuesta
      const hashedAnswer = await hashPassword(securityAnswer.toLowerCase())

      await prisma.user.update({
        where: { id: userId },
        data: {
          securityQuestion,
          securityAnswer: hashedAnswer,
        },
      })

      return res.status(200).json({
        message: 'Pregunta de seguridad configurada'
      })
    } catch (error) {
      console.error('Error en setSecurityQuestion:', error)
      return res.status(500).json({ error: 'Error al configurar pregunta' })
    }
  },
}
