import { Router } from 'express'
import { reportsController } from '../controllers/reportsController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize(['ADMIN']))

// Reportes de datos
router.get('/implementation/:planId', reportsController.getImplementationReport)
router.get('/plans', reportsController.getPlansReport)
router.get('/users', reportsController.getUsersReport)
router.get('/cost-centers', reportsController.getCostCentersReport)

// Exportación de reportes
router.post('/export', reportsController.exportReport)

export default router
