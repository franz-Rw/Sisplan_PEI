import { Router } from 'express'
import { strategicObjectivesController } from '../controllers/strategicObjectivesController'
import { strategicActionsController } from '../controllers/strategicActionsController'
import { indicatorsController } from '../controllers/indicatorsController'
import { indicatorValuesController } from '../controllers/indicatorValuesController'
import { authenticate, authorize } from '../middleware/auth'

// Router para Objetivos Estratégicos
const objectivesRouter = Router()
objectivesRouter.get('/', authenticate, strategicObjectivesController.getAll)
objectivesRouter.get('/cost-centers', authenticate, strategicObjectivesController.getCostCentersForAssignment)
objectivesRouter.post('/', authenticate, authorize(['ADMIN']), strategicObjectivesController.create)
objectivesRouter.put('/:id', authenticate, authorize(['ADMIN']), strategicObjectivesController.update)
objectivesRouter.delete('/:id', authenticate, authorize(['ADMIN']), strategicObjectivesController.delete)
objectivesRouter.get('/:objectiveId/indicators', authenticate, indicatorsController.getByObjective)

// Router para Acciones Estratégicas  
const actionsRouter = Router()
actionsRouter.get('/', authenticate, strategicActionsController.getAll)
actionsRouter.post('/', authenticate, authorize(['ADMIN']), strategicActionsController.create)
actionsRouter.put('/:id', authenticate, authorize(['ADMIN']), strategicActionsController.update)
actionsRouter.delete('/:id', authenticate, authorize(['ADMIN']), strategicActionsController.delete)
actionsRouter.get('/:actionId/indicators', authenticate, indicatorsController.getByAction)

// Router para Indicadores
const indicatorsRouter = Router()
indicatorsRouter.get('/', authenticate, indicatorsController.getAll)
indicatorsRouter.get('/cost-centers', authenticate, indicatorsController.getCostCentersForAssignment)
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
