import { Router } from 'express'
import { usersController } from '../controllers/usersController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', authenticate, authorize(['ADMIN']), usersController.getAll)

// GET /api/users/cost-centers - Obtener centros de costo para asignación
router.get('/cost-centers', authenticate, authorize(['ADMIN']), usersController.getCostCentersForAssignment)

// POST /api/users - Crear nuevo usuario (solo admin)
router.post('/', authenticate, authorize(['ADMIN']), usersController.create)

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/:id', authenticate, authorize(['ADMIN']), usersController.update)

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', authenticate, authorize(['ADMIN']), usersController.delete)

export default router
