import { Router } from 'express'
import { plansController } from '../controllers/plansController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// GET /api/plans - Obtener todos los planes
router.get('/', (req, _res, next) => {
  console.log('🔍 ROUTER DEBUG - Plans route called')
  console.log('🔍 ROUTER DEBUG - Full URL:', req.originalUrl)
  console.log('🔍 ROUTER DEBUG - Path:', req.path)
  next()
}, plansController.getAll)

// GET /api/plans/:id - Obtener un plan por ID
router.get('/:id', plansController.getById)

// POST /api/plans - Crear nuevo plan
router.post('/', plansController.create)

// PUT /api/plans/:id - Actualizar plan
router.put('/:id', plansController.update)

// DELETE /api/plans/:id - Eliminar plan
router.delete('/:id', plansController.delete)

export default router
