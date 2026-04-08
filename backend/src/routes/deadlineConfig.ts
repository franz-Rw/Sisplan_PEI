import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { deadlineConfigController } from '../controllers/deadlineConfigController'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Rutas
router.get('/', deadlineConfigController.getAll)
router.post('/', deadlineConfigController.create)
router.put('/:id', deadlineConfigController.update)
router.delete('/:id', deadlineConfigController.delete)
router.get('/cost-center/:costCenterId', deadlineConfigController.getByCostCenter)

export default router
