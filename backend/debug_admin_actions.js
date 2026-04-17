const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAdminActions() {
  try {
    console.log('=== DEBUG: ADMIN - VARIABLES DE ACCIONES ESTRATÉGICAS ===');
    
    // 1. Verificar todos los datos pendientes
    const allPending = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        status: true,
        variableId: true,
        costCenterId: true,
        year: true,
        createdAt: true,
        variable: {
          select: {
            id: true,
            code: true,
            name: true,
            indicator: {
              select: {
                id: true,
                code: true,
                planId: true,
                actionId: true,
                objectiveId: true
              }
            }
          }
        },
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    console.log(`\nTotal datos pendientes: ${allPending.length}`);
    
    // 2. Filtrar por plan (asumimos que hay un plan seleccionado)
    const selectedPlan = 'cmniph3k0000ab3sp0d5f1h4'; // Plan PEI 2021-2024
    console.log(`\nFiltrando por plan: ${selectedPlan}`);
    
    const filteredByPlan = allPending.filter(record => 
      record.variable?.indicator?.planId === selectedPlan
    );
    
    console.log(`Datos después de filtrar por plan: ${filteredByPlan.length}`);
    
    // 3. Separar por tipo (objetivos vs acciones)
    const objectivesData = filteredByPlan.filter(record => 
      !record.variable?.indicator?.actionId
    );
    
    const actionsData = filteredByPlan.filter(record => 
      record.variable?.indicator?.actionId
    );
    
    console.log(`\nDatos de objetivos (sin actionId): ${objectivesData.length}`);
    objectivesData.forEach(record => {
      console.log(`  - ${record.variable?.code}: ${record.variable?.indicator?.code} (actionId: ${record.variable?.indicator?.actionId})`);
    });
    
    console.log(`\nDatos de acciones (con actionId): ${actionsData.length}`);
    actionsData.forEach(record => {
      console.log(`  - ${record.variable?.code}: ${record.variable?.indicator?.code} (actionId: ${record.variable?.indicator?.actionId})`);
    });
    
    // 4. Verificar planes disponibles
    const plans = await prisma.strategicPlan.findMany({
      select: { id: true, name: true, startYear: true, endYear: true }
    });
    
    console.log('\nPlanes disponibles:');
    plans.forEach(plan => {
      console.log(`  - ${plan.id}: ${plan.name} (${plan.startYear}-${plan.endYear})`);
    });
    
    // 5. Verificar indicadores de acciones que tienen variables
    const actionIndicatorsWithVariables = await prisma.indicator.findMany({
      where: {
        actionId: { not: null },
        indicatorVariables: {
          some: {}
        }
      },
      select: {
        id: true,
        code: true,
        actionId: true,
        planId: true,
        indicatorVariables: {
          select: {
            id: true,
            code: true,
            indicatorData: {
              select: { id: true, status: true }
            }
          }
        }
      }
    });
    
    console.log('\nIndicadores de acciones con variables:');
    actionIndicatorsWithVariables.forEach(indicator => {
      const totalData = indicator.indicatorVariables.reduce((sum, v) => sum + v.indicatorData.length, 0);
      const pendingData = indicator.indicatorVariables.reduce((sum, v) => 
        sum + v.indicatorData.filter(d => d.status === 'PENDING').length, 0
      );
      console.log(`  - ${indicator.code}: ${indicator.indicatorVariables.length} variables, ${totalData} datos totales, ${pendingData} pendientes`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminActions();
