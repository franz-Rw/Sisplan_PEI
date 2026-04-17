import { Router } from 'express'
import { indicatorAssignmentController } from '../controllers/indicatorAssignmentController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Rutas públicas para administradores y operadores
router.get('/', authorize(['ADMIN', 'OPERATOR']), indicatorAssignmentController.getAllAssignments)
router.get('/available-indicators', authorize(['ADMIN', 'OPERATOR']), indicatorAssignmentController.getAvailableIndicators)
router.get('/available-users', authorize(['ADMIN', 'OPERATOR']), indicatorAssignmentController.getAvailableUsers)
router.get('/dashboard', authorize(['ADMIN', 'OPERATOR']), indicatorAssignmentController.getAssignmentDashboard)

// Rutas restringidas a administradores
router.post('/', authorize(['ADMIN']), indicatorAssignmentController.createAssignment)
router.put('/:id', authorize(['ADMIN']), indicatorAssignmentController.updateAssignment)
router.delete('/:id', authorize(['ADMIN']), indicatorAssignmentController.deleteAssignment)

export default router
