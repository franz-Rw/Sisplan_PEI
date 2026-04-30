import { Router } from 'express'
import { indicatorExceptionsController } from '../controllers/indicatorExceptionsController'
import multer from 'multer'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// Configurar multer para este router
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos PDF'))
    }
  }
})

// Crear una nueva excepción de variable sin datos (con archivo)
router.post(
  '/exception',
  authenticate,
  authorize(['OPERATOR', 'ADMIN']),
  upload.single('file'),
  indicatorExceptionsController.createException
)

// Obtener excepciones para administrador
router.get('/', authenticate, authorize(['ADMIN']), indicatorExceptionsController.getExceptions)

// Actualizar estado de una excepción
router.put(
  '/exceptions/:id/status',
  authenticate,
  authorize(['ADMIN']),
  indicatorExceptionsController.updateExceptionStatus
)

// Descargar archivo de sustento de una excepción
router.get(
  '/exceptions/:id/download',
  authenticate,
  authorize(['ADMIN']),
  indicatorExceptionsController.downloadSupportFile
)

// Eliminar excepción y su sustento
router.delete(
  '/exceptions/:id',
  authenticate,
  authorize(['ADMIN']),
  indicatorExceptionsController.deleteException
)

export default router
