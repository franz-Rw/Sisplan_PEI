import { Request, Response } from 'express'
import { prisma } from '../config/database'

type IndicatorResultPayload = {
  planId: string
  objectiveId: string | null
  actionId: string | null
  indicatorId: string
  year: number
  obtainedValue?: number | null
}

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

const normalizeOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  return null
}

const parseRequiredPayload = (body: Record<string, unknown>): IndicatorResultPayload | string => {
  const planId = normalizeOptionalString(body.planId)
  const objectiveId = normalizeOptionalString(body.objectiveId)
  const actionId = normalizeOptionalString(body.actionId)
  const indicatorId = normalizeOptionalString(body.indicatorId)
  const year = normalizeOptionalNumber(body.year)
  const obtainedValue = normalizeOptionalNumber(body.obtainedValue)

  if (!planId || !indicatorId || year === null) {
    return 'Plan, indicador y año son obligatorios'
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return 'El año debe ser un entero válido entre 2000 y 2100'
  }

  if (objectiveId && actionId) {
    return 'No puede enviar ambos: objectiveId y actionId'
  }

  return {
    planId,
    objectiveId,
    actionId,
    indicatorId,
    year,
    obtainedValue,
  }
}

const parsePartialPayload = (body: Record<string, unknown>) => {
  const parsedPayload = {
    planId: body.planId === undefined ? undefined : normalizeOptionalString(body.planId),
    objectiveId: body.objectiveId === undefined ? undefined : normalizeOptionalString(body.objectiveId),
    actionId: body.actionId === undefined ? undefined : normalizeOptionalString(body.actionId),
    indicatorId: body.indicatorId === undefined ? undefined : normalizeOptionalString(body.indicatorId),
    year: body.year === undefined ? undefined : normalizeOptionalNumber(body.year),
    obtainedValue:
      body.obtainedValue === undefined ? undefined : normalizeOptionalNumber(body.obtainedValue),
  }

  if (parsedPayload.objectiveId && parsedPayload.actionId) {
    return { error: 'No puede enviar ambos: objectiveId y actionId' as const }
  }

  if (
    parsedPayload.year !== undefined &&
    (parsedPayload.year === null ||
      !Number.isInteger(parsedPayload.year) ||
      parsedPayload.year < 2000 ||
      parsedPayload.year > 2100)
  ) {
    return { error: 'El año debe ser un entero válido entre 2000 y 2100' as const }
  }

  if (parsedPayload.planId === null || parsedPayload.indicatorId === null) {
    return { error: 'planId e indicatorId no pueden estar vacíos' as const }
  }

  return { data: parsedPayload }
}

const resolveExpectedValue = async (indicatorId: string, year: number) => {
  const indicatorValue = await prisma.indicatorValue.findFirst({
    where: {
      indicatorId,
      year,
    },
    select: {
      value: true,
    },
  })

  return indicatorValue?.value ?? null
}

const validateIndicatorContext = async ({
  indicatorId,
  planId,
  objectiveId,
  actionId,
}: {
  indicatorId: string
  planId: string
  objectiveId: string | null
  actionId: string | null
}) => {
  const indicator = await prisma.indicator.findUnique({
    where: { id: indicatorId },
    select: {
      id: true,
      planId: true,
      objectiveId: true,
      actionId: true,
    },
  })

  if (!indicator) {
    return 'El indicador seleccionado no existe'
  }

  if (indicator.planId !== planId) {
    return 'El indicador no pertenece al plan seleccionado'
  }

  if ((indicator.objectiveId || null) !== objectiveId) {
    return 'El indicador no pertenece al objetivo seleccionado'
  }

  if ((indicator.actionId || null) !== actionId) {
    return 'El indicador no pertenece a la acción seleccionada'
  }

  return null
}

export const getIndicatorResults = async (req: Request, res: Response) => {
  try {
    const { indicatorId } = req.params
    const planId = normalizeOptionalString(req.query.planId)
    const objectiveId = normalizeOptionalString(req.query.objectiveId)
    const actionId = normalizeOptionalString(req.query.actionId)

    if (!indicatorId) {
      return res.status(400).json({ error: 'indicatorId es obligatorio' })
    }

    if (objectiveId && actionId) {
      return res.status(400).json({
        error: 'No puede enviar ambos: objectiveId y actionId',
      })
    }

    const results = await prisma.indicatorResult.findMany({
      where: {
        indicatorId,
        ...(planId ? { planId } : {}),
        ...(objectiveId ? { objectiveId } : {}),
        ...(actionId ? { actionId } : {}),
      },
      include: {
        plan: true,
        objective: true,
        action: true,
        indicator: true,
      },
      orderBy: {
        year: 'asc',
      },
    })

    return res.json(results)
  } catch (error) {
    console.error('Error getting indicator results:', error)
    return res.status(500).json({ error: 'Error al obtener resultados' })
  }
}

