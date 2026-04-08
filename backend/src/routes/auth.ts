import { Router } from 'express'
import { authController } from '../controllers/authController'
import { passwordRecoveryController } from '../controllers/passwordRecoveryController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Autenticación
router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/profile', authenticate, authController.profile)

// Cambio de contraseña (autenticado)
router.post('/change-password', authenticate, passwordRecoveryController.changePassword)

// Recuperación de contraseña (sin autenticar)
router.post('/recovery/initiate', passwordRecoveryController.initiateRecovery)
router.post('/recovery/verify-answer', passwordRecoveryController.verifySecurityAnswer)
router.post('/recovery/reset', passwordRecoveryController.resetPassword)

// Configurar pregunta de seguridad (autenticado, solo admin)
router.post('/security-question', authenticate, passwordRecoveryController.setSecurityQuestion)

export default router
