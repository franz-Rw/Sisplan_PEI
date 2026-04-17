const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCompleteProject() {
  try {
    console.log('=== DEBUG COMPLETO DEL PROYECTO ===');
    
    // 1. Verificar estado de la base de datos
    console.log('\n1. ESTADO GENERAL DE LA BASE DE DATOS:');
    
    const totalUsers = await prisma.user.count();
    const totalPlans = await prisma.strategicPlan.count();
    const totalObjectives = await prisma.strategicObjective.count();
    const totalActions = await prisma.strategicAction.count();
    const totalIndicators = await prisma.indicator.count();
    const totalVariables = await prisma.indicatorVariable.count();
    const totalData = await prisma.indicatorData.count();
    
    console.log(`- Usuarios: ${totalUsers}`);
    console.log(`- Planes: ${totalPlans}`);
    console.log(`- Objetivos: ${totalObjectives}`);
    console.log(`- Acciones: ${totalActions}`);
    console.log(`- Indicadores: ${totalIndicators}`);
    console.log(`- Variables: ${totalVariables}`);
    console.log(`- Datos de indicadores: ${totalData}`);
    
    // 2. Verificar usuarios y roles
    console.log('\n2. USUARIOS Y ROLES:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Centro: ${user.costCenter?.code || 'SIN ASIGNAR'}`);
    });
    
    // 3. Verificar planes activos
    console.log('\n3. PLANES ACTIVOS:');
    const plans = await prisma.strategicPlan.findMany({
      select: { id: true, name: true, startYear: true, endYear: true },
      orderBy: { startYear: 'desc' }
    });
    
    plans.forEach(plan => {
      console.log(`- ${plan.id}: ${plan.name} (${plan.startYear}-${plan.endYear})`);
    });
    
    const activePlan = plans[0];
    if (!activePlan) {
      console.log('ERROR: No hay planes activos');
      return;
    }
    
    console.log(`\nPlan activo seleccionado: ${activePlan.id}`);
    
    // 4. Verificar objetivos del plan activo
    console.log('\n4. OBJETIVOS DEL PLAN ACTIVO:');
    const objectives = await prisma.strategicObjective.findMany({
      where: { planId: activePlan.id },
      select: {
        id: true,
        code: true,
        statement: true,
        indicators: {
          select: {
            id: true,
            code: true,
            responsibleId: true,
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
        }
      }
    });
    
    objectives.forEach(objective => {
      const totalIndicators = objective.indicators.length;
      const totalVariables = objective.indicators.reduce((sum, i) => sum + i.indicatorVariables.length, 0);
      const totalData = objective.indicators.reduce((sum, i) => 
        sum + i.indicatorVariables.reduce((sum2, v) => sum2 + v.indicatorData.length, 0), 0);
      console.log(`- ${objective.code}: ${totalIndicators} indicadores, ${totalVariables} variables, ${totalData} datos`);
    });
    
    // 5. Verificar acciones del plan activo
    console.log('\n5. ACCIONES DEL PLAN ACTIVO:');
    const actions = await prisma.strategicAction.findMany({
      where: { planId: activePlan.id },
      select: {
        id: true,
        code: true,
        statement: true,
        objectiveId: true,
        indicators: {
          select: {
            id: true,
            code: true,
            responsibleId: true,
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
        }
      }
    });
    
    actions.forEach(action => {
      const totalIndicators = action.indicators.length;
      const totalVariables = action.indicators.reduce((sum, i) => sum + i.indicatorVariables.length, 0);
      const totalData = action.indicators.reduce((sum, i) => 
        sum + i.indicatorVariables.reduce((sum2, v) => sum2 + v.indicatorData.length, 0), 0);
      console.log(`- ${action.code}: ${totalIndicators} indicadores, ${totalVariables} variables, ${totalData} datos`);
    });
    
    // 6. Verificar datos por estado
    console.log('\n6. DATOS POR ESTADO:');
    const dataByStatus = await prisma.indicatorData.groupBy({
      by: ['status'],
      _count: true
    });
    
    dataByStatus.forEach(group => {
      console.log(`- ${group.status}: ${group._count} registros`);
    });
    
    // 7. Verificar datos del operador específico
    console.log('\n7. DATOS DEL OPERADOR ESPECÍFICO:');
    const operatorEmail = 'riesgos@sisplan.pe';
    const operator = users.find(u => u.email === operatorEmail);
    
    if (!operator) {
      console.log('ERROR: Operador no encontrado');
      return;
    }
    
    const operatorData = await prisma.indicatorData.findMany({
      where: {
        costCenterId: operator.costCenter?.id
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
    
    console.log(`Total de datos del operador: ${operatorData.length}`);
    
    const operatorDataByType = operatorData.reduce((acc, record) => {
      const type = record.variable.indicator.actionId ? 'acción' : 'objetivo';
      if (!acc[type]) acc[type] = [];
      acc[type].push(record);
      return acc;
    }, {});
    
    console.log(`Datos de objetivos: ${operatorDataByType['objetivo']?.length || 0}`);
    console.log(`Datos de acciones: ${operatorDataByType['acción']?.length || 0}`);
    
    // 8. Verificar indicadores asignados al operador
    console.log('\n8. INDICADORES ASIGNADOS AL OPERADOR:');
    const operatorIndicators = await prisma.indicator.findMany({
      where: {
        responsibleId: operator.costCenter?.id
      },
      select: {
        id: true,
        code: true,
        actionId: true,
        objectiveId: true,
        indicatorVariables: {
          select: {
            id: true,
            code: true,
            indicatorData: {
              where: { costCenterId: operator.costCenter?.id },
              select: { id: true, status: true }
            }
          }
        }
      }
    });
    
    const objectiveIndicators = operatorIndicators.filter(i => !i.actionId);
    const actionIndicators = operatorIndicators.filter(i => i.actionId);
    
    console.log(`Indicadores de objetivos asignados: ${objectiveIndicators.length}`);
    objectiveIndicators.forEach(indicator => {
      const totalData = indicator.indicatorVariables.reduce((sum, v) => sum + v.indicatorData.length, 0);
      console.log(`  - ${indicator.code}: ${totalData} datos`);
    });
    
    console.log(`Indicadores de acciones asignados: ${actionIndicators.length}`);
    actionIndicators.forEach(indicator => {
      const totalData = indicator.indicatorVariables.reduce((sum, v) => sum + v.indicatorData.length, 0);
      console.log(`  - ${indicator.code}: ${totalData} datos`);
    });
    
    // 9. Verificar estructura de navegación del frontend
    console.log('\n9. ANÁLISIS DE NAVEGACIÓN:');
    console.log('El operador debería ver:');
    console.log(`- Pestaña Objetivos: ${objectiveIndicators.length} indicadores disponibles`);
    console.log(`- Pestaña Acciones: ${actionIndicators.length} indicadores disponibles`);
    console.log(`- Datos pendientes de objetivos: ${operatorDataByType['objetivo']?.filter(d => d.status === 'PENDING').length || 0}`);
    console.log(`- Datos pendientes de acciones: ${operatorDataByType['acción']?.filter(d => d.status === 'PENDING').length || 0}`);
    
    // 10. Diagnóstico final
    console.log('\n10. DIAGNÓSTICO FINAL:');
    if (objectiveIndicators.length === 0 && actionIndicators.length === 0) {
      console.log('PROBLEMA: El operador no tiene indicadores asignados');
    } else if (operatorData.length === 0) {
      console.log('PROBLEMA: El operador no tiene datos registrados');
    } else if (actionIndicators.length > 0) {
      console.log('El operador SÍ tiene indicadores de acciones asignados');
      console.log('El problema debe estar en el frontend o en la lógica de filtrado');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompleteProject();
