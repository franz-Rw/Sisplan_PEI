import { PrismaClient, FormulaType, FormulaCategory } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedFormulaTemplates() {
  console.log('Seeding formula templates...')

  const templates = [
    {
      name: 'Porcentaje Cumplimiento',
      type: FormulaType.PERCENTAGE,
      category: FormulaCategory.BASIC,
      expression: '(real/planificado)*100',
      variables: JSON.stringify(['real', 'planificado']),
      parameters: JSON.stringify({
        unit: '%',
        min: 0,
        max: 100,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['real', 'planificado'],
        division_by_zero: 'error',
        negative_values: 'warning'
      }),
      description: 'Calcula el porcentaje de cumplimiento entre valor real y planificado',
      isActive: true
    },
    {
      name: 'Tasa de Crecimiento',
      type: FormulaType.RATE,
      category: FormulaCategory.BASIC,
      expression: '((valor_actual - valor_anterior) / valor_anterior) * 100',
      variables: JSON.stringify(['valor_actual', 'valor_anterior']),
      parameters: JSON.stringify({
        unit: '%',
        min: -100,
        max: 1000,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['valor_actual', 'valor_anterior'],
        division_by_zero: 'error',
        negative_values: 'allow'
      }),
      description: 'Calcula la tasa de crecimiento interanual o entre períodos',
      isActive: true
    },
    {
      name: 'Ratio Eficiencia',
      type: FormulaType.RATIO,
      category: FormulaCategory.BASIC,
      expression: 'salida / entrada',
      variables: JSON.stringify(['salida', 'entrada']),
      parameters: JSON.stringify({
        unit: 'veces',
        min: 0,
        max: 1000,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['salida', 'entrada'],
        division_by_zero: 'error',
        negative_values: 'error'
      }),
      description: 'Calcula el ratio de eficiencia entre recursos de entrada y salida',
      isActive: true
    },
    {
      name: 'Suma Total',
      type: FormulaType.SUM,
      category: FormulaCategory.BASIC,
      expression: 'SUM(valores)',
      variables: JSON.stringify(['valores']),
      parameters: JSON.stringify({
        unit: 'unidades',
        min: 0,
        max: 999999999,
        decimal_places: 0
      }),
      validationRules: JSON.stringify({
        required: ['valores'],
        empty_array: 'error',
        negative_values: 'warning'
      }),
      description: 'Suma todos los valores de un conjunto de datos',
      isActive: true
    },
    {
      name: 'Conteo de Registros',
      type: FormulaType.COUNT,
      category: FormulaCategory.BASIC,
      expression: 'COUNT(registros)',
      variables: JSON.stringify(['registros']),
      parameters: JSON.stringify({
        unit: 'cantidad',
        min: 0,
        max: 999999,
        decimal_places: 0
      }),
      validationRules: JSON.stringify({
        required: ['registros'],
        empty_array: 'allow',
        negative_values: 'error'
      }),
      description: 'Cuenta la cantidad de registros que cumplen condiciones',
      isActive: true
    },
    {
      name: 'Promedio Simple',
      type: FormulaType.AVERAGE,
      category: FormulaCategory.BASIC,
      expression: 'SUM(valores) / COUNT(valores)',
      variables: JSON.stringify(['valores']),
      parameters: JSON.stringify({
        unit: 'promedio',
        min: 0,
        max: 999999,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['valores'],
        empty_array: 'error',
        division_by_zero: 'error',
        negative_values: 'warning'
      }),
      description: 'Calcula el promedio aritmético de un conjunto de valores',
      isActive: true
    },
    {
      name: 'Índice de Calidad',
      type: FormulaType.CUSTOM,
      category: FormulaCategory.ADVANCED,
      expression: '(SUM(valores_ponderados) / SUM(ponderaciones)) * 100',
      variables: JSON.stringify(['valores_ponderados', 'ponderaciones']),
      parameters: JSON.stringify({
        unit: 'índice',
        min: 0,
        max: 100,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['valores_ponderados', 'ponderaciones'],
        division_by_zero: 'error',
        negative_values: 'error',
        array_length_mismatch: 'error'
      }),
      description: 'Calcula un índice compuesto basado en valores ponderados',
      isActive: true
    },
    {
      name: 'Diferencia Absoluta',
      type: FormulaType.CUSTOM,
      category: FormulaCategory.BASIC,
      expression: 'ABS(valor_real - valor_esperado)',
      variables: JSON.stringify(['valor_real', 'valor_esperado']),
      parameters: JSON.stringify({
        unit: 'unidades',
        min: 0,
        max: 999999,
        decimal_places: 2
      }),
      validationRules: JSON.stringify({
        required: ['valor_real', 'valor_esperado'],
        negative_values: 'error'
      }),
      description: 'Calcula la diferencia absoluta entre valor real y esperado',
      isActive: true
    }
  ]

  try {
    // Limpiar templates existentes
    await prisma.formulaTemplate.deleteMany()
    
    // Crear templates
    for (const template of templates) {
      await prisma.formulaTemplate.create({
        data: template
      })
    }

    console.log(`Created ${templates.length} formula templates`)
  } catch (error) {
    console.error('Error seeding formula templates:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedFormulaTemplates()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
