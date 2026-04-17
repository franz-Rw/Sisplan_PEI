const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== VERIFICANDO DATOS EN BASE DE DATOS ===');
    
    const pendingCount = await prisma.indicatorData.count({
      where: { status: 'PENDING' }
    });
    console.log('Registros PENDIENTES:', pendingCount);
    
    const totalCount = await prisma.indicatorData.count();
    console.log('Total de registros:', totalCount);
    
    const pendingRecords = await prisma.indicatorData.findMany({
      where: { status: 'PENDING' },
      take: 3,
      include: {
        variable: {
          include: {
            indicator: {
              include: {
                objective: true,
                action: {
                  include: {
                    objective: true
                  }
                }
              }
            }
          }
        },
        costCenter: true
      }
    });
    
    console.log('\nPrimeros 3 registros pendientes:');
    pendingRecords.forEach((record, i) => {
      console.log(`${i+1}. ID: ${record.id}`);
      console.log(`   Variable: ${record.variable?.indicator?.code || 'SIN INDICADOR'}`);
      console.log(`   Variable Code: ${record.variable?.code || 'SIN CODIGO'}`);
      console.log(`   Centro de costo: ${record.costCenter?.code || 'SIN CENTRO'}`);
      console.log(`   Estado: ${record.status}`);
      console.log(`   Creado por: ${record.createdBy}`);
      console.log(`   Plan ID: ${record.variable?.indicator?.planId || 'SIN PLAN'}`);
      console.log(`   Objective ID: ${record.variable?.indicator?.objectiveId || 'SIN OBJECTIVE'}`);
      console.log(`   Action ID: ${record.variable?.indicator?.actionId || 'SIN ACTION'}`);
      console.log('---');
    });
    
    // Verificar planes disponibles
    const plans = await prisma.strategicPlan.findMany({
      select: { id: true, name: true }
    });
    console.log('\nPlanes disponibles:');
    plans.forEach(plan => {
      console.log(`- ${plan.id}: ${plan.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
