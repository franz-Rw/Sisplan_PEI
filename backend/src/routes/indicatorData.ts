import { Router } from 'express'
import { indicatorDataController } from '../controllers/indicatorDataController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Rutas de datos de indicadores
// NOTA: La ruta específica debe ir antes de la ruta con parámetro
router.get('/variable/:variableId', authenticate, indicatorDataController.getByVariable)
router.get('/all', authenticate, indicatorDataController.getAll) // Cambiada a /all para evitar conflicto
router.get('/:id', authenticate, indicatorDataController.getById)
router.post('/', authenticate, indicatorDataController.create)
router.put('/:id', authenticate, indicatorDataController.update)
router.delete('/:id', authenticate, indicatorDataController.delete)
router.patch('/:id', authenticate, indicatorDataController.updateStatus)

export default router
