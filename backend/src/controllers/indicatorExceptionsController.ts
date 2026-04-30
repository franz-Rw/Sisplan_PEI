import path from 'path'
import { promises as fs } from 'fs'
import { Prisma, ExceptionStatus } from '@prisma/client'
import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'

const exceptionFilesDirectory = path.resolve(process.cwd(), 'uploads', 'indicator-exceptions')

const exceptionInclude = {
  variable: {
    select: {
      id: true,
      code: true,
      name: true,
      indicator: {
        select: {
          id: true,
          code: true,
          statement: true,
          actionId: true,
          objectiveId: true,
          action: {
            select: {
              id: true,
              code: true,
              statement: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  startYear: true,
                  endYear: true,
                },
              },
              objective: {
                select: {
                  id: true,
                  code: true,
                  statement: true,
                  plan: {
                    select: {
                      id: true,
                      name: true,
                      startYear: true,
                      endYear: true,
                    },
                  },
                },
              },
            },
          },
          objective: {
            select: {
              id: true,
              code: true,
              statement: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  startYear: true,
                  endYear: true,
                },
              },
            },
          },
        },
      },
    },
  },
  costCenter: {
    select: {
      id: true,
      code: true,
      description: true,
    },
  },
} as const

type IndicatorExceptionWithRelations = Prisma.IndicatorDataExceptionGetPayload<{
  include: typeof exceptionInclude
}>

const validStatuses: ExceptionStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

const normalizeExceptionStatus = (status: string): ExceptionStatus => status.toUpperCase() as ExceptionStatus

const ensureExceptionFilesDirectory = async () => {
  await fs.mkdir(exceptionFilesDirectory, { recursive: true })
}

