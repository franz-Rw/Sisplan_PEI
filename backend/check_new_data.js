const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewData() {
  try {
    console.log('=== VERIFICANDO DATOS RECIENTES ===');
    
    // Verificar todos los datos recientes (últimos 10 registros)
    const recentData = await prisma.indicatorData.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        year: true,
        createdAt: true,
        createdBy: true,
        variable: {
          select: {
            code: true,
            name: true,
            indicator: {
              select: {
                code: true,
                actionId: true,
                objectiveId: true
              }
            }
          }
        },
        costCenter: {
          select: { code: true, description: true }
        }
      }
    });
    
    console.log('Datos recientes:');
    recentData.forEach(record => {
      console.log(`- ${record.variable?.code}: ${record.status}`);
      console.log(`  - Variable: ${record.variable?.name}`);
      console.log(`  - Indicator: ${record.variable?.indicator?.code}`);
      console.log(`  - ActionId: ${record.variable?.indicator?.actionId || 'NULL'}`);
      console.log(`  - ObjectiveId: ${record.variable?.indicator?.objectiveId || 'NULL'}`);
      console.log(`  - Centro: ${record.costCenter?.code || 'NULL'}`);
      console.log(`  - Creado: ${record.createdAt}`);
      console.log(`  - Por: ${record.createdBy}`);
      console.log('');
    });
    
    // Verificar específicamente datos pendientes de acciones
    const pendingActionData = await prisma.indicatorData.findMany({
      where: {
        status: 'PENDING',
        variable: {
          indicator: {
            actionId: { not: null }
          }
        }
      },
      select: {
        id: true,
        status: true,
        variable: {
          select: {
            code: true,
            indicator: {
              select: {
                code: true,
                actionId: true
              }
            }
          }
        },
        costCenter: {
          select: { code: true, description: true }
        }
      }
    });
    
    console.log(`\nDatos PENDIENTES de acciones: ${pendingActionData.length}`);
    pendingActionData.forEach(record => {
      console.log(`- ${record.variable?.code} (${record.variable?.indicator?.code})`);
      console.log(`  - Centro: ${record.costCenter?.code || 'NULL'}`);
      console.log(`  - Estado: ${record.status}`);
    });
    
    // Verificar datos pendientes de objetivos
    const pendingObjectiveData = await prisma.indicatorData.findMany({
      where: {
        status: 'PENDING',
        variable: {
          indicator: {
            actionId: null,
            objectiveId: { not: null }
          }
        }
      },
      select: {
        id: true,
        status: true,
        variable: {
          select: {
            code: true,
            indicator: {
              select: {
                code: true,
                objectiveId: true
              }
            }
          }
        },
        costCenter: {
          select: { code: true, description: true }
        }
      }
    });
    
    console.log(`\nDatos PENDIENTES de objetivos: ${pendingObjectiveData.length}`);
    pendingObjectiveData.forEach(record => {
      console.log(`- ${record.variable?.code} (${record.variable?.indicator?.code})`);
      console.log(`  - Centro: ${record.costCenter?.code || 'NULL'}`);
      console.log(`  - Estado: ${record.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewData();
