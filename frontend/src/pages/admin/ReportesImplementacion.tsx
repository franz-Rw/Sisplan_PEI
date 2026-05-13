import { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiDownload, FiFilter, FiTarget, FiTrendingUp } from 'react-icons/fi'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { plansService, StrategicPlan } from '@services/plansService'
import apiClient from '@services/api'

type IndicatorValue = {
  id: string
  year: number
  value: number
  type: 'ABSOLUTE' | 'RELATIVE'
}

type IndicatorResult = {
  id: string
  planId: string
  objectiveId?: string | null
  actionId?: string | null
  indicatorId: string
  year: number
  expectedValue: number
  obtainedValue?: number | null
  createdAt: string
  updatedAt: string
}

type ReportIndicator = {
  id: string
  planId: string
  objectiveId?: string | null
  actionId?: string | null
  code: string
  statement: string
  parameter?: string | null
  indicatorValues: IndicatorValue[]
  indicatorResults: IndicatorResult[]
}

type ReportAction = {
  id: string
  code: string
  statement: string
  objectiveId?: string | null
  indicators: ReportIndicator[]
}

type ReportObjective = {
  id: string
  code: string
  statement: string
  indicators: ReportIndicator[]
  actions: ReportAction[]
}

type ImplementationReport = {
  id: string
  name: string
  startYear: number
  endYear: number
  objectives: ReportObjective[]
}

type ProgressSummary = {
  value: number
  evaluated: number
}

type StatusMeta = {
  label: string
  badgeClassName: string
  barClassName: string
}

type ChartPoint = {
  year: number
  expected: number | null
  obtained: number | null
}

const isRelativeParameter = (parameter?: string | null) => {
  const normalized = (parameter || '').toLowerCase()
  return (
    normalized.includes('porcentaje') ||
    normalized.includes('ratio') ||
    normalized.includes('tasa') ||
    normalized.includes('variación') ||
    normalized.includes('variacion')
  )
}

const getPreferredValueType = (indicator: ReportIndicator | null | undefined): 'ABSOLUTE' | 'RELATIVE' | null => {
  if (!indicator) {
    return null
  }

  const availableTypes = new Set(indicator.indicatorValues.map(value => value.type))

  if (isRelativeParameter(indicator.parameter) && availableTypes.has('RELATIVE')) {
    return 'RELATIVE'
  }

  if (!isRelativeParameter(indicator.parameter) && availableTypes.has('ABSOLUTE')) {
    return 'ABSOLUTE'
  }

  if (availableTypes.has('RELATIVE')) {
    return 'RELATIVE'
  }

  if (availableTypes.has('ABSOLUTE')) {
    return 'ABSOLUTE'
  }

  return null
}

const getIndicatorValueForYear = (indicator: ReportIndicator | null | undefined, year: number) => {
  if (!indicator) {
    return null
  }

  const preferredType = getPreferredValueType(indicator)
  const preferredValue = indicator.indicatorValues.find(
    value => value.year === year && value.type === preferredType
  )

  if (preferredValue) {
    return preferredValue
  }

  return indicator.indicatorValues.find(value => value.year === year) || null
}

const normalizeIndicator = (indicator: Partial<ReportIndicator>): ReportIndicator => ({
  id: indicator.id || '',
  planId: indicator.planId || '',
  objectiveId: indicator.objectiveId ?? null,
  actionId: indicator.actionId ?? null,
  code: indicator.code || '',
  statement: indicator.statement || '',
  parameter: indicator.parameter ?? null,
  indicatorValues: Array.isArray(indicator.indicatorValues) ? indicator.indicatorValues : [],
  indicatorResults: Array.isArray(indicator.indicatorResults) ? indicator.indicatorResults : [],
})

const normalizeAction = (action: Partial<ReportAction>): ReportAction => ({
  id: action.id || '',
  code: action.code || '',
  statement: action.statement || '',
  objectiveId: action.objectiveId ?? null,
  indicators: Array.isArray(action.indicators)
    ? action.indicators.map(indicator => normalizeIndicator(indicator))
    : [],
})

const normalizeObjective = (objective: Partial<ReportObjective>): ReportObjective => ({
  id: objective.id || '',
  code: objective.code || '',
  statement: objective.statement || '',
  indicators: Array.isArray(objective.indicators)
    ? objective.indicators.map(indicator => normalizeIndicator(indicator))
    : [],
  actions: Array.isArray(objective.actions)
    ? objective.actions.map(action => normalizeAction(action))
    : [],
})

const normalizeImplementationReport = (payload: Partial<ImplementationReport>): ImplementationReport => ({
  id: payload.id || '',
  name: payload.name || '',
  startYear: payload.startYear || new Date().getFullYear(),
  endYear: payload.endYear || payload.startYear || new Date().getFullYear(),
  objectives: Array.isArray(payload.objectives)
    ? payload.objectives.map(objective => normalizeObjective(objective))
    : [],
})

