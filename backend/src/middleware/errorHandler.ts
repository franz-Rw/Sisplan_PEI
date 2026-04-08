import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  status?: number
  details?: unknown
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'

  console.error(`[ERROR] ${status}: ${message}`, err.details)

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { details: err.details }),
    },
  })
}