const buildStoredFileName = (originalName: string) => {
  const extension = path.extname(originalName).toLowerCase() || '.pdf'
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${Date.now()}-${baseName || 'sustento'}${extension}`
}

const getSupportFilePath = (storedFileName: string) =>
  path.join(exceptionFilesDirectory, storedFileName)

const getAuthenticatedUserEmail = async (req: AuthRequest) => {
  if (!req.userId) {
    return 'SYSTEM'
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true },
  })

  return user?.email || 'SYSTEM'
}

const resolveExceptionType = (exception: IndicatorExceptionWithRelations) =>
  exception.variable.indicator.actionId ? 'iaei' : 'ioei'

const serializeException = (exception: IndicatorExceptionWithRelations) => ({
  ...exception,
  exceptionType: resolveExceptionType(exception),
})

const safeDeleteSupportFile = async (storedFileName: string) => {
  const filePath = getSupportFilePath(storedFileName)

  try {
    await fs.unlink(filePath)
  } catch (error: unknown) {
    const fileError = error as NodeJS.ErrnoException

    if (fileError.code === 'ENOENT') {
      return
    }

    if (fileError.code === 'EPERM' || fileError.code === 'EBUSY') {
      console.warn(`Support file cleanup skipped for locked file: ${filePath}`)
      return
    }

    if (!(error instanceof Error)) {
      throw error
    }

    throw error
  }
}

export const indicatorExceptionsController = {
  createException: async (req: AuthRequest, res: Response) => {
    let storedFileName: string | null = null

    try {
      const { variableId, reason, periodFrom, periodTo, costCenterId } = req.body
      const file = req.file

      if (!variableId || !reason || !periodFrom || !periodTo || !costCenterId) {
        return res.status(400).json({
          error: 'Se requieren todos los campos: variableId, reason, periodFrom, periodTo y costCenterId',
        })
      }

      if (!file) {
        return res.status(400).json({
          error: 'Se requiere adjuntar un archivo PDF como sustento',
        })
      }

      const variable = await prisma.indicatorVariable.findFirst({
        where: {
          id: variableId,
          indicator: {
            responsibleId: costCenterId,
          },
        },
        select: {
          id: true,
          code: true,
          indicator: {
            select: {
              id: true,
              code: true,
              objectiveId: true,
              actionId: true,
            },
          },
        },
      })

      if (!variable) {
        return res.status(404).json({
          error: 'Variable no encontrada o no pertenece al centro de costo',
        })
      }

      const submittedBy = await getAuthenticatedUserEmail(req)
      storedFileName = buildStoredFileName(file.originalname)

      await ensureExceptionFilesDirectory()
      await fs.writeFile(getSupportFilePath(storedFileName), file.buffer)

      const createdException = await prisma.indicatorDataException.create({
        data: {
          variableId,
          reason: reason.trim(),
          periodFrom,
          periodTo,
          costCenterId,
          supportFile: storedFileName,
          supportFileOriginal: file.originalname,
          submittedBy,
        },
        include: exceptionInclude,
      })

      return res.status(201).json({
        success: true,
        message: 'Excepción registrada exitosamente',
        data: serializeException(createdException),
      })
    } catch (error: unknown) {
      if (storedFileName) {
        await safeDeleteSupportFile(storedFileName).catch(cleanupError => {
          console.error('Error cleaning up support file after failed exception creation:', cleanupError)
        })
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({
          error: 'Ya existe un sustento registrado para esta variable y período',
        })
      }

      console.error('Error creating exception:', error)
      return res.status(500).json({ error: 'Error al registrar la excepción' })
    }
  },

  getExceptions: async (req: AuthRequest, res: Response) => {
    try {
      const { type, status } = req.query
      const normalizedStatus =
        typeof status === 'string' && status.length > 0 ? normalizeExceptionStatus(status) : undefined

      if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Estado de excepción inválido' })
      }

      const exceptions = await prisma.indicatorDataException.findMany({
        where: normalizedStatus ? { status: normalizedStatus } : undefined,
        include: exceptionInclude,
        orderBy: { createdAt: 'desc' },
      })

      const filteredExceptions = exceptions.filter(exception => {
        if (type === 'ioei') {
          return resolveExceptionType(exception) === 'ioei'
        }

        if (type === 'iaei') {
          return resolveExceptionType(exception) === 'iaei'
        }

        return true
      })

      return res.json(filteredExceptions.map(serializeException))
    } catch (error) {
      console.error('Error getting exceptions:', error)
      return res.status(500).json({ error: 'Error al obtener las excepciones' })
    }
  },

  updateExceptionStatus: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { status, reviewComment } = req.body

      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: 'El estado es obligatorio' })
      }

      const normalizedStatus = normalizeExceptionStatus(status)
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Estado de excepción inválido' })
      }

      const reviewedBy = await getAuthenticatedUserEmail(req)
      const updatedException = await prisma.indicatorDataException.update({
        where: { id },
        data: {
          status: normalizedStatus,
          reviewComment: typeof reviewComment === 'string' && reviewComment.trim() ? reviewComment.trim() : null,
          reviewedBy,
          reviewedAt: new Date(),
        },
        include: exceptionInclude,
      })

      return res.json({
        success: true,
        message: 'Estado de excepción actualizado',
        data: serializeException(updatedException),
      })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Excepción no encontrada' })
      }

      console.error('Error updating exception status:', error)
      return res.status(500).json({ error: 'Error al actualizar el estado de la excepción' })
    }
  },

  downloadSupportFile: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const exception = await prisma.indicatorDataException.findUnique({
        where: { id },
      })

      if (!exception) {
        return res.status(404).json({ error: 'Excepción no encontrada' })
      }

      const filePath = getSupportFilePath(exception.supportFile)

      try {
        await fs.access(filePath)
      } catch {
        return res.status(404).json({ error: 'Archivo de sustento no encontrado' })
      }

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(exception.supportFileOriginal)}"`
      )

      return res.sendFile(filePath)
    } catch (error) {
      console.error('Error downloading support file:', error)
      return res.status(500).json({ error: 'Error al descargar el archivo de sustento' })
    }
  },

  deleteException: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const deletedException = await prisma.indicatorDataException.delete({
        where: { id },
      })

      await safeDeleteSupportFile(deletedException.supportFile)

      return res.json({
        success: true,
        message: 'Excepción eliminada correctamente',
      })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Excepción no encontrada' })
      }

      console.error('Error deleting exception:', error)
      return res.status(500).json({ error: 'Error al eliminar la excepción' })
    }
  },
}
