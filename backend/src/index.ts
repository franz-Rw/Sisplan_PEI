import fs from 'fs'
import path from 'path'
import express from 'express'
import 'express-async-errors'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
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
import indicatorAssignmentsRoutes from './routes/indicatorAssignments'

const runtimeEnv = process.env.NODE_ENV || 'development'
const envFiles = [`.env.${runtimeEnv}`, '.env']

for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false })
  }
}

const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || runtimeEnv
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const exactAllowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...configuredOrigins,
])
const privateNetworkOriginPatterns = [
  /^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(?::\d+)?$/,
]

const resolveFrontendDistPath = () => {
  const candidates = [
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
  ]

  return candidates.find(candidate => fs.existsSync(path.join(candidate, 'index.html')))
}

const frontendDistPath = resolveFrontendDistPath()
const isAllowedOrigin = (origin: string) =>
  exactAllowedOrigins.has(origin) ||
  privateNetworkOriginPatterns.some(pattern => pattern.test(origin))

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'OK',
    environment: NODE_ENV,
    timestamp: new Date(),
  })
}

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

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
app.use('/api/indicator-exceptions', indicatorExceptionsRoutes)
app.use('/api/dynamic-formulas', dynamicFormulasRoutes)
app.use('/api/indicator-assignments', indicatorAssignmentsRoutes)

app.use('/api', (_req, res) => {
  res.json({ message: 'API v1', status: 'running' })
})

if (NODE_ENV === 'production' && frontendDistPath) {
  app.use(express.static(frontendDistPath))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      next()
      return
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.use(errorHandler)

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  +----------------------------------+
  | SISPLAN FR Backend               |
  | Puerto: ${String(PORT).padEnd(22)}|
  | Ambiente: ${NODE_ENV.padEnd(20)}|
  | Frontend estatico: ${frontendDistPath ? 'SI' : 'NO'}           |
  +----------------------------------+
  `)
})
