const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActionIndicators() {
  try {
    console.log('=== VERIFICANDO INDICADORES DE ACCIONES ===');
    
    // Verificar indicadores que tienen actionId
    const actionIndicators = await prisma.indicator.findMany({
      where: { actionId: { not: null } },
      select: {
        id: true,
        code: true,
        statement: true,
        actionId: true,
        objectiveId: true,
        action: {
          select: { id: true, code: true, statement: true }
        },
        indicatorVariables: {
          select: { id: true, code: true, name: true }
        }
      }
    });
    
    console.log('Indicadores de acciones encontrados:');
    actionIndicators.forEach(indicator => {
      console.log(`- ${indicator.code}: ${indicator.statement}`);
      console.log(`  - actionId: ${indicator.actionId}`);
      console.log(`  - objectiveId: ${indicator.objectiveId || 'NULL'}`);
      console.log(`  - action: ${indicator.action?.code || 'NULL'} - ${indicator.action?.statement || 'NULL'}`);
      console.log(`  - variables: ${indicator.indicatorVariables.length}`);
    });
    
    // Verificar si hay datos pendientes para estos indicadores
    const actionIndicatorIds = actionIndicators.map(i => i.id);
    
    if (actionIndicatorIds.length > 0) {
      const pendingActionData = await prisma.indicatorData.findMany({
        where: {
          status: 'PENDING',
          variable: {
            indicatorId: { in: actionIndicatorIds }
          }
        },
        select: {
          id: true,
          variableId: true,
          status: true,
          variable: {
            select: {
              code: true,
              name: true,
              indicator: {
                select: {
                  code: true,
                  actionId: true
                }
              }
            }
          }
        }
      });
      
      console.log(`\nDatos pendientes para indicadores de acciones: ${pendingActionData.length}`);
      pendingActionData.forEach(data => {
        console.log(`- ${data.variable?.code}: ${data.variable?.name}`);
        console.log(`  - indicator: ${data.variable?.indicator?.code}`);
        console.log(`  - actionId: ${data.variable?.indicator?.actionId}`);
      });
    } else {
      console.log('\nNo hay indicadores de acciones en la base de datos');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActionIndicators();
