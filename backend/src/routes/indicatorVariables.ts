import { Router } from 'express'
import { indicatorVariablesController } from '../controllers/indicatorVariablesController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Rutas específicas primero que no necesitan parámetro :id
router.get('/', authenticate, indicatorVariablesController.getAll)
router.get('/objectives', authenticate, indicatorVariablesController.getObjectiveIndicatorVariables)
router.get('/objectives/indicators', authenticate, indicatorVariablesController.getObjectiveIndicators)
router.get('/actions', authenticate, indicatorVariablesController.getActionIndicatorVariables)
router.get('/actions/indicators', authenticate, indicatorVariablesController.getActionIndicators)
router.get('/cascade-options', authenticate, indicatorVariablesController.getCascadeOptions)

// Rutas para gestión de valores de autocompletado
router.get('/:variableId/autocomplete-values', authenticate, indicatorVariablesController.getAutocompleteValues)
router.post('/:variableId/autocomplete-values', authenticate, indicatorVariablesController.createAutocompleteValue)
router.put('/autocomplete-values/:id', authenticate, indicatorVariablesController.updateAutocompleteValue)
router.delete('/autocomplete-values/:id', authenticate, indicatorVariablesController.deleteAutocompleteValue)

// Rutas para gestión de valores de lista dependiente
router.get('/:variableId/dependent-list-values', authenticate, indicatorVariablesController.getDependentListValues)
router.post('/:variableId/dependent-list-values', authenticate, indicatorVariablesController.createDependentListValues)
router.get('/:variableId/dependent-list-tree', authenticate, indicatorVariablesController.getDependentListTree)
router.put('/dependent-list-values/:id', authenticate, indicatorVariablesController.updateDependentListValue)
router.delete('/dependent-list-values/:id', authenticate, indicatorVariablesController.deleteDependentListValue)

// CRUD - POST primero
router.post('/', authenticate, indicatorVariablesController.create)

// Rutas con parámetro :id (más específicas primero)
router.get('/indicator/:indicatorId', authenticate, indicatorVariablesController.getByIndicator)
router.put('/:id', authenticate, indicatorVariablesController.update)
router.delete('/:id', authenticate, indicatorVariablesController.delete)

export default router
