import { Router } from 'express'
import {
  getIndicatorResults,
  createIndicatorResult,
  updateIndicatorResult,
  deleteIndicatorResult
} from '../controllers/indicatorResultsController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize(['ADMIN']))

// Obtener resultados de un indicador
router.get('/indicator/:indicatorId', getIndicatorResults)

// Crear nuevo resultado
router.post('/', createIndicatorResult)

// Actualizar resultado
router.put('/:id', updateIndicatorResult)

// Eliminar resultado
router.delete('/:id', deleteIndicatorResult)

export default router
