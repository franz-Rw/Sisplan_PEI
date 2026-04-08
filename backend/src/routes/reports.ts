import { Router } from 'express'
import { reportsController } from '../controllers/reportsController'

const router = Router()

// Reportes de datos
router.get('/plans', reportsController.getPlansReport)
router.get('/users', reportsController.getUsersReport)
router.get('/cost-centers', reportsController.getCostCentersReport)

// Exportación de reportes
router.post('/export', reportsController.exportReport)

export default router
