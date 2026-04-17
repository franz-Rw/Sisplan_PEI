const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Creando templates de fórmulas...');
  
  try {
    await prisma.formulaTemplate.deleteMany();
    
    const templates = [
      {
        name: 'Porcentaje Cumplimiento',
        type: 'PERCENTAGE',
        category: 'BASIC',
        expression: '(real/planificado)*100',
        variables: JSON.stringify(['real', 'planificado']),
        parameters: JSON.stringify({unit: '%', min: 0, max: 100}),
        validationRules: JSON.stringify({required: ['real', 'planificado']}),
        description: 'Calcula el porcentaje de cumplimiento entre valor real y planificado'
      },
      {
        name: 'Tasa de Crecimiento',
        type: 'RATE',
        category: 'BASIC',
        expression: '((valor_actual - valor_anterior) / valor_anterior) * 100',
        variables: JSON.stringify(['valor_actual', 'valor_anterior']),
        parameters: JSON.stringify({unit: '%'}),
        validationRules: JSON.stringify({required: ['valor_actual', 'valor_anterior']}),
        description: 'Calcula la tasa de crecimiento interanual'
      }
    ];
    
    for (const template of templates) {
      await prisma.formulaTemplate.create({ data: template });
    }
    
    console.log('Templates creados exitosamente');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
