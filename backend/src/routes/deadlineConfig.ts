import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { deadlineConfigController } from '../controllers/deadlineConfigController'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Rutas específicas primero
router.get('/cost-center/:costCenterId', deadlineConfigController.getByCostCenter)

// Rutas genéricas
router.get('/', deadlineConfigController.getAll)
router.post('/', deadlineConfigController.create)

// Rutas con ID parametrizado
router.put('/:id', deadlineConfigController.update)
router.delete('/:id', deadlineConfigController.delete)

export default router
