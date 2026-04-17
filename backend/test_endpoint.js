const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoint() {
  try {
    console.log('=== PROBANDO LÓGICA DEL ENDPOINT ===');
    
    // Simular la consulta del endpoint
    const data = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      include: {
        variable: {
          select: {
            id: true,
            code: true,
            name: true,
            fields: true,
            indicator: {
              select: {
                id: true,
                code: true,
                statement: true,
                planId: true,
                objectiveId: true,
                actionId: true,
                objective: {
                  select: {
                    id: true,
                    code: true,
                    statement: true,
                  },
                },
                action: {
                  select: {
                    id: true,
                    code: true,
                    statement: true,
                    objective: {
                      select: {
                        id: true,
                        code: true,
                        statement: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { costCenterCode: 'asc' }]
    });
    
    console.log('Datos obtenidos del endpoint:');
    data.forEach((record, i) => {
      console.log(`\n${i+1}. Variable: ${record.variable?.indicator?.code}`);
      console.log(`   - Plan ID: ${record.variable?.indicator?.planId}`);
      console.log(`   - Objective ID (directo): ${record.variable?.indicator?.objectiveId}`);
      console.log(`   - Action ID: ${record.variable?.indicator?.actionId}`);
      console.log(`   - Objective (desde indicator):`, record.variable?.indicator?.objective?.code || 'NULL');
      console.log(`   - Action:`, record.variable?.indicator?.action?.code || 'NULL');
      console.log(`   - Objective (desde action):`, record.variable?.indicator?.action?.objective?.code || 'NULL');
      console.log(`   - Centro de costo:`, record.costCenter?.code || 'NULL');
      
      // Simular la lógica del frontend
      const objective = record.variable?.indicator?.objective || record.variable?.indicator?.action?.objective;
      console.log(`   - Objective resuelto:`, objective?.code || 'NULL - ESTE REGISTRO SE FILTRARÍA');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoint();
