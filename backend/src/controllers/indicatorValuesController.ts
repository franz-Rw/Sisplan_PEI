import { Request, Response } from 'express'
import { prisma } from '../config/database'

export const indicatorValuesController = {
  // Crear valor absoluto
  createAbsolute: async (req: Request, res: Response) => {
    try {
      const { indicatorId, year, value } = req.body

      if (!indicatorId || year === undefined || value === undefined) {
        return res.status(400).json({
          error: 'Indicador, año y valor son obligatorios'
        })
      }

      const indicatorValue = await prisma.indicatorValue.create({
        data: {
          indicatorId,
          year,
          value,
          type: 'ABSOLUTE'
        }
      })

      return res.status(201).json(indicatorValue)
    } catch (error) {
      console.error('Error al crear valor absoluto:', error)
      return res.status(500).json({ error: 'Error al crear valor absoluto' })
    }
  },

  // Crear valor relativo
  createRelative: async (req: Request, res: Response) => {
    try {
      const { indicatorId, year, value } = req.body

      if (!indicatorId || year === undefined || value === undefined) {
        return res.status(400).json({
          error: 'Indicador, año y valor son obligatorios'
        })
      }

      const indicatorValue = await prisma.indicatorValue.create({
        data: {
          indicatorId,
          year,
          value,
          type: 'RELATIVE'
        }
      })

      return res.status(201).json(indicatorValue)
    } catch (error) {
      console.error('Error al crear valor relativo:', error)
      return res.status(500).json({ error: 'Error al crear valor relativo' })
    }
  },

  // Actualizar valor
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { year, value } = req.body

      const indicatorValue = await prisma.indicatorValue.update({
        where: { id },
        data: {
          ...(year !== undefined && { year }),
          ...(value !== undefined && { value })
        }
      })

      return res.json(indicatorValue)
    } catch (error) {
      console.error('Error al actualizar valor:', error)
      return res.status(500).json({ error: 'Error al actualizar valor' })
    }
  },

  // Eliminar valor
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.indicatorValue.delete({
        where: { id }
      })

      return res.json({ message: 'Valor eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar valor:', error)
      return res.status(500).json({ error: 'Error al eliminar valor' })
    }
  }
}
