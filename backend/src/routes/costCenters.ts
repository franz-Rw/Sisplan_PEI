import { Router } from 'express'
import { costCentersController } from '../controllers/costCentersController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Las rutas específicas deben ir antes de las parametrizadas (:id)
router.get('/users', costCentersController.getUsersForAssignment)
router.get('/parents', costCentersController.getParentCostCenters)
router.get('/diagnose/:code', costCentersController.diagnoseCode)

// Rutas genéricas
router.get('/', costCentersController.getAll)
router.post('/', costCentersController.create)

// Rutas con ID parametrizado
router.get('/:id', costCentersController.getById)
router.put('/:id', costCentersController.update)
router.delete('/:id', costCentersController.delete)

export default router
