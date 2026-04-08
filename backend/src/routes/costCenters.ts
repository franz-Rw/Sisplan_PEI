import { Router } from 'express'
import { costCentersController } from '../controllers/costCentersController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// GET /api/cost-centers - Obtener todos los centros de costo
router.get('/', costCentersController.getAll)

// GET /api/cost-centers/diagnose - Diagnóstico de código (debe venir antes de :id)
router.get('/diagnose/:code', costCentersController.diagnoseCode)

// GET /api/cost-centers/users - Obtener usuarios para asignación
router.get('/users', costCentersController.getUsersForAssignment)

// GET /api/cost-centers/parents - Obtener centros padres
router.get('/parents', costCentersController.getParentCostCenters)

// POST /api/cost-centers - Crear nuevo centro de costo
router.post('/', costCentersController.create)

// PUT /api/cost-centers/:id - Actualizar centro de costo
router.put('/:id', costCentersController.update)

// DELETE /api/cost-centers/:id - Eliminar centro de costo
router.delete('/:id', costCentersController.delete)

export default router
