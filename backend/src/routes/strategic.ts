import { Router } from 'express'
import { strategicObjectivesController } from '../controllers/strategicObjectivesController'
import { strategicActionsController } from '../controllers/strategicActionsController'
import { indicatorsController } from '../controllers/indicatorsController'
import { indicatorValuesController } from '../controllers/indicatorValuesController'
import { authenticate, authorize } from '../middleware/auth'

// Router para Objetivos Estratégicos
const objectivesRouter = Router()
// Rutas específicas primero
objectivesRouter.get('/cost-centers', authenticate, strategicObjectivesController.getCostCentersForAssignment)
objectivesRouter.get('/plan/:planId', authenticate, strategicObjectivesController.getAll)
// Rutas genéricas después
objectivesRouter.get('/', authenticate, strategicObjectivesController.getAll)
objectivesRouter.post('/', authenticate, authorize(['ADMIN']), strategicObjectivesController.create)
// Rutas con ID parametrizado
objectivesRouter.get('/:objectiveId/indicators', authenticate, indicatorsController.getByObjective)
objectivesRouter.get('/:id', authenticate, strategicObjectivesController.getById)
objectivesRouter.put('/:id', authenticate, authorize(['ADMIN']), strategicObjectivesController.update)
objectivesRouter.delete('/:id', authenticate, authorize(['ADMIN']), strategicObjectivesController.delete)

// Router para Acciones Estratégicas  
const actionsRouter = Router()
// Rutas específicas primero
actionsRouter.get('/plan/:planId', authenticate, strategicActionsController.getAll)
// Rutas genéricas
actionsRouter.get('/', authenticate, strategicActionsController.getAll)
actionsRouter.post('/', authenticate, authorize(['ADMIN']), strategicActionsController.create)
// Rutas con ID parametrizado
actionsRouter.get('/:actionId/indicators', authenticate, indicatorsController.getByAction)
actionsRouter.get('/:id', authenticate, strategicActionsController.getById)
actionsRouter.put('/:id', authenticate, authorize(['ADMIN']), strategicActionsController.update)
actionsRouter.delete('/:id', authenticate, authorize(['ADMIN']), strategicActionsController.delete)

// Router para Indicadores
const indicatorsRouter = Router()
indicatorsRouter.get('/', authenticate, indicatorsController.getAll)
indicatorsRouter.get('/cost-centers', authenticate, indicatorsController.getCostCentersForAssignment)
indicatorsRouter.get('/diagnose', indicatorsController.diagnose) // Temporal sin autenticación
indicatorsRouter.post('/fix-double-linked', authenticate, authorize(['ADMIN']), indicatorsController.fixDoubleLinked)
indicatorsRouter.get('/:id', authenticate, indicatorsController.getById) // Ruta faltante
indicatorsRouter.post('/', authenticate, authorize(['ADMIN']), indicatorsController.create)
indicatorsRouter.put('/:id', authenticate, authorize(['ADMIN']), indicatorsController.update)
indicatorsRouter.delete('/:id', authenticate, authorize(['ADMIN']), indicatorsController.delete)

// Router para Valores de Indicadores
const indicatorValuesRouter = Router()
indicatorValuesRouter.post('/absolute', authenticate, authorize(['ADMIN']), indicatorValuesController.createAbsolute)
indicatorValuesRouter.post('/relative', authenticate, authorize(['ADMIN']), indicatorValuesController.createRelative)
indicatorValuesRouter.put('/:id', authenticate, authorize(['ADMIN']), indicatorValuesController.update)
indicatorValuesRouter.delete('/:id', authenticate, authorize(['ADMIN']), indicatorValuesController.delete)

export {
  objectivesRouter,
  actionsRouter,
  indicatorsRouter,
  indicatorValuesRouter
}
