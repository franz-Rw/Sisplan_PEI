import apiClient from '@services/api'

export interface IndicatorDiagnosis {
  id: string
  code: string
  statement: string
  objectiveId: string | null
  actionId: string | null
  objective?: {
    id: string
    code: string
    statement: string
  }
  action?: {
    id: string
    code: string
    statement: string
  }
  status: 'CORRECT' | 'ERROR'
  issue: string | null
}

export interface DiagnosisSummary {
  total: number
  correct: number
  errors: number
  doubleLinked: number
  unlinked: number
}

export interface DiagnosisResponse {
  summary: DiagnosisSummary
  indicators: IndicatorDiagnosis[]
}

export const indicatorDiagnosisService = {
  // Diagnosticar todos los indicadores
  diagnose: async (): Promise<DiagnosisResponse> => {
    const response = await apiClient.get('/indicators/diagnose')
    return response.data
  },

  // Corregir indicadores con doble vinculación
  fixDoubleLinked: async (prioritize: 'action' | 'objective'): Promise<any> => {
    const response = await apiClient.post('/indicators/fix-double-linked', { prioritize })
    return response.data
  },

  // Obtener indicadores con doble vinculación
  getDoubleLinked: async (): Promise<IndicatorDiagnosis[]> => {
    const diagnosis = await apiClient.get('/indicators/diagnose')
    return diagnosis.data.indicators.filter((ind: IndicatorDiagnosis) => 
      ind.issue?.includes('DOBLE VINCULACIÓN')
    )
  },

  // Obtener indicadores sin vinculación
  getUnlinked: async (): Promise<IndicatorDiagnosis[]> => {
    const diagnosis = await apiClient.get('/indicators/diagnose')
    return diagnosis.data.indicators.filter((ind: IndicatorDiagnosis) => 
      ind.issue?.includes('SIN VINCULACIÓN')
    )
  }
}
