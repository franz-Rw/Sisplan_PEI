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
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://127.0.0.1:54131',
      'http://localhost:5174'
    ],
    credentials: true,
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

app.listen(PORT, () => {
  console.log(`
  ╭──────────────────────────────────╮
  │  🚀 SISPLAN FR Backend            │
  │  Servidor corriendo en puerto:    │
  │  ${PORT}                           │
  │  Ambiente: ${NODE_ENV}             │
  ╰──────────────────────────────────╯
  `)
})
