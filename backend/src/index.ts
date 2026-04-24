 import express from 'express'
import 'express-async-errors'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware de seguridad y parseo
app.use(helmet())
// CORS - Permitir múltiples orígenes para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  // Servidor de producción municipal - CAMBIAR esta IP si es necesario
  'http://192.168.2.7:5173', // Servidor de producción
  'http://192.168.2.7', // Servidor sin puerto
  'http://192.168.2.5:5173', // IP alternativa si se necesita
  'http://192.168.2.5', // IP alternativa sin puerto
  // IPs de desarrollo local
  'http://192.168.1.100:5173', // IP local de la municipalidad
  'http://192.168.1.100', // Por si accede sin puerto
  'http://192.168.137.1:5173', // Tu IP de red local
  'http://192.168.137.1', // Tu IP sin puerto
  'http://192.168.2.45:5173', // Tu otra IP de red
  'http://192.168.2.45', // Tu otra IP sin puerto
  // Permitir cualquier IP de red local para desarrollo
  /^http:\/\/192\.168\.\d+\.\d+(:5173)?$/,
  /^http:\/\/10\.0\.\d+\.\d+(:5173)?$/,
  /^http:\/\/172\.16\.\d+\.\d+(:5173)?$/,
]

// Agregar origen desde variables de entorno si existe
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','))
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// API routes
import authRoutes from './routes/auth'
import plansRoutes from './routes/plans'
import costCentersRoutes from './routes/costCenters'
import usersRoutes from './routes/users'
import { objectivesRouter, actionsRouter, indicatorsRouter, indicatorValuesRouter } from './routes/strategic'
import indicatorVariablesRoutes from './routes/indicatorVariables'
import indicatorDataRoutes from './routes/indicatorData'
import deadlineConfigRoutes from './routes/deadlineConfig'
import reportsRoutes from './routes/reports'
import indicatorExceptionsRoutes from './routes/indicatorExceptions'
import dynamicFormulasRoutes from './routes/dynamicFormulas'

app.use('/api/auth', authRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/cost-centers', costCentersRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/strategic-objectives', objectivesRouter)
app.use('/api/strategic-actions', actionsRouter)
app.use('/api/indicators', indicatorsRouter)
app.use('/api/indicator-values', indicatorValuesRouter)
app.use('/api/indicator-variables', indicatorVariablesRoutes)
app.use('/api/indicator-data', indicatorDataRoutes)
app.use('/api/deadline-configs', deadlineConfigRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/indicator-data', indicatorExceptionsRoutes)
app.use('/api/dynamic-formulas', dynamicFormulasRoutes)

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use((_req: any, res: any) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// API root - MOVER AL FINAL
app.use('/api', (_req: any, res: any) => {
  res.json({ message: 'API v1', status: 'running' })
})

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  ╭──────────────────────────────────╮
  │  🚀 SISPLAN FR Backend            │
  │  Servidor corriendo en puerto:    │
  │  ${PORT}                           │
  │  Ambiente: ${NODE_ENV}             │
  │  Escuchando en 0.0.0.0 (red)      │
  ╰──────────────────────────────────╯
  `)
})
