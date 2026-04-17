const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAdminComplete() {
  try {
    console.log('=== DEBUG COMPLETO - ROL ADMINISTRADOR ===');
    
    // 1. Verificar usuarios administradores
    console.log('\n1. USUARIOS ADMINISTRADORES:');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        costCenter: {
          select: { id: true, code: true, description: true }
        }
      }
    });
    
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role}) - Centro: ${admin.costCenter?.code || 'SIN ASIGNAR'}`);
    });
    
    // 2. Verificar todos los datos pendientes en la BD
    console.log('\n2. TODOS LOS DATOS PENDIENTES EN BD:');
    const allPendingData = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        status: true,
        year: true,
        createdAt: true,
        costCenterId: true,
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
                planId: true,
                responsibleId: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Total de datos pendientes: ${allPendingData.length}`);
    
    // 3. Agrupar datos pendientes por tipo
    const pendingByType = allPendingData.reduce((acc, record) => {
      const type = record.variable.indicator.actionId ? 'acción' : 'objetivo';
      if (!acc[type]) acc[type] = [];
      acc[type].push(record);
      return acc;
    }, {});
    
    console.log(`\nDatos pendientes de objetivos: ${pendingByType['objetivo']?.length || 0}`);
    pendingByType['objetivo']?.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.status} (${record.year}) - Centro: ${record.costCenterId}`);
    });
    
    console.log(`\nDatos pendientes de acciones: ${pendingByType['acción']?.length || 0}`);
    pendingByType['acción']?.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.status} (${record.year}) - Centro: ${record.costCenterId}`);
    });
    
    // 4. Verificar planes disponibles
    console.log('\n3. PLANES DISPONIBLES:');
    const plans = await prisma.strategicPlan.findMany({
      select: { id: true, name: true, startYear: true, endYear: true }
    });
    
    plans.forEach(plan => {
      console.log(`- ${plan.id}: ${plan.name} (${plan.startYear}-${plan.endYear})`);
    });
    
    // 5. Simular lo que el administrador debería ver
    console.log('\n4. SIMULACIÓN DE VISTA DEL ADMINISTRADOR:');
    const activePlan = plans[0];
    if (!activePlan) {
      console.log('ERROR: No hay planes activos');
      return;
    }
    
    console.log(`Plan activo: ${activePlan.id}`);
    
    // 5.1. Datos pendientes de objetivos para el plan activo
    const pendingObjectives = allPendingData.filter(record => {
      const indicator = record.variable?.indicator;
      return indicator && !indicator.actionId && indicator.planId === activePlan.id;
    });
    
    console.log(`\nVariables de Objetivos Estratégicos pendientes: ${pendingObjectives.length}`);
    pendingObjectives.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.variable.name}`);
    });
    
    // 5.2. Datos pendientes de acciones para el plan activo
    const pendingActions = allPendingData.filter(record => {
      const indicator = record.variable?.indicator;
      return indicator && indicator.actionId && indicator.planId === activePlan.id;
    });
    
    console.log(`\nVariables de Acciones Estratégicas pendientes: ${pendingActions.length}`);
    pendingActions.forEach(record => {
      console.log(`  - ${record.variable.code}: ${record.variable.name}`);
    });
    
    // 6. Verificar endpoints del administrador
    console.log('\n5. VERIFICACIÓN DE ENDPOINTS:');
    console.log('Endpoint que debería usar el admin:');
    console.log('GET /api/indicator-data/all?status=pending');
    console.log('Luego filtrar por plan y tipo (objetivo/acción)');
    
    // 7. Verificar si hay problemas con los indicadores
    console.log('\n6. VERIFICACIÓN DE INDICADORES:');
    const indicatorsWithIssues = await prisma.indicator.findMany({
      where: {
        OR: [
          { planId: null },
          { responsibleId: null }
        ]
      },
      select: {
        id: true,
        code: true,
        planId: true,
        responsibleId: true,
        actionId: true,
        objectiveId: true
      }
    });
    
    console.log(`Indicadores con problemas (planId o responsibleId nulo): ${indicatorsWithIssues.length}`);
    indicatorsWithIssues.forEach(indicator => {
      console.log(`  - ${indicator.code}: planId=${indicator.planId}, responsibleId=${indicator.responsibleId}`);
    });
    
    // 8. Diagnóstico final
    console.log('\n7. DIAGNÓSTICO FINAL:');
    if (allPendingData.length === 0) {
      console.log('❌ NO hay datos pendientes en la base de datos');
    } else {
      console.log('✅ SI hay datos pendientes en la base de datos');
      console.log(`   - Objetivos: ${pendingByType['objetivo']?.length || 0}`);
      console.log(`   - Acciones: ${pendingByType['acción']?.length || 0}`);
    }
    
    if (pendingObjectives.length === 0 && pendingActions.length === 0) {
      console.log('❌ NO hay datos pendientes para el plan activo');
    } else {
      console.log('✅ SI hay datos pendientes para el plan activo');
      console.log('   El problema debe estar en el frontend del administrador');
    }
    
    console.log('\nPróximos pasos a verificar:');
    console.log('1. ¿El administrador está seleccionando automáticamente el plan?');
    console.log('2. ¿El endpoint /api/indicator-data/all?status=pending funciona?');
    console.log('3. ¿El frontend está filtrando correctamente por plan y tipo?');
    console.log('4. ¿Hay errores de consola en el frontend del admin?');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminComplete();
