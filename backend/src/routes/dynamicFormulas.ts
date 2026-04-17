import { Router } from 'express'
import { dynamicFormulasController } from '../controllers/dynamicFormulasController'

const router = Router()

// Fórmulas dinámicas
router.get('/', dynamicFormulasController.getAll)
router.get('/templates', dynamicFormulasController.getTemplates)
router.get('/:id', dynamicFormulasController.getById)
router.post('/', dynamicFormulasController.create)
router.put('/:id', dynamicFormulasController.update)
router.delete('/:id', dynamicFormulasController.delete)

// Configuración de indicadores
router.get('/indicators/:indicatorId/config', dynamicFormulasController.getIndicatorConfig)
router.post('/indicators/:indicatorId/config', dynamicFormulasController.configureIndicator)
router.delete('/indicators/:indicatorId/config', dynamicFormulasController.removeIndicatorConfig)

export default router
