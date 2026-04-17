const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOperatorFlow() {
  try {
    console.log('=== DEBUG: FLUJO COMPLETO OPERADOR ===');
    
    // 1. Verificar usuario operador y su centro de costo
    const operatorEmail = 'riesgos@sisplan.pe';
    const operator = await prisma.user.findUnique({
      where: { email: operatorEmail },
      select: {
        id: true,
        email: true,
        role: true,
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    console.log('\n1. USUARIO OPERADOR:');
    console.log(`- Email: ${operator?.email}`);
    console.log(`- Rol: ${operator?.role}`);
    console.log(`- Centro de Costo ID: ${operator?.costCenter?.id}`);
    console.log(`- Centro de Costo: ${operator?.costCenter?.code} - ${operator?.costCenter?.description}`);
    
    const userCostCenterId = operator?.costCenter?.id;
    
    if (!userCostCenterId) {
      console.log('ERROR: El operador no tiene centro de costo asignado');
      return;
    }
    
    // 2. Verificar planes disponibles
    const plans = await prisma.strategicPlan.findMany({
      select: { id: true, name: true, startYear: true, endYear: true }
    });
    
    console.log('\n2. PLANES DISPONIBLES:');
    plans.forEach(plan => {
      console.log(`- ${plan.id}: ${plan.name} (${plan.startYear}-${plan.endYear})`);
    });
    
    const selectedPlan = plans[0]; // Simular selección del primer plan
    console.log(`\nPlan seleccionado: ${selectedPlan.id}`);
    
    // 3. Verificar objetivos del plan y sus indicadores
    const objectives = await prisma.strategicObjective.findMany({
      where: { planId: selectedPlan.id },
      select: {
        id: true,
        code: true,
        statement: true,
        indicators: {
          select: {
            id: true,
            code: true,
            statement: true,
            responsibleId: true,
            indicatorVariables: {
              select: {
                id: true,
                code: true,
                name: true,
                indicatorData: {
                  select: { id: true, status: true }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('\n3. OBJETIVOS ESTRATÉGICOS:');
    objectives.forEach(objective => {
      const operatorIndicators = objective.indicators.filter(i => i.responsibleId === userCostCenterId);
      console.log(`\n- ${objective.code}: ${objective.statement}`);
      console.log(`  Indicadores totales: ${objective.indicators.length}`);
      console.log(`  Indicadores del operador: ${operatorIndicators.length}`);
      
      operatorIndicators.forEach(indicator => {
        const totalVariables = indicator.indicatorVariables.length;
        const totalData = indicator.indicatorVariables.reduce((sum, v) => sum + v.indicatorData.length, 0);
        console.log(`    * ${indicator.code}: ${totalVariables} variables, ${totalData} datos`);
      });
    });
    
    // 4. Verificar acciones del plan y sus indicadores
    const actions = await prisma.strategicAction.findMany({
      where: { planId: selectedPlan.id },
      select: {
        id: true,
        code: true,
        statement: true,
        objectiveId: true,
        indicators: {
          select: {
            id: true,
            code: true,
            statement: true,
            responsibleId: true,
            indicatorVariables: {
              select: {
                id: true,
                code: true,
                name: true,
                indicatorData: {
                  select: { id: true, status: true }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('\n4. ACCIONES ESTRATÉGICAS:');
    actions.forEach(action => {
      const operatorIndicators = action.indicators.filter(i => i.responsibleId === userCostCenterId);
      console.log(`\n- ${action.code}: ${action.statement}`);
      console.log(`  Indicadores totales: ${action.indicators.length}`);
      console.log(`  Indicadores del operador: ${operatorIndicators.length}`);
      
      operatorIndicators.forEach(indicator => {
        const totalVariables = indicator.indicatorVariables.length;
        const totalData = indicator.indicatorVariables.reduce((sum, v) => sum + v.indicatorData.length, 0);
        console.log(`    * ${indicator.code}: ${totalVariables} variables, ${totalData} datos`);
      });
    });
    
    // 5. Verificar todos los datos del operador
    const operatorData = await prisma.indicatorData.findMany({
      where: {
        costCenterId: userCostCenterId
      },
      select: {
        id: true,
        status: true,
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
                actionId: true,
                objectiveId: true,
                responsibleId: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n5. DATOS DEL OPERADOR:');
    console.log(`Total de registros: ${operatorData.length}`);
    
    const groupedData = operatorData.reduce((acc, record) => {
      const type = record.variable.indicator.actionId ? 'acción' : 'objetivo';
      if (!acc[type]) acc[type] = [];
      acc[type].push(record);
      return acc;
    }, {});
    
    console.log(`\nDatos de objetivos: ${groupedData['objetivo']?.length || 0}`);
    groupedData['objetivo']?.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.status} (${record.year})`);
    });
    
    console.log(`\nDatos de acciones: ${groupedData['acción']?.length || 0}`);
    groupedData['acción']?.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.status} (${record.year})`);
    });
    
    // 6. Verificar datos pendientes por tipo
    const pendingData = operatorData.filter(record => record.status === 'PENDING');
    const pendingObjectives = pendingData.filter(record => !record.variable.indicator.actionId);
    const pendingActions = pendingData.filter(record => record.variable.indicator.actionId);
    
    console.log('\n6. DATOS PENDIENTES:');
    console.log(`Total pendientes: ${pendingData.length}`);
    console.log(`Pendientes de objetivos: ${pendingObjectives.length}`);
    console.log(`Pendientes de acciones: ${pendingActions.length}`);
    
    // 7. Resumen del problema
    console.log('\n7. ANÁLISIS DEL PROBLEMA:');
    console.log(`- El operador tiene centro de costo: ${userCostCenterId}`);
    console.log(`- Indicadores de objetivos asignados al operador: ${objectives.reduce((sum, obj) => sum + obj.indicators.filter(i => i.responsibleId === userCostCenterId).length, 0)}`);
    console.log(`- Indicadores de acciones asignados al operador: ${actions.reduce((sum, act) => sum + act.indicators.filter(i => i.responsibleId === userCostCenterId).length, 0)}`);
    console.log(`- Datos pendientes de objetivos: ${pendingObjectives.length}`);
    console.log(`- Datos pendientes de acciones: ${pendingActions.length}`);
    
    if (pendingActions.length > 0) {
      console.log('\n¡HAY DATOS PENDIENTES DE ACCIONES! Deberían verse en la pestaña de Variables de Acciones Estratégicas.');
    } else {
      console.log('\nNo hay datos pendientes de acciones. Esto podría explicar por qué la pestaña aparece vacía.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOperatorFlow();
