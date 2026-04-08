import { Router } from 'express'
import { indicatorVariablesController } from '../controllers/indicatorVariablesController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Obtener todas las variables
router.get('/', authenticate, indicatorVariablesController.getAll)

// Variables de indicadores de objetivos estratégicos
router.get('/objectives', authenticate, indicatorVariablesController.getObjectiveIndicatorVariables)
router.get('/objectives/indicators', authenticate, indicatorVariablesController.getObjectiveIndicators)

// Variables de indicadores de acciones estratégicas
router.get('/actions', authenticate, indicatorVariablesController.getActionIndicatorVariables)
router.get('/actions/indicators', authenticate, indicatorVariablesController.getActionIndicators)

// Variables por indicador
router.get('/indicator/:indicatorId', indicatorVariablesController.getByIndicator)

// CRUD de variables
router.post('/', indicatorVariablesController.create)
router.put('/:id', indicatorVariablesController.update)
router.delete('/:id', indicatorVariablesController.delete)

export default router
