import { Router } from 'express'
import { plansController } from '../controllers/plansController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// GET /api/plans - Obtener todos los planes
router.get('/', plansController.getAll)

// POST /api/plans - Crear nuevo plan
router.post('/', plansController.create)

// PUT /api/plans/:id - Actualizar plan
router.put('/:id', plansController.update)

// DELETE /api/plans/:id - Eliminar plan
router.delete('/:id', plansController.delete)

export default router