const getDefaultYear = (plan: ImplementationReport) => {
  const currentYear = new Date().getFullYear()

  if (currentYear >= plan.startYear && currentYear <= plan.endYear) {
    return currentYear
  }

  return plan.endYear
}

const buildPlanYears = (plan: ImplementationReport | null) => {
  if (!plan) {
    return []
  }

  return Array.from({ length: plan.endYear - plan.startYear + 1 }, (_, index) => plan.startYear + index)
}

const findMetricByYear = (indicator: ReportIndicator | null | undefined, year: number) => {
  if (!indicator) {
    return { expected: null, obtained: null }
  }

  const indicatorValue = getIndicatorValueForYear(indicator, year)
  const indicatorResult = indicator.indicatorResults.find(result => result.year === year)

  return {
    expected: indicatorValue?.value ?? indicatorResult?.expectedValue ?? null,
    obtained: indicatorResult?.obtainedValue ?? null,
  }
}

const calculateIndicatorProgress = (indicator: ReportIndicator | null | undefined, year: number) => {
  const { expected, obtained } = findMetricByYear(indicator, year)

  if (expected === null || expected <= 0 || obtained === null || obtained === undefined) {
    return null
  }

  return (obtained / expected) * 100
}

const calculateAverageProgress = (indicators: ReportIndicator[], year: number): ProgressSummary => {
  const progressValues = indicators
    .map(indicator => calculateIndicatorProgress(indicator, year))
    .filter((value): value is number => value !== null)

  if (progressValues.length === 0) {
    return {
      value: 0,
      evaluated: 0,
    }
  }

  const total = progressValues.reduce((accumulator, currentValue) => accumulator + currentValue, 0)

  return {
    value: total / progressValues.length,
    evaluated: progressValues.length,
  }
}

const getStatusMeta = (value: number): StatusMeta => {
  if (value < 30) {
    return {
      label: 'Riesgo crítico',
      badgeClassName: 'bg-red-100 text-red-700 border border-red-200',
      barClassName: 'bg-red-500',
    }
  }

  if (value <= 90) {
    return {
      label: 'Riesgo moderado',
      badgeClassName: 'bg-amber-100 text-amber-700 border border-amber-200',
      barClassName: 'bg-amber-500',
    }
  }

  return {
    label: 'Riesgo bajo',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    barClassName: 'bg-emerald-500',
  }
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const buildChartData = (indicator: ReportIndicator | null | undefined, years: number[]): ChartPoint[] =>
  years.map(year => {
    const metrics = findMetricByYear(indicator, year)

    return {
      year,
      expected: metrics.expected,
      obtained: metrics.obtained,
    }
  })

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    marginBottom: 20,
    borderRadius: 6,
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 14,
  },
  headerDate: {
    color: '#bfdbfe',
    fontSize: 9,
    marginTop: 8,
  },
  planCard: {
    backgroundColor: '#ffffff',
    border: '1pt solid #e2e8f0',
    borderRadius: 6,
    padding: 15,
    marginBottom: 25,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  planText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
  },
  objectiveCard: {
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderLeft: '4pt solid #1e3a8a',
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  objectiveTitleBox: {
    flex: 1,
    paddingRight: 10,
  },
  objectiveTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1.4,
  },
  objectiveMeta: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    border: '1pt solid #e2e8f0',
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  progressContainer: {
    width: 140,
    alignItems: 'flex-end',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  progressBarBg: {
    height: 6,
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 15,
    marginBottom: 5,
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 24,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    alignItems: 'center',
    minHeight: 24,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
    padding: 4,
  },
  tableCell: {
    fontSize: 8,
    color: '#0f172a',
    padding: 4,
  },
  colCode: { width: '12%', textAlign: 'center' },
  colIndicator: { width: '42%' },
  colExpected: { width: '10%', textAlign: 'right' },
  colObtained: { width: '10%', textAlign: 'right' },
  colProgress: { width: '10%', textAlign: 'center' },
  colStatus: { width: '16%', alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#94a3b8',
    padding: 8,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#94a3b8',
  },
})

const getStatusStyle = (percentage: number | null) => {
  if (percentage === null) return { color: '#64748b', bg: '#f1f5f9', label: 'SIN DATOS' }
  if (percentage >= 80) return { color: '#059669', bg: '#d1fae5', label: 'ALTO CUMPLIMIENTO' }
  if (percentage >= 50) return { color: '#d97706', bg: '#fef3c7', label: 'CUMPLIMIENTO MEDIO' }
  return { color: '#dc2626', bg: '#fee2e2', label: 'RIESGO CRÍTICO' }
}