export const createIndicatorResult = async (req: Request, res: Response) => {
  try {
    const parsedPayload = parseRequiredPayload(req.body as Record<string, unknown>)

    if (typeof parsedPayload === 'string') {
      return res.status(400).json({ error: parsedPayload })
    }

    const contextError = await validateIndicatorContext(parsedPayload)
    if (contextError) {
      return res.status(400).json({ error: contextError })
    }

    const expectedValue = await resolveExpectedValue(parsedPayload.indicatorId, parsedPayload.year)
    if (expectedValue === null) {
      return res.status(400).json({
        error: `No existe una meta esperada para el indicador en el año ${parsedPayload.year}`,
      })
    }

    const result = await prisma.indicatorResult.upsert({
      where: {
        planId_indicatorId_year: {
          planId: parsedPayload.planId,
          indicatorId: parsedPayload.indicatorId,
          year: parsedPayload.year,
        },
      },
      update: {
        objectiveId: parsedPayload.objectiveId,
        actionId: parsedPayload.actionId,
        expectedValue,
        obtainedValue: parsedPayload.obtainedValue,
      },
      create: {
        planId: parsedPayload.planId,
        objectiveId: parsedPayload.objectiveId,
        actionId: parsedPayload.actionId,
        indicatorId: parsedPayload.indicatorId,
        year: parsedPayload.year,
        expectedValue,
        obtainedValue: parsedPayload.obtainedValue,
      },
      include: {
        plan: true,
        objective: true,
        action: true,
        indicator: true,
      },
    })

    return res.status(201).json(result)
  } catch (error) {
    console.error('Error creating indicator result:', error)
    return res.status(500).json({ error: 'Error al crear resultado' })
  }
}

export const updateIndicatorResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'id es obligatorio' })
    }

    const parsedPayload = parsePartialPayload(req.body as Record<string, unknown>)
    if ('error' in parsedPayload) {
      return res.status(400).json({ error: parsedPayload.error })
    }

    const currentResult = await prisma.indicatorResult.findUnique({
      where: { id },
    })

    if (!currentResult) {
      return res.status(404).json({ error: 'Resultado no encontrado' })
    }

    const nextState = {
      planId: parsedPayload.data.planId ?? currentResult.planId,
      objectiveId:
        parsedPayload.data.objectiveId !== undefined
          ? parsedPayload.data.objectiveId
          : currentResult.objectiveId,
      actionId:
        parsedPayload.data.actionId !== undefined ? parsedPayload.data.actionId : currentResult.actionId,
      indicatorId: parsedPayload.data.indicatorId ?? currentResult.indicatorId,
      year: parsedPayload.data.year ?? currentResult.year,
      obtainedValue:
        parsedPayload.data.obtainedValue !== undefined
          ? parsedPayload.data.obtainedValue
          : currentResult.obtainedValue,
    }

    const contextError = await validateIndicatorContext(nextState)
    if (contextError) {
      return res.status(400).json({ error: contextError })
    }

    const expectedValue = await resolveExpectedValue(nextState.indicatorId, nextState.year)
    if (expectedValue === null) {
      return res.status(400).json({
        error: `No existe una meta esperada para el indicador en el año ${nextState.year}`,
      })
    }

    const updatedResult = await prisma.indicatorResult.update({
      where: { id },
      data: {
        planId: nextState.planId,
        objectiveId: nextState.objectiveId,
        actionId: nextState.actionId,
        indicatorId: nextState.indicatorId,
        year: nextState.year,
        expectedValue,
        obtainedValue: nextState.obtainedValue,
      },
      include: {
        plan: true,
        objective: true,
        action: true,
        indicator: true,
      },
    })

    return res.json(updatedResult)
  } catch (error) {
    console.error('Error updating indicator result:', error)
    return res.status(500).json({ error: 'Error al actualizar resultado' })
  }
}

export const deleteIndicatorResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'id es obligatorio' })
    }

    await prisma.indicatorResult.delete({
      where: { id },
    })

    return res.json({ message: 'Resultado eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting indicator result:', error)
    return res.status(500).json({ error: 'Error al eliminar resultado' })
  }
}
