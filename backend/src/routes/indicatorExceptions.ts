import { Router } from 'express'
import { indicatorExceptionsController } from '../controllers/indicatorExceptionsController'

const router = Router()

// Crear una nueva excepción de variable sin datos
router.post('/exception', indicatorExceptionsController.createException)

// Obtener excepciones para administrador
router.get('/exceptions', indicatorExceptionsController.getExceptions)

// Actualizar estado de una excepción
router.put('/exceptions/:id/status', indicatorExceptionsController.updateExceptionStatus)

export default router