const ProgressWidget = ({ progress }: { progress: number | null }) => {
  const status = getStatusStyle(progress)
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarBg}>
          {progress !== null && progress > 0 && (
            <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: status.color }]} />
          )}
        </View>
        <Text style={styles.progressText}>{progress !== null ? formatPercent(progress) : 'N/D'}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: status.bg }]}>
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  )
}

const StatusBadge = ({ progress }: { progress: number | null }) => {
  const status = getStatusStyle(progress)
  return (
    <View style={[styles.badge, { backgroundColor: status.bg, alignSelf: 'center' }]}>
      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
    </View>
  )
}

const ImplementationReportPDF = ({
  plan,
  objectiveYear,
  actionYear,
}: {
  plan: ImplementationReport
  objectiveYear: number
  actionYear: number
}) => {
  const allIndicators = plan.objectives.flatMap(o => o.indicators)
  const planProgress = calculateAverageProgress(allIndicators, objectiveYear)

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Cabecera */}
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>Reporte de Avance y Ejecución</Text>
          <Text style={styles.headerSubtitle}>del Plan Estratégico</Text>
          <Text style={styles.headerDate}>
            Generado: {new Date().toLocaleString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Resumen del Plan */}
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.name}</Text>
          <Text style={styles.planText}>Horizonte Temporal: {plan.startYear} - {plan.endYear}</Text>
          <ProgressWidget progress={planProgress.evaluated > 0 ? planProgress.value : null} />
        </View>

        {/* Objetivos Estratégicos */}
        {plan.objectives.map(obj => {
          const objProgress = calculateAverageProgress(obj.indicators, objectiveYear)
          return (
            <View key={obj.id} style={styles.objectiveCard} wrap={false}>
              <View style={styles.objectiveHeader}>
                <View style={styles.objectiveTitleBox}>
                  <Text style={styles.objectiveTitle}>{obj.code} - {obj.statement}</Text>
                  <Text style={styles.objectiveMeta}>Año Evaluación: {objectiveYear} | Indicadores: {objProgress.evaluated}</Text>
                </View>
                <ProgressWidget progress={objProgress.evaluated > 0 ? objProgress.value : null} />
              </View>

              {obj.indicators.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableCellHeader, styles.colCode]}>Código</Text>
                    <Text style={[styles.tableCellHeader, styles.colIndicator]}>Indicador Estratégico</Text>
                    <Text style={[styles.tableCellHeader, styles.colExpected]}>Esperado</Text>
                    <Text style={[styles.tableCellHeader, styles.colObtained]}>Obtenido</Text>
                    <Text style={[styles.tableCellHeader, styles.colProgress]}>Avance</Text>
                    <Text style={[styles.tableCellHeader, styles.colStatus]}>Estado</Text>
                  </View>
                  {obj.indicators.map(ind => {
                    const progress = calculateIndicatorProgress(ind, objectiveYear)
                    const { expected, obtained } = findMetricByYear(ind, objectiveYear)
                    return (
                      <View key={ind.id} style={styles.tableRow} wrap={false}>
                        <Text style={[styles.tableCell, styles.colCode, { fontWeight: 'bold' }]}>{ind.code}</Text>
                        <Text style={[styles.tableCell, styles.colIndicator]}>{ind.statement}</Text>
                        <Text style={[styles.tableCell, styles.colExpected]}>{expected !== null ? expected.toString() : '-'}</Text>
                        <Text style={[styles.tableCell, styles.colObtained]}>{obtained !== null ? obtained.toString() : '-'}</Text>
                        <Text style={[styles.tableCell, styles.colProgress, { fontWeight: 'bold' }]}>{progress !== null ? formatPercent(progress) : '-'}</Text>
                        <View style={styles.colStatus}>
                          <StatusBadge progress={progress} />
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}

              {obj.actions.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>ACCIONES ESTRATÉGICAS VINCULADAS</Text>
                  {obj.actions.map(act => {
                    const actProgress = calculateAverageProgress(act.indicators, actionYear)
                    return (
                      <View key={act.id} style={styles.actionCard} wrap={false}>
                        <View style={styles.objectiveHeader}>
                          <View style={styles.objectiveTitleBox}>
                            <Text style={styles.actionTitle}>{act.code} - {act.statement}</Text>
                          </View>
                          <ProgressWidget progress={actProgress.evaluated > 0 ? actProgress.value : null} />
                        </View>

                        {act.indicators.length > 0 ? (
                          <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                              <Text style={[styles.tableCellHeader, styles.colCode]}>Código</Text>
                              <Text style={[styles.tableCellHeader, styles.colIndicator]}>Indicador Operativo</Text>
                              <Text style={[styles.tableCellHeader, styles.colExpected]}>Esperado</Text>
                              <Text style={[styles.tableCellHeader, styles.colObtained]}>Obtenido</Text>
                              <Text style={[styles.tableCellHeader, styles.colProgress]}>Avance</Text>
                              <Text style={[styles.tableCellHeader, styles.colStatus]}>Estado</Text>
                            </View>
                            {act.indicators.map(ind => {
                              const progress = calculateIndicatorProgress(ind, actionYear)
                              const { expected, obtained } = findMetricByYear(ind, actionYear)
                              return (
                                <View key={ind.id} style={styles.tableRow} wrap={false}>
                                  <Text style={[styles.tableCell, styles.colCode, { fontWeight: 'bold' }]}>{ind.code}</Text>
                                  <Text style={[styles.tableCell, styles.colIndicator]}>{ind.statement}</Text>
                                  <Text style={[styles.tableCell, styles.colExpected]}>{expected !== null ? expected.toString() : '-'}</Text>
                                  <Text style={[styles.tableCell, styles.colObtained]}>{obtained !== null ? obtained.toString() : '-'}</Text>
                                  <Text style={[styles.tableCell, styles.colProgress, { fontWeight: 'bold' }]}>{progress !== null ? formatPercent(progress) : '-'}</Text>
                                  <View style={styles.colStatus}>
                                    <StatusBadge progress={progress} />
                                  </View>
                                </View>
                              )
                            })}
                          </View>
                        ) : (
                          <Text style={styles.emptyState}>Sin indicadores registrados para esta acción</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages} | SISPLAN - Sistema de Planificación Estratégica`
        )} fixed />
      </Page>
    </Document>
  )
}

function ProgressCard({
  title,
  subtitle,
  year,
  years,
  onYearChange,
  summary,
  detail,
}: {
  title: string
  subtitle: string
  year: number
  years: number[]
  onYearChange: (year: number) => void
  summary: ProgressSummary
  detail: string
}) {
  const status = getStatusMeta(summary.value)
  const hasEvaluatedIndicators = summary.evaluated > 0

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Año</label>
          <select
            value={year}
            onChange={event => onYearChange(Number(event.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {years.map(currentYear => (
              <option key={currentYear} value={currentYear}>
                {currentYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${status.badgeClassName}`}>
            {hasEvaluatedIndicators ? status.label : 'Sin evaluación'}
          </span>
          <span className="text-lg font-semibold text-neutral-900">
            {hasEvaluatedIndicators ? formatPercent(summary.value) : 'N/D'}
          </span>
        </div>

        <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all ${status.barClassName}`}
            style={{ width: `${Math.min(hasEvaluatedIndicators ? summary.value : 0, 100)}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-neutral-600">{detail}</p>
      </div>
    </div>
  )
}

function IndicatorProgressCard({
  title,
  subtitle,
  progress,
}: {
  title: string
  subtitle: string
  progress: number | null
}) {
  const normalizedValue = progress ?? 0
  const status = getStatusMeta(normalizedValue)

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${status.badgeClassName}`}>
          {progress === null ? 'Sin evaluación' : status.label}
        </span>
        <span className="text-lg font-semibold text-neutral-900">
          {progress === null ? 'N/D' : formatPercent(progress)}
        </span>
      </div>

      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${status.barClassName}`}
          style={{ width: `${Math.min(normalizedValue, 100)}%` }}
        />
      </div>
    </div>
  )
}

function IndicatorAreaChart({
  title,
  subtitle,
  data,
  footer,
}: {
  title: string
  subtitle: string
  data: ChartPoint[]
  footer: string
}) {
  const chartSummary = useMemo(() => {
    const valuesWithExpected = data.filter(point => point.expected !== null).length
    const valuesWithObtained = data.filter(point => point.obtained !== null).length

    return {
      valuesWithExpected,
      valuesWithObtained,
      period:
        data.length > 0 ? `${data[0].year} - ${data[data.length - 1].year}` : 'Sin horizonte definido',
    }
  }, [data])

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
      <div className="border-b border-neutral-100 px-6 py-5">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Valor esperado
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Valor obtenido
          </span>
        </div>

        <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="expectedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="obtainedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: '#525252', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#525252', fontSize: 12 }} />
            <Tooltip
              cursor={false}
              formatter={(value: number | null | undefined, name: string) => [
                value === null || value === undefined ? 'Sin dato' : value,
                name,
              ]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              }}
            />
            <Area
              type="natural"
              dataKey="expected"
              name="Valor esperado"
              stroke="#2563eb"
              fill="url(#expectedArea)"
              strokeWidth={2}
              connectNulls
            />
            <Area
              type="natural"
              dataKey="obtained"
              name="Valor obtenido"
              stroke="#10b981"
              fill="url(#obtainedArea)"
              strokeWidth={2}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

        <div className="mt-5 flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium text-neutral-900">
              <FiTrendingUp className="h-4 w-4 text-emerald-600" />
              {footer}
            </div>
            <div className="flex items-center gap-2 leading-none text-neutral-500">
              {chartSummary.period} | Metas: {chartSummary.valuesWithExpected} | Resultados: {chartSummary.valuesWithObtained}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IndicatorValuesCard({
  title,
  indicator,
  years,
}: {
  title: string
  indicator: ReportIndicator | null
  years: number[]
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600 mt-1">
        {indicator
          ? `${indicator.code} - ${indicator.statement}`
          : 'Seleccione un indicador para visualizar sus valores anuales.'}
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-3 py-2 text-left font-medium text-neutral-700">Año</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-700">Valor esperado</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-700">Valor obtenido</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const metric = findMetricByYear(indicator, year)

              return (
                <tr key={year} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-3 py-2 text-neutral-900">{year}</td>
                  <td className="px-3 py-2 text-neutral-900">
                    {metric.expected === null ? 'Sin meta registrada' : metric.expected}
                  </td>
                  <td className="px-3 py-2 text-neutral-900">
                    {metric.obtained === null || metric.obtained === undefined
                      ? 'Sin resultado registrado'
                      : metric.obtained}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReportesImplementacion() {
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [plansLoaded, setPlansLoaded] = useState(false)
  const [objectivesState, setObjectivesState] = useState<any[]>([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [reportData, setReportData] = useState<ImplementationReport | null>(null)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('')
  const [selectedObjectiveIndicatorId, setSelectedObjectiveIndicatorId] = useState('')
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedActionIndicatorId, setSelectedActionIndicatorId] = useState('')
  const [objectiveYear, setObjectiveYear] = useState<number>(new Date().getFullYear())
  const [actionYear, setActionYear] = useState<number>(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true)
        const response = await apiClient.get('/plans')
        console.log('🔍 DEBUG - Plans response:', response.data)
        console.log('🔍 DEBUG - Plans response type:', typeof response.data)
        console.log('🔍 DEBUG - Is array:', Array.isArray(response.data))
        
        // Manejar respuesta del backend (objeto o array)
        let plansArray = []
        if (Array.isArray(response.data)) {
          plansArray = response.data
          console.log('✅ Plans loaded as array, length:', plansArray.length)
        } else if (response.data && typeof response.data === 'object') {
          console.log('🔍 DEBUG - Response is object, keys:', Object.keys(response.data))
          const possibleArrays = ['plans', 'data', 'items', 'results']
          for (const key of possibleArrays) {
            if (Array.isArray(response.data[key])) {
              plansArray = response.data[key]
              console.log(`✅ Plans found in key '${key}', length:`, plansArray.length)
              break
            }
          }
          if (plansArray.length === 0 && Object.keys(response.data).length > 0) {
            plansArray = Object.values(response.data).filter((item: any) => 
              typeof item === 'object' && item.id && item.name
            )
            console.log('✅ Plans converted from object to array, length:', plansArray.length)
          }
        }
        
        console.log('🔍 DEBUG - Final plans array:', plansArray)
        setPlans(plansArray)
        setPlansLoaded(true)
      } catch (loadError) {
        console.error('Error loading strategic plans:', loadError)
        setError('No se pudieron cargar los planes estratégicos')
      } finally {
        setLoadingPlans(false)
      }
    }

    loadPlans()
  }, [])

  useEffect(() => {
    const loadImplementationReport = async () => {
      if (!selectedPlanId) {
        setReportData(null)
        setSelectedObjectiveId('')
        setSelectedObjectiveIndicatorId('')
        setSelectedActionId('')
        setSelectedActionIndicatorId('')
        setError(null)
        return
      }

      try {
        setLoadingReport(true)
        setError(null)
        const response = await apiClient.get(`/reports/implementation/${selectedPlanId}`)
        const planReport = normalizeImplementationReport(response.data as Partial<ImplementationReport>)
        const defaultYear = getDefaultYear(planReport)
        const firstObjective = planReport.objectives[0] || null
        const firstObjectiveIndicator = firstObjective?.indicators[0] || null
        const firstAction = firstObjective?.actions[0] || null
        const firstActionIndicator = firstAction?.indicators[0] || null

        setReportData(planReport)
        setObjectiveYear(defaultYear)
        setActionYear(defaultYear)
        setSelectedObjectiveId(firstObjective?.id || '')
        setSelectedObjectiveIndicatorId(firstObjectiveIndicator?.id || '')
        setSelectedActionId(firstAction?.id || '')
        setSelectedActionIndicatorId(firstActionIndicator?.id || '')
      } catch (loadError) {
        console.error('Error loading implementation report:', loadError)
        setReportData(null)
        setError('No se pudo cargar el reporte de implementación del plan seleccionado')
      } finally {
        setLoadingReport(false)
      }
    }

    void loadImplementationReport()
  }, [selectedPlanId])

  // Cargar objetivos estratégicos dinámicamente cuando cambia el plan
  useEffect(() => {
    if (!selectedPlanId || !reportData) return

    const objectivesFromReport = reportData.objectives || []
    setObjectivesState(objectivesFromReport)
    
    // Si el objetivo seleccionado ya no existe en el nuevo reporte, limpiar selección
    const objectiveExists = objectivesFromReport.some(obj => obj.id === selectedObjectiveId)
    if (!objectiveExists) {
      setSelectedObjectiveId('')
      setSelectedObjectiveIndicatorId('')
      setSelectedActionId('')
      setSelectedActionIndicatorId('')
    }
  }, [selectedPlanId, reportData])

  // Cargar indicadores de objetivos dinámicamente cuando cambia el objetivo
  useEffect(() => {
    if (!selectedObjectiveId || !reportData) return

    const objectives = reportData.objectives || []
    const selectedObjective = objectives.find(obj => obj.id === selectedObjectiveId)
    const objectiveIndicators = selectedObjective?.indicators || []
    
    // Si el indicador seleccionado ya no existe, limpiar selección
    const indicatorExists = objectiveIndicators.some(ind => ind.id === selectedObjectiveIndicatorId)
    if (!indicatorExists) {
      setSelectedObjectiveIndicatorId('')
    }
  }, [selectedObjectiveId, reportData])

  // Cargar acciones estratégicas dinámicamente cuando cambia el objetivo
  useEffect(() => {
    if (!selectedObjectiveId || !reportData) return

    const objectives = reportData.objectives || []
    const selectedObjective = objectives.find(obj => obj.id === selectedObjectiveId)
    const objectiveActions = selectedObjective?.actions || []
    
    // Si la acción seleccionada ya no existe, limpiar selección
    const actionExists = objectiveActions.some(action => action.id === selectedActionId)
    if (!actionExists) {
      setSelectedActionId('')
      setSelectedActionIndicatorId('')
    }
  }, [selectedObjectiveId, reportData])

  // Cargar indicadores de acciones dinámicamente cuando cambia la acción
  useEffect(() => {
    if (!selectedActionId || !reportData) return

    const objectives = reportData.objectives || []
    const selectedObjective = objectives.find(obj => obj.id === selectedObjectiveId)
    const objectiveActions = selectedObjective?.actions || []
    const selectedAction = objectiveActions.find(action => action.id === selectedActionId)
    const actionIndicators = selectedAction?.indicators || []
    
    // Si el indicador seleccionado ya no existe, limpiar selección
    const indicatorExists = actionIndicators.some(ind => ind.id === selectedActionIndicatorId)
    if (!indicatorExists) {
      setSelectedActionIndicatorId('')
    }
  }, [selectedActionId, reportData])

  const objectivesList = reportData?.objectives || []
  const resolvedObjectiveId =
    objectivesList.some(objective => objective.id === selectedObjectiveId)
      ? selectedObjectiveId
      : objectivesList[0]?.id || ''
  const selectedObjective = objectivesList.find(objective => objective.id === resolvedObjectiveId) || null

  const objectiveIndicators = selectedObjective?.indicators || []
  const resolvedObjectiveIndicatorId =
    objectiveIndicators.some(indicator => indicator.id === selectedObjectiveIndicatorId)
      ? selectedObjectiveIndicatorId
      : objectiveIndicators[0]?.id || ''
  const selectedObjectiveIndicator =
    objectiveIndicators.find(indicator => indicator.id === resolvedObjectiveIndicatorId) || null

  const objectiveActions = selectedObjective?.actions || []
  const resolvedActionId =
    objectiveActions.some(action => action.id === selectedActionId)
      ? selectedActionId
      : objectiveActions[0]?.id || ''
  const selectedAction = objectiveActions.find(action => action.id === resolvedActionId) || null

  const actionIndicators = selectedAction?.indicators || []
  const resolvedActionIndicatorId =
    actionIndicators.some(indicator => indicator.id === selectedActionIndicatorId)
      ? selectedActionIndicatorId
      : actionIndicators[0]?.id || ''
  const selectedActionIndicator =
    actionIndicators.find(indicator => indicator.id === resolvedActionIndicatorId) || null

  const planYears = buildPlanYears(reportData)
  const objectiveActionIndicators = selectedObjective?.actions.flatMap(action => action.indicators) || []
  const selectedObjectiveIndicatorSeriesType = getPreferredValueType(selectedObjectiveIndicator)
  const selectedActionIndicatorSeriesType = getPreferredValueType(selectedActionIndicator)
  const objectiveOverall = calculateAverageProgress(
    [
      ...(selectedObjective?.indicators || []),
      ...objectiveActionIndicators,
    ],
    objectiveYear
  )
  const objectiveIndicatorsProgress = calculateAverageProgress(selectedObjective?.indicators || [], objectiveYear)
  const objectiveActionsProgress = calculateAverageProgress(objectiveActionIndicators, objectiveYear)
  const actionOverall = calculateAverageProgress(actionIndicators, actionYear)
  const objectiveIndicatorProgress = calculateIndicatorProgress(selectedObjectiveIndicator, objectiveYear)
  const actionIndicatorProgress = calculateIndicatorProgress(selectedActionIndicator, actionYear)
  const objectiveChartData = buildChartData(selectedObjectiveIndicator, planYears)
  const actionChartData = buildChartData(selectedActionIndicator, planYears)

  const handleGeneratePdf = async () => {
    if (!reportData) {
      return
    }

    try {
      setIsGeneratingPdf(true)
      const doc = <ImplementationReportPDF plan={reportData} objectiveYear={objectiveYear} actionYear={actionYear} />
      const asPdf = pdf([])
      asPdf.updateContainer(doc)
      const blob = await asPdf.toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_avance_${reportData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generando PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reporte de Implementación</h1>
          <p className="text-neutral-600">
            Monitoreo visual del nivel de implementación de objetivos, acciones e indicadores institucionales.
          </p>
        </div>

        <button
          onClick={() => void handleGeneratePdf()}
          disabled={!reportData || isGeneratingPdf || loadingReport}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:bg-neutral-400"
        >
          <FiDownload className="w-4 h-4" />
          {isGeneratingPdf ? 'Generando PDF...' : 'Generar reporte PDF'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <FiTarget className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Plan Estratégico</h2>
            <p className="text-sm text-neutral-600">
              Seleccione un plan para cargar automáticamente su estructura de implementación.
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Plan estratégico</label>
          <select
            value={selectedPlanId}
            onChange={event => setSelectedPlanId(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccione un plan...</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.startYear} - {plan.endYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingReport && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!loadingReport && reportData && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <FiFilter className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Objetivos e indicadores institucionales</h2>
                <p className="text-sm text-neutral-600">
                  Filtre el objetivo estratégico y el indicador institucional para revisar su implementación.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Objetivos Estratégicos Institucionales
                </label>
                <select
                  value={resolvedObjectiveId}
                  onChange={event => {
                    setSelectedObjectiveId(event.target.value)
                    setSelectedObjectiveIndicatorId('')
                    setSelectedActionId('')
                    setSelectedActionIndicatorId('')
                  }}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccione un objetivo...</option>
                  {reportData.objectives.length === 0 ? (
                    <option value="" disabled>Sin objetivos disponibles</option>
                  ) : (
                    reportData.objectives.map(objective => (
                      <option key={objective.id} value={objective.id}>
                        {objective.code} - {objective.statement}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Indicadores de Objetivos Estratégicos
                </label>
                <select
                  value={resolvedObjectiveIndicatorId}
                  onChange={event => setSelectedObjectiveIndicatorId(event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccione un indicador...</option>
                  {(selectedObjective?.indicators || []).length === 0 ? (
                    <option value="" disabled>Sin indicadores disponibles</option>
                  ) : (
                    selectedObjective?.indicators.map(indicator => (
                      <option key={indicator.id} value={indicator.id}>
                        {indicator.code} - {indicator.statement}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {selectedObjective && (
            <>
              <ProgressCard
                title="Avance general de implementación del objetivo"
                subtitle={`${selectedObjective.code} - ${selectedObjective.statement}`}
                year={objectiveYear}
                years={planYears}
                onYearChange={setObjectiveYear}
                summary={objectiveOverall}
                detail={`Se evaluaron ${objectiveIndicatorsProgress.evaluated} indicadores de objetivos estratégicos y ${objectiveActionsProgress.evaluated} indicadores correspondientes a acciones estratégicas vinculadas.`}
              />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ProgressCard
                  title="Avance general de las acciones estratégicas vinculadas al objetivo"
                  subtitle={`Promedio consolidado de los indicadores de acciones estratégicas asociadas a ${selectedObjective.code}.`}
                  year={objectiveYear}
                  years={planYears}
                  onYearChange={setObjectiveYear}
                  summary={objectiveActionsProgress}
                  detail={`Se consideraron ${objectiveActionsProgress.evaluated} indicadores pertenecientes a las acciones estratégicas vinculadas a este objetivo.`}
                />

                <IndicatorProgressCard
                  title="Avance específico del indicador"
                  subtitle={
                    selectedObjectiveIndicator
                      ? `${selectedObjectiveIndicator.code} - ${selectedObjectiveIndicator.statement} (${selectedObjectiveIndicatorSeriesType === 'RELATIVE' ? 'serie relativa' : 'serie absoluta'})`
                      : 'Seleccione un indicador de objetivo estratégico'
                  }
                  progress={objectiveIndicatorProgress}
                />
              </div>

              <IndicatorAreaChart
                title="Comportamiento anual del indicador de objetivo estratégico"
                subtitle={
                  selectedObjectiveIndicator
                    ? `${selectedObjectiveIndicator.code} - ${selectedObjectiveIndicator.statement}`
                      : 'No hay indicador seleccionado'
                  }
                  data={objectiveChartData}
                  footer={
                    selectedObjectiveIndicatorSeriesType === 'RELATIVE'
                      ? 'Serie relativa importada desde la base de datos para este indicador.'
                    : 'Serie absoluta importada desde la base de datos para este indicador.'
                  }
                />

              <IndicatorValuesCard
                title="Valores anuales del indicador de objetivo estratégico"
                indicator={selectedObjectiveIndicator}
                years={planYears}
              />

              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Acciones e indicadores vinculados</h2>
                    <p className="text-sm text-neutral-600">
                      Filtre la acción estratégica vinculada al objetivo y su indicador asociado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Acción Estratégica Institucional
                    </label>
                    <select
                      value={resolvedActionId}
                      onChange={event => {
                        setSelectedActionId(event.target.value)
                        setSelectedActionIndicatorId('')
                      }}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione una acción...</option>
                      {(selectedObjective.actions || []).length === 0 ? (
                        <option value="" disabled>Sin acciones disponibles</option>
                      ) : (
                        selectedObjective.actions.map(action => (
                          <option key={action.id} value={action.id}>
                            {action.code} - {action.statement}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Indicador de Acción Estratégica
                    </label>
                    <select
                      value={resolvedActionIndicatorId}
                      onChange={event => setSelectedActionIndicatorId(event.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione un indicador...</option>
                      {actionIndicators.length === 0 ? (
                        <option value="" disabled>Sin indicadores disponibles</option>
                      ) : (
                        actionIndicators.map(indicator => (
                          <option key={indicator.id} value={indicator.id}>
                            {indicator.code} - {indicator.statement}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {selectedAction && (
                <>
                  <ProgressCard
                    title="Avance de implementación de la acción estratégica"
                    subtitle={`${selectedAction.code} - ${selectedAction.statement}`}
                    year={actionYear}
                    years={planYears}
                    onYearChange={setActionYear}
                    summary={actionOverall}
                    detail={`Se evaluaron ${actionOverall.evaluated} indicadores vinculados a la acción estratégica seleccionada.`}
                  />

                  <IndicatorProgressCard
                    title="Avance de implementación del indicador"
                    subtitle={
                      selectedActionIndicator
                        ? `${selectedActionIndicator.code} - ${selectedActionIndicator.statement} (${selectedActionIndicatorSeriesType === 'RELATIVE' ? 'serie relativa' : 'serie absoluta'})`
                        : 'Seleccione un indicador de acción estratégica'
                    }
                    progress={actionIndicatorProgress}
                  />

                  <IndicatorAreaChart
                    title="Comportamiento anual del indicador de acción estratégica"
                    subtitle={
                      selectedActionIndicator
                        ? `${selectedActionIndicator.code} - ${selectedActionIndicator.statement}`
                        : 'No hay indicador seleccionado'
                    }
                    data={actionChartData}
                    footer={
                      selectedActionIndicatorSeriesType === 'RELATIVE'
                        ? 'Serie relativa importada desde la base de datos para este indicador.'
                        : 'Serie absoluta importada desde la base de datos para este indicador.'
                    }
                  />

                  <IndicatorValuesCard
                    title="Valores anuales del indicador de acción estratégica"
                    indicator={selectedActionIndicator}
                    years={planYears}
                  />
                </>
              )}
            </>
          )}

          {reportData.objectives.length === 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              El plan seleccionado aún no tiene objetivos estratégicos registrados.
            </div>
          )}

          {selectedObjective && selectedObjective.actions.length === 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              El objetivo estratégico seleccionado aún no tiene acciones estratégicas vinculadas.
            </div>
          )}
        </div>
      )}

      {!loadingReport && selectedPlanId && !reportData && !error && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No se encontró información de implementación para el plan seleccionado.
        </div>
      )}

      {!selectedPlanId && !loadingPlans && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-neutral-500">
          Seleccione un plan estratégico para visualizar el reporte de implementación.
        </div>
      )}
    </div>
  )
}
